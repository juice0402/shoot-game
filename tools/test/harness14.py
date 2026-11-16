"""総点検（issue #14）のテストで共通に使う部分
- build(src)：テスト用のコピー。window.__T（中の関数と値）・window.__seed（Math.random を決まった並びに）・
  requestAnimationFrame を止める window.__HOLD・被弾の数 window.__HURT を足す
- open_page(p, w, h)：Playwright のページを開いて、エラーと警告を集める
"""
import os, tempfile

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
SRC = os.path.join(ROOT, 'index.html')

EXPOSE = ("window.__HURT=0;"
          "window.__T={get R(){return R},set R(v){R=v},update,draw,hud,stat,startRun,addEnemy,addBig,addRock,addWall,hit,hurt,calcCS,buildGrid,"
          "openLevelUp,pickChoice,get lvChoices(){return lvChoices},endRun,supUp,stageSetup,stOpen,renderStage,stepStage,renderAll,renderEquip,"
          "get save(){return save},set save(v){save=v},loadSave,persist,freshSave,setShip,shipProg,layoutEditor,ensureSlots,checkAch,bookCount,BOOK_N,"
          "openBook,closeBook,closeSheet,toHangarFromTitle,openPause,resume,startLoad,emptyLoad,openList,openAim,openShop,openDetail,closeShop,openLab,openLabDetail,openAch,openHowto,showTitle,openInfo,openChest,stepShip,"
          "keys,SHIPS,SHIP_IDS,KIND,MODS,TYPES,EVO,PAS,SUP,SPC_IDS,LAB,ACH,BOOK_E,STAGES,BIG,ESPR,KEY,U,GW,RUN_LEN,WMAX,get GH(){return GH}};\n")

SEED = ("<script>(()=>{let s=1;const r=()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};"
        "window.__seed=n=>{s=(n*2654435761)|0;Math.random=r;};})();</script>")


def build(src=SRC, seed=False, dbg=False, patch=None):
    h = open(src, encoding='utf-8').read()
    for a, b in (patch or []):  # ためしに数字を変える（バランスを見るとき）
        assert h.count(a) == 1, a
        h = h.replace(a, b)

    def rp(a, b):
        nonlocal h
        assert h.count(a) == 1, a
        h = h.replace(a, b)
    rp("  if(!R)return;\n  raf=requestAnimationFrame(frame);", "  if(!R||window.__HOLD)return;\n  raf=requestAnimationFrame(frame);")
    rp("function hurt(d){\n  if(R.inv>0)return;", "function hurt(d){\n  if(R.inv>0)return;window.__HURT++;")
    if dbg:  # 被弾の元（呼んだ関数の名前）を window.__HS に数える
        rp("  d*=R.cs.dmgIn;R.hurtN++;", "  {const c=((new Error().stack||'').split('\\n')[2]||'').trim().split(' ')[1];window.__HS[c]=(window.__HS[c]||0)+d;}d*=R.cs.dmgIn;R.hurtN++;")
    i = h.rindex('})();\n</script>')
    h = h[:i] + EXPOSE.replace("window.__HURT=0;", "window.__HURT=0;window.__HS={};" if dbg else "window.__HURT=0;") + h[i:]
    head = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'
    return head + (SEED if seed else '') + h + '</body></html>'


def write_build(src=SRC, seed=False, dbg=False, patch=None):
    tmp = tempfile.mkdtemp()
    pp = os.path.join(tmp, 't.html')
    open(pp, 'w', encoding='utf-8').write(build(src, seed, dbg, patch))
    return pp


def open_page(b, pp, w=390, h=844, errs=None, warns=None, scale=1):
    ctx = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=scale)
    pg = ctx.new_page()
    if errs is not None:
        pg.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)))

    def con(m):
        if 'ERR_FAILED' in m.text or 'net::' in m.text:
            return
        if m.type == 'error' and errs is not None:
            errs.append('console: ' + m.text)
        if m.type == 'warning' and warns is not None:
            warns.append('warning: ' + m.text)
    pg.on('console', con)
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith('file:') else r.abort())
    pg.goto('file://' + pp)
    pg.wait_for_timeout(500)
    return pg
