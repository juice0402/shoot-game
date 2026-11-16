"""いちばん重い場面の負荷テスト（11/17・PR #34）
使い方:
  python3 tools/test/perf34.py                 全部の機体の終盤（装備の枠ぜんぶ Lv8＋進化・強化ぜんぶ・敵最大・ボス2体・必殺技）
  python3 tools/test/perf34.py --cpu 4         CPU を4倍おそくして（スマホ想定）
  python3 tools/test/perf34.py --src 前.html   ほかの index.html ではかる（直す前とくらべる）
  python3 tools/test/perf34.py --scan          攻撃の装備42種を1種ずつ（オメガの9枠ぜんぶ同じ武器・どれが重いか）
  python3 tools/test/perf34.py --prof オメガ全部攻撃   その場面の CPU プロファイル（自分の時間の上位）
  python3 tools/test/perf34.py --only オメガ全部攻撃   その場面だけ
  python3 tools/test/perf34.py --mem           メモリを作る所の上位も出す
  python3 tools/test/perf34.py --gpu           GPU で描く形（SwiftShader）ではかる
場面：ステージ5の終盤（深淵の核と大蛇）・敵は上限の280体を保つ（倒されたらすぐ足す）・敵の弾320・レーザーの壁・
  研究所は最大・機体の強化と支援は最大・特別な強化（ガラスの大砲・背水の陣・欲ばり・時の加速）・必殺技はたまったらすぐ出す
はかるもの：1フレーム（update＋draw）の中央値・95%・最大、update と draw の平均、1フレームで作って捨てるメモリ（KB・多いとときどき掃除で止まる）、
  弾・破片などの数、1フレームでキャンバスに出す命令の数（fillRect・drawImage・色と透明度の設定）。
  NG：命令が1フレーム 8000 回をこえる（11/17 の直す前はファントムで約6万8千回）・エラーが出る。
  時間はこの機械（GPU なし・2コア）の値で、ほかの作業と重なると大きくぶれるので、めやすとして出すだけ（同じ機械で前とくらべる）
ほかのテストと同時に動かさない（2コアの機械なので数字が大きくなる）
"""
import os, sys, json, statistics
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness14 import build, SRC
from playwright.sync_api import sync_playwright
import tempfile

# 攻撃の装備の重い順（--scan の結果・11/17）。機体の枠にこの順で入れる
HEAVY = ['sword', 'scythe', 'gsword', 'twin', 'shockwave', 'halo', 'thunder', 'missile', 'gravity',
         'sonic', 'plasma', 'needle', 'laser', 'flame', 'gatling']

ALL = ['laser', 'gatling', 'mine', 'shotgun', 'freeze', 'missile', 'flame', 'sword', 'saw', 'thunder', 'gravity', 'cannon', 'pulse', 'rail',
       'sniper', 'fan', 'ricochet', 'splitter', 'needle', 'acid', 'grenade', 'cluster', 'napalm', 'shockwave', 'torpedo', 'plasma', 'prism',
       'halo', 'hlaser', 'sonic', 'gsword', 'twin', 'lance', 'hammer', 'whip', 'chainsaw', 'scythe', 'turret', 'minefield', 'satellite', 'micro',
       'emp', 'armor', 'shield', 'reflector', 'magnet', 'booster', 'coin', 'repair', 'harmor', 'sdrone', 'fshield', 'spike', 'evade', 'ebarrier',
       'absorber', 'revive', 'iframe', 'frost', 'scope', 'cooler', 'amp', 'crit', 'dur', 'multi', 'xpamp', 'cdrone', 'reactor', 'berserk']

EXTRA = "window.__T={spStart,takeSpc,SPC,get SPG(){return SPG},"

SETUP = r"""
(a)=>{const T=window.__T;window.__HOLD=1;const s=T.freshSave();T.save=s;s.howto=1;s.tut=1;s.rec.stageMax=4;s.st=5;
  for(const o of T.LAB)s.lab[o.id]=o.max;T.ensureSlots(s);s.ships[a.ship].have=true;T.setShip(a.ship);
  const L=s.ships[a.ship].eq;for(let i=0;i<L.length;i++){const m=a.mods[i%a.mods.length];L[i]=m?{t:m,d:a.dirs?a.dirs[i%a.dirs.length]:(i%8)}:null;if(m)s.owned[m]=9;}
  T.setShip(a.ship);T.startRun();const R=T.R;R.pending=0;R.need=1e12;/* レベルアップの板（DOM）は出撃を止めるので、はかる間は出さない */
  for(const m of R.mods)R.tlv[m.t]=T.WMAX;for(const t of Object.keys(T.EVO))if(R.tlv[t])R.evo[t]=true;
  for(const k in R.pas)R.pas[k]=T.PAS[k].max||5;for(const k in R.sup)for(let i=0;i<T.SUP[k].max;i++)T.supUp(k);
  for(const k of (a.spc||[]))T.takeSpc(k);T.calcCS();
  R.bossAt=[];R.t=290;window.__b=T.addBig('core');window.__sn=T.addBig('snake');T.addWall(true,120);T.addWall(false,300);window.__i=0;
  const K=['bug','shard','warp','charger','frost','guard','splitter','hider','tank','shooter'];
  window.__fill=()=>{while(R.E.length<280){const k=K[(Math.random()*10)|0];const an=Math.random()*6.28,d=110+Math.random()*260;T.addEnemy(k,R.x+Math.cos(an)*d,R.y+Math.sin(an)*d*0.9);}
    while(R.EB.length<320)R.EB.push({x:Math.random()*T.GW,y:Math.random()*T.GH*0.6,vx:(Math.random()-0.5)*60,vy:40+Math.random()*60,dmg:8,big:Math.random()<0.2,slow:Math.random()<0.2?1:0,dead:false});};
  window.__keep=()=>{const b=window.__b,sn=window.__sn;R.hp=R.maxHp;b.hp=Math.max(b.hp,b.max*0.3);sn.hp=sn.max;if(b.dead){b.dead=false;R.E.push(b);}if(sn.dead){sn.dead=false;R.E.push(sn);}
    if(R.state!=='play'){R.state='play';document.getElementById('overlay').hidden=true;}R.pending=0;R.chestQ=0;R.CH.length=0;if(a.sp&&!R.sp)R.gauge=T.SPG.max;
    const i=++window.__i;if(i%90===0)T.addWall(i%180===0,150+i%300);R.x=240+Math.sin(i/40)*120;R.y=380+Math.cos(i/55)*60;};
  return R.mods.length;}
"""

RUN = r"""
(n)=>{const T=window.__T,R=T.R,ut=[],dtm=[],tt=[];
  for(let i=0;i<n;i++){window.__fill();const a=performance.now();T.update(1/60);const b=performance.now();T.draw();const c=performance.now();
    ut.push(b-a);dtm.push(c-b);tt.push(c-a);window.__keep();}
  const q=(arr,p)=>{const s=[...arr].sort((x,y)=>x-y);return +s[Math.min(s.length-1,Math.floor(s.length*p))].toFixed(2);};
  const avg=arr=>+(arr.reduce((x,y)=>x+y,0)/arr.length).toFixed(2);
  return {med:q(tt,0.5),p95:q(tt,0.95),max:q(tt,1),up:avg(ut),dr:avg(dtm),
    E:R.E.length,EB:R.EB.length,B:R.B.length,P:R.P.length,X:R.X.length,PD:R.PD.length,M:R.M.length,G:R.G.length,mods:R.mods.length+R.cmods.length,sp:!!R.sp};}
"""

CALLS = r"""(n)=>{const T=window.__T,g=document.getElementById('game').getContext('2d');const c={n:0};const fr=g.fillRect,di=g.drawImage;
 const P=CanvasRenderingContext2D.prototype,dF=Object.getOwnPropertyDescriptor(P,'fillStyle'),dA=Object.getOwnPropertyDescriptor(P,'globalAlpha');
 Object.defineProperty(g,'fillStyle',{get(){return dF.get.call(this)},set(v){c.n++;dF.set.call(this,v)},configurable:true});
 Object.defineProperty(g,'globalAlpha',{get(){return dA.get.call(this)},set(v){c.n++;dA.set.call(this,v)},configurable:true});
 g.fillRect=function(){c.n++;return fr.apply(this,arguments)};g.drawImage=function(){c.n++;return di.apply(this,arguments)};
 for(let i=0;i<n;i++){window.__fill();T.update(1/60);T.draw();window.__keep();}delete g.fillRect;delete g.drawImage;delete g.fillStyle;delete g.globalAlpha;return Math.round(c.n/n);}"""
MAXCALLS = 8000

SPC4 = ['glass', 'back', 'greed', 'haste']
SHIP_JA = {'standard': 'スタンダード', 'rapid': 'ラピッド', 'fortress': 'フォートレス', 'collector': 'コレクター', 'blade': 'ブレード',
           'carrier': 'キャリア', 'marksman': 'スナイパー', 'bomber': 'ボマー', 'phantom': 'ファントム', 'vanguard': 'ヴァンガード',
           'alchemist': 'アルケミスト', 'omega': 'オメガ'}


def scenarios():
    out = [('オメガ全部攻撃', {'ship': 'omega', 'mods': HEAVY[:9], 'spc': SPC4, 'sp': 1}),
           ('オメガ同じ武器9こ', {'ship': 'omega', 'mods': [HEAVY[0]], 'spc': SPC4, 'sp': 1}),
           ('オメガ攻撃と防御', {'ship': 'omega', 'mods': HEAVY[:5] + ['shield', 'reflector', 'sdrone', 'cdrone'], 'spc': SPC4, 'sp': 1})]
    for k, ja in SHIP_JA.items():
        if k != 'omega':
            out.append((ja, {'ship': k, 'mods': HEAVY[:9], 'spc': SPC4, 'sp': 1}))
    for i in range(0, len(ALL), 9):  # 装備69種をぜんぶ（9こずつ）。絵が変わっていないかの点検（same34）用
        out.append(('全種%d' % (i // 9 + 1), {'ship': 'omega', 'mods': ALL[i:i + 9], 'spc': SPC4, 'sp': 1}))
    return out


def page(b, src, cpu):
    h = build(src, seed=True).replace("window.__T={", EXTRA, 1)
    d = tempfile.mkdtemp(); pp = os.path.join(d, 't.html'); open(pp, 'w', encoding='utf-8').write(h)
    ctx = b.new_context(viewport={'width': 390, 'height': 844})
    ctx.add_init_script('window.__NOFX=true')
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)))
    pg.on('console', lambda m: errs.append('console: ' + m.text) if m.type == 'error' and 'net::' not in m.text else None)
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith('file:') else r.abort())
    pg.goto('file://' + pp); pg.wait_for_timeout(400)
    cdp = ctx.new_cdp_session(pg)
    if cpu > 1:
        cdp.send('Emulation.setCPUThrottlingRate', {'rate': cpu})
    return pg, cdp, errs


def one(b, src, cpu, args, warm=150, n=300, prof=False):
    pg, cdp, errs = page(b, src, cpu)
    pg.evaluate("()=>window.__seed(5)")
    pg.evaluate(SETUP, args)
    pg.evaluate(RUN, warm)
    if prof:
        cdp.send('Profiler.enable'); cdp.send('Profiler.setSamplingInterval', {'interval': 200}); cdp.send('Profiler.start')
    else:  # 1フレームで作って捨てるメモリ（多いと、ときどき掃除で止まる）
        cdp.send('HeapProfiler.enable')
        cdp.send('HeapProfiler.startSampling', {'samplingInterval': 2048, 'includeObjectsCollectedByMajorGC': True, 'includeObjectsCollectedByMinorGC': True})
    r = pg.evaluate(RUN, n)
    if not prof:
        r['calls'] = pg.evaluate(CALLS, 40)
    if prof:
        r['prof'] = cdp.send('Profiler.stop')['profile']
    else:
        hp = cdp.send('HeapProfiler.stopSampling')['profile']
        def tot(nd):
            return nd.get('selfSize', 0) + sum(tot(c) for c in nd.get('children', []))
        r['kb'] = round(tot(hp['head']) / n / 1024, 1)
        top = {}
        def walk(nd):
            cf = nd['callFrame']; k = (cf['functionName'] or '(無名)') + ':%d' % (cf['lineNumber'] + 1)
            top[k] = top.get(k, 0) + nd.get('selfSize', 0)
            for c in nd.get('children', []):
                walk(c)
        walk(hp['head']); r['memtop'] = [(k, round(v / n / 1024, 1)) for k, v in sorted(top.items(), key=lambda kv: -kv[1])[:12]]
    pg.context.close()
    return r, errs


def show_prof(p, top=30):
    nodes = {nd['id']: nd for nd in p['nodes']}
    par = {}
    for nd in p['nodes']:
        for c in nd.get('children', []):
            par[c] = nd['id']
    self_t, incl = {}, {}
    name = lambda nd: (nd['callFrame']['functionName'] or '(無名)') + (':%d' % (nd['callFrame']['lineNumber'] + 1) if nd['callFrame']['url'] else '')
    for sid, dt in zip(p['samples'], p['timeDeltas']):
        nd = nodes[sid]; k = name(nd); self_t[k] = self_t.get(k, 0) + dt
        seen = set(); x = sid
        while x in nodes:
            kk = name(nodes[x])
            if kk not in seen:
                seen.add(kk); incl[kk] = incl.get(kk, 0) + dt
            x = par.get(x)
            if x is None:
                break
    tot = sum(p['timeDeltas'])
    print('自分の時間の上位（%）')
    for k, v in sorted(self_t.items(), key=lambda kv: -kv[1])[:top]:
        print('  %5.1f  %s' % (v * 100 / tot, k))
    print('ふくむ時間（update・draw の中の主な関数・%）')
    for k, v in sorted(incl.items(), key=lambda kv: -kv[1]):
        if v * 100 / tot >= 2 and ':' in k:
            print('  %5.1f  %s' % (v * 100 / tot, k))


def main():
    a = sys.argv[1:]
    cpu = int(a[a.index('--cpu') + 1]) if '--cpu' in a else 1
    src = a[a.index('--src') + 1] if '--src' in a else SRC
    fails = 0
    with sync_playwright() as p:
        # --gpu：GPU で描くブラウザに近い形（SwiftShader）。スマホの Safari や Chrome は GPU で描くので、描く命令の数が効く
        gpu = ['--use-angle=swiftshader', '--enable-gpu-rasterization', '--enable-accelerated-2d-canvas', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] if '--gpu' in a else []
        b = p.chromium.launch(args=['--enable-precise-memory-info'] + gpu)
        if '--scan' in a:
            res = []
            pg, cdp, errs = page(b, src, cpu)
            atk = pg.evaluate("()=>Object.keys(window.__T.MODS).filter(k=>window.__T.MODS[k].cat==='atk')")
            pg.context.close()
            for t in atk:
                r, e = one(b, src, cpu, {'ship': 'omega', 'mods': [t], 'spc': [], 'sp': 0, 'dirs': [0]}, warm=60, n=120)
                res.append((r['up'] + r['dr'], t, r))
            # 9枠ぜんぶ同じ武器で、重い順にならべる
            for v, t, r in sorted(res, reverse=True):
                print('%-10s 平均 %.2fms（update %.2f・draw %.2f）弾 %d 破片 %d' % (t, v, r['up'], r['dr'], r['B'], r['P']))
            b.close(); return
        if '--prof' in a:
            nm = a[a.index('--prof') + 1]
            args = dict(scenarios())[nm]
            r, errs = one(b, src, cpu, args, prof=True)
            pr = r.pop('prof'); print(nm, r); show_prof(pr)
            b.close(); return
        only = a[a.index('--only') + 1] if '--only' in a else None
        print('CPU %d倍おそく・時間はめやす（16ms＝1秒60コマ）・NG は命令が1フレーム %d 回をこえたとき' % (cpu, MAXCALLS))
        worst = None
        for nm, args in scenarios():
            if only and nm != only:
                continue
            r, errs = one(b, src, cpu, args)
            ng = r['calls'] > MAXCALLS or errs
            fails += 1 if ng else 0
            print('%s %-14s 命令 %5d回 中央値 %6.2f／95%% %6.2f／最大 %6.2f ms（update %.2f・draw %.2f）作って捨てるメモリ %.0fKB/フレーム 敵%d 敵弾%d 弾%d 破片%d 爆発%d 装備%d%s'
                  % ('NG' if ng else 'ok', nm, r['calls'], r['med'], r['p95'], r['max'], r['up'], r['dr'], r['kb'], r['E'], r['EB'], r['B'], r['P'], r['X'], r['mods'], ' 必殺技中' if r['sp'] else ''))
            for e in errs[:3]:
                print('   ERR', e)
            if '--mem' in a:
                print('   メモリを作る所（KB/フレーム）', r['memtop'])
            if not worst or r['p95'] > worst[1]['p95']:
                worst = (nm, r)
        if worst:
            print('いちばん重い：%s 95%% %.2fms' % (worst[0], worst[1]['p95']))
        b.close()
    sys.exit(1 if fails else 0)


if __name__ == '__main__':
    main()
