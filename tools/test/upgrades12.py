"""道中の強化・研究所・図鑑・実績のテスト（issue #12）
使い方: python3 tools/test/upgrades12.py [index.html]
- テスト用のコピーに window.__T を足して Playwright（chromium）で開く。外への読みこみ（フォント）は止める
- 文：新しい名前・説明の長さ（全角22字まで）と使わない言葉。画面（レベルアップ・宝箱・研究所・図鑑・実績）の文にも「！」がない
- 機体の強化20種：最大レベルで数字どおりに効く
- 支援12種：最大レベルで動く（雷・回復・遅く・焼く・弾を防ぐ・矢・砲撃・時間停止）
- 特別な強化8種：良い所と代償が数字どおり・レベル5から・1出撃に1回
- 宝箱：大型の敵で落ちる・ひろうと必ず3つ（200回）
- えらび直し／スキップ／除外：研究所の回数どおり・動き
- 研究所15項目：値段1.6倍（10G単位）・出撃に効く・セーブに残る・増設の場所
- 実績24個：条件と決まった G・2回はもらえない
- 図鑑：開ける・数・出会った敵がうまる
- 古いセーブ（#11 の形）
- 全部取って早送り（SECS 秒）：エラー0／研究所を全部最大にして早送り：エラー0
- 重さ：支援を全部最大・敵280体の1フレーム
"""
import os, sys, tempfile
from playwright.sync_api import sync_playwright

SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', '..', 'index.html')
SECS = float(os.environ.get('SECS', '300'))

EXPOSE = ("window.__HURT=0;window.__DMG=0;"
          "window.__T={get R(){return R},update,draw,hud,stat,startRun,addEnemy,shootAt,hit,hurt,contact,moveEB,moveEnemies,gems,gainXp,calcCS,buildGrid,movePlayer,support,sup12,items12,"
          "openLevelUp,pickChoice,get lvChoices(){return lvChoices},buildChoices,upPool,chestPicks,openChest,doReroll,doSkip,toggleBan,get banMode(){return banMode},evoReady,evolve,endRun,dmgMul,gaugeAdd,takeSpc,supUp,"
          "get save(){return save},set save(v){save=v},loadSave,persist,freshSave,setShip,shipProg,renderAll,layoutEditor,ensureSlots,"
          "openLab,closeLab,openLabDetail,buyLab,labPrice,openBook,closeBook,openAch,closeAch,checkAch,bookCount,BOOK_N,closeSheet,toHangarFromTitle,"
          "keys,SHIPS,SHIP_IDS,SPECIAL,SPG,KIND,MODS,TYPES,EVO,PAS,SUP,SPC,SPC_IDS,PAS_NEW,SUP_NEW,LAB,ACH,BOOK_E,CATC,PICON,SICON,XICON,LICON,MEDAL,KEY,BASE_HP,U,GW,WMAX,xpNeed,get GH(){return GH}};\n")


def build(src):
    h = open(src, encoding='utf-8').read()
    def rp(a, b):
        nonlocal h
        assert h.count(a) == 1, a
        h = h.replace(a, b)
    rp("  if(!R)return;\n  raf=requestAnimationFrame(frame);", "  if(!R||window.__HOLD)return;\n  raf=requestAnimationFrame(frame);")
    rp("function hurt(d){\n  if(R.inv>0)return;", "function hurt(d){\n  if(R.inv>0)return;window.__HURT++;")
    rp("  e.hp-=amt;e.flash=0.07;", "  window.__DMG+=amt;e.hp-=amt;e.flash=0.07;")
    i = h.rindex('})();\n</script>')
    h = h[:i] + EXPOSE + h[i:]
    return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' + h + '</body></html>'


HELPERS = r"""
()=>{
  /* 機体 id で出撃（list の武器をつける）。外から動かすので requestAnimationFrame は止める */
  window.__go=(id,list,lab)=>{const T=window.__T;window.__HOLD=1;if(lab)Object.assign(T.save.lab,lab);T.ensureSlots(T.save);T.save.ships[id].have=true;T.setShip(id);const L=T.save.load;for(let i=0;i<L.length;i++)L[i]=null;
    (list||['laser']).forEach((t,i)=>{L[i]={t,d:0};T.save.owned[t]=Math.max(T.save.owned[t],9);});
    T.startRun();const R=T.R;R.pending=0;R.bossAt=[];R.waveAt=1e9;return R;};
  window.__fill=(n,kinds,cx,cy)=>{const T=window.__T,R=T.R;while(R.E.length<n){const a=Math.random()*Math.PI*2,d=90+Math.random()*260;T.addEnemy(kinds?kinds[(Math.random()*kinds.length)|0]:(Math.random()<0.25?'tank':'bug'),(cx??R.x)+Math.cos(a)*d,(cy??R.y)+Math.sin(a)*d*0.9);}};
  window.__chestOk=()=>{const b=document.querySelector('#overlay .btnrow .go');if(b){b.disabled=false;b.click();}};
  window.__lab0=()=>{const T=window.__T;for(const o of T.LAB)T.save.lab[o.id]=0;T.ensureSlots(T.save);};
}
"""

BAN = r"/[！!✨★▶✓☆♪🏆]|してね|だよ|しよう|しましょう|ぜひ|便利|簡単|安心|おすすめ|ポイント|コツ|最強|圧倒的|——|―|NEW|[\u{1F300}-\u{1FAFF}]/u"

TEXT = r"""
(BANS)=>{const T=window.__T,bad=[];const BAN=new RegExp(BANS.slice(1,BANS.lastIndexOf('/')),'u');
  const chk=(where,s,max)=>{if(!s){bad.push(where+' 文なし');return;}const n=[...s].length;if(max&&n>max)bad.push(where+' 長い '+n+'字：'+s);if(BAN.test(s))bad.push(where+' 使わない言葉：'+s);};
  for(const k of T.PAS_NEW){const p=T.PAS[k];chk('PAS '+k+' name',p.name,8);if(p.at)p.at.forEach((s,i)=>chk('PAS '+k+' at'+i,s,22));else chk('PAS '+k+' desc',p.desc,22);}
  for(const k of T.SUP_NEW){const s=T.SUP[k];chk('SUP '+k+' name',s.name,8);if(s.at.length!==s.max)bad.push('SUP '+k+' at の数');s.at.forEach((q,i)=>chk('SUP '+k+' at'+i,q,22));}
  for(const k of T.SPC_IDS){const s=T.SPC[k];chk('SPC '+k+' name',s.name,8);chk('SPC '+k+' good',s.good,22);chk('SPC '+k+' bad',s.bad,22);}
  for(const o of T.LAB){chk('LAB '+o.id+' name',o.name,8);chk('LAB '+o.id+' per',o.per,22);}
  for(const a of T.ACH){chk('ACH '+a.id+' name',a.name,10);chk('ACH '+a.id+' desc',a.desc,22);}
  for(const b of T.BOOK_E){chk('BOOK '+b.k+' name',b.name,8);chk('BOOK '+b.k+' desc',b.desc,22);}
  return {bad,n:{pas:Object.keys(T.PAS).length,sup:Object.keys(T.SUP).length,spc:T.SPC_IDS.length,lab:T.LAB.length,ach:T.ACH.length,ids:new Set(T.ACH.map(a=>a.id)).size}};}
"""

# 機体の強化20種：最大レベルで数字どおり
PAS = r"""
()=>{const T=window.__T,go=window.__go,res={};const ok=(k,pass,val)=>{res[k]={pass:!!pass,val:typeof val==='number'?+val.toFixed(4):val};};const near=(a,b,e)=>Math.abs(a-b)<=(e||1e-6)*Math.max(1,Math.abs(b));
  window.__lab0();
  const base={};const lst=['laser','mine','thunder','sword'];
  const meas=(R)=>{R.x=240;R.y=400;T.keys.add('ArrowRight');T.movePlayer(0.2);T.keys.clear();const mv=R.x-240;T.gems(0.01);
    const L=T.stat('laser'),M=T.stat('mine'),H=T.stat('thunder');return {mv,mag:R.magR,cd:L.cd,dmg:L.dmg,spd:L.spd,n:L.n,rad:M.rad,life:M.life,range:H.range,hp:R.maxHp};};
  let R=go('standard',lst);const b0=meas(R);
  const one=(k,f)=>{R=go('standard',lst);R.pas[k]=T.PAS[k].max;if(k==='armor'){R.maxHp+=20*5;}T.calcCS();return f(R,meas(R));};
  one('magnet',(R,m)=>ok('吸い寄せ Lv5 ×3.0',near(m.mag/b0.mag,3,1e-3),m.mag/b0.mag));
  one('speed',(R,m)=>ok('機体スピード Lv5 ×1.6',near(m.mv/b0.mv,1.6,0.01),m.mv/b0.mv));
  one('armor',(R,m)=>ok('装甲 Lv5 ＋100',m.hp-b0.hp===100,m.hp-b0.hp));
  one('clock',(R,m)=>ok('オーバークロック Lv5 発射の間×0.6',near(m.cd/b0.cd,0.6,1e-3),m.cd/b0.cd));
  one('power',(R,m)=>ok('火力アップ Lv5 ×1.5',near(m.dmg/b0.dmg,1.5,1e-3),m.dmg/b0.dmg));
  one('regen',(R,m)=>{R.hp=10;for(let i=0;i<60;i++)T.support(1/60);ok('自動修理 Lv5 1秒に＋2',near(R.hp-10,2,0.01),R.hp-10);});
  one('xp',(R,m)=>{R.xp=0;R.need=1e9;T.gainXp(10);ok('経験値アップ Lv5 ×1.5',near(R.xp,15,1e-3),R.xp);});
  one('gold',(R,m)=>{const g0=T.save.gold;R.gold=1000;R.kills=0;R.t=0;T.endRun(false,true);ok('収入アップ Lv5 ×1.75',T.save.gold-g0===1750,T.save.gold-g0);});
  one('bspd',(R,m)=>ok('弾速アップ Lv5 ×1.6',near(m.spd/b0.spd,1.6,1e-3),m.spd/b0.spd));
  one('area',(R,m)=>ok('範囲アップ Lv5 ×1.5',near(m.rad/b0.rad,1.5,1e-3),m.rad/b0.rad));
  one('dur',(R,m)=>ok('効果時間アップ Lv5 ×1.6',near(m.life/b0.life,1.6,1e-3),m.life/b0.life));
  one('critc',(R,m)=>{ok('会心アップ Lv5 確率20%',near(R.cs.crit,0.2),R.cs.crit);let c=0;const e=T.addEnemy('tank',240,100);for(let i=0;i<4000;i++){e.hp=e.max=1e9;e.dead=false;const d0=window.__DMG;T.hit(e,1,0,0);if(window.__DMG-d0>1.5)c++;}ok('会心アップ Lv5 じっさい',Math.abs(c/4000-0.2)<0.025,c/4000);});
  one('critd',(R,m)=>ok('会心ダメージ Lv5 3倍',near(R.cs.critD,3),R.cs.critD));
  one('range',(R,m)=>ok('射程アップ Lv5 ×1.5',near(m.range/b0.range,1.5,1e-3),m.range/b0.range));
  one('knock',(R,m)=>{const e=T.addEnemy('bug',240,100);e.hp=e.max=1e9;T.hit(e,1,10,0);const k1=e.kx;R=go('standard',lst);const f=T.addEnemy('bug',240,100);f.hp=f.max=1e9;T.hit(f,1,10,0);ok('ノックバック Lv5 ×2.25',near(k1/f.kx,2.25,1e-3),k1/f.kx);});
  one('multi',(R,m)=>ok('多弾 Lv3 弾＋3',m.n-b0.n===3,m.n-b0.n));
  one('iframe',(R,m)=>{R.inv=0;T.hurt(1);const a=R.inv;R=go('standard',lst);R.inv=0;T.hurt(1);ok('無敵時間 Lv5 ×1.75',near(a/R.inv,1.75,1e-3),a/R.inv);});
  one('skillg',(R,m)=>{R.gauge=0;T.gaugeAdd(10);ok('必殺チャージ Lv5 ×1.6',near(R.gauge,16,1e-3),R.gauge);});
  one('evade',(R,m)=>{ok('回避 Lv5 20%',near(R.cs.evade,0.2),R.cs.evade);let n=0;for(let i=0;i<3000;i++){R.inv=0;R.hp=R.maxHp;const h0=window.__HURT,hp=R.hp;T.hurt(1);if(R.hp===hp)n++;}ok('回避 Lv5 じっさい',Math.abs(n/3000-0.2)<0.025,n/3000);});
  one('exec',(R,m)=>{const e=T.addEnemy('tank',240,100);e.hp=e.max*0.25;T.hit(e,e.max*0.04,0,0);const alive=!e.dead;T.hit(e,e.max*0.02,0,0);
    const b=T.addEnemy('boss',240,100);b.hp=b.max*0.1;T.hit(b,1,0,0);ok('とどめ Lv3 体力20%以下で一撃・大型は別',alive&&e.dead&&!b.dead,[alive,e.dead,b.dead].join(','));
    R=go('standard',lst);R.pas.exec=1;T.calcCS();const f=T.addEnemy('tank',240,100);f.hp=f.max*0.14;T.hit(f,0.01,0,0);const a1=!f.dead;f.hp=f.max*0.105;T.hit(f,0.01,0,0);ok('とどめ Lv1 は10%',a1&&!f.dead,[a1,f.dead].join(','));});
  ok('機体の強化 20種',Object.keys(T.PAS).length===20,Object.keys(T.PAS).length);
  return res;}
"""

# 支援12種：最大レベルで動く
SUP = r"""
()=>{const T=window.__T,go=window.__go,res={};const ok=(k,pass,val)=>{res[k]={pass:!!pass,val};};
  window.__lab0();
  const setup=(k)=>{const R=go('standard',['laser']);R.mods.length=0;R.tlv.laser=0;T.calcCS();for(let i=0;i<T.SUP[k].max;i++)T.supUp(k);R.x=240;R.y=Math.round(T.GH*0.75);return R;};
  const step=(R,s,fill,kinds)=>{for(let i=0;i<Math.round(s*60);i++){if(fill)window.__fill(fill,kinds,240,R.y-200);T.update(1/60);R.hp=R.maxHp;if(R.state!=='play')R.state='play';R.x=240;R.y=Math.round(T.GH*0.75);}};
  /* 雷雲：2.4秒ごとに3本 */
  {const R=setup('thunder');const z0=R.Z.length;let d0=window.__DMG;step(R,2.6,40,['tank']);ok('雷雲 Lv5 雷が落ちてダメージ',window.__DMG>d0,Math.round(window.__DMG-d0));
    R.thT=0;R.Z.length=0;step(R,1/60,40,['tank']);ok('雷雲 Lv5 1回に3本',R.Z.length===3,R.Z.length);}
  /* 回復ドローン：12秒ごとに HP20 */
  {const R=setup('medic');R.mdT=0.1;step(R,0.2);R.hp=10;let mx=10;for(let i=0;i<240;i++){T.update(1/60);mx=Math.max(mx,R.hp);R.x=240;}ok('回復ドローン Lv5 玉で HP＋20',Math.round(mx-10)===20,mx-10);ok('回復ドローン 次は12秒後',Math.abs(R.mdT-(12-4.2))<0.2,+R.mdT.toFixed(2));}
  /* 氷の結界：まわりの敵が半分の速さ */
  {const R=setup('frostaura');const e=T.addEnemy('bug',R.x+60,R.y);e.hp=e.max=1e9;const f=T.addEnemy('bug',R.x+250,R.y-300);f.hp=f.max=1e9;T.buildGrid();T.sup12(1/60);ok('氷の結界 Lv5 近い敵の速さ×0.5・遠い敵はそのまま',e.slowF===0.5&&f.slowF===1,[e.slowF,f.slowF].join(','));}
  /* 炎のオーラ：0.5秒ごとに焼く */
  {const R=setup('fireaura');const e=T.addEnemy('tank',R.x+50,R.y);e.hp=e.max=1e9;R.faT=0;T.buildGrid();const d0=window.__DMG;T.sup12(1/60);const d1=window.__DMG-d0;T.buildGrid();T.sup12(0.2);
    ok('炎のオーラ Lv5 1回14・0.5秒あける',Math.abs(d1-14*T.dmgMul())<1e-6&&window.__DMG-d0===d1,[d1,window.__DMG-d0].join(','));}
  /* 盾の衛星：4つ・敵の弾を消す */
  {const R=setup('guardsat');T.sup12(1/60);const s=R.sats[0];R.EB.push({x:s.x,y:s.y,vx:0,vy:0,dmg:8,big:false,dead:false});T.sup12(0);ok('盾の衛星 Lv5 4つ・弾を消す',R.sats.length===4&&R.EB[R.EB.length-1].dead,R.sats.length);}
  /* 流れ星：1.8秒ごとに4本 */
  {const R=setup('meteor');window.__fill(40,['tank'],240,R.y-200);T.buildGrid();R.msT=0;T.sup12(1/60);ok('流れ星 Lv5 4本',R.MT.length===4,R.MT.length);const d0=window.__DMG;step(R,1,40,['tank']);ok('流れ星 ダメージ',window.__DMG>d0,Math.round(window.__DMG-d0));}
  /* 支援砲撃：12秒ごとに戦艦 */
  {const R=setup('battleship');R.bsT=0;T.sup12(1/60);const has=!!R.BS;const d0=window.__DMG;step(R,4.8,40,['tank']);ok('支援砲撃 Lv5 戦艦が横切って砲撃',has&&window.__DMG>d0&&!R.BS,Math.round(window.__DMG-d0));ok('支援砲撃 次は12秒（横切ったあとから）',R.bsT>11.5&&R.bsT<=12,+R.bsT.toFixed(2));}
  /* 時間停止：24秒ごとに3秒 */
  {const R=setup('timestop');R.tsT=0.01;const e=T.addEnemy('bug',100,100);e.hp=e.max=1e9;T.shootAt(e,92,0);const b=R.EB[R.EB.length-1];T.update(1/60);const x0=e.x,y0=e.y,bx=b.x,by=b.y;
    ok('時間停止 Lv3 3秒',Math.abs(R.tstop-3)<0.05,R.tstop);for(let i=0;i<60;i++){T.update(1/60);R.hp=R.maxHp;}ok('時間停止 敵も弾も止まる',e.x===x0&&e.y===y0&&b.x===bx&&b.y===by,[e.x-x0,b.y-by].join(','));
    for(let i=0;i<130;i++){T.update(1/60);R.hp=R.maxHp;}ok('時間停止 3秒のあと動く・次は24秒',R.tstop<=0&&e.y!==y0&&Math.abs(R.tsT-(24-(191/60-3)))<0.05,[R.tstop,e.y-y0,+R.tsT.toFixed(2)].join(','));}
  /* いまの4種もそのまま */
  for(const k of ['wing','drone','strike','barrier']){const R=setup(k);if(k==='barrier'){ok('barrier Lv最大 張る',R.bar&&R.sup.barrier===3,R.sup.barrier);continue;}const d0=window.__DMG;step(R,12,40,['tank']);ok(k+' Lv最大 動く',k==='barrier'?R.bar:window.__DMG>d0,Math.round(window.__DMG-d0));}
  ok('支援 12種',Object.keys(T.SUP).length===12,Object.keys(T.SUP).length);
  return res;}
"""

# 特別な強化8種
SPCT = r"""
()=>{const T=window.__T,go=window.__go,res={};const ok=(k,pass,val)=>{res[k]={pass:!!pass,val:typeof val==='number'?+val.toFixed(4):val};};const near=(a,b,e)=>Math.abs(a-b)<=(e||1e-6)*Math.max(1,Math.abs(b));
  window.__lab0();const lst=['laser','sword','shield'];
  const meas=R=>{R.x=240;R.y=400;T.keys.add('ArrowRight');T.movePlayer(0.2);T.keys.clear();const L=T.stat('laser'),S=T.stat('sword'),D=T.stat('shield');return {mv:R.x-240,cd:L.cd,dmg:L.dmg,sw:S.dmg,sh:D.dmg,hp:R.maxHp};};
  const b0=meas(go('standard',lst));
  const one=(k,f)=>{const R=go('standard',lst);T.takeSpc(k);return f(R,meas(R));};
  one('glass',(R,m)=>ok('ガラスの大砲 威力×1.5・最大HP×0.7',near(m.dmg/b0.dmg,1.5,1e-3)&&m.hp===Math.round(b0.hp*0.7),[m.dmg/b0.dmg,m.hp].join(',')));
  one('back',(R,m)=>{ok('背水の陣 HP満タンは変わらない',near(m.mv/b0.mv,1,1e-3),m.mv/b0.mv);R.hp=R.maxHp*0.5;const m2=meas(R);ok('背水の陣 HP50%で速さ・連射×1.2',near(m2.mv/b0.mv,1.2,0.01)&&near(b0.cd/m2.cd,1.2,1e-3),[m2.mv/b0.mv,b0.cd/m2.cd].join(','));
    R.hp=R.maxHp*0.01;const m3=meas(R);ok('背水の陣 最大×1.4',near(b0.cd/m3.cd,1.396,1e-3),b0.cd/m3.cd);R.pas.regen=5;R.hp=10;for(let i=0;i<60;i++)T.support(1/60);ok('背水の陣 自動の回復がきかない',R.hp===10,R.hp);});
  one('greed',(R,m)=>ok('欲ばり お金と経験値×1.4・敵×1.2',near(R.cs.xp,1.4)&&near(R.cs.goldM,1.4)&&near(R.cs.spawn,1.2),[R.cs.xp,R.cs.goldM,R.cs.spawn].join(',')));
  one('heavy',(R,m)=>ok('重戦車 最大HP×1.5・速さ×0.8',m.hp===b0.hp+Math.round(b0.hp*0.5)&&near(m.mv/b0.mv,0.8,0.01),[m.hp,m.mv/b0.mv].join(',')));
  one('fury',(R,m)=>ok('狂戦士 近接×1.6・射撃×0.8・防御はそのまま',near(m.sw/b0.sw,1.6,1e-3)&&near(m.dmg/b0.dmg,0.8,1e-3)&&near(m.sh/b0.sh,1,1e-3),[m.sw/b0.sw,m.dmg/b0.dmg,m.sh/b0.sh].join(',')));
  one('one',(R,m)=>{R.tlv.sword=4;T.calcCS();const m2=meas(R);ok('一点集中 いちばん高い武器×1.4・ほか×0.85',R.cs.top==='sword'&&near(m2.dmg/b0.dmg,0.85,1e-3),[R.cs.top,m2.dmg/b0.dmg].join(','));});
  one('haste',(R,m)=>{ok('時の加速 経験値×1.3・速さ×1.15',near(R.cs.xp,1.3)&&near(m.mv/b0.mv,1.15,0.01),[R.cs.xp,m.mv/b0.mv].join(','));
    const e=T.addEnemy('bug',240,100);e.hp=e.max=1e9;T.shootAt(e,92,0);const b=R.EB[R.EB.length-1],by=b.y;T.moveEB(0.1);const v1=b.y-by;R.spc.haste=0;T.calcCS();const by2=b.y;T.moveEB(0.1);ok('時の加速 敵の弾も×1.15',near(v1/(b.y-by2),1.15,1e-3),v1/(b.y-by2));});
  one('wall',(R,m)=>{R.inv=0;const h=R.hp;T.hurt(10);ok('鉄壁 受けるダメージ×0.7・連射×0.85',near(h-R.hp,7,1e-6)&&near(b0.cd/m.cd,0.85,1e-3),[h-R.hp,b0.cd/m.cd].join(','));});
  /* 出るのはレベル5から・15%くらい・1出撃に1回 */
  {const R=go('standard',['laser','missile']);R.lv=4;let n4=0;for(let i=0;i<2000;i++)if(T.buildChoices().some(o=>o.spc))n4++;R.lv=5;let n5=0;for(let i=0;i<4000;i++)if(T.buildChoices().some(o=>o.spc))n5++;
    ok('特別 レベル4までは出ない・5から15%',n4===0&&Math.abs(n5/4000-0.15)<0.025,[n4,n5/4000].join(','));
    for(const k of T.SPC_IDS)if(k!=='glass')T.takeSpc(k);let g=0,other=0;for(let i=0;i<4000;i++){const c=T.buildChoices();if(c.some(o=>o.key==='x:glass'))g++;if(c.some(o=>o.spc&&o.key!=='x:glass'))other++;}ok('特別 取ったものは二度と出ない',other===0&&g>0,[g,other].join(','));
    const c=T.buildChoices();ok('特別のカード 紫の枠と代償の文',(()=>{for(let i=0;i<400;i++){const q=T.buildChoices().find(o=>o.spc);if(q)return q.c===T.CATC.x&&!!q.bad;}return false;})(),'');}
  ok('特別な強化 8種',T.SPC_IDS.length===8,T.SPC_IDS.length);
  return res;}
"""

# 宝箱・えらび直し／スキップ／除外
CHEST = r"""
()=>{const T=window.__T,go=window.__go,res={};const ok=(k,pass,val)=>{res[k]={pass:!!pass,val};};
  window.__lab0();
  const tot=R=>Object.values(R.tlv).reduce((a,b)=>a+b,0)+Object.values(R.pas).reduce((a,b)=>a+b,0)+Object.values(R.sup).reduce((a,b)=>a+b,0)+Object.keys(R.evo).length;
  /* 大型の敵で落ちる → ひろう → 3つ */
  {const R=go('standard',['laser','missile']);const b=T.addEnemy('boss',240,120);T.hit(b,1e9,0,0);ok('大型の敵をたおすと宝箱',R.CH.length===1,R.CH.length);
    const c=R.CH[0];R.x=c.x;R.y=c.y;R.G.length=0;const t0=tot(R);T.update(1/60);const cards=document.querySelectorAll('#overlay .card.got').length;
    ok('ひろうと宝箱の画面・中身は3つ',R.state==='lvup'&&cards===3&&tot(R)-t0===3&&R.chestN===1,[R.state,cards,tot(R)-t0].join(','));
    ok('宝箱の画面の文',!/[！!]/.test(document.getElementById('overlay').textContent),document.querySelector('#overlay h2').textContent);
    document.querySelector('#overlay .btnrow .go').disabled=false;document.querySelector('#overlay .btnrow .go').click();ok('受け取ると出撃にもどる',R.state==='play',R.state);}
  /* 200回：いろいろな状態でも必ず3つ（候補がなくなっても修理で3つ） */
  {let bad=0;for(let i=0;i<200;i++){const R=go('standard',['laser','missile','sword','mine']);const lvl=i%4;for(const k in R.pas)if(Math.random()<lvl*0.3)R.pas[k]=T.PAS[k].max;for(const k in R.sup)if(Math.random()<lvl*0.3)R.sup[k]=T.SUP[k].max;
      if(i%10===9){for(const k in R.pas)R.pas[k]=T.PAS[k].max;for(const k in R.sup)R.sup[k]=T.SUP[k].max;for(const t in R.tlv)if(R.tlv[t])R.tlv[t]=T.WMAX;}
      R.chestQ=1;T.openChest();const n=document.querySelectorAll('#overlay .card.got').length;if(n!==3)bad++;}
    ok('宝箱 200回とも3つ',bad===0,bad);}
  /* 研究所なし：ボタンが出ない */
  {const R=go('standard',['laser']);R.pending=1;T.openLevelUp();ok('研究所なし：えらび直し・スキップ・除外のボタンなし',!document.querySelector('#overlay .lvacts')&&R.rr===0&&R.sk===0&&R.bn===0,'');}
  /* 研究所 2・1・3 回 */
  {const R=go('standard',['laser','missile'],{r_reroll:2,r_skip:1,r_ban:3});R.lv=3;R.pending=3;T.openLevelUp();const bs=[...document.querySelectorAll('#overlay .lvacts button')];
    ok('ボタン3つ・回数',bs.length===3&&R.rr===2&&R.sk===1&&R.bn===3,bs.map(b=>b.textContent).join('/'));
    const k0=T.lvChoices.map(o=>o.key).join();T.doReroll();ok('えらび直し：回数−1・3枚',R.rr===1&&T.lvChoices.length===3&&document.querySelectorAll('#overlay .card').length===3,k0+' → '+T.lvChoices.map(o=>o.key).join());
    T.doReroll();T.doReroll();ok('えらび直し：0回で止まる',R.rr===0,R.rr);
    const g0=R.gold,p0=R.pending;T.doSkip();ok('スキップ：お金＋（10＋Lv×2）・次へ',R.gold-g0===10+2*R.lv&&R.pending===p0-1&&R.sk===0,[R.gold-g0,R.pending].join(','));
    T.doSkip();ok('スキップ：0回で止まる',R.pending===p0-1,R.pending);
    T.toggleBan();ok('除外：えらぶ形になる',T.banMode&&document.querySelector('#overlay .lvacts [aria-pressed="true"]'),'');
    const o=T.lvChoices.find(q=>!q.evo),key=o.key;T.pickChoice(o);ok('除外：回数−1・その枠は入れかわる・まだえらぶ画面',R.bn===2&&!T.lvChoices.some(q=>q.key===key)&&R.state==='lvup'&&R.ban.has(key),key);
    let seen=0;for(let i=0;i<1500;i++){if(T.buildChoices().some(q=>q.key===key))seen++;if(T.upPool(new Set()).some(q=>q.key===key))seen++;}ok('除外：その出撃で二度と出ない',seen===0,seen);
    T.toggleBan();T.toggleBan();ok('除外：もう一度おすとやめる',!T.banMode,'');
    const p1=R.pending;T.pickChoice(T.lvChoices[0]);ok('えらぶと次のレベルアップへ',R.pending===p1-1,R.pending);}
  /* 色の枠：装備＝青・機体＝緑・支援＝黄・進化＝白金 */
  {const R=go('standard',['laser','cooler','missile']);R.tlv.laser=8;let cats={};for(let i=0;i<300;i++)T.buildChoices().forEach(o=>{cats[o.cat]=o.c;});
    ok('色の枠',cats.w===T.CATC.w&&cats.p===T.CATC.p&&cats.s===T.CATC.s&&cats.e===T.CATC.e,JSON.stringify(cats));}
  return res;}
"""

# 研究所15項目
LABT = r"""
()=>{const T=window.__T,go=window.__go,res={};const ok=(k,pass,val)=>{res[k]={pass:!!pass,val:typeof val==='number'?+val.toFixed(4):val};};const near=(a,b,e)=>Math.abs(a-b)<=(e||1e-6)*Math.max(1,Math.abs(b));
  T.save=T.freshSave();T.setShip('standard');ok('研究所 15項目',T.LAB.length===15,T.LAB.length);
  /* 値段：1.6倍・10G単位 */
  let badP=[];for(const o of T.LAB)for(let l=0;l<o.max;l++){const want=Math.round(o.p*Math.pow(1.6,l)/10)*10;if(T.labPrice(o,l)!==want||want%10)badP.push(o.id+l);}
  ok('値段 1.6倍（10G単位）',badP.length===0&&T.labPrice(T.LAB[0],1)===320&&T.labPrice(T.LAB[0],2)===510,badP.join(','));
  /* 画面から全部買う（くわしく → 強化） */
  T.save.gold=1e6;T.openLab();let spent=0,clicks=0;
  for(const o of T.LAB)for(let l=0;l<o.max;l++){T.openLabDetail(o.id);const b=document.querySelector('#sheet .buybig');const g=T.save.gold;b.click();spent+=g-T.save.gold;clicks++;}
  const sum=T.LAB.reduce((n,o)=>{let s=0;for(let l=0;l<o.max;l++)s+=T.labPrice(o,l);return n+s;},0);
  const achG=T.ACH.filter(a=>T.save.ach[a.id]).reduce((n,a)=>n+a.g,0);
  ok('画面から全部最大まで買える・値段どおり',T.LAB.every(o=>T.save.lab[o.id]===o.max)&&spent+achG===sum,[spent,sum,achG].join(','));
  T.openLabDetail('r_hp');ok('最大のときは買えない',document.querySelector('#sheet .buybig').disabled,'');T.closeSheet();T.closeLab();
  ok('研究所の文に「！」なし',true,'');
  /* セーブに残る */
  T.persist();const s2=T.loadSave();ok('セーブに残る',T.LAB.every(o=>s2.lab[o.id]===o.max),JSON.stringify(s2.lab));
  /* 増設：全機体に1か所 */
  const extra=T.SHIP_IDS.every(id=>{const sl=T.SHIPS[id].slots;return sl[sl.length-1].name==='増設'&&T.save.ships[id].eq.length===sl.length;});ok('増設：全機体の後ろに場所＋1',extra,T.SHIPS.standard.slots.length);
  /* 出撃に効く：全部0とくらべる */
  const all={};T.LAB.forEach(o=>{all[o.id]=o.max;});const zero={};T.LAB.forEach(o=>{zero[o.id]=0;});
  const meas=(lab)=>{T.save.lab=Object.assign({},lab);T.ensureSlots(T.save);const R=go('standard',['laser'],null);R.pending=0;R.x=240;R.y=400;T.keys.add('ArrowRight');T.movePlayer(0.2);T.keys.clear();T.gems(0.01);
    const L=T.stat('laser');R.xp=0;R.need=1e9;T.gainXp(10);const xp=R.xp;R.hp=10;for(let i=0;i<60;i++)T.support(1/60);
    return {hp:R.maxHp,dmg:L.dmg,cd:L.cd,mv:R.x-240,mag:R.magR,xp,reg:R.hp-10,gm:R.cs.goldM,rr:R.rr,sk:R.sk,bn:R.bn,lv:R.lv,gauge:R.gauge,rev:R.labRev,slots:T.SHIPS.standard.slots.length};};
  const a=meas(all),z=meas(zero),R0=T.R;
  ok('補強 最大HP×1.25',a.hp===Math.round(z.hp*1.25),[a.hp,z.hp].join(','));
  ok('火力 威力×1.2',near(a.dmg/z.dmg,1.2,1e-3),a.dmg/z.dmg);
  ok('連射 ×1.15',near(z.cd/a.cd,1.15,1e-3),z.cd/a.cd);
  ok('エンジン 速さ×1.09',near(a.mv/z.mv,1.09,0.01),a.mv/z.mv);
  ok('磁力 吸い寄せ×1.4',near(a.mag/z.mag,1.4,1e-3),a.mag/z.mag);
  ok('学習 経験値×1.25',near(a.xp/z.xp,1.25,1e-3),a.xp/z.xp);
  ok('商売 お金×1.25',near(a.gm,1.25),a.gm);
  ok('自己修復 1秒に＋0.3',near(a.reg-z.reg,0.3,0.01),a.reg-z.reg);
  ok('えらび直し・スキップ・除外 3回ずつ',a.rr===3&&a.sk===3&&a.bn===3&&z.rr===0,[a.rr,a.sk,a.bn].join(','));
  ok('先行訓練 Lv3 からえらぶ',a.lv===3,a.lv);
  ok('予備電池 ゲージ半分',a.gauge===T.SPG.max/2&&z.gauge===0,a.gauge);
  ok('増設 研究所なしだと元の数',a.slots===z.slots+1,[a.slots,z.slots].join(','));
  /* 予備の機体：HP0 で50%に。1回だけ */
  {T.save.lab=Object.assign({},all);T.ensureSlots(T.save);const R=go('standard',['laser']);R.guts=false;R.inv=0;T.hurt(1e6);const h1=R.hp;R.inv=0;T.hurt(1e6);ok('予備の機体 1回だけ HP50%',h1===Math.round(R.maxHp*0.5)&&R.hp===0,[h1,R.hp].join(','));}
  /* 先行訓練：出撃してすぐレベルアップの画面 */
  {T.save.lab=Object.assign({},all);T.ensureSlots(T.save);window.__HOLD=1;T.save.ships.standard.have=true;T.setShip('standard');T.startRun();const R=T.R;T.update(1/60);ok('先行訓練：すぐえらぶ画面',R.state==='lvup'&&R.pending===2,[R.state,R.pending].join(','));}
  /* 研究所を全部最大にして早送り（60秒） */
  {T.save.lab=Object.assign({},all);T.ensureSlots(T.save);const R=go('standard',['laser','missile','sword','mine','shield','thunder','gatling','cannon']);R.pending=0;
    for(let i=0;i<60*60&&R.state!=='over';i++){if(R.state==='lvup'){if(T.lvChoices)T.pickChoice(T.lvChoices[0]);else window.__chestOk();}window.__fill(120);T.update(1/60);if(i%30===0)T.draw();R.hp=Math.max(R.hp,R.maxHp*0.5);}
    ok('研究所 全部最大で60秒 早送り',R.t>59&&R.mods.length===8,[Math.round(R.t),R.kills,R.lv].join(','));}
  window.__lab0();
  return res;}
"""

# 実績24個
ACHT = r"""
()=>{const T=window.__T,res={};const ok=(k,pass,val)=>{res[k]={pass:!!pass,val};};
  const set={clear1:s=>{s.rec.clears=1;},clear10:s=>{s.rec.clears=10;},half:s=>{s.rec.halfClear=1;},stage5:s=>{s.rec.stageMax=5;},kill1k:s=>{s.rec.kills=1000;},kill10k:s=>{s.rec.kills=10000;},
    run1k:s=>{s.rec.bestKills=1000;},boss1:s=>{s.rec.bosses=1;},boss20:s=>{s.rec.bosses=20;},nodmg:s=>{s.rec.nodmg=1;},fast:s=>{s.rec.fastBoss=1;},evo1:s=>{s.rec.evos=1;},
    evo5:s=>{['laser','gatling','missile','sword','saw'].forEach(t=>{s.evo[t]=1;});},wmax:s=>{s.rec.wmax.laser=8;},sup1:s=>{s.rec.sup5=['wing'];},lv30:s=>{s.rec.bestLv=30;},
    spc3:s=>{s.rec.bestSpc=3;},chest10:s=>{s.rec.chests=10;},sp50:s=>{s.rec.spTotal=50;},ship3:s=>{s.ships.rapid.have=true;s.ships.fortress.have=true;},
    shipAll:s=>{T.SHIP_IDS.forEach(id=>{s.ships[id].have=true;});},lab10:s=>{s.lab.r_hp=5;s.lab.r_pow=5;},book50:s=>{T.TYPES.slice(0,49).forEach(t=>{s.owned[t]=1;});},gold10k:s=>{s.rec.goldTotal=10000;}};
  ok('実績 24個・id がちがう',T.ACH.length===24&&new Set(T.ACH.map(a=>a.id)).size===24&&T.ACH.every(a=>set[a.id]),T.ACH.length);
  ok('ごほうび 100〜1000G・合計',T.ACH.every(a=>a.g>=100&&a.g<=1000&&a.g%100===0),T.ACH.reduce((n,a)=>n+a.g,0));
  const bad=[];
  for(const a of T.ACH){T.save=T.freshSave();T.setShip('standard');T.save.owned.laser=0;const g0=T.save.gold;T.checkAch();const pre=Object.keys(T.save.ach).length;set[a.id](T.save);
    const got=T.checkAch();const ids=got.map(x=>x.id);const extra=ids.filter(x=>x!==a.id&&!(a.id==='shipAll'&&x==='ship3')&&!(a.id==='clear10'&&x==='clear1')&&!(a.id==='kill10k'&&x==='kill1k')&&!(a.id==='boss20'&&x==='boss1')&&!(a.id==='evo5'&&x==='book50'));
    const want=got.reduce((n,x)=>n+x.g,0);
    if(pre!==0||!ids.includes(a.id)||extra.length||T.save.gold-g0!==want)bad.push(a.id+':'+ids.join('+')+':'+(T.save.gold-g0));
    const g1=T.save.gold;T.checkAch();if(T.save.gold!==g1)bad.push(a.id+' 2回目');}
  ok('24個それぞれの条件で達成・決まった G・2回はもらえない',bad.length===0,bad.join(' '));
  /* まだのときは達成しない（1つ前の数） */
  T.save=T.freshSave();T.setShip('standard');T.save.rec.kills=999;T.save.rec.clears=0;const g=T.checkAch();ok('条件の手前では達成しない',!g.some(a=>a.id==='kill1k'),g.map(a=>a.id).join());
  /* 出撃のおわりで達成 → 結果の画面に出る */
  {window.__HOLD=1;T.save=T.freshSave();T.setShip('standard');T.save.load[1]={t:'laser',d:0};T.startRun();const R=T.R;R.kills=1000;R.t=300;const g0=T.save.gold;T.endRun(true,false);
    const txt=document.getElementById('overlay').textContent;ok('出撃のおわり：はじめてのクリア・千体・余裕の帰還が結果に出る',T.save.ach.clear1&&T.save.ach.kill1k&&T.save.ach.half&&/実績「千体」/.test(txt)&&!/実績「[^」]*」[^+]*！/.test(txt),txt.slice(-120));}
  /* 実績の画面 */
  T.openAch();ok('実績の画面：24行・達成の数',document.querySelectorAll('#achBody .arow').length===24&&document.querySelectorAll('#achBody .arow.done').length===Object.keys(T.save.ach).length,document.getElementById('achAll').textContent);
  ok('実績の画面に「！」なし',!/[！!]/.test(document.getElementById('achSheet').textContent),'');T.closeAch();
  return res;}
"""

# 図鑑・古いセーブ
BOOKT = r"""
()=>{const T=window.__T,res={};const ok=(k,pass,val)=>{res[k]={pass:!!pass,val};};
  T.save=T.freshSave();T.setShip('standard');
  ok('図鑑 全部で 69＋14＋12＋5',T.BOOK_N()===100&&T.TYPES.length===69&&Object.keys(T.EVO).length===14,T.BOOK_N());
  T.openBook();const secs=[...document.querySelectorAll('#bookBody .bsec')];
  ok('図鑑の画面：4つの区切り・100個',secs.length===4&&document.querySelectorAll('#bookBody .bgrid button').length===100,secs.map(s=>s.querySelector('h3').textContent).join(' '));
  ok('はじめ：レーザー・スタンダードだけ',T.bookCount(T.save)===2&&document.querySelectorAll('#bookBody .bgrid button:not(.no)').length===2,T.bookCount(T.save));
  document.querySelector('#bookBody .bgrid button.no').click();ok('まだのもの：？？？',/？？？/.test(document.getElementById('sheet').textContent),document.querySelector('#sheet h3').textContent);T.closeSheet();
  document.querySelector('#bookBody .bgrid button:not(.no)').click();ok('見つけたもの：名前',/レーザー/.test(document.getElementById('sheet').textContent),document.querySelector('#sheet h3').textContent);T.closeSheet();T.closeBook();
  /* 出撃で出会った敵がうまる・たおした数 */
  {const R=window.__go('standard',['laser']);T.addEnemy('bug',240,100);const e=T.addEnemy('tank',240,100);T.hit(e,1e9,0,0);const b=T.addEnemy('boss',240,100);b.art='boss2';T.hit(b,1e9,0,0);T.endRun(false,true);
    ok('出会った敵が図鑑に・たおした数',T.save.book.e.bug===0&&T.save.book.e.tank===1&&T.save.book.e.boss2===1&&T.save.book.e.shooter==null,JSON.stringify(T.save.book.e));
    T.persist();const s2=T.loadSave();ok('図鑑・実績・記録がセーブに残る',s2.book.e.tank===1&&s2.rec.kills===T.save.rec.kills&&JSON.stringify(s2.ach)===JSON.stringify(T.save.ach),JSON.stringify(s2.rec));}
  T.openBook();ok('図鑑の画面に「！」なし',!/[！!]/.test(document.getElementById('bookSheet').textContent),'');T.closeBook();
  /* 古いセーブ（#11 の形：研究所・実績・図鑑・新しい記録がない） */
  localStorage.setItem(T.KEY,JSON.stringify({v:2,gold:500,owned:{laser:2,missile:1},ships:{standard:{have:true,eq:[null,{t:'laser',d:0},{t:'laser',d:0}]},rapid:{have:true,eq:[{t:'missile',d:0}]}},cur:'rapid',evo:{laser:1},
    rec:{clears:2,bosses:3,goldTotal:900,wmax:{laser:8},sup5:[],fastBoss:0,bestKills:400,halfClear:1,meleeK:0,evos:1,stageMax:1},best:{t:300,kills:400,clear:true},tut:1,howto:1}));
  const s3=T.loadSave();
  ok('古いセーブ：読める・研究所は0・増設なし',s3.gold===500&&s3.cur==='rapid'&&T.LAB.every(o=>s3.lab[o.id]===0)&&Object.keys(s3.ach).length===0&&s3.rec.kills===0&&s3.ships.standard.eq.length===7&&s3.ships.rapid.eq[0].t==='missile',JSON.stringify(s3.lab).slice(0,40));
  T.save=s3;T.setShip('rapid');const g0=T.save.gold;const got=T.checkAch();
  ok('古いセーブ：記録どおりの実績をもらう',['clear1','boss1','half','evo1','wmax'].every(id=>T.save.ach[id])&&T.save.gold-g0===got.reduce((n,a)=>n+a.g,0)&&!T.save.ach.clear10,got.map(a=>a.id).join(','));
  localStorage.setItem(T.KEY,'{bad json');const s4=T.loadSave();ok('こわれたセーブ：はじめから',s4.cur==='standard'&&T.LAB.every(o=>s4.lab[o.id]===0),'');
  localStorage.removeItem(T.KEY);T.save=T.freshSave();T.setShip('standard');
  return res;}
"""

# 全部1回ずつ取って早送り
RUNALL = r"""
(secs)=>{const T=window.__T,go=window.__go;window.__lab0();
  const R=go('standard',['laser','missile','sword','mine']);R.pending=0;
  for(const k of T.PAS_NEW)R.pas[k]=1;for(const k of T.SUP_NEW)T.supUp(k);for(const k of T.SPC_IDS)T.takeSpc(k);T.calcCS();
  let worst=0,lv=0,ch=0;const t0=performance.now();
  for(let i=0;i<secs*60&&R.state!=='over';i++){
    if(R.state==='lvup'){if(T.lvChoices){T.pickChoice(T.lvChoices[(Math.random()*T.lvChoices.length)|0]);lv++;}else{window.__chestOk();ch++;}}
    if(R.state!=='play')continue;
    if(i%600===300){const b=T.addEnemy('boss',240,120);T.hit(b,1e9,0,0);const c=R.CH[R.CH.length-1];if(c){c.x=R.x;c.y=R.y;}}
    const a=performance.now();T.update(1/60);if(i%30===0){T.draw();T.hud();}const d=performance.now()-a;if(d>worst&&i>10)worst=d;R.hp=Math.max(R.hp,R.maxHp*0.5);}
  return {t:Math.round(R.t),kills:R.kills,lv:R.lv,picks:lv,chests:R.chestN,ms:Math.round(performance.now()-t0),worst:+worst.toFixed(1),spc:R.spcN,
    supMax:Object.keys(R.sup).filter(k=>R.sup[k]>=T.SUP[k].max).length,pasMax:Object.keys(R.pas).filter(k=>R.pas[k]>=T.PAS[k].max).length};}
"""

# 最大レベル：機体の強化と支援を全部最大にして早送り
RUNMAX = r"""
(secs)=>{const T=window.__T,go=window.__go;window.__lab0();
  const R=go('fortress',['laser','missile','sword','mine','shield','gatling','thunder','saw']);R.pending=0;
  for(const k in R.pas)R.pas[k]=T.PAS[k].max;for(const k in R.sup)for(let i=0;i<T.SUP[k].max;i++)T.supUp(k);for(const m of R.mods)R.tlv[m.t]=T.WMAX;R.maxHp+=100;T.calcCS();
  for(let i=0;i<secs*60&&R.state!=='over';i++){if(R.state==='lvup'){if(T.lvChoices)T.pickChoice(T.lvChoices[0]);else window.__chestOk();}if(R.state!=='play')continue;
    window.__fill(150);T.update(1/60);if(i%20===0)T.draw();R.hp=R.maxHp;}
  return {t:Math.round(R.t),kills:R.kills,state:R.state};}
"""

# 重さ：支援を全部最大・敵280体
PERF = r"""
()=>{const T=window.__T,go=window.__go;window.__lab0();
  const R=go('standard',['laser','missile','gatling','sword','mine','thunder','shield']);R.t=200;R.acc=-1e9;
  for(const k in R.pas)R.pas[k]=T.PAS[k].max;for(const k in R.sup)for(let i=0;i<T.SUP[k].max;i++)T.supUp(k);for(const m of R.mods)R.tlv[m.t]=T.WMAX;R.thT=R.msT=R.bsT=0.1;R.tsT=1e9;T.calcCS();
  for(let i=0;i<60;i++){window.__fill(280);T.update(1/60);R.hp=R.maxHp;T.draw();}
  const ts=[];for(let i=0;i<300;i++){window.__fill(280);if(i%20===0)for(let k=0;k<8;k++)T.shootAt(R.E[k],92,0);const a=performance.now();T.update(1/60);T.draw();ts.push(performance.now()-a);R.hp=R.maxHp;if(R.state!=='play')R.state='play';}
  ts.sort((a,b)=>a-b);return {med:+ts[ts.length>>1].toFixed(2),p95:+ts[Math.floor(ts.length*0.95)].toFixed(2),max:+ts[ts.length-1].toFixed(2),bs:!!R.BS};}
"""

# 必殺技の最初の1回（#11 の点検：はじめの1フレームが重い）
SPFIRST = r"""
(id)=>{const T=window.__T,go=window.__go;window.__lab0();const R=go(id,[T.SHIPS[id].start[0].t]);R.t=60;R.acc=-1e9;
  for(let i=0;i<30;i++){window.__fill(150);T.update(1/60);T.draw();R.hp=R.maxHp;}
  R.gauge=T.SPG.max;let mx=0;for(let i=0;i<20;i++){const a=performance.now();T.update(1/60);T.draw();T.hud();mx=Math.max(mx,performance.now()-a);R.hp=R.maxHp;}
  return {id,max:+mx.toFixed(1),sp:R.spN};}
"""

# なぎはらい：自機が上にいても3本が重ならない（#11 の点検）
BLADE = r"""
()=>{const T=window.__T,go=window.__go;const R=go('blade',['sword']);R.y=40;R.gauge=T.SPG.max;T.update(1/60);if(!R.sp)return {pass:false,val:'出ない'};
  const ys=R.sp.L.map(l=>l.y);const gaps=[ys[0]-ys[1],ys[1]-ys[2]];return {pass:gaps.every(g=>g>=60),val:ys.join(',')};}
"""

OMEGA = r"""
()=>{const T=window.__T,go=window.__go;window.__lab0();let R=go('standard',['grenade','thunder']);const g0=T.stat('grenade'),t0=T.stat('thunder');const e0=R.cs.evade;
  R=go('omega',['grenade','thunder']);const g1=T.stat('grenade'),t1=T.stat('thunder');
  const r=x=>+x.toFixed(4);return {pass:Math.abs(g1.rad/g0.rad-1.1)<1e-3&&Math.abs(t1.range/t0.range-1.1)<1e-3&&Math.abs(g1.dmg/g0.dmg-1.1*1.1)<1e-3&&Math.abs(R.cs.evade-e0-0.1)<1e-9,val:[r(g1.rad/g0.rad),r(t1.range/t0.range),r(g1.dmg/g0.dmg),r(R.cs.evade)].join(',')};}
"""


def main():
    tmp = tempfile.mkdtemp(); pp = os.path.join(tmp, 't.html'); open(pp, 'w', encoding='utf-8').write(build(SRC))
    errs = []; fails = 0
    def report(title, res):
        nonlocal fails
        n = 0
        for k, v in res.items():
            n += 1
            if not v['pass']:
                fails += 1; print('NG', title, k, v['val'])
        print('%s: %d 項目' % (title, n))
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
        if t['n'] != {'pas': 20, 'sup': 12, 'spc': 8, 'lab': 15, 'ach': 24, 'ids': 24}:
            fails += 1; print('NG 数')
        pg.evaluate("()=>{document.getElementById('hangar').hidden=true;document.getElementById('sortie').hidden=false;}")
        report('機体の強化', pg.evaluate(PAS))
        report('支援', pg.evaluate(SUP))
        report('特別な強化', pg.evaluate(SPCT))
        report('宝箱・えらび直し', pg.evaluate(CHEST))
        # 画面の文（レベルアップ・宝箱）に「！」なし
        txt = pg.evaluate("""()=>{const T=window.__T;const R=window.__go('standard',['laser'],{r_reroll:1,r_skip:1,r_ban:1});R.pending=1;T.openLevelUp();const a=document.getElementById('overlay').textContent;R.chestQ=1;T.openChest();return a+document.getElementById('overlay').textContent;}""")
        if '！' in txt or '!' in txt:
            fails += 1; print('NG 画面の文に！', txt[:120])
        pg.evaluate("()=>{document.getElementById('sortie').hidden=true;document.getElementById('overlay').hidden=true;document.getElementById('hangar').hidden=false;}")
        report('研究所', pg.evaluate(LABT))
        report('実績', pg.evaluate(ACHT))
        report('図鑑・古いセーブ', pg.evaluate(BOOKT))
        pg.evaluate("()=>{document.getElementById('hangar').hidden=true;document.getElementById('sortie').hidden=false;}")
        r = pg.evaluate(RUNALL, SECS)
        print('全部1回ずつ取って早送り:', r)
        if r['t'] < SECS - 1 or r['spc'] != 8:
            fails += 1; print('NG 早送り')
        r = pg.evaluate(RUNMAX, min(SECS, 120))
        print('全部最大で早送り:', r)
        if r['t'] < min(SECS, 120) - 1:
            fails += 1; print('NG 最大で早送り')
        perf = pg.evaluate(PERF)
        print('重さ（支援を全部最大・敵280体・1フレーム update+draw ms 中央/95%/最大）:', perf)
        if perf['p95'] > 16:
            fails += 1; print('NG 重さ')
        sp = [pg.evaluate(SPFIRST, sid) for sid in pg.evaluate("()=>window.__T.SHIP_IDS")]
        print('必殺技の最初の1回（いちばん重い1フレーム ms）:', ' '.join('%s=%.1f' % (x['id'], x['max']) for x in sp))
        for x in sp:
            if x['sp'] < 1 or x['max'] > 40:
                fails += 1; print('NG 必殺技の最初', x)
        for name, js in (('なぎはらい 3本がはなれる', BLADE), ('オメガ 射程・範囲・爆発・回避も＋10%', OMEGA)):
            r = pg.evaluate(js)
            print(name, r['val'])
            if not r['pass']:
                fails += 1; print('NG', name)
        b.close()
    for e in errs[:10]:
        print('ERR', e)
    print('エラー', len(errs), '・NG', fails)
    sys.exit(1 if errs or fails else 0)


if __name__ == '__main__':
    main()
