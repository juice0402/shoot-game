"""Game Center（#42・11/26）：gamecenter.json とバッジの絵の点検と、ゲームの中の APP_SCORE・APP_ACHIEVE の呼び出し
- python3 tools/test/gc42.py
- 見ること：json の形と Apple の決まり（1つ100点まで・合計1000まで・id の文字）・ゲームの GC_ACH と同じ15こ・バッジは 1024×1024 の RGB
  ブラウザ（APP_ がない）でエラーなし・開いたときに取ってある実績と最高記録を送る・'app-gamecenter' で送りなおす・実績を取ったときに送る
"""
import os, re, sys, json
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness14 import write_build
from playwright.sync_api import sync_playwright
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
KOBO = os.path.join(ROOT, 'docs', 'kobo')
ng = []
def ok(c, m):
    print(('ok  ' if c else 'NG  ') + m)
    if not c: ng.append(m)

# ---- json とバッジ ----
gc = json.load(open(os.path.join(KOBO, 'gamecenter.json'), encoding='utf-8'))
lb, ach = gc['leaderboard'], gc['achievements']
ok(lb['id'] == 'shoot_best' and lb['name']['ja'] and lb['name']['en-US'], 'ランキング shoot_best と名前（ja・en-US）')
ok(10 <= len(ach) <= 15, f'実績の数 {len(ach)}（10〜15）')
pts = [a['points'] for a in ach]
ok(all(0 < p <= 100 for p in pts) and sum(pts) <= 1000, f'点 1つ100まで・合計 {sum(pts)}（1000まで）')
ok(all(re.fullmatch(r'shoot_[a-z0-9_]+', a['id']) and len(a['id']) <= 100 for a in ach), 'id は shoot_ と英小文字・数字・_')
ok(len({a['id'] for a in ach}) == len(ach), 'id がかぶらない')
ok(all(a[l][k] for a in ach for l in ('ja', 'en-US') for k in ('name', 'before', 'after')), 'ja と en-US の名前・条件・取ったあと')
ok(all(len(a['ja']['name']) <= 12 for a in ach), '日本語の名前は12字まで')
ok([a['id'] for a in ach if a['hidden']] == ['shoot_stage5'], '隠し実績は「深淵の先へ」だけ')
ok(not any(re.search(r'ステージ\s*[0-9５]', a['ja']['before'] + a['ja']['after']) for a in ach), 'ステージの数を書かない')
for a in ach:
    p = os.path.join(KOBO, a['image'])
    if not os.path.exists(p): ok(False, 'バッジがない ' + a['image']); continue
    im = Image.open(p); ok(im.size == (1024, 1024) and im.mode == 'RGB', f"バッジ {a['image']} 1024×1024・RGB")

# ---- ゲームの中の呼び出し ----
STUB = "window.__gc=[];window.APP_SCORE=n=>__gc.push('S'+n);window.APP_ACHIEVE=id=>__gc.push('A'+id);"
patch = [("showTitle();gcSync();", "showTitle();gcSync();window.__GC={checkAch,GC_ACH,gcId,ACH,freshSave};")]
pp = write_build(patch=patch)
with sync_playwright() as p:
    b = p.chromium.launch()
    # ブラウザ（APP_ がない）
    ctx = b.new_context(viewport={'width': 390, 'height': 844}); ctx.add_init_script('window.__NOFX=true')
    pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + pp); pg.wait_for_timeout(600)
    g = pg.evaluate("[__GC.GC_ACH.map(__GC.gcId), __GC.GC_ACH.filter(id=>!__GC.ACH.some(a=>a.id===id))]")
    ok(g[0] == [a['id'] for a in ach], 'ゲームの GC_ACH と gamecenter.json が同じ15こ・同じ順')
    ok(g[1] == [], 'GC_ACH はみんなゲームの実績（ACH）にある')
    pg.evaluate("window.dispatchEvent(new Event('app-gamecenter'))")
    ok(errs == [], 'ブラウザ（APP_ がない）でエラーなし ' + ' '.join(errs[:2]))
    # 取ってある実績と最高記録の入ったセーブ
    pg.evaluate("""()=>{const s=__GC.freshSave();delete s.load;s.ach={clear1:1,sup1:1,stage5:1};s.rec.bestKills=1234;s.rec.clears=10;s.tut=1;s.howto=1;localStorage.setItem('shoot-proto-v1',JSON.stringify(s));}""")
    ctx.add_init_script(STUB)
    pg.reload(); pg.wait_for_timeout(700)
    calls = pg.evaluate('__gc')
    ok({'Ashoot_clear1', 'Ashoot_stage5', 'S1234'} <= set(calls), '開いたとき：取ってある実績と最高記録を送る ' + ','.join(sorted(set(calls))))
    ok(not any('sup1' in c for c in calls), 'Game Center にない実績（支援の達人）は送らない')
    pg.evaluate('__gc.length=0;window.dispatchEvent(new Event("app-gamecenter"))')
    calls = pg.evaluate('__gc')
    ok(sorted(calls) == ['Ashoot_clear1', 'Ashoot_stage5', 'S1234'], "'app-gamecenter' で送りなおす " + ','.join(calls))
    pg.evaluate('__gc.length=0')
    got = pg.evaluate('__GC.checkAch().map(a=>a.id)'); calls = pg.evaluate('__gc')
    ok('clear10' in got and 'Ashoot_clear10' in calls, '実績を取ったとき（歴戦）に送る ' + ','.join(calls))
    # 最高記録が 0 のときは送らない
    pg.evaluate("""()=>{const s=JSON.parse(localStorage.getItem('shoot-proto-v1'));s.ach={};s.rec.bestKills=0;localStorage.setItem('shoot-proto-v1',JSON.stringify(s));}""")
    pg.reload(); pg.wait_for_timeout(700)
    ok(pg.evaluate('__gc') == [], 'まだ記録がないときは何も送らない')
    ok(errs == [], 'エラーなし ' + ' '.join(errs[:2]))
    b.close()
print('NG', len(ng))
sys.exit(1 if ng else 0)
