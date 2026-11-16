"""文と飾りの点検（issue #16：AIっぽさをへらす）
使い方: python3 tools/test/copy16.py [--shots]
- 文：index.html の文字列（JS の '…' と HTML の文字・aria-label）と、実際に開いた画面の文字（タイトル・遊び方・格納庫・一覧・向き・くわしく・
  ショップ・研究所・図鑑・実績・出撃・レベルアップ・宝箱・一時停止・結果・エンディング・お知らせ）から、つぎをさがして 0 件なら OK
  語りかけ（〜してね・〜だよ・〜しよう・〜ね・〜よ など）・決まりの外の「！」・絵文字と記号（◀ ▶ ✕ ↑ など）・使わない言葉・NEW・ダッシュ
  わざと残す「！」：敵が出たときの知らせ（〜が来る！）とステージクリア（クリア！・全ステージクリア！・深淵の核をたおした！）
- 説明の文（装備・進化・機体・ステージ・敵・道中の強化・支援・特別・研究所・実績・解放の条件・レベルアップの文）は全角22字まで
- レベルアップ・道中の強化の文に、数字のない「〜アップ」だけの文がない
- 飾り：NEW の札・赤い点・一覧の左の太い帯がない。動き（animation）は格納庫の指だけ（ふくらむ・点滅・下から出る動きがない）
  ◀ ▶ ✕ と向きの矢印は点の絵（img.pix）で、文字はなし・ボタンは44px 以上
- 出撃の結果（解放6こ＋新しい機体・実績4つ・新記録）：幅390・高さ660 でスクロールなしにボタンまで入る。
  もっと多いとき（ステージの解放・実績8つ・高さ560）も、ボタンは画面の下に見えている
- --shots：直す前（a4bc3e4）と後の、格納庫・装備の一覧・ショップ・レベルアップ・結果（解放6こ）を幅390・高さ660で並べる → docs/shots/16-before-after.png
- コンソールのエラーと警告0
"""
import os, re, sys, json, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import harness14
from harness14 import write_build, open_page, ROOT, SRC
from playwright.sync_api import sync_playwright

harness14.EXPOSE = harness14.EXPOSE.replace("keys,", "keys,SPC,isUnl,")
SHOTS = os.path.join(ROOT, 'docs', 'shots')
TMP = os.environ.get('OUT', '/tmp')

CASUAL = r'(?:てね|だよ|だね|よね)(?:$|[。！？!、\s）」])|しよう|しましょう|ましょう|ください|てみて|てみよう|[ねよ](?:$|[。！？!、\s])|[^ぁ-んァ-ヶ一-龠ー](?:こう|おう)$'
BANG = r'[！!]'
BANG_OK = r'^(クリア！|全ステージクリア！|深淵の核をたおした！|.{2,10}が来る！)$'
SYM = r'[◀▶◁▷▲▼△▽✕✖✓✔★☆♪♫✨❤♥➡⬅⬆⬇↑↓←↗↘↙↖⇒]|[\U0001F000-\U0001FAFF]|[☀-⛿✀-➿]'
BANNED = r'ぜひ|便利|簡単|安心|おすすめ|ポイント|コツ|最強|圧倒的|NEW|——|—|―'

res = {}


def ok(k, cond, val=''):
    res[k] = {'pass': bool(cond), 'val': val}


def bad_text(t, where):
    """1つの文の決まり違い（なければ空）"""
    out = []
    t = t.strip()
    if not t:
        return out
    for line in t.split('\n'):
        line = line.strip()
        if not line:
            continue
        if re.search(CASUAL, line):
            out.append('語りかけ ' + where + '：' + line)
        if re.search(BANG, line) and not re.match(BANG_OK, line):
            out.append('！ ' + where + '：' + line)
        if re.search(SYM, line):
            out.append('記号 ' + where + '：' + line)
        if re.search(BANNED, line):
            out.append('使わない言葉 ' + where + '：' + line)
    return out


def static_src(src):
    """index.html の文字列：JS の '…'（コメントは除く）と、HTML の文字・aria-label・alt"""
    h = open(src, encoding='utf-8').read()
    i = h.index('<script>')
    html, js = h[:i], h[i:]
    html = re.sub(r'<style>.*?</style>', '', html, flags=re.S)
    js = re.sub(r'/\*.*?\*/', '', js, flags=re.S)
    out = []
    for m in re.finditer(r"'((?:[^'\\\n]|\\.)*)'", js):
        if re.search(r'[ぁ-んァ-ヶ一-龠！!]', m.group(1)) or re.search(SYM, m.group(1)):
            out.append(m.group(1))
    out += [x for x in re.findall(r'>([^<>]+)<', html) if x.strip()]
    out += re.findall(r'(?:aria-label|alt)="([^"]*)"', html)
    return out


def static(src):
    bad = []
    lits = static_src(src)
    for t in lits:
        # 文の切れはし（'を外した' など）も、それだけで見る
        bad += bad_text(t, 'index.html')
    ok('index.html の文字列（%d こ）：語りかけ・決まりの外の「！」・記号・使わない言葉なし' % len(lits), not bad, bad[:12])


DATA = r"""
()=>{const T=window.__T,bad=[],up=[],L=[];const chk=(k,v,n)=>{if(v==null)return;L.push([k,v]);if([...v].length>(n||22))bad.push(k+'（'+[...v].length+'字）：'+v);};
  const upChk=(k,v)=>{if(v&&/アップ/.test(v)&&!/\d/.test(v))up.push(k+'：'+v);};
  for(const t of T.TYPES){const m=T.MODS[t];chk(t+' desc',m.desc);chk(t+' eff',m.eff);if(m.unlock)chk(t+' 解放',m.unlock.txt);
    if(m.up)for(let l=2;l<=T.WMAX;l++){chk(t+' up'+l,m.up[l]);upChk(t+' up'+l,m.up[l]);if(!T.MODS[t].passive&&T.MODS[t].cat==='atk'&&!m.up[l])up.push(t+' up'+l+' なし');}}
  for(const t in T.EVO)chk(t+' 進化',T.EVO[t].desc);
  for(const id of T.SHIP_IDS){const s=T.SHIPS[id];chk(id+' desc',s.desc);chk(id+' skill',s.skill);chk(id+' skill2',s.skill2);chk(id+' 必殺',s.sp.desc);if(s.unlock)chk(id+' 解放',s.unlock.txt);}
  T.STAGES.forEach((s,i)=>chk('ステージ'+(i+1),s.desc));T.BOOK_E.forEach(b=>chk('敵 '+b.k,b.desc));
  for(const k in T.PAS){const p=T.PAS[k];if(p.at)p.at.forEach((s,i)=>{chk('強化 '+k+i,s);upChk('強化 '+k+i,s);});else{chk('強化 '+k,p.desc);upChk('強化 '+k,p.desc);}}
  for(const k in T.SUP){const s=T.SUP[k];(s.at||[s.first,s.more,s.last]).forEach((q,i)=>{chk('支援 '+k+i,q);upChk('支援 '+k+i,q);});}
  for(const k in T.SPC){chk('特別 '+k,T.SPC[k].good);chk('特別 '+k+' 代償',T.SPC[k].bad);}
  T.LAB.forEach(o=>chk('研究所 '+o.id,o.per));T.ACH.forEach(a=>chk('実績 '+a.id,a.desc));
  return {bad,up,L};}
"""


def data(pg):
    d = pg.evaluate(DATA)
    ok('説明の文（%d こ）：全角22字まで' % len(d['L']), not d['bad'], d['bad'])
    ok('レベルアップ・道中の強化・支援の文：数字のない「〜アップ」だけの文なし・攻撃の武器は Lv2〜8 に文あり', not d['up'], d['up'])
    b = []
    for k, v in d['L']:
        b += bad_text(v, k)
    ok('説明の文：語りかけ・「！」・記号・使わない言葉なし', not b, b[:10])
    ex = pg.evaluate("()=>{const M=window.__T.MODS;return [M.laser.up[2],M.laser.up[3],M.gatling.up[3],M.sword.up[2],M.cannon.up[4],M.shield.up[3]]}")
    ok('レベルアップの文の例：「威力 ＋33%・連射 ＋11%」の形', ex == ['威力 ＋33%・連射 ＋11%', 'ビームが2本になる・威力 ＋25%', '威力 ＋19%・連射 ＋18%', '威力 ＋41%・振る速さ ＋9%',
                                                              '威力 ＋19%・連射 ＋20%', '威力 ＋38%'], ex)


# 文の％と強さが合っているか（gt は文だけの表なので、stat の式から出した数字とくらべる）
GT = r"""
()=>{const T=window.__T,out=[];window.__go(1,'standard',['laser']);const R=T.R;
  for(const t of T.TYPES){const m=T.MODS[t];if(!m.gt)continue;R.tlv[t]=1;
    for(let l=2;l<=T.WMAX;l++){R.tlv[t]=l-1;const a=T.stat(t);R.tlv[t]=l;const b=T.stat(t);
      const d=Math.round((b.dmg/a.dmg-1)*100),r=a.cd!=null?Math.round((a.cd/b.cd-1)*100):0;
      if((m.gt.d[l]||0)!==d)out.push(t+' Lv'+l+' 威力 文'+(m.gt.d[l]||0)+' 式'+d);
      if(m.gt.r&&m.gt.r[l]!=null&&m.gt.r[l]!==r)out.push(t+' Lv'+l+' 連射 文'+m.gt.r[l]+' 式'+r);}
    R.tlv[t]=0;}
  return out;}
"""


def gt(pg):
    pg.evaluate(GO)
    d = pg.evaluate(GT)
    ok('はじめの12種・シールド・反射板：文の％（威力・連射）が強さの式と同じ', not d, d)


GO = r"""
()=>{window.__go=(n,id,list,opt)=>{const T=window.__T;window.__HOLD=1;opt=opt||{};const s=T.freshSave();T.save=s;s.howto=1;s.tut=1;s.rec.stageMax=n-1;s.st=n;
    for(const o of T.LAB)s.lab[o.id]=opt.labMax?o.max:0;T.ensureSlots(s);s.ships[id].have=true;T.setShip(id);const L=s.ships[id].eq;for(let i=0;i<L.length;i++)L[i]=null;
    list.forEach((t,i)=>{if(i<L.length){L[i]={t,d:0};s.owned[t]=9;}});T.setShip(id);T.startRun();const R=T.R;R.pending=0;R.chestQ=0;return R;};}
"""

# 画面の文字と飾り（いま見えている所）
SCAN = r"""
(label)=>{const out={txt:[],anim:[],sym:[],deco:[]};
  const vis=e=>!!(e.offsetParent||getComputedStyle(e).position==='fixed')&&getComputedStyle(e).visibility!=='hidden';
  for(const id of ['title','howto','hangar','sheetBg','shopSheet','labSheet','bookSheet','achSheet','sortie']){const e=document.getElementById(id);if(e&&!e.hidden)out.txt.push(e.innerText);}
  for(const e of document.querySelectorAll('body *')){if(e.closest('[hidden]'))continue;const cs=getComputedStyle(e);
    if(cs.animationName&&cs.animationName!=='none'&&!e.classList.contains('tfinger'))out.anim.push((e.id||e.className)+':'+cs.animationName);
    for(const pe of ['::before','::after']){const p=getComputedStyle(e,pe);if(!p.content||p.content==='none'||p.content==='normal'||p.display==='none')continue;
      const dot=parseFloat(p.width)<=16&&parseFloat(p.height)<=16||/50%/.test(p.borderRadius);/* 小さい点・丸い印（文字のない箱は、ボタンの下地なので数えない） */
      if(p.content!=='""'||dot)out.deco.push('擬似要素 '+(e.id||e.className)+pe+' '+p.content.slice(0,10));}
    if(e.classList.contains('badge')||e.classList.contains('tagnew')||/^NEW$/i.test(e.textContent.trim()))out.deco.push('札・点 '+(e.id||e.className));
    if(e.classList.contains('irow')&&parseFloat(cs.borderLeftWidth)>3)out.deco.push('左の帯 '+cs.borderLeftWidth);
    if(e.tagName==='BUTTON'&&vis(e)&&e.querySelector('img.pix')){const r=e.getBoundingClientRect();if(e.textContent.trim()||r.width<44||r.height<44)out.deco.push('アイコンのボタン '+(e.id||e.className)+' '+Math.round(r.width)+'x'+Math.round(r.height)+' '+e.textContent);}}
  const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){if(n.parentElement.closest('[hidden],script,style'))continue;if(/[◀▶✕↑↓←→↗↘↙↖👆]/.test(n.textContent)&&!/^LV\d+→\d+$/.test(n.textContent))out.sym.push(n.textContent);}
  out.toast=document.getElementById('note').hidden?'':document.getElementById('note').textContent;
  out.banner=document.getElementById('banner').hidden?'':document.getElementById('banner').textContent;
  return out;}
"""


class Screens:
    def __init__(self, pg):
        self.pg = pg
        self.bad = []
        self.n = 0
        self.seen = []

    def scan(self, label):
        o = self.pg.evaluate(SCAN, label)
        self.n += 1
        self.seen.append(label)
        for t in o['txt'] + [o['toast'], o['banner']]:
            self.bad += bad_text(t, label)
        self.bad += ['動き ' + label + '：' + a for a in o['anim']]
        self.bad += ['記号 ' + label + '：' + a for a in o['sym']]
        self.bad += ['飾り ' + label + '：' + a for a in o['deco']]
        return o


def screens(pg):
    S = Screens(pg)
    ev = pg.evaluate
    ev("()=>localStorage.clear()"); pg.reload(); pg.wait_for_timeout(400)
    S.scan('タイトル')
    pg.click('#startBtn'); pg.wait_for_timeout(150)
    for k in range(4):
        S.scan('遊び方%d' % (k + 1)); pg.click('#howNext'); pg.wait_for_timeout(80)
    pg.wait_for_timeout(200)
    S.scan('格納庫（はじめの案内①）')
    pg.locator('#slots .slotb').first.click(); pg.wait_for_timeout(200)
    S.scan('一覧（はじめの案内②）')
    pg.click('#sheet .irow.tut'); pg.wait_for_timeout(200)
    S.scan('向きをえらぶ（はじめの案内③）')
    pg.click('#sheet .dirs button.tut'); pg.wait_for_timeout(200)
    o = S.scan('格納庫（つけた）')
    ok('お知らせ：つけたとき「〇〇に〇〇をつけた（〇向き）」', o['toast'].endswith('をつけた（上向き）'), o['toast'])
    # 装備を持たせて、格納庫の板を1つずつ
    ev("""()=>{const T=window.__T,s=T.save;s.tut=1;s.gold=2000;Object.assign(s.owned,{gatling:1,shotgun:1,sword:1,armor:1,magnet:1,booster:1});s.unl=T.TYPES.filter(t=>T.MODS[t].unlock&&T.isUnl(t));
      T.persist();T.renderAll();}""")
    pg.locator('#slots .slotb.full').first.click(); pg.wait_for_timeout(200)
    S.scan('向き（レーザー）')
    icons = ev("()=>[...document.querySelectorAll('#sheet .dirs button')].map(b=>[b.textContent,!!b.querySelector('img.pix'),b.getAttribute('aria-label')])")
    ok('向きの8つのボタン：文字なし・点の絵・読み上げは「上向き」など', len(icons) == 8 and all(i[0] == '' and i[1] and i[2].endswith('向き') for i in icons), icons[:2])
    pg.locator('#sheet .dirs button').nth(2).click(); pg.wait_for_timeout(100)
    pr = ev("()=>[...document.querySelectorAll('#sheet .dirs button')].map(b=>b.getAttribute('aria-pressed')+b.querySelector('img').src.length).join(',')")
    ok('向きをえらぶと、えらんだ矢印だけ黄色の絵になる', pr.split(',')[2].startswith('true') and pr.count('true') == 1, pr[:40])
    pg.click('#sheet .sbtns .warn'); pg.wait_for_timeout(150)
    o = S.scan('格納庫（外した）')
    ok('お知らせ：外したとき「〇〇の〇〇を外した」', o['toast'].endswith('を外した'), o['toast'])
    ev("()=>{const T=window.__T;T.save.load[0]={t:'laser',d:0};T.save.load[1]={t:'armor',d:0};T.persist();T.renderAll();}")
    pg.locator('#slots .slotb.full').nth(1).click(); pg.wait_for_timeout(200)
    S.scan('向き（装甲板：向きに関係なし）')
    pg.click('#sheet .x'); pg.wait_for_timeout(100)
    pg.locator('#slots .slotb.empty').first.click(); pg.wait_for_timeout(200)
    S.scan('一覧')
    ev("()=>{const T=window.__T;T.closeSheet();T.save.load[2]={t:'laser',d:0};T.save.owned.laser=2;T.persist();T.renderAll();}")
    pg.locator('#slots .slotb.empty').first.click(); pg.wait_for_timeout(200)
    pg.locator('#sheet .irow:not([disabled])').first.click(); pg.wait_for_timeout(150)
    ev("()=>window.__T.closeSheet()")
    ev("()=>{const T=window.__T;T.openInfo();}"); pg.wait_for_timeout(150)
    S.scan('くわしく')
    ev("()=>{const T=window.__T;T.closeSheet();const s=T.freshSave();s.howto=1;s.tut=1;T.save=s;T.setShip('standard');T.persist();T.renderAll();}")
    pg.locator('#slots .slotb').first.click(); pg.wait_for_timeout(150)
    ev("()=>{const T=window.__T;T.save.owned.laser=0;T.closeSheet();}")
    pg.locator('#slots .slotb').first.click(); pg.wait_for_timeout(150)
    o = S.scan('一覧（装備なし）')
    ev("()=>window.__T.closeSheet()")
    # まだ持っていない機体（条件のまま／解放ずみ）
    ev("()=>{const T=window.__T;T.save.rec.clears=0;T.stepShip(1);}"); pg.wait_for_timeout(120)
    S.scan('格納庫（まだの機体）')
    ev("()=>{const T=window.__T;T.save.rec.clears=1;T.renderAll();}"); pg.wait_for_timeout(120)
    o = S.scan('格納庫（解放ずみの機体）')
    ok('解放ずみの機体：「解放ずみ・〇〇G で買える」', '解放ずみ・' in o['txt'][0] and '！' not in o['txt'][0], '')
    # ステージえらび（まだのステージ）
    ev("()=>{const T=window.__T;T.stepShip(-1);T.save.st=3;T.renderAll();}"); S.scan('ステージ（まだ）')
    ev("()=>{const T=window.__T;T.save.st=1;T.save.gold=5000;T.renderAll();}")
    # ショップ
    pg.click('#shopBtn'); pg.wait_for_timeout(200)
    for k in range(4):
        pg.locator('#shopTabs button').nth(k).click(); pg.wait_for_timeout(100)
        S.scan('ショップ タブ%d' % (k + 1))
    dots = ev("()=>document.querySelectorAll('#shopTabs span, .badge').length")
    ok('ショップのタブとボタンに赤い点なし', dots == 0, dots)
    pg.locator('#shopTabs button').nth(1).click(); pg.wait_for_timeout(100)
    pg.locator('#shopGrid .sitem.can').first.click(); pg.wait_for_timeout(150)
    S.scan('ショップ くわしく（品）')
    pg.click('#sheet .buybig'); pg.wait_for_timeout(150)
    note = ev("()=>document.getElementById('shopNote').textContent")
    ok('買ったとき：「〇〇を買った。格納庫の「＋」からつけられる」', 'を買った。格納庫の「＋」からつけられる' in note, note)
    S.scan('ショップ（買った）')
    ev("()=>window.__T.openDetail('fan')"); pg.wait_for_timeout(120); S.scan('ショップ くわしく（まだの品）')
    ev("()=>{const T=window.__T;T.closeSheet();T.openDetail('rapid');}"); pg.wait_for_timeout(120)
    o = S.scan('ショップ くわしく（機体・達成）')
    ok('機体のくわしく：条件を満たすと「達成」（！なし）', '1 / 1　達成' in o['txt'][-1] or '達成' in ''.join(o['txt']), '')
    pg.click('#sheet .buybig'); pg.wait_for_timeout(150)
    note = ev("()=>document.getElementById('shopNote').textContent")
    ok('機体を買ったとき：「〇〇を手に入れた。出撃する機体にした」（◀ ▶ なし）', note.startswith('ラピッドを手に入れた。出撃する機体にした'), note)
    ev("()=>{const T=window.__T;T.closeSheet();T.openDetail('omega');}"); pg.wait_for_timeout(120); S.scan('ショップ くわしく（まだの機体）')
    ev("()=>window.__T.closeSheet()")
    pg.click('#debugGold'); pg.wait_for_timeout(100); S.scan('ショップ（試作用）')
    pg.click('#shopClose'); pg.wait_for_timeout(150)
    # 研究所・図鑑・実績
    ev("()=>window.__T.openLab()"); pg.wait_for_timeout(150); S.scan('研究所')
    ev("()=>window.__T.openLabDetail('r_reroll')"); pg.wait_for_timeout(120); S.scan('研究所 くわしく')
    ev("()=>{const T=window.__T;T.closeSheet();document.getElementById('labSheet').hidden=true;T.openBook();}"); pg.wait_for_timeout(150); S.scan('図鑑')
    pg.locator('#bookBody .bgrid button').first.click(); pg.wait_for_timeout(120); S.scan('図鑑 くわしく')
    ev("()=>window.__T.closeSheet()")
    pg.locator('#bookBody .bgrid button.no').first.click(); pg.wait_for_timeout(120); S.scan('図鑑 まだ')
    ev("()=>{const T=window.__T;T.closeSheet();T.closeBook();T.openAch();}"); pg.wait_for_timeout(150); S.scan('実績')
    ev("()=>{const T=window.__T;document.getElementById('achSheet').hidden=true;T.renderAll();}")
    # 出撃（レベルアップ・除外・宝箱・一時停止）
    ev(GO)
    ev("""()=>{const T=window.__T;window.__seed(5);const R=window.__go(1,'standard',['laser','gatling','shield','magnet']);document.getElementById('hangar').hidden=true;
      T.save.lab.r_reroll=1;T.save.lab.r_skip=1;T.save.lab.r_ban=1;R.lab=Object.assign({},T.save.lab);R.rr=1;R.sk=1;R.bn=1;R.tlv.laser=3;R.tlv.gatling=2;R.lv=6;R.sup.strike=1;T.openLevelUp();}""")
    pg.wait_for_timeout(450)
    S.scan('レベルアップ')
    pg.locator('#overlay .lvacts button').nth(2).click(); pg.wait_for_timeout(120)
    o = S.scan('レベルアップ（除外）')
    ok('除外の説明：「この出撃で出なくする強化をえらぶ」（22字まで）', 'この出撃で出なくする強化をえらぶ' in o['txt'][-1], '')
    ev("()=>{const T=window.__T;T.R.pending=0;T.resume();T.openChest();}"); pg.wait_for_timeout(450); S.scan('宝箱')
    ev("()=>{const T=window.__T;T.resume();T.openPause();}"); pg.wait_for_timeout(150); S.scan('一時停止')
    # 道中のお知らせ（大型の敵・がんばり）
    bn = ev("""()=>{const T=window.__T,R=T.R;T.resume();const out=[];const b=T.addBig('boss');b.hp=1;T.hit(b,999,0,0);out.push(document.getElementById('banner').textContent);
      R.hp=1;R.inv=0;R.guts=true;T.hurt(50);out.push(document.getElementById('banner').textContent);return out;}""")
    ok('道中のお知らせ：「大型の敵をたおした」「がんばり：HP1 でたえた」（！なし）', bn == ['大型の敵をたおした', 'がんばり：HP1 でたえた'], bn)
    for t in bn:
        S.bad += bad_text(t, '道中のお知らせ')
    # 結果（撃墜・撤退・クリア）とエンディング
    for lab, js in (('結果（撃墜）', "R.t=100;T.endRun(false,false)"), ('結果（撤退）', "R.t=40;T.endRun(false,true)"), ('結果（クリア）', "R.t=300;T.endRun(true,false)")):
        o = ev("()=>{const T=window.__T;const R=window.__go(1,'standard',['laser']);document.getElementById('hangar').hidden=true;document.getElementById('sortie').hidden=false;" + js + ";return document.getElementById('overlay').innerText}")
        S.scan(lab)
    ok('結果の文：撃墜「HPが0になった」・クリア「クリア！」と「5分 生きのびた」', '5分 生きのびた' in o and 'クリア！' in o, o[:30])
    pg.click('#overlay .btnrow .go'); pg.wait_for_timeout(150)
    o = S.scan('格納庫（結果のあと）')
    ok('結果のあとのお知らせ：「〇〇G かせいだ」', re.match(r'^\d+G かせいだ$', o['toast'] or ''), o['toast'])
    o = ev("""()=>{const T=window.__T;const R=window.__go(5,'standard',['laser']);document.getElementById('hangar').hidden=true;document.getElementById('sortie').hidden=false;
      R.stage=5;R.stg=5;R.t=200;T.endRun(true,false);const ov=document.getElementById('overlay');return [!!ov.querySelector('.endt'),ov.querySelector('.endt')&&ov.querySelector('.endt').textContent,ov.innerText];}""")
    S.scan('エンディング')
    ok('エンディング：英語なし・「おわり」と「全ステージクリア！」', o[0] and o[1] == 'おわり' and '全ステージクリア！' in o[2] and not re.search('[A-Za-z]{3,}', o[2]), o[1])
    pg.click('#overlay .go'); pg.wait_for_timeout(150)
    S.scan('結果（最終ステージ）')
    ok('画面の文字（%d 画面）：語りかけ・決まりの外の「！」・記号・使わない言葉なし／NEW の札・赤い点・左の帯・動き（指のほか）なし' % S.n, not S.bad, S.bad[:12])
    # アイコンのボタン（格納庫）
    ev("()=>{const T=window.__T;document.getElementById('sortie').hidden=true;document.getElementById('hangar').hidden=false;T.save=T.freshSave();T.save.howto=1;T.save.tut=1;T.setShip('standard');T.toHangarFromTitle();}"); pg.wait_for_timeout(150)
    ic = ev("""()=>['toTitle','shipPrev','shipNext','stPrev','stNext'].map(id=>{const b=document.getElementById(id),r=b.getBoundingClientRect(),im=b.querySelector('img.pix');
      return [id,b.textContent,!!im&&im.src.startsWith('data:image/png'),Math.round(r.width),Math.round(r.height)];})""")
    ok('◀ ▶ のボタン（タイトルへ・機体・ステージ）：文字なし・点の絵・44px 以上', all(i[1] == '' and i[2] and i[3] >= 44 and i[4] >= 44 for i in ic), ic)
    ev("()=>window.__T.openInfo()"); pg.wait_for_timeout(100)
    x = ev("()=>{const b=document.querySelector('#sheet .x'),r=b.getBoundingClientRect();return [b.textContent,!!b.querySelector('img.pix'),Math.round(r.width),Math.round(r.height),b.getAttribute('aria-label')]}")
    ok('✕ のボタン（板をとじる）：文字なし・点の絵・44px・読み上げ「とじる」', x[0] == '' and x[1] and x[2] >= 44 and x[3] >= 44 and x[4] == 'とじる', x)
    ev("()=>window.__T.closeSheet()")
    an = ev("""()=>{const a=getComputedStyle(document.querySelector('#slots .slotb.empty')).animationName;window.__T.openList(0);const b=getComputedStyle(document.getElementById('sheet')).animationName;window.__T.closeSheet();
      return [a,b];}""")
    ok('空き枠の「＋」はふくらまない・下から出る板は動かない', an == ['none', 'none'], an)


RES6 = r"""
(p)=>{const T=window.__T;window.__HOLD=1;localStorage.clear();const s=T.freshSave();T.save=s;s.howto=1;s.tut=1;s.ships.standard.eq[0]={t:'laser',d:0};T.setShip('standard');
  if(p.many){s.rec.kills=9999;s.rec.chests=9;s.lab.r_reroll=3;s.rec.bossesFast=0;}
  document.getElementById('hangar').hidden=true;document.getElementById('sortie').hidden=false;
  T.startRun();const R=T.R;R.kills=2200;R.lv=19;R.tlv.laser=8;R.bossKills=1;R.t=p.clear?300:260;if(p.many){R.chestN=12;R.spN=60;R.lv=31;R.spcN=3;}T.endRun(!!p.clear,false);
  const ov=document.getElementById('overlay'),bs=[...ov.querySelectorAll('.btnrow button')].map(b=>{const r=b.getBoundingClientRect();return [b.textContent,Math.round(r.top),Math.round(r.bottom)];});
  return {lab:[...ov.querySelectorAll('.unll li.lab')].map(l=>l.textContent),unl:[...ov.querySelectorAll('.unll li:not(.lab)')].map(l=>[l.textContent,!!(l.querySelector('img')&&l.querySelector('img').src.startsWith('data:'))]),
    ach:ov.querySelectorAll('.gotl li').length?ov.querySelector('.gotl li').textContent:'',sh:ov.scrollHeight,ch:ov.clientHeight,top:ov.scrollTop,bs,h:innerHeight,over:ov.classList.contains('over'),
    best:!!ov.querySelector('.stats li.best'),opened:!!ov.querySelector('.sub.unl')};}
"""


def result_fit(b, errs, warns, pp):
    pg = open_page(b, pp, 390, 660, errs, warns)
    r = pg.evaluate(RES6, {})
    items = [u for u in r['unl'] if u[0] != 'ボマー']
    ok('結果（解放6こ＋新しい機体ボマー・実績4つ・新記録）：アイコンと名前を小さく並べる', len(items) == 6 and ['ボマー', True] in r['unl'] and all(u[1] for u in r['unl']) and r['best'], r['unl'])
    ok('結果：研究所の解放も同じ並び（エンジン・えらび直し）', sorted(r['lab']) == sorted(['エンジン', 'えらび直し']), r['lab'])
    ok('結果（解放6こ）：幅390・高さ660 でスクロールなし・ボタン2つが画面の中', r['sh'] <= r['ch'] and all(x[2] <= 660 for x in r['bs']) and len(r['bs']) == 2, [r['sh'], r['ch'], r['bs']])
    ok('結果：実績は1行（「千体」「嵐の出撃」… ＋G）', r['ach'].startswith('実績「') and r['ach'].endswith('G'), r['ach'])
    pg.close()
    pg = open_page(b, pp, 390, 560, errs, warns)
    r = pg.evaluate(RES6, {'clear': True, 'many': True})
    ok('もっと多いとき（ステージの解放・実績たくさん・高さ560）：ボタンは画面の下に見えている', r['over'] and r['opened'] and all(0 <= x[1] and x[2] <= r['h'] for x in r['bs']), [r['sh'], r['ch'], r['bs'], r['ach'][:30]])
    pg.close()


SET = """()=>{const T=window.__T;const s=T.freshSave();T.save=s;s.howto=1;s.tut=1;s.gold=900;
 Object.assign(s.owned,{laser:2,gatling:1,shotgun:1,sword:1,armor:1,magnet:1});s.ships.standard.eq[0]={t:'laser',d:0};s.ships.standard.eq[1]={t:'gatling',d:0};
 T.setShip('standard');T.persist();}"""
LV = """()=>{const T=window.__T;T.closeShop();window.__seed(7);window.__HOLD=1;document.getElementById('hangar').hidden=true;document.getElementById('sortie').hidden=false;
 T.startRun();const R=T.R;R.tlv.laser=3;R.tlv.gatling=2;R.lv=6;T.openLevelUp();document.getElementById('banner').hidden=true;}"""
RS = """()=>{const T=window.__T;const R=T.R;Object.assign(R,{kills:2200,lv:19,bossKills:1,t:260});R.tlv.laser=8;R.state='play';T.endRun(false,false);}"""


def shots(b, errs, warns):
    from PIL import Image
    before = os.path.join(TMP, 'copy16-before.html')
    open(before, 'w', encoding='utf-8').write(subprocess.run(['git', '-C', ROOT, 'show', 'a4bc3e4:index.html'], capture_output=True, text=True, check=True).stdout)
    rows = []
    for src in (before, SRC):
        pp = write_build(src, seed=True)
        pg = open_page(b, pp, 390, 660, [] if src == before else errs, [] if src == before else warns)
        pg.evaluate(SET); pg.click('#startBtn'); pg.wait_for_timeout(300)
        ims = []
        def snap(n):
            p = os.path.join(TMP, 'c16-%d-%s.png' % (len(rows), n)); pg.screenshot(path=p); ims.append(Image.open(p))
        snap('hangar')
        pg.evaluate("()=>window.__T.openList(2)"); pg.wait_for_timeout(300); snap('list')
        pg.evaluate("()=>{const T=window.__T;T.closeSheet();T.openShop();}"); pg.wait_for_timeout(300); snap('shop')
        pg.evaluate(LV); pg.wait_for_timeout(500); snap('lvup')
        pg.evaluate(RS); pg.wait_for_timeout(300); snap('result')
        rows.append(ims)
        pg.close()
    # 上に画面の名前、行の頭に「直す前／直したあと」
    from PIL import ImageDraw, ImageFont
    gap, lab = 10, 34
    w, h = rows[0][0].width, rows[0][0].height
    o = Image.new('RGB', (w * 5 + gap * 4, lab + (lab + h) * 2 + gap), (255, 255, 255))
    d = ImageDraw.Draw(o)
    try:
        f = ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc', 22)
    except Exception:
        f = ImageFont.load_default()
    for k, n in enumerate(['格納庫', '装備の一覧', 'ショップ', 'レベルアップ', '結果（解放6こ）']):
        d.text((k * (w + gap) + 6, 4), n, fill=(0, 0, 0), font=f)
    for r, ims in enumerate(rows):
        y = lab + r * (lab + h + gap)
        d.text((6, y + 4), ('直す前（a4bc3e4）' if r == 0 else '直したあと') + '　幅390・高さ660', fill=(150, 30, 30) if r == 0 else (20, 110, 40), font=f)
        for k, i in enumerate(ims):
            o.paste(i, (k * (w + gap), y + lab))
    o.save(os.path.join(SHOTS, '16-before-after.png'))


def main():
    errs, warns = [], []
    static(SRC)
    pp = write_build(seed=True)
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = open_page(b, pp, 390, 844, errs, warns)
        data(pg)
        gt(pg)
        screens(pg)
        pg.close()
        result_fit(b, errs, warns, pp)
        if '--shots' in sys.argv:
            shots(b, errs, warns)
        b.close()
    ok('コンソールのエラー0・警告0', not errs and not warns, (errs + warns)[:5])
    ng = [k for k, v in res.items() if not v['pass']]
    for k, v in res.items():
        print(('OK ' if v['pass'] else 'NG ') + k + ('' if v['pass'] else '  ' + json.dumps(v['val'], ensure_ascii=False)[:600]))
    print('合計 %d 項目 NG %d' % (len(res), len(ng)))
    sys.exit(1 if ng else 0)


if __name__ == '__main__':
    main()
