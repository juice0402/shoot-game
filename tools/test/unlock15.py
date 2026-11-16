"""はじめの流れとショップの解放のテスト（issue #15）
使い方: python3 tools/test/unlock15.py [--shots]
- はじめの案内（本物のクリック・#17 で押す所だけ明るくする形に）：新しいセーブ → 遊び方4枚 → 格納庫。① 機首の「＋」を指でさす → 一覧はレーザー（のこり 1/1）だけ・② 一覧のレーザーをさす →
  閉じると①にもどる → ③ 向きの板（まだつかない）で前向きの矢印をさす → つく → ④ 出撃をさす（板が開いている間は出さない）→ 出撃で save.tut=1 → もう出ない。
  前の版のセーブ（装備あり・tut なし）は装備を外して①から（11/16）・tut=1 は何も出ない
- データ：最初から8こ（攻撃4・防御2・補助2）・のこり61こに条件（記録の名前・22字まで・使わない言葉なし）・条件の数の1つ手前では解放されず、数で解放される（61こ全部）
  ・どの品も、最初の8こから順に解放できる（Lv8・つけてクリアの相手がたどれる）・機体の解放と進化の相手もたどれる
- ショップ：最初は8こだけ並ぶ・「もうすぐ解放」は3こ（シルエット・条件・棒）と「のこり ○こ」・買えるかの判定（印）は解放ずみだけ・まだの品のくわしくは買えない
- 出撃の結果：その出撃で解放された品をアイコンと名前で（#16 で小さく並べる形に）。次の出撃ではもう出さない
- 機体を買うとついてくる品は解放ずみ（お知らせなし）・図鑑のまだの品のヒントは解放の条件
- 古いセーブ：持っている品＋条件を満たした品をだまって解放ずみ（お知らせなし）・試作4の形はレーザー2つ・保存 → 読みこみで同じ
- 試作用：全部解放のボタン → 69こ全部が並ぶ
- 出撃中に出てくる強化（レベルアップ・宝箱）は、つけている武器だけ
- #14 の点検：同じダメージの武器2つが同じフレームに大蛇に当たると、両方効く
- #15 の点検（#16 で直した）：hit を直接呼ぶ攻撃（支援の雷・狙撃・主砲・全方位レーザー）と near を通る攻撃（トゲ装甲）も、別の攻撃と同じフレーム・同じダメージで
  大蛇に当たると両方効く・体のいくつもの節に当たっても1回の攻撃は1回／出撃の回数は30秒以上の出撃だけ／ships があって owned がない古いセーブは、つけている数まで持つ
- --shots：幅320・360・390・430でショップ（もうすぐ解放）・はじめの案内・結果の画面 → docs/shots/15-*.png
- コンソールのエラーと警告0
"""
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import harness14
from harness14 import write_build, open_page, ROOT
from playwright.sync_api import sync_playwright

harness14.EXPOSE = harness14.EXPOSE.replace("keys,", "keys,isUnl,syncUnl,modProg,tutStep,COMM,TALK,upPool,chestPicks,sup12,snipe,SPECIAL,spDmg,dmgMul,contact,get ATK(){return ATK},set ATK(v){ATK=v},")
SHOTS = os.path.join(ROOT, 'docs', 'shots')
TMP = os.environ.get('OUT', '/tmp')
BASE8 = ['laser', 'gatling', 'shotgun', 'sword', 'armor', 'shield', 'magnet', 'booster']

res = {}


def ok(k, cond, val=''):
    res[k] = {'pass': bool(cond), 'val': val}


def vis(pg, sel):
    return pg.locator(sel).first.is_visible()


def center(pg, sel):
    return pg.evaluate("(s)=>{const r=document.querySelector(s).getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2,r.top,r.bottom]}", sel)


def tutorial(pg):
    pg.evaluate("()=>localStorage.clear()"); pg.reload(); pg.wait_for_timeout(400)
    pg.click('#startBtn'); pg.wait_for_timeout(200)
    for _ in range(4):
        pg.click('#howNext'); pg.wait_for_timeout(80)
    pg.wait_for_timeout(200)
    s = pg.evaluate("()=>{const s=window.__T.save;return {laser:s.owned.laser,other:window.__T.TYPES.filter(t=>t!=='laser'&&s.owned[t]>0).length,eq:s.ships.standard.eq.filter(Boolean).length,gold:s.gold,tut:!!s.tut}}")
    ok('新しいセーブ：レーザー1つ・ほかは0・枠は全部空・300G', s['laser'] == 1 and s['other'] == 0 and s['eq'] == 0 and s['gold'] == 300 and not s['tut'], s)
    lb = pg.evaluate("()=>{const b=document.getElementById('launchBtn');return [b.textContent,b.disabled]}")
    ok('何もつけていないときの出撃ボタン：「＋に装備をつける」', lb == ['＋に装備をつける', True], lb)
    # 11/17：①の前に整備士のあいさつ（通信）。タップで次へ・そのあいだは穴と指なし・ほかは押せない
    cm = comm(pg)
    blk = pg.evaluate("()=>{const r=document.querySelector('#slots .slotb').getBoundingClientRect();const e=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return e&&e.id}")
    ok('あいさつ：通信（顔・名前・1つめの文）・タップで次へ・穴と指なし・ほかは押せない', cm['on'] and cm['wait'] and cm['face'] and cm['name'] == '整備士 サラ' and cm['text'] == cm['intro'][0] and not vis(pg, '#tutDim') and blk == 'comm', [cm, blk])
    pg.click('#comm'); pg.wait_for_timeout(120)
    cm2 = comm(pg)
    pg.click('#comm'); pg.wait_for_timeout(150)
    ok('あいさつ：タップで2つめ → タップで閉じて①へ', cm2['text'] == cm['intro'][1] and comm(pg)['key'] == 't1', [cm2['text'], comm(pg)])
    # ① 機首の＋（#17：押す所だけ明るく・ほかは暗くて押せない・指は押す所に向かって動く）
    g = tut_state(pg, "document.querySelectorAll('#slots .slotb')[0]")
    c1 = comm(pg)
    ok('① 機首の＋だけ明るい・指はその下・ほかは押せない', c1['key'] == 't1' and not c1['wait'] and not c1['over'] and g['on'] and g['inHole'] and not g['down'] and g['fTop'] >= g['tBot'] and abs(g['fX'] - g['tX']) < 2 and g['blocked'] == 'blk' and g['anim'] == 'tbob', g)
    pg.locator('#slots .slotb').first.click(); pg.wait_for_timeout(250)
    rows = pg.evaluate("()=>[...document.querySelectorAll('#sheet .irow')].map(b=>b.querySelector('b').textContent+' '+b.querySelector('em').textContent+(b.classList.contains('tut')?' tut':''))")
    g = tut_state(pg, "document.querySelector('#sheet .irow.tut')")
    c2 = comm(pg)
    ok('② 一覧はレーザーだけ（のこり 1/1）・その行だけ明るい・指はそのとなり（下に入らなければ上）', c2['key'] == 't2' and not c2['over'] and rows == ['レーザー のこり 1/1 tut'] and g['on'] and g['inHole'] and (0 <= g['tTop'] - g['fBot'] < 20 if g['down'] else 0 <= g['fTop'] - g['tBot'] < 20) and g['blocked'] == 'blk', [rows, g])
    pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
    g = tut_state(pg, "document.querySelectorAll('#slots .slotb')[0]")
    ok('一覧を何もえらばずに閉じる → ①にもどる', g['on'] and g['inHole'] and not vis(pg, '#sheetBg'), g)
    pg.locator('#slots .slotb').first.click(); pg.wait_for_timeout(200)
    pg.click('#sheet .irow.tut'); pg.wait_for_timeout(250)
    # ③ 向きの板（11/16：向きをえらんでからつく）
    eq = pg.evaluate("()=>window.__T.save.ships.standard.eq[0]")
    dirs = pg.evaluate("()=>[...document.querySelectorAll('#sheet .dirs button.tut')].map(b=>b.getAttribute('aria-label'))")
    g = tut_state(pg, "document.querySelector('#sheet .dirs button.tut')")
    c3 = comm(pg)
    ok('③ 向きの板：まだつかない・前向きの矢印だけ明るい・ほかは押せない', c3['key'] == 't3' and not c3['over'] and eq is None and dirs == ['上向き'] and g['on'] and g['inHole'] and g['blocked'] == 'blk', [eq, dirs, g])
    pg.click('#sheet .dirs button.tut'); pg.wait_for_timeout(250)
    eq = pg.evaluate("()=>window.__T.save.ships.standard.eq[0]")
    lb = pg.evaluate("()=>{const b=document.getElementById('launchBtn');return [b.textContent,b.disabled]}")
    ok('前向きをえらぶ → レーザーが機首につく', eq == {'t': 'laser', 'd': 0} and lb == ['出撃', False] and not vis(pg, '#sheetBg'), [eq, lb])
    g = tut_state(pg, "document.getElementById('launchBtn')")
    st = pg.evaluate("()=>{const a=document.getElementById('stsel').getBoundingClientRect(),f=document.getElementById('tfinger').getBoundingClientRect();return [f.bottom>a.top,f.top<a.bottom]}")
    c4 = comm(pg)
    ok('④ 出撃だけ明るい・指はその上（ステージの所に重ねる）・機体の場所は動かない', c4['key'] == 't4' and not c4['over'] and g['on'] and g['inHole'] and g['down'] and g['fBot'] <= g['tTop'] + 2 and st == [True, True] and g['blocked'] == 'blk', [g, st])
    full = pg.evaluate("()=>{const r=document.querySelector('#slots .slotb.full').getBoundingClientRect();const e=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return e&&e.className}")
    ok('④ の間、つけた装備や他のボタンは押せない', full == 'blk', full)
    pg.click('#launchBtn'); pg.wait_for_timeout(400)
    tut = pg.evaluate("()=>[window.__T.save.tut,JSON.parse(localStorage.getItem(window.__T.KEY)).tut,!document.getElementById('sortie').hidden]")
    ok('出撃 → 案内おわり（tut=1 を保存）・通信も閉じる', tut == [1, 1, True] and not comm(pg)['on'], tut)
    pg.evaluate("()=>{window.__HOLD=1;window.__T.endRun(false,true);}"); pg.wait_for_timeout(200)
    pg.click('#overlay .btnrow .go'); pg.wait_for_timeout(250)
    ok('出撃のあとは案内を出さない', not vis(pg, '#tutDim'))
    pg.evaluate("()=>{window.__HOLD=0;}")


def comm(pg):
    """11/17：整備士の通信のようす（over＝押す所の穴に重なっている）"""
    return pg.evaluate("""()=>{const c=document.getElementById('comm'),T=window.__T;const on=!c.hidden;const w=c.querySelector('.cwin').getBoundingClientRect(),h=document.querySelector('#tutDim .hole').getBoundingClientRect();
      const cv=document.getElementById('cfaceCv');const face=cv.width>0&&cv.toDataURL().length>600;
      return {on,wait:c.classList.contains('wait'),key:T.COMM.key,name:document.getElementById('cname').textContent,text:document.getElementById('ctext').textContent,intro:T.TALK.intro,face,
        over:on&&!document.getElementById('tutDim').hidden&&!(w.bottom<=h.top||w.top>=h.bottom||w.right<=h.left||w.left>=h.right)}}""")


def tut_state(pg, target):
    pg.wait_for_timeout(120)
    return pg.evaluate("""()=>{const d=document.getElementById('tutDim'),f=document.getElementById('tfinger'),t=%s;
      if(d.hidden||!t)return {on:false};
      const h=d.querySelector('.hole').getBoundingClientRect(),r=t.getBoundingClientRect(),fr=f.getBoundingClientRect();
      const sb=document.getElementById('shopBtn')||document.querySelector('header button');const q=sb.getBoundingClientRect();
      const e=document.elementFromPoint(q.left+q.width/2,q.top+q.height/2);
      return {on:true,inHole:h.left<=r.left&&h.top<=r.top&&h.right>=r.right&&h.bottom>=r.bottom&&h.width<r.width+20,down:f.classList.contains('down'),
        fTop:Math.round(fr.top),fBot:Math.round(fr.bottom),fX:Math.round(fr.left+fr.width/2),tX:Math.round(r.left+r.width/2),tTop:Math.round(r.top),tBot:Math.round(r.bottom),
        blocked:e&&e.className,anim:getComputedStyle(f).animationName}}""" % target)


def old_tut(pg):
    """前の版のセーブ：装備あり・tut なし → 装備を外して①から（11/16）。tut=1 → 何も出ない。空き・装備なし・tut なし → ①"""
    out = {}
    for name, raw in (('装備あり', {'gold': 500, 'owned': {'laser': 2}, 'ships': {'standard': {'have': True, 'eq': [None, {'t': 'laser', 'd': 0}, {'t': 'laser', 'd': 0}]}}, 'howto': 1}),
                      ('tut=1', {'gold': 500, 'owned': {'laser': 2}, 'ships': {'standard': {'have': True, 'eq': [None, {'t': 'laser', 'd': 0}]}}, 'howto': 1, 'tut': 1}),
                      ('装備なし', {'gold': 500, 'owned': {'laser': 2}, 'ships': {'standard': {'have': True, 'eq': []}}, 'howto': 1})):
        pg.evaluate("(o)=>{localStorage.setItem(window.__T.KEY,JSON.stringify(o));}", raw); pg.reload(); pg.wait_for_timeout(350)
        pg.click('#startBtn'); pg.wait_for_timeout(250)
        harness14.talk_through(pg)  # 11/17：整備士のあいさつ
        pg.wait_for_timeout(120)
        out[name] = pg.evaluate("()=>{const d=document.getElementById('tutDim'),dn=document.getElementById('tfinger').classList.contains('down'),s=window.__T.save;return [!d.hidden&&!dn,!d.hidden&&dn,s.ships.standard.eq.filter(Boolean).length,s.owned.laser]}")
    ok('前の版のセーブ：装備あり → 外して①から（持ち物はそのまま）・tut=1 → なし（装備もそのまま）・装備なし → ①', out == {'装備あり': [True, False, 0, 2], 'tut=1': [False, False, 1, 2], '装備なし': [True, False, 0, 2]}, out)


DATA = r"""
()=>{const T=window.__T,out={};const BASE=%s;
  const base=T.TYPES.filter(t=>!T.MODS[t].unlock),cats=c=>base.filter(t=>T.MODS[t].cat===c).length;
  out.base=[base.join(','),cats('atk'),cats('def'),cats('sup'),T.TYPES.length-base.length];
  out.baseOk=JSON.stringify(base.slice().sort())===JSON.stringify(BASE.slice().sort());
  const keys=['runs','kills','bestKills','bestLv','bosses','fastBoss','nodmg','clears','stageMax','halfClear','evos','chests','spTotal','meleeK','goldTotal','bestSpc','sup5','wmax','big','cw'];
  const BAD=/[！!]|してね|だよ|しよう|てね|よう$/;out.badTxt=[];out.badKey=[];
  for(const t of T.TYPES){const u=T.MODS[t].unlock;if(!u)continue;if(!keys.includes(u.k))out.badKey.push(t+':'+u.k);
    if(u.k==='wmax'&&!(T.MODS[u.t]&&T.MODS[u.t].cat==='atk'&&!T.MODS[u.t].passive))out.badKey.push(t+':wmax '+u.t);
    if(u.k==='cw'&&!T.MODS[u.t])out.badKey.push(t+':cw '+u.t);if(u.k==='big'&&!T.BOOK_E.some(b=>b.k===u.t))out.badKey.push(t+':big '+u.t);
    if([...u.txt].length>22||BAD.test(u.txt))out.badTxt.push(t+':'+u.txt);}
  /* 1つ手前では解放されず、数で解放される（61こ全部） */
  const setRec=(s,u,v)=>{if(u.k==='wmax')s.rec.wmax[u.t]=v;else if(u.k==='big')s.book.e[u.t]=v;else if(u.k==='cw')s.rec.cw[u.t]=v;else if(u.k==='sup5')s.rec.sup5=Object.keys(T.SUP).slice(0,v);else s.rec[u.k]=v;};
  out.edge=[];for(const t of T.TYPES){const u=T.MODS[t].unlock;if(!u)continue;const s=T.freshSave();T.save=s;setRec(s,u,u.n-1);const a=T.isUnl(t);setRec(s,u,u.n);const b=T.isUnl(t);if(a||!b)out.edge.push(t);}
  /* たどれる：最初の8こから、Lv8 と「つけてクリア」の相手が解放ずみになっていけば全部 */
  const have=new Set(base);let more=true;while(more){more=false;for(const t of T.TYPES){if(have.has(t))continue;const u=T.MODS[t].unlock;
    if((u.k==='wmax'||u.k==='cw')&&!have.has(u.t))continue;if(u.k==='evos'&&!Object.keys(T.EVO).some(w=>have.has(w)&&have.has(T.EVO[w].p)))continue;have.add(t);more=true;}}
  out.unreach=T.TYPES.filter(t=>!have.has(t));
  out.evoReach=Object.keys(T.EVO).filter(w=>!(have.has(w)&&have.has(T.EVO[w].p)));
  out.shipReach=T.SHIP_IDS.filter(id=>{const u=T.SHIPS[id].unlock;return u&&u.k==='wmax'&&![].concat(u.t).some(x=>base.includes(x))});
  /* 最初の3出撃のめやす：1出撃目（出撃1回・300体・Lv10）で3こ以上 */
  {const s=T.freshSave();T.save=s;Object.assign(s.rec,{runs:1,bestKills:300,kills:300,bestLv:10});out.first=T.TYPES.filter(t=>T.MODS[t].unlock&&T.isUnl(t)).length;}
  {const s=T.freshSave();T.save=s;Object.assign(s.rec,{runs:2});out.second=T.TYPES.filter(t=>T.MODS[t].unlock&&T.isUnl(t)).length;Object.assign(s.rec,{runs:3});out.third=T.TYPES.filter(t=>T.MODS[t].unlock&&T.isUnl(t)).length;}
  return out;}
"""


def data(pg):
    d = pg.evaluate(DATA % json.dumps(BASE8))
    ok('最初から8こ（攻撃4・防御2・補助2）・のこり61こに条件', d['baseOk'] and d['base'][1:] == [4, 2, 2, 61], d['base'])
    ok('条件の記録の名前と相手', not d['badKey'], d['badKey'])
    ok('条件の文：22字まで・語りかけや「！」なし', not d['badTxt'], d['badTxt'])
    ok('61こ全部：数の1つ手前では解放されず、数で解放', not d['edge'], d['edge'])
    ok('どの品も最初の8こからたどれる', not d['unreach'], d['unreach'])
    ok('進化14種の相手が全部たどれる・機体の Lv8 の条件は最初の品で', not d['evoReach'] and not d['shipReach'], [d['evoReach'], d['shipReach']])
    ok('はじめの3出撃：毎回1こ以上（出撃1回・2回・3回の分だけでも）', d['first'] >= 3 and d['second'] >= 2 and d['third'] >= 3, [d['first'], d['second'], d['third']])


def shop_counts(pg):
    return pg.evaluate("""()=>{const T=window.__T,out={};for(const k of ['atk','def','sup']){document.querySelector('#shopTabs button:nth-child('+(['ship','atk','def','sup'].indexOf(k)+1)+')').click();
      out[k]={n:document.querySelectorAll('#shopGrid .sitem').length,lock:document.querySelectorAll('#shopGrid .lockc').length,soon:!!document.querySelector('#shopGrid .soonh'),
        more:(document.querySelector('#shopGrid .soonn')||{}).textContent||'',names:[...document.querySelectorAll('#shopGrid .sitem span')].map(e=>e.textContent).join(',')};}return out;}""")


def shop(pg):
    pg.evaluate("()=>{localStorage.clear();const T=window.__T;T.save=T.freshSave();T.save.howto=1;T.save.tut=1;T.setShip('standard');T.persist();}")
    pg.reload(); pg.wait_for_timeout(350); pg.click('#startBtn'); pg.wait_for_timeout(200)
    pg.click('#shopBtn'); pg.wait_for_timeout(200)
    c = shop_counts(pg)
    ok('最初のショップ：攻撃4・防御2・補助2', [c[k]['n'] for k in ('atk', 'def', 'sup')] == [4, 2, 2], {k: c[k]['names'] for k in c})
    ok('もうすぐ解放：3こ＋「のこり ○こ」', all(c[k]['soon'] and c[k]['lock'] == 3 for k in c) and c['atk']['more'] == 'のこり 35こ' and c['def']['more'] == 'のこり 8こ' and c['sup']['more'] == 'のこり 9こ',
       {k: c[k]['more'] for k in c})
    lk = pg.evaluate("()=>{const c=document.querySelector('#shopGrid .lockc');return {img:c.querySelector('img').src.startsWith('data:'),txt:c.querySelector('p').textContent,bar:!!c.querySelector('.prog i'),num:c.querySelector('.num').textContent}}")
    ok('もうすぐ解放のカード：シルエット・条件・棒・数', lk['img'] and lk['bar'] and '/' in lk['num'] and lk['txt'], lk)
    pg.evaluate("()=>{window.__T.save.gold=99999;}")
    # 買えるかの判定（印）は解放ずみだけ
    pg.evaluate("()=>window.__T.renderAll()"); pg.wait_for_timeout(100)
    marks = pg.evaluate("()=>[...document.querySelectorAll('#shopGrid .sitem.can span')].map(e=>e.textContent)")
    ok('印（いま買える）は解放ずみだけ', len(marks) > 0 and all(n in ('ガトリング', '散弾砲', '近接の剣', 'レーザー', '装甲板', 'シールド', '吸引装置', 'ブースター') for n in marks), marks)
    det = pg.evaluate("()=>{const T=window.__T;T.openDetail('rail');const b=document.querySelector('#sheet .buybig');const r=[b.disabled,b.textContent,document.getElementById('sheet').textContent.includes('解放の条件：ステージ3クリア')];T.closeSheet();return r;}")
    ok('まだの品のくわしくは買えない', det == [True, 'まだ解放されていない', True], det)
    bk = pg.evaluate("()=>{const T=window.__T;T.closeShop();T.openBook();const b=[...document.querySelectorAll('#bookBody .bgrid')][0].children;let out=[];for(const [i,t] of [[T.TYPES.indexOf('rail'),'rail'],[T.TYPES.indexOf('gatling'),'gatling']]){b[i].click();out.push(document.getElementById('sheet').textContent);T.closeSheet();}T.closeBook();return out;}")
    ok('図鑑：まだの品のヒントは解放の条件', '解放の条件：ステージ3クリア' in bk[0] and 'ショップで買うと記録される' in bk[1], bk)
    # 全部解放のボタン
    pg.click('#shopBtn'); pg.wait_for_timeout(150)
    pg.click('#debugUnl'); pg.wait_for_timeout(150)
    c = shop_counts(pg)
    ok('試作用：全部解放 → 69こ全部（攻撃42・防御13・補助14）・もうすぐ解放なし', [c[k]['n'] for k in ('atk', 'def', 'sup')] == [42, 13, 14] and not any(c[k]['soon'] for k in c), [c[k]['n'] for k in c])
    pg.click('#shopClose'); pg.wait_for_timeout(150)


RESULT = r"""
(p)=>{const T=window.__T;window.__HOLD=1;localStorage.clear();const s=T.freshSave();T.save=s;s.howto=1;s.tut=1;s.ships.standard.eq[0]={t:'laser',d:0};T.setShip('standard');
  T.startRun();const R=T.R;Object.assign(R,p);R.tlv.laser=p.lv8?8:R.tlv.laser;T.endRun(!!p.clear,!p.clear);
  const ov=document.getElementById('overlay');const li=[...ov.querySelectorAll('.unll li:not(.ship):not(.lab)')].map(l=>[l.textContent,!!(l.querySelector('img')&&l.querySelector('img').src.startsWith('data:'))]);
  return {li,unl:T.save.unl.slice(),saved:JSON.parse(localStorage.getItem(T.KEY)).unl};}
"""


def result(pg):
    pg.evaluate("()=>{document.getElementById('title').hidden=true;document.getElementById('hangar').hidden=true;document.getElementById('sortie').hidden=false;}")
    r = pg.evaluate(RESULT, {'kills': 400, 'lv': 12, 'lv8': True, 't': 40})
    want = ['追撃ミサイル', '扇レーザー', 'はね返り弾', '追尾レーザー', '冷却装置']
    ok('結果の画面：解放された品をアイコンと名前で（30秒以上の出撃1回・400体・Lv12・レーザーLv8）', sorted(x[0] for x in r['li']) == sorted(want) and all(x[1] for x in r['li']), r['li'])
    ok('お知らせ済みを保存', sorted(r['unl']) == sorted(r['saved']) and len(r['unl']) == 5, r['unl'])
    again = pg.evaluate("()=>{const T=window.__T;T.startRun();const R=T.R;R.kills=10;R.t=40;T.endRun(false,true);return [...document.querySelectorAll('#overlay .unll li:not(.ship):not(.lab)')].map(l=>l.textContent);}")
    ok('次の出撃では同じ品を出さない（30秒以上の出撃2回 → 無敵延長だけ）', again == ['無敵延長'], again)
    # 機体を買うとついてくる品：解放ずみ・お知らせなし
    sh = pg.evaluate("""()=>{const T=window.__T;const s=T.save;s.rec.halfClear=1;s.gold=5000;T.openShop('phantom');document.querySelector('#sheet .buybig').click();T.closeShop();
      const a=[s.ships.phantom.have,s.owned.twin,s.unl.includes('twin'),T.isUnl('twin')];T.startRun();const R=T.R;T.endRun(false,true);
      return a.concat([[...document.querySelectorAll('#overlay .unll li:not(.ship):not(.lab)')].map(l=>l.textContent).join(',')]);}""")
    ok('機体を買うとついてくる品（ファントムの双剣）は解放ずみ・お知らせなし', sh[:4] == [True, 1, True, True] and '双剣' not in sh[4], sh)
    # 出撃中の強化は、つけている武器だけ
    pool = pg.evaluate("""()=>{const T=window.__T;window.__seed(3);const s=T.freshSave();T.save=s;s.unl=T.TYPES.filter(t=>T.MODS[t].unlock);s.owned.missile=1;
      s.ships.standard.eq[0]={t:'laser',d:0};s.ships.standard.eq[1]={t:'missile',d:0};T.setShip('standard');T.startRun();const R=T.R;const bad=new Set();
      for(let i=0;i<200;i++){for(const o of T.upPool(new Set()))if(o.cat==='w'&&!['laser','missile'].includes(o.key.slice(2)))bad.add(o.key);for(const o of T.chestPicks())if(o.cat==='w'&&!['laser','missile'].includes(o.key.slice(2)))bad.add(o.key);}
      T.endRun(false,true);return [...bad];}""")
    ok('レベルアップ・宝箱の強化は、つけている武器だけ', not pool, pool)
    pg.evaluate("()=>{window.__HOLD=0;}")


SAVES = r"""
()=>{const T=window.__T,K=T.KEY,out={};const ld=o=>{localStorage.setItem(K,JSON.stringify(o));return T.loadSave();};
  /* 試作4の形（持ち物なし）：レーザー2つ */
  {const s=ld({gold:50,load:[{t:'laser',d:0},{t:'laser',d:0},{t:'laser',d:0}]});out.p4=[s.owned.laser,s.ships.standard.eq.filter(Boolean).length];}
  /* 試作5の形：持っている品は解放ずみ（ミサイル）・まだの品はまだ */
  {const s=ld({gold:1234,owned:{laser:2,gatling:1,missile:1,shield:1,armor:1},load:[null,{t:'laser',d:0}],best:{t:240,kills:900,clear:false},tut:1,howto:1});
    T.save=s;out.p5=[s.unl.includes('missile'),T.isUnl('missile'),T.isUnl('rail'),s.rec.runs,T.isUnl('iframe')];}
  /* #12 の形：記録で条件を満たした品をだまって解放ずみ（レーザーLv8 → 扇・追尾、大型の敵3体 → 機雷・雷撃、クリア → 火炎） */
  {const s=ld({gold:900,owned:{laser:2},ships:{standard:{have:true,eq:[null,{t:'laser',d:0}]}},tut:1,howto:1,
    rec:{clears:2,bosses:3,goldTotal:900,wmax:{laser:8},sup5:[],fastBoss:0,bestKills:400,halfClear:1,meleeK:0,evos:1,stageMax:1,kills:900,bestLv:12,time:700},best:{t:300,kills:400,clear:true}});
    T.save=s;out.p12=['fan','hlaser','mine','thunder','flame','ricochet','cooler','acid','missile','iframe','scope'].filter(t=>!s.unl.includes(t));out.p12runs=s.rec.runs;
    T.setShip('standard');T.startRun();const R=T.R;T.endRun(false,true);out.p12ann=[...document.querySelectorAll('#overlay .unll li:not(.ship):not(.lab)')].map(l=>l.textContent);}
  /* #15 の点検：ships があって owned がない形（レーザー2つ・ラピッドにガトリング）→ つけている数まで持っている */
  {const s=ld({gold:100,ships:{standard:{have:true,eq:[{t:'laser',d:0},{t:'laser',d:0},null]},rapid:{have:true,eq:[{t:'gatling',d:0}]}},cur:'standard',tut:1,howto:1});
    out.noOwned=[s.owned.laser,s.ships.standard.eq.filter(Boolean).length,s.owned.gatling,s.ships.rapid.eq.filter(Boolean).length];}
  /* 保存 → 読みこみで同じ（unl・runs・cw） */
  {const s=T.freshSave();s.unl=['fan','missile'];s.rec.runs=7;s.rec.cw={shield:2,laser:1};s.tut=1;T.save=s;T.persist();const b=T.loadSave();
    out.round=[b.unl.join(','),b.rec.runs,JSON.stringify(b.rec.cw)];}
  /* こわれた unl・cw */
  {const s=ld({unl:['nope','laser','fan','fan',5],rec:{cw:{laser:'x',shield:2.7,nope:3},runs:-4}});out.bad=[s.unl.join(','),JSON.stringify(s.rec.cw),s.rec.runs];}
  localStorage.removeItem(K);return out;}
"""


def talks(pg):
    """11/17：整備士の通信（解放のお知らせ・研究所のはじめて）。押せる所はそのまま押せる"""
    pg.evaluate("()=>{document.getElementById('title').hidden=true;document.getElementById('hangar').hidden=true;document.getElementById('sortie').hidden=false;}")
    pg.evaluate(RESULT, {'kills': 400, 'lv': 12, 'lv8': True, 't': 40})
    pend = pg.evaluate("()=>window.__T.COMM.pend")
    pg.click('#overlay .btnrow .go'); pg.wait_for_timeout(200)
    cm = comm(pg)
    hit = pg.evaluate("()=>{const r=document.getElementById('shopBtn').getBoundingClientRect();const e=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return e&&(e.id||e.className)}")
    ok('解放のお知らせ：格納庫にもどると整備士が知らせる（品5つ →「〇〇」ほか4つ・押せる所はそのまま）', cm['on'] and not cm['wait'] and cm['key'] == 'unl' and pend and pend[0].startswith('「') and 'ほか4つ' in pend[0] and cm['text'] == pend[0] and hit == 'shopBtn', [pend, cm, hit])
    seen = [comm(pg)['text']]
    for _ in range(len(pend or [])):
        pg.evaluate("()=>document.body.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))"); pg.wait_for_timeout(100)
        if comm(pg)['on']:
            seen.append(comm(pg)['text'])
    ok('どこかをタップ → 次の文 → 閉じる（品・研究の2つ）', seen == pend and len(pend) == 2 and pend[1].startswith('研究所に') and not comm(pg)['on'], [seen, pend])
    nt = pg.evaluate("""()=>{const T=window.__T;window.__HOLD=1;const s=T.freshSave();T.save=s;s.howto=1;s.ships.standard.eq[0]={t:'laser',d:0};T.setShip('standard');
      document.getElementById('hangar').hidden=true;document.getElementById('sortie').hidden=false;T.startRun();const R=T.R;R.kills=400;R.t=40;T.endRun(false,true);return T.COMM.pend;}""")
    ok('はじめの案内のとちゅう（tut なし）は知らせない', nt is None, nt)
    pg.evaluate("()=>{const T=window.__T;document.getElementById('overlay').hidden=true;document.getElementById('sortie').hidden=true;document.getElementById('hangar').hidden=false;T.R=null;T.save.tut=1;T.renderAll();}")
    pg.evaluate("()=>window.__T.openLab()"); pg.wait_for_timeout(200)
    cm = comm(pg)
    sv = pg.evaluate("()=>[window.__T.save.talk.lab,JSON.parse(localStorage.getItem(window.__T.KEY)).talk.lab]")
    ok('研究所をはじめて開く → 整備士のひとこと（2つ・保存）', cm['on'] and cm['key'] == 'lab' and not cm['wait'] and sv == [1, 1], [cm, sv])
    pg.evaluate("()=>{document.getElementById('labClose').click();window.__T.openLab();}"); pg.wait_for_timeout(200)
    ok('閉じると消える・2回目は出ない', not comm(pg)['on'], comm(pg))
    pg.evaluate("()=>document.getElementById('labClose').click()")
    old = pg.evaluate("""()=>{const T=window.__T,k=T.KEY;const a=[];
      localStorage.setItem(k,JSON.stringify({gold:5,tut:1,lab:{r_hp:1}}));a.push(T.loadSave().talk.lab);
      localStorage.setItem(k,JSON.stringify({gold:5,tut:1}));a.push(T.loadSave().talk.lab);
      localStorage.setItem(k,JSON.stringify({gold:5,tut:1,talk:{lab:1}}));a.push(T.loadSave().talk.lab);return a;}""")
    ok('前のセーブ：研究所を使っていればひとこと済み', old == [1, 0, 1], old)
    pg.evaluate("()=>{window.__HOLD=0;}")


def saves(pg):
    s = pg.evaluate(SAVES)
    ok('試作4の形（持ち物の記録なし）：レーザー2つ', s['p4'] == [2, 2], s['p4'])
    ok('試作5の形：持っている品は解放ずみ・まだの品はまだ・出撃の回数は記録から', s['p5'] == [True, True, False, 1, False], s['p5'])
    ok('#12 の形：条件を満たした品をだまって解放ずみ（出撃の回数は記録から3）・次の出撃でお知らせなし', not s['p12'] and s['p12runs'] == 3 and s['p12ann'] == [], [s['p12'], s['p12runs'], s['p12ann']])
    ok('#15 の点検：機体ごとの装備はあって持ち物の記録がない古いセーブ：つけている装備は外れない（レーザー2・ガトリング1）', s['noOwned'] == [2, 2, 1, 1], s['noOwned'])
    ok('保存 → 読みこみで同じ（お知らせ済み・出撃の回数・つけてクリア）', s['round'] == ['fan,missile', 7, '{"laser":1,"shield":2}'], s['round'])
    ok('こわれたお知らせ済み・記録は捨てる', s['bad'] == ['fan', '{"shield":2}', 0], s['bad'])


SNAKE = r"""
(n)=>{const T=window.__T;const list=n===2?['cannon','cannon']:['cannon'];const R=window.__go(4,'standard',list);for(const m of R.mods){R.tlv[m.t]=4;m.d=0;}T.calcCS();
  R.bossAt=[];R.acc=-1e9;R.lzAt=1e9;R.turT=1e9;R.E.length=0;R.x=240;R.y=600;R.inv=99;const b=T.addBig('snake');b.hp=b.max=1e9;
  for(let i=0;i<30;i++){T.update(1/60);R.x=240;R.y=600;b.x=240;b.y=200;}
  const h0=b.hp;for(let k=0;k<12;k++){for(const m of R.mods)m.cd=0;for(let i=0;i<20;i++){T.update(1/60);R.x=240;R.y=600;b.x=240;b.y=200;b.vx=0;b.vy=0;for(const s of b.segs){s.x=240;s.y=200;}}}
  return h0-b.hp;}
"""


RUNS = r"""
()=>{const T=window.__T;window.__HOLD=1;const s=T.freshSave();T.save=s;s.howto=1;s.tut=1;s.ships.standard.eq[0]={t:'laser',d:0};T.setShip('standard');
  const run=t=>{T.startRun();const R=T.R;R.t=t;T.endRun(false,true);return s.rec.runs;};
  const a=[run(5),run(29.9),T.isUnl('missile'),run(30),T.isUnl('missile'),T.isUnl('iframe'),run(120),T.isUnl('iframe')];return [a,T.MODS.missile.unlock.txt,T.MODS.iframe.unlock.txt,T.MODS.scope.unlock.txt];}
"""

# 同じフレーム・同じダメージで、別の攻撃のあとに当てる（two）／その攻撃だけ（one）。大蛇の頭と体（11節）を同じ所に置く
SAMEF = r"""
([k,two])=>{const T=window.__T;const R=window.__go(4,'standard',['laser']);R.bossAt=[];R.acc=-1e9;R.lzAt=1e9;R.turT=1e9;R.E.length=0;R.x=240;R.y=420;R.inv=99;R.t=50;
  const b=T.addBig('snake');b.hp=b.max=1e9;const put=(x,y)=>{b.x=x;b.y=y;b.vx=b.vy=0;for(const q of b.segs){q.x=x;q.y=y;}};put(240,300);
  const A={thunder:()=>[T.SUP.thunder.v.d[0]*T.dmgMul(),()=>{R.sup.thunder=1;R.thT=0;T.sup12(0);}],
    snipe:()=>[T.spDmg(120),()=>T.snipe([b])],
    omega:()=>[T.spDmg(90),()=>T.SPECIAL.omega.up({f:0,t:0.5})],
    standard:()=>[T.spDmg(40),()=>T.SPECIAL.standard.up({n:0,t:0.15})],
    spike:()=>{put(240,410);R.cs.spike=1;T.buildGrid();return [15*T.dmgMul(),()=>{b.spk=-9;for(const q of b.segs)q.spk=-9;T.contact();}];}};
  const [amt,fn]=A[k]();T.buildGrid();const h0=b.hp;if(two){T.ATK++;T.hit(b,amt,0,0);}fn();return [(h0-b.hp)/amt,R.t];}
"""


def review15(pg):
    r = pg.evaluate(RUNS)
    ok('#15 の点検：出撃の回数は30秒以上の出撃だけ（5秒・29.9秒の撤退は数えない → 30秒で追撃ミサイル・2回で無敵延長）',
       r[0] == [0, 0, False, 1, True, False, 2, True] and r[1:] == ['30秒以上の出撃1回', '30秒以上の出撃2回', '30秒以上の出撃3回'], r)
    bad = []
    for k in ('thunder', 'snipe', 'omega', 'standard', 'spike'):
        one = pg.evaluate(SAMEF, [k, False])[0]; two = pg.evaluate(SAMEF, [k, True])[0]
        if not (abs(one - 1) < 0.01 and abs(two - 2) < 0.01):
            bad.append([k, round(one, 3), round(two, 3)])
    ok('#15 の点検：支援の雷・狙撃・主砲・全方位レーザー・トゲ装甲が、別の攻撃と同じフレーム・同じダメージでも大蛇に効く（体の11節に当たっても1回）', not bad, bad)


def snake(pg):
    one = pg.evaluate(SNAKE, 1); two = pg.evaluate(SNAKE, 2)
    ok('#14 の点検：同じダメージの武器2つが同じフレームに大蛇に当たると両方効く', one > 0 and 1.8 < two / one < 2.2, '%d %d %.2f' % (one, two, two / max(one, 1)))


def shots(b, pp, errs, warns):
    from PIL import Image
    tmp = TMP
    ims = []
    for w in (320, 360, 390, 430):
        pg = open_page(b, pp, w, 760, errs, warns)
        pg.evaluate("()=>{const T=window.__T;T.save=T.freshSave();const s=T.save;s.howto=1;s.tut=1;s.gold=860;Object.assign(s.rec,{runs:4,kills:5200,bestKills:2400,bestLv:19,bosses:2,goldTotal:3300,clears:1,stageMax:1});"
                    "s.rec.wmax.laser=8;s.rec.wmax.gatling=5;s.owned.gatling=1;s.unl=T.TYPES.filter(t=>T.MODS[t].unlock&&T.isUnl(t));T.setShip('standard');}")
        pg.click('#startBtn'); pg.wait_for_timeout(200); pg.click('#shopBtn'); pg.wait_for_timeout(250)
        pg.evaluate("()=>{const g=document.getElementById('shopGrid');g.scrollTop=g.scrollHeight;}"); pg.wait_for_timeout(150)
        bad = pg.evaluate("""()=>{const out=[];for(const e of document.querySelectorAll('#shopSheet *')){if(!e.offsetParent||!e.childElementCount&&!e.textContent.trim())continue;
          const r=e.getBoundingClientRect();if(r.right>innerWidth+0.5||r.left<-0.5)out.push(e.className+':'+e.textContent.slice(0,10));
          if(!e.childElementCount&&e.scrollWidth>e.clientWidth+1)out.push('あふれ '+e.className+':'+e.textContent.slice(0,10));}/* 文字だけの要素（タブの赤い印などの飾りは数えない） */
          for(const b of document.querySelectorAll('#shopSheet button')){const r=b.getBoundingClientRect();if(b.offsetParent&&(r.height<44||r.width<44))out.push('小さい '+b.textContent);}return out;}""")
        ok('幅%d：ショップ（もうすぐ解放）のはみ出し・44px より小さいボタンなし' % w, not bad, bad[:5])
        p = os.path.join(tmp, 'u15-shop-%d.png' % w); pg.screenshot(path=p); ims.append(Image.open(p))
        pg.close()
    W = sum(i.width for i in ims) + 12 * (len(ims) - 1); H = max(i.height for i in ims)
    o = Image.new('RGB', (W, H), (255, 255, 255)); x = 0
    for i in ims:
        o.paste(i, (x, 0)); x += i.width + 12
    o.save(os.path.join(SHOTS, '15-shop-widths.png'))
    # はじめの案内（①・②・③）と結果の画面（幅390）
    pg = open_page(b, pp, 390, 844, errs, warns)
    pg.evaluate("()=>localStorage.clear()"); pg.reload(); pg.wait_for_timeout(400)
    pg.evaluate("()=>{const T=window.__T;T.save.howto=1;}")
    pg.click('#startBtn'); pg.wait_for_timeout(300)
    steps = []
    p = os.path.join(tmp, 'u15-t1.png'); pg.screenshot(path=p); steps.append(Image.open(p))
    pg.locator('#slots .slotb').first.click(); pg.wait_for_timeout(300)
    p = os.path.join(tmp, 'u15-t2.png'); pg.screenshot(path=p); steps.append(Image.open(p))
    pg.click('#sheet .irow.tut'); pg.wait_for_timeout(300)
    p = os.path.join(tmp, 'u15-t3.png'); pg.screenshot(path=p); steps.append(Image.open(p))
    pg.click('#sheet .dirs button.tut'); pg.wait_for_timeout(2600)
    p = os.path.join(tmp, 'u15-t4.png'); pg.screenshot(path=p); steps.append(Image.open(p))
    pg.evaluate("()=>{window.__HOLD=1;const T=window.__T;T.startRun();const R=T.R;R.kills=2200;R.lv=19;R.tlv.laser=8;R.bossKills=1;R.t=260;T.save.rec.bosses=0;T.endRun(false,false);}")
    pg.wait_for_timeout(300)
    p = os.path.join(tmp, 'u15-res.png'); pg.screenshot(path=p); steps.append(Image.open(p))
    W = sum(i.width for i in steps) + 12 * (len(steps) - 1); o = Image.new('RGB', (W, steps[0].height), (255, 255, 255)); x = 0
    for i in steps:
        o.paste(i, (x, 0)); x += i.width + 12
    o.save(os.path.join(SHOTS, '15-tutorial-result.png'))
    pg.close()


def main():
    errs, warns = [], []
    pp = write_build(seed=True)
    GO = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'check14.py'), encoding='utf-8').read().split('GO = r"""')[1].split('"""')[0]
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = open_page(b, pp, 390, 844, errs, warns)
        tutorial(pg)
        old_tut(pg)
        data(pg)
        shop(pg)
        result(pg)
        talks(pg)
        saves(pg)
        pg.evaluate(GO)
        snake(pg)
        review15(pg)
        pg.close()
        if '--shots' in sys.argv:
            shots(b, pp, errs, warns)
        b.close()
    fails = 0
    for k, v in res.items():
        print(('OK ' if v['pass'] else 'NG ') + k + ('' if v['pass'] else '  ' + json.dumps(v['val'], ensure_ascii=False)[:400]))
        fails += not v['pass']
    for e in errs[:10]:
        print('ERR', e)
    for w in warns[:10]:
        print('WARN', w)
    print('%d 項目・エラー %d・警告 %d・NG %d' % (len(res), len(errs), len(warns), fails))
    sys.exit(1 if errs or warns or fails else 0)


if __name__ == '__main__':
    main()
