"""issue #10 のスクショ
- 10-shop-evo.png：ショップの防御・補助のタブ／くわしく（進化：？？？）／レベルアップの「進化」／進化した武器を撃っている画面（並べて1枚）
- 10-evolved.png：進化14種を1つずつ撃っている画面（並べて1枚）
- 10-icons.png：防御・補助20種と進化14種のアイコン
使い方: python3 tools/test/shots10.py [index.html] [出力フォルダ]
"""
import base64, io, os, sys, tempfile
from PIL import Image, ImageDraw, ImageFont
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from parts10 import build, HELPERS, NEW

SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', '..', 'index.html')
OUT = sys.argv[2] if len(sys.argv) > 2 else 'docs/shots'
FONT = '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'

SCENE = r"""
([list,dirs,frames,ne])=>{const T=window.__T;window.__HOLD=1;T.setShip('fortress');T.save.load[0]={t:'laser',d:0};T.startRun();const R=T.R,sl=R.sh.slots;
  R.mods=list.map((t,i)=>({t,slot:i,d:dirs?dirs[i]:0,cd:Math.random()*0.3}));T.calcCS();for(const k of T.TYPES)R.tlv[k]=0;
  for(const t of list)if(!T.MODS[t].passive)R.tlv[t]=8;for(const t of list)if(T.EVO[t])T.evolve(t);
  R.t=60;R.x=240;R.y=Math.round(T.GH*0.62);R.bossAt=[];R.waveAt=1e9;R.acc=-1e9;R.G.length=0;
  const top=()=>{while(R.E.length<(ne||55)){const a=Math.random()*Math.PI*2,d=110+Math.random()*200;T.addEnemy(Math.random()<0.25?'tank':'bug',R.x+Math.cos(a)*d,R.y+Math.sin(a)*d*0.9);}};
  const sc=()=>R.B.length+R.M.length*3+R.L.length*60+R.Z.length*60+R.S.filter(s=>s.t>0&&s.t<s.dur).length*40+R.GV.filter(o=>o.bh).length*200+R.GV.length*30+R.MN.length*4+R.C.length*5
    +R.mods.reduce((n,m)=>n+(m.bm!=null&&R.t-m.bm<0.1?60:0)+(m.gp?m.gp.length*10:0),0);
  let best=null;for(let i=0;i<frames;i++){top();R.hp=R.maxHp=1e7;R.pending=0;R.G.length=0;if(i%50===0)for(let k=0;k<6;k++)T.shootAt(R.E[k],92,0);T.update(1/60);R.inv=0;R.hurtFx=0;R.x=240;R.y=Math.round(T.GH*0.62);
    if(i>200){const s=sc();if(!best||s>best.sc){T.draw();best={sc:s,url:document.getElementById('game').toDataURL()};}}}
  return {url:best.url,x:R.x,y:R.y};}
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
        pg.evaluate("()=>{const T=window.__T;T.save.gold=99999;T.save.howto=1;T.save.evo={};T.save.owned.sdrone=1;T.save.owned.crit=2;}")
        pg.click('#startBtn'); pg.wait_for_timeout(400)
        pg.click('#shopBtn'); pg.wait_for_timeout(300)
        pg.click('#shopTabs button:nth-child(3)'); pg.wait_for_timeout(300)
        pg.evaluate("()=>{const g=document.getElementById('shopGrid');g.scrollTop=g.scrollHeight;}"); pg.wait_for_timeout(200)
        shop_def = Image.open(io.BytesIO(pg.screenshot())).convert('RGB')
        pg.click('#shopTabs button:nth-child(4)'); pg.wait_for_timeout(300)
        pg.evaluate("()=>{const g=document.getElementById('shopGrid');g.scrollTop=g.scrollHeight;}"); pg.wait_for_timeout(200)
        shop_sup = Image.open(io.BytesIO(pg.screenshot())).convert('RGB')
        pg.evaluate("()=>window.__T.openDetail('laser')"); pg.wait_for_timeout(300)
        detail = Image.open(io.BytesIO(pg.screenshot())).convert('RGB')
        pg.evaluate("()=>window.__T.closeSheet()"); pg.click('#shopClose'); pg.wait_for_timeout(200)
        # レベルアップの「進化」
        pg.evaluate("()=>{const T=window.__T,R=window.__go(['laser','cooler','gatling','sdrone'],{laser:8,gatling:5,sdrone:3});R.pending=1;R.t=150;T.draw();T.openLevelUp();}")
        pg.wait_for_timeout(500)
        lvup = Image.open(io.BytesIO(pg.screenshot())).convert('RGB')
        pg.evaluate("()=>{const o=document.getElementById('overlay');o.hidden=true;window.__T.R.state='play';}")
        # 進化した武器をいくつか撃っている画面（機体ごと）
        r = pg.evaluate(SCENE, [['cannon', 'sword', 'plasma', 'laser', 'saw', 'sdrone', 'fshield'], [0, 7, 1, 0, 2, 0, 0], 520])
        im = img_of(r['url']); cy = int(r['y']); top = max(0, cy - 420)
        play = im.crop((0, top, 480, top + 640)).resize((390, 520), Image.NEAREST)
        # 進化14種
        evo = pg.evaluate("()=>Object.keys(window.__T.EVO).map(t=>[t,window.__T.EVO[t].name,window.__T.EVO[t].p])")
        tiles = []
        for t, name, partner in evo:
            r = pg.evaluate(SCENE, [[t, partner], [0, 0], 420, 28])
            im = img_of(r['url']); cy = int(r['y']); top = max(0, cy - 270)
            tiles.append((name, im.crop((75, top, 405, top + 360))))
        icons = pg.evaluate("(l)=>l.map(t=>[window.__T.MODS[t].name,window.__T.ICON[t]]).concat(Object.keys(window.__T.EVO).map(t=>[window.__T.EVO[t].name,window.__T.ICONE[t]]))", NEW)
        b.close()
    font = ImageFont.truetype(FONT, 15)
    # 1枚目
    W = 390 * 5 + 40
    sheet = Image.new('RGB', (W, 844), (6, 10, 28)); dr = ImageDraw.Draw(sheet)
    for i, im in enumerate([shop_def, shop_sup, detail, lvup]):
        sheet.paste(im, (i * 400, 0))
    sheet.paste(play, (1600, 160))
    dr.text((1606, 110), '進化した武器（極光ビーム・星斬りの剣', fill=(220, 230, 255), font=font); dr.text((1606, 132), '小さな太陽・ハイパーレーザー・永久ノコ）', fill=(220, 230, 255), font=font)
    sheet.save(os.path.join(OUT, '10-shop-evo.png'), optimize=True)
    # 2枚目：進化14種（5×3）
    cw, ch, cols = 330, 360, 5
    ev = Image.new('RGB', (cw * cols + 10 * (cols - 1), ch * 3 + 20), (6, 10, 28)); d = ImageDraw.Draw(ev)
    for i, (name, im) in enumerate(tiles):
        x, y = (i % cols) * (cw + 10), (i // cols) * (ch + 10)
        ev.paste(im, (x, y)); d.rectangle((x, y, x + cw, y + 24), fill=(6, 10, 28)); d.text((x + 6, y + 2), name, fill=(220, 230, 255), font=font)
    ev.save(os.path.join(OUT, '10-evolved.png'), optimize=True)
    # 3枚目：アイコン
    font = ImageFont.truetype(FONT, 15)
    cw, ch, cols = 150, 120, 10
    rows = (len(icons) + cols - 1) // cols
    ic = Image.new('RGB', (cw * cols, ch * rows), (11, 16, 40)); d = ImageDraw.Draw(ic)
    for i, (name, url) in enumerate(icons):
        im = Image.open(io.BytesIO(base64.b64decode(url.split(',', 1)[1]))).convert('RGBA')
        im = im.resize((im.width * 3, im.height * 3), Image.NEAREST)
        cx, cy = (i % cols) * cw, (i // cols) * ch
        ic.paste(im, (cx + (cw - im.width) // 2, cy + 4), im)
        tw = d.textlength(name, font=font); d.text((cx + (cw - tw) / 2, cy + 92), name, fill=(220, 230, 255), font=font)
    ic.save(os.path.join(OUT, '10-icons.png'), optimize=True)
    print('saved', sheet.size, ev.size, ic.size)


if __name__ == '__main__':
    main()
