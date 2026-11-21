/* ---------- 必殺技（#11・docs/design/ships.md） ----------
   ゲージは時間（1秒で1.25）と撃破（小さい敵0.08〜大型の敵8）でたまり、100 で自動で出る（60秒くらいで1回）。エネルギー炉1つで1.2倍
   威力は spDmg：敵の体力ののびと同じく時間でのびる。火力アップなども効く */
const SPG={max:100,time:1.25,kill:{bug:0.08,shooter:0.15,tank:0.3,boss:8,hider:0.12,charger:0.12,frost:0.15,splitter:0.2,shard:0.05,turret:0.3,guard:0.3,warp:0.2},graze:0.4};
const SPGLOW={};SHIP_IDS.forEach(k=>{SPGLOW[k]=glow(110,hex(SHIPS[k].c).join(','),0.42);});
const spDmg=b=>b*(1+R.t/110)*dmgMul();
const easeO=t=>1-(1-t)*(1-t),easeIO=t=>t<0.5?2*t*t:1-2*(1-t)*(1-t);
const onScr=e=>!e.dead&&e.x>-e.r&&e.x<GW+e.r&&e.y>-e.r&&e.y<GH+e.r;
function gaugeAdd(v){if(!R.sp)R.gauge=Math.min(SPG.max,R.gauge+v*R.cs.gauge);}
function ebClear(x,y,rad,c,small){for(const b of R.EB){if(b.dead||(small&&b.big))continue;const dx=b.x-x,dy=b.y-y;if(dx*dx+dy*dy<=rad*rad)ebGone(b,c,'w');}}
/* 四すみのかっこ（ねらいの印） */
function bracket(g,x,y,r,c){g.fillStyle=c;x=Math.round(x);y=Math.round(y);r=Math.round(r);
  for(let i=0;i<4;i++){const sx=i&1?1:-1,sy=i&2?1:-1,cx=x+sx*r,cy=y+sy*r;g.fillRect(sx>0?cx-6:cx,sy>0?cy-1:cy,6,2);g.fillRect(sx>0?cx-1:cx,sy>0?cy-6:cy,2,6);}}
function snipe(L){if(!L)return;let n=0;ATK++;/* 1回の狙撃で1つの番号（#15 の点検） */for(const e of L){if(e.dead)continue;n++;
    R.TR.push({x0:R.x,y0:R.y-34,x1:e.x,y1:e.y,t:0,dur:0.35,c:'#bfe9ff',w:3,dead:false});hit(e,spDmg(120),0,-40*U);addX(e.x,e.y,EXPL.m,0.4);}
  if(n)SFX.play('spsnipe');}
function escort(a,dt){
  if(a.out){a.y-=420*U*dt;if(a.y<-40)a.dead=true;return;}
  const tx=clamp(R.x+a.ox,12,GW-12),ty=clamp(R.y+a.oy,20,GH-12),k=Math.min(1,dt*5);a.x+=(tx-a.x)*k;a.y+=(ty-a.y)*k;
  a.cd-=dt;if(a.cd<=0){const e=nearest(a.x,a.y,320*U);if(e){a.cd=0.26;allyShot(a.x,a.y,e,420*U,spDmg(3.2));}else a.cd=0.15;}}
const SPECIAL={
  /* 全方位レーザー：16本の光線。まわり320の敵に2回 */
  standard:{dur:1.1,start(s){s.n=0;s.a=Math.random()*TAU;},
    up(s){if(s.n<2&&s.t>=0.15+s.n*0.45){s.n++;ATK++;for(const e of R.E){if(!onScr(e))continue;const dx=e.x-R.x,dy=e.y-R.y,d=Math.hypot(dx,dy)||1;if(d<=320+e.r)hit(e,spDmg(40),dx/d*140*U,dy/d*140*U);}}},
    draw(g,s,px,py){const L=320*Math.min(1,s.t/0.15),k=s.t>0.8?(1.1-s.t)/0.3:1;if(k<=0)return;
      for(let i=0;i<16;i++){g.save();g.translate(px,py);g.rotate(s.a+i*TAU/16+s.t*0.8);
        g.globalAlpha=k*0.35;g.fillStyle='#4588f2';g.fillRect(10,-5,L,10);g.globalAlpha=k*0.85;g.fillStyle='#8cc2ff';g.fillRect(10,-2,L,4);g.globalAlpha=k;g.fillStyle='#ffffff';g.fillRect(10,-1,L,2);g.restore();}
      g.globalAlpha=1;}},
  /* 早撃ち：6秒間、連射2倍（stat0 の c） */
  rapid:{dur:6,start(s){s.od=1;for(const m of R.mods)m.cd=Math.min(m.cd,0.05);},up(){},
    draw(g,s,px,py){const k=s.t>5.5?(6-s.t)/0.5:1;g.globalAlpha=k*0.8;
      for(let i=0;i<8;i++){const x=px+(i<4?-1:1)*(18+(i%4)*7),y=py+8+((s.t*260+i*37)%70);g.fillStyle=i%2?'#ffcd48':'#fff2a8';g.fillRect(Math.round(x),Math.round(y),2,8);}g.globalAlpha=1;}},
  /* 要塞バリア：4秒無敵＋半径250の衝撃波（大きい弾も消す） */
  fortress:{dur:4,start(s){R.spInv=4;s.hits=new Set();s.r=0;},
    up(s){if(s.t<0.5){s.r=250*Math.min(1,s.t/0.45);const r=s.r;
        near(R.x,R.y,r,e=>{if(s.hits.has(e.id))return;const dx=e.x-R.x,dy=e.y-R.y,d=Math.hypot(dx,dy)||1;if(d>r+e.r)return;s.hits.add(e.id);hit(e,spDmg(30),dx/d*320*U,dy/d*320*U);});
        ebClear(R.x,R.y,r,'#d2ffe8');}
      ebClear(R.x,R.y,50,'#d2ffe8');},
    draw(g,s,px,py){
      if(s.t<0.6){const k=1-s.t/0.6;arcPix(g,px,py,0,Math.PI,s.r,'#ffffff',k,3);arcPix(g,px,py,0,Math.PI,s.r-4,'#5dffb0',k*0.8,3.4);arcPix(g,px,py,0,Math.PI,s.r-9,'#1fae63',k*0.5,4);}
      const k=s.t>3.4&&(R.t*10|0)%2?0.35:0.9;/* 終わりの0.6秒は点滅 */
      for(let i=0;i<6;i++){const a0=i*TAU/6-Math.PI/2,a1=a0+TAU/6,x0=px+Math.cos(a0)*48,y0=py+Math.sin(a0)*50,x1=px+Math.cos(a1)*48,y1=py+Math.sin(a1)*50;
        for(let j=0;j<16;j++){g.globalAlpha=k*(((j+(R.t*12|0))%4)?0.7:1);g.fillStyle=j%4?'#5dffb0':'#d2ffe8';px2(g,x0+(x1-x0)*j/16,y0+(y1-y0)*j/16);}}
      g.globalAlpha=1;}},
  /* 大吸引：経験値の玉とお金を全部吸いよせ、まわり180の敵に小ダメージ */
  collector:{dur:1.2,start(s){for(const o of R.G){o.pull=true;o.sp=Math.max(o.sp,260*U);}for(const c of R.C){c.pull=true;c.sp=Math.max(c.sp,260*U);}
      near(R.x,R.y,180,e=>{const dx=e.x-R.x,dy=e.y-R.y,d=Math.hypot(dx,dy)||1;if(d<=180+e.r)hit(e,spDmg(10),-dx/d*60*U,-dy/d*60*U);});
      for(let i=0;i<48;i++){const a=i/48*TAU,r=200;addPart(R.x+Math.cos(a)*r,R.y+Math.sin(a)*r,-Math.cos(a)*r*2.4,-Math.sin(a)*r*2.4,0.5,i%3?'#ffd84a':'#fff6c0',3);}},
    up(){for(const o of R.G)o.pull=true;for(const c of R.C)c.pull=true;},
    draw(g,s,px,py){if(s.t>0.7)return;const k=1-s.t/0.7,r=200*k+20;arcPix(g,px,py,0,Math.PI,r,'#ffd84a',k,3);arcPix(g,px,py,0,Math.PI,r*0.7,'#fff6c0',k*0.7,3);}},
  /* なぎはらい：画面を横切る3本の斬撃（はば±30）。弾も消す */
  blade:{dur:1.25,start(s){s.L=[0,1,2].map(i=>({y:clamp(R.y-50-i*120,30,GH-30),dir:i%2?-1:1,t0:i*0.2,x:null,hits:new Set()}));
      /* 自機が上のほうにいて重なったときは、上から60ずつはなす（#11 の点検） */for(let i=s.L.length-2;i>=0;i--)if(s.L[i].y-s.L[i+1].y<60)s.L[i].y=s.L[i+1].y+60;},
    up(s){for(const l of s.L){ATK++;const p=(s.t-l.t0)/0.35;if(p<0||p>1.2)continue;const q=Math.min(1,p),x1=l.dir>0?-40+q*(GW+80):GW+40-q*(GW+80),x0=l.x==null?(l.dir>0?-40:GW+40):l.x;l.x=x1;
        const lo=Math.min(x0,x1),hi=Math.max(x0,x1);
        for(const e of R.E){if(e.dead||l.hits.has(e.id)||Math.abs(e.y-l.y)>30+e.r||e.x<lo-e.r||e.x>hi+e.r)continue;l.hits.add(e.id);hit(e,spDmg(45),l.dir*120*U,0);}
        for(const b of R.EB)if(!b.dead&&Math.abs(b.y-l.y)<=34&&b.x>=lo-6&&b.x<=hi+6)ebGone(b,'#e6dcff','w');}},
    draw(g,s){for(const l of s.L){const p=(s.t-l.t0)/0.35;if(p<0||p>1.5||l.x==null)continue;const k=p>1?Math.max(0,1-(p-1)/0.5):1,x0=l.dir>0?-40:GW+40,y=Math.round(l.y);
        /* 通ったあとの線（はじまりほど薄い）と、先の三日月の刃 */
        const L=Math.abs(l.x-x0),n=Math.ceil(L/6);for(let i=0;i<n;i++){const f=(i+1)/n,x=Math.round(x0+(l.x-x0)*i/n);g.globalAlpha=k*f*0.5;g.fillStyle='#6a48e0';g.fillRect(x,y-4,6,9);g.globalAlpha=k*f;g.fillStyle=f>0.85?'#ffffff':'#c4b0ff';g.fillRect(x,y-1,6,f>0.7?3:2);}
        if(p<1)for(let j=-26;j<=26;j+=2){const q=j/26,x=Math.round(l.x-l.dir*(1-q*q)*-10-l.dir*q*q*14);g.globalAlpha=k;g.fillStyle=Math.abs(j)<10?'#ffffff':Math.abs(j)<20?'#e6dcff':'#a98bff';g.fillRect(x-(Math.abs(j)<14?2:1),y+j,Math.abs(j)<14?4:3,2);}}
      g.globalAlpha=1;}},
  /* 艦載機発進：6機が8秒間、近い敵を撃つ */
  carrier:{dur:8,start(){const F=[[-40,16],[40,16],[-76,36],[76,36],[-112,56],[112,56]];R.ES.length=0;
      F.forEach(([ox,oy],i)=>R.ES.push({ox,oy,x:R.x+ox*1.6,y:GH+40+i*14,cd:0.4+i*0.05,out:false,dead:false}));},
    up(){},end(){for(const a of R.ES)a.out=true;}},
  /* 精密射撃：体力の多い順に5体をねらって撃つ。2回 */
  marksman:{dur:1.5,start(s){s.A=toughest(5);s.B=null;s.f=0;},
    up(s){if(s.f===0&&s.t>=0.55){s.f=1;snipe(s.A);s.B=toughest(5);}else if(s.f===1&&s.t>=1.2){s.f=2;snipe(s.B);}},
    draw(g,s){const L=s.f===0?s.A:s.f===1?s.B:null;if(!L)return;const q=Math.min(1,(s.t-(s.f?0.55:0))/0.4),c=q>=1&&(R.t*20|0)%2?'#ffffff':'#bfe9ff';
      for(const e of L){if(e.dead)continue;bracket(g,e.x,e.y,e.r+6+(1-q)*24,c);if(q>=1){g.fillStyle='#ff6a7a';g.fillRect(Math.round(e.x)-1,Math.round(e.y)-1,3,3);}}}},
  /* じゅうたん爆撃：下から上へ14列×6つの爆発（半径50） */
  bomber:{dur:1.75,start(s){s.row=0;},
    up(s){const rows=14;while(s.row<rows&&s.t>=s.row*0.1){const y=GH-30-(GH-60)*s.row/(rows-1);
        for(let k=0;k<6;k++){const x=(k+0.5)*GW/6+rand(-14,14),yy=y+rand(-12,12);blast(x,yy,50,spDmg(24),120*U,['#ffffff','#ffe0b0','#ffaa4a']);addX(x,yy,EXPL.m,0.45);}s.row++;}}},
  /* 分身：4秒間、左右の分身2体が同じ武器を撃つ（fire の cmods） */
  phantom:{dur:4,start(){R.cmods=[];for(const m of R.mods){if(!(FIRE[m.t]||EFIRE[m.t]))continue;for(const sd of [-1,1])R.cmods.push({t:m.t,slot:m.slot,d:m.d,cd:m.cd+0.05,cx:sd*60,cy:14});}},
    up(){},end(){R.cmods=[];},
    under(g,s,px,py){const k=s.t<0.3?s.t/0.3:s.t>3.6?(4-s.t)/0.4:1;g.globalAlpha=0.45*k;for(const sd of [-1,1])drawShipAt(g,R.spr,R.mods,px+sd*60,py+14,R.t+sd);g.globalAlpha=1;}},
  /* 突撃：前へ400突っこんで戻る。その間は無敵、道の敵（はば46）に大ダメージ */
  vanguard:{dur:0.95,start(s){s.lock=1;s.x=R.x;s.y0=R.y;s.top=Math.max(PMY,R.y-400);s.hits=new Set();s.tr=[];R.spInv=1.2;R.target=null;},
    up(s){const t=s.t;R.y=t<0.35?s.y0+(s.top-s.y0)*easeO(t/0.35):t<0.5?s.top:s.top+(s.y0-s.top)*easeIO(Math.min(1,(t-0.5)/0.45));R.x=s.x;
      s.tr.push(R.y);if(s.tr.length>8)s.tr.shift();
      near(R.x,R.y-10,46,e=>{if(s.hits.has(e.id))return;const dx=e.x-R.x,dy=e.y-(R.y-10),d=Math.hypot(dx,dy);if(d>46+e.r)return;s.hits.add(e.id);hit(e,spDmg(60),(dx>=0?1:-1)*300*U,-80*U);});
      ebClear(R.x,R.y,44,'#ffc0c8');},
    end(){R.target=null;},
    under(g,s,px){for(let i=0;i<s.tr.length-1;i++){g.globalAlpha=0.1+0.06*i;g.drawImage(R.spr.img,px-R.spr.cx,Math.round(s.tr[i])-R.spr.cy);}
      if(s.t<0.5){for(let i=0;i<10;i++){g.globalAlpha=0.6;g.fillStyle=i%2?'#ff6a7a':'#ffc0c8';g.fillRect(px-30+i*6+((R.t*90+i*7)%5|0),Math.round(R.y)+18+(i*11)%20,2,30+(i*13)%30);}}
      g.globalAlpha=1;}},
  /* 変換：4秒間、敵の弾を経験値の玉に変える（大きい弾は大きい玉） */
  alchemist:{dur:4,start(s){s.n=0;},
    up(s){for(const b of R.EB){if(b.dead)continue;b.dead=true;s.n++;addGem(b.x,b.y,b.big?3:1,!!b.big,0,0);addPart(b.x,b.y,0,-30,0.4,'#e6ff5c',3);}},
    under(g,s,px,py){if(s.t<0.5){const k=1-s.t/0.5,r=40+s.t*700;arcPix(g,px,py,0,Math.PI,r,'#e6ff5c',k,3);arcPix(g,px,py,0,Math.PI,r-5,'#a4c41c',k*0.6,3.5);}
      const k=s.t>3.5?(4-s.t)/0.5:1;g.fillStyle='#e6ff5c';for(let i=0;i<10;i++){const a=R.t*2+i*TAU/10,rr=40+((i*7+(R.t*20|0))%6);g.globalAlpha=0.7*k;px2(g,px+Math.cos(a)*rr,py+Math.sin(a)*rr);}g.globalAlpha=1;}},
  /* 主砲の一撃：0.5秒ためて、画面の敵すべてに大ダメージ＋敵の弾を消す */
  omega:{dur:1.4,start(s){s.f=0;},
    up(s){if(s.f===0&&s.t>=0.5){s.f=1;ATK++;for(const e of R.E)if(onScr(e))hit(e,spDmg(90),0,-60*U);for(const b of R.EB)if(!b.dead)ebGone(b,'#ffffff','w');
        for(let i=0;i<8;i++)addX(rand(30,GW-30),rand(30,GH*0.7),EXPL.m,rand(0.35,0.6));}},
    under(g,s,px,py){if(s.t<0.5){const q=s.t/0.5;for(let i=0;i<24;i++){const a=i*TAU/24+R.t*2,rr=(1-q)*120+6;g.fillStyle=i%2?'#fff6c0':'#ffffff';px3(g,px+Math.cos(a)*rr,py-36+Math.sin(a)*rr);}}},
    top(g,s,px,py){if(s.t<0.5)return;const k=Math.max(0,1-(s.t-0.5)/0.9),w=Math.round(90*k+10),h=Math.max(0,py-30);
      g.globalAlpha=k*0.35;g.fillStyle='#ffffff';g.fillRect(0,0,GW,GH);
      g.globalAlpha=k*0.5;g.fillStyle='#ffd84a';g.fillRect(px-w,0,w*2,h);g.globalAlpha=k*0.9;g.fillStyle='#fff6c0';g.fillRect(px-(w>>1),0,(w>>1)*2,h);
      g.globalAlpha=k;g.fillStyle='#ffffff';g.fillRect(px-(w>>2),0,(w>>2)*2,h);g.globalAlpha=1;}},
};
function spStart(){const d=SPECIAL[R.id];R.sp={t:0,dur:d.dur};R.spN++;R.gauge=SPG.max;d.start(R.sp);SFX.play('sp_'+R.id);showBanner(R.sh.sp.name,R.sh.c);}
function spUpdate(dt){
  if(!R.sp){gaugeAdd(SPG.time*dt);if(R.gauge>=SPG.max)spStart();}
  else{const s=R.sp,d=SPECIAL[R.id];s.t+=dt;ATK++;d.up(s,dt);if(s.t>=s.dur){if(d.end)d.end(s);R.sp=null;R.gauge=0;}}
  for(const a of R.ES)escort(a,dt);
}
/* 必殺技の絵：はじめに画面を少し暗くして機体の色の光（spDark）／機体の下（spUnder）／機体の上（spDraw）／いちばん上（spTop） */
const spK=s=>s.t<0.12?s.t/0.12:s.t<0.6?1:s.t<1?(1-s.t)/0.4:0;
function spDark(g){const k=spK(R.sp);if(k<=0)return;g.globalAlpha=k*0.38;g.fillStyle='#02040e';g.fillRect(0,0,GW,GH);
  const gl=SPGLOW[R.id];g.globalAlpha=k;g.drawImage(gl,Math.round(R.x)-(gl.width>>1),Math.round(R.y)-(gl.height>>1));g.globalAlpha=1;}
function spUnder(g,px,py){const s=R.sp,d=SPECIAL[R.id];
  if(s.t<0.45){const k=1-s.t/0.45,r=24+s.t*300;arcPix(g,px,py,0,Math.PI,r,R.sh.c,k,3);arcPix(g,px,py,0,Math.PI,r*0.75,'#ffffff',k*0.6,3.5);}
  if(d.under)d.under(g,s,px,py);}
function spDraw(g,px,py){const s=R.sp,d=SPECIAL[R.id];if(s&&d.draw)d.draw(g,s,px,py);
  for(const a of R.ES){DS(g,MISC.ally,a.x,a.y);g.fillStyle=(R.t*20|0)%2?'#ffb032':'#fff2a8';g.fillRect(Math.round(a.x)-1,Math.round(a.y)+12,3,3+((R.t*20|0)%2)*2);}}
function spTop(g,px,py){const d=SPECIAL[R.id];if(d.top)d.top(g,R.sp,px,py);}
/* スナイパーの集中：止まっていると機体のまわりにねらいの印 */
function drawFocus(g,px,py){g.globalAlpha=R.focus;bracket(g,px,py,R.focus>=1?34:40,R.focus>=1?'#ffffff':'#bfe9ff');g.globalAlpha=1;}

/* support: 援軍・子機・空爆・バリア・自動修理 */
function allyShot(x,y,e,spd,dmg){const an=Math.atan2(e.y-y,e.x-x);R.B.push(mkB(x,y,Math.cos(an)*spd,Math.sin(an)*spd,dmg,0,1));}
function callWing(){
  const side=Math.random()<0.5?1:-1,n=Math.min(6,1+R.sup.wing),y0=rand(GH*0.22,GH*0.55);
  for(let i=0;i<n;i++)R.A.push({x:side>0?-24-i*36:GW+24+i*36,y:y0+(i%2?21:0),vx:side*120*U,cd:rand(0,0.3),dead:false});
}
function pickStrike(){
  let best=null,bn=-1;
  for(let k=0;k<12&&R.E.length;k++){
    const e=R.E[(Math.random()*R.E.length)|0];if(e.dead||e.y<15||e.y>GH-15||e.x<0||e.x>GW)continue;
    let n=0;near(e.x,e.y,45,o=>{const dx=o.x-e.x,dy=o.y-e.y;if(dx*dx+dy*dy<2025)n++;});
    if(n>bn){bn=n;best=e;}
  }
  return best;
}
function support(dt){
  const S=R.sup,mul=dmgMul();
  if(S.wing>0){R.wingT-=dt;if(R.wingT<=0){R.wingT=Math.max(6,15-2*(S.wing-1));callWing();}}
  for(const a of R.A){
    a.x+=a.vx*dt;a.cd-=dt;
    if(a.cd<=0&&a.x>6&&a.x<GW-6){const e=nearest(a.x,a.y,240*U);if(e){a.cd=0.32;allyShot(a.x,a.y,e,360*U,(5+2*S.wing)*mul);}else a.cd=0.15;}
    if((a.vx>0&&a.x>GW+60)||(a.vx<0&&a.x<-60))a.dead=true;
  }
  const dn=Math.min(4,S.drone);
  while(R.D.length<dn)R.D.push({x:R.x,y:R.y,cd:rand(0.1,0.5)});
  R.D.forEach((d,i)=>{
    const an=R.t*2.2+i*TAU/dn;d.x=R.x+Math.cos(an)*48;d.y=R.y+Math.sin(an)*44;d.cd-=dt;
    if(d.cd<=0){const e=nearest(d.x,d.y,220*U);if(e){d.cd=S.drone>=5?0.5:0.75;allyShot(d.x,d.y,e,340*U,(4+2*S.drone)*mul);}else d.cd=0.2;}
  });
  if(S.strike>0){R.strikeT-=dt;if(R.strikeT<=0){
    const tg=pickStrike();
    if(tg){R.strikeT=Math.max(3.5,9-1.2*(S.strike-1));R.FX.push({x:tg.x,y:tg.y,t:0,r:(24+4*S.strike)*U,dmg:(30+15*(S.strike-1))*mul,hit:false,dead:false});}
    else R.strikeT=1;}}
  for(const f of R.FX){
    f.t+=dt;
    if(!f.hit&&f.t>=0.4){f.hit=true;blast(f.x,f.y,f.r,f.dmg,120*U,['#ffffff','#fff3b0','#ffd23f']);addX(f.x,f.y,EXPL.m,0.45);}
    if(f.t>0.75)f.dead=true;
  }
  if(S.barrier>0&&!R.bar){R.barCd-=dt;if(R.barCd<=0)R.bar=true;}
  const rg=R.spc.back?0:0.4*R.pas.regen+R.bonus.regen+R.cs.regen;/* 背水の陣（#12）：自動の回復がきかない */
  if(rg>0)R.hp=Math.min(R.maxHp,R.hp+rg*dt);
}
/* ---------- #12 新しい支援8種（数字は SUP の v・威力は dmgMul がかかる）・回復の玉・宝箱 ---------- */
function randOn(skip,minY){for(let k=0;k<12&&R.E.length;k++){const c=R.E[(Math.random()*R.E.length)|0];if(!c.dead&&!c.hide&&onScr(c)&&c.y>(minY||12)&&!(skip&&skip.has(c.id)))return c;}return null;}
function sup12(dt){
  const S=R.sup,mul=dmgMul();
  if(S.thunder>0){R.thT-=dt;if(R.thT<=0){R.thT=SV('thunder','cd');const n=SV('thunder','n'),d=SV('thunder','d')*mul,used=new Set();
    for(let i=0;i<n;i++){const e=randOn(used);if(!e)break;used.add(e.id);const x0=clamp(e.x+rand(-40,40),12,GW-12);
      const pts=[[x0,8]],sn=Math.max(2,Math.round((e.y-8)/46));for(let q=1;q<sn;q++){const f=q/sn;pts.push([x0+(e.x-x0)*f+rand(-16,16),8+(e.y-8)*f]);}pts.push([e.x,e.y]);
      R.Z.push({poly:jag(pts),t:0,big:1,sky:1,dead:false});R.TC.push({x:x0,t:0,dead:false});ATK++;hit(e,d,0,0);}/* 雷1本ごとに攻撃の番号（#15 の点検：前の攻撃の番号のままだと、同じダメージの別の攻撃と大蛇で重なって消えた） */
    if(used.size)SFX.play('zap');else R.thT=0.5;}}
  for(const c of R.TC){c.t+=dt;if(c.t>0.45)c.dead=true;}
  if(S.medic>0){const tx=R.x-40,ty=R.y+26+Math.sin(R.t*3)*3,k=Math.min(1,dt*6);if(R.mdx==null){R.mdx=tx;R.mdy=ty;}R.mdx+=(tx-R.mdx)*k;R.mdy+=(ty-R.mdy)*k;
    R.mdT-=dt;if(R.mdT<=0){R.mdT=SV('medic','cd');R.HO.push({x:R.mdx,y:R.mdy+8,vy:22,v:SV('medic','h'),t:0,dead:false,pull:false,sp:70*U});}}
  if(S.frostaura>0){const r=SV('frostaura','r')*R.cs.area,f=SV('frostaura','f');R.frR=r;
    near(R.x,R.y,r,e=>{const dx=e.x-R.x,dy=e.y-R.y;if(dx*dx+dy*dy>(r+e.r)*(r+e.r))return;e.slow=Math.max(e.slow,0.12);e.slowF=Math.min(e.slowF,f);});}
  if(S.fireaura>0){const r=SV('fireaura','r')*R.cs.area;R.fiR=r;R.faT-=dt;if(R.faT<=0){R.faT=0.5;const d=SV('fireaura','d')*mul;
    near(R.x,R.y,r,e=>{const dx=e.x-R.x,dy=e.y-R.y;if(dx*dx+dy*dy>(r+e.r)*(r+e.r))return;hit(e,d,0,0);if(Math.random()<0.35)addPart(e.x,e.y,rand(-20,20),rand(-60,-25),0.3,Math.random()<0.5?'#ff9f43':'#ffd23f',2);});}}
  if(S.guardsat>0){const n=SV('guardsat','n'),d=SV('guardsat','d')*mul;R.satA+=SV('guardsat','w')*dt;R.sats=R.sats||[];R.sats.length=n;
    for(let i=0;i<n;i++){const a=R.satA+i*TAU/n,x=R.x+Math.cos(a)*58,y=R.y+Math.sin(a)*54;R.sats[i]={x,y};
      for(const b of R.EB){if(b.dead)continue;const dx=b.x-x,dy=b.y-y,rr=b.big?13:10;if(dx*dx+dy*dy<=rr*rr)ebGone(b,'#e2e6f4','w');}
      near(x,y,10,e=>{const dx=e.x-x,dy=e.y-y,rr=e.r+7;if(dx*dx+dy*dy>rr*rr||R.t-e.gsT<0.4)return;e.gsT=R.t;const l=Math.hypot(dx,dy)||1;hit(e,d,dx/l*90*U,dy/l*90*U);});}}
  if(S.meteor>0){R.msT-=dt;if(R.msT<=0){R.msT=SV('meteor','cd');const n=SV('meteor','n'),used=new Set();
    for(let i=0;i<n;i++){const e=randOn(used,20);if(e)used.add(e.id);const tx=e?e.x:rand(40,GW-40),ty=e?e.y:rand(GH*0.15,GH*0.5);
      R.MT.push({x0:tx-90,y0:-20,tx,ty,t:-i*0.12,dur:0.32,d:SV('meteor','d'),dead:false});}SFX.play('star');}}
  for(const m of R.MT){m.t+=dt;if(m.t>=m.dur){m.dead=true;blast(m.tx,m.ty,22*R.cs.area,m.d*mul,60*U,['#ffffff','#e6dcff','#a98bff']);}}
  if(S.battleship>0){if(!R.BS){R.bsT-=dt;if(R.bsT<=0){R.bsT=SV('battleship','cd');R.BS={x:-70,y:GH-20,cd:0.4};}}
    else{const B=R.BS;B.x+=(GW+140)/4.5*dt;B.cd-=dt;
      if(B.cd<=0&&B.x>16&&B.x<GW-16){B.cd=0.38;const e=randOn(null,10)||nearest(B.x,B.y,GH*2);const tx=e?e.x:B.x+rand(-60,60),ty=e?e.y:rand(GH*0.2,GH*0.5);
        R.SH.push({x:B.x+8,y:B.y-10,x0:B.x+8,y0:B.y-10,tx,ty,t:0,dur:Math.max(0.18,Math.hypot(tx-B.x,ty-B.y)/620),d:SV('battleship','d'),dead:false});SFX.play('gun');}
      if(B.x>GW+80)R.BS=null;}}
  for(const s of R.SH){s.t+=dt;const q=Math.min(1,s.t/s.dur);s.x=s.x0+(s.tx-s.x0)*q;s.y=s.y0+(s.ty-s.y0)*q;
    if(q>=1){s.dead=true;blast(s.tx,s.ty,26*R.cs.area,s.d*mul,90*U,['#ffffff','#ffe0b0','#ff9f43']);addX(s.tx,s.ty,EXPL.m,0.4);}}
  if(S.timestop>0){if(R.tstop>0)R.tstop-=dt;else{R.tsT-=dt;if(R.tsT<=0){R.tsT=SV('timestop','cd');R.tstop=SV('timestop','t');SFX.play('tstop');showBanner('時間停止',SUP.timestop.c);}}}
}
function items12(dt){
  const mag=R.magR||54;
  for(const o of R.HO){if(o.dead)continue;o.t+=dt;const dx=R.x-o.x,dy=R.y-o.y,d=Math.hypot(dx,dy)||1;
    if(o.pull||d<mag){o.pull=true;o.sp+=460*U*dt;const st=Math.min(o.sp*dt,d);o.x+=dx/d*st;o.y+=dy/d*st;}else o.y+=o.vy*dt;
    if(Math.hypot(R.x-o.x,R.y-o.y)<14){o.dead=true;R.hp=Math.min(R.maxHp,R.hp+o.v);SFX.play('heal');burst(R.x,R.y,6,['#5dffb0','#d2ffe8','#ffffff']);}
    else if(o.y>GH+12||o.t>40)o.dead=true;}
  for(const c of R.CH){if(c.dead)continue;c.t+=dt;const dx=R.x-c.x,dy=R.y-c.y,d=Math.hypot(dx,dy)||1;
    if(c.pull||d<mag+20){c.pull=true;c.sp+=420*U*dt;const st=Math.min(c.sp*dt,d);c.x+=dx/d*st;c.y+=dy/d*st;}
    else{c.vy=Math.min(40,c.vy+90*dt);if(c.vy<0||c.y<GH*0.62)c.y+=c.vy*dt;}
    if(Math.hypot(R.x-c.x,R.y-c.y)<18){c.dead=true;R.chestQ++;SFX.play('coin');}}
}
/* 画面に残った宝箱を全部受け取る（クリアの直前）。受け取った数を返す */
function grabChests(){let n=0;for(const c of R.CH)if(!c.dead){c.dead=true;R.chestQ++;n++;}return n;}
function ringDots(g,x,y,r,c,a,step,rot){const n=Math.max(8,Math.ceil(TAU*r/step));g.fillStyle=c;
  for(let i=0;i<n;i++){const an=rot+i/n*TAU;g.globalAlpha=a*((i%3)?0.5:1);px2(g,x+Math.cos(an)*r,y+Math.sin(an)*r);}g.globalAlpha=1;}
function draw12Under(g,px,py){
  if(R.sup.frostaura>0&&R.frR){ringDots(g,px,py,R.frR,'#bfe9ff',0.75,5,R.t*0.4);ringDots(g,px,py,R.frR-5,'#5aaedc',0.35,7,-R.t*0.3);
    g.fillStyle='#f4fcff';for(let i=0;i<8;i++){const an=i*TAU/8+R.t*0.6,rr=R.frR*(0.45+0.4*(((i*5+(R.t*3|0))%4)/4));g.globalAlpha=0.6;px2(g,px+Math.cos(an)*rr,py+Math.sin(an)*rr);}g.globalAlpha=1;}
  if(R.sup.fireaura>0&&R.fiR){ringDots(g,px,py,R.fiR,'#ff9f43',0.8,5,-R.t*0.8);
    for(let i=0;i<12;i++){const an=i*TAU/12+R.t*0.5,f=((i*7+(R.t*12|0))%5);g.globalAlpha=0.75;g.fillStyle=f<2?'#ffd23f':'#e0701a';g.fillRect(Math.round(px+Math.cos(an)*R.fiR)-1,Math.round(py+Math.sin(an)*R.fiR)-2-f,3,3+f);}g.globalAlpha=1;}
  for(const o of R.HO)DS(g,HORB,o.x,o.y);
  for(const c of R.CH)DS(g,CHEST,c.x,c.y+(c.pull?0:Math.round(Math.sin(c.t*4))));
  if(R.BS){const B=R.BS;g.drawImage(BSHIP.img,Math.round(B.x)-BSHIP.cx,Math.round(B.y)-BSHIP.cy);
    if(B.cd>0.3){g.fillStyle='#fff2a8';g.fillRect(Math.round(B.x)+6,Math.round(B.y)-16,4,5);}}
}
function draw12Over(g,px,py){
  if(R.sup.medic>0&&R.mdx!=null){DS(g,MEDIC,R.mdx,R.mdy);g.fillStyle=(R.t*20|0)%2?'#d2d9e8':'#5f6a86';g.fillRect(Math.round(R.mdx)-8,Math.round(R.mdy)-7,6,1);g.fillRect(Math.round(R.mdx)+3,Math.round(R.mdy)-7,6,1);}
  if(R.sup.guardsat>0&&R.sats)for(const s of R.sats)DS(g,GSAT,s.x,s.y);
  for(const s of R.SH){const dx=s.tx-s.x0,dy=s.ty-s.y0,l=Math.hypot(dx,dy)||1;for(let k=3;k>=0;k--){g.fillStyle=k?'#ffaa4a':'#fff2a8';px3(g,s.x-dx/l*k*3,s.y-dy/l*k*3);}}
  for(const m of R.MT){if(m.t<0)continue;const q=Math.min(1,m.t/m.dur),x=m.x0+(m.tx-m.x0)*q,y=m.y0+(m.ty-m.y0)*q,dx=m.tx-m.x0,dy=m.ty-m.y0,l=Math.hypot(dx,dy)||1;
    for(let k=8;k>=0;k--){g.fillStyle=k<1?'#ffffff':k<4?'#e6dcff':'#a98bff';g.globalAlpha=1-k*0.08;px3(g,x-dx/l*k*4,y-dy/l*k*4);}g.globalAlpha=1;}
  for(const c of R.TC){g.globalAlpha=Math.max(0,1-c.t/0.45);DS(g,CLOUD,c.x,12);}g.globalAlpha=1;
}
/* 必殺技などの絵を出撃の始めに1回描いておく（はじめて描くときの重さを先に。#11 の点検） */
function prewarm(){const g=ctx;g.save();g.globalAlpha=0.01;
  const B=bgOf(R.stg||1),st=[B.tile].concat(R.bossArt?R.bossArt.map(a=>ESPR[a]&&ESPR[a].img):[]);/* #13：ステージの背景と大型の敵の絵 */
  for(const c of [SPGLOW[R.id],MISC.ally.img,ALLY[0].img,ALLY[1].img,R.spr.img,CHEST.img,HORB.img,MEDIC.img,GSAT.img,BSHIP.img,CLOUD.img,EXPL.m[0],EXPL.b[0]].concat(st))if(c)g.drawImage(c,0,0);
  g.restore();}
function moveEB(dt){
  const ek=R.tstop>0?0:dt*R.cs.eSpd*(1-0.25*(R.snow||0));/* 時間停止・時の加速（#12）・吹雪（#13） */
  for(const b of R.EB){if(b.dead)continue;b.x+=b.vx*ek;b.y+=b.vy*ek;
    if(b.x<-18||b.x>GW+18||b.y<-18||b.y>GH+18){b.dead=true;continue;}
    const dx=b.x-R.x,dy=b.y-R.y,d2=dx*dx+dy*dy;if(d2<=56){b.dead=true;if(hurt(b.dmg)&&b.slow)R.chill=2.2;}/* 霜の弾：当たったときだけ遅くなる（#13 の点検） */
    else if(R.sh.graze&&!b.gz&&d2<=24*24&&R.ghost<=0){b.gz=1;gaugeAdd(SPG.graze);addPart(b.x,b.y,-dx*2,-dy*2,0.25,'#ffc8ff',2);}}/* かすり：弾のすぐ近くを通るとゲージ */
}
function contact(){
  if(R.cs.spike>0)near(R.x,R.y,24,e=>{const dx=e.x-R.x,dy=e.y-R.y,rr=e.r+12;if(dx*dx+dy*dy>rr*rr||R.t-e.spk<0.5)return;e.spk=R.t;
    const d=Math.hypot(dx,dy)||1;hit(e,15*R.cs.spike*dmgMul(),dx/d*150*U,dy/d*150*U);spark(R.x+dx/2,R.y+dy/2,'#eef0ff');});/* トゲ装甲 */
  if(R.sh.ram)near(R.x,R.y,18,e=>{if(!KIND[e.kind].small)return;const dx=e.x-R.x,dy=e.y-R.y,rr=e.r+7.5;/* 突撃装甲：小さい敵は体当たりで倒す */
    if(dx*dx+dy*dy<=rr*rr){const dm=e.dmg;hit(e,e.hp+1,0,0);if(R.inv<=0&&R.spInv<=0)hurt(dm*0.5*Math.pow(0.7,R.cs.spike));}});
  if(R.inv>0)return;
  near(R.x,R.y,18,e=>{const dx=e.x-R.x,dy=e.y-R.y,rr=e.r+7.5;
    if(dx*dx+dy*dy<=rr*rr){hurt(e.dmg*(save.cur==='fortress'?0.6:R.sh.ram?0.5:1)*Math.pow(0.7,R.cs.spike));if(e.kind==='rock'){e.dead=true;rockBreak(e,false);return true;}/* 岩はぶつかるとこわれる */
      const d=Math.hypot(dx,dy)||1;e.kx+=dx/d*140*U;e.ky+=dy/d*140*U;return true;}});
}
function gems(dt){
  const mag=36*U*R.sh.mag*(1+0.4*R.pas.magnet+R.bonus.magnet)*R.cs.mag,damp=Math.pow(0.05,dt);R.magR=mag;
  for(const g of R.G){if(g.dead)continue;
    const dx=R.x-g.x,dy=R.y-g.y,d=Math.hypot(dx,dy)||1;
    if(g.pull||d<mag){g.pull=true;g.sp+=460*U*dt;const st=Math.min(g.sp*dt,d);g.x+=dx/d*st;g.y+=dy/d*st;}
    else{g.vx*=damp;g.vy*=damp;g.x+=g.vx*dt;g.y+=(g.vy+18*U)*dt;}
    if(Math.hypot(R.x-g.x,R.y-g.y)<13.5){g.dead=true;gainXp(g.v);SFX.play('xp',(R.xp/R.need*12)|0);}else if(g.y>GH+15)g.dead=true;}
  for(const c of R.C){if(c.dead)continue;/* 黄金機雷のお金：経験値と同じように吸い寄せる */
    const dx=R.x-c.x,dy=R.y-c.y,d=Math.hypot(dx,dy)||1;
    if(c.pull||d<mag){c.pull=true;c.sp+=460*U*dt;const st=Math.min(c.sp*dt,d);c.x+=dx/d*st;c.y+=dy/d*st;}
    else{c.vx*=damp;c.vy*=damp;c.x+=c.vx*dt;c.y+=(c.vy+30*U)*dt;}
    if(Math.hypot(R.x-c.x,R.y-c.y)<13.5){c.dead=true;R.gold+=c.v;SFX.play('coin');}else if(c.y>GH+15)c.dead=true;}
}
function parts(dt){for(const p of R.P){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=0.94;p.vy*=0.94;p.life-=dt;if(p.life<=0)p.dead=true;}}
