"""総点検のチェック（issue #14）
使い方: python3 tools/test/check14.py
- 装備69種・進化14種を、ステージ4・5で1つずつ（Lv8・大型の敵・大蛇・砲台・レーザーの壁・まぼろし・岩）40秒早送り：エラー0・ダメージを与える
- 研究所すべて最大＋道中の強化を全部取った状態で、ステージ4・5を早送り：エラー0
- セーブ：試作5（main）の形・試作4の形・#11 の形・#12 の形を読める／保存 → 読みこみで同じ／こわれたセーブ（14通り）で初めからになり、ページも動く／
  出撃のとちゅうで閉じて開き直す（出撃の分は入らない・止まらない）
- タップだけのひと回り（本物のクリック）：タイトル → 遊び方 → 格納庫 → 装備をつける → 向き → 外す → ショップで買う → 機体を買って切りかえる →
  研究所 → 図鑑 → 実績 → ステージえらび → 出撃 → レベルアップ → 一時停止（音 OFF・ON）→ 再開 → 結果 → ショップ
- 一時停止の間は時間が進まない・画面がかくれると一時停止。音 OFF のときは音を作らない
- #13 の点検で直したこと：大蛇の体の当たり・レーザーの壁の幅・エンディングは初回だけ・消えたまぼろしをねらわない・霜の弾
- コンソールのエラーと警告0
"""
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness14 import write_build, open_page
from playwright.sync_api import sync_playwright

GO = r"""
()=>{window.__go=(n,id,list,opt)=>{const T=window.__T;window.__HOLD=1;opt=opt||{};const s=T.freshSave();T.save=s;s.howto=1;s.tut=1;s.rec.stageMax=n-1;s.st=n;
    for(const o of T.LAB)s.lab[o.id]=opt.labMax?o.max:0;T.ensureSlots(s);s.ships[id].have=true;T.setShip(id);const L=s.ships[id].eq;for(let i=0;i<L.length;i++)L[i]=null;
    list.forEach((t,i)=>{if(i<L.length){L[i]={t,d:0};s.owned[t]=9;}});T.setShip(id);T.startRun();const R=T.R;R.pending=0;R.chestQ=0;return R;};
  window.__ui=()=>{const T=window.__T,R=T.R;if(R.state!=='lvup')return;if(T.lvChoices){const c=T.lvChoices.filter(o=>!o.used);T.pickChoice(c[(Math.random()*c.length)|0]);}
    else{const b=document.querySelector('#overlay .btnrow .go');if(b){b.disabled=false;b.click();}}};}
"""

# 1つの装備（と進化）をステージ n で40秒
PART = r"""
([t,n,evo])=>{const T=window.__T;const list=[t];if(T.MODS[t].passive)list.push('laser');if(evo)list.push(T.EVO[t].p);
  const R=window.__go(n,'standard',list);for(const m of R.mods)if(!T.MODS[m.t].passive)R.tlv[m.t]=T.WMAX;if(evo)R.evo[t]=true;T.calcCS();
  R.t=160;R.bossAt=[];R.acc=0;R.lzAt=R.t+2;
  if(n===4){T.addBig('snake');T.addBig('fort');}else{const c=T.addBig('core');c.hp=c.max=c.max*0.3;T.addBig('icequeen');}
  for(const k of ['warp','guard','hider','splitter','charger','frost','turret'])for(let i=0;i<3;i++)T.addEnemy(k,40+Math.random()*400,60+Math.random()*300);
  T.addRock(200,80,1,Math.PI/2,60);T.addWall(true,200);
  let dmg=0;for(let i=0;i<60*40&&R.state!=='over';i++){if(R.state!=='play'){window.__ui();continue;}
    let hp0=0;for(const e of R.E)hp0+=e.hp;T.update(1/60);if(i%12===0){T.draw();T.hud();}R.hp=R.maxHp;
    let hp1=0;for(const e of R.E)hp1+=e.hp;if(hp1<hp0)dmg+=hp0-hp1;}
  return {t,n,evo,kills:R.kills,dmg:Math.round(dmg),state:R.state};}
"""

# 研究所最大＋強化を全部最大＋特別な強化も全部
ALLMAX = r"""
([n,id])=>{const T=window.__T;const R=window.__go(n,id,['laser','missile','gatling','thunder','sword','mine','shield','plasma','saw','cannon'],{labMax:1});
  for(const m of R.mods)R.tlv[m.t]=T.WMAX;for(const k in R.pas)R.pas[k]=T.PAS[k].max||5;for(const k in R.sup)for(let i=0;i<T.SUP[k].max;i++)T.supUp(k);
  for(const k of T.SPC_IDS)R.spc[k]=1;T.calcCS();let steps=0;
  for(let i=0;i<60*(n===5?420:300)*2&&steps<60*(n===5?420:300)+30&&R.state!=='over';i++){if(R.state!=='play'){window.__ui();continue;}T.update(1/60);steps++;if(i%15===0){T.draw();T.hud();}R.hp=Math.max(R.hp,R.maxHp*0.5);}
  const ov=document.getElementById('overlay');if(/Thanks/.test(ov.textContent))ov.querySelector('.go').click();
  return {n,id,t:Math.round(R.t),kills:R.kills,lv:R.lv,state:R.state,clear:/クリア！/.test(ov.textContent)};}
"""

SAVES = r"""
()=>{const T=window.__T,res={};const ok=(k,pass,val)=>{res[k]={pass:!!pass,val};};const K=T.KEY;
  const ld=o=>{localStorage.setItem(K,typeof o==='string'?o:JSON.stringify(o));return T.loadSave();};
  /* 試作5（main）の形：7か所の load・owned・best */
  {const own={};for(const t of T.TYPES)own[t]=0;own.laser=2;own.missile=1;own.armor=1;
    const s=ld({gold:1234,owned:Object.assign({},{laser:2,gatling:1,missile:1,shield:1,armor:1}),load:[null,{t:'laser',d:0},{t:'laser',d:1},{t:'missile',d:7},null,{t:'armor',d:4},null],best:{t:240,kills:900,clear:false},tut:1,howto:1,snd:false});
    const eq=s.ships.standard.eq.filter(Boolean).map(v=>v.t).sort().join(',');
    ok('試作5の形：お金・持ち物・装備・記録・音',s.gold===1234&&s.owned.gatling===1&&eq==='armor,laser,laser,missile'&&s.best.t===240&&s.snd===false&&s.rec.stageMax===0&&s.st===1,eq);}
  /* 試作4の形：load だけ（owned なし）→ 持っていない装備は外れる。クリアの記録あり */
  {const s=ld({gold:50,load:[{t:'laser',d:0},{t:'laser',d:0},{t:'laser',d:0},{t:'missile',d:0}],rec:{clears:1}});
    const eq=s.ships.standard.eq.filter(Boolean).map(v=>v.t).join(',');ok('試作4の形：持っている数より多い装備は外す・ステージ1クリアあつかい',s.gold===50&&eq==='laser,laser'&&s.rec.stageMax===1&&s.st===1,eq);}
  /* #11 の形：機体あり・研究所・実績・図鑑なし */
  {const s=ld({gold:5000,owned:{laser:2,sword:2},ships:{standard:{have:true,eq:[null,{t:'laser',d:0},{t:'laser',d:0}]},blade:{have:true,eq:[null,{t:'sword',d:7},{t:'sword',d:1}]}},cur:'blade',evo:{laser:1},rec:{clears:4,bosses:3,goldTotal:4000,wmax:{laser:8},sup5:[],fastBoss:1}});
    ok('#11 の形：機体・進化・記録（進化の回数は進化から）',s.cur==='blade'&&s.ships.blade.have&&s.rec.evos===1&&s.lab.r_hp===0&&Object.keys(s.ach).length===0&&s.rec.stageMax===1,s.cur+','+s.rec.evos);}
  /* 保存 → 読みこみで同じ */
  {const s=T.freshSave();s.gold=4321;s.owned.missile=3;s.ships.blade.have=true;s.ships.blade.eq[1]={t:'missile',d:2};s.cur='blade';s.lab.r_hp=3;s.lab.r_slot=1;s.ach.clear1=1;s.book.e.bug=12;s.evo.laser=1;
    s.rec.clears=5;s.rec.stageMax=3;s.st=4;s.rec.time=999;s.rec.wmax.laser=8;s.rec.sup5=['drone'];s.best={t:300,kills:2000,clear:true};s.snd=false;s.tut=1;s.howto=1;s.seen=['rapid'];
    T.ensureSlots(s);T.save=s;T.setShip('blade');T.persist();const a=JSON.parse(localStorage.getItem(K));const b=T.loadSave();const bb=JSON.parse(JSON.stringify(b));delete bb.load;
    const norm=o=>JSON.stringify(o,Object.keys(o).sort());const same=JSON.stringify(a)===JSON.stringify(Object.assign({},a,bb))&&norm(a)===norm(bb);
    const diff=Object.keys(a).filter(k=>JSON.stringify(a[k])!==JSON.stringify(bb[k]));ok('保存 → 読みこみで同じ',diff.length===0,diff.join(','));}
  /* こわれたセーブ：止まらずに読める・形がそろう */
  const bad=['{','null','[]','"abc"','12','{"gold":"abc","owned":5,"ships":[],"lab":"x","rec":null,"book":{"e":[1,2]},"ach":7,"cur":"nope","st":"x"}',
    '{"gold":-50,"ships":{"standard":{"have":false,"eq":[{"t":"nope","d":99},{"t":"laser","d":-1},null,5,{"t":"laser","d":1.5}]}}}',
    '{"gold":1e308,"owned":{"laser":1e9},"lab":{"r_hp":99,"r_slot":-3},"rec":{"stageMax":99,"clears":-1,"wmax":{"laser":"x"},"sup5":["nope","drone","drone"]},"st":99}',
    '{"ships":{"standard":{"have":true,"eq":"x"},"omega":{"have":true,"eq":null}},"cur":"omega","seen":"x","evo":"x","best":{"t":"x"}}',
    '{"book":null,"ach":{"clear1":"yes"},"rec":{"time":"5"},"lab":null}',
    '{"ships":{"standard":null,"blade":{"have":true,"eq":[[1],{}]}},"cur":"blade","owned":null}',
    '{"__proto__":{"x":1},"gold":10}','\u0000\u0001','{"gold":5,"ships":{"rapid":{"have":true,"eq":[{"t":"laser","d":0},{"t":"laser","d":0},{"t":"laser","d":0}]}},"cur":"rapid"}'];
  bad.forEach((raw,i)=>{let s,err='';try{s=ld(raw);}catch(e){err=String(e);}
    const shape=s&&Number.isFinite(s.gold)&&s.gold>=0&&T.SHIP_IDS.every(id=>s.ships[id]&&Array.isArray(s.ships[id].eq)&&s.ships[id].eq.length===T.SHIPS[id].slots.length)&&s.ships.standard.have
      &&T.SHIPS[s.cur]&&s.ships[s.cur].have&&s.st>=1&&s.st<=Math.min(5,s.rec.stageMax+1)&&s.rec.stageMax<=5&&T.LAB.every(o=>s.lab[o.id]>=0&&s.lab[o.id]<=o.max)
      &&T.SHIP_IDS.every(id=>T.TYPES.every(t=>s.ships[id].eq.filter(v=>v&&v.t===t).length<=s.owned[t]));
    ok('こわれたセーブ'+(i+1)+'：止まらない・形がそろう',!err&&shape,err||(s?('gold='+s.gold+' cur='+s.cur+' st='+s.st):''));});
  localStorage.removeItem(K);return res;}
"""

# #13 の点検で直したこと
REVIEW = r"""
()=>{const T=window.__T,res={};const ok=(k,pass,val)=>{res[k]={pass:!!pass,val};};
  /* 大蛇：体11個に同じ範囲の攻撃が当たっても、頭がへるのは1回分 */
  {const R=window.__go(4,'standard',['laser']);R.bossAt=[];R.acc=-1e9;R.lzAt=1e9;R.turT=1e9;const b=T.addBig('snake');for(let i=0;i<20;i++)T.update(1/60);
    T.buildGrid();const h0=b.hp;R.t+=0.001;for(const s of b.segs)T.hit(s,50,0,0);T.hit(b,50,0,0);const d1=h0-b.hp;
    R.t+=1/60;const h1=b.hp;T.hit(b.segs[2],50,0,0);T.hit(b.segs[3],30,0,0);const d2=h1-b.hp;
    ok('大蛇：同じフレームの同じ攻撃は1回分',Math.abs(d1-50)<1e-6&&Math.abs(d2-80)<1e-6,d1+','+d2);
    ok('大蛇：体の id は頭と同じ（当たり済みの印が1つ）',b.segs.every(s=>s.id===b.id),'');}
  /* レーザーの壁：はなれて14（見た目の半幅12＋2）では当たらない・10では当たる */
  {const R=window.__go(4,'standard',['laser']);R.bossAt=[];R.acc=-1e9;R.lzAt=1e9;R.turT=1e9;R.x=240;R.y=500;
    const h0=window.__HURT;T.addWall(true,254);for(let i=0;i<120;i++){T.update(1/60);R.x=240;R.y=500;R.inv=0;}const a=window.__HURT-h0;
    T.addWall(true,250);for(let i=0;i<120;i++){T.update(1/60);R.x=240;R.y=500;R.inv=0;}const b=window.__HURT-h0-a;
    ok('レーザーの壁：14はなれると当たらない・10で当たる',a===0&&b===1,a+','+b);}
  /* 霜の弾：バリアで防いだときは遅くならない */
  {const R=window.__go(3,'standard',['laser']);R.inv=0;R.spInv=0;R.bar=true;R.EB.push({x:R.x,y:R.y,vx:0,vy:0,dmg:8,big:false,dead:false,slow:1});T.update(1/60);
    ok('霜の弾：バリアで防ぐと遅くならない',R.chill<=0&&!R.bar,R.chill);
    R.inv=0;R.spInv=0;R.EB.push({x:R.x,y:R.y,vx:0,vy:0,dmg:8,big:false,dead:false,slow:1});T.update(1/60);ok('霜の弾：当たると遅くなる',R.chill>0,R.chill);}
  /* 消えているまぼろしはねらわない（ホーミング・いなずま） */
  {const R=window.__go(5,'standard',['missile']);R.bossAt=[];R.acc=-1e9;R.waveAt=1e9;R.E.length=0;const e=T.addEnemy('warp',R.x,R.y-120);e.hide=1;e.st=1;e.tm=9;
    let tg=0;for(let i=0;i<90;i++){T.update(1/60);e.hide=1;e.tm=9;for(const m of R.M)if(m.target===e)tg++;}
    ok('消えているまぼろしをミサイルがねらわない',tg===0&&e.hp===e.max,tg);}
  /* エンディング：はじめてステージ5をクリアした回だけ */
  {const s0=T.freshSave();const R=window.__go(5,'standard',['laser']);T.save.rec.stageMax=5;R.bossAt=[];R.acc=-1e9;R.t=300;const b=T.addBig('core');for(let i=0;i<5;i++)T.update(1/60);T.hit(b,1e9,0,0);
    for(let i=0;i<60*5&&R.state!=='over';i++){if(R.state!=='play'){window.__ui();continue;}T.update(1/60);}
    const t=document.getElementById('overlay').textContent;ok('2回目のステージ5クリア：エンディングなし・結果',R.state==='over'&&!/Thanks/.test(t)&&/クリア！/.test(t),t.slice(0,30));}
  return res;}
"""

PAUSE = r"""
()=>{const T=window.__T,res={};const ok=(k,pass,val)=>{res[k]={pass:!!pass,val};};
  const R=window.__go(1,'standard',['laser']);window.__HOLD=0;
  return new Promise(done=>{setTimeout(()=>{const t0=R.t;T.openPause();const st=R.state;setTimeout(()=>{const t1=R.t;
      ok('一時停止：時間が止まる',st==='pause'&&Math.abs(t1-t0)<0.05&&!document.getElementById('overlay').hidden,t0.toFixed(2)+'→'+t1.toFixed(2));
      document.querySelector('#overlay .go').click();setTimeout(()=>{ok('再開：時間が進む',R.state==='play'&&R.t>t1+0.2,R.t.toFixed(2));
        Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));delete document.hidden;
        ok('画面がかくれると一時停止',R.state==='pause',R.state);T.resume();window.__HOLD=1;done(res);},600);},500);},400);});}
"""


def flow(pg, errs):
    """本物のクリックでひと回り"""
    res = {}
    def ok(k, p, v=''):
        res[k] = {'pass': bool(p), 'val': v}
    vis = lambda s: pg.locator(s).first.is_visible()
    pg.evaluate("()=>{localStorage.clear();}"); pg.reload(); pg.wait_for_timeout(500)
    ok('タイトル', vis('#title') and vis('#startBtn'))
    pg.click('#sndBtn'); off = pg.evaluate("()=>window.__T.save.snd===false"); pg.click('#sndBtn')
    ok('タイトルの音 OFF → ON', off and pg.evaluate("()=>window.__T.save.snd!==false"))
    pg.click('#howBtn'); pg.wait_for_timeout(200); ok('遊び方がひらく', vis('#howto'))
    n = 0
    while vis('#howto') and n < 10:
        pg.click('#howNext'); pg.wait_for_timeout(120); n += 1
    ok('遊び方を最後まで → とじる', not vis('#howto'), n)
    pg.click('#startBtn'); pg.wait_for_timeout(300)
    n = 0
    while vis('#howto') and n < 10:
        pg.click('#howNext'); pg.wait_for_timeout(120); n += 1
    ok('出撃の準備（格納庫）', vis('#hangar'))
    pg.click('#slots .slotb.empty'); pg.wait_for_timeout(200)
    # #15：新しいセーブはレーザー1つ・場所は全部空き → はじめの案内のとおり一覧のレーザーをつける
    ok('あいた場所をタップ → 装備の一覧（はじめはレーザー1つ）', vis('#sheet .irow') and pg.locator('#sheet .irow:not([disabled])').count() == 1)
    pg.click('#sheet .irow:not([disabled])'); pg.wait_for_timeout(200)
    full = pg.locator('#slots .slotb.full').count()
    ok('一覧のレーザーをつける', full == 1 and not vis('#sheetBg'), full)
    pg.click('#slots .slotb.full'); pg.wait_for_timeout(200)
    ok('つけた装備をタップ → 向き', vis('#sheet .dirs'), full)
    pg.locator('#sheet .dirs button').nth(2).click(); pg.wait_for_timeout(100)
    pressed = pg.locator('#sheet .dirs button[aria-pressed=true]').count()
    pg.click('#sheet .btn3.warn'); pg.wait_for_timeout(200)
    ok('向きをかえる → 外す', pressed == 1 and pg.locator('#slots .slotb.full').count() == full - 1)
    pg.click('#slots .slotb.empty'); pg.wait_for_timeout(200)
    pg.click('#sheet .irow:not([disabled])'); pg.wait_for_timeout(200)
    ok('あいた場所 → レーザーをつける', pg.locator('#slots .slotb.full').count() == full and not vis('#sheetBg'))
    pg.click('#shopBtn'); pg.wait_for_timeout(200); ok('ショップ', vis('#shopSheet'))
    pg.click('#debugGold'); pg.wait_for_timeout(100)
    g0 = pg.evaluate("()=>window.__T.save.gold")
    pg.locator('#shopGrid .sitem.can').first.click(); pg.wait_for_timeout(200)
    pg.click('#sheet .buybig'); pg.wait_for_timeout(200)
    ok('くわしく → 買う', pg.evaluate("()=>window.__T.save.gold") < g0, g0)
    pg.evaluate("()=>{const T=window.__T;Object.assign(T.save.rec,{clears:1,stageMax:1});T.save.gold+=3000;T.renderAll();}")
    pg.locator('#shopTabs button').first.click(); pg.wait_for_timeout(150)
    tabs = pg.locator('#shopTabs button').count()
    items = pg.locator('#shopGrid .sitem.can')
    bought = ''
    if items.count():
        items.first.click(); pg.wait_for_timeout(200); pg.click('#sheet .buybig'); pg.wait_for_timeout(200)
        bought = pg.evaluate("()=>window.__T.save.cur")
    pg.click('#shopClose'); pg.wait_for_timeout(200)
    ok('機体を買う → 格納庫で切りかわる', bought and bought != 'standard' and vis('#hangar'), bought + ' tabs=%d' % tabs)
    pg.click('#shipPrev'); pg.wait_for_timeout(150); pg.click('#shipNext'); pg.wait_for_timeout(150)
    ok('機体の ◀ ▶', vis('#shipName'))
    pg.click('#labBtn'); pg.wait_for_timeout(200)
    pg.locator('#labGrid button').first.click(); pg.wait_for_timeout(200)
    l0 = pg.evaluate("()=>window.__T.save.lab.r_hp")
    if pg.locator('#sheet .buybig:not([disabled])').count():
        pg.click('#sheet .buybig'); pg.wait_for_timeout(200)
    ok('研究所 → くわしく → 強化', pg.evaluate("()=>window.__T.save.lab.r_hp") == l0 + 1, l0)
    pg.keyboard.press('Escape'); pg.wait_for_timeout(100)
    if vis('#labSheet'):
        pg.click('#labClose'); pg.wait_for_timeout(150)
    pg.click('#bookBtn'); pg.wait_for_timeout(200); okb = vis('#bookSheet'); pg.click('#bookClose'); pg.wait_for_timeout(150)
    pg.click('#achBtn'); pg.wait_for_timeout(200); oka = vis('#achSheet'); pg.click('#achClose'); pg.wait_for_timeout(150)
    ok('図鑑・実績がひらいて、とじる', okb and oka and vis('#hangar'))
    pg.click('#stNext'); pg.wait_for_timeout(100)
    st2 = pg.evaluate("()=>window.__T.save.st")
    pg.click('#stPrev'); pg.wait_for_timeout(100)
    ok('ステージえらび（2 → 1）', st2 == 2 and pg.evaluate("()=>window.__T.save.st") == 1, st2)
    pg.click('#launchBtn'); pg.wait_for_timeout(500)
    ok('出撃', vis('#sortie') and pg.evaluate("()=>window.__T.R&&window.__T.R.state==='play'"))
    pg.evaluate("()=>{window.__T.R.pending=1;}"); pg.wait_for_timeout(400)
    ok('レベルアップの画面', pg.locator('#overlay .card').count() >= 3)
    pg.wait_for_timeout(400); pg.locator('#overlay .card').first.click(); pg.wait_for_timeout(200)
    ok('強化をえらぶ → 出撃にもどる', pg.evaluate("()=>window.__T.R.state==='play'"))
    pg.click('#pauseBtn'); pg.wait_for_timeout(200)
    pg.locator('#overlay .btnrow .btn2').first.click(); s_off = pg.evaluate("()=>window.__T.save.snd===false")
    pg.locator('#overlay .btnrow .btn2').first.click(); s_on = pg.evaluate("()=>window.__T.save.snd!==false")
    pg.click('#overlay .btnrow .go'); pg.wait_for_timeout(200)
    ok('一時停止 → 音 OFF・ON → 続ける', s_off and s_on and pg.evaluate("()=>window.__T.R.state==='play'"))
    pg.evaluate("()=>{const R=window.__T.R;R.t=window.__T.RUN_LEN-0.05;}"); pg.wait_for_timeout(600)
    if pg.locator('#overlay .btnrow .go').count() and pg.locator('#overlay h2').first.inner_text() == '宝箱':
        pg.wait_for_timeout(400); pg.click('#overlay .btnrow .go'); pg.wait_for_timeout(300)
    txt = pg.locator('#overlay').inner_text()
    ok('結果の画面（クリア）', 'クリア' in txt and 'かせいだお金' in txt, txt[:20].replace('\n', ' '))
    pg.click('#overlay .btnrow .btn2'); pg.wait_for_timeout(300)
    ok('結果 → ショップ', vis('#shopSheet') and vis('#hangar'))
    pg.click('#shopClose'); pg.wait_for_timeout(150)
    pg.click('#toTitle'); pg.wait_for_timeout(200); ok('格納庫 → タイトル', vis('#title'))
    return res


def main():
    errs, warns, fails = [], [], 0
    def report(title, res):
        nonlocal fails
        for k, v in res.items():
            if not v['pass']:
                fails += 1; print('NG', title, k, v['val'])
        print('%s: %d 項目' % (title, len(res)), flush=True)
    pp = write_build(seed=True)
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = open_page(b, pp, 390, 844, errs, warns)
        report('タップのひと回り', flow(pg, errs))
        pg.evaluate("()=>window.__seed(14)")
        pg.evaluate(GO)
        pg.evaluate("()=>{const T=window.__T;T.save.howto=1;}")
        report('セーブ', pg.evaluate(SAVES))
        pg.evaluate("()=>{document.getElementById('title').hidden=true;document.getElementById('hangar').hidden=true;document.getElementById('sortie').hidden=false;}")
        report('#13 の点検', pg.evaluate(REVIEW))
        report('一時停止', pg.evaluate(PAUSE))
        # 音 OFF のときは AudioContext を作らない
        snd = pg.evaluate("()=>{let n=0;const A=window.AudioContext;window.AudioContext=function(){n++;return new A();};window.webkitAudioContext=window.AudioContext;"
                          "const T=window.__T;T.save.snd=false;const R=window.__go(1,'standard',['laser']);for(let i=0;i<600;i++){T.update(1/60);R.hp=R.maxHp;if(R.state!=='play')window.__ui();}window.AudioContext=A;return n;}")
        ok_snd = snd == 0
        if not ok_snd:
            fails += 1
        print('音 OFF：AudioContext を作った数', snd, '' if ok_snd else 'NG')
        # 装備69種・進化14種をステージ4・5で
        types = pg.evaluate("()=>window.__T.TYPES"); evos = pg.evaluate("()=>Object.keys(window.__T.EVO)")
        nodmg = []
        for n in (4, 5):
            for t in types:
                r = pg.evaluate(PART, [t, n, False])
                if r['dmg'] <= 0 and not pg.evaluate("(t)=>!!window.__T.MODS[t].passive", t):
                    nodmg.append('%s@%d' % (t, n))
            for t in evos:
                r = pg.evaluate(PART, [t, n, True])
                if r['dmg'] <= 0:
                    nodmg.append('evo %s@%d' % (t, n))
        print('装備%d種・進化%d種 × ステージ4・5：ダメージなし %s' % (len(types), len(evos), nodmg or 'なし'), flush=True)
        if nodmg:
            fails += 1
        for n, sid in ((4, 'omega'), (5, 'standard'), (5, 'carrier')):
            r = pg.evaluate(ALLMAX, [n, sid])
            print('研究所・強化を全部最大', r, flush=True)
            if r['state'] != 'over' or not r['clear']:
                fails += 1; print('NG 全部最大で終わらない')
        # 出撃のとちゅうで閉じて開き直す
        pg.evaluate("()=>{localStorage.clear();const T=window.__T;T.save=T.freshSave();T.save.howto=1;T.save.gold=777;T.save.ships.standard.eq[0]={t:'laser',d:0};T.persist();}")  # #15：新しいセーブは装備なし → 機首にレーザー
        pg.reload(); pg.wait_for_timeout(400); pg.click('#startBtn'); pg.wait_for_timeout(200); pg.click('#launchBtn'); pg.wait_for_timeout(1500)
        pg.reload(); pg.wait_for_timeout(500)
        g = pg.evaluate("()=>window.__T.save.gold")
        title = pg.locator('#title').is_visible()
        print('出撃のとちゅうで閉じる → 開き直す：お金', g, 'タイトル', title)
        if g != 777 or not title:
            fails += 1; print('NG とちゅうで閉じる')
        # こわれたセーブのままページを開く
        for raw in ['{', '{"ships":[],"cur":"x","lab":"x","rec":null}', '{"gold":1e308,"st":99,"rec":{"stageMax":99}}']:
            pg.evaluate("(r)=>localStorage.setItem(window.__T.KEY,r)", raw)
            pg.reload(); pg.wait_for_timeout(400); pg.click('#startBtn'); pg.wait_for_timeout(300)
            for _ in range(10):
                if pg.locator('#howto').is_visible():
                    pg.click('#howNext'); pg.wait_for_timeout(100)
            if not pg.locator('#hangar').is_visible():
                fails += 1; print('NG こわれたセーブで格納庫がひらかない', raw)
        pg.evaluate("()=>localStorage.clear()")
        b.close()
    for e in errs[:10]:
        print('ERR', e)
    for w in warns[:10]:
        print('WARN', w)
    print('エラー', len(errs), '・警告', len(warns), '・NG', fails)
    sys.exit(1 if errs or warns or fails else 0)


if __name__ == '__main__':
    main()
