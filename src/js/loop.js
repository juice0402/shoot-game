/* 背景：星3層（ちがう速さ）＋星雲＋遠くの惑星 */
const STAR_SP=[21,54,120];
function stars(dt){const B=bgOf(R.stg||1);for(const s of R.stars){s.y+=STAR_SP[s.l]*dt;if(s.y>GH){s.y-=GH;s.x=rand(0,GW);}}
  R.neb=(R.neb+B.sp*dt)%B.tile.height;
  if(B.pl){const p=R.pl,L=B.pl;p.i%=L.length;p.y+=11*dt;if(p.y>GH+10){p.i=(p.i+1)%L.length;const n=L[p.i];p.x=rand(-n.width*0.3,GW-n.width*0.7);p.y=-n.height-(L.length>1?rand(60,400):rand(400,900));}}
  if(R.bo)for(const o of R.bo){o.y+=o.v*dt;if(o.y>GH+30){o.y=-30;o.x=rand(-10,GW-10);}}
  if(R.SN&&(R.snow>0||R.SN.length)){if(R.snow>0)while(R.SN.length<90)R.SN.push({x:rand(0,GW+200),y:rand(-GH,0),v:rand(0.8,1.3)});
    for(const f of R.SN){f.x-=150*f.v*dt;f.y+=300*f.v*dt;if(f.y>GH){if(R.snow>0){f.y-=GH+20;f.x=rand(0,GW+200);}else f.dead=true;}}compact(R.SN);}}
function parts2(dt){for(const x of R.X){x.t+=dt;if(x.t>=x.dur)x.dead=true;}}
function compact(a){let j=0;for(let i=0;i<a.length;i++)if(!a[i].dead)a[j++]=a[i];a.length=j;}

function update(dt){
  R.t+=dt;R.inv-=dt;R.hurtFx-=dt;R.spInv-=dt;R.ghost-=dt;R.chill-=dt;
  if(R.winT>0){R.inv=Math.max(R.inv,0.5);R.winT-=dt;if(Math.random()<dt*10)addX(R.winX+rand(-90,90),R.winY+rand(-90,90),Math.random()<0.4?EXPL.b:EXPL.m,rand(0.5,0.9));
    if(R.winT<=0){R.winT=0;R.won=1;}}
  movePlayer(dt);spawn(dt);moveEnemies(dt);
  buildGrid();separate();
  fire(dt);support(dt);sup12(dt);moveBullets(dt);moveMissiles(dt);slashes(dt);defenses();weaponFx(dt);weapons6(dt);defs10(dt);spUpdate(dt);
  moveEB(dt);walls(dt);contact();gems(dt);items12(dt);parts(dt);parts2(dt);stars(dt);
  [R.E,R.B,R.M,R.S,R.EB,R.G,R.P,R.A,R.FX,R.W,R.MN,R.GV,R.Z,R.L,R.X,R.Q,R.PD,R.RG,R.RH,R.HL,R.C,R.TU,R.TR,R.ES,R.HO,R.MT,R.SH,R.CH,R.TC,R.LZ].forEach(compact);
  if(R.hp<=0){endRun(false,false);return;}
  if(R.won){if(grabChests()){openChest();return;}endRun(true,false);return;}/* 最終ボス（#13） */
  if(R.t>=RUN_LEN&&!R.final){R.t=RUN_LEN;if(grabChests()){openChest();return;}endRun(true,false);return;}/* 残った宝箱は終わる前に受け取る（#12 の点検） */
  if(R.chestQ>0)openChest();else if(R.pending>0)openLevelUp();/* 宝箱が先 */
}

/* drawing */
function px2(g,x,y){if(g===PXG)g.dot(Math.round(x)-1,Math.round(y)-1,2);else g.fillRect(Math.round(x)-1,Math.round(y)-1,2,2);}
function px3(g,x,y){if(g===PXG)g.dot(Math.round(x)-1,Math.round(y)-1,3);else g.fillRect(Math.round(x)-1,Math.round(y)-1,3,3);}
function arcPix(g,x,y,a,half,rad,c,al,step){
  const n=Math.ceil(half*2*rad/step);g.fillStyle=c;
  for(let i=0;i<=n;i++){const an=a-half+2*half*i/n;g.globalAlpha=al*((i+((R.t*12)|0))%4===0?1:0.75);px2(g,x+Math.cos(an)*rad,y+Math.sin(an)*rad);}
  g.globalAlpha=1;
}
const STARC=['#2c3060','#6a70b8','#dfe6ff'];
const DS=(g,s,x,y)=>g.drawImage(s.img,Math.round(x)-s.cx,Math.round(y)-s.cy);
function drawBg(g){
  const B=bgOf(R.stg||1),T=B.tile,nh=T.height,oy=Math.floor(R.neb%nh);
  for(let y=oy-nh;y<GH;y+=nh)g.drawImage(T,0,y);
  if(B.pl){const p=R.pl;g.drawImage(B.pl[p.i%B.pl.length],Math.round(p.x),Math.round(p.y));}
  if(R.bo&&B.obj)drawBo(g,B);
  if(B.noStars)return;
  for(const s of R.stars){if(B.dimStars&&s.l===2)continue;g.fillStyle=STARC[s.l];
    if(s.l<2)g.fillRect(s.x|0,s.y|0,1,s.l);
    else{g.fillRect(s.x|0,s.y|0,2,2);if(Math.sin(R.t*2.5+s.tw)>0.82){g.globalAlpha=0.6;g.fillRect((s.x|0)-2,(s.y|0),6,1);g.fillRect((s.x|0),(s.y|0)-2,1,6);g.globalAlpha=1;}}}
}
/* 背景の流れる物（#13）：遠くの岩・氷のかけら・遠くの赤い目（ときどきまばたき） */
const FLC=['#2c5a74','#5a8eaa','#d4f0ff'];
function drawBo(g,B){
  if(B.obj==='rock')for(const o of R.bo){const s=B.rocks[o.l];g.drawImage(s.img,Math.round(o.x),Math.round(o.y));}
  else if(B.obj==='flake')for(const o of R.bo){g.fillStyle=FLC[o.l];const x=Math.round(o.x+Math.sin(R.t*0.7+o.w)*8),y=Math.round(o.y);
    if(o.l<2)g.fillRect(x,y,o.l+1,o.l+1);else{g.fillRect(x,y-1,1,3);g.fillRect(x-1,y,3,1);}}
  else if(B.obj==='eye')for(const o of R.bo){const ph=(R.t+o.bl)%7,f=ph<0.1?2:ph<0.22?1:0,x=Math.round(o.x),y=Math.round(o.y);
    g.globalAlpha=0.6*o.s;g.drawImage(B.eg,x+22-B.eg.width/2,y+10-B.eg.height/2);g.globalAlpha=0.22+0.2*o.s;g.drawImage(B.eye[f].img,x,y);g.globalAlpha=1;}
}
/* レーザーの壁：予告は点線（点めつ）と両はしの印 → 赤い帯と白い芯 */
function drawWalls(g){for(const w of R.LZ){const p=Math.round(w.p);
  if(!w.on){g.globalAlpha=((w.t*10)|0)%2?0.95:0.45;g.fillStyle='#ff6ccc';
    if(w.v)for(let y=0;y<GH;y+=8)g.fillRect(p-1,y,2,4);else for(let x=0;x<GW;x+=8)g.fillRect(x,p-1,4,2);
    g.globalAlpha=1;g.fillStyle='#ff4a5e';if(w.v){g.fillRect(p-7,0,14,5);g.fillRect(p-7,GH-5,14,5);}else{g.fillRect(0,p-7,5,14);g.fillRect(GW-5,p-7,5,14);}}
  else{const k=w.t<LZW+LZON?1:Math.max(0,1-(w.t-LZW-LZON)/0.15),hw=Math.max(1,Math.round(LZH*k)),L=[[0.45,'#a01632',hw+4],[0.9,'#ff4a5e',hw],[1,'#ffc0c8',Math.ceil(hw*0.45)],[1,'#ffffff',2]];
    for(const [a,c,r] of L){g.globalAlpha=a*k;g.fillStyle=c;if(w.v)g.fillRect(p-r,0,r*2,GH);else g.fillRect(0,p-r,GW,r*2);}g.globalAlpha=1;}}}
/* 吹雪：画面を少し白く・ななめに流れる雪 */
function drawSnow(g){g.fillStyle='rgba(228,240,255,'+(0.13*R.snow).toFixed(3)+')';g.fillRect(0,0,GW,GH);g.globalAlpha=0.8*R.snow;g.fillStyle='#ffffff';
  for(const f of R.SN){const x=Math.round(f.x),y=Math.round(f.y);g.fillRect(x,y,2,2);g.fillRect(x+2,y-4,1,3);}g.globalAlpha=1;}
/* 敵のまわりの印：まぼろしの出る所・角突きのねらい・深淵の核のまわりの玉 */
function drawEMark(g,e){
  if(e.hide){const q=e.tm/0.6,r=Math.round(8+q*16);if(((R.t*16)|0)%2)ringDots(g,e.x,e.y,r,'#e45e98',0.9,5);g.fillStyle='#ffc8ff';g.fillRect(Math.round(e.x)-1,Math.round(e.y)-1,3,3);return;}
  if(e.kind==='charger'&&e.st===1&&((R.t*12)|0)%2){g.fillStyle='#ff4a5e';g.globalAlpha=0.7;for(let i=1;i<14;i++)g.fillRect(Math.round(e.x+e.ax*i*11)-1,Math.round(e.y+e.ay*i*11)-1,3,3);g.globalAlpha=1;}
}
function drawShipAt(g,sh,mods,px,py,t){
  const fl=sh.fl[((t*14)|0)%sh.fl.length];g.drawImage(fl,px-sh.cx,py-sh.cy);
  g.drawImage(sh.img,px-sh.cx,py-sh.cy);
  for(const m of mods){const s=(R&&R.evo&&R.evo[m.t]?MSPRE[m.t]:MSPR[m.t])[m.d],mx=px+SLOTS[m.slot].x,my=py+SLOTS[m.slot].y;g.drawImage(s.img,mx-s.cx,my-s.cy);
    if(m.t==='cannon'&&m.cd<0.6&&!(R&&R.evo&&R.evo.cannon)){const a=dirAngle(m.d),q=1-Math.max(0,m.cd)/0.6,r=Math.round(1+q*4);
      g.fillStyle=(((t*24)|0)%2)?'#ffffff':'#5cffef';g.fillRect(Math.round(mx+Math.cos(a)*15)-r,Math.round(my+Math.sin(a)*15)-r,r*2,r*2);}}
}
/* 描く回数をへらす（11/17・#34）：出撃の画面の小さい四角（fillRect）は、まず手元の絵（PXG の中）に同じ計算で重ねて、
   ほかの描き方（絵・大きい四角・回転）の前と、描き終わりに、まとめて1回で画面へ出す。描く順番と色の重なり方は同じ（色の差は 1/255 ほど） */
const PXG=(()=>{
  const BH=32;/* 画面へ出すときは、32行ずつの帯で、描いた所の左右だけ。帯ごとに別のキャンバス（描いたあとに書きかえると、ブラウザが全体を写しなおすため） */
  const S=new Float64Array(6);/* 0 a・1〜3 色×a・4 1-a・5 globalAlpha（小数を数の箱にしない＝毎回メモリを作らない） */
  let dz=0,W=0,H=0,NB=0,F=null,T=null,TP=null,BC=[],BG=[],BI=[],BD=[],tn=0,BX0=null,BX1=null,b0=0,b1=-1;
  let fs='#000000',fc=[0,0,0,1],fsD=true,gaD=true,clean=true,sD=true;const st=[],COL=new Map();S[5]=1;
  /* 四角はまず書きとめる（OX〜OC）。出すときに、帯1つあたりの数が多ければ手元の絵に重ねて帯ごとに1回で出す。少なければ書きとめた順にそのまま描く（前と同じ）
     めやす（この機械）：小さい fillRect 1回 0.45µs・帯1つを出す 25µs・手元で重ねる 0.2µs → 帯1つに KB 回より多いときだけまとめる */
  const LOGMAX=16384,KB=80,OX=new Int32Array(LOGMAX),OY=new Int32Array(LOGMAX),OW=new Int32Array(LOGMAX),OH=new Int32Array(LOGMAX),OA=new Float64Array(LOGMAX),OF=new Array(LOGMAX),OC=new Array(LOGMAX);
  let on=0,nb=0;
  const col=s=>{let c=COL.get(s);if(c!==undefined)return c;c=null;let m;
    if(typeof s==='string'){
      if(s[0]==='#'&&s.length===7){const n=parseInt(s.slice(1),16);if(!isNaN(n))c=[n>>16&255,n>>8&255,n&255,1];}
      else if(s[0]==='#'&&s.length===4){const n=parseInt(s.slice(1),16);if(!isNaN(n))c=[(n>>8&15)*17,(n>>4&15)*17,(n&15)*17,1];}
      else if((m=/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?\)$/.exec(s))&&+m[1]<256&&+m[2]<256&&+m[3]<256)c=[+m[1],+m[2],+m[3],m[4]==null?1:Math.min(1,+m[4])];}
    if(COL.size>400)COL.clear();COL.set(s,c);return c;};
  const sync=()=>{if(fsD){ctx.fillStyle=fs;fsD=false;}if(gaD){ctx.globalAlpha=S[5];gaD=false;}};
  function resetBands(){for(let b=b0;b<=b1;b++){BX0[b]=W;BX1[b]=-1;}b0=NB;b1=-1;nb=0;}
  function flush(){if(!on)return;
    if(on<KB*nb){/* 少ない：書きとめた順にそのまま描く */
      let lf=null,la=-1;for(let i=0;i<on;i++){if(OF[i]!==lf){lf=OF[i];ctx.fillStyle=lf;}if(OA[i]!==la){la=OA[i];ctx.globalAlpha=la;}ctx.fillRect(OX[i],OY[i],OW[i],OH[i]);OF[i]=OC[i]=null;}
      on=0;fsD=gaD=true;resetBands();return;}
    const cf=fc,ca=S[5];/* 多い：順に手元の絵に重ねて、帯ごとに出す */
    for(let i=0;i<on;i++){if(OC[i]!==fc||OA[i]!==S[5]){fc=OC[i];S[5]=OA[i];sD=true;}put(OX[i],OY[i],OX[i]+OW[i],OY[i]+OH[i]);OF[i]=OC[i]=null;}
    on=0;fc=cf;S[5]=ca;sD=true;
    for(let j=0;j<tn;j++){const o=T[j]<<2,A=F[o+3],q=1/A,P=TP[j],d=BD[P>>>16],p=P&65535;
      d[p]=F[o]*q;d[p+1]=F[o+1]*q;d[p+2]=F[o+2]*q;d[p+3]=A*255;F[o]=F[o+1]=F[o+2]=F[o+3]=0;}
    if(S[5]!==1||gaD){ctx.globalAlpha=1;gaD=true;}
    for(let b=b0;b<=b1;b++){if(BX1[b]<0)continue;const x=BX0[b],w=BX1[b]-x+1,h=Math.min(BH,H-b*BH);
      BG[b].putImageData(BI[b],0,0,x,0,w,h);ctx.drawImage(BC[b],x,0,w,h,x,b*BH,w,h);}
    for(let j=0;j<tn;j++){const P=TP[j],d=BD[P>>>16],p=P&65535;d[p]=d[p+1]=d[p+2]=d[p+3]=0;}
    tn=0;resetBands();}
  function add(x,y,w,h){/* 書きとめる（画面の外は書かない）。帯の左右もここで広げる */
    const xa=x<0?0:x,ya=y<0?0:y,xb=x+w>W?W:x+w,yb=y+h>H?H:y+h;if(xa>=xb||ya>=yb||!(S[5]*fc[3]>0))return;
    const p=ya>>5,q=(yb-1)>>5;for(let b=p;b<=q;b++){if(BX1[b]<0)nb++;if(xa<BX0[b])BX0[b]=xa;if(xb-1>BX1[b])BX1[b]=xb-1;}if(p<b0)b0=p;if(q>b1)b1=q;
    OX[on]=x;OY[on]=y;OW[on]=w;OH[on]=h;OA[on]=S[5];OF[on]=fs;OC[on++]=fc;if(on===LOGMAX)flush();}
  function put(x,y,xe,ye){/* 手元の絵に四角を重ねる（canvas の source-over と同じ式） */
    if(sD){const a=S[5]*fc[3];S[0]=a;S[1]=fc[0]*a;S[2]=fc[1]*a;S[3]=fc[2]*a;S[4]=1-a;sD=false;}
    if(!(S[0]>0))return;
    const xa=x<0?0:x,ya=y<0?0:y,xb=xe>W?W:xe,yb=ye>H?H:ye;if(xa>=xb||ya>=yb)return;
    if(S[0]===1){const r=fc[0],gg=fc[1],bl=fc[2];
      for(let yy=ya;yy<yb;yy++){let o=(yy*W+xa)<<2;const P=((yy>>5)<<16)|((yy&31)*W<<2);
        for(let xx=xa;xx<xb;xx++,o+=4){if(F[o+3]===0){T[tn]=o>>2;TP[tn++]=P+(xx<<2);}F[o]=r;F[o+1]=gg;F[o+2]=bl;F[o+3]=1;}}}
    else{
      for(let yy=ya;yy<yb;yy++){let o=(yy*W+xa)<<2;const P=((yy>>5)<<16)|((yy&31)*W<<2);
        for(let xx=xa;xx<xb;xx++,o+=4){const A=F[o+3];
        if(A===0){T[tn]=o>>2;TP[tn++]=P+(xx<<2);F[o]=S[1];F[o+1]=S[2];F[o+2]=S[3];F[o+3]=S[0];}
        else{const k=S[4];F[o]=F[o]*k+S[1];F[o+1]=F[o+1]*k+S[2];F[o+2]=F[o+2]*k+S[3];F[o+3]=A*k+S[0];}}}}}
  const G={
    begin(){const w=ctx.canvas.width,h=ctx.canvas.height;if(w!==W||h!==H){W=w;H=h;NB=Math.ceil(H/BH);F=new Float32Array(W*H*4);T=new Int32Array(W*H);TP=new Int32Array(W*H);/* TP＝帯の番号<<16＋帯の中の場所（W×32×4 が 65536 より小さいこと：W＝GW＝480） */
      BX0=new Int32Array(NB).fill(W);BX1=new Int32Array(NB).fill(-1);BC=[];BG=[];BI=[];BD=[];
      for(let b=0;b<NB;b++){const c=document.createElement('canvas');c.width=W;c.height=BH;const g=c.getContext('2d');BC.push(c);BG.push(g);const d=g.createImageData(W,BH);BI.push(d);BD.push(d.data);}
      tn=0;b0=NB;b1=-1;}
    else if(on||tn){/* 前のフレームが途中で止まった（エラー）ときの残りは捨てる */
      for(let j=0;j<tn;j++){const o=T[j]<<2;F[o]=F[o+1]=F[o+2]=F[o+3]=0;}BX0.fill(W);BX1.fill(-1);tn=0;b0=NB;b1=-1;nb=0;OF.fill(null);OC.fill(null);}
      on=0;
      fs=ctx.fillStyle;fc=col(fs);S[5]=ctx.globalAlpha;fsD=gaD=false;sD=true;clean=true;dz=0;st.length=0;},
    end(){flush();sync();dz=0;},
    dense(on){if(!on)flush();dz=on?1:0;},
    get fillStyle(){return fs;},
    set fillStyle(v){if(v===fs)return;let c=col(v);if(c===null){flush();sync();ctx.fillStyle=v;v=ctx.fillStyle;c=col(v);fsD=false;}else fsD=true;fs=v;fc=c;sD=true;},
    get globalAlpha(){return S[5];},
    set globalAlpha(v){if(v>=0&&v<=1&&v!==S[5]){S[5]=v;gaD=true;sD=true;}},
    fillRect(x,y,w,h){
      if(w<0){x+=w;w=-w;}if(h<0){y+=h;h=-h;}
      if(dz&&clean&&fc!==null&&(x|0)===x&&(y|0)===y&&(w|0)===w&&(h|0)===h&&w*h<=144){if(w&&h)add(x,y,w,h);return;}
      flush();sync();ctx.fillRect(x,y,w,h);},
    dot(xa,ya,n){/* px2・px3 の四角（左上 xa,ya は丸めたあとの整数・n×n）。小数を渡さない（数の箱を作らない） */
      if(!dz||!clean||fc===null){this.fillRect(xa,ya,n,n);return;}
      if(xa>-n&&xa<W&&ya>-n&&ya<H)add(xa,ya,n,n);},
    drawImage(im,a,b,c,d,e,f,h,i){flush();sync();const n=arguments.length;/* arguments を配列にしない（毎回メモリを作らない） */
      if(n===3)ctx.drawImage(im,a,b);else if(n===5)ctx.drawImage(im,a,b,c,d);else ctx.drawImage(im,a,b,c,d,e,f,h,i);},
    save(){st.push(fs,fc,S[5],clean);ctx.save();},
    restore(){if(st.length){clean=st.pop();S[5]=st.pop();fc=st.pop();fs=st.pop();fsD=gaD=sD=true;}ctx.restore();},
  };
  for(const k of ['translate','rotate','scale','transform','setTransform','resetTransform','clip'])G[k]=function(){flush();clean=false;return ctx[k].apply(ctx,arguments);};
  const P=CanvasRenderingContext2D.prototype;
  for(const k of Object.getOwnPropertyNames(P)){if(k in G||k==='constructor')continue;const d=Object.getOwnPropertyDescriptor(P,k);
    if(typeof d.value==='function')G[k]=function(){flush();sync();return ctx[k].apply(ctx,arguments);};
    else if(d.get)Object.defineProperty(G,k,{get(){return ctx[k];},set(v){flush();sync();ctx[k]=v;clean=false;}});}
  return G;
})();
function draw(){
  const g=PXG;g.begin();
  g.globalAlpha=1;drawBg(g);
  for(const gm of R.G)DS(g,gm.big?GEMB:GEMS,gm.x,gm.y);
  for(const c of R.C)DS(g,COIN7,c.x,c.y);
  draw6Under(g);draw12Under(g,Math.round(R.x),Math.round(R.y));
  for(const o of R.GV){
    const rot=R.t*3;g.fillStyle='#a98bff';
    for(let i=0;i<18;i++){const an=rot+i*TAU/18,rr=o.r*(0.45+0.5*((i*7+((R.t*10)|0))%5)/5);g.globalAlpha=0.55;px2(g,o.x+Math.cos(an)*rr,o.y+Math.sin(an)*rr);}
    g.globalAlpha=1;if(o.bh)drawBH(g,o);else DS(g,GRAV,o.x,o.y);
  }
  for(const e of R.E){if(e.hide)continue;const gl=GLOW[e.art||e.kind];if(gl)g.drawImage(gl,Math.round(e.x)-(gl.width>>1),Math.round(e.y)-(gl.height>>1));}
  for(const e of R.E){if(e.hide||(e.kind==='charger'&&e.st===1)){drawEMark(g,e);if(e.hide)continue;}
    if(e.kind==='warp'&&e.st===1&&((R.t*20)|0)%2)continue;/* ゆらぐ */
    const s=e.sp||ESPR[e.art||e.kind],md=e.flash>0?'flash':(e.slow>0||e.frz>R.t)?'ice':'img';g.drawImage(s[md],Math.round(e.x)-s.cx,Math.round(e.y)-s.cy);
    if(e.kind==='turret'){const b=TBAR[dir16(e.fa)];g.drawImage(b[md],Math.round(e.x)-b.cx,Math.round(e.y)-b.cy);}
    else if(e.bt==='core')for(let i=0;i<6;i++){const a=e.oa+i*TAU/6;DS(g,ESPR.corb,e.x+Math.cos(a)*96,e.y+Math.sin(a)*96);}}
  if(R.sp)spDark(g);/* 必殺技：画面を少し暗くして、機体の色の光 */
  for(const n of R.MN)DS(g,(n.gold?GMINE:n.l8?MINE8:MINE)[((n.t*5)|0)%2],n.x,n.y);
  for(const w of R.W)DS(g,SAWS[w.big?1:0][((w.t*20)|0)%2],w.x,w.y);
  draw6Over(g);
  const px=Math.round(R.x),py=Math.round(R.y);
  g.dense(1);/* シールド・雷の印・振りはまとめて描く（#34） */
  for(const m of R.mods){
    if(m.t!=='shield'&&m.t!=='reflector')continue;
    const st=stat(m.t),ox=px+SLOTS[m.slot].x,oy=py+SLOTS[m.slot].y,a=dirAngle(m.d);
    if(m.t==='shield'){arcPix(g,ox,oy,a,st.half,st.R,'#c4ffe3',1,1.8);arcPix(g,ox,oy,a,st.half,st.R-3,'#5dffb0',0.55,1.8);arcPix(g,ox,oy,a,st.half,st.R-6,'#1fae63',0.35,2);}
    else{arcPix(g,ox,oy,a,st.half,st.R,'#ffffff',1,1.6);arcPix(g,ox,oy,a,st.half,st.R-2,'#b8bce0',0.8,1.6);arcPix(g,ox,oy,a,st.half,st.R-4,'#7d97cf',0.5,1.8);}
  }
  for(const f of R.FX){
    if(f.t<0.4){
      if(((f.t*14)|0)%2===0){const n=Math.ceil(TAU*f.r/3);g.fillStyle='#ffd23f';
        for(let i=0;i<n;i+=2){const an=i/n*TAU;px2(g,f.x+Math.cos(an)*f.r,f.y+Math.sin(an)*f.r);}
        g.fillRect(Math.round(f.x)-9,Math.round(f.y)-1,18,3);g.fillRect(Math.round(f.x)-1,Math.round(f.y)-9,3,18);}
    }else{
      const k=1-(f.t-0.4)/0.35,w=Math.max(2,Math.round(f.r*0.7*k)),x=Math.round(f.x);
      g.globalAlpha=Math.max(0,k)*0.6;g.fillStyle='#ff9f43';g.fillRect(x-w-3,0,w*2+6,Math.round(f.y));
      g.globalAlpha=Math.max(0,k);g.fillStyle='#ffd23f';g.fillRect(x-w,0,w*2,Math.round(f.y));
      g.fillStyle='#ffffff';g.fillRect(x-Math.ceil(w/2),0,Math.ceil(w/2)*2,Math.round(f.y));g.globalAlpha=1;
    }
  }
  for(const s of R.S){
    if(s.k||s.t<0)continue;
    const ox=px+SLOTS[s.m.slot].x+(s.m.cx||0),oy=py+SLOTS[s.m.slot].y+(s.m.cy||0),p=Math.min(1,s.t/s.dur);
    const fade=s.t>s.dur?Math.max(0,1-(s.t-s.dur)/0.1):1,a0=s.a-s.sweep/2,a1=a0+s.sweep*p,tail=Math.max(a0,a1-1.3);
    for(let rad=s.range,j=0;rad>s.range*0.5;rad-=2,j++){
      g.globalAlpha=fade*Math.max(0.25,1-j*0.07);
      const n=Math.max(1,Math.ceil((a1-tail)*rad/1.6));g.fillStyle=j===0?'#ffffff':j<3?'#e6dcff':j<6?'#a98bff':'#6a48e0';
      for(let i=0;i<=n;i++){const an=tail+(a1-tail)*i/n;px2(g,ox+Math.cos(an)*rad,oy+Math.sin(an)*rad);}}
    g.globalAlpha=1;}
  g.dense(0);
  const blink=R.inv>0&&R.ebT<=0&&R.ghost<=0&&((R.t*16|0)%2===0);
  if(R.sp)spUnder(g,px,py);
  if(!blink&&R.state!=='over'){
    if(R.ghost>0)g.globalAlpha=0.3;/* ファントム：すがたを消している間はうすく */
    drawShipAt(g,R.spr,R.mods,px,py,R.t);g.globalAlpha=1;
    if(R.bar){const n=72;g.fillStyle='#c4ffe3';
      for(let i=0;i<n;i++){const an=i/n*TAU;g.globalAlpha=((i+((R.t*10)|0))%3===0)?0.95:0.45;px2(g,px+Math.cos(an)*44,py+Math.sin(an)*46);}
      g.globalAlpha=1;}
  }
  for(const d of R.D)DS(g,DRONE,d.x,d.y);
  draw12Over(g,px,py);
  draw6Ship(g,px,py);draw10(g,px,py);if(R.sp||R.ES.length)spDraw(g,px,py);if(R.sh.focus&&R.focus>0.05)drawFocus(g,px,py);
  for(const a of R.A){const s=ALLY[a.vx>0?0:1];DS(g,s,a.x,a.y);
    const f=((R.t*20)|0)%2;g.fillStyle='#ffb032';g.fillRect(Math.round(a.x)-(a.vx>0?20+f*2:-16),Math.round(a.y)-1,3+f*2,3);g.fillStyle='#fff2a8';g.fillRect(Math.round(a.x)-(a.vx>0?18:-16),Math.round(a.y),2,1);}
  g.dense(1);/* 弾（#34） */
  for(const b of R.B){
    const sp=Math.hypot(b.vx,b.vy)||1,ux=b.vx/sp,uy=b.vy/sp;
    switch(b.k){
      case 1:for(let k=4;k>=0;k--){g.fillStyle=k<1?'#ffffff':k<3?'#5dffb0':'#1f8a5a';px3(g,b.x-ux*k*2,b.y-uy*k*2);}break;
      case 2:{const q=1-b.life/b.max,s=Math.round(3+q*7);g.globalAlpha=Math.max(0.15,1-q*0.85);g.fillStyle=q<0.25?'#ffffff':q<0.6?'#6af0ff':'#2f7fb8';
        g.fillRect(Math.round(b.x)-(s>>1),Math.round(b.y)-(s>>1),s,s);g.globalAlpha=1;break;}
      case 3:g.fillStyle='#5aaedc';px3(g,b.x-ux*4,b.y-uy*4);g.fillStyle='#e9f8ff';g.fillRect(Math.round(b.x)-1,Math.round(b.y)-3,3,6);g.fillRect(Math.round(b.x)-3,Math.round(b.y)-1,6,3);g.fillStyle='#ffffff';g.fillRect(Math.round(b.x),Math.round(b.y),1,1);break;
      case 4:for(let k=4;k>=0;k--){g.fillStyle=k<2?'#ffffff':'#b8bce0';px3(g,b.x-ux*k*2,b.y-uy*k*2);}break;
      case 5:g.fillStyle='#4588f2';px2(g,b.x-ux*3,b.y-uy*3);g.fillStyle='#e3eaff';px3(g,b.x,b.y);break;
      case 6:g.fillStyle='#ffcd48';px3(g,b.x,b.y);g.fillStyle='#ffffff';g.fillRect(Math.round(b.x),Math.round(b.y),1,1);break;
      case 7:case 8:case 9:case 10:case 11:case 12:case 13:case 14:case 15:case 16:case 17:case 18:case 19:drawB6(g,b,ux,uy);break;
      default:for(let k=6;k>=0;k--){g.fillStyle=k<2?'#ffffff':k<4?'#4adcf6':'#168fb8';px3(g,b.x-ux*k*2,b.y-uy*k*2);}
    }
  }
  g.dense(0);
  for(const ms of R.M)DS(g,(ms.sm?MICRO:ms.sw?SWARM:MISS)[((Math.round(ms.a/(Math.PI/8))%16)+16)%16],ms.x,ms.y);
  draw6Top(g);
  for(const l of R.L){const k=1-l.t/0.3;if(k<=0)continue;
    g.save();g.translate(l.x,l.y);g.rotate(Math.atan2(l.uy,l.ux));
    if(l.au){const W=l.w*k;/* 極光ビーム：紫・水色・緑の帯 */
      g.globalAlpha=k*0.5;g.fillStyle='#6a48e0';g.fillRect(0,-W/2-5,l.len,W+10);g.globalAlpha=k*0.85;g.fillStyle='#a98bff';g.fillRect(0,-W/2,l.len,W);
      g.fillStyle='#5cffef';g.fillRect(0,-W*0.35,l.len,W*0.7);g.fillStyle='#5dffb0';g.fillRect(0,-W*0.2,l.len,W*0.4);g.globalAlpha=k;g.fillStyle='#ffffff';g.fillRect(0,-W*0.08,l.len,Math.max(2,W*0.16));}
    else{g.globalAlpha=k*0.45;g.fillStyle='#18b0b4';g.fillRect(0,-l.w*k/2-4,l.len,l.w*k+8);
    g.globalAlpha=k*0.8;g.fillStyle='#5cffef';g.fillRect(0,-l.w*k/2,l.len,l.w*k);
    g.globalAlpha=k;g.fillStyle='#e0fffb';g.fillRect(0,-l.w*k/4,l.len,Math.max(1,l.w*k/2));}g.restore();g.globalAlpha=1;}
  g.dense(1);/* いなずま（#34） */
  for(const z of R.Z){
    if(((z.t*40)|0)%3===2)continue;
    if(z.sky){/* 雷雲（#12）：黄色いいなずま。点を2ドットおきに */
      for(let i=1;i<z.poly.length;i++){const [ax,ay]=z.poly[i-1],[bx,by]=z.poly[i],n=Math.max(1,Math.ceil(Math.hypot(bx-ax,by-ay)/2));
        for(let s=0;s<=n;s++){const x=ax+(bx-ax)*s/n,y=ay+(by-ay)*s/n;g.fillStyle='#ec9a1e';g.fillRect(Math.round(x)-2,Math.round(y)-1,4,3);g.fillStyle='#fff2a8';g.fillRect(Math.round(x)-1,Math.round(y),2,1);}}
      continue;}
    for(let i=1;i<z.poly.length;i++){const [ax,ay]=z.poly[i-1],[bx,by]=z.poly[i],n=Math.max(1,Math.ceil(Math.hypot(bx-ax,by-ay)/1.5));
      for(let s=0;s<=n;s++){const x=ax+(bx-ax)*s/n,y=ay+(by-ay)*s/n;if(z.big){g.fillStyle='#a4c41c';g.fillRect(Math.round(x)-2,Math.round(y)-2,5,5);g.fillStyle='#e6ff5c';px3(g,x,y);g.fillStyle='#ffffff';g.fillRect(Math.round(x),Math.round(y),1,1);}
        else{g.fillStyle='#a4c41c';px3(g,x,y);g.fillStyle='#fbffd0';g.fillRect(Math.round(x),Math.round(y),1,1);}}}
  }
  g.dense(0);
  for(const x of R.X){const fr=x.f[Math.min(x.f.length-1,Math.floor(x.t/x.dur*x.f.length))];g.drawImage(fr,Math.round(x.x)-(fr.width>>1),Math.round(x.y)-(fr.height>>1));}
  for(const p of R.P){g.globalAlpha=clamp(p.life/p.max*1.4,0,1)*0.9;g.fillStyle=p.c;g.fillRect(Math.round(p.x),Math.round(p.y),p.s,p.s);}
  g.globalAlpha=1;
  if(R.LZ.length)drawWalls(g);
  if(R.snow>0)drawSnow(g);
  if(R.chill>0){g.fillStyle='#e4f6ff';for(let i=0;i<8;i++){const a=R.t*3+i*TAU/8;if((i+((R.t*10)|0))%3)g.fillRect(Math.round(R.x+Math.cos(a)*30)-1,Math.round(R.y+Math.sin(a)*34)-1,2,2);}}/* 霜の弾で遅い */
  const ebf=EBS[((R.t*8)|0)%2],ebb=EBB[((R.t*8)|0)%2];
  for(const b of R.EB){if(b.slow)g.drawImage(EBGS,Math.round(b.x)-18,Math.round(b.y)-18);if(b.big)g.drawImage(EBGB,Math.round(b.x)-22,Math.round(b.y)-22);else g.drawImage(EBG,Math.round(b.x)-16,Math.round(b.y)-16);}
  for(const b of R.EB)DS(g,b.big?ebb:ebf,b.x,b.y);
  if(R.state!=='over'){const w=40,r=R.hp/R.maxHp;g.fillStyle='#060a1c';g.fillRect(px-21,py+45,w+2,6);g.fillStyle='#2a1030';g.fillRect(px-20,py+46,w,4);
    g.fillStyle=r>0.35?'#5dffb0':'#ff2d6f';g.fillRect(px-20,py+46,Math.ceil(w*r),4);}
  const boss=R.E.find(e=>e.kind==='boss');
  if(boss){g.fillStyle='#060a1c';g.fillRect(34,6,GW-68,8);g.fillStyle='#2a1030';g.fillRect(36,8,GW-72,4);g.fillStyle='#e0304f';g.fillRect(36,8,Math.ceil((GW-72)*Math.max(0,boss.hp/boss.max)),4);}
  if(R.sp)spTop(g,px,py);
  if(R.tstop>0){g.fillStyle='rgba(170,180,255,0.12)';g.fillRect(0,0,GW,GH);}/* 時間停止：画面を少し青白く */
  if(R.hurtFx>0){g.fillStyle='rgba(255,45,111,0.2)';g.fillRect(0,0,GW,GH);}
  g.end();
}
function hud(){
  const lv='LV '+R.lv;if(hc.lv!==lv){hc.lv=lv;$('hudLv').textContent=lv;}
  const tm=fmt(R.t);if(hc.t!==tm){hc.t=tm;$('hudTime').textContent=tm;const lim=R.final&&R.t>=RUN_LEN?'':'/05:00';if(hc.lim!==lim){hc.lim=lim;document.querySelector('.clock small').textContent=lim;}}/* 最終ボスの間は時間切れなし（#13） */
  if(hc.k!==R.kills){hc.k=R.kills;$('hudKills').textContent=R.kills;}
  const w=Math.min(100,R.xp/R.need*100).toFixed(1);if(hc.w!==w){hc.w=w;$('xpFill').style.width=w+'%';}
  const sg=(R.sp?Math.max(0,1-R.sp.t/R.sp.dur)*100:R.gauge/SPG.max*100).toFixed(1);if(hc.sg!==sg){hc.sg=sg;$('spFill').style.width=sg+'%';}/* 必殺技の間は残りの時間 */
}
function frame(ts){
  if(!R)return;
  raf=requestAnimationFrame(frame);
  let dt=(ts-last)/1000;last=ts;if(!(dt>0))dt=0;dt=Math.min(dt,0.05);
  if(R.state==='play'&&ts>=fxHold)update(dt);/* fxHold：レベルアップのカードが消える間だけ止める（11/16） */
  if(R){draw();hud();}
}

