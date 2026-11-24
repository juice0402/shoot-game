/* ---------- App Store のスクショの場面（11/24・ios-kobo の台本から呼ぶ） ----------
   自動のためし（navigator.webdriver）のときだけ動く。ふつうに遊ぶときは何もしない。
   location.hash='shot=<名前>'（読みこんだときと hashchange）。名前：title・battle・levelup・boss・hangar・shop・lab
   台本は Math.random を種で固定してから hash を変える。出撃の場面は決まったこま数だけ進めてから絵を止める（fxHold） */
const SHOT_LOAD=[['laser',0],['missile',7],['missile',1],['gatling',0],['gatling',0],['shotgun',0],['shotgun',0],['thunder',0]];/* 表紙と同じ7つ＋増設 */
function shotSave(){const s=freshSave();
  s.howto=1;s.tut=1;s.talk.lab=1;s.gold=12480;s.st=1;
  SHIP_IDS.forEach((id,i)=>{s.ships[id].have=i<9;});
  s.unl=TYPES.filter(t=>MODS[t].unlock);s.lunl=LAB.filter(o=>o.unlock).map(o=>o.id);
  LAB.forEach((o,i)=>{s.lab[o.id]=o.max<=1?o.max:Math.max(1,o.max-(i%3));});s.lab.r_lv=0;/* 研究所は進めた形（先行訓練は出撃のはじめにレベルアップが出るので0） */
  TYPES.forEach((t,i)=>{if(MODS[t].cat==='atk'&&i%3===0)s.owned[t]=1;});
  ensureSlots(s);const L=s.ships.standard.eq;SHOT_LOAD.forEach((v,i)=>{if(i<L.length)L[i]={t:v[0],d:v[1]};});
  L.forEach(v=>{if(v)s.owned[v.t]=Math.max(s.owned[v.t],L.filter(w=>w&&w.t===v.t).length);});
  Object.assign(s.rec,{stageMax:4,clears:6,bosses:14,goldTotal:9800,runs:21,kills:8400,bestLv:24});
  return s;}
function shotReset(){if(R){cancelAnimationFrame(raf);R=null;}sortie.hidden=true;overlay.hidden=true;banner.hidden=true;
  $('shopSheet').hidden=true;$('labSheet').hidden=true;closeSheet();commHide();COMM.pend=null;
  save=shotSave();setShip('standard');view='standard';}
function shotQuiet(){commHide();$('note').hidden=true;}
/* 出撃を n こま（1/60 秒）進めて止める。HP は減らさない・とちゅうのレベルアップは出さない */
function shotRun(stg,t0,n,big){
  save.st=stg;startRun();if(!R)return;
  R.bossAt=[];R.bossArt=[];R.pending=0;R.lv=16;R.need=1e12;R.t=t0;R.gauge=SPG.max*0.55;
  R.mods.forEach(m=>{if(!MODS[m.t].passive)R.tlv[m.t]=Math.max(R.tlv[m.t],m.t==='laser'?8:6);});calcCS();
  if(big){const b=addBig(big);b.y=GH*0.2;}/* 大型の敵は上から入ってくるので、はじめから画面の中に置く */
  for(let i=0;i<n;i++){update(1/60);R.hp=R.maxHp;
    if(R.state!=='play'){R.state='play';overlay.hidden=true;lvChoices=null;}}
  R.hp=Math.round(R.maxHp*0.82);R.need=xpNeed(R.lv);R.xp=R.need*0.64;
  banner.hidden=true;fxHold=Infinity;draw();hud();}
const SHOTS={
  title(){showTitle();},
  hangar(){toHangarFromTitle();shotQuiet();},
  shop(){toHangarFromTitle();shopCat='atk';openShop();shotQuiet();},
  lab(){toHangarFromTitle();openLab();shotQuiet();},
  battle(){titleEl.hidden=true;shotRun(2,200,480);},
  levelup(){titleEl.hidden=true;shotRun(3,140,300);openLevelUp();},
  boss(){titleEl.hidden=true;shotRun(5,120,200,'core');},
};
function shotGo(){if(!navigator.webdriver)return;const m=/^#?shot=(\w+)/.exec(location.hash);const f=m&&SHOTS[m[1]];if(!f)return;
  shotReset();f();}
window.addEventListener('hashchange',shotGo);setTimeout(shotGo,0);/* 読みこんだときの hash は、起動（title.js）のあとで見る */
