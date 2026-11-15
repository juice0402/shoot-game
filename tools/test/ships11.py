"""機体12機と必殺技のテスト（issue #11）
使い方: python3 tools/test/ships11.py [index.html]
- テスト用のコピーに window.__T を足して Playwright（chromium）で開く。外への読みこみ（フォント）は止める
- 文：新しい名前・説明・能力・必殺技の文の長さと、使わない言葉
- 12機の性能と能力を数字で確かめる（HP・速さ・連射・威力・射程・範囲・回避・経験値・集中・爆風・かすり・突撃装甲・前向き・錬金・覚醒）
- 必殺ゲージ：時間と撃破でたまる・エネルギー炉で1.2倍・12機すべてで出る
- 12機それぞれ5分早送り（SECS で変える）：エラー0・必殺技が何回も出る
- 必殺技を続けて出す（1機30回）：エラー0
- 解放：記録が出撃でふえる・条件を満たすと買える・値段どおり・オメガはいまは解放されない・古いセーブ
- 格納庫：12機を切りかえ・装備の場所のボタンが絵の上の正しい位置
- 重さ：敵280体＋必殺技の1フレーム
"""
import json, os, sys, tempfile
from playwright.sync_api import sync_playwright

SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', '..', 'index.html')
SECS = float(os.environ.get('SECS', '300'))
NEW = ['marksman', 'bomber', 'phantom', 'vanguard', 'alchemist', 'omega']


def build(src):
    h = open(src, encoding='utf-8').read()
    def rp(a, b):
        nonlocal h
        assert h.count(a) == 1, a
        h = h.replace(a, b)
    rp("  if(!R)return;\n  raf=requestAnimationFrame(frame);", "  if(!R||window.__HOLD)return;\n  raf=requestAnimationFrame(frame);")
    rp("function hurt(d){\n  if(R.inv>0)return;", "function hurt(d){\n  if(R.inv>0)return;window.__HURT++;")
    rp("  e.hp-=amt;e.flash=0.07;", "  window.__DMG+=amt;e.hp-=amt;e.flash=0.07;")
    expose = ("window.__HURT=0;window.__DMG=0;"
              "window.__T={get R(){return R},update,draw,hud,stat,startRun,addEnemy,shootAt,hit,hurt,contact,moveEB,gainXp,calcCS,buildGrid,movePlayer,"
              "openLevelUp,pickChoice,get lvChoices(){return lvChoices},buildChoices,evoReady,evolve,endRun,spStart,dmgMul,isMelee,blast,"
              "get save(){return save},set save(v){save=v},loadSave,persist,freshSave,setShip,buyShip,shipProg,viewShip,stepShip,renderAll,layoutEditor,slotCss,"
              "openShop,openDetail,closeSheet,openInfo,get view(){return view},keys,SHIPS,SHIP_IDS,SHIPSPR,SPECIAL,SPG,KIND,MODS,TYPES,EVO,KEY,BASE_HP,U,GW,get GH(){return GH}};\n")
    i = h.rindex('})();\n</script>')
    h = h[:i] + expose + h[i:]
    return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' + h + '</body></html>'


HELPERS = r"""
()=>{
  /* 機体 id で出撃（はじめの武器・list があればそれ）。外から動かすので requestAnimationFrame は止める */
  window.__go=(id,list,lv)=>{const T=window.__T;window.__HOLD=1;T.save.st=1;/* #13：ステージ1で */T.save.ships[id].have=true;T.setShip(id);const L=T.save.load;for(let i=0;i<L.length;i++)L[i]=null;
    if(list)list.forEach((v,i)=>{const t=typeof v==='string'?v:v.t;L[typeof v==='string'?i:v.s]={t,d:typeof v==='string'?0:(v.d||0)};T.save.owned[t]=Math.max(T.save.owned[t],9);});
    else T.SHIPS[id].start.forEach(v=>{L[v.s]={t:v.t,d:v.d};T.save.owned[v.t]=Math.max(T.save.owned[v.t],9);});
    T.startRun();const R=T.R;if(lv)for(const t in lv)R.tlv[t]=lv[t];return R;};
  /* まわりに敵をいつも n 体（重さ・必殺技の場面） */
  window.__fill=(n,kinds)=>{const T=window.__T,R=T.R;while(R.E.length<n){const a=Math.random()*Math.PI*2,d=90+Math.random()*260;T.addEnemy(kinds?kinds[(Math.random()*kinds.length)|0]:(Math.random()<0.25?'tank':'bug'),R.x+Math.cos(a)*d,R.y+Math.sin(a)*d*0.9);}};
}
"""

TEXT = r"""
(NEW)=>{const T=window.__T,bad=[],rows=[];
  const BAN=/[！!✨★▶✓☆♪]|してね|だよ|しよう|しましょう|ぜひ|便利|簡単|安心|おすすめ|ポイント|コツ|最強|圧倒的|——|―|NEW|[\u{1F300}-\u{1FAFF}]/u;
  const chk=(where,s,max)=>{if(!s){bad.push(where+' 文なし');return;}const n=[...s].length;if(max&&n>max)bad.push(where+' 長い '+n+'字：'+s);if(BAN.test(s))bad.push(where+' 使わない言葉：'+s);};
  for(const id of T.SHIP_IDS){const s=T.SHIPS[id];chk(id+' sp.name',s.sp&&s.sp.name,12);chk(id+' sp.desc',s.sp&&s.sp.desc,22);rows.push([id,s.name,s.sp.name,s.sp.desc]);
    if(NEW.includes(id)){chk(id+' name',s.name,8);chk(id+' desc',s.desc,22);chk(id+' skill',s.skill,22);if(s.skill2)chk(id+' skill2',s.skill2,22);chk(id+' unlock',s.unlock.txt,22);}}
  return {bad,rows};}
"""

CHECKS = r"""
(NEW)=>{const T=window.__T,go=window.__go,res={};const ok=(k,pass,val)=>{res[k]={pass:!!pass,val};};const near=(a,b,e)=>Math.abs(a-b)<=(e||1e-6)*Math.max(1,Math.abs(b));
  const D={marksman:{hp:0.9,spd:1,rate:0.85,pow:1.2,price:1100,slots:6,start:'sniper'},bomber:{hp:1.1,spd:0.9,rate:1,pow:1,price:1300,slots:7,start:'grenade'},
    phantom:{hp:0.7,spd:1.3,rate:1,pow:1,price:1600,slots:5,start:'twin'},vanguard:{hp:1.3,spd:1.1,rate:1,pow:1,price:1400,slots:7,start:'lance'},
    alchemist:{hp:0.95,spd:1,rate:1,pow:1,price:1800,slots:7,start:'acid'},omega:{hp:1.1,spd:1.1,rate:1.1,pow:1.1,price:5000,slots:9,start:'cannon'}};
  ok('12機',T.SHIP_IDS.length===12,T.SHIP_IDS.join(','));
  /* 基本の性能：最大HP・速さ（1秒動かした距離）・連射と威力（レーザー Lv1） */
  const base=(()=>{const R=go('standard',['laser']);R.x=240;R.y=400;T.keys.add('ArrowRight');T.movePlayer(0.2);T.keys.clear();const mv=R.x-240,st=T.stat('laser');return {mv,cd:st.cd,dmg:st.dmg};})();
  for(const id of NEW){const d=D[id],R=go(id,['laser']);
    ok(id+' 最大HP',R.maxHp===Math.round(T.BASE_HP*d.hp),R.maxHp);
    R.x=240;R.y=400;T.keys.add('ArrowRight');T.movePlayer(0.2);T.keys.clear();ok(id+' 速さ',near((R.x-240)/base.mv,d.spd,0.01),((R.x-240)/base.mv).toFixed(3));
    const st=T.stat('laser');ok(id+' 連射',near(base.cd/st.cd,d.rate,0.01),(base.cd/st.cd).toFixed(3));ok(id+' 威力',near(st.dmg/base.dmg,d.pow,0.01),(st.dmg/base.dmg).toFixed(3));
    const s=T.SHIPS[id];ok(id+' 値段・場所の数・はじめの武器',s.price===d.price&&s.slots.length===d.slots&&s.start[0].t===d.start,[s.price,s.slots.length,s.start.map(v=>v.t).join('+')].join(' '));}
  /* スナイパー：射程＋30%・集中（止まって1.5秒で威力＋30%） */
  {let R=go('standard',['thunder']);const l0=T.stat('thunder').range;R=go('marksman',['thunder','lance']);const l1=T.stat('thunder').range;
    ok('スナイパー 射程',near(l1/l0,1.3,0.01),(l1/l0).toFixed(3));
    const d0=T.stat('lance').dmg;for(let i=0;i<120;i++)T.movePlayer(1/60);const d1=T.stat('lance').dmg;ok('スナイパー 集中 止まって2秒で威力＋30%',near(d1/d0,1.3,0.01),(d1/d0).toFixed(3));
    T.keys.add('ArrowLeft');for(let i=0;i<30;i++)T.movePlayer(1/60);T.keys.clear();ok('スナイパー 集中 動くと0',R.focus===0,R.focus);}
  /* ボマー：範囲＋25%・爆発の威力＋30%（グレネード）・爆風で小さい弾だけ消える */
  {let R=go('standard',['grenade']);const g0=T.stat('grenade');R=go('bomber',['grenade']);const g1=T.stat('grenade');
    ok('ボマー 範囲',near(g1.rad/g0.rad,1.25,0.01),(g1.rad/g0.rad).toFixed(3));ok('ボマー 爆発の威力',near(g1.dmg/g0.dmg,1.3,0.01),(g1.dmg/g0.dmg).toFixed(3));
    const l0=(go('standard',['laser']),T.stat('laser').dmg),l1=(go('bomber',['laser']),T.stat('laser').dmg);ok('ボマー 爆発でない武器はそのまま',near(l1,l0,0.001),(l1/l0).toFixed(3));
    R=T.R;R.EB.length=0;R.EB.push({x:200,y:200,vx:0,vy:0,dmg:8,big:false,dead:false},{x:205,y:200,vx:0,vy:0,dmg:8,big:true,dead:false});T.buildGrid();T.blast(200,200,30,1,0,['#fff']);
    ok('ボマー 爆風：小さい弾は消え、大きい弾は残る',R.EB[0].dead&&!R.EB[1].dead,[R.EB[0].dead,R.EB[1].dead].join(','));
    R=go('standard',['laser']);R.EB.length=0;R.EB.push({x:200,y:200,vx:0,vy:0,dmg:8,big:false,dead:false});T.buildGrid();T.blast(200,200,30,1,0,['#fff']);ok('ボマー以外の爆発では弾は消えない',!R.EB[0].dead,R.EB[0].dead);}
  /* ファントム：回避20%・かすりでゲージ・被弾で0.8秒すがたを消す */
  {let R=go('phantom',['laser']);ok('ファントム 回避',near(R.cs.evade,0.2,0.001),R.cs.evade);
    R.E.length=0;R.EB.length=0;R.gauge=0;R.x=240;R.y=400;R.EB.push({x:240+18,y:400,vx:0,vy:0,dmg:8,big:false,dead:false});T.moveEB(1/60);T.moveEB(1/60);
    ok('ファントム かすり（1発で1回だけ）',near(R.gauge,T.SPG.graze,0.001)&&!R.EB[0].dead,R.gauge.toFixed(2));
    R=go('standard',['laser']);R.EB.length=0;R.gauge=0;R.x=240;R.y=400;R.EB.push({x:258,y:400,vx:0,vy:0,dmg:8,big:false,dead:false});T.moveEB(1/60);ok('ファントム以外はかすらない',R.gauge===0,R.gauge);
    R=go('phantom',['laser']);R.cs.evade=0;R.inv=0;T.hurt(5);ok('ファントム 被弾で0.8秒消える',near(R.ghost,0.8,0.001)&&R.inv>=0.8,[R.ghost,R.inv.toFixed(2)].join(','));}
  /* ヴァンガード：前（機首・左前・右前）の装備の威力＋30%・体当たりで小さい敵を倒す・体当たりのダメージ半分 */
  {const R=go('vanguard',[{t:'lance',s:0},{t:'lance',s:3,d:6}]);R.E.length=0;R.S.length=0;const m=R.mods;m[0].cd=0;m[1].cd=0;T.update(1/60);
    const sn=R.S.filter(s=>s.k==='ln').map(s=>[s.m.slot,s.dmg]);const f=sn.find(v=>v[0]===0),b=sn.find(v=>v[0]===3);
    ok('ヴァンガード 機首は威力＋30%・肩はそのまま',f&&b&&near(f[1]/b[1],1.3,0.01),f&&b?(f[1]/b[1]).toFixed(3):JSON.stringify(sn));
    ok('ヴァンガード 前の場所',T.SHIPS.vanguard.slots.filter(s=>s.front).map(s=>s.name).join('・')==='機首・左前・右前',T.SHIPS.vanguard.slots.filter(s=>s.front).map(s=>s.name).join('・'));
    R.E.length=0;R.EB.length=0;R.inv=0;R.hp=R.maxHp;const b1=T.addEnemy('bug',R.x+3,R.y),tk=T.addEnemy('tank',R.x,R.y+60);T.buildGrid();T.contact();
    ok('ヴァンガード 体当たりで小さい敵を倒す（ダメージは半分）',b1.dead&&near(R.maxHp-R.hp,T.KIND.bug.dmg*0.5,0.001),[b1.dead,R.maxHp-R.hp].join(','));
    R.inv=0;R.hp=R.maxHp;tk.x=R.x;tk.y=R.y+3;T.buildGrid();T.contact();ok('ヴァンガード 大きめの敵は倒れず、受けるダメージ半分',!tk.dead&&near(R.maxHp-R.hp,T.KIND.tank.dmg*0.5,0.001),[tk.dead,R.maxHp-R.hp].join(','));
    const S=go('standard',['laser']);S.E.length=0;S.inv=0;S.hp=S.maxHp;const b2=T.addEnemy('bug',S.x+3,S.y);T.buildGrid();T.contact();ok('ほかの機体は体当たりで倒さない',!b2.dead&&S.maxHp-S.hp===T.KIND.bug.dmg,[b2.dead,S.maxHp-S.hp].join(','));}
  /* アルケミスト：経験値＋15%・お金＋10%・Lv6 で進化 */
  {let R=go('standard',['laser']);T.gainXp(0);R.xp=0;R.need=1e9;T.gainXp(10);const x0=R.xp;R=go('alchemist',['laser']);R.xp=0;R.need=1e9;T.gainXp(10);ok('アルケミスト 経験値',near(R.xp/x0,1.15,0.001),(R.xp/x0).toFixed(3));
    ok('アルケミスト お金',T.SHIPS.alchemist.gold===1.1,T.SHIPS.alchemist.gold);
    R=go('alchemist',['laser','cooler'],{laser:6});const e6=T.evoReady();R=go('standard',['laser','cooler'],{laser:6});const s6=T.evoReady();ok('アルケミスト Lv6 で進化できる（ほかは Lv8）',e6.includes('laser')&&!s6.includes('laser'),[e6.join(','),s6.join(',')].join('/'));}
  /* オメガ：すべて＋10%・10回に1回、2つえらぶ */
  {let R=go('omega',['laser']);const o=T.SHIPS.omega;ok('オメガ すべての性能＋10%',['hp','spd','mag','rate','pow','gold','xp'].every(k=>o[k]===1.1),['hp','spd','mag','rate','pow','gold','xp'].map(k=>o[k]).join(','));
    const picks=[];for(let i=0;i<20;i++){R.pending=1;T.openLevelUp();let n=0;while(R.state==='lvup'&&T.lvChoices){const c=T.lvChoices.find(c=>!c.used);if(!c)break;T.pickChoice(c);n++;}picks.push(n);R.state='play';}
    ok('オメガ 覚醒：10回目と20回目に2つ',picks[9]===2&&picks[19]===2&&picks.filter(n=>n===2).length===2,picks.join(''));
    R=go('standard',['laser']);const p2=[];for(let i=0;i<10;i++){R.pending=1;T.openLevelUp();let n=0;while(R.state==='lvup'&&T.lvChoices){const c=T.lvChoices.find(c=>!c.used);if(!c)break;T.pickChoice(c);n++;}p2.push(n);R.state='play';}
    ok('ほかの機体は1つ',p2.every(n=>n===1),p2.join(''));
    document.getElementById('overlay').hidden=true;}
  /* 必殺ゲージ：時間で1秒1・撃破でたまる・エネルギー炉で1.2倍 */
  {let R=go('standard',['laser']);R.E.length=0;R.gauge=0;R.bossAt=[];R.waveAt=1e9;R.acc=-1e9;for(let i=0;i<600;i++){T.update(1/60);R.hp=R.maxHp;}const g0=R.gauge;
    R=go('standard',['laser','reactor']);R.E.length=0;R.gauge=0;R.bossAt=[];R.waveAt=1e9;R.acc=-1e9;for(let i=0;i<600;i++){T.update(1/60);R.hp=R.maxHp;}const g1=R.gauge;
    ok('ゲージ 時間で10秒＝12.5',near(g0,10*T.SPG.time,0.01),g0.toFixed(2));ok('エネルギー炉 ゲージ1.2倍',near(g1/g0,1.2,0.01),(g1/g0).toFixed(3));
    R=go('standard',['laser']);R.gauge=0;const b=T.addEnemy('bug',100,100);T.hit(b,999,0,0);ok('ゲージ 撃破でたまる',near(R.gauge,T.SPG.kill.bug,0.001),R.gauge);}
  return res;}
"""

# 12機それぞれで SECS 秒（1/60 ずつ）。武器ははじめの武器＋レーザー2つ（HPは減らないように戻す）
RUN = r"""
([id,secs])=>{const T=window.__T,R=window.__go(id,null);const sl=R.sh.slots;const L=T.save.load;
  /* はじめの武器のほかに、あいている場所へレーザー（撃つ向きは上） */
  let k=0;for(let i=0;i<sl.length&&k<2;i++)if(!T.save.load[i]){R.mods.push({t:'laser',slot:i,d:0,cd:0.2});R.tlv.laser=1;k++;}
  T.calcCS();const firsts=[];let t0=performance.now(),worst=0,lvls=0;
  for(let i=0;i<secs*60&&R.state!=='over';i++){if(R.pending>0){R.pending=0;}R.need=Math.min(R.need,30);if(R.hp<R.maxHp*0.5)R.hp=R.maxHp;
    const a=performance.now();const n0=R.spN;T.update(1/60);if(R.spN>n0)firsts.push(Math.round(R.t));if(i%30===0){T.draw();T.hud();}const d=performance.now()-a;if(d>worst&&i>10)worst=d;
    if(R.state==='lvup'){R.state='play';document.getElementById('overlay').hidden=true;}}
  return {id,t:Math.round(R.t),kills:R.kills,sp:R.spN,firsts:firsts.slice(0,6),melee:R.meleeK,ms:Math.round(performance.now()-t0),worst:+worst.toFixed(1)};}
"""

# 必殺技を続けて出す（敵が多い中で）
SPAM = r"""
([id,n])=>{const T=window.__T,R=window.__go(id,null);R.t=120;R.bossAt=[];const b=T.addEnemy('boss',240,120);let dmg0=window.__DMG,cnt=0;
  for(let k=0;k<n;k++){window.__fill(120);for(let i=0;i<5;i++)T.shootAt(R.E[i],92,0);R.gauge=T.SPG.max;let g=0;while(!R.sp&&g<5){T.update(1/60);g++;}
    let f=0;while(R.sp&&f<700){T.update(1/60);R.hp=R.maxHp;if(f%7===0)T.draw();f++;}if(f<700)cnt++;}
  return {id,done:cnt,dmg:Math.round(window.__DMG-dmg0),sp:R.spN};}
"""

# 必殺技の1フレームの重さ（敵280体・弾をつけた場面）
PERF = r"""
(id)=>{const T=window.__T,R=window.__go(id,null,null);R.t=200;R.bossAt=[];R.waveAt=1e9;R.acc=-1e9;
  for(const t of ['laser','missile','gatling'])if(R.mods.length<R.sh.slots.length)R.mods.push({t,slot:R.mods.length,d:0,cd:0.1});for(const m of R.mods)R.tlv[m.t]=8;T.calcCS();
  for(let i=0;i<60;i++){window.__fill(280);T.update(1/60);R.hp=R.maxHp;T.draw();}
  R.gauge=T.SPG.max;const ts=[];for(let i=0;i<Math.round(T.SPECIAL[id].dur*60)+30;i++){window.__fill(280);if(i%20===0)for(let k=0;k<8;k++)T.shootAt(R.E[k],92,0);const a=performance.now();T.update(1/60);T.draw();ts.push(performance.now()-a);R.hp=R.maxHp;}
  ts.sort((a,b)=>a-b);return {id,med:+ts[ts.length>>1].toFixed(2),p95:+ts[Math.floor(ts.length*0.95)].toFixed(2),max:+ts[ts.length-1].toFixed(2)};}
"""

# 解放：出撃の記録がふえる → 条件を満たすと買える
UNLOCK = r"""
()=>{const T=window.__T,res={};const ok=(k,pass,val)=>{res[k]={pass:!!pass,val};};
  T.save=T.freshSave();T.save.gold=0;T.setShip('standard');const pg=id=>T.shipProg(id);
  ok('はじめは6機とも解放されていない',['marksman','bomber','phantom','vanguard','alchemist','omega'].every(id=>!pg(id).ok&&!T.save.ships[id].have),'');
  /* スナイパー：大型の敵を出てから30秒以内にたおす（31秒では数えない） */
  let R=window.__go('standard',['laser']);const b1=T.addEnemy('boss',240,100);R.t+=31;T.hit(b1,1e9,0,0);ok('31秒で倒した大型の敵は数えない',R.fastBoss===0,R.fastBoss);
  const b2=T.addEnemy('boss',240,100);R.t+=29;T.hit(b2,1e9,0,0);T.endRun(false,true);ok('スナイパー 解放（30秒以内）',pg('marksman').ok&&T.save.rec.fastBoss===1,T.save.rec.fastBoss);
  /* ボマー：1回で1000体 */
  R=window.__go('standard',['laser']);R.kills=999;T.endRun(false,true);ok('999体では解放されない',!pg('bomber').ok,T.save.rec.bestKills);
  R=window.__go('standard',['laser']);R.kills=1000;T.endRun(false,true);ok('ボマー 解放（1000体）',pg('bomber').ok,T.save.rec.bestKills);
  /* ファントム：HP半分以上でクリア */
  R=window.__go('standard',['laser']);R.hp=Math.floor(R.maxHp/2)-1;T.endRun(true,false);ok('HP半分未満のクリアでは解放されない',!pg('phantom').ok,T.save.rec.halfClear);
  R=window.__go('standard',['laser']);R.hp=Math.ceil(R.maxHp/2);T.endRun(true,false);ok('ファントム 解放（HP半分以上でクリア）',pg('phantom').ok,T.save.rec.halfClear);
  /* ヴァンガード：近接で2000体（ランスで本当に倒して数える） */
  R=window.__go('standard',[{t:'lance',s:0},{t:'laser',s:1}]);R.bossAt=[];R.waveAt=1e9;R.acc=-1e9;for(const m of R.mods)R.tlv[m.t]=8;
  for(let i=0;i<600;i++){R.E=R.E.filter(e=>!e.dead);while(R.E.length<20){T.addEnemy('bug',R.x+Math.random()*30-15,R.y-30-Math.random()*40);}T.update(1/60);R.hp=R.maxHp;if(R.state!=='play')R.state='play';}
  const mk=R.meleeK,kk=R.kills;ok('近接で倒した数だけ数える（レーザーの分は入らない）',mk>0&&mk<kk,mk+'/'+kk);
  T.endRun(false,true);ok('近接の記録がふえる',T.save.rec.meleeK===mk,T.save.rec.meleeK);T.save.rec.meleeK=1999;ok('1999体では解放されない',!pg('vanguard').ok,'');
  R=window.__go('standard',[{t:'chainsaw',s:0}]);R.meleeK=1;T.endRun(false,true);ok('ヴァンガード 解放（2000体）',pg('vanguard').ok,T.save.rec.meleeK);
  /* アルケミスト：進化1回 */
  R=window.__go('standard',['laser','cooler'],{laser:8});T.evolve('laser');T.endRun(false,true);ok('アルケミスト 解放（進化1回）',pg('alchemist').ok&&T.save.rec.evos===1,T.save.rec.evos);
  /* オメガ：ステージ5（いまはクリアしてもステージ1） */
  for(let i=0;i<3;i++){R=window.__go('standard',['laser']);T.endRun(true,false);}ok('オメガ ステージ1のクリアでは解放されない',!pg('omega').ok&&T.save.rec.stageMax===1,T.save.rec.stageMax);
  T.save.rec.stageMax=5;ok('オメガ ステージ5のクリアで解放（しくみ）',pg('omega').ok,'');T.save.rec.stageMax=1;
  /* 値段どおりに買える・はじめの武器がもらえる */
  const buy=[];for(const id of ['marksman','bomber','phantom','vanguard','alchemist']){const s=T.SHIPS[id],t=s.start[0].t;T.save.gold=s.price-1;const no=T.buyShip(id);T.save.gold=s.price;const own0=T.save.owned[t];const yes=T.buyShip(id);
    buy.push(id+':'+(!no&&yes&&T.save.gold===0&&T.save.ships[id].have&&T.save.owned[t]>=Math.max(1,own0)&&T.save.ships[id].eq[s.start[0].s].t===t));}
  ok('値段どおりに買える（1G 足りないと買えない）・はじめの武器',buy.every(v=>v.endsWith('true')),buy.join(' '));
  T.save.gold=99999;ok('オメガは条件なしでは買えない',!T.buyShip('omega'),'');
  /* セーブして読みなおす */
  T.persist();const s2=T.loadSave();ok('記録がセーブに残る',['fastBoss','bestKills','halfClear','meleeK','evos','stageMax'].every(k=>s2.rec[k]===T.save.rec[k])&&s2.ships.bomber.have,JSON.stringify(s2.rec));
  /* 古いセーブ（#10 まで：新しい記録と機体がない） */
  localStorage.setItem(T.KEY,JSON.stringify({v:2,gold:500,owned:{laser:2},ships:{standard:{have:true,eq:[null,{t:'laser',d:0}]},rapid:{have:true,eq:[]}},cur:'rapid',evo:{laser:1,sword:1},rec:{clears:2,bosses:3,goldTotal:900,wmax:{},sup5:[]}}));
  const s3=T.loadSave();ok('古いセーブ：壊れずに読める・進化の回数は進化させた武器から',s3.cur==='rapid'&&s3.ships.rapid.have&&!s3.ships.omega.have&&s3.rec.evos===2&&s3.rec.meleeK===0&&s3.rec.stageMax===1/* #13：クリアしていればステージ1クリアあつかい */&&s3.ships.vanguard.eq.length===7,JSON.stringify(s3.rec));
  localStorage.setItem(T.KEY,'{bad json');const s4=T.loadSave();ok('こわれたセーブ：はじめから',s4.cur==='standard'&&s4.rec.evos===0,'');
  localStorage.removeItem(T.KEY);
  return res;}
"""

# 格納庫：12機を切りかえ、装備の場所のボタンが絵の上の決まった位置にあるか
HANGAR = r"""
()=>{const T=window.__T,out=[];T.save=T.freshSave();T.save.gold=99999;for(const id of T.SHIP_IDS){T.save.ships[id].have=true;T.save.ships[id].eq=T.SHIPS[id].slots.map(()=>null);T.SHIPS[id].start.forEach(v=>{T.save.ships[id].eq[v.s]={t:v.t,d:v.d};T.save.owned[v.t]=9;});}
  T.viewShip('standard');T.layoutEditor();const seen=[];
  for(let i=0;i<12;i++){const id=T.view;seen.push(id);const sh=T.SHIPS[id],bs=[...document.querySelectorAll('#slots .slotb')];
    const ed=document.getElementById('editor').getBoundingClientRect();let bad=0;
    bs.forEach((b,j)=>{const r=b.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,[x,y]=T.slotCss(j);if(Math.abs(cx-(ed.left+x))>1.5||Math.abs(cy-(ed.top+y))>1.5)bad++;});
    out.push({id,name:document.getElementById('shipName').textContent,n:bs.length,want:sh.slots.length,bad,full:bs.filter(b=>b.classList.contains('full')).length});T.stepShip(1);}
  return {seen,out,back:T.view};}
"""


def main():
    tmp = tempfile.mkdtemp(); pp = os.path.join(tmp, 't.html'); open(pp, 'w', encoding='utf-8').write(build(SRC))
    errs = []; fails = 0
    def report(title, res):
        nonlocal fails
        for k, v in res.items():
            if not v['pass']:
                fails += 1; print('NG', title, k, v['val'])
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844})
        pg.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)))
        pg.on('console', lambda m: errs.append('console: ' + m.text) if m.type == 'error' and 'ERR_FAILED' not in m.text else None)
        pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith('file:') else r.abort())
        pg.goto('file://' + pp); pg.wait_for_timeout(600)
        pg.evaluate(HELPERS)
        pg.evaluate("()=>{const T=window.__T;T.save.howto=1;}")
        pg.click('#startBtn'); pg.wait_for_timeout(300)
        t = pg.evaluate(TEXT, NEW)
        for x in t['bad']:
            fails += 1; print('NG 文', x)
        print('必殺技:', ' / '.join(r[0] + '=' + r[2] for r in t['rows']))
        pg.evaluate("()=>{document.getElementById('hangar').hidden=true;document.getElementById('sortie').hidden=false;}")
        report('性能', pg.evaluate(CHECKS, NEW))
        report('解放', pg.evaluate(UNLOCK))
        # 12機それぞれ SECS 秒
        runs = []
        for sid in pg.evaluate("()=>window.__T.SHIP_IDS"):
            r = pg.evaluate(RUN, [sid, SECS]); runs.append(r)
            if r['t'] < SECS - 1 or r['sp'] < max(1, int(SECS // 90)):
                fails += 1; print('NG 早送り', r)
        print('早送り（機体・秒・撃破・必殺の回数・最初の必殺の秒・近接・最悪のフレームms）:')
        for r in runs:
            print('  %-9s %3ds kills=%5d sp=%2d at=%s melee=%d worst=%.1fms' % (r['id'], r['t'], r['kills'], r['sp'], r['firsts'], r['melee'], r['worst']))
        # 続けて30回
        sp = []
        for sid in pg.evaluate("()=>window.__T.SHIP_IDS"):
            r = pg.evaluate(SPAM, [sid, int(os.environ.get('SPAM', '30'))]); sp.append(r)
            if r['done'] < int(os.environ.get('SPAM', '30')) or r['dmg'] <= 0:
                fails += 1; print('NG 続けて', r)
        print('続けて出す:', ' '.join('%s=%d回' % (r['id'], r['done']) for r in sp))
        # 重さ
        perf = [pg.evaluate(PERF, sid) for sid in pg.evaluate("()=>window.__T.SHIP_IDS")]
        print('重さ（敵280体・必殺技の間の1フレーム update+draw ms：中央/95%/最大）:')
        for r in perf:
            print('  %-9s %5.2f %5.2f %5.2f' % (r['id'], r['med'], r['p95'], r['max']))
            if r['p95'] > 16:
                fails += 1; print('NG 重さ', r)
        # 格納庫
        pg.evaluate("()=>{document.getElementById('sortie').hidden=true;document.getElementById('overlay').hidden=true;document.getElementById('hangar').hidden=false;window.__T.R&&0;}")
        h = pg.evaluate(HANGAR)
        for o in h['out']:
            if o['n'] != o['want'] or o['bad'] or o['full'] < 1:
                fails += 1; print('NG 格納庫', o)
        if len(set(h['seen'])) != 12 or h['back'] != 'standard':
            fails += 1; print('NG 格納庫の切りかえ', h['seen'], h['back'])
        print('格納庫:', ' '.join('%s(%d)' % (o['name'], o['n']) for o in h['out']))
        b.close()
    for e in errs[:10]:
        print('ERR', e)
    print('エラー', len(errs), '・NG', fails)
    sys.exit(1 if errs or fails else 0)


if __name__ == '__main__':
    main()
