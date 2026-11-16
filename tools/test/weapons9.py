"""攻撃の装備49種のテスト（issue #9）
使い方: python3 tools/test/weapons9.py [index.html] [出力フォルダ]
- テスト用のコピーに window.__T を足して Playwright（chromium）で開く。外への読みこみ（フォント）は止める
- 49種を1つずつつけて5分早送り（Lv1→Lv8）：エラー0・ダメージを与えたか数える
- 敵280体＋重い武器を全部 Lv8 でつけた場面の1フレームの時間
- レベルアップの文と強さ（威力・連射の％）がずれていないか
"""
import json, os, sys, tempfile
from playwright.sync_api import sync_playwright

SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', '..', 'index.html')
OUT = sys.argv[2] if len(sys.argv) > 2 else tempfile.mkdtemp()
SECS = float(os.environ.get('SECS', '295'))

def build(src):
    h = open(src, encoding='utf-8').read()
    h = h.replace("  amt*=1+e.vul+(e.son>0?e.sonV:0);", "  amt*=1+e.vul+(e.son>0?e.sonV:0);window.__DMG+=amt;", 1)
    h = h.replace("  if(!R)return;\n  raf=requestAnimationFrame(frame);", "  if(!R||window.__HOLD)return;\n  raf=requestAnimationFrame(frame);", 1)
    h = h.replace("  const SHOT_GAP=", "  window.__SHOT=SHOT;const SHOT_GAP=", 1)
    expose = ("window.__DMG=0;window.__T={get R(){return R},update,draw,stat,startRun,addEnemy,openShop,renderShop,"
              "get save(){return save},MODS,TYPES,STAT6,GR,SFX,WMAX,get GH(){return GH},setShip,ICON,MSPR,draw6Under,draw6Over,draw6Ship,draw6Top,get ctx(){return ctx}};\n")
    i = h.rindex('})();\n</script>')
    h = h[:i] + expose + h[i:]
    return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' + h + '</body></html>'

RUN_ONE = r"""
([t,secs,dt])=>{const T=window.__T;window.__HOLD=1;T.startRun();const R=T.R;
  R.mods=[{t,slot:0,d:0,cd:0.2}];for(const k of T.TYPES)R.tlv[k]=0;if(!T.MODS[t].passive)R.tlv[t]=1;
  window.__DMG=0;let maxN={B:0,Q:0,PD:0,RG:0,HL:0,TU:0,MN:0,M:0,S:0},steps=Math.round(secs/dt),t0=performance.now(),dmgLv={};
  for(let i=0;i<steps;i++){
    if(!T.MODS[t].passive){const lv=Math.min(T.WMAX,1+Math.floor(R.t/36));if(lv!==R.tlv[t]){dmgLv[R.tlv[t]]=window.__DMG;R.tlv[t]=lv;}}
    R.hp=R.maxHp=1e7;R.pending=0;T.update(dt);if(T.R!==R||R.state==='over')break;
    for(const k in maxN)if(R[k]&&R[k].length>maxN[k])maxN[k]=R[k].length;
    if(i%45===0)T.draw();
  }
  dmgLv[R.tlv[t]]=window.__DMG;
  return {t,dmg:Math.round(window.__DMG),kills:R.kills,lv:R.tlv[t],secs:Math.round(R.t),ms:Math.round(performance.now()-t0),maxN,dmgLv};}
"""

PERF = r"""
([heavy,frames])=>{const T=window.__T;window.__HOLD=1;T.startRun();const R=T.R;
  R.mods=heavy.map((t,i)=>({t,slot:i%7,d:i%8,cd:Math.random()*0.5}));for(const k of T.TYPES)R.tlv[k]=0;for(const t of heavy)R.tlv[t]=8;
  R.t=200;const top=()=>{while(R.E.length<280)T.addEnemy(Math.random()<0.15?'tank':'bug',Math.random()*480,Math.random()*T.GH*0.8);};
  for(let i=0;i<120;i++){top();R.hp=R.maxHp=1e7;R.pending=0;T.update(1/60);}
  const ts=[];let cnt={};
  for(let i=0;i<frames;i++){top();R.hp=R.maxHp=1e7;R.pending=0;const a=performance.now();T.update(1/60);T.draw();ts.push(performance.now()-a);}
  for(const k of ['E','B','Q','PD','RG','HL','TU','MN','M','P','X','EB'])cnt[k]=R[k].length;
  ts.sort((x,y)=>x-y);const avg=ts.reduce((s,v)=>s+v,0)/ts.length;
  return {avg:+avg.toFixed(2),p95:+ts[Math.floor(ts.length*0.95)].toFixed(2),max:+ts[ts.length-1].toFixed(2),cnt};}
"""

TEXT = r"""
()=>{const T=window.__T,bad=[],descs=[];
  for(const t of T.TYPES){const m=T.MODS[t];if(!m.g)continue;
    descs.push([t,m.name,m.desc,[...m.desc].length]);
    for(let L=2;L<=T.WMAX;L++){const u=m.up[L];if(!u)bad.push(t+' Lv'+L+' 文なし');
      const d=/威力 ＋(\d+)%/.exec(u),r=new RegExp((m.rl||'連射')+' ＋(\\d+)%').exec(u);
      const dd=Math.round((T.GR(t,'d',L)/T.GR(t,'d',L-1)-1)*100),rr=Math.round((T.GR(t,'r',L)/T.GR(t,'r',L-1)-1)*100);
      if((d?+d[1]:0)!==dd)bad.push(t+' Lv'+L+' 威力 文'+(d?d[1]:0)+' 強さ'+dd);
      if((r?+r[1]:0)!==rr)bad.push(t+' Lv'+L+' 連射 文'+(r?r[1]:0)+' 強さ'+rr);
      if(/[！!]|してね|だよ|しよう|しましょう|ぜひ|便利|簡単|安心|おすすめ|最強|圧倒的|——|―/.test(u+m.desc+m.name))bad.push(t+' 使わない言葉');}}
  return {bad,descs};}
"""

def main():
    os.makedirs(OUT, exist_ok=True)
    tmp = tempfile.mkdtemp()
    page_path = os.path.join(tmp, 'test.html')
    open(page_path, 'w', encoding='utf-8').write(build(SRC))
    errs = []
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={'width': 390, 'height': 844})
        pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith('file:') else r.abort())
        pg.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)))
        pg.on('console', lambda m: errs.append('console: ' + m.text) if m.type == 'error' and 'ERR_FAILED' not in m.text else None)
        pg.goto('file://' + page_path)
        pg.wait_for_timeout(500)
        res = {'text': pg.evaluate(TEXT)}
        # 音：30種の撃つ音を1回ずつ鳴らしてエラーが出ないか
        res['sfx'] = pg.evaluate("()=>{const T=window.__T;T.SFX.unlock();let n=0;for(const t of T.TYPES){const f=window.__SHOT[t];if(f){f();n++;}}return n;}")
        # ブレードの「刃」：近接9種は威力1.4倍、ほかは同じ
        res['blade'] = pg.evaluate("""()=>{const T=window.__T,out={};window.__HOLD=1;
          const dm=()=>{const o={};for(const t of T.TYPES){if(T.MODS[t].passive)continue;T.R.tlv[t]=3;const s=T.stat(t);o[t]=s&&s.dmg;}return o;};
          T.setShip('standard');T.startRun();const a=dm();T.setShip('blade');T.save.load[0]={t:'sword',d:0};T.startRun();const b=dm();T.setShip('standard');
          for(const t in a)if(a[t])out[t]=+(b[t]/a[t]).toFixed(2);return Object.keys(out).filter(t=>out[t]!==1).map(t=>t+':'+out[t]);}""")
        print('blade x1.4:', res['blade'])
        types = pg.evaluate("()=>window.__T.TYPES")
        only = os.environ.get('ONLY')
        if only: types = only.split(',')
        res['runs'] = []
        for t in types:
            r = pg.evaluate(RUN_ONE, [t, SECS, 1/30])
            res['runs'].append(r)
            print(t, r['dmg'], r['kills'], 'lv', r['lv'], r['ms'], 'ms', json.dumps(r['maxN']), flush=True)
        heavy = ['napalm', 'acid', 'cluster', 'minefield', 'turret', 'micro', 'hlaser', 'plasma', 'splitter', 'prism', 'halo', 'emp', 'shockwave', 'satellite']
        res['perf'] = pg.evaluate(PERF, [heavy, 300])
        res['errors'] = errs
        b.close()
    json.dump(res, open(os.path.join(OUT, 'weapons9.json'), 'w'), ensure_ascii=False, indent=1)
    print('TEXT bad:', res['text']['bad'])
    print('long desc:', [d for d in res['text']['descs'] if d[3] > 22])
    print('sfx', res['sfx'], 'perf', res['perf'])
    print('no damage:', [r['t'] for r in res['runs'] if r['dmg'] <= 0 and not pg_passive(r['t'])])
    print('errors', len(errs), errs[:5])

PASSIVE = {'armor', 'magnet', 'booster', 'coin', 'repair', 'shield', 'reflector'}
def pg_passive(t): return t in PASSIVE

if __name__ == '__main__':
    main()
