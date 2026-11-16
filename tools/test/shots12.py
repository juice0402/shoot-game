"""issue #12 のスクショ
- 12-screens.png：格納庫（研究所・図鑑・実績の入口）・レベルアップ（色の枠・特別・進化・えらび直し）・宝箱・研究所・図鑑・実績
- 12-ingame.png：出撃中の新しい支援（氷の結界・炎のオーラ・盾の衛星・回復ドローン・支援砲撃・流れ星・雷雲・宝箱）と時間停止、新しいアイコン
使い方: python3 tools/test/shots12.py [index.html] [出力フォルダ]
"""
import base64, io, os, sys, tempfile
from PIL import Image, ImageDraw, ImageFont
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from upgrades12 import build, HELPERS

SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', '..', 'index.html')
OUT = sys.argv[2] if len(sys.argv) > 2 else 'docs/shots'
FONT = '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
BG = (6, 10, 28)

PREP = r"""
()=>{const T=window.__T;T.save=T.freshSave();const s=T.save;s.gold=4210;s.howto=1;
  ['laser','missile','gatling','sword','shield','mine','thunder','cooler','scope','amp','magnet','armor','saw','flame','grenade','dur','crit','multi'].forEach(t=>{s.owned[t]=2;});
  ['rapid','fortress','blade'].forEach(id=>{s.ships[id].have=true;});s.evo.laser=1;s.evo.missile=1;s.rec.evos=2;
  s.book.e={bug:812,tank:140,shooter:66,boss:3};
  Object.assign(s.lab,{r_hp:3,r_pow:2,r_rate:2,r_spd:1,r_mag:2,r_xp:1,r_gold:2,r_reroll:2,r_skip:1,r_ban:1,r_lv:1,r_slot:1});T.ensureSlots(s);
  s.rec.clears=3;s.rec.bosses=6;s.rec.kills=2400;s.rec.bestKills=760;s.rec.halfClear=1;s.rec.goldTotal=6100;s.rec.bestLv=24;s.rec.chests=4;s.rec.spTotal=21;s.rec.wmax={laser:8};
  T.checkAch();s.gold=4210;T.persist();T.setShip('standard');T.toHangarFromTitle();}
"""

LVUP = r"""
()=>{const T=window.__T;window.__HOLD=1;document.getElementById('hangar').hidden=true;document.getElementById('sortie').hidden=false;
  const s=T.save;s.ships.standard.eq=s.ships.standard.eq.map(()=>null);[['laser',1],['laser',2],['cooler',0],['missile',3],['sword',4]].forEach(([t,i])=>{s.ships.standard.eq[i]={t,d:i===4?7:0};});T.setShip('standard');
  T.startRun();const R=T.R;R.pending=0;R.bossAt=[];R.waveAt=1e9;R.tlv.laser=8;R.tlv.missile=4;R.tlv.sword=3;R.lv=9;R.pas.speed=2;R.pas.critc=1;R.sup.thunder=2;R.sup.frostaura=1;T.calcCS();
  for(let i=0;i<40;i++){window.__fill(60);T.update(1/60);R.hp=R.maxHp;}R.lv=9;
  for(let k=0;k<500;k++){R.pending=1;T.openLevelUp();const c=T.lvChoices;if(c.some(o=>o.spc)&&c.some(o=>o.evo)&&c.some(o=>o.cat==='s'||o.cat==='p'))break;}
  T.draw();document.querySelectorAll('#overlay button').forEach(b=>{if(!b.closest('.lvacts')||!b.disabled)b.disabled=false;});return T.lvChoices.map(o=>o.name).join(',');}
"""

CHEST = r"""
()=>{const T=window.__T,R=T.R;R.pending=0;R.chestQ=1;T.openChest();return [...document.querySelectorAll('#overlay .card b')].map(b=>b.textContent).join(',');}
"""

INGAME = r"""
(stop)=>{const T=window.__T;window.__lab0();const R=window.__go('standard',['laser','missile','sword']);R.t=100;R.bossAt=[];R.waveAt=1e9;R.acc=-1e9;R.need=1e9;
  for(const k of T.SUP_NEW)for(let i=0;i<(k==='timestop'?1:3);i++)T.supUp(k);R.tsT=1e9;R.mdT=0.5;R.bsT=0.4;R.thT=1.6;R.msT=1.2;T.calcCS();
  const fill=()=>{while(R.E.length<55){const a=Math.random()*Math.PI*2,d=110+Math.random()*230;T.addEnemy(Math.random()<0.2?'tank':Math.random()<0.15?'shooter':'bug',R.x+Math.cos(a)*d,R.y-120+Math.sin(a)*d);}};
  R.x=250;R.y=Math.round(T.GH*0.66);
  for(let i=0;i<100;i++){fill();T.update(1/60);R.hp=R.maxHp*0.8;R.x=250;R.y=Math.round(T.GH*0.66);R.G.length=Math.min(R.G.length,30);}
  R.CH.push({x:150,y:R.y-60,vy:0,t:0,dead:false,pull:false,sp:100});
  for(let i=0;i<10;i++)T.shootAt(R.E[i],92,(Math.random()-0.5)*0.4,i%5===0);
  if(stop){R.tstop=2;R.tsT=24;}
  let f=0;while(f<60&&!(R.MT.some(m=>m.t>0.05&&m.t<0.25)&&R.BS&&R.BS.x>60&&R.BS.x<GWX())){fill();T.update(1/60);R.hp=R.maxHp*0.8;R.x=250;R.y=Math.round(T.GH*0.66);f++;}
  function GWX(){return 420;}
  R.thT=0;T.update(1/60);R.hurtFx=0;R.inv=0;T.draw();return document.getElementById('game').toDataURL();}
"""

ICONS = r"""
async ()=>{const T=window.__T;const L=[...T.PAS_NEW.map(k=>T.PICON[k]),...T.SUP_NEW.map(k=>T.SICON[k]),...T.SPC_IDS.map(k=>T.XICON[k]),...T.LAB.map(o=>T.LICON[o.id]),...T.MEDAL];
  const S=3,W=10,c=document.createElement('canvas');c.width=W*(20*S+12)+12;c.height=Math.ceil(L.length/W)*(22*S+12)+12;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.fillStyle='#14163a';g.fillRect(0,0,c.width,c.height);
  for(let i=0;i<L.length;i++){const im=new Image();im.src=L[i];await im.decode();g.drawImage(im,12+(i%W)*(20*S+12),12+((i/W)|0)*(22*S+12),im.width*S,im.height*S);}
  return c.toDataURL();}
"""


def img_of(url):
    return Image.open(io.BytesIO(base64.b64decode(url.split(',', 1)[1]))).convert('RGB')


def shot(pg):
    return Image.open(io.BytesIO(pg.screenshot())).convert('RGB')


def label(im, txt, font):
    w, h = im.size
    out = Image.new('RGB', (w, h + 34), BG)
    out.paste(im, (0, 34))
    ImageDraw.Draw(out).text((6, 4), txt, font=font, fill=(236, 234, 255))
    return out


def grid(ims, cols, gap=12):
    w = max(i.size[0] for i in ims); h = max(i.size[1] for i in ims)
    rows = (len(ims) + cols - 1) // cols
    out = Image.new('RGB', (cols * w + (cols + 1) * gap, rows * h + (rows + 1) * gap), BG)
    for k, im in enumerate(ims):
        out.paste(im, (gap + (k % cols) * (w + gap), gap + (k // cols) * (h + gap)))
    return out


def main():
    os.makedirs(OUT, exist_ok=True)
    font = ImageFont.truetype(FONT, 20)
    tmp = tempfile.mkdtemp(); pp = os.path.join(tmp, 't.html'); open(pp, 'w', encoding='utf-8').write(build(SRC))
    errs = []
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=1)
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith('file:') else r.abort())
        pg.goto('file://' + pp); pg.wait_for_timeout(600)
        pg.evaluate(HELPERS)
        pg.evaluate("()=>{window.__T.save.howto=1;}")
        pg.click('#startBtn'); pg.wait_for_timeout(200)
        pg.evaluate(PREP); pg.wait_for_timeout(300)
        S = [('格納庫', shot(pg))]
        print('レベルアップ:', pg.evaluate(LVUP)); pg.wait_for_timeout(100)
        S.append(('レベルアップ', shot(pg)))
        pg.evaluate("()=>{const T=window.__T;T.pickChoice(T.lvChoices[0]);}")
        print('宝箱:', pg.evaluate(CHEST)); pg.wait_for_timeout(450)
        S.append(('宝箱', shot(pg)))
        pg.evaluate("()=>{const T=window.__T;document.getElementById('sortie').hidden=true;document.getElementById('overlay').hidden=true;document.getElementById('hangar').hidden=false;T.renderAll();T.openLab();}")
        pg.wait_for_timeout(150); S.append(('研究所', shot(pg)))
        pg.evaluate("()=>{const T=window.__T;T.openLabDetail('r_pow');}"); pg.wait_for_timeout(150); lab2 = shot(pg)
        pg.evaluate("()=>{const T=window.__T;T.closeSheet();T.closeLab();T.openBook();}"); pg.wait_for_timeout(150); S.append(('図鑑', shot(pg)))
        pg.evaluate("()=>{const T=window.__T;T.closeBook();T.openAch();}"); pg.wait_for_timeout(150); S.append(('実績', shot(pg)))
        pg.evaluate("()=>{window.__T.closeAch();}")
        g = grid([label(im.resize((312, 675), Image.LANCZOS), t, font) for t, im in S], 3)
        g.save(os.path.join(OUT, '12-screens.png'))
        # 出撃中
        pg.evaluate("()=>{document.getElementById('hangar').hidden=true;document.getElementById('sortie').hidden=false;}")
        a = img_of(pg.evaluate(INGAME, False)); c = img_of(pg.evaluate(INGAME, True))
        H = 900
        ims = [label(a.resize((int(a.size[0] * H / a.size[1]), H), Image.NEAREST), '出撃中：新しい支援8種と宝箱', font),
               label(c.resize((int(c.size[0] * H / c.size[1]), H), Image.NEAREST), '時間停止（敵と敵の弾が止まる）', font),
               label(lab2.resize((int(lab2.size[0] * H / lab2.size[1]), H), Image.LANCZOS), '研究所のくわしく', font)]
        ic = img_of(pg.evaluate(ICONS))
        g2 = grid(ims, 3)
        out = Image.new('RGB', (max(g2.size[0], ic.size[0] + 24), g2.size[1] + ic.size[1] + 46), BG)
        out.paste(g2, (0, 0)); ImageDraw.Draw(out).text((12, g2.size[1] + 2), '新しいアイコン（機体の強化12・支援8・特別8・研究所15・メダル）', font=font, fill=(236, 234, 255))
        out.paste(ic, (12, g2.size[1] + 34)); out.save(os.path.join(OUT, '12-ingame.png'))
        b.close()
    print('errors', len(errs), errs[:3])


if __name__ == '__main__':
    main()
