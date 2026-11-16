"""ステージ5つのテスト（issue #13）
使い方: python3 tools/test/stages13.py [index.html]
- テスト用のコピーに window.__T を足して Playwright（chromium）で開く。外への読みこみ（フォント）は止める
- 文：ステージ・図鑑の新しい名前と説明（全角22字まで）と使わない言葉。格納庫・結果・エンディングの画面
- 5ステージそれぞれ SECS 秒（ふつう300）早送り：強い装備とはじめの装備。エラー0・ステージの敵と大型の敵が出る・大型の敵をたおせる・クリア
- ステージ5：5:00 で終わらない・最終ボスをたおすとクリア → エンディング → オメガ解放・実績「深淵の先へ」「全機そろい」
- しかけ：岩（こわすとお金・ぶつかると痛い）・吹雪（遅くなる）・レーザーの壁（予告のあと当たると痛い・よけられる）
- 敵：岩やどりの岩・盾持ちの盾・割れ氷が分かれる・まぼろしが消える・大蛇の体
- 解放の順番とセーブ・古いセーブ（#12 の形）
- 重さ：ステージ5の最終ボスと敵が多いとき 1フレーム（update＋draw）
"""
import os, sys, tempfile
from playwright.sync_api import sync_playwright

SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', '..', 'index.html')
SECS = float(os.environ.get('SECS', '300'))

EXPOSE = ("window.__HURT=0;window.__DMG=0;"
          "window.__T={get R(){return R},update,draw,hud,stat,startRun,addEnemy,addBig,addRock,addWall,shootAt,hit,hurt,contact,moveEB,moveEnemies,gems,gainXp,calcCS,buildGrid,movePlayer,"
          "openLevelUp,pickChoice,get lvChoices(){return lvChoices},endRun,supUp,stageSetup,bgOf,stOpen,renderStage,stepStage,renderAll,renderEquip,"
          "get save(){return save},set save(v){save=v},loadSave,persist,freshSave,setShip,shipProg,layoutEditor,ensureSlots,checkAch,bookCount,BOOK_N,openBook,closeBook,closeSheet,toHangarFromTitle,"
          "keys,SHIPS,SHIP_IDS,KIND,MODS,TYPES,EVO,PAS,SUP,LAB,ACH,BOOK_E,STAGES,BIG,AI,ESPR,KEY,U,GW,RUN_LEN,WMAX,get GH(){return GH}};\n")


def build(src):
    h = open(src, encoding='utf-8').read()
    def rp(a, b):
        nonlocal h
        assert h.count(a) == 1, a
        h = h.replace(a, b)
    rp("  if(!R)return;\n  raf=requestAnimationFrame(frame);", "  if(!R||window.__HOLD)return;\n  raf=requestAnimationFrame(frame);")
    rp("function hurt(d){\n  if(R.inv>0)return;", "function hurt(d){\n  if(R.inv>0)return;window.__HURT++;")
    i = h.rindex('})();\n</script>')
    h = h[:i] + EXPOSE + h[i:]
    return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' + h + '</body></html>'


HELPERS = r"""
()=>{
  /* ステージ n・機体 id で出撃（list の武器をつける）。requestAnimationFrame は止めて外から動かす */
  window.__go=(n,id,list,lab)=>{const T=window.__T;window.__HOLD=1;T.save.rec.stageMax=Math.max(T.save.rec.stageMax,n-1);T.save.st=n;
    for(const o of T.LAB)T.save.lab[o.id]=(lab&&lab[o.id])||0;T.ensureSlots(T.save);T.save.ships[id].have=true;T.setShip(id);const L=T.save.load;for(let i=0;i<L.length;i++)L[i]=null;
    (list||['laser']).forEach((t,i)=>{if(i<L.length){L[i]={t,d:0};T.save.owned[t]=Math.max(T.save.owned[t],9);}});
    T.startRun();const R=T.R;R.pending=0;return R;};
  window.__chestOk=()=>{const b=document.querySelector('#overlay .btnrow .go');if(b){b.disabled=false;b.click();}};
  window.__stepUI=()=>{const T=window.__T,R=T.R;if(R.state==='lvup'){if(T.lvChoices){const c=T.lvChoices.filter(o=>!o.used);T.pickChoice(c[(Math.random()*c.length)|0]);}else window.__chestOk();}};
}
"""

BAN = r"/[！!✨★▶✓☆♪🏆]|してね|だよ|しよう|しましょう|ぜひ|便利|簡単|安心|おすすめ|ポイント|コツ|最強|圧倒的|——|―|NEW|[\u{1F300}-\u{1FAFF}]/u"

TEXT = r"""
(BANS)=>{const T=window.__T,bad=[];const BAN=new RegExp(BANS.slice(1,BANS.lastIndexOf('/')),'u');
  const chk=(where,s,max)=>{if(!s){bad.push(where+' 文なし');return;}const n=[...s].length;if(max&&n>max)bad.push(where+' 長い '+n+'字：'+s);if(BAN.test(s))bad.push(where+' 使わない言葉：'+s);};
  T.STAGES.forEach((s,i)=>{chk('STAGE'+(i+1)+' name',s.name,8);chk('STAGE'+(i+1)+' desc',s.desc,22);});
  for(const b of T.BOOK_E){chk('BOOK '+b.k+' name',b.name,8);chk('BOOK '+b.k+' desc',b.desc,22);if(!T.ESPR[b.k])bad.push('BOOK '+b.k+' 絵なし');}
  return {bad,n:{stages:T.STAGES.length,book:T.BOOK_E.length,newE:T.BOOK_E.filter(b=>b.st>1&&!/^大型|^最終/.test(b.desc)).length,big:T.BOOK_E.filter(b=>b.st>1&&/^大型|^最終/.test(b.desc)).length}};}
"""

# ステージを早送り。strong＝強い装備（研究所も上げる）。HP は半分より下がらないようにして最後まで進める
RUN = r"""
([n,strong,secs])=>{const T=window.__T;T.save=T.freshSave();
  const R=strong?window.__go(n,'standard',['laser','missile','gatling','thunder','sword','mine','shield'],{r_pow:5,r_rate:5,r_hp:5}):window.__go(n,'standard',['laser']);
  if(strong){for(const m of R.mods)R.tlv[m.t]=5;T.calcCS();}
  const seen={},big={},bigK={},hp0=window.__HURT;let worst=0,maxE=0,maxEB=0,lz=0,rocks=0,snow=0,chill=0,steps=0,minHp=1;
  const t0=performance.now();
  for(let i=0;i<secs*60*1.6&&R.state!=='over';i++){
    if(R.state!=='play'){window.__stepUI();if(R.state!=='play')continue;}
    const a=performance.now();T.update(1/60);if(i%20===0){T.draw();T.hud();}const d=performance.now()-a;if(d>worst&&i>30)worst=d;steps++;
    for(const e of R.E){seen[e.kind]=1;if(e.kind==='boss')big[e.art]=1;if(e.kind==='rock')rocks++;}
    if(R.LZ.length)lz++;if(R.snow>0)snow++;if(R.chill>0)chill++;maxE=Math.max(maxE,R.E.length);maxEB=Math.max(maxEB,R.EB.length);
    minHp=Math.min(minHp,R.hp/R.maxHp);if(R.state!=='over')R.hp=Math.max(R.hp,R.maxHp*0.5);
    if(R.t>secs+(n===5?240:1))break;}
  const res=document.getElementById('overlay').textContent;
  return {n,strong,t:Math.round(R.t),state:R.state,clear:/クリア/.test(res),ending:/Thanks for playing/.test(res),kills:R.kills,lv:R.lv,bossKills:R.bossKills,
    seen:Object.keys(seen).sort().join(','),big:Object.keys(big).join(','),book:Object.keys(T.save.book.e).join(','),hurt:window.__HURT-hp0,
    worst:+worst.toFixed(1),maxE,maxEB,lz,rocks:rocks>0,snow,chill,ms:Math.round(performance.now()-t0),stageMax:T.save.rec.stageMax,gold:T.save.gold};}
"""

# 大型の敵を1体ずつ出して、たおせる（動き・攻撃にエラーがない）。たおした時間
BIGT = r"""
(art)=>{const T=window.__T;T.save=T.freshSave();const R=window.__go(5,'standard',['laser','missile','gatling','thunder'],{r_pow:5,r_rate:5});
  for(const m of R.mods)R.tlv[m.t]=6;T.calcCS();R.bossAt=[];R.bossArt=[];R.waveAt=1e9;R.acc=-1e9;R.t=200;
  const b=T.addBig(art);let t=0,shots=0;const eb0=R.EB.length;
  for(let i=0;i<60*120&&!b.dead;i++){if(R.state!=='play'){window.__stepUI();continue;}T.update(1/60);if(i%15===0)T.draw();R.hp=R.maxHp;t+=1/60;shots=Math.max(shots,R.EB.length);
    if(i===60*20&&!b.dead){T.hit(b,b.max*0.3,0,0);}}
  return {art,dead:b.dead,t:+t.toFixed(1),hp:Math.round(b.max),r:b.r,shots,segs:b.segs?b.segs.length:0,segsDead:b.segs?b.segs.every(s=>s.dead):true,state:R.state};}
"""

# 敵とわなの動き
UNITS = r"""
()=>{const T=window.__T,res={};const ok=(k,pass,val)=>{res[k]={pass:!!pass,val};};
  /* 岩やどり：岩の間は30%・近くで飛び出す */
  {T.save=T.freshSave();const R=window.__go(2,'standard',['laser']);R.bossAt=[];R.acc=-1e9;R.waveAt=1e9;R.rockT=1e9;
    const e=T.addEnemy('hider',R.x,R.y-400);T.buildGrid();const h0=e.hp;T.hit(e,10,0,0);const d1=h0-e.hp;e.y=R.y-100;T.moveEnemies(1/60);const sh=e.shell;const h1=e.hp;T.hit(e,10,0,0);
    ok('岩やどり：岩の間は30%・近づくと岩をすてる',Math.abs(d1-3)<1e-6&&!sh&&Math.abs(h1-e.hp-10)<1e-6,d1.toFixed(2)+','+sh);}
  /* 盾持ち：前からは15%・後ろからは100%・爆風（向きなし）は100% */
  {const R=T.R;R.E.length=0;const e=T.addEnemy('guard',240,200);e.fa=Math.PI/2;const h0=e.hp;T.hit(e,10,0,-50);const d1=h0-e.hp;T.hit(e,10,0,50);const d2=h0-d1-e.hp;T.hit(e,10,0,0);const d3=h0-d1-d2-e.hp;
    ok('盾持ち：前30%・後ろ100%・向きなし100%',Math.abs(d1-3)<1e-6&&Math.abs(d2-10)<1e-6&&Math.abs(d3-10)<1e-6,[d1,d2,d3].map(v=>v.toFixed(1)).join(','));}
  /* 割れ氷：たおすと氷のかけら2つ */
  {const R=T.R;R.E.length=0;const e=T.addEnemy('splitter',240,200);T.hit(e,1e9,0,0);const n=R.E.filter(o=>o.kind==='shard'&&!o.dead).length;ok('割れ氷：2つに分かれる',n===2,n);}
  /* 岩：こわすとお金（撃破には数えない）・ぶつかると痛くて、こわれる */
  {const R=T.R;R.E.length=0;R.C.length=0;const k0=R.kills;const r=T.addRock(240,200,2,Math.PI/2,50);T.hit(r,1e9,0,0);const c=R.C.reduce((n,o)=>n+o.v,0);
    ok('岩：こわすとお金7G・撃破に数えない',c===7&&R.kills===k0,c+'G '+(R.kills-k0));
    R.inv=0;R.spInv=0;const hp0=R.hp;const r2=T.addRock(R.x,R.y,0,Math.PI/2,50);T.buildGrid();T.contact();ok('岩：ぶつかると痛い・こわれる',R.hp<hp0&&r2.dead,(hp0-R.hp).toFixed(1));}
  /* まぼろし：消えている間は当たらない */
  {const R=T.R;R.E.length=0;const e=T.addEnemy('warp',240,200);e.st=1;e.tm=0;T.moveEnemies(1/60);const hid=e.hide;const h0=e.hp;T.hit(e,10,0,0);const same=e.hp===h0;
    for(let i=0;i<60;i++)T.moveEnemies(1/60);ok('まぼろし：消える・その間は当たらない・またあらわれる',hid&&same&&!e.hide,hid+','+same+','+e.hide);}
  /* 霜の撃ち手の弾：当たると遅くなる */
  {T.save=T.freshSave();const R=window.__go(3,'standard',['laser']);R.inv=0;R.spInv=0;R.x=240;R.y=400;
    const sp=()=>{const x=R.x;T.keys.add('ArrowRight');T.movePlayer(0.1);T.keys.clear();const v=R.x-x;R.x=240;return v;};const v0=sp();
    R.EB.push({x:R.x,y:R.y,vx:0,vy:0,dmg:8,big:false,dead:false,slow:1});T.moveEB(1/60);const v1=sp();
    ok('霜の弾：当たると72%の速さ',R.chill>0&&Math.abs(v1/v0-0.72)<0.01,(v1/v0).toFixed(3));
    R.chill=0;R.snow=1;const v2=sp();R.snow=0;ok('吹雪：自機は88%の速さ',Math.abs(v2/v0-0.88)<0.01,(v2/v0).toFixed(3));}
  /* レーザーの壁：予告の間は当たらない・光ると当たる・はなれていれば当たらない */
  {T.save=T.freshSave();const R=window.__go(4,'standard',['laser']);R.bossAt=[];R.acc=-1e9;R.lzAt=1e9;R.turT=1e9;R.x=240;R.y=500;R.inv=0;R.spInv=0;
    const h0=window.__HURT;T.addWall(false,500);for(let i=0;i<60;i++){T.update(1/60);R.inv=0;}const h1=window.__HURT-h0;for(let i=0;i<30;i++){T.update(1/60);}const h2=window.__HURT-h0;
    T.addWall(false,300);for(let i=0;i<150;i++){T.update(1/60);R.inv=0;}const h3=window.__HURT-h0;
    ok('レーザーの壁：予告0・光ると1回・はなれると0',h1===0&&h2===1&&h3===1,[h1,h2,h3].join(','));}
  /* 大蛇の体に当てると頭の体力がへる */
  {T.save=T.freshSave();const R=window.__go(4,'standard',['laser']);R.bossAt=[];R.acc=-1e9;R.lzAt=1e9;R.turT=1e9;const b=T.addBig('snake');for(let i=0;i<30;i++)T.update(1/60);
    const s=b.segs[5],h0=b.hp;T.hit(s,100,0,0);ok('大蛇：体に当てると頭がへる・体は11',Math.abs(h0-b.hp-100)<1e-6&&b.segs.length===11,(h0-b.hp).toFixed(1));
    T.hit(b,1e9,0,0);ok('大蛇：頭をたおすと体も消える',b.segs.every(o=>o.dead),'');}
  return res;}
"""

# 解放の順番・セーブ・ステージ5のクリアでオメガと実績・古いセーブ
UNLOCK = r"""
()=>{const T=window.__T,res={};const ok=(k,pass,val)=>{res[k]={pass:!!pass,val};};
  T.save=T.freshSave();T.setShip('standard');const s=T.save;
  ok('はじめ：ステージ1だけ',T.stOpen(1)&&!T.stOpen(2)&&s.st===1,'');
  T.toHangarFromTitle();T.stepStage(1);T.renderEquip();const lb=document.getElementById('launchBtn');
  ok('まだのステージ：かぎ・出撃できない',!document.getElementById('stLock').hidden&&lb.disabled&&/解放/.test(document.getElementById('stDesc').textContent),document.getElementById('stDesc').textContent+'／'+lb.textContent);
  T.stepStage(-1);ok('ステージ1にもどす：出撃できる',!lb.disabled&&document.getElementById('stLock').hidden,lb.textContent);
  /* ステージ1〜4をクリア → 次が解放・えらぶステージが次へ */
  const golds=[];
  for(let n=1;n<=4;n++){const R=window.__go(n,'standard',['laser']);R.bossAt=[];R.acc=-1e9;R.t=T.RUN_LEN-0.01;R.state='play';
    for(let i=0;i<5&&R.state!=='over';i++){if(R.state!=='play')window.__chestOk();else T.update(0.02);}
    const txt=document.getElementById('overlay').textContent;const m=txt.match(/クリアボーナス\+(\d+)G/);golds.push(m?+m[1]:0);
    ok('ステージ'+n+' クリア → '+(n+1)+' が解放・えらぶ',T.save.rec.stageMax===n&&T.stOpen(n+1)&&T.save.st===n+1&&txt.includes('「'+T.STAGES[n].name+'」が解放'),T.save.rec.stageMax+','+T.save.st);}
  ok('クリアのお金：300・450・600・800G（ステージ5の1200Gは下）',golds.join(',')==='300,450,600,800',golds.join(','));
  /* ステージ5：5:00 では終わらない */
  {const R=window.__go(5,'standard',['laser']);R.bossAt=[];R.acc=-1e9;R.t=T.RUN_LEN-0.01;T.update(0.02);T.update(0.02);ok('ステージ5：5:00 で終わらない',R.state==='play',R.state);
    T.endRun(false,true);}
  /* オメガ以外の11機をもっている → ステージ5の最終ボスをたおす → エンディング → 結果 → オメガが解放 → 買うと全機そろい */
  T.SHIP_IDS.forEach(id=>{if(id!=='omega')T.save.ships[id].have=true;});T.save.gold=0;
  ok('オメガ：ステージ5の前は条件をみたさない',!T.shipProg('omega').ok,'');
  {const R=window.__go(5,'standard',['laser']);R.bossAt=[];R.acc=-1e9;R.t=300;const b=T.addBig('core');for(let i=0;i<10;i++)T.update(1/60);T.hit(b,1e9,0,0);
    const g0=T.save.gold;for(let i=0;i<60*5&&R.state!=='over';i++){if(R.state!=='play'){window.__chestOk();continue;}T.update(1/60);}
    const ov=document.getElementById('overlay');const end=ov.textContent;
    ok('最終ボスをたおすとクリア・エンディング',R.state==='over'&&/Thanks for playing/.test(end)&&/これまでの記録/.test(end),end.slice(0,60));
    ok('エンディングの画面に記録',['出撃した時間','クリア','たおした敵','実績','図鑑'].every(w=>end.includes(w)),'');
    ok('エンディングの文：「！」はクリアの表示だけ',(end.match(/！/g)||[]).length===1&&/全ステージクリア！/.test(end),'');
    ov.querySelector('.go').click();const rs=ov.textContent;
    ok('結果：深淵の核・クリアのお金1200G',/深淵の核をたおした/.test(rs)&&rs.includes('クリアボーナス+1200G'),rs.slice(0,80));
    ok('オメガが解放・実績「深淵の先へ」',T.shipProg('omega').ok&&T.save.ach.stage5===1&&/オメガ/.test(rs),T.save.rec.stageMax);
    T.save.gold+=T.SHIPS.omega.price;T.save.ships.omega.have=true;const got=T.checkAch();ok('オメガを手に入れる → 実績「全機そろい」',T.save.ach.shipAll===1,got.map(a=>a.id).join(','));}
  /* セーブに残る */
  T.persist();{const s2=T.loadSave();ok('セーブ：クリアしたステージ・えらんだステージ・時間',s2.rec.stageMax===5&&s2.st===T.save.st&&s2.rec.time>0,s2.rec.stageMax+','+s2.st+','+s2.rec.time);}
  /* 古いセーブ（#12 の形：st・time がない） */
  localStorage.setItem(T.KEY,JSON.stringify({v:2,gold:900,owned:{laser:2},ships:{standard:{have:true,eq:[{t:'laser',d:0}]}},cur:'standard',lab:{r_hp:2},ach:{clear1:1},book:{e:{bug:30,boss:1}},
    rec:{clears:3,bosses:2,goldTotal:900,wmax:{laser:4},sup5:[],fastBoss:0,bestKills:300,halfClear:1,meleeK:0,evos:0,stageMax:1,kills:400,bestLv:12,chests:1,spTotal:3,bestSpc:0,nodmg:0},best:{t:300,kills:300,clear:true},tut:1,howto:1}));
  {const s3=T.loadSave();ok('古いセーブ（#12）：読める・ステージ2まで',s3.gold===900&&s3.rec.stageMax===1&&s3.st===1&&s3.rec.time===0&&s3.book.e.bug===30&&s3.lab.r_hp===2,JSON.stringify({st:s3.st,m:s3.rec.stageMax}));}
  /* #10 より前：stageMax がなくてクリアしている → ステージ1クリアあつかい。えらんだステージは解放の所まで */
  localStorage.setItem(T.KEY,JSON.stringify({gold:100,load:[{t:'laser',d:0}],rec:{clears:2},st:5}));
  {const s4=T.loadSave();ok('古いセーブ（試作4）：ステージ1クリアあつかい・えらぶのは2まで',s4.rec.stageMax===1&&s4.st===2,s4.rec.stageMax+','+s4.st);}
  localStorage.removeItem(T.KEY);T.save=T.freshSave();T.setShip('standard');
  return res;}
"""

BOOKT = r"""
()=>{const T=window.__T,res={};const ok=(k,pass,val)=>{res[k]={pass:!!pass,val};};
  T.save=T.freshSave();T.setShip('standard');
  ok('図鑑 全部で 69＋14＋12＋20',T.BOOK_N()===115&&T.BOOK_E.length===20,T.BOOK_N());
  T.openBook();const n=document.querySelectorAll('#bookBody .bgrid button').length;ok('図鑑の画面：115個',n===115,n);T.closeBook();
  /* ステージ2で出会った敵が図鑑に（岩・大蛇の体は入らない） */
  {const R=window.__go(2,'standard',['laser']);R.bossAt=[];['hider','charger'].forEach(k=>T.addEnemy(k,240,100));const r=T.addRock(240,100,0,1.5,40);T.hit(r,1e9,0,0);const b=T.addBig('gnaw');T.hit(b,1e9,0,0);T.endRun(false,true);
    const e=T.save.book.e;ok('出会った敵・大型の敵が図鑑に（岩は入らない）',e.hider===0&&e.charger===0&&e.gnaw===1&&e.rock==null,JSON.stringify(e));}
  T.openBook();ok('図鑑の画面に「！」なし',!/[！!]/.test(document.getElementById('bookSheet').textContent),'');T.closeBook();
  return res;}
"""

PERF = r"""
()=>{const T=window.__T;T.save=T.freshSave();const R=window.__go(5,'standard',['laser','missile','gatling','sword','mine','thunder','shield'],{r_pow:5,r_rate:5});
  for(const m of R.mods)R.tlv[m.t]=T.WMAX;for(const k in R.sup)for(let i=0;i<T.SUP[k].max;i++)T.supUp(k);T.calcCS();
  R.bossAt=[];R.t=305;const b=T.addBig('core');b.hp=b.max*0.2;const s=T.addBig('snake');
  const fill=()=>{while(R.E.length<260){const k=['bug','shard','warp','charger','frost','guard','splitter','hider'][(Math.random()*8)|0];const a=Math.random()*6.28,d=120+Math.random()*250;T.addEnemy(k,R.x+Math.cos(a)*d,R.y+Math.sin(a)*d*0.9);}};
  for(let i=0;i<90;i++){fill();if(R.state!=='play')window.__stepUI();T.update(1/60);T.draw();R.hp=R.maxHp;b.hp=Math.max(b.hp,b.max*0.2);s.hp=s.max;}
  T.addWall(true,100);T.addWall(false,300);
  const more=window.__eb?()=>{while(R.EB.length<320)R.EB.push({x:Math.random()*T.GW,y:Math.random()*T.GH*0.6,vx:(Math.random()-0.5)*60,vy:40+Math.random()*60,dmg:8,big:Math.random()<0.2,slow:Math.random()<0.2?1:0,dead:false});}:()=>{};
  const ts=[];for(let i=0;i<300;i++){fill();more();if(R.state!=='play'){window.__stepUI();R.state='play';}const a=performance.now();T.update(1/60);T.draw();ts.push(performance.now()-a);R.hp=R.maxHp;b.hp=Math.max(b.hp,b.max*0.2);s.hp=s.max;}
  ts.sort((a,b)=>a-b);return {med:+ts[ts.length>>1].toFixed(2),p95:+ts[Math.floor(ts.length*0.95)].toFixed(2),max:+ts[ts.length-1].toFixed(2),E:R.E.length,EB:R.EB.length,ph:b.ph};}
"""

STAGE_E = {1: ['bug', 'tank', 'shooter'], 2: ['hider', 'charger', 'rock'], 3: ['frost', 'splitter', 'shard'], 4: ['turret', 'guard'], 5: ['warp']}
STAGE_B = {1: ['boss', 'boss2'], 2: ['gnaw', 'gnaw2'], 3: ['icebeast', 'icequeen'], 4: ['fort', 'snake'], 5: ['core']}


def main():
    tmp = tempfile.mkdtemp(); pp = os.path.join(tmp, 't.html'); open(pp, 'w', encoding='utf-8').write(build(SRC))
    errs = []; fails = 0
    def report(title, res):
        nonlocal fails
        for k, v in res.items():
            if not v['pass']:
                fails += 1; print('NG', title, k, v['val'])
        print('%s: %d 項目' % (title, len(res)))
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844})
        pg.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)))
        pg.on('console', lambda m: errs.append('console: ' + m.text) if m.type == 'error' and 'ERR_FAILED' not in m.text else None)
        pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith('file:') else r.abort())
        pg.goto('file://' + pp); pg.wait_for_timeout(600)
        pg.evaluate(HELPERS)
        pg.evaluate("()=>{const T=window.__T;T.save.howto=1;}")
        pg.click('#startBtn'); pg.wait_for_timeout(300)
        t = pg.evaluate(TEXT, BAN)
        for x in t['bad']:
            fails += 1; print('NG 文', x)
        print('数:', t['n'])
        if t['n'] != {'stages': 5, 'book': 20, 'newE': 8, 'big': 7}:
            fails += 1; print('NG 数')
        report('解放・セーブ・エンディング', pg.evaluate(UNLOCK))
        report('図鑑', pg.evaluate(BOOKT))
        pg.evaluate("()=>{document.getElementById('hangar').hidden=true;document.getElementById('sortie').hidden=false;}")
        report('敵としかけ', pg.evaluate(UNITS))
        for art in ['boss', 'boss2', 'gnaw', 'gnaw2', 'icebeast', 'icequeen', 'fort', 'snake', 'core']:
            r = pg.evaluate(BIGT, art)
            print('大型の敵', r)
            if not r['dead'] or r['shots'] < 3 or not r['segsDead'] or r['state'] == 'over' and art != 'core':
                fails += 1; print('NG 大型の敵', art)
        for n in range(1, 6):
            for strong in (True, False):
                r = pg.evaluate(RUN, [n, strong, SECS])
                print('早送り', r)
                if SECS >= 300:
                    for k in STAGE_E[n]:
                        if k not in r['seen'].split(','):
                            fails += 1; print('NG ステージ%dの敵が出ない' % n, k)
                    for k in STAGE_B[n]:
                        if k not in r['big'].split(','):
                            fails += 1; print('NG ステージ%dの大型の敵が出ない' % n, k)
                    if strong and (not r['clear'] or r['state'] != 'over'):
                        fails += 1; print('NG ステージ%d 強い装備でクリアできない' % n)
                    if strong and n == 5 and not r['ending']:
                        fails += 1; print('NG ステージ5 エンディングが出ない')
                    if n == 3 and r['snow'] == 0 or n == 4 and r['lz'] == 0:
                        fails += 1; print('NG しかけが出ない', n)
        perf = pg.evaluate(PERF)
        print('重さ（ステージ5・最終ボス・大蛇・敵260体・レーザーの壁・1フレーム update+draw ms 中央/95%/最大）:', perf)
        if perf['p95'] > 16:
            fails += 1; print('NG 重さ')
        pg.evaluate("()=>{window.__eb=1;}")
        perf = pg.evaluate(PERF)
        print('重さ（上に加えて敵の弾320）:', perf)
        if perf['p95'] > 16:
            fails += 1; print('NG 重さ（弾）')
        b.close()
    for e in errs[:10]:
        print('ERR', e)
    print('エラー', len(errs), '・NG', fails)
    sys.exit(1 if errs or fails else 0)


if __name__ == '__main__':
    main()
