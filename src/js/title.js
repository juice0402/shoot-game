/* ---------- title・遊び方 ---------- */
const titleEl=$('title'),tCv=$('titleCv'),tg=tCv.getContext('2d');
let TS=null,tRaf=0,tLast=0;
function titleBg(){
  const r=titleEl.getBoundingClientRect(),h=clamp(Math.round(GW*Math.max(1,r.height)/Math.max(1,r.width)),660,1200);
  tCv.width=GW;tCv.height=h;tg.imageSmoothingEnabled=false;
  const stars=[];for(let i=0;i<170;i++)stars.push({x:rand(0,GW),y:rand(0,h),l:i<95?0:i<145?1:2,tw:rand(0,TAU)});
  const k=Math.max(r.width/GW,r.height/h)||1,vh=Math.min(h,r.height/k);/* 横長の画面（PC）は上下が切れる：見えている所の中に機体を置く（#14） */
  TS={t:0,h,neb:rand(0,1024),stars,pl:{i:0,x:GW*0.02,y:h*0.4},shots:[],cd:0,sy:(h-vh)/2+vh*(vh<h*0.8?0.5:0.66),sa:vh<h*0.8?8:14};
  /* 11/25 ボタンが1行ふえた：低い画面では、機体と炎がボタンにかからない所まで上げる（高い画面はいままでと同じ） */
  const bt=titleEl.querySelector('.tbtns').getBoundingClientRect(),sp=SHIPSPR[save.cur];
  const lim=(bt.top-r.top)/k+(h-vh)/2-12-Math.max(sp.img.height,sp.fl[0].height)+sp.cy-TS.sa;
  if(bt.height&&TS.sy>lim)TS.sy=lim;
}
function titleFrame(ts){
  if(titleEl.hidden){tRaf=0;return;}
  tRaf=requestAnimationFrame(titleFrame);
  let dt=(ts-tLast)/1000;tLast=ts;if(!(dt>0))dt=0;dt=Math.min(dt,0.05);
  const S=TS,g=tg,h=S.h;S.t+=dt;
  for(const s of S.stars){s.y+=STAR_SP[s.l]*dt*1.6;if(s.y>h){s.y-=h;s.x=rand(0,GW);}}
  S.neb=(S.neb+12*dt)%NEB.height;S.pl.y+=9*dt;if(S.pl.y>h+10){S.pl.i=(S.pl.i+1)%PLANETS.length;S.pl.y=-PLANETS[S.pl.i].height-40;S.pl.x=rand(0,GW-PLANETS[S.pl.i].width);}
  const px=Math.round(GW/2+Math.sin(S.t*0.9)*70),py=Math.round(S.sy+Math.sin(S.t*1.7)*S.sa);
  S.cd-=dt;if(S.cd<=0){S.cd=0.16;S.shots.push({x:px-14,y:py-20},{x:px+14,y:py-20});}
  for(const b of S.shots)b.y-=600*dt;S.shots=S.shots.filter(b=>b.y>-20);
  const keep=R;R={t:S.t,neb:S.neb,pl:S.pl,stars:S.stars};
  const gh=GH;GH=h;drawBg(g);GH=gh;R=keep;
  for(const b of S.shots){for(let k=6;k>=0;k--){g.fillStyle=k<2?'#ffffff':k<4?'#4adcf6':'#168fb8';g.fillRect(b.x-1,Math.round(b.y+k*2)-1,3,3);}}
  const sp=SHIPSPR[save.cur],fl=sp.fl[((S.t*14)|0)%sp.fl.length];
  g.drawImage(fl,px-sp.cx,py-sp.cy);g.drawImage(sp.img,px-sp.cx,py-sp.cy);
}
/* 11/16 作りこみ：画面の切りかえ（ドットの四角が斜めに小さくなって、新しい画面が出てくる）。切りかえそのものはすぐ（操作を待たせない）。
   キャンバスの1点＝画面の8px・6点のマス。前の端は少し明るい色 */
const wipeCv=document.createElement('canvas');wipeCv.id='wipe';wipeCv.setAttribute('aria-hidden','true');document.body.appendChild(wipeCv);
let wipeRaf=0;
function pixWipe(ms){
  SFX.play('wipe');if(RM())return;ms=ms||380;
  const cell=8,B=6,cw=Math.ceil(innerWidth/cell),ch=Math.ceil(innerHeight/cell);
  wipeCv.width=cw;wipeCv.height=ch;wipeCv.style.display='block';
  const g=wipeCv.getContext('2d'),cols=Math.ceil(cw/B),rows=Math.ceil(ch/B),span=Math.max(1,cols+rows-2),t0=performance.now();
  cancelAnimationFrame(wipeRaf);
  const step=()=>{const t=(performance.now()-t0)/ms;g.clearRect(0,0,cw,ch);
    if(t>=1){wipeCv.style.display='none';return;}
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const p=Math.min(1,Math.max(0,(t-(c+r)/span*0.55)/0.45));if(p>=1)continue;
      const sz=Math.round((1-p)*B);if(sz<=0)continue;const o=(B-sz)>>1;g.fillStyle=p>0.05&&p<0.4?'#2e3277':'#080a1c';g.fillRect(c*B+o,r*B+o,sz,sz);}
    wipeRaf=requestAnimationFrame(step);};
  step();
}
function showTitle(){pixWipe();commHide();BGM.play('title');
  hangar.hidden=true;sortie.hidden=true;$('howto').hidden=true;$('resetAsk').hidden=true;titleEl.hidden=false;
  titleBg();renderSnd();if(!tRaf){tLast=performance.now();tRaf=requestAnimationFrame(titleFrame);}
}
function toHangarFromTitle(){pixWipe();BGM.play('hangar');titleEl.hidden=true;$('howto').hidden=true;hangar.hidden=false;tutReset();view=save.cur;layoutEditor();const got=checkAch();renderAll();if(got.length)toast(got.length>2?'実績を'+got.length+'個達成 ＋'+got.reduce((n,x)=>n+x.g,0)+'G':achText(got));}
/* 音の ON・OFF：BGM（save.bgm）と効果音（save.snd）べつべつ */
function sndLabel(k){return k==='bgm'?'BGM '+(bgmOn()?'ON':'OFF'):'SE '+(save.snd===false?'OFF':'ON');}
function sndToggle(k){if(save.bgm===undefined)save.bgm=bgmOn();if(k==='bgm')save.bgm=!save.bgm;else save.snd=save.snd===false;persist();SFX.unlock();BGM.kick();SFX.play('btn');}
function renderSnd(){[['bgmBtn','bgm'],['sndBtn','se']].forEach(([id,k])=>{const b=$(id);b.textContent=sndLabel(k);b.setAttribute('aria-pressed',/OFF/.test(b.textContent)?'false':'true');});}
$('bgmBtn').addEventListener('click',()=>{sndToggle('bgm');renderSnd();});
$('sndBtn').addEventListener('click',()=>{sndToggle('se');renderSnd();});
$('startBtn').addEventListener('click',()=>{SFX.play('start');if(!save.howto)openHowto(true);else toHangarFromTitle();});
$('howBtn').addEventListener('click',()=>openHowto(false));
$('toTitle').addEventListener('click',showTitle);
window.addEventListener('resize',()=>{if(!titleEl.hidden)titleBg();});

/* 遊び方（絵つき4枚・1回目のスタートのときにも出す） */
const HOWTO=[
  {t:'指でなぞって動く'},
  {t:'撃つのは自動'},
  {t:'レベルアップで強くなる'},
  {t:'お金で買って組み合わせる'},
];
let howPage=0,howFirst=false;
function howArt(i){
  const c=document.createElement('canvas');c.width=160;c.height=110;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
  g.fillStyle='#05060f';g.fillRect(0,0,160,110);g.drawImage(NEB,0,200,160,110,0,0,160,110);
  const sp=SHIPSPR.standard,DS2=(s,x,y)=>g.drawImage(s.img||s,Math.round(x-(s.w||s.width)/2),Math.round(y-(s.h||s.height)/2));
  const sh=(x,y,k)=>{g.save();g.translate(x,y);g.scale(k,k);g.drawImage(sp.fl[0],-sp.cx,-sp.cy);g.drawImage(sp.img,-sp.cx,-sp.cy);g.restore();};
  if(i===0){sh(64,60,0.75);g.drawImage(FINGER.img,118,64,24,30);}
  if(i===1){sh(80,82,0.62);DS2(ESPR.bug,50,22);DS2(ESPR.bug,110,16);DS2(ESPR.shooter,82,20);
    for(const x of [70,90])for(let y=40;y<64;y+=9){g.fillStyle='#4adcf6';g.fillRect(x,y,3,6);g.fillStyle='#fff';g.fillRect(x+1,y,1,2);}}
  if(i===2){[[40,50],[60,64],[50,82],[76,44]].forEach(([x,y])=>DS2(GEMS,x,y));DS2(GEMB,70,78);
    g.fillStyle='#14163a';g.fillRect(96,20,56,72);g.strokeStyle='#2e3277';g.lineWidth=2;g.strokeRect(97,21,54,70);
    g.fillStyle='#5aa2ff';for(let k=0;k<3;k++){g.fillRect(104,32+k*20,10,10);g.fillStyle=k?'#2e3277':'#ffd23f';g.fillRect(118,35+k*20,26,4);g.fillStyle='#5aa2ff';}}
  if(i===3){sh(52,58,0.7);DS2(MISC.coin,110,22);DS2(MISC.coin,126,30);DS2(MISC.coin,98,32);
    DS2(MSPR.missile[0],104,66);DS2(MSPR.shield[0],132,66);DS2(MSPR.sword[1],118,92);}
  return c;
}
function renderHowto(){
  const box=$('howCard'),p=HOWTO[howPage];box.textContent='';
  const art=howArt(howPage);art.className='howart';art.setAttribute('aria-hidden','true');
  box.append(art,el('h3',null,p.t));/* 11/16 総点検：上の「1 / 4」は下の点と同じなので出さない */
  const dots=el('div','howdots');HOWTO.forEach((_,k)=>dots.appendChild(el('i',k===howPage?'on':null)));box.appendChild(dots);
  $('howPrev').disabled=howPage===0;
  $('howNext').textContent=howPage<HOWTO.length-1?'次へ':howFirst?'はじめる':'とじる';
}
function openHowto(first){howFirst=first;howPage=0;$('howto').hidden=false;renderHowto();}
$('howPrev').addEventListener('click',()=>{if(howPage>0){howPage--;renderHowto();}});
$('howNext').addEventListener('click',()=>{
  if(howPage<HOWTO.length-1){howPage++;renderHowto();return;}
  save.howto=1;persist();$('howto').hidden=true;if(howFirst)toHangarFromTitle();
});
/* 最初から（11/25）：たしかめてからセーブを消す。消したら同じ窓で知らせて、とじるとタイトルのまま */
let resetDone=false;
function openReset(){resetDone=false;$('resetMsg').textContent='セーブを消して、最初から始めます。\nお金も装備も研究所も、すべて消えます。';
  $('resetNo').hidden=false;$('resetYes').textContent='消す';$('resetAsk').hidden=false;}
$('resetBtn').addEventListener('click',openReset);
$('resetNo').addEventListener('click',()=>{$('resetAsk').hidden=true;});
$('resetYes').addEventListener('click',()=>{
  if(resetDone){$('resetAsk').hidden=true;return;}
  resetSave();renderSnd();resetDone=true;$('resetMsg').textContent='セーブを消しました。';$('resetNo').hidden=true;$('resetYes').textContent='とじる';
});
/* 最初のタップで音を始める・ボタンの音 */
document.addEventListener('pointerdown',()=>SFX.unlock(),{capture:true});
document.addEventListener('click',e=>{SFX.unlock();const b=e.target.closest&&e.target.closest('button');if(!b||b.disabled)return;
  if(b.id==='startBtn'||b.id==='sndBtn'||b.id==='bgmBtn'||b.id==='launchBtn'||b.classList.contains('buybig'))return;SFX.play('btn');},{capture:true});

/* タイトルのロゴ（11/17・表紙と同じ形）：DotGothic16 の点を太くした形を持っておき、5段の色・ふち・厚みで描く（字の読みこみに頼らない）。
   形は tools/cover/cover.js の mask() で作った。[1点の大きさ, 行] */
const LOGO=[[4,['00000000000101100000011100000000000000000000000000000000000000000000000000000000','00011000001010110000011100000000000011110010110000000000000000000001110000111000','00011000001010110000011100000000000000011101011000000111111100000001110000111000','00011000001100000000111000000000000000000000101100011101101111000001110000111000','00011000001100000000111000000000000000000000000000111001110011100001110000111000','11111111111111100001110000000000000001100000000001110001110011101111111111111111','00011000001100000001110000000000000000111000000001110011100001110001110000111000','00011000001100000011011110000111001100001101100011100011100001110001110000111000','00011000001100000011110111000111001100000110110011100011100001110001110000111000','00011000001100000011110111000111011000000110110011100111000001110001110000111000','00011001111000000111100111001110011000000110011011100111000001110001110111110000','00011000000000000111000111001110110000000110011011101110000011100001110000000000','00001100000000001110000111011100110110001100011001101110000011100000111000000000','00000111111110001110000011111000000011111000000000111100001111000000011111111100','00000000000000000000000000000000000000000000000000000001111100000000000000000000']],
  [6,['00000000000000000000000000000000000000000001110','00111000000000000000000000000000000000000011011','00001110000000000000000000000001111111111111011','00000011000000000000110000000000000000000011110','11100000000011000110011000011000000000000011000','00111000000011000011001100011000000000000011000','00001100000011000001101100011000000000000110000','00000000000110000001100000011000000000000110000','00000000000110000000000000110000000000001100000','00000000001100000000000000110000000000001100000','00000000011000000000000001100000000000011000000','00000001110000000000000011000000000001110000000','00001111000000000000001110000000000111000000000','01111000000000000001111000000000111100000000000']]];
function drawLogo(){const cv=$('logoCv');if(!cv)return;
  const P={edge:'#12060a',deep:'#5a2206',side:'#a84c0c',hi:'#ffffff',lo:'#c4600e',face:['#fffbe0','#ffe873','#ffd23f','#f5a623','#e8841a']},D=2,gap=2;
  const L=LOGO.map(([s,rows])=>({s,rows,w:rows[0].length,h:rows.length,o:Math.max(2,Math.round(s*0.5))}));
  const W=Math.max(...L.map(l=>l.w*l.s+l.o*2)),H=L.reduce((n,l)=>n+(l.h+D)*l.s+l.o*2,0)+gap*(L.length-1);
  cv.width=W;cv.height=H;cv.style.width=W+'px';const g=cv.getContext('2d');let top=0;
  for(const l of L){const {s,rows,w,h,o}=l,ox=Math.round((W-w*s)/2),oy=top+o,on=(x,y)=>y>=0&&y<h&&rows[y][x]==='1';
    g.fillStyle=P.edge;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(on(x,y))g.fillRect(ox+x*s-o,oy+y*s-o,s+o*2,s+o*2+D*s);
    for(let d=D;d>=1;d--){g.fillStyle=d===D?P.deep:P.side;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(on(x,y))g.fillRect(ox+x*s,oy+(y+d)*s,s,s);}
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(!on(x,y))continue;g.fillStyle=!on(x,y-1)?P.hi:!on(x,y+1)?P.lo:P.face[Math.min(4,Math.floor(y/h*5))];g.fillRect(ox+x*s,oy+y*s,s,s);}
    top+=(h+D)*s+o*2+gap;}
}
drawLogo();
document.querySelectorAll('.gname').forEach(e=>{e.textContent=GAME_NAME;});
layoutEditor();renderAll();showTitle();gcSync();
setTimeout(warmLazy,300);/* 残りの絵は、出撃していない間に少しずつ作る（#14） */
})();
