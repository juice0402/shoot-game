"""issue #9 のスクショ：ショップの攻撃のタブ＋新しい武器を撃っている画面（並べて1枚）と、30種のアイコン（1枚）
使い方: python3 tools/test/shots9.py [index.html] [出力フォルダ]
"""
import base64, io, os, sys, tempfile
from PIL import Image, ImageDraw, ImageFont
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from weapons9 import build

SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', '..', 'index.html')
OUT = sys.argv[2] if len(sys.argv) > 2 else 'docs/shots'
NEW = ['pulse', 'rail', 'sniper', 'fan', 'ricochet', 'splitter', 'needle', 'acid', 'grenade', 'cluster', 'napalm', 'shockwave', 'torpedo', 'plasma', 'prism',
       'halo', 'hlaser', 'sonic', 'gsword', 'twin', 'lance', 'hammer', 'whip', 'chainsaw', 'scythe', 'turret', 'minefield', 'satellite', 'micro', 'emp']
SCENES = [['pulse', 'rail', 'fan', 'ricochet', 'splitter'],
          ['needle', 'acid', 'sniper', 'prism', 'hlaser'],
          ['grenade', 'cluster', 'napalm', 'torpedo', 'plasma'],
          ['shockwave', 'halo', 'sonic', 'emp', 'micro'],
          ['gsword', 'twin', 'lance', 'hammer', 'whip'],
          ['chainsaw', 'scythe', 'turret', 'minefield', 'satellite']]

SCENE = r"""
([list,want])=>{const T=window.__T;window.__HOLD=1;T.setShip('fortress');T.save.load[0]={t:'laser',d:0};T.startRun();const R=T.R,sl=T.R.sh.slots;
  R.mods=list.map((t,i)=>({t,slot:i,d:sl[i].out,cd:Math.random()*0.3}));for(const k of T.TYPES)R.tlv[k]=0;for(const t of list)R.tlv[t]=6;
  R.t=60;R.x=240;R.y=Math.round(T.GH*0.6);R.bossAt=[];R.waveAt=1e9;R.acc=-1e9;
  const top=()=>{while(R.E.length<45){const a=Math.random()*Math.PI*2,d=90+Math.random()*190;T.addEnemy(Math.random()<0.2?'tank':'bug',R.x+Math.cos(a)*d,R.y+Math.sin(a)*d*0.9);}};
  let best=null;for(let i=0;i<420;i++){top();R.hp=R.maxHp=1e7;R.pending=0;R.G.length=0;T.update(1/60);R.inv=0;R.hurtFx=0;
    if(i>150){const sc=want(R);if(!best||sc>best.sc){T.draw();best={sc,url:document.getElementById('game').toDataURL()};}}}
  return {url:best.url,x:R.x,y:R.y};}
"""
WANT = ["R=>R.B.length+R.TR.length*20",
        "R=>R.B.length+R.TR.length*30+R.PD.length*3+R.HL.length*3",
        "R=>R.Q.length*3+R.PD.length",
        "R=>R.RG.filter(r=>r.t>0&&r.t<r.dur).length*25+R.M.length",
        "R=>R.S.filter(s=>s.t>0&&s.t<s.dur).length*10+R.RG.length*5",
        "R=>R.S.filter(s=>s.t>0&&s.t<s.dur).length*10+R.TU.length*5+R.MN.length"]

def img_of(url):
    return Image.open(io.BytesIO(base64.b64decode(url.split(',', 1)[1]))).convert('RGB')

def main():
    os.makedirs(OUT, exist_ok=True)
    tmp = tempfile.mkdtemp(); pp = os.path.join(tmp, 't.html'); open(pp, 'w', encoding='utf-8').write(build(SRC))
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=1)
        pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith('file:') else r.abort())
        pg.goto('file://' + pp); pg.wait_for_timeout(600)
        # ショップの攻撃のタブ（新しい武器が見える所までスクロール）
        pg.evaluate("()=>{const T=window.__T;T.save.gold=99999;T.save.howto=1;}")
        pg.click('#startBtn'); pg.wait_for_timeout(400)
        pg.click('#shopBtn'); pg.wait_for_timeout(300)
        pg.click('#shopTabs button:nth-child(2)'); pg.wait_for_timeout(300)
        pg.evaluate("()=>{const g=document.getElementById('shopGrid');g.scrollTop=g.scrollHeight*0.22;}"); pg.wait_for_timeout(200)
        shop1 = Image.open(io.BytesIO(pg.screenshot())).convert('RGB')
        pg.evaluate("()=>{const g=document.getElementById('shopGrid');g.scrollTop=g.scrollHeight;}"); pg.wait_for_timeout(200)
        shop2 = Image.open(io.BytesIO(pg.screenshot())).convert('RGB')
        pg.click('#shopClose'); pg.wait_for_timeout(200)
        scenes = []
        for lst, w in zip(SCENES, WANT):
            r = pg.evaluate("([l,w])=>(" + SCENE + ")([l,eval(w)])", [lst, w])
            im = img_of(r['url']); cy = int(r['y']); top = max(0, cy - 250)
            scenes.append(im.crop((60, top, 420, top + 422)))
        icons = pg.evaluate("(l)=>l.map(t=>[window.__T.MODS[t].name,window.__T.ICON[t],window.__T.MODS[t].price])", NEW)
        names = dict(zip(NEW, [n for n, _, _ in icons]))
        b.close()
    # 1枚目：ショップ2枚＋撃っている画面6枚（3×2）
    font = ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc', 14)
    cw, chh = 360, 422
    W = 390 * 2 + 10 + (cw + 10) * 3
    sheet = Image.new('RGB', (W, 844), (6, 10, 28)); dr = ImageDraw.Draw(sheet)
    sheet.paste(shop1, (0, 0)); sheet.paste(shop2, (400, 0))
    for i, (im, lst) in enumerate(zip(scenes, SCENES)):
        x, y = 800 + (i % 3) * (cw + 10), (i // 3) * chh
        sheet.paste(im, (x, y))
        l1, l2 = '・'.join(names[t] for t in lst[:3]), '・'.join(names[t] for t in lst[3:]) + '（Lv6）'
        dr.rectangle((x, y, x + cw, y + 40), fill=(6, 10, 28))
        dr.text((x + 6, y + 1), l1, fill=(220, 230, 255), font=font); dr.text((x + 6, y + 20), l2, fill=(220, 230, 255), font=font)
    sheet.save(os.path.join(OUT, '9-shop-play.png'), optimize=True)
    # 2枚目：30種のアイコン（3倍）と名前
    font = ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc', 18)
    cw, ch, cols = 150, 130, 10
    ic = Image.new('RGB', (cw * cols, ch * 3), (11, 16, 40)); d = ImageDraw.Draw(ic)
    for i, (name, url, price) in enumerate(icons):
        im = Image.open(io.BytesIO(base64.b64decode(url.split(',', 1)[1]))).convert('RGBA')
        im = im.resize((im.width * 3, im.height * 3), Image.NEAREST)
        cx, cy = (i % cols) * cw, (i // cols) * ch
        ic.paste(im, (cx + (cw - im.width) // 2, cy + 6), im)
        tw = d.textlength(name, font=font); d.text((cx + (cw - tw) / 2, cy + 94), name, fill=(220, 230, 255), font=font)
    ic.save(os.path.join(OUT, '9-icons.png'), optimize=True)
    print('saved', os.path.join(OUT, '9-shop-play.png'), sheet.size, os.path.join(OUT, '9-icons.png'), ic.size)

if __name__ == '__main__':
    main()
