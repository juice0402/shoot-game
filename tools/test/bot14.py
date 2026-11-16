"""自動で遊ぶボット（issue #14）
使い方: python3 tools/test/bot14.py [--write]   環境変数 SHIPS=standard,rapid  STAGES=1,5  SEEDS=2  JOBS=2  MODE=start,strong
- 指の動きをまねる：この先0.7秒で近くを通る敵の弾・近い敵・レーザーの壁（予告から）から離れる。
  何もなければ近くの宝石を取りに行き、なければ画面の下の真ん中あたりをゆっくり左右に動く（R.target を毎フレーム決める）
- レベルアップ：進化 → 武器 → そのほか（特別な強化は少なめ）。宝箱は受け取る
- 12機 × 5ステージ × はじめの装備（start）・強い装備（strong：空きを強い武器でうめて研究所の火力・連射・補強を最大）
- HP はそのまま（へらない細工なし）。ステージ5は最終ボスをたおすまで（9:00 で打ち切り）
- 結果：クリア・残りHP・生きのびた時間・倒した数・かせいだG・Lv。--write で docs/test-report-6.md に表を書く
- エラー（pageerror・console.error）が1つでもあれば失敗
"""
import os, sys, json, time
from multiprocessing import get_context
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness14 import write_build, open_page, ROOT

RUN = r"""
([id,n,mode,seed])=>{const T=window.__T;window.__HOLD=1;window.__seed(seed);if(window.__HS)for(const k in window.__HS)delete window.__HS[k];
  const s=T.freshSave();T.save=s;s.howto=1;s.tut=1;s.rec.stageMax=n-1;s.st=n;s.ships[id].have=true;
  const strong=mode==='strong';
  if(strong){s.lab.r_pow=5;s.lab.r_rate=5;s.lab.r_hp=5;}
  T.ensureSlots(s);T.setShip(id);const L=s.ships[id].eq;const st=T.startLoad(id);for(let i=0;i<L.length;i++)L[i]=st[i]||null;{let n=2-L.filter(v=>v&&v.t==='laser').length;for(let i=0;i<L.length&&n>0;i++)if(!L[i]){L[i]={t:'laser',d:0};n--;}}/* はじめの装備：機体の装備＋はじめから持っているレーザー2つ */
  if(strong){const want=['laser','missile','gatling','thunder','sword','shield','mine','plasma','saw','cannon'];let k=0;
    for(let i=0;i<L.length;i++){if(L[i])continue;while(k<want.length&&L.some(v=>v&&v.t===want[k]))k++;if(k<want.length)L[i]={t:want[k++],d:0};}}
  for(const v of L)if(v)s.owned[v.t]=Math.max(s.owned[v.t],9);
  T.setShip(id);T.startRun();const R=T.R;const GW=T.GW;
  const cap=(n===5?540:300)*60+600;let picks=0,minHp=1,frames=0;
  const pick=()=>{if(T.lvChoices){const c=T.lvChoices.filter(o=>!o.used);
      let o=c.find(q=>q.evo)||(Math.random()<0.6&&c.find(q=>q.cat==='w'))||c.filter(q=>q.cat!=='x')[(Math.random()*c.length)|0]||c[0];
      T.pickChoice(o);picks++;}
    else{const b=document.querySelector('#overlay .btnrow .go');if(b){b.disabled=false;b.click();}}};
  for(let i=0;i<cap&&R.state!=='over';i++){
    if(R.state==='lvup'){pick();continue;}
    window.__bot(R,T.GW,T.GH,T.U);T.update(1/60);frames++;if(i%30===0){T.draw();T.hud();}
    if(R.state!=='over')minHp=Math.min(minHp,R.hp/R.maxHp);}
  const ov=document.getElementById('overlay');let txt=ov.textContent;const ending=!!ov.querySelector('.endt');/* エンディング（#16 で「おわり」に） */
  if(ending){ov.querySelector('.go').click();txt=ov.textContent;}
  const g=txt.match(/かせいだお金\+(\d+)G/);
  return {id,n,mode,seed,clear:/クリア！/.test(txt),ending,hp:Math.max(0,Math.round(R.hp/R.maxHp*100)),t:Math.round(R.t),kills:R.kills,gold:g?+g[1]:-1,lv:R.lv,
    picks,minHp:Math.round(minHp*100),bosses:R.bossKills,state:R.state,timeout:R.state!=='over',hs:window.__HS?Object.entries(window.__HS).map(([k,v])=>k+':'+Math.round(v)).join(' '):undefined};}
"""

# 指の動き：まわり48か所（3つの距離×16方向）と、いまの所を点数でくらべて、いちばん安全な所へ指を動かす
# 点数：そこへ動く道のとちゅうで、敵の弾（まっすぐ進む）・敵（こちらへ寄ってくる）に当たりそうなら大きく減点。レーザーの壁・画面のはしも減点。
# 着いた所のまわりの敵の多さは少し減点、真上に敵が並ぶ所（武器が当たる所）は少し加点。何もなければ近くの宝石と、下の真ん中へ
BOT = r"""
()=>{const C=[[0,0]];for(const r of [30,70,130])for(let i=0;i<16;i++){const a=(i+(r===70?0.5:0))/16*Math.PI*2;C.push([Math.cos(a)*r,Math.sin(a)*r]);}
 const FR=[0.25,0.5,0.75,1,1.6];
 window.__BP=Object.assign({cw:0.3,cr:150,cc:6,top:0.55,tw:5,hy:0.78},window.__BP||{});window.__bot=(R,GW,GH,U)=>{const P=window.__BP;const px=R.x,py=R.y,sp=185*U*1.25*(R.sh.spd||1)*(R.chill>0?0.72:1)*(1-0.12*(R.snow||0));
  const EB=[],E=[];for(const b of R.EB){if(!b.dead&&Math.abs(b.x-px)<230&&Math.abs(b.y-py)<230)EB.push(b);}
  for(const e of R.E){if(!e.dead&&!e.hide&&Math.abs(e.x-px)<300&&Math.abs(e.y-py)<300)E.push(e);}
  let best=null,bs=1e9;
  for(const [ox,oy] of C){const cx=Math.max(26,Math.min(GW-26,px+ox)),cy=Math.max(34,Math.min(GH-34,py+oy));const dist=Math.hypot(cx-px,cy-py),tc=Math.max(dist/sp,0.1);let s=0,col=0,crowd=0;
    for(const f of FR){const t=tc*f,q=Math.min(1,f),x=px+(cx-px)*q,y=py+(cy-py)*q,w=f>1?0.6:1;
      for(const b of EB){const dx=b.x+b.vx*t-x,dy=b.y+b.vy*t-y,R0=(b.big?11:8)+9,d2=dx*dx+dy*dy;if(d2<R0*R0){s+=w*(R0-Math.sqrt(d2))/R0*10;}}
      for(const e of E){const v=Math.hypot(e.vx,e.vy)+(e.spd||0)*0.3,d=Math.hypot(e.x-x,e.y-y)-v*t,R0=e.r+7.5+12;if(d<R0){s+=w*(R0-Math.max(d,0))/R0*(e.kind==='boss'?14:10);}}}
    for(const e of E){const dx=e.x-cx,dy=e.y-cy,d=Math.hypot(dx,dy);if(d<P.cr)crowd+=(P.cr-d)/P.cr;if(dy<-30&&Math.abs(dx)<24+e.r)col+=e.kind==='boss'?4:1;}
    s+=Math.min(P.cc,crowd*P.cw);s-=0.4*Math.min(1,col/4);
    for(const w of R.LZ){const d=Math.abs(w.v?cx-w.p:cy-w.p);if(d<32)s+=(32-d)/32*(w.on?40:20);}
    const ed=Math.min(cx-26,GW-26-cx);if(ed<60)s+=(60-ed)/60*2;if(cy>GH-90)s+=(cy-GH+90)/90*1.5;if(cy<GH*P.top)s+=(GH*P.top-cy)/(GH*P.top)*P.tw;
    s+=Math.hypot((cx-GW/2)*0.5,cy-GH*P.hy)/GW*0.4;
    let g=0;for(const o of R.G){if(o.dead)continue;const d=Math.hypot(o.x-cx,o.y-cy);if(d<60)g+=0.05*(60-d)/60;}s-=Math.min(0.3,g);
    s+=dist*0.0006;
    if(s<bs){bs=s;best=[cx,cy];}}
  R.target={x:best[0],y:best[1]};};}
"""


def worker(jobs):
    from playwright.sync_api import sync_playwright
    errs, out = [], []
    pp = write_build(seed=True, dbg=bool(os.environ.get('DBG')), patch=json.loads(os.environ.get('PATCH', '[]')))
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = open_page(b, pp, 390, 844, errs)
        if os.environ.get('BP'):
            pg.evaluate('(p)=>{window.__BP=p;}', json.loads(os.environ['BP']))
        pg.evaluate(BOT)
        pg.evaluate("()=>{const T=window.__T;T.save.howto=1;}")
        pg.click('#startBtn'); pg.wait_for_timeout(200)
        for j in jobs:
            t0 = time.time()
            r = pg.evaluate(RUN, list(j))
            r['ms'] = int((time.time() - t0) * 1000)
            out.append(r)
            print(json.dumps(r, ensure_ascii=False), flush=True)
        b.close()
    return out, errs


NAMES = {}


def table(rows, ships, mode):
    """機体×ステージ：クリアした数/回数・残りHP%（平均）・倒した数・かせいだG・Lv"""
    L = ['| 機体 | ' + ' | '.join('ステージ%d' % n for n in range(1, 6)) + ' |', '|---|' + '---|' * 5]
    for sid in ships:
        cells = []
        for n in range(1, 6):
            rs = [r for r in rows if r['id'] == sid and r['n'] == n and r['mode'] == mode]
            if not rs:
                cells.append('-'); continue
            c = sum(r['clear'] for r in rs)
            avg = lambda k: round(sum(r[k] for r in rs) / len(rs))
            mark = '◯' if c == len(rs) else ('△' if c else '✕')
            tt = '' if c == len(rs) else ' %d:%02d' % (avg('t') // 60, avg('t') % 60)
            cells.append('%s%d/%d%s HP%d%% %d体 %dG Lv%d' % (mark, c, len(rs), tt, avg('hp'), avg('kills'), avg('gold'), avg('lv')))
        L.append('| %s | %s |' % (NAMES.get(sid, sid), ' | '.join(cells)))
    return '\n'.join(L)


def summary(rows, modes):
    L = ['| ステージ | ' + ' | '.join('%s：クリア・平均の生きのびた時間' % ('はじめの装備' if m == 'start' else '強い装備') for m in modes) + ' |', '|---|' + '---|' * len(modes)]
    for n in range(1, 6):
        cells = []
        for m in modes:
            rs = [r for r in rows if r['n'] == n and r['mode'] == m]
            if not rs:
                cells.append('-'); continue
            t = sum(r['t'] for r in rs) // len(rs)
            cells.append('%d / %d（%d%%）・%d:%02d' % (sum(r['clear'] for r in rs), len(rs), round(100 * sum(r['clear'] for r in rs) / len(rs)), t // 60, t % 60))
        L.append('| %d | %s |' % (n, ' | '.join(cells)))
    return '\n'.join(L)


def write_report(rows, ships, modes, seeds):
    path = os.path.join(ROOT, 'docs', 'test-report-6.md')
    T = ['# 試作6のボットの結果（issue #14）', '',
         '- 日付：' + time.strftime('%Y-%m-%d'), '- 作り方：`python3 tools/test/bot14.py --write`（12機 × 5ステージ × 2つの装備 × %d回）' % seeds,
         '- ボット：指の動きをまねる簡単な動き。この先0.7秒で近くを通る敵の弾・寄ってくる敵・レーザーの壁から離れ、何もなければ宝石と下の真ん中へ。レベルアップは進化 → 武器 → そのほか。HP はそのまま（へらない細工なし）',
         '- はじめの装備：機体の装備＋はじめから持っているレーザー2つ（あいている場所に）',
         '- 強い装備：あいている場所を強い武器（レーザー・ミサイル・ガトリング・雷撃・剣・シールド・機雷・プラズマ・ノコ・ビーム砲）でうめ、研究所の補強・火力・連射を最大',
         '- ステージ5は最終ボスをたおすまで（9:00 で打ち切り）', '',
         '## ステージごと', '', summary(rows, modes), '']
    for m in modes:
        T += ['## %s' % ('はじめの装備' if m == 'start' else '強い装備'), '',
              '◯＝全部クリア・△＝一部・✕＝クリアなし。時間＝クリアできなかったときの平均の生きのびた時間。HP＝残りHP（平均）・体＝倒した数・G＝かせいだお金・Lv＝最後のレベル', '',
              table(rows, ships, m), '']
    open(path, 'w', encoding='utf-8').write('\n'.join(T))
    print('書いた', path)


def main():
    seeds = int(os.environ.get('SEEDS', '2'))
    jobsn = int(os.environ.get('JOBS', '2'))
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = open_page(b, write_build(seed=True))
        meta = pg.evaluate("()=>({ids:window.__T.SHIP_IDS,names:Object.fromEntries(window.__T.SHIP_IDS.map(k=>[k,window.__T.SHIPS[k].name]))})")
        b.close()
    NAMES.update(meta['names'])
    ships = os.environ.get('SHIPS', ','.join(meta['ids'])).split(',')
    stages = [int(x) for x in os.environ.get('STAGES', '1,2,3,4,5').split(',')]
    modes = os.environ.get('MODE', 'start,strong').split(',')
    jobs = [(s, n, m, 1000 * n + k + 7 * i) for i, s in enumerate(ships) for n in stages for m in modes for k in range(seeds)]
    jobs.sort(key=lambda j: -j[1])  # 長いステージ5から
    parts = [jobs[i::jobsn] for i in range(jobsn)]
    t0 = time.time()
    with get_context('spawn').Pool(jobsn) as pool:
        res = pool.map(worker, parts)
    rows = [r for o, _ in res for r in o]
    errs = [e for _, es in res for e in es]
    print('かかった時間 %ds・%d回' % (time.time() - t0, len(rows)))
    for m in modes:
        print('\n' + m); print(table(rows, ships, m))
    json.dump(rows, open(os.path.join(os.environ.get('OUT', '/tmp'), 'bot14.json'), 'w'), ensure_ascii=False)
    if '--write' in sys.argv:
        write_report(rows, ships, modes, seeds)
    bad = [r for r in rows if r['timeout'] or r['gold'] < 0]
    for r in bad:
        print('NG 終わらない・結果なし', r)
    for e in errs[:10]:
        print('ERR', e)
    print('エラー', len(errs), '・NG', len(bad))
    sys.exit(1 if errs or bad else 0)


if __name__ == '__main__':
    main()
