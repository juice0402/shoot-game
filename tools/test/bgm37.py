"""BGM の点検（#37）
- 曲：SONGS をすべて読めるか（BGM.check）・場面の曲がそろっているか・2つの音色（chip・synth）で鳴らして、
  音がない／大きすぎる曲がないか（BGM.render：ずっと鳴らさずに音の大きさを測る）
- 場面：タイトル → 格納庫 → 出撃（ステージの曲）→ 大型の敵 → たおすともどる → 一時停止 → BGM OFF・ON →
  クリアのジングル → 格納庫の曲／撃墜のジングル／撤退は格納庫の曲／最終ボス
- ON・OFF：タイトルのボタン・セーブに残る・前のセーブ（snd だけ）は「音」と同じ
使い方：python3 tools/test/bgm37.py（--quick で場面だけ）
"""
import os, sys
from playwright.sync_api import sync_playwright
from harness14 import write_build, open_page

NEED = ['title', 'hangar', 'st1', 'st2', 'st3', 'st4', 'st5', 'boss', 'final', 'clear', 'over', 'ending']
GO = """()=>{window.__go=(n,id,list)=>{const T=window.__T;window.__HOLD=1;const s=T.save;s.howto=1;s.tut=1;s.rec.stageMax=n-1;s.st=n;
  T.ensureSlots(s);s.ships[id].have=true;T.setShip(id);const L=s.ships[id].eq;for(let i=0;i<L.length;i++)L[i]=null;
  list.forEach((t,i)=>{if(i<L.length){L[i]={t,d:0};s.owned[t]=9;}});T.setShip(id);T.startRun();const R=T.R;R.pending=0;R.chestQ=0;return R;};}"""


def main():
    quick = '--quick' in sys.argv
    fails = 0
    errs = []
    pp = write_build(os.environ['SRC']) if os.environ.get('SRC') else write_build()  # SRC＝ほかの index.html でためす
    with sync_playwright() as p:
        b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
        pg = open_page(b, pp, errs=errs)

        def ok(name, cond, info=''):
            nonlocal fails
            if not cond:
                fails += 1
            print(('OK  ' if cond else 'NG  ') + name + (('  ' + str(info)) if info not in ('', None) else ''))

        ev = lambda js: pg.evaluate(js)
        key = lambda: ev("()=>window.__T.BGM.key")
        e = ev("()=>window.__T.BGM.check()")
        ok('曲をすべて読める', not e, e)
        keys = ev("()=>Object.keys(window.__T.SONGS)")
        miss = [k for k in NEED if k not in keys]
        ok('場面の曲がそろっている', not miss, miss)
        if not quick:
            for st in ['chip', 'synth']:
                bad = []
                rows = []
                lv = []
                vol = ev("()=>window.__T.BGM_VOL")
                loops = [k for k in keys if ev("()=>window.__T.SONGS['%s'].loop!==false" % k)]
                for k in keys:
                    r = ev("async()=>{const T=window.__T,s=T.SONGS['%s'],L=s.chords.trim().split(/\\s+/).length*240/s.bpm;"
                           "return await T.BGM.render('%s',s.loop===false?L+2:Math.min(L,20)+0.5,'%s');}" % (k, k, st))
                    rows.append('%s %.2f/%.3f/%ss' % (k, r['peak'], r['rms'], r['loop']))
                    if r['rms'] < vol * 0.03 or r['peak'] > vol * 3:
                        bad.append(k)
                    if k in loops:
                        lv.append((r['rms'], k))
                print('    ' + st + '（大きさの山/平均/1回の長さ）：' + '・'.join(rows))
                ok(st + '：音がない・大きすぎる曲がない', not bad, bad)
                lv.sort()
                med = lv[len(lv) // 2][0]
                odd = [k for v, k in lv if v > med * 2.2 or v < med / 2.2]
                ok(st + '：曲ごとの大きさがそろっている（平均の中央の 1/2.2〜2.2 倍）', not odd, odd)

        # 場面
        ev("()=>{const T=window.__T;T.save=T.freshSave();T.save.howto=1;T.save.tut=1;T.ensureSlots(T.save);T.setShip(T.save.cur);T.showTitle();}")
        ev(GO)
        pg.mouse.click(5, 5)
        pg.wait_for_timeout(700)
        ok('タイトル：最初のタップで title', key() == 'title', key())
        ev("()=>window.__T.toHangarFromTitle()")
        pg.wait_for_timeout(300)
        ok('格納庫：hangar', key() == 'hangar', key())
        ev("()=>window.__go(1,'standard',['laser'])")
        pg.wait_for_timeout(300)
        ok('出撃：st1', key() == 'st1', key())
        ev("()=>window.__T.addBig('boss')")
        pg.wait_for_timeout(300)
        ok('大型の敵：boss', key() == 'boss', key())
        ev("()=>{const T=window.__T,e=T.R.E.find(o=>o.kind==='boss');T.hit(e,1e9,0,0);}")
        pg.wait_for_timeout(300)
        ok('たおすとステージの曲へ', key() == 'st1', key())
        ev("()=>window.__T.openPause()")
        pg.wait_for_timeout(200)
        ok('一時停止でも止めない（小さくする）', key() == 'st1', key())
        ev("()=>window.__T.resume()")
        ev("()=>{const T=window.__T;T.save.bgm=false;T.BGM.kick();}")
        pg.wait_for_timeout(300)
        ok('BGM OFF で止まる', key() is None, key())
        ev("()=>{const T=window.__T;T.save.bgm=true;T.BGM.kick();}")
        pg.wait_for_timeout(300)
        ok('BGM ON でもどる', key() == 'st1', key())
        ev("()=>window.__T.endRun(true)")
        pg.wait_for_timeout(300)
        ok('クリア：clear', key() == 'clear', key())
        L = ev("()=>{const s=window.__T.SONGS.clear;return s.chords.trim().split(/\\s+/).length*240/s.bpm;}")
        pg.wait_for_timeout(int(L * 1000) + 1500)
        ok('ジングルのあとは hangar', key() == 'hangar', key())
        ev("()=>window.__go(2,'standard',['laser'])")
        pg.wait_for_timeout(300)
        ok('ステージ2：st2', key() == 'st2', key())
        ev("()=>window.__T.endRun(false)")
        pg.wait_for_timeout(300)
        ok('撃墜：over', key() == 'over', key())
        ev("()=>window.__go(3,'standard',['laser'])")
        ev("()=>{window.__T.R.state='play';window.__T.openPause();}")
        d1 = ev("()=>window.__T.BGM.ducked")
        ev("()=>window.__T.endRun(false,true)")
        pg.wait_for_timeout(300)
        ok('一時停止から撤退：hangar・小さくしたのをもどす', key() == 'hangar' and d1 and not ev("()=>window.__T.BGM.ducked"), key())
        ev("()=>{window.__go(5,'standard',['laser']);window.__T.addBig('core');}")
        pg.wait_for_timeout(300)
        ok('最終ボス：final', key() == 'final', key())

        # ON・OFF とセーブ
        ev("()=>{window.__T.R=null;window.__T.showTitle();}")
        pg.wait_for_timeout(300)
        pg.click('#bgmBtn')
        pg.wait_for_timeout(300)
        t1 = pg.inner_text('#bgmBtn')
        ok('タイトルの BGM OFF', t1 == 'BGM OFF' and ev("()=>window.__T.save.bgm===false") and key() is None, (t1, key()))
        pg.click('#bgmBtn')
        pg.wait_for_timeout(300)
        ok('タイトルの BGM ON', pg.inner_text('#bgmBtn') == 'BGM ON' and key() == 'title', key())
        ok('SE のボタンは効果音だけ', pg.inner_text('#sndBtn') == 'SE ON')
        r = ev("()=>{const T=window.__T;T.save.bgm=false;T.persist();const a=T.loadSave().bgm;T.save.bgm=true;T.persist();const c=T.loadSave().bgm;"
               "const s=JSON.parse(localStorage.getItem(T.KEY));delete s.bgm;s.snd=false;localStorage.setItem(T.KEY,JSON.stringify(s));const o=T.loadSave();"
               "const old=T.save;T.save=o;const d=T.bgmOn();T.save=old;T.persist();return [a,c,o.bgm,d];}")
        ok('セーブに残る・前のセーブ（音 OFF）は BGM も OFF', r == [False, True, None, False], r)
        ok('エラーなし', not errs, errs[:3])
        b.close()
    print('NG', fails)
    sys.exit(1 if fails else 0)


if __name__ == '__main__':
    main()
