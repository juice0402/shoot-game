/* ---------- sortie ---------- */
const stage=$('stage'),cv=$('game'),ctx=cv.getContext('2d'),overlay=$('overlay'),banner=$('banner');
let gMaxR=33,GH=500,scale=1,R=null,sdrag=null,raf=0,last=0,nextId=1,grid=null,gCols=0,gRows=0,bannerT=0,hc={};
const keys=new Set();

function fitCanvas(){
  const r=stage.getBoundingClientRect();
  scale=Math.max(0.5,Math.min(r.width/GW,(r.height-8)/GH));
  cv.style.width=Math.floor(GW*scale)+'px';cv.style.height=Math.floor(GH*scale)+'px';
  sortie.style.setProperty('--cw',Math.floor(GW*scale)+'px');/* PC の幅：上の表示を画面（キャンバス）の幅にそろえる（#14） */
}
function setupCanvas(){
  const r=stage.getBoundingClientRect();
  GH=clamp(Math.round(GW*(r.height-8)/Math.max(1,r.width)),660,1080);
  cv.width=GW;cv.height=GH;ctx.imageSmoothingEnabled=false;fitCanvas();
}
window.addEventListener('resize',()=>{if(R)fitCanvas();});

const xpNeed=lv=>Math.round(6+lv*4+lv*lv*0.6);
/* 威力の倍率：火力アップ・機体・怒りの回路（HP半分以下で最大） */
const dmgMul=()=>(1+0.1*R.pas.power)*R.sh.pow*(R.cs.berserk?1+R.cs.berserk*clamp((1-R.hp/R.maxHp)*2,0,1):1)*(1+0.3*R.focus)*R.fm*R.cs.pow;/* focus スナイパーの集中・fm ヴァンガードの前向き・cs.pow 研究所とガラスの大砲 */
/* ---------- 共通の数字（全部の武器と機体に効く）。装備の数から作る。機体の強化（#12）もここに足す ----------
   crit 会心の確率・critD 会心の倍率・area 範囲・dur 効果時間・multi 弾の数・mdmg 多弾の威力・range 射程・bspd 弾の速さ・rate 連射
   xp 経験値・gauge 必殺ゲージ・ifr 無敵時間・evade 回避・absorb 吸収板・berserk 怒りの回路 */
function calcCS(){
  const c=t=>R.mods.reduce((n,m)=>n+(m.t===t?1:0),0);
  const sh=R.sh;/* 機体の倍率（#11）：range スナイパー・area ボマー・evade ファントム（オメガは全部＋10%） */
  const P=R.pas,L=R.lab||{},X=R.spc||{},lb=k=>L[k]||0;/* #12：P 機体の強化（道中）・L 研究所・X 特別な強化 */
  R.cs={crit:0.05*c('crit')+0.04*P.critc,critD:2+0.2*P.critd,area:(1+0.15*c('amp'))*(sh.area||1)*(1+0.1*P.area),dur:(1+0.2*c('dur'))*(1+0.12*P.dur),
    multi:c('multi')+P.multi,mdmg:Math.pow(0.9,c('multi')),
    range:(1+0.15*c('scope'))*(sh.range||1)*(1+0.1*P.range),bspd:(1+0.15*c('scope'))*(1+0.12*P.bspd),
    rate:(1+0.08*c('cooler'))*(1+0.03*lb('r_rate'))*(X.wall?0.85:1),
    xp:(1+0.1*c('xpamp'))*(1+0.05*lb('r_xp'))*(X.greed?1.4:1)*(X.haste?1.3:1),gauge:(1+0.2*c('reactor'))*(1+0.12*P.skillg),
    ifr:(1+0.4*c('iframe'))*(1+0.15*P.iframe),evade:Math.min(0.6,Math.min(0.45,0.15*c('evade'))+(sh.evade||0)+0.04*P.evade),absorb:0.5*c('absorber'),berserk:0.3*c('berserk'),
    spike:c('spike'),frost:c('frost'),cdrone:c('cdrone'),
    knock:1+0.25*P.knock,exec:EXEC[P.exec]||0,pow:(1+0.04*lb('r_pow'))*(X.glass?1.5:1),spd:(1+0.03*lb('r_spd'))*(X.heavy?0.8:1)*(X.haste?1.15:1),
    mag:1+0.08*lb('r_mag'),goldM:(1+0.05*lb('r_gold'))*(X.greed?1.4:1),regen:0.1*lb('r_regen'),dmgIn:X.wall?0.7:1,eSpd:X.haste?1.15:1,spawn:X.greed?1.2:1,
    top:X.one?topWeapon():null};
}
/* 一点集中：いちばんレベルの高い武器（同じなら先につけた方） */
function topWeapon(){let best=null,bl=0;for(const m of R.mods){if(MODS[m.t].passive)continue;const l=R.tlv[m.t]||0;if(l>bl){bl=l;best=m.t;}}return best;}
/* 背水の陣：HPが減るほど速さと連射＋（最大40%） */
const backK=()=>R.spc.back?1+0.4*clamp(1-R.hp/R.maxHp,0,1):1;
/* 共通の数字がどの値に効くか：a 範囲・u 効果時間・g 射程・s 弾の速さ（かけ算）／n 弾の数（足し算） */
const CSK={
  laser:{n:'n',s:'spd'},gatling:{n:'n',s:'spd'},mine:{n:'n',a:'rad',u:'life'},shotgun:{n:'n',s:'spd',g:'life'},
  freeze:{n:'n',s:'spd',u:'slowT'},missile:{n:'n',a:'rad',g:'life'},flame:{n:'n',g:'life'},sword:{a:'range'},
  saw:{n:'n',a:'r',g:'v0'},thunder:{n:'chain',g:'range'},gravity:{a:'r',u:'life'},cannon:{a:'w',g:'len'},
  pulse:{n:'n',s:'spd'},rail:{n:'n',s:'spd'},sniper:{n:'n'},fan:{n:'n',s:'spd',g:'life'},ricochet:{n:'n',s:'spd'},
  splitter:{n:'n',s:'spd'},needle:{n:'n',s:'spd'},acid:{n:'n',a:'r',u:'life',s:'spd'},grenade:{n:'n',a:'rad',g:'dist'},
  cluster:{n:'k',a:['rad','srad'],g:'dist'},napalm:{n:'n',a:'r',u:'life',g:'run'},shockwave:{n:'n',a:'R'},torpedo:{n:'n',a:'rad'},
  plasma:{n:'n',a:'r'},prism:{n:'n',s:'spd'},halo:{n:'n',a:'R'},hlaser:{n:'n',g:'life'},sonic:{a:'R',u:'slowT'},
  gsword:{a:'range'},twin:{a:'range'},lance:{a:'len'},hammer:{a:'rad'},whip:{a:'len'},chainsaw:{a:'len'},scythe:{a:'R'},
  turret:{u:'life',g:'range'},minefield:{n:'n',a:'rad',u:'life'},satellite:{n:'n',g:'range'},micro:{n:'n',a:'rad'},emp:{a:'R'},
};
function csMul(s,key,v){if(!key||v===1)return;if(typeof key==='string'){if(s[key]!=null)s[key]*=v;}else for(const q of key)if(s[q]!=null)s[q]*=v;}
function applyCS(k,s){const cs=R.cs;csMul(s,k.a,cs.area);csMul(s,k.u,cs.dur);csMul(s,k.g,cs.range);csMul(s,k.s,cs.bspd);if(k.n&&s[k.n]!=null)s[k.n]+=cs.multi;}
const csk=t=>R.evo[t]&&EVO[t]?EVO[t].k:CSK[t];
/* 近接の武器（ブレードの刃・ヴァンガードの解放の記録）／爆発の武器（ボマー） */
const isMelee=t=>t==='sword'||t==='saw'||!!MODS[t].melee;
/* #12 狂戦士（近接＋60%・射撃−20%）・一点集中（いちばん高い武器＋40%・ほか−15%） */
const wMul=t=>{const X=R.spc;let v=1;if(X.fury)v*=isMelee(t)?1.6:MODS[t].cat==='atk'?0.8:1;if(X.one&&R.cs.top&&!MODS[t].passive)v*=t===R.cs.top?1.4:0.85;return v;};
const BOOM={mine:1,missile:1,grenade:1,cluster:1,torpedo:1,minefield:1,micro:1};
let LKB=0;/* 弾が1発ずつ当てている間は1（大蛇の同じフレームの印を使わない） */
let ATK=0;/* 攻撃ごとの番号（武器1つの発射・near の1回・必殺技の1回ごとに1ふえる）。大蛇の重複よけの印に使う（#14 の点検） */
let HSRC=0;/* いま当てているのが近接の武器なら1（倒した数を数える） */
function stat(t){const s=stat0(t);if(s){const k=csk(t);if(k)applyCS(k,s);}return s;}
function stat0(t){
  const k=csk(t),lv=R.tlv[t]||1,c=(1-0.08*R.pas.clock)/R.sh.rate/R.cs.rate/backK()*(R.sp&&R.sp.od?0.5:1)/* ラピッドの必殺：連射2倍 */,m=dmgMul()*wMul(t)*(k&&k.n?R.cs.mdmg:1)*/* 多弾装置の威力 −10% は、弾の数がふえる武器だけ */(R.sh.blade&&isMelee(t)?R.sh.blade:1)*(R.sh.boom&&BOOM[t]?R.sh.boom:1),p=Math.pow;
  if(R.evo[t]&&EVO[t]){const s=EVO[t].st(lv,c,GR(t,'d',lv)*m,GR(t,'r',lv));if(lv<WMAX)s.dmg*=0.85;return s;}/* アルケミスト（#11）は Lv6 で進化できる。Lv8 までは少し弱い */
  if(STAT6[t])return STAT6[t](lv,c,GR(t,'d',lv)*m,GR(t,'r',lv));
  switch(t){
    case 'laser':return {cd:0.5*p(0.9,lv-1)*c,dmg:(6+2*(lv-1)+(lv>=8?6:0))*m,n:lv>=6?3:lv>=3?2:1,pierce:lv>=7?2:lv>=4?1:0,spd:400*U};
    case 'gatling':return {cd:0.12*p(0.96,lv-1)*(lv>=3?0.88:1)*(lv>=6?0.88:1)*c,dmg:(2.6+0.6*(lv-1))*m,n:lv>=5?2:1,pierce:lv>=8?1:0,spd:420*U,spread:0.13};
    case 'mine':return {cd:2.0*p(0.92,lv-1)*c,dmg:(26+9*(lv-1)+(lv>=8?15:0))*m,rad:(24+3*(lv-1)+(lv>=5?6:0))*U,n:lv>=7?3:lv>=3?2:1,life:7};
    case 'shotgun':return {cd:1.0*p(0.93,lv-1)*c,dmg:(5+1.4*(lv-1))*m,n:lv>=6?9:lv>=3?7:5,cone:0.75,spd:330*U,life:0.3+(lv>=4?0.08:0)+(lv>=7?0.08:0),pierce:lv>=8?1:0};
    case 'freeze':return {cd:0.62*p(0.92,lv-1)*c,dmg:(4+1.5*(lv-1)+(lv>=8?6:0))*m,n:lv>=4?2:1,pierce:lv>=7?1:0,spd:300*U,slowT:1.8+(lv>=3?0.8:0),slowF:lv>=5?0.3:0.5};
    case 'missile':return {cd:1.5*p(0.92,lv-1)*c,dmg:(16+6*(lv-1))*m,n:lv>=8?4:lv>=5?3:lv>=3?2:1,rad:(18+3*(lv-1)+(lv>=4?4:0)+(lv>=7?6:0))*U,life:3.2};
    case 'flame':return {cd:0.07*c,dmg:(1.6+0.45*(lv-1)+(lv>=8?1.2:0))*m,life:0.3+(lv>=3?0.07:0)+(lv>=7?0.07:0),spread:0.3+(lv>=5?0.14:0),spd:150*U,n:1};
    case 'sword':return {cd:1.1*p(0.92,lv-1)*c,dmg:(22+9*(lv-1))*m,range:(32+3*(lv-1)+(lv>=3?4:0)+(lv>=7?6:0))*U,sweep:Math.PI*(0.6+0.04*(lv-1)),dur:0.2,twice:lv>=8};
    case 'saw':return {cd:1.6*p(0.92,lv-1)*c,dmg:(9+3*(lv-1)+(lv>=8?8:0))*m,n:lv>=7?3:lv>=4?2:1,big:lv>=5,v0:230*U,r:lv>=5?12:9};
    case 'thunder':return {cd:1.2*p(0.92,lv-1)*c,dmg:(14+5*(lv-1))*m,range:(150+(lv>=4?30:0))*U,chain:2+(lv>=3?1:0)+(lv>=6?1:0)+(lv>=8?2:0)};
    case 'gravity':return {cd:3.0*p(0.92,lv-1)*c,dmg:(3+1*(lv-1))*m,r:(48+(lv>=3?12:0)+(lv>=6?12:0))*U,life:2.4+(lv>=4?0.8:0),boom:lv>=8};
    case 'cannon':return {cd:3.2*p(0.95,lv-1)*(lv>=4?0.88:1)*(lv>=7?0.88:1)*c,dmg:(40+12*(lv-1)+(lv>=8?30:0))*m,w:(6+(lv>=3?3:0)+(lv>=6?4:0))*U,len:440*U};
    case 'shield':return {R:(20+2*lv+(lv>=5?3:0))*U,half:(38+6*(lv-1))*Math.PI/180,dmg:(5+3*(lv-1))*m,hitcd:lv>=6?0.33:0.45};
    case 'reflector':return {R:(18+lv+(lv>=5?3:0))*U,half:(30+5*(lv-1))*Math.PI/180+(lv>=8?0.2:0),dmg:(10+4*(lv-1)+(lv>=7?6:0))*m,spd:(lv>=4?420:320)*U,pierce:lv>=6?1:0};
  }
  return null;
}

function startRun(){
  commHide();COMM.pend=null;/* 11/17：出撃中は通信を出さない */
  if(!save.load.some(Boolean)||!stOpen(save.st||1))return;
  $('shopSheet').hidden=true;
  hangar.hidden=true;sortie.hidden=false;overlay.hidden=true;banner.hidden=true;
  setupCanvas();
  const mods=[];save.load.forEach((v,i)=>{if(v)mods.push({t:v.t,slot:i,d:v.d,cd:rand(0.1,0.4)});});
  const tlv={};TYPES.forEach(t=>{tlv[t]=0;});mods.forEach(m=>{if(!MODS[m.t].passive)tlv[m.t]=1;});
  const cnt=t=>mods.filter(m=>m.t===t).length;
  const bonus={hp:15*cnt('armor')+40*cnt('harmor'),speed:0.1*cnt('booster')-0.08*cnt('harmor'),magnet:0.3*cnt('magnet'),regen:0.3*cnt('repair'),gold:0.1*cnt('coin')};
  const stars=[];for(let i=0;i<170;i++)stars.push({x:rand(0,GW),y:rand(0,GH),l:i<95?0:i<145?1:2,tw:rand(0,TAU)});
  const lab=Object.assign({},save.lab);/* #12 研究所 */
  const sh=SHIPS[save.cur],maxHp=Math.round((BASE_HP*sh.hp+bonus.hp)*(1+0.05*lab.r_hp));
  const pas={},sup={};Object.keys(PAS).forEach(k=>{pas[k]=0;});Object.keys(SUP).forEach(k=>{sup[k]=0;});
  R={sh,id:save.cur,spr:SHIPSPR[save.cur],guts:save.cur==='standard',t:0,hp:maxHp,maxHp,x:GW/2,y:Math.round(GH*0.78),inv:0,hurtFx:0,lv:1,xp:0,need:xpNeed(1),kills:0,bossKills:0,
    E:[],B:[],EB:[],M:[],G:[],P:[],S:[],A:[],D:[],FX:[],W:[],MN:[],GV:[],Z:[],L:[],Q:[],PD:[],RG:[],RH:[],HL:[],TU:[],TR:[],C:[],CD:[],mods,tlv,bonus,evo:{},cs:null,gold:0,ebLeft:cnt('ebarrier'),ebT:0,revLeft:Math.min(2,cnt('revive')),
    pas,sup,lab,
    wingT:0,strikeT:0,bar:false,barCd:0,
    /* #12：特別な強化・除外・えらび直し／スキップ／除外の回数・宝箱・支援の状態・ノーダメージの記録・図鑑の記録 */
    spc:{},spcN:0,ban:new Set(),rr:lab.r_reroll,sk:lab.r_skip,bn:lab.r_ban,labRev:lab.r_revive,CH:[],chestQ:0,chestN:0,hurtN:0,kE:{},seenE:{},
    thT:2,mdT:6,faT:0,msT:1.5,bsT:6,tsT:0,tstop:0,HO:[],MT:[],SH:[],BS:null,TC:[],satA:0,
    /* #11：必殺ゲージ・必殺技・機体の能力・解放の記録 */
    gauge:0,sp:null,spN:0,spInv:0,ES:[],cmods:[],focus:0,fm:1,ghost:0,meleeK:0,fastBoss:0,evoN:0,lvupN:0,pick:1,stage:1,
    acc:0,pending:0,state:'play',bossAt:[150,270],bossN:0,waveAt:60,target:null,stars,X:[],neb:rand(0,1024),pl:{i:(Math.random()*PLANETS.length)|0,x:rand(40,GW-160),y:rand(-40,GH*0.4)}};
  stageSetup(save.st||1);BGM.reset();BGM.play('st'+R.stg);
  calcCS();
  if(lab.r_lv>0){R.lv=1+lab.r_lv;R.need=xpNeed(R.lv);R.pending=lab.r_lv;}/* 先行訓練：はじめのレベル＋1（すぐにえらぶ） */
  if(lab.r_skill>0)R.gauge=SPG.max/2;/* 予備電池 */
  flushLazy();prewarm();
  sdrag=null;keys.clear();hc={};last=performance.now();
  if(sh.carrier){R.sup.drone=1;}
  $('spbar').style.setProperty('--c',sh.c);
  cancelAnimationFrame(raf);raf=requestAnimationFrame(frame);hud();
  showBanner('ステージ'+R.stg+' '+STAGES[R.stg-1].name);
}

/* spawning */
const spawnRate=t=>1.1+0.045*t+0.00011*t*t;
/* ステージごとの敵のまざり方（#13）。ステージ5は全部のステージの敵＋まぼろし（はじめの1分で少しずつふえる） */
const PICK=[null,
  t=>{const r=Math.random();if(t>=70&&r<0.1)return 'shooter';if(t>=35&&r<0.1+Math.min(0.12,(t-35)/400))return 'tank';return 'bug';},
  t=>{const r=Math.random();if(t>=15&&r<0.15)return 'hider';if(t>=40&&r<0.26)return 'charger';if(t>=90&&r<0.33)return 'tank';return 'bug';},
  t=>{const r=Math.random();if(t>=15&&r<0.1)return 'frost';if(t>=35&&r<0.22)return 'splitter';if(t>=100&&r<0.27)return 'shooter';return r<0.7?'shard':'bug';},
  t=>{const r=Math.random();if(t>=20&&r<0.1)return 'guard';if(t>=70&&r<0.18)return 'tank';if(t>=110&&r<0.25)return 'shooter';return 'bug';},
  t=>{const r=Math.random()/Math.min(1,0.35+t/90);if(r<0.08)return 'warp';if(r<0.13)return 'charger';if(r<0.18)return 'frost';if(r<0.23)return 'guard';if(r<0.28)return 'splitter';
    if(r<0.32)return 'hider';if(r<0.36)return 'tank';if(r<0.4)return 'shooter';return Math.random()<0.6?'bug':'shard';},
];
function pickKind(t){return (PICK[R&&R.stg]||PICK[1])(t);}
const TOPK={shooter:1,frost:1,charger:1,hider:1,turret:1};
function addEnemy(kind,x,y){
  const k=KIND[kind],tt=Math.min(R.t,RUN_LEN),mul=(kind==='boss'?1+tt/150:1+tt/110)*(R.hpK||1);/* ステージの体力の倍率（#13）。5:00 より先（最終ボスの間）は体力がふえない（v1.0：ふえつづけて最終ボスに届かなかった） */
  const e={id:nextId++,kind,x,y,vx:0,vy:0,kx:0,ky:0,hp:k.hp*mul,max:k.hp*mul,r:k.r,dmg:k.dmg,
    spd:k.spd+(kind==='bug'?Math.min(25,R.t/11)*U:0),flash:0,dead:false,fire:rand(1.2,2.4),stopY:rand(GH*0.12,GH*0.38),shield:-9,refl:-9,slow:0,slowF:1,vul:0,son:0,sonV:0,stun:0,reapNow:false,spk:-9,sawT:-9,frz:-9,zn:0,zd:0,born:R.t,hn:R.hurtN,gsT:-9,
    st:0,tm:0,fa:Math.PI/2,sp:null};
  if(kind!=='boss'&&!k.trap&&!k.part)R.seenE[kind]=1;/* 図鑑（大型の敵は絵が決まってから） */
  if(kind==='hider'){e.shell=1;e.sp=ESPR.hiderS;}
  else if(kind==='charger')e.sp=R8.charger[2];
  else if(kind==='guard')e.sp=R8.guard[2];
  else if(kind==='warp')e.tm=rand(1.2,2.2);
  else if(kind==='turret')e.fire=rand(1,2);
  if(k.part)e.part=1;
  R.E.push(e);return e;
}
function spawnOne(){
  const kind=pickKind(R.t),r=Math.random();let x,y;
  if(TOPK[kind]||r<0.78||(r>=0.96&&R.t<150)){x=rand(15,GW-15);y=-24;}
  else if(r<0.96){const left=Math.random()<0.5;x=left?-24:GW+24;y=rand(-24,GH*0.6);}
  else{x=rand(24,GW-24);y=GH+24;}
  addEnemy(kind,x,y);
}
/* 群れ：ステージ3は氷のかけら・ステージ5はかけらと羽虫がまざる */
function wave(){const k=R.stg===3?'shard':'bug';for(let row=0;row<2;row++)for(let i=0;i<14;i++)addEnemy(R.stg===5&&row?'shard':k,21+i*(GW-42)/13,-24-row*24);showBanner('敵の群れが来る！');}
function spawn(dt){
  if(R.winT>0)return;/* 最終ボスをたおしたあと */
  const fb=R.finalB&&!R.finalB.dead?0.5:1;/* 最終ボスの間は少なめ */
  if(R.E.length<MAXE){R.acc+=spawnRate(Math.min(R.t,RUN_LEN))*dt*R.cs.spawn*fb;while(R.acc>=1){R.acc-=1;spawnOne();}}else R.acc=0;
  if(R.t>=R.waveAt){R.waveAt+=60;if(!(R.finalB&&!R.finalB.dead))wave();}
  if(R.bossAt.length&&R.t>=R.bossAt[0]){R.bossAt.shift();const art=(R.bossArt&&R.bossArt.length?R.bossArt.shift():null)||(R.bossN%2?'boss2':'boss');R.bossN++;addBig(art);}
  traps(dt);
}
/* 大型の敵を出す（#13）。BIG の hp＝体力の倍率・r＝当たりの大きさ・ai＝動きと攻撃（なければ大蟹の動き） */
function addBig(art){const D=BIG[art]||BIG.boss,b=addEnemy('boss',GW/2,-80);b.fire=2.5;b.art=art;b.bt=art;b.hp*=D.hp;b.max=b.hp;b.r=D.r;b.cy=0;R.seenE[art]=1;
  if(D.init)D.init(b);
  if(D.final){R.finalB=b;b.final=1;showBanner('最終ボスが来る！');SFX.play('bossin2');}else{showBanner('大型の敵が来る！');SFX.play('bossin');}
  BGM.play(D.final?'final':'boss');
  return b;}
function stageSetup(n){
  const S=STAGES[n-1],pick=a=>a[(Math.random()*a.length)|0];
  R.stg=n;R.stage=n;R.hpK=S.hp;R.final=!!S.final;
  R.bossAt=S.big.map(b=>b[0]);R.bossArt=S.big.map(b=>b[1]==='prev1'?pick(['gnaw','icebeast','fort']):b[1]==='prev2'?pick(['gnaw2','icequeen','snake']):b[1]);
  R.rockT=8;R.snowAt=40;R.snowEnd=-1;R.snow=0;R.snowK=1;R.chill=0;R.lzAt=35;R.turT=20;R.LZ=[];R.SN=[];R.floorV=0;R.finalB=null;R.winT=0;
  R.bo=bgObjs(n);if(n!==1){R.neb=rand(0,bgOf(n).tile.height);}
  if(n===4)R.floorV=bgOf(4).sp;
}
/* しかけ（#13）：岩（ステージ2）・吹雪（3）・砲台とレーザーの壁（4） */
function traps(dt){
  if(R.stg===2){R.rockT-=dt;if(R.rockT<=0){R.rockT=rand(3.5,6)-Math.min(1.5,R.t/200);const r=Math.random(),sz=r<0.5?0:r<0.85?1:2;
    addRock(rand(30,GW-30),-30,sz,Math.PI/2+rand(-0.25,0.25),rand(40,70));}}
  if(R.stg===3){if(R.t>=R.snowAt){R.snowAt+=50;R.snowEnd=R.t+9;showBanner('吹雪が来る');SFX.play('wind');}
    R.snow=clamp(R.snow+(R.t<R.snowEnd?dt:-dt),0,1);R.snowK=1-0.4*R.snow;}
  if(R.stg===4){
    R.turT-=dt;if(R.turT<=0){R.turT=rand(5,8);if(R.E.filter(e=>e.kind==='turret'&&!e.dead).length<6)addEnemy('turret',rand(40,GW-40),-28);}
    if(R.t>=R.lzAt){R.lzAt=R.t+rand(12,17)-Math.min(4,R.t/80);randWall();if(R.t>=180&&Math.random()<0.5)randWall(true);}}
}
const LZW=1.3,LZON=0.6,LZH=12;/* レーザーの壁：予告1.3秒 → 0.6秒 光る・太さ24 */
function addWall(v,pos){R.LZ.push({v,p:pos,t:0,on:0,hit:false,dead:false});SFX.play('lzwarn');}
function randWall(other){const v=other?!R.LZ.length||!R.LZ[R.LZ.length-1].v:Math.random()<0.5,aim=Math.random()<0.4;
  addWall(v,v?(aim?clamp(R.x,40,GW-40):rand(50,GW-50)):(aim?clamp(R.y,GH*0.3,GH-40):rand(GH*0.3,GH*0.88)));}
function walls(dt){for(const w of R.LZ){w.t+=dt;if(w.t>=LZW&&!w.on){w.on=1;SFX.play('lzfire');}
  if(w.on&&!w.hit&&w.t<LZW+LZON&&R.state==='play'){const dd=w.v?Math.abs(R.x-w.p):Math.abs(R.y-w.p);if(dd<LZH+2){w.hit=true;hurt(16);}}
  if(w.t>LZW+LZON+0.15)w.dead=true;}}
const ROCKR=[11,15,21];
function addRock(x,y,sz,a,spd){const e=addEnemy('rock',x,y);e.sz=sz;e.r=ROCKR[sz]*0.85;e.hp*=[1,2,3.4][sz];e.max=e.hp;e.dmg=[10,14,20][sz];
  e.sp=ROCKS[sz][(Math.random()*2)|0];spd*=U;e.v0x=Math.cos(a)*spd;e.v0y=Math.sin(a)*spd;e.vx=e.v0x;e.vy=e.v0y;return e;}
const ROCKC=['#9a8676','#d6c4b0','#64544a','#ff9f43'];
/* 岩がこわれる：こわすとお金（小2・中4・大7G）。ぶつかってこわれたときはお金なし */
function rockBreak(e,coin){burst(e.x,e.y,8+e.sz*6,ROCKC);addX(e.x,e.y,e.sz?EXPL.m:EXPL.s,0.4);SFX.play('crack');
  if(coin)[[1,1],[2,2],[2,2,3]][e.sz].forEach(v=>addCoin(e.x+rand(-6,6),e.y+rand(-6,6),v));}

/* spatial grid */
function buildGrid(){
  const c=Math.ceil((GW+PADG*2)/CELL),r=Math.ceil((GH+PADG*2)/CELL);
  if(!grid||c!==gCols||r!==gRows){gCols=c;gRows=r;grid=Array.from({length:c*r},()=>[]);}
  else for(let i=0;i<grid.length;i++)grid[i].length=0;
  gMaxR=33;
  for(const e of R.E){if(e.dead||e.hide)continue;if(e.r>gMaxR)gMaxR=e.r;
    const cx=clamp(Math.floor((e.x+PADG)/CELL),0,gCols-1),cy=clamp(Math.floor((e.y+PADG)/CELL),0,gRows-1);
    grid[cy*gCols+cx].push(e);}
}
function near(x,y,r,fn){ATK++;
  const rr=r+gMaxR+2;/* 大型の敵（当たり54）もとらえる */
  const x0=clamp(Math.floor((x-rr+PADG)/CELL),0,gCols-1),x1=clamp(Math.floor((x+rr+PADG)/CELL),0,gCols-1);
  const y0=clamp(Math.floor((y-rr+PADG)/CELL),0,gRows-1),y1=clamp(Math.floor((y+rr+PADG)/CELL),0,gRows-1);
  for(let cy=y0;cy<=y1;cy++)for(let cx=x0;cx<=x1;cx++){const cell=grid[cy*gCols+cx];
    for(let i=0;i<cell.length;i++){const e=cell[i];if(e.dead)continue;if(fn(e)===true)return;}}
}

/* effects */
function addPart(x,y,vx,vy,life,c,s){if(R.P.length<520)R.P.push({x,y,vx,vy,life,max:life,c,s:s||2});}
function addX(x,y,set,dur){if(R.X.length<90)R.X.push({x,y,f:set,t:0,dur:dur||0.42,dead:false});}
function burst(x,y,n,cols){for(let i=0;i<n;i++){const a=rand(0,TAU),v=rand(36,135)*U;addPart(x,y,Math.cos(a)*v,Math.sin(a)*v,rand(.25,.5),cols[i%cols.length],i%4===0?3:2);}}
function ring(x,y,rad,cols){for(let i=0;i<18;i++){const a=i/18*TAU,v=rad*4;addPart(x,y,Math.cos(a)*v,Math.sin(a)*v,.22,cols[i%cols.length],2);}}
function spark(x,y,c,h){addPart(x,y,rand(-75,75),rand(-75,75),.15,c,2);if(R.X.length<70)addX(x,y,HITF[h||'w'],0.16);}
function showBanner(t,c){banner.textContent=t;banner.style.borderColor=c||'';banner.hidden=false;clearTimeout(bannerT);bannerT=setTimeout(()=>{banner.hidden=true;},1800);}

/* damage */
function hit(e,amt,kx,ky){
  if(e.dead||e.hide)return;/* まぼろしが消えている間は当たらない */
  if(e.link){e.flash=0.07;e=e.link;if(e.dead)return;}/* 大蛇の体：頭の体力がへる */
  if(e.segs&&!LKB){if(e.lkT===R.t&&e.lkA===amt&&e.lkK===ATK)return;e.lkT=R.t;e.lkA=amt;e.lkK=ATK;}/* 大蛇：同じフレームの同じ攻撃（ビーム・範囲）は1回だけ。別の武器は攻撃の番号でわける（#14 の点検）。体は頭と同じ id なので、当たり済みの印も1つ（#13 の点検） */
  amt*=1+e.vul+(e.son>0?e.sonV:0);/* ニードル砲の「もろさ」・音波砲 */
  if(e.shell)amt*=0.3;/* 岩やどり：岩をかぶっている間は30% */
  if(e.kind==='guard'){const kl=Math.hypot(kx,ky);if(kl>1e-3&&(kx*Math.cos(e.fa)+ky*Math.sin(e.fa))/kl<-0.35){amt*=0.3;/* 盾持ち：前からは30% */
    if(Math.random()<0.25)spark(e.x+Math.cos(e.fa)*15,e.y+Math.sin(e.fa)*15,'#ffe0a8','y');SFX.play('block');}}
  if(R.cs.crit>0&&Math.random()<R.cs.crit){amt*=R.cs.critD;spark(e.x,e.y-e.r*0.5,'#fff2a8','y');}/* 会心 */
  e.hp-=amt;e.flash=0.07;SFX.play('hit');
  const kb=KIND[e.kind].kb,res=(kb!=null?kb:1)*R.cs.knock;e.kx+=kx*res;e.ky+=ky*res;
  if(e.hp<=0){e.dead=true;killed(e);}
  else if(R.cs.exec>0&&e.kind!=='boss'&&e.hp<=e.max*R.cs.exec){e.hp=0;e.dead=true;killed(e);}/* とどめ（#12）：小さい敵は体力が線より下で一撃 */
}
function blast(x,y,rad,dmg,kb,cols){let n=0;
  near(x,y,rad,e=>{const dx=e.x-x,dy=e.y-y,d=Math.hypot(dx,dy)||1;if(d<=rad+e.r){hit(e,dmg,dx/d*kb,dy/d*kb);n++;}});
  if(R.sh.bomb)ebClear(x,y,rad,'#ffe0b0',true);/* ボマーの爆風：小さい敵の弾も消える */
  ring(x,y,rad,cols);return n;
}
function addGem(x,y,v,big,vx,vy){if(R.G.length>320){gainXp(v);return;}R.G.push({x,y,v,big,vx:vx||0,vy:vy||0,dead:false,pull:false,sp:70*U});}
/* 最終ボスをたおした：敵と弾が消え、2.6秒の爆発のあとクリア */
function winStart(e){R.winT=2.6;R.winX=e.x;R.winY=e.y;R.inv=3;for(const o of R.E)if(!o.dead&&o!==e){o.dead=true;addX(o.x,o.y,EXPL.m,0.5);}for(const b of R.EB)b.dead=true;R.LZ.length=0;
  showBanner('深淵の核をたおした！');SFX.play('bossin2');BGM.play(null);}
function killed(e){
  const k=KIND[e.kind];
  if(k.trap){rockBreak(e,true);return;}/* 岩：お金だけ（撃破・経験値には数えない） */
  R.kills++;
  if(HSRC)R.meleeK++;gaugeAdd(SPG.kill[e.kind]||0);
  if(e.kind==='boss'&&R.t-e.born<=30)R.fastBoss++;
  const ak=e.art||e.kind;R.kE[ak]=(R.kE[ak]||0)+1;R.seenE[ak]=1;
  if(e.kind==='boss'){R.CH.push({x:clamp(e.x,30,GW-30),y:e.y,vy:-60,t:0,dead:false,pull:false,sp:70*U});if(R.hurtN===e.hn)R.nodmg=(R.nodmg||0)+1;}/* #12：宝箱・ノーダメージ */
  if(e.kind==='boss'){for(let i=0;i<10;i++)addGem(e.x+rand(-30,30),e.y+rand(-20,20),3,true,rand(-68,68),rand(-68,27));R.bossKills++;showBanner('大型の敵をたおした');SFX.play('boss');if(!e.final&&!R.E.some(o=>o!==e&&!o.dead&&o.kind==='boss'))BGM.play('st'+R.stg);
    addX(e.x,e.y,EXPL.b,0.8);for(let i=0;i<5;i++)addX(e.x+rand(-60,60),e.y+rand(-45,45),EXPL.m,rand(0.4,0.7));}
  else{SFX.play('kill');addGem(e.x,e.y,k.xp*(e.reapNow?1.2:1),k.xp>=3);/* 大鎌で倒すと経験値＋20% */addX(e.x,e.y,k.xp<=1?EXPL.s:EXPL.m,k.xp<=1?0.36:0.5);}
  burst(e.x,e.y,k.burst||8,k.col);
  if(e.kind==='splitter'){SFX.play('split');for(const s of [-1,1]){const c=addEnemy('shard',e.x+s*9,e.y);c.kx=s*110*U;c.ky=-30*U;}}/* 割れ氷：2つに分かれる */
  if(e.segs)for(const s of e.segs){if(s.dead)continue;s.dead=true;addX(s.x,s.y,EXPL.m,rand(0.4,0.7));burst(s.x,s.y,10,k.col);}
  if(e.final)winStart(e);
  if(e.frz>R.t&&e.zn)zeroShards(e);/* 絶対零度で止めた敵：氷の破片 */
}
function hurt(d){
  if(R.inv>0)return;
  if(R.spInv>0)return;/* 必殺技の間の無敵（要塞バリア・突撃） */
  if(R.bar){R.bar=false;R.barCd=Math.max(5,14-3*(R.sup.barrier-1));R.inv=0.6;burst(R.x,R.y,14,['#c4ffe3','#5dffb0','#ffffff']);SFX.play('barrier');return;}
  if(R.cs.evade>0&&Math.random()<R.cs.evade){R.inv=0.25;R.dodge=0.3;burst(R.x,R.y,6,['#e0e8ff','#ffffff']);SFX.play('evade');return;}/* 回避装置 */
  d*=R.cs.dmgIn;R.hurtN++;/* 鉄壁（#12）・ノーダメージの記録 */
  R.hp=Math.max(0,R.hp-d);R.inv=0.55*R.cs.ifr;R.hurtFx=0.18;SFX.play('hurt');burst(R.x,R.y,10,['#ff2d6f','#ffffff']);
  if(R.sh.graze){R.ghost=0.8;R.inv=Math.max(R.inv,0.8);}/* ファントム：被弾すると0.8秒すがたを消す */
  if(R.cs.frost>0)frostNova();
  if(R.hp<=0&&R.guts){R.guts=false;R.hp=1;R.inv=1.2;showBanner('がんばり：HP1 でたえた');}
  if(R.hp<=0&&R.revLeft>0){R.revLeft--;R.hp=Math.round(R.maxHp*0.5);R.inv=2;R.hurtFx=0;reviveFx();showBanner('復活装置で HP50% にもどった');}
  if(R.hp<=0&&R.labRev>0){R.labRev--;R.hp=Math.round(R.maxHp*0.5);R.inv=2;R.hurtFx=0;reviveFx();showBanner('予備の機体で HP50% にもどった');}/* 研究所 */
  if(R.hp>0&&R.hp<R.maxHp*0.3&&R.ebLeft>0&&R.ebT<=0){R.ebLeft--;R.ebT=3;R.inv=Math.max(R.inv,3);SFX.play('ebar');}/* 緊急バリア */
  return true;/* 当たった（霜の弾の遅さに使う） */
}
function gainXp(v){R.xp+=v*(1+0.1*R.pas.xp)*R.cs.xp*(R.sh.xp||1);while(R.xp>=R.need){R.xp-=R.need;R.lv++;R.need=xpNeed(R.lv);R.pending++;}}

/* update steps */
function movePlayer(dt){
  if(R.sp&&R.sp.lock)return;/* ヴァンガードの突撃の間 */
  const ox=R.x,oy=R.y;movePlayer0(dt);
  if(R.sh.focus){const v=Math.hypot(R.x-ox,R.y-oy)/Math.max(dt,1e-4);R.focus=clamp(R.focus+(v<40*U?dt/1.5:-dt*3),0,1);}/* 集中：止まって1.5秒で最大 */
}
function movePlayer0(dt){
  const spd=185*U*R.sh.spd*(1+0.12*R.pas.speed+R.bonus.speed)*R.cs.spd*backK()*(R.chill>0?0.72:1)*(1-0.12*(R.snow||0));let kx=0,ky=0;/* 霜の弾・吹雪（#13） */
  if(keys.has('ArrowLeft')||keys.has('a'))kx-=1;if(keys.has('ArrowRight')||keys.has('d'))kx+=1;
  if(keys.has('ArrowUp')||keys.has('w'))ky-=1;if(keys.has('ArrowDown')||keys.has('s'))ky+=1;
  if(kx||ky){const l=Math.hypot(kx,ky);R.x+=kx/l*spd*dt;R.y+=ky/l*spd*dt;}
  else if(R.target){const dx=R.target.x-R.x,dy=R.target.y-R.y,d=Math.hypot(dx,dy),st=spd*1.25*dt;
    if(d<=st){R.x=R.target.x;R.y=R.target.y;}else{R.x+=dx/d*st;R.y+=dy/d*st;}}
  R.x=clamp(R.x,PMX,GW-PMX);R.y=clamp(R.y,PMY,GH-PMY);
}
const PMX=26,PMY=34;/* 自機が画面のはしで止まる位置 */
function shootAt(e,spd,off,big){spd*=U;const a=Math.atan2(R.y-e.y,R.x-e.x)+off,b={x:e.x,y:e.y+e.r*0.6,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,dmg:8,big:!!big,dead:false};R.EB.push(b);return b;}
/* 決まった向きに撃つ・輪・扇（#13 の大型の敵） */
function ebAt(x,y,a,spd,big,slow){spd*=U;const b={x,y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,dmg:big?10:8,big:!!big,dead:false};if(slow)b.slow=1;R.EB.push(b);return b;}
const aimA=(x,y)=>Math.atan2(R.y-y,R.x-x);
function ringAt(x,y,n,spd,off,big,slow){for(let i=0;i<n;i++)ebAt(x,y,off+i*TAU/n,spd,big,slow);}
function fanAt(x,y,n,gap,spd,big,slow){const a=aimA(x,y);for(let i=0;i<n;i++)ebAt(x,y,a+(i-(n-1)/2)*gap,spd,big,slow);}
function moveEnemies(dt){
  if(R.tstop>0){for(const e of R.E)if(e.flash>0)e.flash-=dt;return;}/* 時間停止（#12）：動かず撃たない */
  const damp=Math.pow(0.03,dt),lerp=Math.min(1,dt*3);
  for(const e of R.E){
    if(e.flash>0)e.flash-=dt;
    let sf=1;if(e.slow>0){sf=e.kind==='boss'?Math.max(0.6,e.slowF):e.slowF;e.slow-=dt;if(e.slow<=0)e.slowF=1;}
    if(e.son>0){e.son-=dt;if(e.son<=0)e.sonV=0;}
    if(e.stun>0){e.stun-=dt;sf=0;}/* 気絶・停止：動かず撃たない */
    if(e.frz>R.t)sf=0;/* 絶対零度：止まる */
    if(e.part)continue;/* 大蛇の体：あとで頭のあとにならべる */
    const dx=R.x-e.x,dy=R.y-e.y,d=Math.hypot(dx,dy)||1;let tx=0,ty=0;
    if(e.kind==='bug'){tx=dx/d*e.spd;ty=dy/d*e.spd;}
    else if(e.kind==='tank'){tx=dx/d*e.spd*0.6;ty=dy/d*e.spd*0.6+e.spd*0.5;}
    else if(e.kind==='shooter'){
      if(e.y<e.stopY)ty=e.spd*1.6;else{tx=Math.sin(R.t*1.3+e.id)*32*U;ty=7*U;}
      e.fire-=dt*sf;if(e.fire<=0&&e.y>0&&e.y<GH){e.fire=rand(2,3);shootAt(e,92,0);}
    }else if(e.kind==='boss'&&!(BIG[e.bt]&&BIG[e.bt].ai)){
      tx=clamp(dx*0.6,-e.spd*1.5,e.spd*1.5);ty=(GH*0.2-e.y)*0.8;
      e.fire-=dt*sf;if(e.fire<=0){e.fire=2.4;for(let k=-2;k<=2;k++)shootAt(e,85,k*0.28,true);}
    }else{TX=0;TY=0;(e.kind==='boss'?BIG[e.bt].ai:AI[e.kind])(e,dt,sf,dx,dy,d);tx=TX;ty=TY;}
    tx*=sf*R.cs.eSpd*R.snowK;ty*=sf*R.cs.eSpd*R.snowK;/* 時の加速（#12）・吹雪（#13） */
    e.vx+=(tx-e.vx)*lerp;e.vy+=(ty-e.vy)*lerp;e.kx*=damp;e.ky*=damp;if(e.stun>0||e.frz>R.t){e.vx=0;e.vy=0;}
    e.x+=(e.vx+e.kx)*dt;e.y+=(e.vy+e.ky)*dt;
    if(e.y>GH+105||e.y<-210||e.x<-150||e.x>GW+150)e.dead=true;
  }
  for(const e of R.E)if(e.segs&&!e.dead)segFollow(e);
}

/* ---------- ステージ2〜5の敵の動き（#13）。TX・TY に行きたい速さを入れる ---------- */
let TX=0,TY=0;
const ebFull=()=>R.EB.length>220;/* 敵の弾が多すぎるときは、小さい敵は撃たない（見やすさと重さ） */
const AI={
  /* 岩やどり：岩をかぶってゆっくり下りる → 近くで岩をすてて速く追う */
  hider(e,dt,sf,dx,dy,d){if(e.shell){TX=dx/d*e.spd*0.35;TY=e.spd*0.75;if(d<150||R.t-e.born>10){e.shell=0;e.sp=null;e.spd*=2.4;burst(e.x,e.y,10,ROCKC);SFX.play('crack');}}
    else{TX=dx/d*e.spd;TY=dy/d*e.spd;}},
  /* 角突き：下りる → 0.75秒止まってねらう（さいごの0.25秒は向きを変えない）→ まっすぐ突進 */
  charger(e,dt,sf,dx,dy,d){
    if(e.st===2){TX=e.ax*e.spd*7;TY=e.ay*e.spd*7;}
    else if(e.st===1){if(e.tm>0.25){e.ax=dx/d;e.ay=dy/d;e.sp=R8.charger[dir8(Math.atan2(dy,dx))];}e.tm-=dt*sf;if(e.tm<=0){e.st=2;SFX.play('dash');}}
    else{TX=dx/d*e.spd*0.3;TY=e.spd*1.5;if(e.y>=e.stopY){e.st=1;e.tm=0.75;}}},
  /* 霜の撃ち手：撃ち手と同じ動きで、遅くなる弾（2:30 から3つ） */
  frost(e,dt,sf){if(e.y<e.stopY)TY=e.spd*1.6;else{TX=Math.sin(R.t*1.1+e.id)*30*U;TY=6*U;}
    e.fire-=dt*sf;if(e.fire<=0&&e.y>0&&e.y<GH){e.fire=rand(2.6,3.4);if(ebFull())return;const n=R.t>=150?2:1;for(let k=0;k<n;k++)shootAt(e,80,(k-(n-1)/2)*0.3).slow=1;}},
  splitter(e,dt,sf,dx,dy,d){TX=dx/d*e.spd*0.8;TY=dy/d*e.spd*0.8+e.spd*0.3;},
  shard(e,dt,sf,dx,dy,d){TX=dx/d*e.spd;TY=dy/d*e.spd;},
  /* 砲台：床と流れる。砲身は自機へ少しずつ向き、3連の弾 */
  turret(e,dt,sf,dx,dy){TY=R.floorV||30;e.kx=0;e.ky=0;e.fa+=clamp(angDiff(Math.atan2(dy,dx),e.fa),-2*dt*sf,2*dt*sf);
    e.fire-=dt*sf;if(e.fire<=0&&e.y>10&&e.y<GH-40){e.fire=2.8;e.bn=3;e.bt2=0;}
    if(e.bn>0){e.bt2-=dt*sf;if(e.bt2<=0){e.bn--;e.bt2=0.14;if(!ebFull())ebAt(e.x+Math.cos(e.fa)*18,e.y+Math.sin(e.fa)*18,e.fa,88);}}},
  /* 盾持ち：ゆっくり近づき、盾を自機に向ける */
  guard(e,dt,sf,dx,dy,d){TX=dx/d*e.spd*0.7;TY=dy/d*e.spd*0.7+e.spd*0.25;e.fa+=clamp(angDiff(Math.atan2(dy,dx),e.fa),-1.4*dt*sf,1.4*dt*sf);e.sp=R8.guard[dir8(e.fa)];},
  /* まぼろし：近づく → ゆらぐ（0.4秒）→ 消える（0.6秒・出る所に印）→ あらわれて3発 */
  warp(e,dt,sf,dx,dy,d){e.tm-=dt*sf;
    if(e.st===0){TX=dx/d*e.spd*0.6;TY=dy/d*e.spd*0.6;if(e.tm<=0){e.st=1;e.tm=0.4;}}
    else if(e.st===1){if(e.tm<=0){e.st=2;e.tm=0.6;e.hide=1;const a=rand(0,TAU),r=rand(130,190);
      e.x=clamp(R.x+Math.cos(a)*r,30,GW-30);e.y=clamp(R.y+Math.sin(a)*r,40,GH-60);e.vx=e.vy=e.kx=e.ky=0;SFX.play('warp');}}
    else if(e.st===2){e.vx=e.vy=0;if(e.tm<=0){e.st=3;e.hide=0;e.tm=0.35;burst(e.x,e.y,8,KIND.warp.col);}}
    else if(e.tm<=0){e.st=0;e.tm=rand(2.4,3.2);if(!ebFull())for(let k=-1;k<=1;k++)shootAt(e,82,k*0.25);}},
  rock(e){TX=e.v0x;TY=e.v0y;},
  seg(){},
};
/* 大蛇の体：頭の通った道にならべる（頭から26ドットごと）。体の体力は頭と同じに見せる */
function segFollow(h){const T=h.trail,last=T[T.length-1];
  if(!last||Math.hypot(h.x-last[0],h.y-last[1])>=3){T.push([h.x,h.y]);if(T.length>200)T.shift();}
  h.segs.forEach((s,i)=>{const k=Math.max(0,T.length-1-Math.round((i+1)*26/3)),q=T[k];s.x=q[0];s.y=q[1];s.hp=h.hp;s.max=h.max;s.vx=s.vy=0;});}
/* 大型の敵の動きの共通：上の方にとどまり、自機の横に少しついてくる */
function hover(e,y,k){TX=clamp((R.x-e.x)*k,-e.spd*1.5,e.spd*1.5);TY=(y-e.y)*0.8;}
const BIG={
  boss:{hp:1,r:54},boss2:{hp:1,r:54},
  /* 岩喰い：口から岩を投げる → 3方向の弾。4回に1回は上から岩がふる */
  gnaw:{hp:1,r:52,ai(e,dt,sf){hover(e,GH*0.2,0.5);e.fire-=dt*sf;
    if(e.fire<=0){e.cy++;if(e.cy%4===0){for(let i=0;i<5;i++)addRock(rand(30,GW-30),-20-rand(0,80),i%3?0:1,Math.PI/2+rand(-0.12,0.12),rand(75,100));e.fire=3;}
      else{addRock(e.x,e.y+24,1,aimA(e.x,e.y+24),95);e.fire=2.6;e.q=0.6;SFX.play('crack');}}
    if(e.q>0){e.q-=dt*sf;if(e.q<=0)fanAt(e.x,e.y+24,3,0.24,88,false);}}},
  /* 双頭の岩喰い：左の頭は岩、右の頭は5方向の弾。3回に1回は両方の頭から輪 */
  gnaw2:{hp:1.2,r:56,ai(e,dt,sf){hover(e,GH*0.2,0.45);e.fire-=dt*sf;
    if(e.fire<=0){e.cy++;const hy=e.y+34;
      if(e.cy%3===0){ringAt(e.x-40,hy,10,70,e.cy*0.2,false);ringAt(e.x+40,hy,10,70,e.cy*0.2+0.3,false);e.fire=2.6;}
      else if(e.cy%2){addRock(e.x-40,hy,1,aimA(e.x-40,hy),105);SFX.play('crack');e.fire=1.8;}
      else{fanAt(e.x+40,hy,5,0.22,90,true);e.fire=1.8;}}}},
  /* 氷晶獣：12発の輪 → 3回に1回は遅くなる弾3つと、氷のかけら2つ */
  icebeast:{hp:1,r:52,ai(e,dt,sf){hover(e,GH*0.22,0.4);e.fire-=dt*sf;
    if(e.fire<=0){e.cy++;
      if(e.cy%3===0){fanAt(e.x,e.y+40,3,0.2,95,true,true);for(const s of [-1,1])addEnemy('shard',e.x+s*60,e.y+20);e.fire=2.2;}
      else{ringAt(e.x,e.y+20,12,72,e.cy*0.26,false);e.fire=2.2;}}}},
  /* 氷の女王：3本のうずまき（2.4秒）→ 遅くなる弾を5方向と、かけら3つ */
  icequeen:{hp:1.25,r:56,init(e){e.st=0;e.tm=1.5;e.sa=0;e.q=0;},ai(e,dt,sf){hover(e,GH*0.2,0.35);e.tm-=dt*sf;
    if(e.st===1){e.q-=dt*sf;e.sa+=2.1*dt*sf;if(e.q<=0){e.q=0.12;for(let i=0;i<3;i++)ebAt(e.x,e.y+6,e.sa+i*TAU/3,78,false);}}
    if(e.tm<=0){e.st=(e.st+1)%4;
      if(e.st===1)e.tm=2.4;
      else if(e.st===2){e.tm=0.6;}
      else if(e.st===3){fanAt(e.x,e.y+30,5,0.2,92,true,true);for(let i=0;i<3;i++)addEnemy('shard',e.x+(i-1)*50,e.y+40);e.tm=1.4;}
      else e.tm=0.8;}}},
  /* 要塞砲台：左右の砲から3連・まん中の砲から7方向・9秒ごとにレーザーの壁 */
  fort:{hp:1,r:58,init(e){e.lz=6;e.side=1.2;e.bn=0;},ai(e,dt,sf){TX=Math.sin(R.t*0.5)*e.spd*0.9;TY=(GH*0.16-e.y)*0.8;
    e.fire-=dt*sf;e.side-=dt*sf;e.lz-=dt*sf;
    if(e.side<=0){e.side=2.1;e.bn=3;e.bt2=0;e.sx=(e.sx||1)*-1;}
    if(e.bn>0){e.bt2-=dt*sf;if(e.bt2<=0){e.bn--;e.bt2=0.15;const x=e.x+e.sx*47,y=e.y+54;ebAt(x,y,aimA(x,y),95,false);}}
    if(e.fire<=0){e.fire=4.2;fanAt(e.x,e.y+60,7,0.2,80,true);}
    if(e.lz<=0&&e.y>0){e.lz=9;const v=Math.random()<0.5;addWall(v,v?clamp(R.x,40,GW-40):clamp(R.y,GH*0.35,GH-40));}}},/* 自機のいる列か行をねらう */
  /* 機械の大蛇：画面をくねくね回る。体のあちこちから弾・頭から5方向 */
  snake:{hp:1,r:34,init(e){e.trail=[];e.hd=Math.PI/2;e.segs=[];
      for(let i=10;i>=0;i--){const s=addEnemy('seg',e.x,e.y-(i+1)*26);s.link=e;s.id=e.id;s.sp=i===10?ESPR.segt:null;if(i===10)s.r=14;e.segs[i]=s;}/* しっぽから先に描く */
      R.E.splice(R.E.indexOf(e),1);R.E.push(e);e.fire=2;e.q=4;},
    ai(e,dt,sf){const px=GW/2+Math.sin(R.t*0.55)*GW*0.36,py=e.y<GH*0.15?GH*0.4:GH*0.36+Math.sin(R.t*0.83+1)*GH*0.24;
      e.hd+=clamp(angDiff(Math.atan2(py-e.y,px-e.x),e.hd),-1.8*dt*sf,1.8*dt*sf);const v=e.spd*3;TX=Math.cos(e.hd)*v;TY=Math.sin(e.hd)*v;e.sp=R8.snake[dir8(e.hd)];
      e.fire-=dt*sf;e.q-=dt*sf;
      if(e.fire<=0){e.fire=2.4;for(let i=0;i<3;i++){const s=e.segs[(Math.random()*e.segs.length)|0];if(s.y>0&&s.y<GH)ebAt(s.x,s.y,aimA(s.x,s.y),80,false);}}
      if(e.q<=0){e.q=5.5;fanAt(e.x+Math.cos(e.hd)*30,e.y+Math.sin(e.hd)*30,5,0.22,95,true);}}},
  /* 深淵の核（最終ボス）：体力で3段階。1＝2本のうずまき・2＝輪と手下とレーザーの壁・3＝3本の速いうずまき */
  core:{hp:2.6,r:62,final:1,init(e){e.ph=1;e.st=0;e.tm=2;e.sa=0;e.q=0;e.oa=0;e.sum=6;e.lz=5;e.of=1.6;},
    ai(e,dt,sf){TX=clamp((R.x-e.x)*0.15,-e.spd,e.spd);TY=(GH*0.27-e.y)*0.6;e.oa+=0.8*dt*sf;
      const ph=e.hp>e.max*0.66?1:e.hp>e.max*0.33?2:3;if(ph!==e.ph){e.ph=ph;e.st=0;e.tm=1.2;SFX.play('bossin');burst(e.x,e.y,40,KIND.warp.col);}
      e.tm-=dt*sf;e.q-=dt*sf;
      if(ph===1){if(e.st===0){e.sa+=1.9*dt*sf;if(e.q<=0){e.q=0.1;ebAt(e.x,e.y,e.sa,74,false);ebAt(e.x,e.y,e.sa+Math.PI,74,false);}if(e.tm<=0){e.st=1;e.tm=1.1;}}
        else if(e.tm<=0){fanAt(e.x,e.y+40,7,0.17,95,true);e.st=0;e.tm=3;}}
      else if(ph===2){if(e.q<=0){e.q=1.15;e.cy++;ringAt(e.x,e.y,16,70,e.cy%2?TAU/32:0,false);}
        e.sum-=dt*sf;if(e.sum<=0){e.sum=6;['warp','charger','frost'].forEach((k,i)=>addEnemy(k,e.x+(i-1)*90,e.y+60));}
        e.lz-=dt*sf;if(e.lz<=0){e.lz=7;randWall();randWall(true);}}
      else{e.sa-=2.6*dt*sf;if(e.q<=0){e.q=0.11;for(let i=0;i<3;i++)ebAt(e.x,e.y,e.sa+i*TAU/3,84,false);}
        if(e.tm<=0){e.tm=2.2;fanAt(e.x,e.y+40,3,0.25,100,true);}
        e.of-=dt*sf;if(e.of<=0){e.of=1.6;for(let i=0;i<6;i++){const a=e.oa+i*TAU/6;ebAt(e.x+Math.cos(a)*96,e.y+Math.sin(a)*96,a,70,false);}}}}},
};
function separate(){/* near と同じ順でマスを見る（#34：敵ごとに関数を作らない） */
  for(const e of R.E){if(e.dead||e.kind==='boss'||KIND[e.kind].fixed||e.kind==='rock')continue;ATK++;
    const rr=e.r+13.5+gMaxR+2;
    const x0=clamp(Math.floor((e.x-rr+PADG)/CELL),0,gCols-1),x1=clamp(Math.floor((e.x+rr+PADG)/CELL),0,gCols-1);
    const y0=clamp(Math.floor((e.y-rr+PADG)/CELL),0,gRows-1),y1=clamp(Math.floor((e.y+rr+PADG)/CELL),0,gRows-1);
    for(let cy=y0;cy<=y1;cy++)for(let cx=x0;cx<=x1;cx++){const cell=grid[cy*gCols+cx];
      for(let i=0;i<cell.length;i++){const o=cell[i];if(o.dead||o===e)continue;const dx=e.x-o.x,dy=e.y-o.y,md=e.r+o.r-1.5,d2=dx*dx+dy*dy;
        if(d2>0.0001&&d2<md*md){const d=Math.sqrt(d2),p=(md-d)*0.35;e.x+=dx/d*p;e.y+=dy/d*p;}}}}
}
const modPos=m=>[R.x+SLOTS[m.slot].x+(m.cx||0),R.y+SLOTS[m.slot].y+(m.cy||0)];/* cx・cy＝ファントムの分身のずれ */
function nearest(x,y,maxD){let best=null,bd=maxD*maxD;for(const e of R.E){if(e.dead||e.hide||e.y<-6)continue;const dx=e.x-x,dy=e.y-y,d=dx*dx+dy*dy;if(d<bd){bd=d;best=e;}}return best;}
/* bullet kinds: 0 laser, 1 ally, 2 flame, 3 freeze, 4 reflected, 5 gatling, 6 pellet */
function mkB(x,y,vx,vy,dmg,pierce,k,extra){const b={x,y,vx,vy,dmg,pierce:pierce||0,hits:pierce>0?new Set():null,k:k||0,dead:false};return extra?Object.assign(b,extra):b;}
function jag(pts){
  const out=[pts[0]];
  for(let i=1;i<pts.length;i++){const [ax,ay]=pts[i-1],[bx,by]=pts[i],dx=bx-ax,dy=by-ay,l=Math.hypot(dx,dy)||1,nx=-dy/l,ny=dx/l;
    for(let k=1;k<4;k++){const o=rand(-7.5,7.5);out.push([ax+dx*k/4+nx*o,ay+dy*k/4+ny*o]);}out.push(pts[i]);}
  return out;
}
const FIRE={
  laser(m,st,ox,oy,ux,uy){for(let k=0;k<st.n;k++){const off=(k-(st.n-1)/2)*6;R.B.push(mkB(ox+ux*14-uy*off,oy+uy*14+ux*off,ux*st.spd,uy*st.spd,st.dmg,st.pierce,0));}},
  gatling(m,st,ox,oy,ux,uy){const base=Math.atan2(uy,ux);for(let k=0;k<st.n;k++){const a=base+rand(-st.spread,st.spread),off=(k-(st.n-1)/2)*8;
    R.B.push(mkB(ox+ux*14-uy*off,oy+uy*14+ux*off,Math.cos(a)*st.spd,Math.sin(a)*st.spd,st.dmg,st.pierce,5,{kb:0.06}));}},
  mine(m,st,ox,oy,ux,uy){const base=Math.atan2(uy,ux);for(let k=0;k<st.n;k++){const a=base+(k-(st.n-1)/2)*0.5;
    R.MN.push({x:ox+ux*9,y:oy+uy*9,vx:Math.cos(a)*95*U,vy:Math.sin(a)*95*U,t:0,dmg:st.dmg,rad:st.rad,life:st.life,dead:false});}},
  shotgun(m,st,ox,oy,ux,uy){const base=Math.atan2(uy,ux);for(let k=0;k<st.n;k++){const a=base+(k/(st.n-1)-0.5)*st.cone+rand(-0.04,0.04),v=st.spd*rand(0.88,1.1);
    R.B.push(mkB(ox+ux*12,oy+uy*12,Math.cos(a)*v,Math.sin(a)*v,st.dmg,st.pierce,6,{life:st.life,kb:0.35}));}},
  freeze(m,st,ox,oy,ux,uy){for(let k=0;k<st.n;k++){const off=(k-(st.n-1)/2)*9;
    R.B.push(mkB(ox+ux*14-uy*off,oy+uy*14+ux*off,ux*st.spd,uy*st.spd,st.dmg,st.pierce,3,{slowT:st.slowT,slowF:st.slowF}));}},
  missile(m,st,ox,oy,ux,uy){const a=Math.atan2(uy,ux);for(let k=0;k<st.n;k++){const off=(k-(st.n-1)/2)*0.4;
    R.M.push({x:ox+ux*9,y:oy+uy*9,a:a+off,spd:100*U,dmg:st.dmg,rad:st.rad,target:null,life:st.life,tr:0,dead:false});}},
  flame(m,st,ox,oy,ux,uy){for(let k=0;k<st.n;k++){const a=Math.atan2(uy,ux)+rand(-st.spread,st.spread),v=st.spd*rand(0.85,1.15);
    R.B.push(mkB(ox+ux*12,oy+uy*12,Math.cos(a)*v,Math.sin(a)*v,st.dmg,999,2,{life:st.life,max:st.life,kb:0.02}));}},
  sword(m,st,ox,oy,ux,uy){const a=Math.atan2(uy,ux);
    R.S.push({m,t:0,dur:st.dur,a,sweep:st.sweep,range:st.range,dmg:st.dmg,hits:new Set(),done:false,dead:false});
    if(st.twice)R.S.push({m,t:-0.18,dur:st.dur,a,sweep:st.sweep,range:st.range,dmg:st.dmg,hits:new Set(),done:false,dead:false});},
  saw(m,st,ox,oy,ux,uy){const base=Math.atan2(uy,ux);for(let k=0;k<st.n;k++){const a=base+(k-(st.n-1)/2)*0.45;
    R.W.push({m,x:ox,y:oy,ux:Math.cos(a),uy:Math.sin(a),t:0,v0:st.v0,r:st.r,big:st.big,dmg:st.dmg,hits:new Map(),dead:false});}},
  thunder(m,st,ox,oy,ux,uy){
    const base=Math.atan2(uy,ux);let best=null,bd=st.range*st.range;
    for(const e of R.E){if(e.dead||e.hide||e.y<-4)continue;const dx=e.x-ox,dy=e.y-oy,d=dx*dx+dy*dy;if(d>=bd)continue;if(Math.abs(angDiff(Math.atan2(dy,dx),base))>1.15)continue;bd=d;best=e;}
    if(!best)return false;
    const chain=[best],pts=[[ox,oy],[best.x,best.y]];let cur=best;
    for(let i=0;i<st.chain;i++){let nx=null,nd=108*108;
      for(const e of R.E){if(e.dead||e.hide||chain.includes(e))continue;const dx=e.x-cur.x,dy=e.y-cur.y,d=dx*dx+dy*dy;if(d<nd){nd=d;nx=e;}}
      if(!nx)break;chain.push(nx);pts.push([nx.x,nx.y]);cur=nx;}
    chain.forEach(e=>hit(e,st.dmg,0,0));
    R.Z.push({poly:jag(pts),t:0,dead:false});
  },
  gravity(m,st,ox,oy,ux,uy){R.GV.push({x:ox+ux*12,y:oy+uy*12,vx:ux*85*U,vy:uy*85*U,t:0,life:st.life,r:st.r,dmg:st.dmg,tick:0,boom:st.boom,dead:false});},
  cannon(m,st,ox,oy,ux,uy){
    const sx=ox+ux*15,sy=oy+uy*15;
    for(const e of R.E){if(e.dead)continue;const dx=e.x-sx,dy=e.y-sy,pr=dx*ux+dy*uy;if(pr<-e.r||pr>st.len)continue;
      if(Math.abs(dx*uy-dy*ux)<=st.w/2+e.r)hit(e,st.dmg,ux*90,uy*90);}
    for(const b of R.EB){const dx=b.x-sx,dy=b.y-sy,pr=dx*ux+dy*uy;if(pr>=0&&pr<=st.len&&Math.abs(dx*uy-dy*ux)<=st.w/2+4.5)ebGone(b,'#e0fffb','w');}
    R.L.push({x:sx,y:sy,ux,uy,w:st.w,len:st.len,t:0,dead:false});
  },
};
function fire(dt){fireList(R.mods,dt);if(R.cmods.length)fireList(R.cmods,dt);}
function fireList(list,dt){
  for(const m of list){
    const ev=R.evo[m.t]&&EFIRE[m.t],f=ev||FIRE[m.t];if(!f)continue;
    R.fm=R.sh.front&&SLOTS[m.slot].front?R.sh.front:1;HSRC=isMelee(m.t)?1:0;ATK++;
    const st=stat(m.t);
    if(m.bq>0&&!ev){m.bt-=dt;if(m.bt<=0){m.bq--;m.bt=st.gap;const [bx,by]=modPos(m),ba=dirAngle(m.d);BURST[m.t](m,st,bx,by,Math.cos(ba),Math.sin(ba));}}
    m.cd-=dt;if(m.cd>0)continue;ATK++;
    const [ox,oy]=modPos(m),a=dirAngle(m.d);
    const ok=f(m,st,ox,oy,Math.cos(a),Math.sin(a))!==false;m.cd=ok?st.cd:0.15;if(ok)SFX.shot(ev?EVO[m.t].id:m.t);
  }
  R.fm=1;HSRC=0;
}
