"""画面の大きさの点検とスクショ（issue #14）
使い方: python3 tools/test/shots14.py [出力フォルダ（ふつう docs/shots）]   SHOTS=0 で点検だけ
- 幅320・360・390・430（スマホの縦）・768×1024（iPad の縦）・1280×800（PC）で、20の画面をひらく
  タイトル・遊び方・格納庫・装備の一覧・向き・ショップ・くわしく（装備・機体）・研究所・研究所のくわしく・図鑑・図鑑のくわしく・実績・
  ステージえらび（まだのステージ）・出撃中・レベルアップ・宝箱・一時停止・結果・エンディング
- 点検：画面の外へのはみ出し／短い文字（12字まで）が2行になる／折り返した最後の行が1〜2字だけ／枠で切れた文字／44px より小さいボタン
- スクショ：14-pr.png（幅320・390・PC）・14-phone-1〜4.png（幅360・390・430）・14-wide.png（iPad・PC）
"""
import os, sys, io
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness14 import write_build, open_page, ROOT
from playwright.sync_api import sync_playwright

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'docs', 'shots')
SHOTS = os.environ.get('SHOTS', '1') != '0'
SIZES = [(320, 568), (360, 740), (390, 844), (430, 932), (768, 1024), (1280, 800)]
if os.environ.get('W'):
    SIZES = [s for s in SIZES if str(s[0]) in os.environ['W'].split(',')]

PREP = r"""
()=>{const T=window.__T;window.__HOLD=1;T.R=null;document.getElementById('sortie').hidden=true;document.getElementById('overlay').hidden=true;
  const s=T.freshSave();s.gold=12860;s.howto=1;s.tut=1;s.rec.stageMax=2;s.st=3;Object.assign(s.rec,{clears:6,bosses:4,goldTotal:9000,kills:8000,bestLv:24,time:5400,halfClear:1});
  s.ach.clear1=1;s.ach.boss1=1;s.ach.kill1k=1;['laser','missile','gatling','sword','shield','mine','thunder','plasma'].forEach(t=>{s.owned[t]=2;});s.evo.laser=1;
  s.ships.blade.have=true;s.book.e={bug:120,tank:30,shooter:40,boss:2,hider:20};s.lab.r_hp=2;s.lab.r_pow=1;
  const L=s.ships.standard.eq;for(let i=0;i<L.length;i++)L[i]=null;[['laser',1],['laser',2],['missile',0],['sword',3]].forEach(([t,i])=>{L[i]={t,d:i===3?7:0};});
  T.save=s;T.persist();T.setShip('standard');T.closeSheet();['shopSheet','labSheet','bookSheet','achSheet','howto'].forEach(id=>{document.getElementById(id).hidden=true;});
  T.toHangarFromTitle();}
"""

RUNP = r"""
(kind)=>{const T=window.__T;const s=T.save;s.st=3;const R=(()=>{T.setShip('standard');T.startRun();return T.R;})();window.__HOLD=1;R.pending=0;R.chestQ=0;
  for(const m of R.mods)R.tlv[m.t]=3;R.pas.power=2;R.sup.drone=2;T.calcCS();R.t=140;for(let i=0;i<60*6;i++){T.update(1/60);R.hp=R.maxHp*0.8;if(R.state!=='play'){R.state='play';}}
  R.state='play';document.getElementById('overlay').hidden=true;T.draw();T.hud();
  if(kind==='lvup'){R.pending=1;T.openLevelUp();}
  if(kind==='chest'){R.chestQ=1;T.openChest();}
  if(kind==='pause'){T.openPause();}
  if(kind==='result'){s.rec.stageMax=2;R.stage=3;R.stg=3;R.t=T.RUN_LEN;R.kills=2400;R.bossKills=2;T.endRun(true,false);}
  if(kind==='ending'){T.SHIP_IDS.forEach(id=>{s.ships[id].have=id!=='omega';});s.rec.stageMax=4;R.stage=5;R.stg=5;R.t=402;R.won=1;T.endRun(true,false);}
  return true;}
"""

AUDIT = r"""
(where)=>{const W=innerWidth,bad=[];
  const shown=el=>{if(el.closest('[hidden]'))return false;const r=el.getBoundingClientRect();if(r.width<1||r.height<1)return false;const cs=getComputedStyle(el);return cs.visibility!=='hidden'&&cs.display!=='none'&&+cs.opacity>0.05;};
  const nm=el=>(el.id?'#'+el.id:el.tagName.toLowerCase()+(typeof el.className==='string'&&el.className?'.'+el.className.trim().split(/\s+/)[0]:''))+'「'+((el.textContent||el.getAttribute('aria-label')||'').trim().replace(/\s+/g,' ').slice(0,16))+'」';
  const scrollAnc=el=>{for(let p=el.parentElement;p;p=p.parentElement){const o=getComputedStyle(p).overflowX;if(o==='auto'||o==='scroll')return p;}return null;};
  for(const el of document.querySelectorAll('body *')){if(el.tagName==='CANVAS'||el.tagName==='SCRIPT'||el.tagName==='STYLE'||!shown(el))continue;const r=el.getBoundingClientRect();
    if((r.right>W+1||r.left<-1)&&!scrollAnc(el)&&getComputedStyle(el).position!=='fixed')bad.push(['はみ出し',nm(el),Math.round(r.left)+'〜'+Math.round(r.right)]);
    const cs=getComputedStyle(el);if((cs.overflowX==='hidden'||cs.textOverflow==='ellipsis')&&el.clientWidth>2&&el.scrollWidth>el.clientWidth+1&&el.textContent.trim())bad.push(['切れた文字',nm(el),el.scrollWidth+'>'+el.clientWidth]);}
  const tw=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
  while(n=tw.nextNode()){const t=n.textContent.trim();if(!t||!n.parentElement||!shown(n.parentElement)||n.parentElement.closest('h1')&&n.parentElement.closest('h1').clientWidth<=2)continue;const rg=document.createRange();rg.selectNodeContents(n);
    const rs=[...rg.getClientRects()].filter(r=>r.width>0.5);if(rs.length<2)continue;const tops=[];for(const r of rs)if(!tops.some(v=>Math.abs(v-r.top)<3))tops.push(r.top);if(tops.length<2)continue;
    const fs=parseFloat(getComputedStyle(n.parentElement).fontSize);const last=rs.filter(r=>Math.abs(r.top-Math.max(...tops))<3).reduce((a,r)=>a+r.width,0);
    const inBtn=n.parentElement.closest('button,.slotb,h2,h3,.ctop,.tagnew');
    if(inBtn&&[...t].length<=12)bad.push(['2行になる',nm(n.parentElement),t]);
    else if(last<fs*3.2)bad.push(['最後の行が1〜3字',nm(n.parentElement),t.slice(-8)]);}
  for(const b of document.querySelectorAll('button')){if(!shown(b))continue;const r=b.getBoundingClientRect();if(r.height<43.5||r.width<43.5)bad.push(['小さいボタン',nm(b),Math.round(r.width)+'×'+Math.round(r.height)]);}
  return bad.map(x=>[where].concat(x));}
"""

SCREENS = [
    ('title', "()=>{const T=window.__T;T.showTitle();}"),
    ('howto', "()=>{const T=window.__T;document.getElementById('title').hidden=true;T.openHowto(false);}"),
    ('hangar', None),
    ('list', "()=>{window.__T.openList(4);}"),
    ('aim', "()=>{window.__T.openAim(0);}"),
    ('info', "()=>{window.__T.openInfo();}"),
    ('shop', "()=>{window.__T.openShop();}"),
    ('detail', "()=>{window.__T.openShop('laser');}"),
    ('shipd', "()=>{window.__T.openShop('blade');}"),
    ('lab', "()=>{window.__T.openLab();}"),
    ('labd', "()=>{const T=window.__T;T.openLab();T.openLabDetail('r_pow');}"),
    ('book', "()=>{window.__T.openBook();}"),
    ('booki', "()=>{window.__T.openBook();const b=document.querySelector('#bookBody .bgrid button');if(b)b.click();}"),
    ('ach', "()=>{window.__T.openAch();}"),
    ('stage', "()=>{const T=window.__T;T.stepStage(0);}"),
    ('play', 'play'), ('lvup', 'lvup'), ('chest', 'chest'), ('pause', 'pause'), ('result', 'result'), ('ending', 'ending'),
]
JP = {'title': 'タイトル', 'howto': '遊び方', 'hangar': '格納庫', 'list': '装備の一覧', 'aim': '向き', 'info': '機体のくわしく', 'shop': 'ショップ', 'detail': 'くわしく（装備）',
      'shipd': 'くわしく（機体）', 'lab': '研究所', 'labd': '研究所のくわしく', 'book': '図鑑', 'booki': '図鑑のくわしく', 'ach': '実績', 'stage': 'ステージえらび',
      'play': '出撃中', 'lvup': 'レベルアップ', 'chest': '宝箱', 'pause': '一時停止', 'result': '結果', 'ending': 'エンディング'}


def compose(rows, cols, shots, path, cell_h=430, label=True):
    from PIL import Image, ImageDraw, ImageFont
    FONT = '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
    f = ImageFont.truetype(FONT, 18) if os.path.exists(FONT) else None
    ims = {}
    for r in rows:
        for c in cols:
            im = Image.open(io.BytesIO(shots[(c, r)])).convert('RGB')
            w = round(im.width * cell_h / im.height)
            ims[(c, r)] = im.resize((w, cell_h), Image.LANCZOS)
    colw = {c: max(ims[(c, r)].width for r in rows) for c in cols}
    top = 30 if label else 0
    W = sum(colw.values()) + 12 * (len(cols) + 1); H = top + (cell_h + 34) * len(rows) + 8
    out = Image.new('RGB', (W, H), (6, 10, 28)); d = ImageDraw.Draw(out)
    x = 12
    for c in cols:
        d.text((x, 6), '%d×%d' % c, fill=(190, 200, 255), font=f)
        y = top
        for r in rows:
            d.text((x, y + 4), JP[r], fill=(255, 230, 150), font=f)
            out.paste(ims[(c, r)], (x, y + 30)); y += cell_h + 34
        x += colw[c] + 12
    out.save(path, optimize=True)


def main():
    errs, warns, bad = [], [], []
    shots = {}
    pp = write_build()
    with sync_playwright() as p:
        b = p.chromium.launch()
        for (w, h) in SIZES:
            pg = open_page(b, pp, w, h, errs, warns)
            pg.add_style_tag(content='*{animation-duration:0s!important;transition:none!important}')
            for key, js in SCREENS:
                pg.evaluate(PREP); pg.wait_for_timeout(60)
                if js in ('play', 'lvup', 'chest', 'pause', 'result', 'ending'):
                    pg.evaluate(RUNP, js)
                    pg.wait_for_timeout(450)
                    if js == 'chest':
                        pg.evaluate("()=>{const b=document.querySelector('#overlay .btnrow .go');if(b)b.disabled=false;}")
                elif js:
                    pg.evaluate(js)
                pg.wait_for_timeout(120)
                bad += pg.evaluate(AUDIT, '%s %d' % (JP[key], w))
                if SHOTS:
                    shots[((w, h), key)] = pg.screenshot()
                    if os.environ.get('RAW'):
                        os.makedirs(os.environ['RAW'], exist_ok=True); open(os.path.join(os.environ['RAW'], '%d-%s.png' % (w, key)), 'wb').write(shots[((w, h), key)])
            pg.close()
        b.close()
    seen = set()
    for x in bad:
        k = (x[1], x[2])
        print('NG', ' '.join(map(str, x)))
    if SHOTS and not os.environ.get('W'):
        os.makedirs(OUT, exist_ok=True)
        compose(['hangar', 'shop', 'lvup', 'result'], [(320, 568), (390, 844), (1280, 800)], shots, os.path.join(OUT, '14-pr.png'), 400)
        keys = [k for k, _ in SCREENS]
        for i in range(4):
            compose(keys[i * 6:i * 6 + 6] if i < 3 else keys[18:], [(360, 740), (390, 844), (430, 932)], shots, os.path.join(OUT, '14-phone-%d.png' % (i + 1)), 400)
        compose(['title', 'hangar', 'shop', 'play', 'lvup', 'result'], [(768, 1024), (1280, 800)], shots, os.path.join(OUT, '14-wide.png'), 360)
        compose(keys[:7], [(320, 568)], shots, os.path.join(OUT, '14-320-1.png'), 400)
        compose(keys[7:14], [(320, 568)], shots, os.path.join(OUT, '14-320-2.png'), 400)
        compose(keys[14:], [(320, 568)], shots, os.path.join(OUT, '14-320-3.png'), 400)
    for e in errs[:10]:
        print('ERR', e)
    for w in warns[:10]:
        print('WARN', w)
    print('エラー', len(errs), '・警告', len(warns), '・NG', len(bad))
    sys.exit(1 if errs or warns or bad else 0)


if __name__ == '__main__':
    main()
