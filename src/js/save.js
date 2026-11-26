/* ---------- save ---------- */
/* 持っている装備は全機体で共通（数を持つ形：どの機体も、持っている数までつけられる）。つけ方は機体ごとに覚える */
const KEY='shoot-proto-v1';
const emptyLoad=id=>SHIPS[id].slots.map(()=>null);
const startLoad=id=>{const l=emptyLoad(id);SHIPS[id].start.forEach(v=>{l[v.s]={t:v.t,d:v.d};});return l;};
/* 新しいセーブ（#15）：レーザーを1つだけ持ち、どの機体の場所も空き（はじめの案内でつける）。SHIPS.standard.start は前の版のセーブとテストで使う */
function freshSave(){const owned={};TYPES.forEach(t=>{owned[t]=0;});owned.laser=1;
  const ships={};SHIP_IDS.forEach(id=>{ships[id]={have:id==='standard',eq:emptyLoad(id)};});
  const lab={};LAB.forEach(o=>{lab[o.id]=0;});
  const s={v:2,gold:300,owned,ships,cur:'standard',best:null,evo:{},lab,ach:{},book:{e:{}},st:1,unl:[],lunl:[],talk:{lab:0},rec:{clears:0,bosses:0,goldTotal:0,wmax:{},sup5:[],cw:{},...REC0()}};
  ensureSlots(s);return s;}
/* #15 の解放の記録：出撃の回数（runs）・その品をつけてクリアした回数（cw：種類ごと）。大型の敵の種類ごとのたおした数は図鑑の book.e を使う
   #11 の解放の記録：大型の敵を30秒以内にたおした数・1出撃の撃破数の最高・HP半分以上でクリアした数・近接での撃破の合計・進化の回数・クリアしたステージ
   #12 の実績の記録：撃破の合計・1出撃の最高レベル・ひらいた宝箱・必殺技の回数・1出撃の特別な強化の最高・ノーダメージでたおした大型の敵 */
const REC0=()=>({fastBoss:0,bestKills:0,halfClear:0,meleeK:0,evos:0,stageMax:0,kills:0,bestLv:0,chests:0,spTotal:0,bestSpc:0,nodmg:0,time:0,runs:0});/* time＝出撃した時間の合計（#13・エンディングの記録）・runs＝出撃の回数（#15） */
/* 研究所の「増設」：全機体の後ろ（いちばん後ろの場所より13下）に場所を1つ足す。装備の配列の長さもそろえる */
const XSLOT={};
function ensureSlots(s){const on=!!(s&&s.lab&&s.lab.r_slot>0);
  SHIP_IDS.forEach(id=>{const sl=SHIPS[id].slots,has=sl.length&&sl[sl.length-1].x12;
    if(on&&!has){if(!XSLOT[id]){const y=Math.max(...sl.map(v=>v.y))+13;XSLOT[id]=Object.assign(SL('増設',0,y,4),{x12:1});}sl.push(XSLOT[id]);}
    if(!on&&has)sl.pop();
    if(s&&s.ships&&s.ships[id]){const eq=s.ships[id].eq;while(eq.length<sl.length)eq.push(null);if(eq.length>sl.length)eq.length=sl.length;}});}
/* 図鑑：装備（買ったことがある）・進化（1回でも進化させた）・機体（持っている）・敵（出撃で出会った） */
const BOOK_N=()=>TYPES.length+Object.keys(EVO).length+SHIP_IDS.length+BOOK_E.length;
const bookCount=s=>TYPES.filter(t=>s.owned[t]>0).length+Object.keys(EVO).filter(t=>s.evo[t]).length+SHIP_IDS.filter(id=>s.ships[id].have).length+BOOK_E.filter(b=>s.book.e[b.k]!=null).length;
/* 実績 24個。ごほうびは決まった G（運なし）。cur＝いまの数・n＝達成の数 */
const ACH=[
  {id:'clear1',name:'はじめてのクリア',desc:'ステージを1回クリアする',g:100,n:1,cur:s=>s.rec.clears},
  {id:'clear10',name:'歴戦',desc:'合計10回クリアする',g:500,n:10,cur:s=>s.rec.clears},
  {id:'half',name:'余裕の帰還',desc:'HPを半分以上のこしてクリアする',g:200,n:1,cur:s=>s.rec.halfClear},
  {id:'stage5',name:'深淵の先へ',desc:'ステージ5をクリアする',g:1000,n:5,cur:s=>s.rec.stageMax},
  {id:'kill1k',name:'千体',desc:'敵を合計1000体たおす',g:200,n:1000,cur:s=>s.rec.kills},
  {id:'kill10k',name:'一万体',desc:'敵を合計10000体たおす',g:600,n:10000,cur:s=>s.rec.kills},
  {id:'run1k',name:'嵐の出撃',desc:'1回の出撃で1000体たおす',g:400,n:1000,cur:s=>s.rec.bestKills},
  {id:'boss1',name:'大物退治',desc:'大型の敵をはじめてたおす',g:100,n:1,cur:s=>s.rec.bosses},
  {id:'boss20',name:'大物狩り',desc:'大型の敵を合計20体たおす',g:400,n:20,cur:s=>s.rec.bosses},
  {id:'nodmg',name:'無傷の勝利',desc:'ノーダメージで大型の敵をたおす',g:500,n:1,cur:s=>s.rec.nodmg},
  {id:'fast',name:'早業',desc:'大型の敵を、出てから30秒以内にたおす',g:300,n:1,cur:s=>s.rec.fastBoss},
  {id:'evo1',name:'はじめての進化',desc:'武器を1回進化させる',g:200,n:1,cur:s=>s.rec.evos},
  {id:'evo5',name:'進化の研究',desc:'5種類の武器を進化させる',g:600,n:5,cur:s=>Object.keys(EVO).filter(t=>s.evo[t]).length},
  {id:'wmax',name:'極めた武器',desc:'武器をレベル8にする',g:200,n:WMAX,cur:s=>Math.max(0,...Object.values(s.rec.wmax))},
  {id:'sup1',name:'支援の達人',desc:'支援を1つ最大レベルにする',g:200,n:1,cur:s=>s.rec.sup5.length},
  {id:'lv30',name:'熟練',desc:'1回の出撃でレベル30になる',g:300,n:30,cur:s=>s.rec.bestLv},
  {id:'spc3',name:'代償の覚悟',desc:'1回の出撃で特別な強化を3つ取る',g:300,n:3,cur:s=>s.rec.bestSpc},
  {id:'chest10',name:'宝探し',desc:'宝箱を合計10個ひらく',g:300,n:10,cur:s=>s.rec.chests},
  {id:'sp50',name:'必殺の使い手',desc:'必殺技を合計50回出す',g:300,n:50,cur:s=>s.rec.spTotal},
  {id:'ship3',name:'3機目',desc:'機体を3機手に入れる',g:200,n:3,cur:s=>SHIP_IDS.filter(id=>s.ships[id].have).length},
  {id:'shipAll',name:'全機そろい',desc:'全部の機体を手に入れる',g:1000,n:SHIP_IDS.length,cur:s=>SHIP_IDS.filter(id=>s.ships[id].have).length},
  {id:'lab10',name:'研究のはじまり',desc:'研究所で合計10回強化する',g:300,n:10,cur:s=>LAB.reduce((n,o)=>n+(s.lab[o.id]||0),0)},
  {id:'book50',name:'図鑑の半分',desc:'図鑑を50個うめる',g:400,n:50,cur:s=>bookCount(s)},
  {id:'gold10k',name:'大金持ち',desc:'出撃で合計10000Gかせぐ',g:300,n:10000,cur:s=>s.rec.goldTotal},
];
/* 条件を満たした実績に G をわたす（1回だけ）。わたした実績を返す */
function checkAch(){const got=[];for(const a of ACH){if(save.ach[a.id])continue;if(a.cur(save)>=a.n){save.ach[a.id]=1;save.gold+=a.g;got.push(a);}}if(got.length){persist();gcAch(got.map(a=>a.id));}return got;}/* 11/26 Game Center にも（gamecenter.js） */
const cleanLoad=(id,arr)=>SHIPS[id].slots.map((_,i)=>{const v=Array.isArray(arr)?arr[i]:null;return v&&MODS[v.t]&&Number.isInteger(v.d)&&v.d>=0&&v.d<8?{t:v.t,d:v.d}:null;});
function loadSave(){
  const s=freshSave();
  try{
    const raw=localStorage.getItem(KEY);
    if(raw){const o=JSON.parse(raw);
      if(o&&typeof o==='object'){
        if(Number.isFinite(o.gold))s.gold=Math.max(0,Math.floor(o.gold));
        /* #12：研究所・実績・図鑑（#11 までのセーブにはない → 0 のまま） */
        if(o.lab&&typeof o.lab==='object')LAB.forEach(L=>{if(Number.isFinite(o.lab[L.id]))s.lab[L.id]=clamp(Math.floor(o.lab[L.id]),0,L.max);});
        ensureSlots(s);
        if(o.ach&&typeof o.ach==='object')ACH.forEach(a=>{if(o.ach[a.id])s.ach[a.id]=1;});
        if(o.book&&o.book.e&&typeof o.book.e==='object')BOOK_E.forEach(b=>{const v=o.book.e[b.k];if(Number.isFinite(v))s.book.e[b.k]=Math.max(0,Math.floor(v));});
        if(o.owned)TYPES.forEach(t=>{if(Number.isFinite(o.owned[t]))s.owned[t]=clamp(Math.floor(o.owned[t]),0,99);});
        if(o.ships&&typeof o.ships==='object')SHIP_IDS.forEach(id=>{const v=o.ships[id];if(v&&typeof v==='object'){s.ships[id].have=id==='standard'||!!v.have;s.ships[id].eq=cleanLoad(id,v.eq);}});
        else if(Array.isArray(o.load))s.ships.standard.eq=cleanLoad('standard',o.load);   /* 試作4のセーブ：今の装備をスタンダード機へ */
        if(o.ships&&typeof o.ships==='object'&&!(o.owned&&typeof o.owned==='object'))TYPES.forEach(t=>{const n=Math.max(...SHIP_IDS.map(id=>s.ships[id].eq.filter(v=>v&&v.t===t).length));if(n>s.owned[t])s.owned[t]=n;});/* 機体ごとの装備はあって持ち物の記録がないセーブ：つけている数まで持っていることにする（#15 の点検） */
        if(Array.isArray(o.load)&&!(o.owned&&typeof o.owned==='object'))s.owned.laser=2;/* 試作4のセーブ（持ち物の記録なし）：そのころのはじめのレーザー2つ */
        if(SHIPS[o.cur]&&s.ships[o.cur].have)s.cur=o.cur;
        if(o.tut)s.tut=1;
        if(o.howto)s.howto=1;
        s.talk={lab:(o.talk&&typeof o.talk==='object'?o.talk.lab:Object.values(s.lab).some(v=>v>0))?1:0};/* 11/17：整備士のひとこと済み。talk のない前のセーブは、研究所を使っていれば済み */
        if(o.snd===false)s.snd=false;if(typeof o.bgm==='boolean')s.bgm=o.bgm;/* BGM の ON・OFF（なければ「音」と同じ） */
        if(Array.isArray(o.seen))s.seen=o.seen.filter(k=>SHIPS[k]);
        if(o.evo&&typeof o.evo==='object')for(const t in EVO)if(o.evo[t])s.evo[t]=1;/* 1回でも進化させた武器（ショップのくわしくに名前が出る） */
        if(o.best&&Number.isFinite(o.best.t))s.best={t:o.best.t,kills:o.best.kills|0,clear:!!o.best.clear};
        const r=o.rec;if(r&&typeof r==='object'){
          ['clears','bosses','goldTotal'].concat(Object.keys(REC0())).forEach(k=>{if(Number.isFinite(r[k]))s.rec[k]=Math.max(0,Math.floor(r[k]));});
          if(r.wmax)TYPES.forEach(t=>{if(Number.isFinite(r.wmax[t]))s.rec.wmax[t]=clamp(r.wmax[t]|0,0,WMAX);});
          if(r.cw&&typeof r.cw==='object')TYPES.forEach(t=>{if(Number.isFinite(r.cw[t])&&r.cw[t]>=1)s.rec.cw[t]=Math.floor(r.cw[t]);});
          if(Array.isArray(r.sup5))s.rec.sup5=r.sup5.filter(k=>SUP[k]).filter((k,i,a)=>a.indexOf(k)===i);}
        if(!(r&&Number.isFinite(r.evos)))s.rec.evos=Object.keys(s.evo).length;/* #10 までのセーブ：進化させた武器の数から */
        if(!(r&&Number.isFinite(r.runs))){const rc=s.rec;rc.runs=Math.max(rc.clears,Math.ceil(rc.time/RUN_LEN),s.best?1:0);}/* #14 までのセーブ：出撃の回数はクリアの回数・出撃した時間から少なめに */
        /* #13：ステージ。#10 までのセーブはクリアしていればステージ1をクリアしたことにする。えらんだステージは解放されている所まで */
        s.rec.stageMax=Math.min(STAGES.length,s.rec.stageMax);if(s.rec.clears>0&&s.rec.stageMax<1)s.rec.stageMax=1;
        if(Number.isFinite(o.st))s.st=clamp(Math.floor(o.st),1,Math.min(STAGES.length,s.rec.stageMax+1));
        /* #15：お知らせ済みの品。#14 までのセーブは、持っている品＋もう条件を満たした品をだまって解放ずみにする（お知らせは出さない） */
        if(Array.isArray(o.unl))s.unl=o.unl.filter((t,i,a)=>MODS[t]&&MODS[t].unlock&&a.indexOf(t)===i);
        else s.unl=TYPES.filter(t=>MODS[t].unlock&&isUnl(t,s));
        /* 研究所の解放（11/16）：お知らせ済み。前のセーブは、強化してある研究＋もう条件を満たした研究をだまって解放ずみにする */
        if(Array.isArray(o.lunl))s.lunl=o.lunl.filter((id,i,a)=>LABK[id]&&LABK[id].unlock&&a.indexOf(id)===i);
        else s.lunl=LAB.filter(x=>x.unlock&&labUnl(x.id,s)).map(x=>x.id);
      }}
  }catch(e){}
  SHIP_IDS.forEach(id=>{const sh=s.ships[id];TYPES.forEach(t=>{let n=0;sh.eq=sh.eq.map(v=>{if(v&&v.t===t){n++;if(n>s.owned[t])return null;}return v;});});});
  return s;
}
function persist(){try{const o=Object.assign({},save);delete o.load;localStorage.setItem(KEY,JSON.stringify(o));}catch(e){}}
/* 最初から（11/25 しょーくん・iPad の感想）：新しいセーブに入れかえる。BGM と SE の設定だけ残す。遊び方・はじめの案内・整備士のあいさつも最初から */
function resetSave(){const bgm=save.bgm,snd=save.snd;save=freshSave();if(bgm!==undefined)save.bgm=bgm;if(snd!==undefined)save.snd=snd;setShip(save.cur);persist();}
/* 解放の条件と進み */
/* 条件の「いまの数」（機体と品で共通）。wmax＝武器の最高Lv（t は1つか配列）・sup5＝最大にした支援の数・big＝その大型の敵をたおした数・cw＝その品をつけてクリアした回数 */
function condCur(u,s){const r=s.rec;
  if(u.k==='wmax')return Math.max(0,...[].concat(u.t).map(t=>r.wmax[t]||0));
  if(u.k==='sup5')return r.sup5.length;
  if(u.k==='big')return s.book.e[u.t]||0;
  if(u.k==='cw')return r.cw[u.t]||0;
  return r[u.k]||0;}
const progOf=(u,s)=>{if(!u)return {ok:true,cur:0,n:0};const cur=condCur(u,s);return {ok:cur>=u.n,cur:Math.min(cur,u.n),n:u.n};};
function shipProg(id){return progOf(SHIPS[id].unlock,save);}
/* 品の解放（#15）：最初からの8こ・持っている品（機体についてきた品も）・お知らせ済み・条件を満たした品 */
const modProg=(t,s)=>progOf(MODS[t].unlock,s||save);
function isUnl(t,s){s=s||save;const u=MODS[t].unlock;return !u||s.owned[t]>0||(s.unl||[]).includes(t)||condCur(u,s)>=u.n;}
/* 新しく解放された品をお知らせ済みにして返す（出撃の結果で出す） */
function syncUnl(){const got=TYPES.filter(t=>MODS[t].unlock&&!save.unl.includes(t)&&isUnl(t));if(got.length)save.unl=save.unl.concat(got);return got;}
/* 研究所の解放（11/16）：最初からの4こ・強化してある研究・お知らせ済み・条件を満たした研究 */
function labUnl(id,s){s=s||save;const u=LABK[id].unlock;return !u||s.lab[id]>0||(s.lunl||[]).includes(id)||condCur(u,s)>=u.n;}
function syncLabUnl(){const got=LAB.filter(o=>o.unlock&&!save.lunl.includes(o.id)&&labUnl(o.id)).map(o=>o.id);if(got.length)save.lunl=save.lunl.concat(got);return got;}
function setShip(id){save.cur=id;SLOTS=SHIPS[id].slots;save.load=save.ships[id].eq;}
let save=loadSave();setShip(save.cur);
