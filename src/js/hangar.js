/* ---------- hangar ---------- */
/* タップだけで使う（ドラッグはなし）：空いている場所の「＋」→ 下から一覧 → つく ／ ついている装備 → 向き（大きな矢印8つ）と外す */
const hangar=$('hangar'),sortie=$('sortie'),bay=$('bay'),edCv=$('editor'),ed=edCv.getContext('2d');
const SS=112,SC=56;
const ssCv=document.createElement('canvas');ssCv.width=SS;ssCv.height=SS;const ssg=ssCv.getContext('2d');
const FINGER=paint(16,20,[{m:'yel',r:2,p:[[5,0],[8,0],[8,9],[13,9],[15,12],[15,19],[3,19],[1,13],[3,10],[5,10]]},{m:'gold',r:1,p:[[8,10],[9,10],[9,14],[8,14]]}],{}),FINGERURL=FINGER.img.toDataURL();
/* ◀ ▶ ✕ と向きの矢印（#16）：文字の記号の代わりに、点で描いた小さな絵。1マスを画面の3〜4px で出す。
   l＝左（右は左右を反転）・x＝とじる・u＝上・ur＝右上（ほかの向きは90度ずつ回す） */
const PIXI={l:['...##','..##.','.##..','##...','.##..','..##.','...##'],
  x:['##...##','###.###','.#####.','..###..','.#####.','###.###','##...##'],
  u:['...#...','..###..','.#####.','#######','..###..','..###..','..###..'],
  ur:['..#####','....###','...####','..###.#','.###...','###....','.#.....']};
const pixRot=r=>r[0].split('').map((_,x)=>r.map((_,y)=>r[r.length-1-y][x]).join(''));/* 90度（時計回り） */
const PIXC={};
function pixUrl(key,col){const k=key+col;if(PIXC[k])return PIXC[k];
  let r=key==='r'?PIXI.l.map(t=>t.split('').reverse().join('')):PIXI[key];
  if(!r){const d=+key.slice(1);r=PIXI[d%2?'ur':'u'];for(let i=0;i<d>>1;i++)r=pixRot(r);}/* 'd0'〜'd7'：向き（ARROW_NAME の順） */
  const c=document.createElement('canvas');c.width=r[0].length;c.height=r.length;const g=c.getContext('2d');g.fillStyle=col;
  r.forEach((t,y)=>{for(let x=0;x<t.length;x++)if(t[x]==='#')g.fillRect(x,y,1,1);});return PIXC[k]=c.toDataURL();}
function pixIcon(key,k,col){const im=el('img','pix'),r=key==='x'||key[0]==='d'?7:5;im.alt='';im.src=pixUrl(key,col||'#eceaff');im.width=r*k;im.height=7*k;return im;}
/* かぎの絵（まだのステージ） */
const LOCKI=paint(14,16,[{m:'metal',r:1,f:g=>{g.beginPath();g.arc(6.5,6.5,5,Math.PI,0);g.lineTo(9.2,6.5);g.arc(6.5,6.5,2.6,0,Math.PI,true);g.closePath();g.fill();}},
  {m:'gold',r:2,p:[[0,7],[13,7],[13,15],[0,15]]},{m:'edark',r:1,flat:'#3a2604',p:[[6,9],[7,9],[7,13],[6,13]]}],{}).img.toDataURL();
let EV={dpr:1,k:1,ox:0,oy:0,W:1,H:1,css:1},noteT=0,view=save.cur,swipe=null,swipeAt=0;
const used=t=>save.load.reduce((n,v)=>n+(v&&v.t===t?1:0),0);
const avail=t=>save.owned[t]-used(t);
const defaultDir=(t,i)=>(t==='shield'||t==='sword'||t==='reflector'||t==='armor'||MODS[t].melee)?SLOTS[i].out:0;/* 近接は外向きから */
const haveShip=id=>save.ships[id].have;

function toast(msg){const n=$('note');n.textContent=msg;n.hidden=false;clearTimeout(noteT);noteT=setTimeout(()=>{n.hidden=true;},2200);}

function layoutEditor(){
  const r=bay.getBoundingClientRect();if(r.width<2||r.height<2)return;
  const dpr=Math.min(3,window.devicePixelRatio||1);
  const W=Math.round(r.width*dpr),H=Math.round(r.height*dpr);
  edCv.width=W;edCv.height=H;
  const top=52*dpr,bot=26*dpr,k=Math.max(1,Math.floor(Math.min(W-40*dpr,H-top-bot)/96));/* 96＝機体と装備が入る大きさ */
  EV={dpr,k,W,H,css:k/dpr,ox:Math.round((W-SS*k)/2),oy:Math.round(top+(H-top-bot-SS*k)/2)};
  drawEditor();
}
/* 枠（＋の丸）の場所：装備の絵のまんなかの点（絵の 11 列目＝機体の中心線と同じ列）にそろえる。
   11/16 しょーくん「船首の設置部分ズレてない？」→ 前は横に +0.5 で、丸が1点ぶん右にずれていた */
const slotCss=i=>{const s=SHIPS[view].slots[i];return [(EV.ox+(SC+s.x-0.5)*EV.k)/EV.dpr,(EV.oy+(SC+s.y+0.5)*EV.k)/EV.dpr];};
function drawEditor(){
  const own=haveShip(view),open=own||shipProg(view).ok,sp=SHIPSPR[view];
  ssg.clearRect(0,0,SS,SS);
  if(open){ssg.globalAlpha=own?1:0.55;ssg.drawImage(sp.fl[0],SC-sp.cx,SC-sp.cy);ssg.drawImage(sp.img,SC-sp.cx,SC-sp.cy);ssg.globalAlpha=1;}
  else ssg.drawImage(shipSil(view),SC-sp.cx,SC-sp.cy);
  if(own)save.ships[view].eq.forEach((v,i)=>{if(!v)return;const m=MSPR[v.t][v.d],s=SHIPS[view].slots[i];
    if(snapFx&&snapFx.i===i&&snapFx.view===view){drawSnap(m,SC+s.x,SC+s.y,MODS[v.t].c);return;}
    ssg.drawImage(m.img,SC+s.x-m.cx,SC+s.y-m.cy);});
  if(own&&popFx&&popFx.view===view)drawPop();
  const g=ed,{W,H,k,ox,oy,dpr}=EV;
  g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;g.fillStyle='#05060f';g.fillRect(0,0,W,H);
  g.fillStyle='#181b44';const step=k*6,dot=Math.max(1,Math.round(dpr));
  for(let y=oy%step;y<H;y+=step)for(let x=ox%step;x<W;x+=step)g.fillRect(Math.round(x),Math.round(y),dot,dot);
  g.imageSmoothingEnabled=false;g.drawImage(ssCv,ox,oy,SS*k,SS*k);
}
/* 11/16 作りこみ：装備がはまる動き（ガチャン）。上から少し大きく落ちて → つぶれて → はね返って → 止まる。白い光と火花つき。
   機体の絵の小さいキャンバスに描くので、のびちぢみもドットのまま。light＝向きを変えたとき（小さく・火花なし） */
let snapFx=null;
const SNAP_IN=240,SNAP_ALL=340;
const SNAPK=[[0,1.5,0.62,-9],[0.28,1.34,0.7,0],[0.52,0.86,1.18,0],[0.76,1.06,0.95,0],[1,1,1,0]];/* [時間の割合, 横, 縦, 上へのずれ] */
const SNAPL=[[0,1.22,0.82,-3],[0.35,0.9,1.1,0],[0.7,1.04,0.97,0],[1,1,1,0]];
const WHITEC=new WeakMap();
function whiteOf(img){let c=WHITEC.get(img);if(c)return c;c=document.createElement('canvas');c.width=img.width;c.height=img.height;const g=c.getContext('2d');
  g.drawImage(img,0,0);g.globalCompositeOperation='source-in';g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);WHITEC.set(img,c);return c;}
function snapAt(i,light){
  const t0=performance.now();
  snapFx={i,t0,view,light:!!light,sp:light?[]:Array.from({length:8},(_,k)=>({a:-Math.PI*(0.08+0.84*k/7)+(Math.random()-0.5)*0.3,v:34+Math.random()*30,w:k%3===0}))};
  SFX.play(light?'btn':'clank');
  if(!light&&!RM())setTimeout(()=>{const b=$('bay');b.classList.remove('fxshake');void b.offsetWidth;b.classList.add('fxshake');},SNAP_IN*SNAPK[1][0]);
  const run=()=>{if(!snapFx||snapFx.t0!==t0)return;drawEditor();if(performance.now()-t0<SNAP_ALL)requestAnimationFrame(run);else{snapFx=null;drawEditor();}};
  requestAnimationFrame(run);
}
function drawSnap(m,x,y,c){
  const ms=performance.now()-snapFx.t0,K=snapFx.light?SNAPL:SNAPK,p=Math.min(1,ms/SNAP_IN);
  let j=0;while(j<K.length-2&&p>K[j+1][0])j++;
  const [a0,sx0,sy0,dy0]=K[j],[a1,sx1,sy1,dy1]=K[j+1],u=Math.min(1,(p-a0)/((a1-a0)||1)),L=(q,w)=>q+(w-q)*u;
  const sx=L(sx0,sx1),sy=L(sy0,sy1),w=Math.max(1,Math.round(m.img.width*sx)),h=Math.max(1,Math.round(m.img.height*sy));
  const dx=Math.round(x-m.cx*sx),dy=Math.round(y-m.cy*sy+L(dy0,dy1));
  ssg.imageSmoothingEnabled=false;ssg.drawImage(m.img,dx,dy,w,h);
  const hit=SNAP_IN*K[1][0];
  if(ms>hit*0.6&&ms<hit+90){ssg.globalAlpha=Math.max(0,1-(ms-hit*0.6)/(hit*0.4+90));ssg.drawImage(whiteOf(m.img),dx,dy,w,h);ssg.globalAlpha=1;}
  const st=(ms-hit)/1000;
  if(st>0&&st<0.24)snapFx.sp.forEach(q=>{const px=Math.round(x+Math.cos(q.a)*q.v*st),py=Math.round(y+Math.sin(q.a)*q.v*st+90*st*st);
    ssg.globalAlpha=Math.max(0,1-st/0.24);ssg.fillStyle=q.w?'#ffffff':c;ssg.fillRect(px,py,q.w?2:1,q.w?2:1);});
  ssg.globalAlpha=1;
}
/* 11/16 作りこみ：装備を外したとき。いったん縦にのびて白く光り → 外へはね上がって、小さくなりながら消える（ドットのまま）。「カチャッ」の音 */
let popFx=null;const POP_MS=320;
function popAt(i,v){if(!v)return;SFX.play('unclank');if(RM())return;
  const t0=performance.now(),sx=SHIPS[view].slots[i].x;popFx={i,v,t0,view,dx:sx>2?1:sx<-2?-1:0};
  const run=()=>{if(!popFx||popFx.t0!==t0)return;drawEditor();if(performance.now()-t0<POP_MS)requestAnimationFrame(run);else{popFx=null;drawEditor();}};requestAnimationFrame(run);}
function drawPop(){
  const q=popFx,ms=performance.now()-q.t0,p=Math.min(1,ms/POP_MS),m=MSPR[q.v.t][q.v.d],s=SHIPS[view].slots[q.i];
  const a=0.18,pre=Math.min(1,p/a),f=p<a?0:(p-a)/(1-a);
  const sx=p<a?1-0.28*pre:1-0.55*f,sy=p<a?1+0.3*pre:1-0.55*f;
  const x=SC+s.x+q.dx*16*f,y=SC+s.y-30*f+34*f*f,w=Math.max(1,Math.round(m.img.width*sx)),h=Math.max(1,Math.round(m.img.height*sy));
  const dx=Math.round(x-m.cx*sx),dy=Math.round(y-m.cy*sy);
  ssg.imageSmoothingEnabled=false;ssg.globalAlpha=1-f*f;ssg.drawImage(m.img,dx,dy,w,h);
  if(p<a+0.12){ssg.globalAlpha=0.75*(1-Math.max(0,(p-a*0.5))/(a*0.5+0.12));if(ssg.globalAlpha>0)ssg.drawImage(whiteOf(m.img),dx,dy,w,h);}
  if(f>0&&f<0.7){ssg.globalAlpha=1-f/0.7;ssg.fillStyle='#cfd6ff';for(let k=0;k<5;k++){const ang=Math.PI*(0.15+0.7*k/4);ssg.fillRect(Math.round(SC+s.x+Math.cos(ang)*12*f),Math.round(SC+s.y+Math.sin(ang)*9*f),1,1);}}
  ssg.globalAlpha=1;
}
const RM=()=>{if(window.__NOFX)return true;try{return matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){return false;}};
function renderSlots(){
  const box=$('slots');box.textContent='';
  const own=haveShip(view);
  if(own)SHIPS[view].slots.forEach((s,i)=>{
    const v=save.load[i],b=el('button','slotb '+(v?'full':'empty'),v?null:'＋');b.type='button';
    const [x,y]=slotCss(i);b.style.left=x+'px';b.style.top=y+'px';
    b.setAttribute('aria-label',s.name+(v?'：'+MODS[v.t].name+'（'+ARROW_NAME[v.d]+'向き）':'：あいている'));
    b.addEventListener('click',()=>{if(performance.now()-swipeAt<350)return;v?openAim(i):openList(i);});
    box.appendChild(b);
  });
  tutGuide();
}
/* はじめの案内の段（0＝なし・1＝枠をタップ・4＝出撃をタップ。②一覧のレーザー・③向きは板の中で1のまま）。
   案内がまだのセーブは、格納庫に入るときにスタンダード機の装備を外して①から（tutReset）。つけたあとは④ */
function tutStep(){if(save.tut||!haveShip(view))return 0;if(save.load.some(Boolean))return stOpen(save.st||1)?4:0;return TYPES.some(t=>avail(t)>0)?1:0;}
const tutSlot=()=>save.load[0]?SHIPS[view].slots.findIndex((_,i)=>!save.load[i]):0;/* 機首（前に撃つ枠）から */
/* 前の版のセーブ（案内がまだ）：スタンダード機の装備を持ち物にもどして、①（機首の＋）からはじめる（11/16 しょーくん） */
function tutReset(){if(save.tut||!save.ships.standard.have)return;save.ships.standard.eq=emptyLoad('standard');setShip('standard');view='standard';persist();}
/* はじめの案内の見た目：押す所（① 枠・② 一覧のレーザー・③ 向きの矢印・④ 出撃）のまわりだけ明るくし、ほかは暗くして押せなくする。
   指は押す所の下（入らなければ上）に置いて、押す所に向かって動かす。毎フレーム場所を合わせる（tut=1 で止まる） */
const TUTB={d:''};
function tutGuide(){
  const d=$('tutDim');let tg=null,tk='';
  if(!save.tut&&save.load&&!hangar.hidden&&$('shopSheet').hidden&&$('labSheet').hidden&&$('title').hidden&&$('howto').hidden){
    const st=tutStep();
    /* 11/17：①の前に整備士のあいさつ（タップで次へ）。そのあいだは穴と指を出さない */
    if(st===1&&sheetBg.hidden&&!COMM.intro){if(COMM.key!=='intro')commShow(TALK.intro,{wait:true,key:'intro',pos:'bot',done:()=>{COMM.intro=1;}});if(!d.hidden)d.hidden=true;TUTB.d='';return;}
    if(!sheetBg.hidden){if(st===1){tg=sheet.querySelector('.tut');tk=tg&&tg.closest('.dirs')?'t3':'t2';}}
    else if(st===1){tg=$('slots').children[tutSlot()]||null;tk='t1';}
    else if(st===4){tg=$('launchBtn');tk='t4';}
  }
  if(!tg){if(!d.hidden)d.hidden=true;TUTB.d='';if(COMM.mode==='tip')commHide();return;}
  const r=tg.getBoundingClientRect();if(r.width<1){d.hidden=true;if(COMM.mode==='tip')commHide();return;}
  commTip(tk,r);
  if(d.hidden)d.hidden=false;
  const P=6,l=Math.round(r.left-P),t=Math.round(r.top-P),w=Math.round(r.width+P*2),h=Math.round(r.height+P*2),W=innerWidth,H=innerHeight;
  const f=$('tfinger'),fh=f.offsetHeight||64,down=t+h+fh+12>H,key=l+','+t+','+w+','+h+','+W+','+H+','+down;
  if(key===TUTB.d)return;TUTB.d=key;
  const [hole,...bk]=d.children,box=(e,x,y,a,b)=>{e.style.left=x+'px';e.style.top=y+'px';e.style.width=Math.max(0,a)+'px';e.style.height=Math.max(0,b)+'px';};
  box(hole,l,t,w,h);hole.style.borderRadius=getComputedStyle(tg).borderRadius==='50%'?'50%':'0';
  box(bk[0],0,0,W,t);box(bk[1],0,t+h,W,H-t-h);box(bk[2],0,t,l,h);box(bk[3],l+w,t,W-l-w,h);
  f.classList.toggle('down',down);
  f.style.left=clamp(r.left+r.width/2,64,W-64)+'px';f.style.top=(down?t-fh-4:t+h+4)+'px';
}
function tutLoop(){tutGuide();if(!save.tut)requestAnimationFrame(tutLoop);else{$('tutDim').hidden=true;if(COMM.mode==='tip')commHide();}}
/* ---------- 整備士の通信（11/17 しょーくん「吹き出しとキャラクターで世界観を守りつつ」「イメージはスターフォックスとかメタルギア」） ----------
   顔は MECH（ドット）。開くとザザッ → 文字は1字ずつ・口が動く・ピッ。
   セリフは TALK だけ。セリフの中だけは「！」と語りかけを使う（ほかの画面の文は言いきり。copy16 は TALK と #comm を見ない）
   ・wait：タップで次へ（全体を暗く・ほかは押せない）＝はじめのあいさつ
   ・tip：案内の段のひとこと（押す所は tutDim が開ける）。tutGuide が毎フレーム呼ぶので key が同じなら何もしない
   ・note：お知らせ（押せる所はそのまま。吹き出しをタップ／しばらくで次へ）＝解放のお知らせ
   ・研究所のはじめては wait（11/17 しょーくん：自動で進むと聞き逃す） */
const TALK={
  name:'整備士 サラ',
  intro:['格納庫へようこそ！\n整備士のサラだよ。\n機体の整備はまかせて！','さっそく出撃準備だ！\nまずは機体に\n武器をつけよう！'],
  t1:'機首の＋をタップ！\nここが武器を\nつける場所だよ。',
  t2:'持っている武器は\nこのレーザー1つ。\nえらんで！',
  t3:'次は撃つ向き。\n敵は前から来るから\n上向きにしよう！',
  t4:'装備完了！\n出撃をタップして……\n行ってらっしゃい！',
  ship:(n,k)=>'「'+n+'」'+(k>1?'ほか'+(k-1)+'機':'の')+'\n設計図が届いたよ！\nショップで買えるよ。',
  item:(n,k)=>'「'+n+'」'+(k>1?'\nほか'+(k-1)+'つが入荷したよ！\n':'が\nショップに入荷したよ！\n')+'見てみて！',
  lab:k=>'研究所に新しい研究が\n'+k+'つ増えたよ！\nのぞいてみて！',
  stage:n=>'「'+n+'」への\n航路がひらいたよ！\n準備ができたら行こう！',
  labIntro:['ここは研究所！\nGを使って、ずっと\n続く強化ができるよ。','新しい研究は、\n出撃で条件を満たすと\n増えていくからね！'],
};
const COMM={mode:'',key:'',lines:null,k:0,i:0,timer:0,wait:0,done:null,intro:0,pend:null,typing:false,sid:0};
function commFace(open){const c=$('cfaceCv');if(c.width!==MECH.w){c.width=MECH.w;c.height=MECH.h;}const g=c.getContext('2d');g.clearRect(0,0,c.width,c.height);g.drawImage(open?MECH.open:MECH.shut,0,0);}
/* 開くときのノイズ（ドットの砂あらし）→ 顔 */
function commStatic(ms,then){const c=$('cfaceCv');if(c.width!==MECH.w){c.width=MECH.w;c.height=MECH.h;}const g=c.getContext('2d'),t0=performance.now(),id=COMM.sid;
  const step=()=>{if(COMM.sid!==id||!COMM.mode)return;/* 開き直したら古いノイズは止める */const im=g.createImageData(c.width,c.height),D=im.data;
    for(let p=0;p<D.length;p+=4){const v=Math.random()*150|0,y=(p/4/c.width)|0,dim=y%2?0.6:1;D[p]=v*0.5*dim;D[p+1]=v*0.8*dim;D[p+2]=(v+60)*dim;D[p+3]=255;}
    g.putImageData(im,0,0);if(performance.now()-t0<ms)requestAnimationFrame(step);else then();};
  step();}
function commShow(lines,o){
  o=o||{};const box=$('comm');clearInterval(COMM.timer);clearTimeout(COMM.wait);COMM.sid++;
  Object.assign(COMM,{mode:o.wait?'wait':o.note?'note':'tip',key:o.key||'',lines,k:0,done:o.done||null});
  box.className='comm '+(o.pos==='top'?'cmtop':'cmbot')+(o.wait?' wait':o.note?' note':'');box.hidden=false;$('cname').textContent=TALK.name;
  if(RM()){commLine();return;}
  void box.offsetWidth;box.classList.add('fxin');SFX.play('comm');$('ctext').textContent='';$('cnext').hidden=true;commStatic(150,commLine);
}
function commLine(){
  clearInterval(COMM.timer);clearTimeout(COMM.wait);
  const txt=COMM.lines[COMM.k],T=$('ctext');$('cnext').hidden=true;COMM.i=0;
  if(RM()){T.textContent=txt;commFace(0);commEnd();return;}
  const done=document.createTextNode(''),rest=el('i');T.textContent='';T.append(done,rest);rest.textContent=txt;COMM.typing=true;
  COMM.timer=setInterval(()=>{COMM.i++;done.data=txt.slice(0,COMM.i);rest.textContent=txt.slice(COMM.i);const ch=txt[COMM.i-1],say=ch&&!/[\s。、！？…「」]/.test(ch);
    if(say&&COMM.i%2)SFX.play('talk');commFace(say&&(COMM.i>>1)%2===0);
    if(COMM.i>=txt.length){clearInterval(COMM.timer);commFace(0);commEnd();}},38);
}
function commEnd(){
  COMM.typing=false;const last=COMM.k>=COMM.lines.length-1;
  $('cnext').hidden=COMM.mode==='tip'||(COMM.mode==='note'&&last);
  if(COMM.mode==='note')COMM.wait=setTimeout(commTap,last?3600:2800);
}
/* タップ：文のとちゅうなら全部出す → 次の文 → 終わり */
function commTap(){
  if(!COMM.mode||COMM.mode==='tip')return;
  if(COMM.typing){clearInterval(COMM.timer);$('ctext').textContent=COMM.lines[COMM.k];commFace(0);commEnd();return;}
  if(COMM.k<COMM.lines.length-1){COMM.k++;commLine();return;}
  const f=COMM.done;commHide();if(f)f();
}
const commOff=k=>{if(COMM.key===k)commHide();};
function commHide(){clearInterval(COMM.timer);clearTimeout(COMM.wait);COMM.sid++;COMM.typing=false;COMM.mode='';COMM.key='';$('comm').hidden=true;$('comm').classList.remove('fxin');}
/* 案内の段：押す所にかからない側（上か下）に出す。板が開いているときは上 */
function commTip(tk,r){
  if(COMM.key===tk&&COMM.mode==='tip')return;
  const ch=136,H=innerHeight,canTop=r.top>ch,canBot=r.bottom<H-ch;
  const up=!sheetBg.hidden||r.top+r.height/2>H*0.55;/* 板（下から）が開いているときと、押す所が下のほうなら上に */
  commShow([TALK[tk]],{key:tk,pos:up?(canTop?'top':'bot'):(canBot?'bot':'top')});
}
/* 出撃の結果で解放されたもの → 格納庫にもどったときに知らせる（多くて3つ） */
function talkUnl(ships,items,labs,stage){
  const L=[];if(ships.length)L.push(TALK.ship(SHIPS[ships[0]].name,ships.length));if(items.length)L.push(TALK.item(MODS[items[0]].name,items.length));
  if(labs.length)L.push(TALK.lab(labs.length));if(stage)L.push(TALK.stage(stage));return L.length?L.slice(0,3):null;
}
function commPend(){if(!COMM.pend)return;const L=COMM.pend;COMM.pend=null;commShow(L,{note:true,key:'unl',pos:'top'});}
/* wait は画面のどこを押しても次へ。note は吹き出し（窓）を押すと次へ（ほかの所を押しても進めない・11/17 しょーくん「自動で消えるか、吹き出しタップでいいよ」） */
$('comm').addEventListener('click',e=>{if(COMM.mode==='wait'||(COMM.mode==='note'&&e.target.closest('.cmwin')))commTap();});
function renderEquip(){
  const own=haveShip(view),sh=SHIPS[view],pg=shipProg(view);
  $('shipName').textContent=sh.name;$('shipName').style.color=own||pg.ok?sh.c:'var(--dim)';$('shipSkill').textContent=sh.desc;
  const dots=$('dots');dots.textContent='';SHIP_IDS.forEach(id=>dots.appendChild(el('i',id===view?'on':null)));
  const lb=$('lockbox');lb.textContent='';lb.hidden=own;
  if(!own){
    if(pg.ok){lb.append(el('p',null,'解放ずみ・'+sh.price+'G で買える'));const b=el('button','btn3','ショップで見る');b.type='button';b.addEventListener('click',()=>openShop(view));lb.appendChild(b);}
    else{lb.append(el('p',null,'解放の条件：'+sh.unlock.txt));const pr=el('div','prog'),bar=el('i');bar.style.width=(pg.cur/pg.n*100)+'%';pr.appendChild(bar);lb.append(pr,el('p','dim num',pg.cur+' / '+pg.n));}
  }
  drawEditor();renderSlots();
  const any=own&&save.load.some(Boolean),btn=$('launchBtn'),op=stOpen(save.st||1);
  btn.disabled=!any||!op;btn.textContent=!own?'まだ持っていない機体':!op?'まだ解放されていない':any?'出撃':'＋に装備をつける';
  renderStage();
}
/* ステージのえらび方（#13）：まだのステージは、かぎの絵と解放の条件 */
function renderStage(){const n=save.st||1,S=STAGES[n-1],op=stOpen(n);
  $('stNo').textContent='ステージ'+n;$('stName').textContent=S.name;$('stLock').hidden=op;
  $('stDesc').textContent=op?S.desc:'ステージ'+(n-1)+'をクリアすると解放';
  $('stsel').classList.toggle('locked',!op);$('stPrev').disabled=n<=1;$('stNext').disabled=n>=STAGES.length;}
function stepStage(d){const n=clamp((save.st||1)+d,1,STAGES.length);if(n===(save.st||1))return;save.st=n;if(stOpen(n))persist();SFX.play('btn');renderEquip();
  if(!RM()){const si=document.querySelector('#stsel .stinfo');si.classList.remove('fxstr','fxstl');void si.offsetWidth;si.classList.add(d>0?'fxstr':'fxstl');}}/* 11/16 作りこみ：押した向きから入る */
function viewShip(id){view=id;if(haveShip(id)){setShip(id);persist();}closeSheet();renderAll();}
function stepShip(d){const i=SHIP_IDS.indexOf(view);viewShip(SHIP_IDS[(i+d+SHIP_IDS.length)%SHIP_IDS.length]);
  if(!RM()){const c=d>0?'fxinr':'fxinl';['editor','slots'].forEach(id=>{const e=$(id);e.classList.remove('fxinr','fxinl');void e.offsetWidth;e.classList.add(c);});
    const cap=document.querySelector('#bay .shipcap');if(cap){cap.classList.remove('fxinr','fxinl');void cap.offsetWidth;cap.classList.add(c);}SFX.play('swish');}}/* 11/16 作りこみ4：押した向きから機体が入る */
function renderAll(){
  $('goldNum').textContent=save.gold;
  /* 11/16：トップの図鑑と実績の数（○/○）は出さない（中で見られる） */
  if(!haveShip(view)&&!SHIPS[view])view=save.cur;
  renderEquip();
  if(!$('shopSheet').hidden)renderShop();
  if(!$('labSheet').hidden)renderLab();
}

/* 下から出る板 */
const sheetBg=$('sheetBg'),sheet=$('sheet');let sheetOn=null;
function openSheet(title,sub,c,onClose){
  sheet.textContent='';sheet.style.setProperty('--c',c||'var(--edge)');
  const h=el('h3');h.append(el('span',null,title));if(sub)h.append(el('small',null,sub));
  const x=el('button','x');x.appendChild(pixIcon('x',3));x.type='button';x.setAttribute('aria-label','とじる');x.addEventListener('click',closeSheet);h.appendChild(x);
  const was=!sheetBg.hidden;sheet.appendChild(h);sheetBg.hidden=false;sheetOn=onClose||null;if(!was)SFX.play('sheet');
  if(!RM()){fxRestart(sheet,'fxside');if(!was)fxRestart(sheetBg,'fxbg');}/* 11/16 作りこみ：板は横からスッと */
  return sheet;
}
/* 1回の動きをもう一度はじめから（同じ名前の class をつけなおす） */
function fxRestart(e,c){e.classList.remove(c);void e.offsetWidth;e.classList.add(c);}
/* 11/16 作りこみ4：数字をかぞえ上げる（「4:20」は秒で・「+120G」「2200体」「Lv 19」は数の所だけ）。delay のあと ms かけて、さいごは元の文字にもどす */
function countUp(e,delay,ms){
  if(RM()||!e)return;const txt=e.textContent,tm=/^(\d+):(\d\d)$/.exec(txt.trim());if(!tm&&!/\d/.test(txt))return;
  const tot=tm?(+tm[1])*60+(+tm[2]):0,t0=performance.now()+delay;
  const show=p=>{if(tm){const v=Math.round(tot*p);e.textContent=Math.floor(v/60)+':'+String(v%60).padStart(2,'0');}else e.textContent=txt.replace(/\d+/g,m=>String(Math.round(+m*p)));};
  show(0);const step=()=>{if(!e.isConnected)return;const p=Math.min(1,Math.max(0,(performance.now()-t0)/ms));if(p>=1){e.textContent=txt;return;}show(1-Math.pow(1-p,3));if(p>0)SFX.play('tick');requestAnimationFrame(step);};requestAnimationFrame(step);
}
/* お金の数を前の数から新しい数へ動かす（買ったとき） */
function rollNum(e,from,to,ms){if(RM()||!e||from===to)return;const t0=performance.now();ms=ms||360;
  const step=()=>{if(!e.isConnected)return;const p=Math.min(1,(performance.now()-t0)/ms);e.textContent=String(Math.round(from+(to-from)*(1-Math.pow(1-p,3))));if(p<1)requestAnimationFrame(step);else e.textContent=String(to);};requestAnimationFrame(step);}
/* 11/16 作りこみ：タイルを左上から敷く。場所の行＋列の順に少しずつ遅らせて、小さい所からぱっと置く。画面の外のものは動かさない・遅れは0.4秒まで */
function tilesIn(box,sel){
  if(RM()||!box)return;const items=[...box.querySelectorAll(sel)];if(!items.length)return;
  const rs=items.map(e=>e.getBoundingClientRect()),tops=[...new Set(rs.map(r=>Math.round(r.top)))].sort((a,b)=>a-b),lefts=[...new Set(rs.map(r=>Math.round(r.left)))].sort((a,b)=>a-b);
  items.forEach((e,k)=>{const r=rs[k];if(r.height<1||r.top>innerHeight+20)return;
    e.style.setProperty('--d',Math.min(0.4,(tops.indexOf(Math.round(r.top))+lefts.indexOf(Math.round(r.left)))*0.04)+'s');fxRestart(e,'fxtile');});
}
function closeSheet(){if(sheetBg.hidden)return;SFX.play('sheetx');
  if(!RM()){/* 11/16 作りこみ4：閉じるときは写しが横へスッと出ていく（中身はすぐ閉じる） */
    const g=sheetBg.cloneNode(true);g.removeAttribute('id');g.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));g.classList.remove('fxbg');g.classList.add('fxclose');g.setAttribute('aria-hidden','true');
    const gs=g.firstElementChild;gs.classList.remove('fxside');gs.querySelectorAll('.fxtile').forEach(e=>e.classList.remove('fxtile'));document.body.appendChild(g);gs.scrollTop=sheet.scrollTop;setTimeout(()=>g.remove(),240);}
  sheetBg.hidden=true;sheet.textContent='';const f=sheetOn;sheetOn=null;if(f)f();else if(!hangar.hidden)renderSlots();}
sheetBg.addEventListener('click',e=>{if(e.target===sheetBg)closeSheet();});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!sheetBg.hidden)closeSheet();});

function shortEff(t){const m=MODS[t];return m.eff||m.desc;}
function openList(i){
  const s=SLOTS[i],cur=save.load[i],tut=tutStep()===1;let tutAt=null;/* はじめの案内②：一覧の中で、つけられる品（レーザー）に印（tutGuide がそこだけ明るくする） */
  const sh=openSheet(s.name+'につける装備',cur?'いま：'+MODS[cur.t].name:null);
  const list=TYPES.filter(t=>save.owned[t]>0);
  if(!list.length)sh.appendChild(el('p','dim','まだ装備を持っていない'));/* すぐ下が「ショップで装備を買う」 */
  list.forEach(t=>{
    const m=MODS[t],a=avail(t),isCur=cur&&cur.t===t,b=el('button','irow'+(isCur?' now':''));b.type='button';b.style.setProperty('--c',m.c);
    const im=el('img');im.alt='';im.src=ICON[t];
    const mid=el('span');mid.append(el('b',null,m.name),el('small',null,shortEff(t)));
    b.append(im,mid,el('em',null,isCur?'つけている':'のこり '+a+'/'+save.owned[t]));
    b.disabled=!isCur&&a<=0;
    b.addEventListener('click',()=>{if(isCur){closeSheet();return;}mountAt(i,t);});
    sh.appendChild(b);
    if(tut&&!tutAt&&!b.disabled){b.classList.add('tut');tutAt=b;}
  });
  const go=el('button','btn3','ショップで装備を買う');go.type='button';go.addEventListener('click',()=>{closeSheet();openShop();});sh.appendChild(go);
  tilesIn(sh,'.irow');
}
/* 一覧で品をえらぶ → 向きのある品は、向きをえらんでからつける（11/16 しょーくん「必ず向き選択を挟む」）。向きに関係のない品はすぐつける */
function mountAt(j,t){
  const prev=save.load[j];
  if(avail(t)<=0&&!(prev&&prev.t===t)){toast(MODS[t].name+'はぜんぶつけている');return;}
  if(MODS[t].passive){putMod(j,t,prev?prev.d:defaultDir(t,j));return;}
  openDir(j,t);
}
function putMod(j,t,d){save.load[j]={t,d};persist();closeSheet();toast(SLOTS[j].name+'に'+MODS[t].name+'をつけた'+(MODS[t].passive?'':'（'+ARROW_NAME[d]+'向き）'));renderEquip();snapAt(j);}
/* 向きをえらぶ板（つける前）。矢印をタップでつける。まんなかは品の絵（いまの向き・はじめは前向きか外向き）。✕ でつけずに閉じる */
function openDir(j,t){
  const prev=save.load[j],m=MODS[t],d0=prev?prev.d:defaultDir(t,j),tut=tutStep()===1;
  const sh=openSheet(SLOTS[j].name+'：'+m.name,null,m.c);
  const grid=el('div','dirs');
  DIR_GRID.forEach(d=>{
    if(d<0){const c=el('span','mid'),im=el('img');im.alt='';im.src=MSPR[t][d0].url;c.appendChild(im);grid.appendChild(c);return;}
    const b=el('button');b.appendChild(pixIcon('d'+d,4,prev&&prev.d===d?'#ffd23f':null));b.type='button';b.setAttribute('aria-label',ARROW_NAME[d]+'向き');
    if(prev)b.setAttribute('aria-pressed',prev.d===d?'true':'false');
    if(tut&&d===d0)b.classList.add('tut');/* はじめの案内③：前向きの矢印だけ明るく */
    b.addEventListener('click',()=>putMod(j,t,d));grid.appendChild(b);});
  sh.appendChild(grid);tilesIn(grid,'button,.mid');
  sh.appendChild(el('p','dim','向いた方へ攻撃する'));
  const back=el('button','btn3','装備をえらびなおす');back.type='button';back.addEventListener('click',()=>{sheetOn=null;openList(j);});sh.appendChild(back);
}
const DIR_GRID=[7,0,1,6,-1,2,5,4,3];
function openAim(i){
  const v=save.load[i];if(!v)return;
  const m=MODS[v.t],sh=openSheet(SLOTS[i].name+'：'+m.name,null,m.c);
  const grid=el('div',m.passive?'dirs one':'dirs');/* 11/16 総点検：向きに関係のない品は矢印を出さない（絵だけ） */
  const draw=()=>{grid.textContent='';DIR_GRID.forEach(d=>{
    if(m.passive&&d>=0)return;
    if(d<0){const c=el('span','mid'),im=el('img');im.alt='';im.src=MSPR[v.t][v.d].url;c.appendChild(im);grid.appendChild(c);return;}
    const b=el('button');b.appendChild(pixIcon('d'+d,4,v.d===d?'#ffd23f':null));b.type='button';b.setAttribute('aria-label',ARROW_NAME[d]+'向き');b.setAttribute('aria-pressed',v.d===d?'true':'false');
    b.addEventListener('click',()=>{const ch=v.d!==d;v.d=d;persist();draw();drawEditor();if(ch)snapAt(i,true);});grid.appendChild(b);});};
  draw();sh.appendChild(grid);tilesIn(grid,'button,.mid');
  sh.appendChild(el('p','dim',m.passive?'向きに関係なく効く':'向いた方へ攻撃する'));
  const row=el('div','sbtns'),ch=el('button','btn3','装備をかえる'),off=el('button','btn3 warn','外す');ch.type='button';off.type='button';
  ch.addEventListener('click',()=>{sheetOn=null;openList(i);});
  off.addEventListener('click',()=>{const was=save.load[i];save.load[i]=null;persist();closeSheet();toast(SLOTS[i].name+'の'+m.name+'を外した');renderEquip();popAt(i,was);});
  row.append(ch,off);sh.appendChild(row);
}
/* 機体の性能の表（ふつうと同じ数字の行は、full でないときは出さない） */
const pcv=v=>(v>=1?'+':'')+Math.round((v-1)*100)+'%';
function shipRows(sh,full){
  const r=[['最大HP',String(Math.round(BASE_HP*sh.hp))],['速さ',pcv(sh.spd)],['吸い寄せ',pcv(sh.mag)],['連射',pcv(sh.rate)],['火力',pcv(sh.pow)],['お金',pcv(sh.gold)]].filter((v,i)=>full||i<4||(i===4?sh.pow:sh.gold)!==1);
  [['射程',sh.range],['範囲',sh.area],['爆発の威力',sh.boom],['経験値',sh.xp]].forEach(([k,v])=>{if(v)r.push([k,pcv(v)]);});
  if(sh.evade)r.push(['回避',Math.round(sh.evade*100)+'%']);
  return r;}
/* 11/16 総点検：機体の文は、くわしくとショップで同じ形（「能力：名前。説明」「必殺：名前。説明」・終わりの「。」はつけない） */
function shipText(sh){return ['能力：'+sh.skill.replace('：','。')+(sh.skill2?'。'+sh.skill2:''),'必殺：'+sh.sp.name+'。'+sh.sp.desc];}
function openInfo(){
  const sh=SHIPS[view],s=openSheet(sh.name+'の性能',null,sh.c);
  s.append(...shipText(sh).map(t=>el('p',null,t)));/* 機体の説明は格納庫の名前の下と同じなので出さない */
  const ul=el('ul','statl');
  shipRows(sh,true).concat([['装備の場所',sh.slots.length+'か所']]).forEach(([k,v])=>{const li=el('li');li.append(el('span',null,k),el('b','num',v));ul.appendChild(li);});
  s.appendChild(ul);
}/* 11/16：つけている装備（見ればわかる）と記録は出さない（しょーくん） */

/* 左右スワイプで機体を切りかえ */
bay.addEventListener('pointerdown',e=>{swipe={id:e.pointerId,x:e.clientX,y:e.clientY};});
bay.addEventListener('pointerup',e=>{if(!swipe||e.pointerId!==swipe.id)return;const dx=e.clientX-swipe.x,dy=e.clientY-swipe.y;swipe=null;
  if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.3){swipeAt=performance.now();stepShip(dx<0?1:-1);}});
bay.addEventListener('pointercancel',()=>{swipe=null;});

