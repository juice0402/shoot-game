"""重さと起動の時間（issue #14）
使い方: python3 tools/test/perf14.py [くらべる index.html ...]
- 起動：ページを7回ひらき、スクリプトの始めから終わりまでの時間（中央値）。引数のファイルともくらべる
- いちばん重い場面：ステージ5・深淵の核と大蛇・敵280体・敵の弾320・レーザーの壁・武器10個を Lv8 と進化・支援を全部最大・研究所を最大。
  1フレーム（update＋draw）の中央値・95%・最大。95% が16ms をこえたら失敗
- 出撃の始め（残りの絵を作る flushLazy をふくむ）の時間
ほかのテストと同時に動かすと数字が大きくなる。1つだけで動かす
"""
import os, sys, statistics, tempfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness14 import build, write_build, open_page, SRC
from playwright.sync_api import sync_playwright


def boot_build(src):
    h = open(src, encoding='utf-8').read()
    i = h.index('<script>\n(()=>{') + len('<script>\n')
    h = h[:i] + 'window.__tA=performance.now();' + h[i:]
    j = h.rindex('})();\n</script>')
    h = h[:j] + 'window.__tB=performance.now();' + h[j:]
    d = tempfile.mkdtemp(); pp = os.path.join(d, 'b.html')
    open(pp, 'w', encoding='utf-8').write('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' + h + '</body></html>')
    return pp


HEAVY = r"""
()=>{const T=window.__T;window.__HOLD=1;const s=T.freshSave();T.save=s;s.howto=1;s.rec.stageMax=4;s.st=5;for(const o of T.LAB)s.lab[o.id]=o.max;T.ensureSlots(s);
  s.ships.carrier.have=true;T.setShip('carrier');const L=s.ships.carrier.eq;const W=['laser','missile','gatling','thunder','sword','mine','plasma','saw','cannon','flame','shield','gravity'];
  for(let i=0;i<L.length;i++){L[i]=W[i]?{t:W[i],d:i%8}:null;if(W[i])s.owned[W[i]]=9;}T.setShip('carrier');
  const a0=performance.now();T.startRun();const boot=performance.now()-a0;const R=T.R;R.pending=0;
  for(const m of R.mods)R.tlv[m.t]=T.WMAX;for(const t of Object.keys(T.EVO))if(R.tlv[t])R.evo[t]=true;for(const k in R.pas)R.pas[k]=T.PAS[k].max||5;
  for(const k in R.sup)for(let i=0;i<T.SUP[k].max;i++)T.supUp(k);T.calcCS();
  R.bossAt=[];R.t=305;const b=T.addBig('core');const sn=T.addBig('snake');
  const fill=()=>{while(R.E.length<280){const k=['bug','shard','warp','charger','frost','guard','splitter','hider','tank','shooter'][(Math.random()*10)|0];const a=Math.random()*6.28,d=110+Math.random()*260;T.addEnemy(k,R.x+Math.cos(a)*d,R.y+Math.sin(a)*d*0.9);}
    while(R.EB.length<320)R.EB.push({x:Math.random()*T.GW,y:Math.random()*T.GH*0.6,vx:(Math.random()-0.5)*60,vy:40+Math.random()*60,dmg:8,big:Math.random()<0.2,slow:Math.random()<0.2?1:0,dead:false});};
  const keep=()=>{R.hp=R.maxHp;b.hp=Math.max(b.hp,b.max*0.3);sn.hp=sn.max;if(R.state!=='play'){R.state='play';document.getElementById('overlay').hidden=true;R.pending=0;R.chestQ=0;}};
  for(let i=0;i<120;i++){fill();T.update(1/60);T.draw();keep();}
  T.addWall(true,120);T.addWall(false,300);
  const ts=[];for(let i=0;i<360;i++){fill();if(i%90===0)T.addWall(i%180===0,150+i%300);const a=performance.now();T.update(1/60);T.draw();ts.push(performance.now()-a);keep();}
  ts.sort((x,y)=>x-y);return {boot:+boot.toFixed(1),med:+ts[ts.length>>1].toFixed(2),p95:+ts[Math.floor(ts.length*0.95)].toFixed(2),max:+ts[ts.length-1].toFixed(2),E:R.E.length,EB:R.EB.length,B:R.B.length};}
"""


def boot_time(b, src, n=7):
    pp = boot_build(src); ts = []
    for _ in range(n):
        pg = b.new_page(viewport={'width': 390, 'height': 844})
        pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith('file:') else r.abort())
        pg.goto('file://' + pp); pg.wait_for_timeout(200)
        ts.append(pg.evaluate("window.__tB-window.__tA")); pg.close()
    return statistics.median(ts)


def main():
    others = sys.argv[1:]
    fails = 0
    with sync_playwright() as p:
        b = p.chromium.launch()
        for s in others:
            print('起動 %-40s %.0f ms' % (os.path.basename(os.path.dirname(os.path.abspath(s))) + '/' + os.path.basename(s), boot_time(b, s)))
        print('起動 %-40s %.0f ms' % ('いまの index.html', boot_time(b, SRC)))
        errs = []
        pg = open_page(b, write_build(seed=True), 390, 844, errs)
        pg.evaluate("()=>window.__seed(5)")
        r = pg.evaluate(HEAVY)
        print('いちばん重い場面（ms：中央値・95%・最大）', r)
        if r['p95'] > 16:
            fails += 1; print('NG 重さ')
        for e in errs[:5]:
            print('ERR', e)
        b.close()
    sys.exit(1 if fails or errs else 0)


if __name__ == '__main__':
    main()
