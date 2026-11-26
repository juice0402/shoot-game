"""Game Center の実績バッジ（1024×1024・RGB・透明なし・文字なし）を、ゲームのドット絵で描く（11/26）
- python3 tools/badges/badges.py            … docs/kobo/achievements/<id>.png を作る
- python3 tools/badges/badges.py 一覧.png   … それに加えて、全部をならべた1枚（たしかめ用）
- 読むもの：docs/kobo/gamecenter.json（実績の id と点）。場面は badges.js の SCENE（id ごと）。メダルの色は点で決まる（10 銅・25 銀・50 金・100 虹）
"""
import sys, os, io, json, base64
from PIL import Image
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
sys.path.insert(0, os.path.join(ROOT, 'tools', 'test'))
from harness14 import write_build, open_page
from playwright.sync_api import sync_playwright
D = os.path.dirname(os.path.abspath(__file__))
KOBO = os.path.join(ROOT, 'docs', 'kobo')
gc = json.load(open(os.path.join(KOBO, 'gamecenter.json'), encoding='utf-8'))
lst = [[a['id'], a['points']] for a in gc['achievements']]
patch = [("document.querySelectorAll('.gname').forEach(e=>{e.textContent=GAME_NAME;});",
          "window.__A={SHIPSPR,SHIPS,MSPR,MSPRE,ESPR,MISC,MECH,NEB,paint,MCOL,MRAD};document.querySelectorAll('.gname').forEach(e=>{e.textContent=GAME_NAME;});")]
pp = write_build(patch=patch)
js = open(os.path.join(D, 'badges.js'), encoding='utf-8').read()
with sync_playwright() as p:
    b = p.chromium.launch(); errs = []
    pg = open_page(b, pp, 390, 844, errs)
    res = pg.evaluate(js, {'list': lst})
    b.close()
if res['miss']: sys.exit('場面か点がない: ' + ', '.join(res['miss']))
ims = []
for a in gc['achievements']:
    im = Image.open(io.BytesIO(base64.b64decode(res['out'][a['id']].split(',')[1]))).convert('RGB')
    assert im.size == (1024, 1024)
    im.save(os.path.join(KOBO, a['image']), optimize=True, dpi=(72, 72)); ims.append(im)
print(len(ims), '枚', 'errs', errs[:3])
if len(sys.argv) > 1:  # 一覧（5列・1枚 200px）
    n, s, m = 5, 200, 12
    rows = (len(ims) + n - 1) // n
    sheet = Image.new('RGB', (n * s + (n + 1) * m, rows * s + (rows + 1) * m), (40, 40, 40))
    for i, im in enumerate(ims):
        sheet.paste(im.resize((s, s), Image.NEAREST), (m + (i % n) * (s + m), m + (i // n) * (s + m)))
    sheet.save(sys.argv[1])
