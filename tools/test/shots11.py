"""issue #11 のスクショ
- 11-ships.png：12機の絵（3倍・ゲームの中の大きさ・シルエット）
- 11-hangar.png：格納庫の新しい6機（はじめの武器をつけたところ）
- 11-specials.png：12機の必殺技（出ている途中・機体のまわりを切り出し）と、出撃中の画面（下に必殺ゲージ）
使い方: python3 tools/test/shots11.py [index.html] [出力フォルダ]
"""
import base64, io, os, sys, tempfile
from PIL import Image, ImageDraw, ImageFont
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from ships11 import build, HELPERS, NEW

SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', '..', 'index.html')
OUT = sys.argv[2] if len(sys.argv) > 2 else 'docs/shots'
FONT = '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
BG = (6, 10, 28)
# 必殺技を切り出す時間（秒）
AT = {'standard': 0.3, 'rapid': 1.2, 'fortress': 0.22, 'collector': 0.2, 'blade': 0.42, 'carrier': 1.6,
      'marksman': 0.62, 'bomber': 0.95, 'phantom': 1.2, 'vanguard': 0.3, 'alchemist': 0.2, 'omega': 0.62}

SCENE = r"""
([id,at])=>{const T=window.__T,R=window.__go(id,null);const sl=R.sh.slots;let k=0;
  for(let i=0;i<sl.length&&k<2;i++)if(!T.save.load[i]){R.mods.push({t:'laser',slot:i,d:0,cd:0.2});k++;}
  for(const m of R.mods)R.tlv[m.t]=Math.max(R.tlv[m.t],5);T.calcCS();
  R.t=100;R.x=240;R.y=Math.round(T.GH*0.7);R.bossAt=[];R.waveAt=1e9;R.acc=-1e9;R.need=1e9;
  const fill=()=>{while(R.E.length<70){const a=Math.random()*Math.PI*2,d=120+Math.random()*230;T.addEnemy(Math.random()<0.2?'tank':Math.random()<0.15?'shooter':'bug',R.x+Math.cos(a)*d,R.y-80+Math.sin(a)*d);}};
  if(id==='marksman'){const b=T.addEnemy('boss',240,R.y-330);b.hp=b.max=1e6;}
  for(let i=0;i<90;i++){fill();T.update(1/60);R.hp=R.maxHp;R.x=240;R.y=Math.round(T.GH*0.7);R.G.length=Math.min(R.G.length,60);}
  for(let i=0;i<14;i++)T.shootAt(R.E[i],92,(Math.random()-0.5)*0.4,i%5===0);
  for(let i=0;i<10;i++)T.update(1/60);
  R.gauge=T.SPG.max;let f=0;while(!R.sp&&f<5){T.update(1/60);f++;}
  while(R.sp&&R.sp.t<at){if(id!=='vanguard'&&id!=='bomber'&&id!=='blade'&&id!=='omega')fill();T.update(1/60);R.hp=R.maxHp;}
  R.hurtFx=0;R.inv=0;T.draw();return {url:document.getElementById('game').toDataURL(),x:R.x,y:R.y,gh:T.GH};}
"""


def img_of(url):
    return Image.open(io.BytesIO(base64.b64decode(url.split(',', 1)[1]))).convert('RGB')


def main():
    os.makedirs(OUT, exist_ok=True)
    tmp = tempfile.mkdtemp(); pp = os.path.join(tmp, 't.html'); open(pp, 'w', encoding='utf-8').write(build(SRC))
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=1)
        pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith('file:') else r.abort())
        pg.goto('file://' + pp); pg.wait_for_timeout(600)
        pg.evaluate(HELPERS)
        pg.evaluate("()=>{const T=window.__T;T.save.howto=1;T.save.tut=1;}")
        pg.click('#startBtn'); pg.wait_for_timeout(300)
        names = pg.evaluate("()=>{const T=window.__T;return Object.fromEntries(T.SHIP_IDS.map(k=>[k,[T.SHIPS[k].name,T.SHIPS[k].sp.name]]));}")
        # 12機の絵
        sprites = pg.evaluate("()=>{const T=window.__T,A=document.createElement('canvas');return T.SHIP_IDS.map(k=>{const s=T.SHIPSPR[k],c=document.createElement('canvas');c.width=s.w;c.height=s.h+8;const g=c.getContext('2d');g.drawImage(s.fl[1],0,0);g.drawImage(s.img,0,0);"
                              "const q=document.createElement('canvas');q.width=s.w;q.height=s.h;const h=q.getContext('2d');h.drawImage(s.img,0,0);h.globalCompositeOperation='source-in';h.fillStyle='#8890c8';h.fillRect(0,0,s.w,s.h);return [k,c.toDataURL(),q.toDataURL()];});}")
        # 格納庫：新しい6機（持っている・はじめの武器）
        pg.evaluate("()=>{const T=window.__T;for(const id of T.SHIP_IDS){T.save.ships[id].have=true;T.save.ships[id].eq=T.SHIPS[id].slots.map(()=>null);T.SHIPS[id].start.forEach(v=>{T.save.ships[id].eq[v.s]={t:v.t,d:v.d};T.save.owned[v.t]=Math.max(1,T.save.owned[v.t]);});}T.save.gold=2400;T.persist();}")
        hang = []
        for sid in NEW:
            pg.evaluate("(id)=>{window.__T.viewShip(id);window.__T.layoutEditor();window.__T.renderAll();}", sid); pg.wait_for_timeout(150)
            hang.append(Image.open(io.BytesIO(pg.screenshot())).convert('RGB'))
        # ショップのくわしく（オメガ：解放の条件）
        pg.evaluate("()=>{const T=window.__T;T.save.ships.omega.have=false;T.openShop('omega');}"); pg.wait_for_timeout(250)
        shop = Image.open(io.BytesIO(pg.screenshot())).convert('RGB')
        pg.evaluate("()=>{window.__T.closeSheet();document.getElementById('shopSheet').hidden=true;}")
        # 必殺技
        pg.evaluate("()=>{document.getElementById('hangar').hidden=true;document.getElementById('sortie').hidden=false;window.__T.save.ships.omega.have=true;}")
        tiles = []
        for sid in pg.evaluate("()=>window.__T.SHIP_IDS"):
            r = pg.evaluate(SCENE, [sid, AT[sid]])
            im = img_of(r['url']); cx, cy = int(r['x']), int(r['y'])
            top = max(0, min(int(r['gh']) - 470, cy - 360))
            tiles.append((sid, im.crop((60, top, 420, top + 470))))
        # 出撃中の画面（必殺ゲージが半分くらい）
        pg.evaluate("()=>{const T=window.__T,R=window.__go('vanguard',null);R.t=40;R.gauge=62;for(let i=0;i<60;i++){T.update(1/60);R.hp=R.maxHp;}R.gauge=62;T.draw();T.hud();}"); pg.wait_for_timeout(100)
        sortie = Image.open(io.BytesIO(pg.screenshot())).convert('RGB')
        b.close()
    font = ImageFont.truetype(FONT, 16); fs = ImageFont.truetype(FONT, 13)
    # 1) 12機の絵
    K = 3; cw = 84 * K + 16
    sheet = Image.new('RGB', (cw * 6, 2 * (88 * K + 90)), BG); dr = ImageDraw.Draw(sheet)
    for j, (k, u, s) in enumerate(sprites):
        im = Image.open(io.BytesIO(base64.b64decode(u.split(',')[1]))).convert('RGBA'); sil = Image.open(io.BytesIO(base64.b64decode(s.split(',')[1]))).convert('RGBA')
        x0 = (j % 6) * cw; y0 = (j // 6) * (88 * K + 90)
        big = im.resize((im.width * K, im.height * K), Image.NEAREST); sheet.paste(big, (x0 + (cw - big.width) // 2, y0 + 8), big)
        sheet.paste(im, (x0 + 14, y0 + 88 * K - 30), im); sheet.paste(sil, (x0 + cw - sil.width - 14, y0 + 88 * K - 30), sil)
        dr.text((x0 + cw // 2 - 40, y0 + 88 * K + 58), names[k][0], fill=(220, 230, 255), font=font)
    sheet.save(os.path.join(OUT, '11-ships.png'))
    # 2) 格納庫
    sh2 = Image.new('RGB', (400 * 7 - 10, 844), BG)
    for i, im in enumerate(hang + [shop]):
        sh2.paste(im, (i * 400, 0))
    sh2.save(os.path.join(OUT, '11-hangar.png'))
    # 3) 必殺技
    tw, th = 360, 470
    sh3 = Image.new('RGB', (6 * (tw + 10) + 400, 2 * (th + 34)), BG); dr = ImageDraw.Draw(sh3)
    for i, (k, im) in enumerate(tiles):
        x0 = (i % 6) * (tw + 10); y0 = (i // 6) * (th + 34)
        sh3.paste(im, (x0, y0 + 30)); dr.text((x0 + 6, y0 + 6), names[k][0] + '：' + names[k][1], fill=(220, 230, 255), font=font)
    sx = 6 * (tw + 10) + 10
    hh = 2 * (th + 34) - 40
    sh3.paste(sortie.resize((int(390 * hh / 844), hh)), (sx, 30))
    dr.text((sx, 6), '出撃中（下が必殺ゲージ）', fill=(220, 230, 255), font=fs)
    sh3.save(os.path.join(OUT, '11-specials.png'))
    print('ok', [os.path.join(OUT, n) for n in ('11-ships.png', '11-hangar.png', '11-specials.png')])


if __name__ == '__main__':
    main()
