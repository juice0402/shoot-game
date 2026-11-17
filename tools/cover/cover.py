"""ゲーム工房の表紙（800x1200）を、ゲームのドット絵で描く（11/17・ぜんぶのせシップ）
- FONTS=<@fontsource/dotgothic16 を npm pack して広げた場所> python3 tools/cover/cover.py
- 出るもの：docs/kobo/cover.png（決まった表紙）・cover-b.png（くらべた案「カスタムシップ」）と、ロゴの形（index.html の LOGO）
"""
import sys, os, re, base64, json
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
sys.path.insert(0, os.path.join(ROOT, 'tools', 'test'))
from harness14 import write_build, open_page
from playwright.sync_api import sync_playwright
D = os.path.dirname(os.path.abspath(__file__))
FD = os.environ.get('FONTS', '')  # npm pack @fontsource/dotgothic16 を広げた所（package）
OUT = os.environ.get('OUT', os.path.join(ROOT, 'docs', 'kobo'))
TEXT = 'ぜんぶのせシップカスタムシューティング×サバイバー'
css = open(os.path.join(FD, '400.css'), encoding='utf-8').read()
def cps(ur):
    out = []
    for part in ur.split(','):
        part = part.strip()[2:]
        a, _, b = part.partition('-'); out.append((int(a, 16), int(b or a, 16)))
    return out
fonts = []
for blk in re.findall(r'@font-face\s*\{(.*?)\}', css, re.S):
    f = re.search(r'url\(\./files/([^)]+\.woff2)\)', blk).group(1); ur = re.search(r'unicode-range:\s*([^;]+);', blk).group(1)
    rs = cps(ur)
    if any(any(a <= ord(ch) <= b for a, b in rs) for ch in TEXT):
        fonts.append(['DG', base64.b64encode(open(os.path.join(FD, 'files', f), 'rb').read()).decode(), ur])
print('font slices', len(fonts))
patch = [("document.querySelectorAll('.gname').forEach(e=>{e.textContent=GAME_NAME;});",
          "window.__A={SHIPSPR,SHIPS,MSPR,MODS,ESPR,NEB,PLANETS,GEMS,MISC,MECH};document.querySelectorAll('.gname').forEach(e=>{e.textContent=GAME_NAME;});")]
pp = write_build(patch=patch)
js = open(os.path.join(D, 'cover.js'), encoding='utf-8').read()
with sync_playwright() as p:
    b = p.chromium.launch(); errs = []
    pg = open_page(b, pp, 390, 844, errs)
    res = pg.evaluate(js, {'fonts': fonts})
    print('LOGO の形（index.html の LOGO）:', json.dumps(res.pop('masks')))
    for k, v in res.items():
        open(os.path.join(OUT, 'cover.png' if k == 'a' else f'cover-{k}.png'), 'wb').write(base64.b64decode(v.split(',')[1]))
    print('errs', errs[:3]); b.close()
