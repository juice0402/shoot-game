"""はじめからの遊び方をまねるボット（issue #15）
使い方: python3 tools/test/career15.py   環境変数 SEEDS=3  RUNS=14  FIRST=8（はじめの1出撃だけをくり返す回数）  JOBS=3
- 新しいセーブ（レーザー1つ）から、スタンダードの機首にレーザーをつけてステージ1へ。動きとレベルアップは bot14.py のボット
- 出撃のあと：解放ずみで持っていない品を安い順に買い（攻撃を先に・武器は3つまで・空いている場所の数まで）、空いている場所につける。研究所と機体は買わない
- ステージ：いちばん先の解放ずみのステージ。2回続けてクリアできなかったら1つ前へもどる
- 結果：1出撃ごとのステージ・クリア・生きのびた時間・倒した数・かせいだG・解放された品と、解放ずみの数。はじめての「ステージ3クリア」のときの解放ずみの数
- FIRST：新しいセーブのはじめの1出撃（レーザー1つ）だけを何回か（生きのびた時間・倒した数・かせいだG・解放の数）。くらべるために前の版のはじめ（レーザー2つ）も
"""
import os, sys, json, time
from multiprocessing import get_context
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import harness14
from harness14 import write_build, open_page
from bot14 import BOT

harness14.EXPOSE = harness14.EXPOSE.replace("keys,", "keys,isUnl,syncUnl,modProg,tutStep,")

PLAY = r"""
(seed)=>{const T=window.__T,R=T.R;window.__seed(seed);const cap=(R.stg===5?540:300)*60+600;
  const pick=()=>{if(T.lvChoices){const c=T.lvChoices.filter(o=>!o.used);
      let o=c.find(q=>q.evo)||(Math.random()<0.6&&c.find(q=>q.cat==='w'))||c.filter(q=>q.cat!=='x')[(Math.random()*c.length)|0]||c[0];T.pickChoice(o);}
    else{const b=document.querySelector('#overlay .btnrow .go');if(b){b.disabled=false;b.click();}}};
  for(let i=0;i<cap&&R.state!=='over';i++){if(R.state==='lvup'){pick();continue;}window.__bot(R,T.GW,T.GH,T.U);T.update(1/60);if(i%30===0){T.draw();T.hud();}}
  const ov=document.getElementById('overlay');let txt=ov.textContent;if(ov.querySelector('.endt')){ov.querySelector('.go').click();txt=ov.textContent;}
  const g=txt.match(/かせいだお金\+(\d+)G/),unl=[...ov.querySelectorAll('.unll li:not(.ship)')].map(li=>li.textContent.replace('解放：',''));
  return {stg:R.stg,clear:/クリア！/.test(txt),t:Math.round(R.t),kills:R.kills,gold:g?+g[1]:-1,lv:R.lv,bosses:R.bossKills,unl,timeout:R.state!=='over'};}
"""

# 新しいセーブで格納庫へ（はじめの案内のとおり、機首にレーザー）
START = r"""
(two)=>{const T=window.__T;window.__HOLD=1;localStorage.removeItem(T.KEY);T.save=T.loadSave();const s=T.save;s.howto=1;
  if(two){s.owned.laser=2;}T.setShip('standard');const L=s.ships.standard.eq;L[0]={t:'laser',d:0};if(two)L[1]={t:'laser',d:0};T.setShip('standard');
  s.tut=1;T.persist();return T.TYPES.filter(t=>T.isUnl(t)).length;}
"""

# 出撃のあと：買い物とステージえらび。返り値は解放ずみの数・持ち物
SHOP = r"""
(fails)=>{const T=window.__T,s=T.save,sl=T.SHIPS.standard.slots,L=s.ships.standard.eq;
  const out=t=>T.MODS[t].melee||['shield','sword','reflector','armor'].includes(t);
  const want=T.TYPES.filter(t=>T.isUnl(t)&&s.owned[t]===0).sort((a,b)=>(T.MODS[a].cat==='atk'?0:1)-(T.MODS[b].cat==='atk'?0:1)||T.MODS[a].price-T.MODS[b].price);
  const bought=[];for(const t of want){const i=L.findIndex(v=>!v);if(i<0)break;if(s.gold<T.MODS[t].price)break;
    if(T.MODS[t].cat==='atk'&&L.filter(v=>v&&T.MODS[v.t].cat==='atk').length>=3)continue;/* 武器は3つまで（レベルが分かれすぎないように）。のこりは防御・補助 */
    s.gold-=T.MODS[t].price;s.owned[t]++;L[i]={t,d:out(t)?sl[i].out:0};bought.push(t);}
  let st=1;for(let n=1;n<=5;n++)if(T.stOpen(n))st=n;if(fails>=2&&st>1)st--;s.st=st;T.setShip('standard');T.persist();
  return {nunl:T.TYPES.filter(t=>T.isUnl(t)).length,bought,st,have:s.gold};}
"""


def go(pg, seed):
    pg.evaluate("()=>{const T=window.__T;T.startRun();}")
    return pg.evaluate(PLAY, seed)


def worker(job):
    from playwright.sync_api import sync_playwright
    kind, seed, runs = job
    errs, out = [], []
    pp = write_build(seed=True)
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = open_page(b, pp, 390, 844, errs)
        pg.evaluate(BOT)
        pg.click('#startBtn'); pg.wait_for_timeout(150)
        if kind in ('first', 'first2'):
            u0 = pg.evaluate(START, kind == 'first2')
            r = go(pg, seed)
            r['u0'] = u0
            out.append(r)
        else:
            u0 = pg.evaluate(START, False)
            fails = 0
            for k in range(runs):
                r = go(pg, seed * 100 + k)
                pg.evaluate("()=>{const b=document.querySelector('#overlay .btnrow .go');if(b)b.click();}")
                fails = 0 if r['clear'] else fails + 1
                sh = pg.evaluate(SHOP, fails)
                if sh['st'] != r['stg'] and fails >= 2:
                    fails = 0
                r.update(sh)
                r['k'] = k + 1
                out.append(r)
                print(seed, json.dumps(r, ensure_ascii=False), flush=True)
                if r['stg'] == 3 and r['clear']:
                    break
        b.close()
    return kind, seed, out, errs


def main():
    seeds = int(os.environ.get('SEEDS', '3'))
    runs = int(os.environ.get('RUNS', '14'))
    first = int(os.environ.get('FIRST', '8'))
    jobsn = int(os.environ.get('JOBS', '3'))
    jobs = [('career', 11 + i, runs) for i in range(seeds)] + [('first', 101 + i, 1) for i in range(first)] + [('first2', 101 + i, 1) for i in range(first)]
    t0 = time.time()
    with get_context('spawn').Pool(jobsn) as pool:
        res = pool.map(worker, jobs, chunksize=1)
    errs = [e for *_, es in res for e in es]
    print('かかった時間 %ds' % (time.time() - t0))
    for kind in ('first', 'first2'):
        rs = [o[0] for k, _, o, _ in res if k == kind]
        if not rs:
            continue
        avg = lambda key: round(sum(r[key] for r in rs) / len(rs))
        print('\n%s（%d回）：クリア %d・生きのびた時間 平均 %d:%02d（最短 %d:%02d）・倒した数 %d・かせいだG %d・Lv %d・大型の敵 %.1f・解放 平均 %.1f こ（最少 %d）' % (
            'はじめの1出撃（レーザー1つ）' if kind == 'first' else 'くらべ：前の版のはじめ（レーザー2つ）', len(rs), sum(r['clear'] for r in rs),
            avg('t') // 60, avg('t') % 60, min(r['t'] for r in rs) // 60, min(r['t'] for r in rs) % 60, avg('kills'), avg('gold'), avg('lv'),
            sum(r['bosses'] for r in rs) / len(rs), sum(len(r['unl']) for r in rs) / len(rs), min(len(r['unl']) for r in rs)))
        for r in rs:
            print('  ', r['t'], r['kills'], r['gold'], 'Lv%d' % r['lv'], r['unl'])
    for k, seed, out, _ in res:
        if k != 'career':
            continue
        print('\nはじめから（seed %d）' % seed)
        for r in out:
            print('  %2d回目 ステージ%d %s %d:%02d %d体 %dG Lv%d → 解放ずみ %d こ（+%d：%s）買った %s' % (r['k'], r['stg'], 'クリア' if r['clear'] else '----', r['t'] // 60, r['t'] % 60, r['kills'], r['gold'],
                  r['lv'], r['nunl'], len(r['unl']), '・'.join(r['unl']), ','.join(r['bought'])))
    json.dump([[k, s, o] for k, s, o, _ in res], open(os.path.join(os.environ.get('OUT', '/tmp'), 'career15.json'), 'w'), ensure_ascii=False)
    for e in errs[:10]:
        print('ERR', e)
    print('エラー', len(errs))
    sys.exit(1 if errs else 0)


if __name__ == '__main__':
    main()
