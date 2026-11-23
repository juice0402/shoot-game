/* ---------- ステージの背景（#13）：上下がつながる1枚＋流れる物。はじめて使うときに1回だけ作る ---------- */
/* 機械要塞の床：暗い金属の板・継ぎ目・びょう・2本の配管（480×512・上下がつながる） */
function floorTile(w,h){
  const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');
  g.fillStyle='#0c0f1a';g.fillRect(0,0,w,h);
  const PW=120,PH=64;
  for(let j=0;j<h/PH;j++)for(let i=0;i<w/PW;i++){const x=i*PW,y=j*PH,s=hash2(i,j,31);
    g.fillStyle=s<0.33?'#141a28':s<0.66?'#171e2e':'#121725';g.fillRect(x+2,y+2,PW-4,PH-4);
    g.fillStyle='#1f2840';g.fillRect(x+2,y+2,PW-4,1);g.fillRect(x+2,y+2,1,PH-4);
    g.fillStyle='#090b14';g.fillRect(x+2,y+PH-3,PW-4,1);g.fillRect(x+PW-3,y+2,1,PH-4);
    g.fillStyle='#2a3450';[[6,6],[PW-8,6],[6,PH-8],[PW-8,PH-8]].forEach(([a,b])=>g.fillRect(x+a,y+b,2,2));
    if(s>0.72){g.fillStyle='#0a0d17';for(let k=0;k<5;k++)g.fillRect(x+30,y+16+k*7,PW-60,3);g.fillStyle='#1c2338';for(let k=0;k<5;k++)g.fillRect(x+30,y+19+k*7,PW-60,1);}
    else if(s<0.12){g.fillStyle='#0f131f';g.fillRect(x+40,y+18,PW-80,PH-36);g.fillStyle='#232c44';g.fillRect(x+40,y+18,PW-80,1);}}
  [[64,12],[404,12]].forEach(([px,pw])=>{const sh=['#141a2a','#1f2840','#2c3858','#3a4870','#2c3858','#1f2840','#141a2a'];
    for(let k=0;k<pw;k++){g.fillStyle=sh[Math.min(6,Math.floor(k/pw*7))];g.fillRect(px+k,0,1,h);}
    for(let y=40;y<h;y+=128){g.fillStyle='#0a0d17';g.fillRect(px-3,y,pw+6,10);g.fillStyle='#3a4870';g.fillRect(px-3,y,pw+6,2);g.fillStyle='#2a3450';g.fillRect(px-1,y+4,2,2);g.fillRect(px+pw-1,y+4,2,2);}});
  return c;
}
const BGX={};
function bgOf(n){if(BGX[n])return BGX[n];let b;
  if(n===2)b={tile:nebulaTile(480,1024,['#07060a','#0e0b0e','#181213','#231a19','#2e2320','#3a2d28'],['#07060a','#0c0c11','#141419','#1d1d24','#27272f','#32323b'],21),sp:9,
    pl:[planet(46,['#16110e','#2a211a','#40342a','#5a4a3c','#7c6852'],4,null,15)],obj:'rock',
    rocks:[5,7,9].map((r,i)=>paint(r*2+1,r*2+1,rockParts(r,40+i).map(L=>Object.assign({},L,{b:(L.b||0)-0.42})),{ol:'#05040a'}))};
  else if(n===3)b={tile:nebulaTile(480,1024,['#040a12','#071624','#0b2436','#12344a','#1c4a62','#2a6680'],['#040a12','#0a1420','#122232','#1c3246','#2a465c','#3c5e76'],33),sp:11,
    pl:[planet(50,['#0c2232','#16405a','#2c6c8a','#5aa2c0','#bfe9ff'],3,['#2c5a74','#5a8eaa','#9cc8dc'],18)],obj:'flake'};
  else if(n===4)b={tile:floorTile(480,512),sp:38,pl:null,obj:null,noStars:1};
  else if(n===5)b={tile:nebulaTile(480,1024,['#040208','#0a0412','#12061e','#1c0a2a','#260e38','#321446'],['#040208','#0c0410','#16061a','#200a24','#2a0e2e','#36123a'],47),sp:5,pl:null,obj:'eye',dimStars:1,
    eye:[0,1,2].map(k=>paint(44,20,k===2?[{m:'ecrim',r:1,flat:'#5c0a1e',p:[[0,10],[43,9],[43,11],[0,11]]}]:[{m:'ecrim',r:3,f:g=>{g.beginPath();g.moveTo(0,10);g.quadraticCurveTo(21.5,-4+k*6,43,10);g.quadraticCurveTo(21.5,24-k*6,0,10);g.fill();}},
      {m:'eorg',r:2,f:g=>E(g,21.5,10,5,6-k*2.5)},{m:'edark',r:1,f:g=>E(g,21.5,10,1.6,4.5-k*2)}],{ol:false})),eg:glow(44,'224,48,79',.22)};
  else b={tile:NEB,sp:7,pl:PLANETS,obj:null};
  return BGX[n]=b;}
/* 流れる物：ステージ2＝遠くの岩・3＝氷のかけら・5＝遠くの赤い目 */
function bgObjs(n){const B=bgOf(n),o=[];
  if(B.obj==='rock')for(let i=0;i<14;i++)o.push({x:rand(-10,GW),y:rand(-40,GH),l:i%3,v:[10,16,24][i%3]});
  if(B.obj==='flake')for(let i=0;i<70;i++)o.push({x:rand(0,GW),y:rand(0,GH),l:i%3,v:[18,34,60][i%3],w:rand(0,TAU)});
  if(B.obj==='eye')for(let i=0;i<6;i++)o.push({x:rand(20,GW-40),y:rand(-20,GH),v:rand(3,6),bl:rand(0,6),s:rand(0.5,1)});
  return o;}
/* 絵は最初に1回だけ作ってキャッシュ（毎フレーム作らない） */
/* 絵は使うときに作る（#14：起動を軽く）。lazyPut(o,k,fn,q)：o[k] を最初に読んだときに fn() で作る。
   起動のあと、出撃していない間に少しずつ作っておく（warmLazy）。q='g'（敵・爆発などの大きい絵）は出撃の始めに残りを作る（flushLazy）ので、出撃中に作ることはない。q=1 は作っておかない */
const LAZYQ=[],LAZYG=[];
function lazyPut(o,k,fn,q){Object.defineProperty(o,k,{configurable:true,enumerable:true,get(){const v=fn();Object.defineProperty(o,k,{value:v,writable:true,configurable:true,enumerable:true});return v;}});
  const f=()=>o[k];if(q!==1)LAZYQ.push(f);if(q==='g')LAZYG.push(f);}
function flushLazy(){while(LAZYG.length)LAZYG.shift()();}
function warmLazy(){if(R&&R.state!=='over')return setTimeout(warmLazy,500);const t0=performance.now();while(LAZYQ.length&&performance.now()-t0<6)LAZYQ.shift()();if(LAZYQ.length)setTimeout(warmLazy,24);}
const SHIPSPR={};SHIP_IDS.forEach(k=>{lazyPut(SHIPSPR,k,()=>makeShip(k));});
const shipSil=k=>{const s=SHIPSPR[k],c=document.createElement('canvas');c.width=s.w;c.height=s.h;const g=c.getContext('2d');g.drawImage(s.img,0,0);g.globalCompositeOperation='source-in';g.fillStyle='#1d2052';g.fillRect(0,0,s.w,s.h);return c;};
const ESPR={};Object.keys(ENEMY_PARTS).forEach(k=>{const P=ENEMY_PARTS[k];lazyPut(ESPR,k,()=>paint(P.w,P.h,P.parts,{spec:P.spec,flash:1,ice:1}),'g');});
/* 向きのある敵（#13）：角突き・盾持ち・大蛇の頭は8方向、砲台の砲身は16方向（0＝右・時計回り。もとの絵は下向き） */
const rot8=(k,n)=>Array.from({length:n||8},(_,i)=>{const P=ENEMY_PARTS[k];return paint(P.w,P.h,P.parts,{spec:null,flash:1,ice:1,rot:i*TAU/(n||8)-Math.PI/2});});
const R8={};['charger','guard','snake'].forEach(k=>lazyPut(R8,k,()=>rot8(k),'g'));
const dir8=a=>((Math.round(a/(Math.PI/4))%8)+8)%8,dir16=a=>((Math.round(a/(Math.PI/8))%16)+16)%16;
const TBAR=Array.from({length:16},(_,i)=>paint(40,40,[{m:'erust',r:1.5,p:[[17,18],[22,18],[22,33],[17,33]]},{m:'ecrim',r:1,p:[[16,32],[23,32],[23,38],[16,38]]}],{flash:1,ice:1,rot:i*TAU/16-Math.PI/2}));
const ROCKS=[11,15,21].map((r,i)=>[0,1].map(v=>paint(r*2+1,r*2+1,rockParts(r,7+i*3+v),{flash:1,ice:1})));
function glow(rad,rgb,a){
  const s=rad*2+1,c=document.createElement('canvas');c.width=s;c.height=s;const g=c.getContext('2d');
  const gr=g.createRadialGradient(rad+.5,rad+.5,0,rad+.5,rad+.5,rad);
  gr.addColorStop(0,'rgba('+rgb+','+a+')');gr.addColorStop(1,'rgba('+rgb+',0)');
  g.fillStyle=gr;g.fillRect(0,0,s,s);return c;
}
const GLOW={bug:glow(20,'255,59,79',.28),tank:glow(30,'255,122,26',.26),shooter:glow(27,'255,63,180',.28),boss:glow(100,'224,48,79',.26),boss2:glow(100,'255,63,180',.26)};
/* #13：ステージ2〜5の敵の光（岩は光らない） */
Object.assign(GLOW,{hider:glow(22,'255,159,67',.24),charger:glow(24,'255,74,94',.28),frost:glow(26,'255,108,204',.28),splitter:glow(28,'255,108,204',.26),shard:glow(16,'255,108,204',.26),
  turret:glow(28,'224,48,79',.22),guard:glow(30,'224,48,79',.24),warp:glow(26,'228,94,152',.3),seg:glow(30,'224,48,79',.18),rock:null,
  gnaw:glow(100,'255,159,67',.24),gnaw2:glow(104,'255,159,67',.24),icebeast:glow(100,'255,108,204',.26),icequeen:glow(106,'255,108,204',.26),fort:glow(104,'224,48,79',.24),snake:glow(64,'224,48,79',.26),core:glow(120,'228,94,152',.3)});
/* 敵の弾：白い芯のピンクの玉（いちばん上に描く） */
const EBS=['#ff2d6f','#ff5c94'].map(c=>paint(13,13,[
  {m:'epink',flat:c,noSeam:1,f:g=>E(g,6,6,6.2)},
  {m:'epink',flat:'#ffb8d0',noSeam:1,f:g=>E(g,6,6,4)},
  {m:'epink',flat:'#ffffff',noSeam:1,f:g=>E(g,6,6,2.3)},
],{ol:'#2a0010'}));
const EBG=glow(16,'255,45,111',.45);
/* 大きい敵の弾（大型の敵が撃つ）：衝撃波砲では消えない */
const EBB=['#ff2d6f','#ff5c94'].map(c=>paint(19,19,[
  {m:'epink',flat:c,noSeam:1,f:g=>E(g,9,9,9.2)},
  {m:'epink',flat:'#ffb8d0',noSeam:1,f:g=>E(g,9,9,6.2)},
  {m:'epink',flat:'#ffffff',noSeam:1,f:g=>E(g,9,9,3.4)},
],{ol:'#2a0010'}));
const EBGB=glow(22,'255,45,111',.45);
const EBGS=glow(18,'235,245,255',.55);/* 霜の弾（当たると遅くなる）：白い光を足す */
const MISC={};Object.keys(MISC_PARTS).forEach(k=>{const [w,h,p,o]=MISC_PARTS[k];MISC[k]=paint(w,h,p,o);});
const GEMS=MISC.gem,GEMB=MISC.gemb,GRAV=MISC.grav,DRONE=MISC.drone,MINE=[MISC.mine,MISC.mineoff];
const SAWS=[9,12].map(r=>{const w=r*2+1,c=r;return [0,Math.PI/6].map(rot=>paint(w,w,[
  {m:'steel',r:2.5,f:g=>star(g,c,c,r,r*0.66,6)},
  {m:'metal',r:1.2,f:g=>E(g,c,c,r*0.34)},
],{rot}));});
const MISS=[];for(let i=0;i<16;i++)MISS.push(paint(7,13,MISC_PARTS.missile[2],{rot:i*Math.PI/8+Math.PI/2}));
const MSPR={};
TYPES.forEach(t=>{MSPR[t]=[];for(let d=0;d<8;d++)lazyPut(MSPR[t],d,()=>{const s=paint(24,24,MODPARTS[t],{rot:d*Math.PI/4});lazyPut(s,'url',()=>s.img.toDataURL(),1);return s;});});
const ICON={};TYPES.forEach(t=>{lazyPut(ICON,t,()=>MSPR[t][0].url);});
/* 進化した武器の絵（同じ24×24。形を大きく・色を明るく） */
const EVOPARTS={
  laser:[MB('blue'),{m:'steel',r:2.5,p:[[8,1],[15,1],[15,15],[8,15]]},{m:'glass',r:1,f:g=>{RC(g,4.5,3,2.5,10);RC(g,16.5,3,2.5,10);}},{m:'blue',r:1.5,p:[[6,10],[17,10],[17,13],[6,13]]},{m:'hull',r:1.5,p:[[9,-2],[14,-2],[14,3],[9,3]]}],
  gatling:[{m:'blue',p:[[3,11],[20,11],[21,21],[2,21]]},{m:'metal',f:g=>{for(let i=0;i<5;i++)RC(g,3.5+i*3.5,i%2?0:1.5,2.5,12);}},{m:'hull',r:1,p:[[3,5],[20,5],[20,7.5],[3,7.5]]},{m:'yel',r:1,f:g=>{RC(g,7,14,3,3);RC(g,13,14,3,3);}}],
  missile:[{m:'blue',r:2,p:[[2,10],[21,10],[21,21],[2,21]]},{m:'hull',r:1,f:(g,poly)=>{for(let i=0;i<3;i++){const x0=3.5+i*6.5;poly([[x0,10],[x0,4],[x0+1.75,1],[x0+3.5,4],[x0+3.5,10]]);}}},{m:'glass',r:1,f:g=>{for(let i=0;i<3;i++)E(g,5.25+i*6.5,4.5,1);}},{m:'metal',r:1,p:[[5,14],[18,14],[18,17],[5,17]]}],
  sword:[MB('purple'),{m:'hull',r:2,p:[[11.5,-2],[15,2.5],[15,13],[8,13],[8,2.5]]},{m:'glass',r:1,p:[[10.8,1],[12.2,1],[12.2,12],[10.8,12]]},{m:'gold',r:1.2,p:[[2,12],[21,12],[19,15.5],[4,15.5]]},{m:'yel',r:1,f:g=>star(g,11.5,13.8,3.2,1.4,4)}],
  saw:[MB('gold'),{m:'steel',r:2.5,f:g=>star(g,11.5,7,8.5,5.2,8)},{m:'gold',r:1.2,f:g=>E(g,11.5,7,3)},{m:'hull',r:1,f:g=>E(g,11.5,7,1.2)}],
  flame:[{m:'blue',f:g=>E(g,11.5,16,7.5,5.5)},{m:'steel',p:[[7.5,12],[15.5,12],[18,3],[5,3]]},{m:'glass',r:1.5,f:g=>{g.lineWidth=2.2;g.beginPath();g.arc(11.5,4,6.5,Math.PI,TAU);g.stroke();}},{m:'teal',r:1,p:[[9,7],[14,7],[14,9],[9,9]]},{m:'ice',r:1,f:g=>E(g,11.5,1.5,2.4)}],
  thunder:[MB('gold'),{m:'metal',p:[[10,4],[13,4],[13,15],[10,15]],r:1},{m:'gold',r:1,f:(g,poly)=>{poly([[4,10],[7,3],[8,10]]);poly([[19,10],[16,3],[15,10]]);}},{m:'lime',r:1,f:g=>{RC(g,6,7,11,1.6);RC(g,6,10.5,11,1.6);}},{m:'lime',r:3,f:g=>E(g,11.5,2.5,4)}],
  gravity:[{m:'purple',f:g=>E(g,11.5,16.5,7.5,5)},{m:'metal',r:1,f:g=>{RC(g,3,6,2.5,8);RC(g,18.5,6,2.5,8);}},{m:'purple',r:2,f:g=>{g.lineWidth=3;g.beginPath();g.arc(11.5,8,6.6,0,TAU);g.stroke();}},{m:'purple',flat:'#060a1c',noSeam:1,f:g=>E(g,11.5,8,4.2)},{m:'hull',r:1,f:g=>E(g,9.5,6,1)}],
  cannon:[{m:'teal',f:g=>E(g,11.5,16,9,6)},{m:'steel',p:[[6,0],[17,0],[17,14],[6,14]],r:3},{m:'green',r:1,p:[[6,4],[17,4],[17,6],[6,6]]},{m:'purple',r:1,p:[[6,8],[17,8],[17,10],[6,10]]},{m:'glass',r:1.5,p:[[7,-2],[16,-2],[16,1.5],[7,1.5]]}],
  freeze:[MB('ice'),{m:'ice',p:[[9.5,6],[13.5,6],[13.5,15],[9.5,15]]},{m:'ice',r:2.5,f:g=>star(g,11.5,4,6,2.4,6)},{m:'hull',r:1,f:g=>E(g,11.5,4,1.6)},{m:'teal',r:1,p:[[7,11],[16,11],[16,13],[7,13]]}],
  shotgun:[MB('steel'),{m:'steel',r:3,p:[[5,15],[18,15],[20,3],[3,3]]},{m:'metal',r:1,p:[[2,0],[21,0],[21,4],[2,4]]},{m:'gold',r:1,f:g=>{RC(g,5,7,13,2);RC(g,5.5,11,12,2);}},{m:'hull',r:1,f:g=>{E(g,6,2,1);E(g,11.5,2,1);E(g,17,2,1);}}],
  mine:[MB('gold'),{m:'gold',r:1,f:g=>{RC(g,11,-1,1.5,4);RC(g,3.5,7,4,1.5);RC(g,16,7,4,1.5);RC(g,5,1.5,2.5,2.5);RC(g,15.5,1.5,2.5,2.5);}},{m:'gold',r:2.5,f:g=>E(g,11.5,7.5,6)},{m:'yel',r:1,f:g=>E(g,11.5,7.5,2.2)}],
  gsword:[MB('blue'),{m:'hull',r:2.5,p:[[11.5,-2],[15.5,3],[15.5,13],[7.5,13],[7.5,3]]},{m:'ice',r:1,p:[[10.5,1],[12.5,1],[12.5,12],[10.5,12]]},{m:'green',r:1.5,mir:1,p:[[0.5,4],[5,3],[6,7],[4.5,11],[1,9]]},{m:'blue',r:1.2,p:[[4,12],[19,12],[19,15],[4,15]]}],
  plasma:[MB('gold'),{m:'metal',r:1,mir:1,p:[[3,15],[2,7],[4,4],[6,7],[5,15]]},{m:'yel',r:4,f:g=>E(g,11.5,7,6)},{m:'gold',r:1,f:g=>{for(let i=0;i<8;i++){const a=i*TAU/8;RC(g,11+Math.cos(a)*7.5,6.5+Math.sin(a)*7.5,1.5,1.5);}}},{m:'hull',r:1,f:g=>E(g,9.8,5.3,1.6)}],
};
const MSPRE={},ICONE={};
for(const t in EVO){MSPRE[t]=[];for(let d=0;d<8;d++)lazyPut(MSPRE[t],d,()=>paint(24,24,EVOPARTS[t],{rot:d*Math.PI/4}));lazyPut(ICONE,t,()=>MSPRE[t][0].img.toDataURL());}
/* 試作6の武器が出す物（砲台・衛星・小さなミサイル・魚雷・グレネード・子爆弾・プラズマ球） */
const TURRET=paint(13,13,[{m:'steel',r:2,p:[[1,3],[3,1],[9,1],[11,3],[11,9],[9,11],[3,11],[1,9]]},{m:'blue',r:2.5,f:g=>E(g,6,6,3.2)}],{});
const SAT=paint(15,9,[{m:'blue',r:1,mir:1,p:[[0,2],[4,2],[4,6],[0,6]]},{m:'hull',r:2,f:g=>E(g,7,4,2.8)},{m:'glass',r:1,f:g=>E(g,7,4,1)}],{});
const MICRO=[],TORP=[];
for(let i=0;i<16;i++){const rot=i*Math.PI/8+Math.PI/2;
  MICRO.push(paint(5,9,[{m:'yel',r:1,p:[[2,0],[4,3],[4,8],[0,8],[0,3]]},{m:'hull',r:1,p:[[1,4],[3,4],[3,6],[1,6]]}],{rot}));
  TORP.push(paint(11,21,[{m:'blue',r:1,mir:1,p:[[0,16],[3,12],[3,20],[0,20]]},{m:'hull',r:3,f:g=>E(g,5,10,3.6,9.5)},{m:'glass',r:1,f:g=>E(g,5,2.5,1.8)},{m:'metal',r:1,p:[[2,13],[8,13],[8,14.5],[2,14.5]]}],{rot}));}
const GREN=paint(7,7,[{m:'yel',r:2,f:g=>E(g,3,3.5,3)},{m:'metal',r:1,p:[[2,0],[4,0],[4,1.5],[2,1.5]]}],{});
const BLET=paint(5,5,[{m:'gold',r:1.5,f:g=>E(g,2,2,2)}],{});
const ORBC={};
/* 試作6の防御・補助・進化が出す物（盾・ドローン・お金・太陽・ブラックホール）と、Lv8 の明るい絵 */
const SDC={},sdSpr=(r,l8)=>{const k=r+(l8?'b':'');if(!SDC[k]){const w=r*2+1;SDC[k]=paint(w,w,[{m:'green',r:Math.max(1.5,r*0.35),b:l8?0.18:0,p:[[r,0],[w-1,r*0.5],[w-1-r*0.2,r*1.3],[r,w-1],[r*0.2,r*1.3],[0,r*0.5]]},{m:'hull',r:1,f:g=>E(g,r,r*0.85,Math.max(1,r*0.28))}],{});}return SDC[k];};
[7,8,9,11].forEach(r=>{sdSpr(r,false);sdSpr(r,true);});/* 出撃中に描き始めて止まらないよう、先に作っておく */
const GSHD=paint(11,13,[{m:'ice',r:2,p:[[5,0],[10,2],[9.5,8],[5,12],[0.5,8],[0,2]]},{m:'hull',r:1,p:[[4,3],[6,3],[6,8],[4,8]]}],{});
const CDRN=paint(13,11,[{m:'metal',r:1,mir:1,p:[[0,2],[4,2],[4,4],[0,4]]},{m:'teal',r:2.5,f:g=>E(g,6,5.5,4)},{m:'hull',r:1,f:g=>E(g,6,5,1.4)},{m:'metal',r:0.8,f:g=>{RC(g,3,8.5,1.5,2.5);RC(g,8,8.5,1.5,2.5);}}],{});
const COIN7=paint(8,8,[{m:'gold',r:2,f:g=>E(g,3.5,3.5,3.6)},{m:'yel',r:1,p:[[3,1.5],[4,1.5],[4,5.5],[3,5.5]]}],{});
const SWARM=[];for(let i=0;i<16;i++)SWARM.push(paint(7,13,[{m:'blue',mir:1,r:1,p:[[0,8],[3,6],[3,12],[0,12]]},{m:'hull',r:1.5,p:[[3,1],[5,4],[5,11],[1,11],[1,4]]},{m:'glass',r:1,p:[[3,0],[5,3],[1,3]]}],{rot:i*Math.PI/8+Math.PI/2}));
const SAWB=[0,Math.PI/8].map(rot=>paint(33,33,[{m:'steel',r:3,f:g=>star(g,16,16,16,11,8)},{m:'gold',r:1.5,f:g=>E(g,16,16,5.5)},{m:'hull',r:1,f:g=>E(g,16,16,2)}],{rot}));
const mineParts=(body,light)=>[{m:body==='gold'?'gold':'metal',r:1,f:g=>{RC(g,6,0,2,3);RC(g,6,11,2,3);RC(g,0,6,3,2);RC(g,11,6,3,2);}},{m:body,r:2.5,f:g=>E(g,6.5,6.5,5)},{m:'yel',flat:light,noSeam:1,f:g=>RC(g,6,6,2,2)}];
const GMINE=[paint(14,14,mineParts('gold','#ffffff'),{}),paint(14,14,mineParts('gold','#a06a0a'),{})];
const MINE8=[paint(14,14,mineParts('steel','#8cf0ff'),{}),paint(14,14,mineParts('steel','#5a6688'),{})];
const SUNC={},sunSpr=r=>{const k=Math.max(6,Math.round(r));if(!SUNC[k]){const w=k*2+1;SUNC[k]=paint(w,w,[{m:'yel',r:Math.min(12,k*0.8),b:0.1,f:g=>E(g,k,k,k)},{m:'yel',flat:'#ffffff',noSeam:1,f:g=>E(g,k-k*0.3,k-k*0.32,Math.max(1.5,k*0.13))}],{ol:'#b8600e'});}return SUNC[k];};
const BHS=paint(25,25,[{m:'purple',r:3,f:g=>E(g,12,12,12)},{m:'purple',flat:'#060a1c',noSeam:1,f:g=>E(g,12,12,8)}],{ol:'#1f0f52'});
const GREN8=paint(9,9,[{m:'yel',r:2.5,b:0.15,f:g=>E(g,4,4.5,4)},{m:'hull',r:1,p:[[3,0],[5,0],[5,1.5],[3,1.5]]}],{});
const BLET8=paint(5,5,[{m:'yel',r:1.5,f:g=>E(g,2,2,2)}],{});
const TURRET8=paint(13,13,[{m:'steel',r:2,b:0.12,p:[[1,3],[3,1],[9,1],[11,3],[11,9],[9,11],[3,11],[1,9]]},{m:'gold',r:2.5,f:g=>E(g,6,6,3.2)}],{});
const SAT8=paint(15,9,[{m:'gold',r:1,mir:1,p:[[0,2],[4,2],[4,6],[0,6]]},{m:'hull',r:2,f:g=>E(g,7,4,2.8)},{m:'glass',r:1,f:g=>E(g,7,4,1)}],{});
const orbSpr=r=>{const k=Math.max(4,Math.round(r));if(!ORBC[k]){const w=k*2+1;ORBC[k]=paint(w,w,[{m:'purple',r:k*0.7,f:g=>E(g,k,k,k)},{m:'hull',r:k*0.4,f:g=>E(g,k-k*0.15,k-k*0.15,k*0.45)}],{ol:'#1f0f52'});}return ORBC[k];};
const ALLY=[paint(30,30,MISC_PARTS.ally[2],{rot:Math.PI/2,spec:[]}),paint(30,30,MISC_PARTS.ally[2],{rot:-Math.PI/2})];
const PICON={},SICON={};
['magnet','speed','armor','clock','power','regen','xp','gold'].forEach(k=>{PICON[k]=paint(20,20,ICON_PARTS[k],{}).img.toDataURL();});
SICON.wing=MISC.ally.img.toDataURL();SICON.drone=paint(20,20,[{m:'green',r:3,f:g=>E(g,9.5,9.5,7)},{m:'hull',r:1.2,f:g=>E(g,9.5,9.5,2.6)}],{}).img.toDataURL();
SICON.strike=paint(20,20,ICON_PARTS.strike,{}).img.toDataURL();SICON.barrier=paint(20,20,ICON_PARTS.barrier,{}).img.toDataURL();
/* #12 のアイコン（20×20 のドット。今のアイコンと同じ描き方） */
const ICON12={
  /* 機体の強化 */
  bspd:[{m:'teal',r:1,f:g=>{RC(g,0,6,6,2);RC(g,1,11,7,2);RC(g,3,15,4,2);}},{m:'glass',r:2.5,p:[[8,5],[15,5],[19,9.5],[15,14],[8,14]]}],
  area:[{m:'orangeA',r:1.5,f:g=>{g.lineWidth=2.6;g.beginPath();g.arc(9.5,9.5,5.5,0,TAU);g.stroke();}},{m:'yel',r:1,f:(g,poly)=>{poly([[0,0],[6,0],[0,6]]);poly([[19,0],[13,0],[19,6]]);poly([[0,19],[6,19],[0,13]]);poly([[19,19],[13,19],[19,13]]);}}],
  dur:[{m:'metal',r:1,f:g=>{RC(g,3,0,14,3);RC(g,3,17,14,3);}},{m:'ice',r:2,p:[[5,3],[14,3],[11,9.5],[14,16],[5,16],[8,9.5]]},{m:'yel',r:1,p:[[7.5,12],[11.5,12],[14,16],[5,16]]}],
  critc:[{m:'yel',r:1.5,f:g=>star(g,9.5,9.5,9.5,2.8,4)},{m:'hull',r:1,f:g=>E(g,9.5,9.5,1.5)}],
  critd:[{m:'red',r:1.5,f:g=>star(g,9.5,9.5,9.5,5,8,Math.PI/8)},{m:'yel',r:1.5,f:g=>star(g,9.5,9.5,7.5,2.4,4)}],
  range:[{m:'ice',r:1.5,f:g=>{g.lineWidth=2.2;g.beginPath();g.arc(9.5,9.5,6.5,0,TAU);g.stroke();}},{m:'hull',r:1,f:g=>{RC(g,9,0,2,7);RC(g,9,13,2,7);RC(g,0,9,7,2);RC(g,13,9,7,2);}}],
  knock:[{m:'ered',r:1.5,f:g=>{E(g,9.5,4,6.5,4);RC(g,3,6,3,3);RC(g,13,6,3,3);}},{m:'steel',r:1.5,p:[[9.5,9],[17,15],[12.5,15],[12.5,19],[6.5,19],[6.5,15],[2,15]]}],
  multi:[{m:'red',r:1.5,f:g=>{RC(g,8,3,4,10);RC(g,2,7,4,10);RC(g,14,7,4,10);}},{m:'yel',r:1,f:g=>{RC(g,8,0,4,3);RC(g,2,4,4,3);RC(g,14,4,4,3);}}],
  iframe:[{m:'pearl',r:3,p:[[2,2],[17,2],[17,10],[9.5,18],[2,10]]},{m:'hull',r:1,f:g=>{RC(g,4,5,12,2);RC(g,5,9,10,2);RC(g,7,13,6,2);}}],
  skillg:[{m:'purple',r:1.5,p:[[12,0],[3,11],[9,11],[7,19],[16,7],[10,7],[14,0]]},{m:'mag',r:1,f:g=>RC(g,8,8,3,3)}],
  evade:[{m:'shade',r:1,p:[[0,17],[4,4],[8,17],[4,14]]},{m:'purple',r:1,p:[[5,17],[9,4],[13,17],[9,14]]},{m:'pearl',r:1.5,p:[[11,18],[15.5,2],[19,18],[15.5,15]]}],
  exec:[{m:'steel',r:1.5,p:[[8,7],[11,7],[11,15],[9.5,19],[8,15]]},{m:'gold',r:1,p:[[4,5],[15,5],[15,7],[4,7]]},{m:'red',r:1,p:[[8,0],[11,0],[11,5],[8,5]]}],
  /* 支援 */
  thunder:[{m:'steel',r:2,f:g=>{E(g,6,6,5,4);E(g,12,5,6,5);E(g,9.5,8,8.5,3.5);}},{m:'yel',r:1,p:[[10,10],[5,16],[9,16],[7,19],[14,13],[10,13],[12,10]]}],
  medic:[{m:'metal',r:1,f:g=>{RC(g,0,2,7,2);RC(g,13,2,7,2);RC(g,9,2,2,4);}},{m:'green',r:2.5,f:g=>E(g,9.5,11,8,7)},{m:'pearl',r:1,f:g=>{RC(g,8,7,4,9);RC(g,5,10,10,3);}}],
  frostaura:[{m:'ice',r:1.2,f:g=>{g.lineWidth=2.2;for(let i=0;i<3;i++){const a=i*Math.PI/3+Math.PI/2;g.beginPath();g.moveTo(9.5+Math.cos(a)*9.5,9.5+Math.sin(a)*9.5);g.lineTo(9.5-Math.cos(a)*9.5,9.5-Math.sin(a)*9.5);g.stroke();}}},{m:'glass',r:1,f:g=>E(g,9.5,9.5,2.6)}],
  fireaura:[{m:'orangeA',r:1.5,f:g=>{g.lineWidth=3;g.beginPath();g.arc(9.5,10.5,7.6,0,TAU);g.stroke();}},{m:'yel',r:1.5,p:[[9.5,2],[13,10],[11.5,15],[7.5,15],[6,10]]}],
  guardsat:[{m:'blue',r:1,f:g=>{RC(g,0,6,5,5);RC(g,15,6,5,5);}},{m:'pearl',r:2,p:[[5,2],[14,2],[14,11],[9.5,17],[5,11]]},{m:'glass',r:1,f:g=>E(g,9.5,7.5,2)}],
  meteor:[{m:'purple',r:1,f:g=>{g.lineWidth=3.2;g.beginPath();g.moveTo(0,0);g.lineTo(11,11);g.stroke();}},{m:'yel',r:1.5,f:g=>star(g,13,13,6.5,2.6,5)}],
  battleship:[{m:'steel',r:1.5,p:[[0,11],[19,11],[16,16],[3,16]]},{m:'hull',r:1,p:[[5,6],[11,6],[11,11],[5,11]]},{m:'metal',r:1,f:g=>{RC(g,11,7,8,2);RC(g,7,2,2,4);}}],
  timestop:[{m:'gold',r:1.5,f:g=>E(g,9.5,9.5,9.5)},{m:'pearl',r:2,f:g=>E(g,9.5,9.5,7)},{m:'hull',r:1,f:g=>{RC(g,9,4,2,6.5);RC(g,9,9,5,2);}}],
  /* 特別な強化 */
  glass:[{m:'glass',r:2,p:[[7,0],[12,0],[13,12],[6,12]]},{m:'metal',r:1.5,f:g=>E(g,9.5,15,6,4.5)},{flat:'#ffffff',m:'glass',r:1,f:g=>{RC(g,8,3,1,2);RC(g,9,5,1,2);RC(g,8,7,1,2);}}],
  back:[{m:'blue',r:1,f:g=>{for(let x=0;x<20;x+=5)E(g,x+2,17,3,2.5);}},{m:'metal',r:1,f:g=>RC(g,4,0,2,15)},{m:'red',r:1,p:[[6,1],[18,5],[6,9]]}],
  greed:[{m:'gold',r:2.5,f:g=>E(g,9.5,12.5,8,7)},{m:'yel',r:1.5,p:[[6,1],[13,1],[11,5],[8,5]]},{m:'orangeA',r:1,f:g=>RC(g,7,5,6,2)}],
  heavy:[{m:'metal',r:1.5,p:[[1,13],[18,13],[16,18],[3,18]]},{m:'green',r:2,p:[[3,8],[16,8],[16,13],[3,13]]},{m:'lime',r:1.5,f:g=>E(g,9.5,7,4,3)},{m:'metal',r:1,f:g=>RC(g,9,0,2,5)}],
  fury:[{m:'steel',r:1,f:g=>{g.lineWidth=3;g.beginPath();g.moveTo(2,1);g.lineTo(15,14);g.moveTo(17,1);g.lineTo(4,14);g.stroke();}},{m:'red',r:1,f:g=>{RC(g,13,14,5,5);RC(g,1,14,5,5);}}],
  one:[{m:'red',r:1.5,f:g=>E(g,9.5,9.5,9.5)},{m:'pearl',r:1.5,f:g=>E(g,9.5,9.5,6.2)},{m:'red',r:1,f:g=>E(g,9.5,9.5,3)}],
  haste:[{m:'teal',r:1,f:g=>{RC(g,0,6,5,2);RC(g,0,11,4,2);}},{m:'pearl',r:2,f:g=>E(g,12,9.5,7.5)},{m:'hull',r:1,f:g=>{RC(g,11.5,4,2,6);RC(g,12,9,4,2);}}],
  wall:[{m:'steel',r:2,p:[[2,6],[17,6],[17,19],[2,19]]},{m:'steel',r:1,f:g=>{RC(g,2,2,4,4);RC(g,8,2,4,4);RC(g,14,2,4,4);}},{m:'hull',r:1,p:[[7,12],[12,12],[12,19],[7,19]]}],
  /* 研究所（ほかはいまの機体の強化の絵を使う） */
  r_reroll:[{m:'teal',r:1,f:g=>{g.lineWidth=3;g.beginPath();g.arc(9.5,9.5,7,0.35,Math.PI-0.35);g.stroke();g.beginPath();g.arc(9.5,9.5,7,Math.PI+0.35,TAU-0.35);g.stroke();}},{m:'pearl',r:1,f:(g,poly)=>{poly([[13,1],[19,5],[13,8]]);poly([[6,11],[0,14],[6,18]]);}}],
  r_skip:[{m:'yel',r:1.5,f:(g,poly)=>{poly([[1,3],[5,3],[11,9.5],[5,16],[1,16],[7,9.5]]);poly([[9,3],[13,3],[19,9.5],[13,16],[9,16],[15,9.5]]);}}],
  r_ban:[{m:'metal',r:1.5,p:[[3,1],[16,1],[16,18],[3,18]]},{m:'red',r:1,f:g=>{g.lineWidth=3;g.beginPath();g.moveTo(5,4);g.lineTo(14,15);g.moveTo(14,4);g.lineTo(5,15);g.stroke();}}],
  r_lv:[{m:'blue',r:1.5,f:(g,poly)=>{poly([[9.5,0],[18,8],[14,8],[9.5,4],[5,8],[1,8]]);poly([[9.5,7],[18,15],[14,15],[9.5,11],[5,15],[1,15]]);}},{m:'glass',r:1,p:[[8,15],[11,15],[11,19],[8,19]]}],
  r_slot:[{m:'metal',r:2,p:[[9.5,0],[18,5],[18,14],[9.5,19],[1,14],[1,5]]},{m:'yel',r:1,f:g=>{RC(g,8,4,4,12);RC(g,4,8,12,4);}}],
  r_skill:[{m:'metal',r:1,p:[[0,5],[16,5],[16,15],[0,15]]},{m:'steel',r:1,p:[[16,8],[19,8],[19,12],[16,12]]},{m:'purple',r:1,p:[[2,7],[8,7],[8,13],[2,13]]}],
  r_revive:[{m:'pearl',r:2,p:[[9.5,0],[13,8],[19,13],[19,17],[12,15],[9.5,19],[7,15],[0,17],[0,13],[6,8]]},{m:'glass',r:1,p:[[8.5,5],[10.5,5],[11,9],[8,9]]}],
};
const ICON12U={};for(const k in ICON12)ICON12U[k]=paint(20,20,ICON12[k],{}).img.toDataURL();
PAS_NEW.forEach(k=>{PICON[k]=ICON12U[k];});SUP_NEW.forEach(k=>{SICON[k]=ICON12U[k];});
const XICON={};SPC_IDS.forEach(k=>{XICON[k]=ICON12U[k];});
const LICON={r_hp:PICON.armor,r_pow:PICON.power,r_rate:PICON.clock,r_spd:PICON.speed,r_mag:PICON.magnet,r_xp:PICON.xp,r_gold:PICON.gold,r_regen:PICON.regen};
LAB.forEach(o=>{if(!LICON[o.id])LICON[o.id]=ICON12U[o.id];});
/* 実績のメダル（取った＝金・まだ＝鉄） */
const medal=(a,b)=>paint(20,22,[{m:'red',r:1,p:[[4,0],[8,0],[11,9],[7,9]]},{m:'blue',r:1,p:[[15,0],[11,0],[8,9],[12,9]]},{m:a,r:2.5,f:g=>E(g,9.5,14,7)},{m:b,r:1,f:g=>star(g,9.5,14,4,1.8,5,-Math.PI/2)}],{}).img.toDataURL();
const MEDAL=[medal('metal','steel'),medal('gold','yel')];
/* くわしく（虫めがね・11/16 図鑑と実績にそろえる） */
const INFOIC=paint(20,20,[{m:'steel',r:1,p:[[11,13],[13,11],[19,17],[17,19]]},{m:'metal',r:2,f:g=>E(g,8,8,7)},{m:'teal',r:1.5,f:g=>E(g,8,8,4.4)},{m:'pearl',r:1,f:g=>E(g,6,6,1.4)}],{}).img.toDataURL();
const BOOKIC=paint(20,20,[{m:'blue',r:1.5,p:[[3,1],[17,1],[17,19],[3,19]]},{m:'pearl',r:1,p:[[14,3],[17,3],[17,18],[14,18]]},{m:'gold',r:1,p:[[6,5],[12,5],[12,8],[6,8]]}],{}).img.toDataURL();
/* 出撃の中の絵：宝箱・回復の玉・回復ドローン・盾の衛星・戦艦・雷雲 */
const CHEST=paint(22,18,[{m:'orangeA',r:2,p:[[1,8],[20,8],[20,17],[1,17]]},{m:'orangeA',r:3,f:g=>{g.beginPath();g.moveTo(1,8);g.lineTo(1,5);g.quadraticCurveTo(10.5,-2,20,5);g.lineTo(20,8);g.closePath();g.fill();}},
  {m:'gold',r:1,f:g=>{RC(g,4,2,3,16);RC(g,14,2,3,16);RC(g,1,7,20,2);}},{m:'metal',r:1,p:[[9,6],[12,6],[12,12],[9,12]]}],{spec:[[5,3]]});
const HORB=paint(9,9,[{m:'green',r:2,f:g=>E(g,4,4,4)},{m:'pearl',r:1,f:g=>{RC(g,3,1,3,7);RC(g,1,3,7,3);}}],{});
const MEDIC=paint(17,11,[{m:'metal',r:1,f:g=>{RC(g,0,0,6,2);RC(g,11,0,6,2);RC(g,7,1,3,3);}},{m:'green',r:2.5,f:g=>E(g,8,6.5,6,4.5)},{m:'pearl',r:1,f:g=>{RC(g,7,4,3,6);RC(g,5,6,7,2);}}],{});
const GSAT=paint(13,13,[{m:'blue',r:1,f:g=>{RC(g,0,4,3,4);RC(g,10,4,3,4);}},{m:'pearl',r:2,p:[[3,1],[9,1],[9,7],[6,12],[3,7]]},{m:'glass',r:1,f:g=>E(g,6,5,1.5)}],{});
const BSHIP=paint(64,20,[{m:'steel',r:2.5,p:[[0,10],[56,10],[63,12],[56,18],[6,18]]},{m:'hull',r:2,p:[[20,4],[34,4],[36,10],[18,10]]},{m:'metal',r:1,f:g=>{RC(g,26,0,3,4);RC(g,8,7,8,3);RC(g,40,7,8,3);RC(g,14,5,10,2);RC(g,46,5,10,2);}},{m:'glass',r:1,f:g=>RC(g,22,6,10,2)}],{spec:[[24,6]]});
const CLOUD=paint(34,14,[{m:'steel',r:3,f:g=>{E(g,9,8,8,5);E(g,18,6,9,6);E(g,26,8,7,5);E(g,17,10,15,3.5);}}],{});
const COINURL=MISC.coin.img.toDataURL();
const EXPL={};[['s',40,3],['m',64,5],['b',180,7]].forEach(([k,s,n])=>lazyPut(EXPL,k,()=>explFrames(s,n),'g'));
const HITF={w:hitFrames('#bfefff'),y:hitFrames('#ffd23f'),g:hitFrames('#5dffb0')};
const NEB=nebulaTile(480,1024);
const PLANETS=[planet(56,['#120c2a','#22184a','#3a2a6e','#5a4496','#8a74c4'],5,['#2a2048','#4a3c74','#7a6aa4'],4),
  planet(26,['#081428','#10284a','#1c4470','#3a6c9a','#7aa4c8'],2,null,8),
  planet(40,['#0a1a1a','#123232','#1e5050','#347474','#62a0a0'],3,null,12)];

