"""issue #13 のスクショ
- 13-stages.png：格納庫のステージのえらび方（解放ずみ・まだ）と、5ステージの出撃中
- 13-bosses.png：大型の敵7体（ステージ2〜5）の出撃中
- 13-ending.png：エンディングと結果（オメガの解放）・図鑑の敵
使い方: python3 tools/test/shots13.py [index.html] [出力フォルダ]
"""
import base64, io, os, sys, tempfile
from PIL import Image, ImageDraw, ImageFont
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from stages13 import build, HELPERS

SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', '..', 'index.html')
OUT = sys.argv[2] if len(sys.argv) > 2 else 'docs/shots'
FONT = '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
BG = (6, 10, 28)

PREP = r"""
(n)=>{const T=window.__T;T.save=T.freshSave();const s=T.save;s.gold=2860;s.howto=1;s.rec.stageMax=2;s.rec.clears=4;s.st=n;s.tut=1;s.ach.clear1=1;
  ['laser','missile','gatling','sword','shield','mine'].forEach(t=>{s.owned[t]=2;});s.ships.standard.eq=s.ships.standard.eq.map(()=>null);
  [['laser',1],['laser',2],['missile',0],['sword',3]].forEach(([t,i])=>{s.ships.standard.eq[i]={t,d:i===3?7:0};});
  T.persist();T.setShip('standard');T.toHangarFromTitle();}
"""

# ステージ n の出撃中。t 秒まで進めて、そのステージらしい場面にする
INGAME = r"""
([n,t])=>{const T=window.__T;T.save=T.freshSave();const R=window.__go(n,'standard',['laser','missile','gatling','sword'],{r_pow:3});for(const m of R.mods)R.tlv[m.t]=4;T.calcCS();
  R.bossAt=[];R.waveAt=1e9;R.need=1e9;R.x=240;R.y=Math.round(T.GH*0.72);
  R.t=t;for(let i=0;i<60*14;i++){if(R.state!=='play'){window.__stepUI();continue;}T.update(1/60);R.hp=R.maxHp*0.85;R.x=240+Math.sin(i/50)*60;R.y=Math.round(T.GH*0.72);if(R.E.length>70)R.acc=0;}
  if(n===2){T.addRock(150,T.GH*0.3,2,Math.PI/2,50);T.addRock(360,T.GH*0.45,1,Math.PI/2,50);}
  if(n===3){R.snowEnd=R.t+5;R.snow=0.8;for(let i=0;i<40;i++){T.update(1/60);R.hp=R.maxHp;}R.chill=1;}
  if(n===4){R.LZ.length=0;T.addWall(false,T.GH*0.5);for(let i=0;i<88;i++){T.update(1/60);R.hp=R.maxHp;}T.addWall(true,120);for(let i=0;i<20;i++){T.update(1/60);R.hp=R.maxHp;}}
  if(n===5){const w=T.addEnemy('warp',300,T.GH*0.5);w.st=1;w.tm=0;for(let i=0;i<8;i++){T.update(1/60);R.hp=R.maxHp;}}
  for(let i=0;i<12&&R.E[i];i++)if(R.E[i].kind!=='rock')T.shootAt(R.E[i],90,0);T.update(1/60);
  R.hurtFx=0;R.inv=0;for(const e of R.E)e.flash=0;T.draw();return document.getElementById('game').toDataURL();}
"""

BIGS = r"""
([n,art])=>{const T=window.__T;T.save=T.freshSave();const R=window.__go(n,'standard',['laser','missile','gatling'],{r_pow:3});for(const m of R.mods)R.tlv[m.t]=3;T.calcCS();
  R.bossAt=[];R.waveAt=1e9;R.need=1e9;R.acc=-1e9;R.lzAt=1e9;R.rockT=1e9;R.snowAt=1e9;R.turT=1e9;R.t=200;R.x=240;R.y=Math.round(T.GH*0.75);
  const b=T.addBig(art);b.hp=b.max*50;
  for(let i=0;i<60*(art==='snake'?9:art==='core'?5:6);i++){if(R.state!=='play'){window.__stepUI();continue;}T.update(1/60);R.hp=R.maxHp;R.x=240+Math.sin(i/40)*90;R.y=Math.round(T.GH*0.75);}
  R.hurtFx=0;for(const e of R.E)e.flash=0;T.draw();const c=document.createElement('canvas');c.width=480;c.height=560;c.getContext('2d').drawImage(document.getElementById('game'),0,0,480,560,0,0,480,560);return c.toDataURL();}
"""

ENDING = r"""
()=>{const T=window.__T;T.save=T.freshSave();T.SHIP_IDS.forEach(id=>{if(id!=='omega')T.save.ships[id].have=true;});Object.assign(T.save.rec,{clears:21,kills:48210,bosses:44,bestLv:41,time:15240});
  const R=window.__go(5,'standard',['laser','missile','gatling','sword']);R.bossAt=[];R.acc=-1e9;R.t=331;const b=T.addBig('core');T.update(1/60);T.hit(b,1e9,0,0);
  for(let i=0;i<60*4&&R.state!=='over';i++){if(R.state!=='play'){window.__chestOk();continue;}T.update(1/60);}
  document.querySelectorAll('#overlay button').forEach(x=>x.disabled=false);return R.state;}
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


def fit(im, H, nearest=True):
    return im.resize((int(im.size[0] * H / im.size[1]), H), Image.NEAREST if nearest else Image.LANCZOS)


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
        pg.evaluate(PREP, 3); pg.wait_for_timeout(250); h1 = shot(pg)
        pg.evaluate(PREP, 4); pg.wait_for_timeout(250); h2 = shot(pg)
        pg.evaluate("()=>{document.getElementById('hangar').hidden=true;document.getElementById('sortie').hidden=false;}")
        names = ['1 星の海', '2 小惑星帯', '3 氷の星雲（吹雪）', '4 機械要塞（レーザーの壁）', '5 深淵']
        G = [img_of(pg.evaluate(INGAME, [n, 120 if n < 5 else 150])) for n in range(1, 6)]
        H = 760
        ims = [label(fit(h1, H, False), '格納庫：ステージ3をえらぶ', font), label(fit(h2, H, False), 'まだのステージ（かぎ）', font)]
        ims += [label(fit(im, H), 'ステージ' + names[k], font) for k, im in enumerate(G)]
        grid(ims, 4).save(os.path.join(OUT, '13-stages.png'))
        B = [(2, 'gnaw', '岩喰い'), (2, 'gnaw2', '双頭の岩喰い'), (3, 'icebeast', '氷晶獣'), (3, 'icequeen', '氷の女王'), (4, 'fort', '要塞砲台'), (4, 'snake', '機械の大蛇'), (5, 'core', '深淵の核（最終ボス）')]
        bims = [label(img_of(pg.evaluate(BIGS, [n, a])), str(n) + ' ' + nm, font) for n, a, nm in B]
        grid(bims, 4).save(os.path.join(OUT, '13-bosses.png'))
        print('エンディング:', pg.evaluate(ENDING)); pg.wait_for_timeout(200)
        e1 = shot(pg)
        pg.evaluate("()=>{document.querySelector('#overlay .go').click();}"); pg.wait_for_timeout(200)
        e2 = shot(pg)
        pg.evaluate("()=>{const T=window.__T;document.getElementById('sortie').hidden=true;document.getElementById('overlay').hidden=true;document.getElementById('hangar').hidden=false;T.renderAll();T.openBook();document.getElementById('bookBody').scrollTop=99999;}")
        pg.wait_for_timeout(200); e3 = shot(pg)
        grid([label(fit(e1, H, False), 'エンディング', font), label(fit(e2, H, False), '結果（オメガの解放）', font), label(fit(e3, H, False), '図鑑の敵（20）', font)], 3).save(os.path.join(OUT, '13-ending.png'))
        b.close()
    print('errors', len(errs), errs[:3])


if __name__ == '__main__':
    main()
