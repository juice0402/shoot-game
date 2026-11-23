/* ---------- 試作6：攻撃の装備30種（撃ち方・当たり・効果）docs/design/parts.md ---------- */
/* 数の上限（重くならないように）：PD 酸の水たまり・炎の帯／TU 砲台／RG 輪／Q 投げた弾・魚雷・球／HL 追尾レーザー／MN 機雷 */
const CAP={PD:90,TU:10,RG:48,RH:16,Q:160,HL:40,MN:80,B:1400};
/* 強さ：D＝威力の倍率（g の d と火力アップ・刃をかけたもの）、F＝連射の倍率（g の r）、c＝機体と強化の連射 */
const STAT6={
  pulse:(lv,c,D,F)=>({cd:0.75/F*c,dmg:5*D,n:lv>=7?6:lv>=5?5:lv>=3?4:3,gap:0.06,spd:430*U,l8:lv>=8}),
  rail:(lv,c,D)=>{const chg=lv>=7?0.5:lv>=4?0.65:0.8;return {cd:(0.6+chg)*c,chg:chg*c,dmg:30*D,pierce:lv>=8?7:lv>=5?5:lv>=3?4:3,spd:1500*U,n:1,l8:lv>=8};},
  sniper:(lv,c,D,F)=>({cd:1.4/F*c,dmg:32*D,n:lv>=6?2:1,far:400*U,l8:lv>=8}),
  fan:(lv,c,D,F)=>({cd:0.8/F*c,dmg:3.5*D,n:[5,5,6,6,7,8,8,9][lv-1],spread:0.7+(lv>=4?0.15:0)+(lv>=7?0.15:0),spd:380*U,l8:lv>=8,life:1.1}),
  ricochet:(lv,c,D,F)=>({cd:0.75/F*c,dmg:5*D,n:lv>=7?3:lv>=4?2:1,bnc:lv>=8?7:lv>=6?6:lv>=5?5:lv>=2?4:3,spd:330*U,l8:lv>=8}),
  splitter:(lv,c,D,F)=>({cd:0.9/F*c,dmg:8*D,k:lv>=7?5:lv>=3?4:3,gen2:lv>=6,spd:330*U,n:1,l8:lv>=8}),
  needle:(lv,c,D,F)=>({cd:0.12/F*c,dmg:2*D,n:lv>=6?2:1,vul:lv>=7?0.05:lv>=4?0.04:0.03,vmax:lv>=8?0.4:0.3,spd:540*U,l8:lv>=8}),
  acid:(lv,c,D,F)=>({cd:1.0/F*c,dmg:5*D,tick:2*D,r:18*U*(lv>=3?1.2:1)*(lv>=6?1.2:1),life:lv>=7?3:lv>=4?2.5:2,spd:300*U,n:1,l8:lv>=8}),
  grenade:(lv,c,D,F)=>({cd:1.3/F*c,dmg:18*D,rad:22*U*(lv>=4?1.2:1)*(lv>=7?1.2:1),n:lv>=6?3:lv>=3?2:1,dist:120*U,l8:lv>=8}),
  cluster:(lv,c,D,F)=>({cd:2.4/F*c,dmg:24*D,sub:9*D,k:[6,6,8,8,9,10,10,12][lv-1],rad:30*U,srad:14*U,dist:150*U,l8:lv>=8}),
  napalm:(lv,c,D,F)=>({cd:1.6/F*c,dmg:2.2*D,run:0.56*(lv>=3?1.25:1)*(lv>=6?1.25:1),life:lv>=7?3:lv>=4?2.4:1.8,r:11*U,spd:250*U,n:1,l8:lv>=8}),
  shockwave:(lv,c,D,F)=>({cd:2.2/F*c,dmg:10*D,R:58*U*(lv>=2?1.15:1)*(lv>=5?1.15:1),n:lv>=7?3:lv>=4?2:1,l8:lv>=8}),
  torpedo:(lv,c,D,F)=>({cd:2.2/F*c,dmg:40*D,rad:26*U*(lv>=6?1.2:1),n:lv>=7?3:lv>=4?2:1,l8:lv>=8}),
  plasma:(lv,c,D,F)=>({cd:3.0/F*c,dmg:3*D,r:12*U*(lv>=2?1.2:1)*(lv>=5?1.2:1),n:lv>=7?3:lv>=3?2:1,spd:45*U,l8:lv>=8}),
  prism:(lv,c,D,F)=>({cd:0.9/F*c,dmg:5*D,n:lv>=7?5:lv>=4?4:3,k:lv>=6?4:lv>=3?3:2,spd:340*U,l8:lv>=8}),
  halo:(lv,c,D,F)=>({cd:1.8/F*c,dmg:8*D,R:72*U*(lv>=2?1.15:1)*(lv>=5?1.15:1),n:lv>=6?3:lv>=3?2:1,l8:lv>=8}),
  hlaser:(lv,c,D,F)=>({cd:1.3/F*c,dmg:7*D,n:[2,2,3,3,4,4,5,6][lv-1],pierce:2,life:1.5,l8:lv>=8}),
  sonic:(lv,c,D,F)=>({cd:1.2/F*c,dmg:6*D,R:85*U*(lv>=3?1.1:1)*(lv>=6?1.1:1),half:0.45*(lv>=3?1.2:1)*(lv>=6?1.2:1),slowF:lv>=5?0.45:0.6,slowT:1.2,son:lv>=8?0.15:0.1,l8:lv>=8}),
  gsword:(lv,c,D,F)=>({cd:1.9/F*c,dmg:40*D,range:46*U*(lv>=3?1.12:1)*(lv>=7?1.12:1),sweep:Math.PI*0.95,dur:0.32,l8:lv>=8}),
  twin:(lv,c,D,F)=>({cd:0.34/F*c,dmg:8*D,range:30*U*(lv>=3?1.15:1)*(lv>=6?1.15:1),sweep:Math.PI*0.5,dur:0.1,both:lv>=8,l8:lv>=8}),
  lance:(lv,c,D,F)=>({cd:1.0/F*c,dmg:26*D,len:72*U*(lv>=3?1.15:1)*(lv>=5?1.15:1),w:9*U,dur:0.14,tip:lv>=8}),
  hammer:(lv,c,D,F)=>({cd:1.6/F*c,dmg:30*D,rad:36*U*(lv>=4?1.15:1)*(lv>=7?1.15:1),stun:lv>=6?0.8:lv>=3?0.6:0.4,l8:lv>=8}),
  whip:(lv,c,D,F)=>({cd:1.2/F*c,dmg:16*D,len:82*U*(lv>=3?1.12:1)*(lv>=6?1.12:1),sweep:Math.PI*0.75,dur:0.2,pass:lv>=8?3:lv>=5?2:1,l8:lv>=8}),
  chainsaw:(lv,c,D,F)=>({cd:0.12/F*c,dmg:2.6*D,len:26*U*(lv>=3?1.15:1)*(lv>=5?1.15:1),w:5*U,l8:lv>=8}),
  scythe:(lv,c,D)=>({cd:(lv>=5?2.1:lv>=3?2.5:3.0)*c,dmg:34*D,R:58*U*(lv>=3?1.12:1)*(lv>=6?1.12:1),dur:0.42,l8:lv>=8}),
  turret:(lv,c,D,F)=>{const life=lv>=6?12:lv>=2?10:8,max=lv>=7?4:lv>=5?3:lv>=3?2:1;return {cd:Math.max(2.2,life/max)*c,dmg:7*D,fcd:0.4/F*c,life,max,range:160*U,l8:lv>=8};},
  minefield:(lv,c,D,F)=>({cd:10/F*c,dmg:20*D,rad:20*U*(lv>=5?1.2:1),n:[8,8,9,10,10,12,12,14][lv-1],life:12,l8:lv>=8}),
  satellite:(lv,c,D,F)=>({dmg:8*D,fcd:0.5/F*c,n:lv>=7?4:lv>=5?3:lv>=3?2:1,range:230*U,l8:lv>=8}),
  micro:(lv,c,D,F)=>({cd:2.0/F*c,dmg:6*D,n:[8,8,10,10,12,12,14,16][lv-1],rad:12*U,l8:lv>=8}),
  emp:(lv,c,D)=>({cd:(lv>=7?4:lv>=4?5:6)*c,dmg:4*D,R:110*U*(lv>=2?1.15:1)*(lv>=5?1.15:1),stun:lv>=6?1.6:lv>=3?1.3:1,l8:lv>=8}),
  /* 防御でレベルアップの対象：盾ドローン（枚数 n・大きさ r・回る速さ w）／前面シールド（耐久 hp・大きさ R・広さ half・戻るまで regen） */
  sdrone:lv=>({n:lv>=7?5:lv>=5?4:lv>=3?3:2,r:lv>=8?11:lv>=4?9:lv>=2?8:7,orb:50,w:lv>=6?2.6:2.1,l8:lv>=8}),
  fshield:lv=>({hp:lv>=8?16:lv>=5?12:lv>=3?10:8,R:lv>=4?58:52,half:(lv>=7?80:lv>=2?66:56)*Math.PI/180,regen:lv>=6?4:6,l8:lv>=8}),
};
/* 画面の上で、敵の体力が多い順に n 体 */
function toughest(n){const out=[];for(const e of R.E){if(e.dead||e.hide||e.y<0||e.y>GH||e.x<0||e.x>GW)continue;
  let i=out.length;while(i>0&&out[i-1].hp<e.hp)i--;if(i<n){out.splice(i,0,e);if(out.length>n)out.pop();}}return out;}
/* 近い順に n 体（マイクロミサイルの的を分ける） */
function closest(x,y,n,maxD){const a=[];for(const e of R.E){if(e.dead||e.hide||e.y<-6)continue;const d=(e.x-x)**2+(e.y-y)**2;if(d<maxD*maxD)a.push([d,e]);}
  a.sort((p,q)=>p[0]-q[0]);return a.slice(0,n).map(p=>p[1]);}
/* 向いた方（前 ±0.6）でいちばん近い敵：グレネードとクラスターの落ちる所 */
function ahead(x,y,a,maxD){let best=null,bd=maxD*maxD;for(const e of R.E){if(e.dead||e.hide||e.y<-6)continue;const dx=e.x-x,dy=e.y-y,d=dx*dx+dy*dy;
  if(d<bd&&Math.abs(angDiff(Math.atan2(dy,dx),a))<0.6){bd=d;best=e;}}return best;}
function nearestEx(x,y,maxD,skip){let best=null,bd=maxD*maxD;for(const e of R.E){if(e.dead||e.hide||e.y<-6||skip.has(e.id))continue;const d=(e.x-x)**2+(e.y-y)**2;if(d<bd){bd=d;best=e;}}return best;}
const capPush=(arr,o,cap)=>{if(arr.length>=cap)arr.shift();arr.push(o);};
function addPD(k,x,y,o){capPush(R.PD,{k:o.k||k,x,y,r:o.r,life:o.life,t:0,dmg:o.tick!=null?o.tick:o.dmg,tk:rand(0,0.12),dead:false},CAP.PD);}
const ring6=(o)=>{o.hits=new Set();o.dead=false;capPush(R.RG,o,CAP.RG);};
/* パルス砲の2発目から（fire() の中で gap ごとに呼ぶ） */
const BURST={
  pulse(m,st,ox,oy,ux,uy){R.B.push(mkB(ox+ux*14,oy+uy*14,ux*st.spd,uy*st.spd,st.dmg,0,7,{l8:st.l8,kb:0.05}));},
};
Object.assign(FIRE,{
  pulse(m,st,ox,oy,ux,uy){m.bq=st.n-1;m.bt=st.gap;BURST.pulse(m,st,ox,oy,ux,uy);},
  rail(m,st,ox,oy,ux,uy){for(let k=0;k<st.n;k++){const off=(k-(st.n-1)/2)*8,sx=ox+ux*16-uy*off,sy=oy+uy*16+ux*off;R.B.push(mkB(sx,sy,ux*st.spd,uy*st.spd,st.dmg,st.pierce,8,{kb:0.02,l8:st.l8}));
    R.TR.push({x0:sx,y0:sy,x1:sx+ux*900,y1:sy+uy*900,t:0,dur:0.14,c:st.l8?'#dcefff':'#9fd0ff',w:st.l8?3:2,dead:false});}},
  sniper(m,st,ox,oy){const list=toughest(st.n);if(!list.length)return false;
    for(const e of list){const dx=e.x-ox,dy=e.y-oy,d=Math.hypot(dx,dy)||1;
      hit(e,st.dmg*(1+0.5*Math.min(1,d/st.far)),dx/d*60*U,dy/d*60*U);spark(e.x,e.y,'#ffffff');
      R.TR.push({x0:ox,y0:oy,x1:e.x,y1:e.y,t:0,dur:0.16,c:st.l8?'#fff6c0':'#e3e8ff',w:st.l8?3:2,dead:false});}},
  fan(m,st,ox,oy,ux,uy){const base=Math.atan2(uy,ux);for(let k=0;k<st.n;k++){const a=base+(k/(st.n-1)-0.5)*st.spread;
    R.B.push(mkB(ox+ux*12,oy+uy*12,Math.cos(a)*st.spd,Math.sin(a)*st.spd,st.dmg,0,9,{life:st.life,kb:0.04,l8:st.l8}));}},
  ricochet(m,st,ox,oy,ux,uy){const base=Math.atan2(uy,ux);for(let k=0;k<st.n;k++){const a=base+(k-(st.n-1)/2)*0.25;
    R.B.push(mkB(ox+ux*12,oy+uy*12,Math.cos(a)*st.spd,Math.sin(a)*st.spd,st.dmg,0,10,{bnc:st.bnc,life:4,last:-1,l8:st.l8}));}},
  splitter(m,st,ox,oy,ux,uy){const base=Math.atan2(uy,ux);for(let k=0;k<st.n;k++){const a=base+(k-(st.n-1)/2)*0.2;R.B.push(mkB(ox+ux*13,oy+uy*13,Math.cos(a)*st.spd,Math.sin(a)*st.spd,st.dmg,0,11,{k2:st.k,gen:0,gen2:st.gen2,l8:st.l8}));}},
  needle(m,st,ox,oy,ux,uy){for(let k=0;k<st.n;k++){const off=(k-(st.n-1)/2)*6;
    R.B.push(mkB(ox+ux*14-uy*off,oy+uy*14+ux*off,ux*st.spd,uy*st.spd,st.dmg,0,12,{vul:st.vul,vmax:st.vmax,kb:0.02,l8:st.l8}));}},
  acid(m,st,ox,oy,ux,uy){const base=Math.atan2(uy,ux);for(let k=0;k<st.n;k++){const a=base+(k-(st.n-1)/2)*0.25;R.B.push(mkB(ox+ux*12,oy+uy*12,Math.cos(a)*st.spd,Math.sin(a)*st.spd,st.dmg,0,13,{life:0.75,pd:{tick:st.tick,r:st.r,life:st.life,k:st.l8?'acid8':'acid'}}));}},
  grenade(m,st,ox,oy,ux,uy){const base=Math.atan2(uy,ux),tg=ahead(ox,oy,base,st.dist*1.5),d0=tg?clamp(Math.hypot(tg.x-ox,tg.y-oy),30*U,st.dist*1.5):st.dist;
    for(let k=0;k<st.n;k++){const a=base+(k-(st.n-1)/2)*0.32,d=d0*rand(0.92,1.08);
    capPush(R.Q,{k:'lob',x0:ox,y0:oy,x1:ox+Math.cos(a)*d,y1:oy+Math.sin(a)*d,t:0,T:0.55,h:26*U,rad:st.rad,dmg:st.dmg,spr:st.l8?GREN8:GREN,dead:false},CAP.Q);}},
  cluster(m,st,ox,oy,ux,uy){const tg=ahead(ox,oy,Math.atan2(uy,ux),st.dist*1.4),d=tg?clamp(Math.hypot(tg.x-ox,tg.y-oy),40*U,st.dist*1.4):st.dist;
    capPush(R.Q,{k:'lob',x0:ox,y0:oy,x1:ox+ux*d,y1:oy+uy*d,t:0,T:0.7,h:34*U,rad:st.rad,dmg:st.dmg,spr:st.l8?CLUS8:CLUS,big:1,
    sub:{k:st.k,dmg:st.sub,rad:st.srad,l8:st.l8},dead:false},CAP.Q);},
  napalm(m,st,ox,oy,ux,uy){const base=Math.atan2(uy,ux);for(let k=0;k<st.n;k++){const a=base+(k-(st.n-1)/2)*0.3;capPush(R.Q,{k:'nap',x:ox+ux*12,y:oy+uy*12,vx:Math.cos(a)*st.spd,vy:Math.sin(a)*st.spd,t:0,run:st.run,drop:0,dmg:st.dmg,r:st.r,life:st.life,l8:st.l8,dead:false},CAP.Q);}},
  shockwave(m,st){for(let i=0;i<st.n;i++)ring6({k:'shock',fol:m,x:0,y:0,t:-i*0.2,dur:0.32,R:st.R,dmg:st.dmg,kb:170*U,clear:true,l8:st.l8});},
  torpedo(m,st,ox,oy,ux,uy){const a=Math.atan2(uy,ux);for(let k=0;k<st.n;k++){const off=(k-(st.n-1)/2)*9;
    capPush(R.Q,{k:'torp',x:ox+ux*12-uy*off,y:oy+uy*12+ux*off,a,spd:50*U,dmg:st.dmg,rad:st.rad,t:0,tr:0,l8:st.l8,dead:false},CAP.Q);}},
  plasma(m,st,ox,oy,ux,uy){const base=Math.atan2(uy,ux);for(let k=0;k<st.n;k++){const a=base+(k-(st.n-1)/2)*0.3;
    capPush(R.Q,{k:'orb',x:ox+ux*12,y:oy+uy*12,vx:Math.cos(a)*st.spd,vy:Math.sin(a)*st.spd,r:st.r,dmg:st.dmg,tick:0,t:0,l8:st.l8,dead:false},CAP.Q);}},
  prism(m,st,ox,oy,ux,uy){const base=Math.atan2(uy,ux);for(let k=0;k<st.n;k++){const a=base+(k-(st.n-1)/2)*0.22;
    R.B.push(mkB(ox+ux*12,oy+uy*12,Math.cos(a)*st.spd,Math.sin(a)*st.spd,st.dmg,0,14,{k2:st.k,gen:0,col:k%4,l8:st.l8}));}},
  halo(m,st){for(let i=0;i<st.n;i++)ring6({k:'halo',fol:m,x:0,y:0,t:-i*0.22,dur:0.45,R:st.R,dmg:st.dmg,kb:40*U,l8:st.l8});},
  hlaser(m,st,ox,oy,ux,uy){const base=Math.atan2(uy,ux);for(let k=0;k<st.n;k++){const a=base+(st.n>1?(k/(st.n-1)-0.5)*1.4:0);
    capPush(R.HL,{x:ox+ux*10,y:oy+uy*10,a,spd:330*U,tr:[],life:st.life,dmg:st.dmg,pierce:st.pierce,hits:new Set(),target:null,l8:st.l8,dead:false},CAP.HL);}},
  sonic(m,st,ox,oy,ux,uy){ring6({k:'sonic',fol:m,x:ox,y:oy,a:Math.atan2(uy,ux),half:st.half,t:0,dur:0.28,R:st.R,dmg:st.dmg,kb:30*U,slowF:st.slowF,slowT:st.slowT,son:st.son,l8:st.l8});},
  gsword(m,st,ox,oy,ux,uy){R.S.push({m,k:'gs',t:0,dur:st.dur,a:Math.atan2(uy,ux),sweep:st.sweep,range:st.range,dmg:st.dmg,l8:st.l8,hits:new Set(),done:false,dead:false});},
  twin(m,st,ox,oy,ux,uy){m.side=(m.side||1)*-1;const a=Math.atan2(uy,ux);
    for(const sd of st.both?[-1,1]:[m.side])R.S.push({m,k:'tw',t:0,dur:st.dur,a:a+sd*0.42,rev:sd<0,sweep:st.sweep,range:st.range,dmg:st.dmg,l8:st.l8,hits:new Set(),done:false,dead:false});},
  lance(m,st,ox,oy,ux,uy){R.S.push({m,k:'ln',t:0,dur:st.dur,a:Math.atan2(uy,ux),len:st.len,w:st.w,dmg:st.dmg,tip:st.tip,tipDone:false,hits:new Set(),done:false,dead:false});},
  hammer(m,st,ox,oy,ux,uy){const cx=ox,cy=oy;/* 円の衝撃は機体の横（つけた場所）が中心 */
    near(cx,cy,st.rad,e=>{const dx=e.x-cx,dy=e.y-cy,d=Math.hypot(dx,dy)||1;if(d>st.rad+e.r)return;
      e.stun=Math.max(e.stun,e.kind==='boss'?st.stun*0.3:st.stun);hit(e,st.dmg,dx/d*90*U,dy/d*90*U);});
    capPush(R.RH,{k:'ham',x:cx,y:cy,a:Math.atan2(uy,ux),t:0,dur:0.3,R:st.rad,dmg:0,noHit:true,l8:st.l8,dead:false},CAP.RH);burst(cx,cy,8,['#e6dcff','#9a7cff','#ffffff']);},
  whip(m,st,ox,oy,ux,uy){R.S.push({m,k:'wh',t:0,dur:st.dur*st.pass,pd:st.dur,pass:st.pass,pi:0,a:Math.atan2(uy,ux),sweep:st.sweep,len:st.len,dmg:st.dmg,prev:null,l8:st.l8,hits:new Set(),done:false,dead:false});},
  chainsaw(m,st,ox,oy,ux,uy){const x0=ox+ux*8,y0=oy+uy*8,L=st.len;let any=false;
    near(x0+ux*L/2,y0+uy*L/2,L/2+st.w,e=>{const dx=e.x-x0,dy=e.y-y0,pr=clamp(dx*ux+dy*uy,0,L),qx=dx-ux*pr,qy=dy-uy*pr;
      if(qx*qx+qy*qy>(st.w+e.r)**2)return;hit(e,st.dmg,ux*30*U,uy*30*U);any=true;if(Math.random()<0.3)addPart(x0+ux*pr,y0+uy*pr,rand(-90,90),rand(-90,90),0.15,'#fff2a8',2);});
    return any;},
  scythe(m,st,ox,oy,ux,uy){R.S.push({m,k:'sc',t:0,dur:st.dur,a:Math.atan2(uy,ux),R:st.R,dmg:st.dmg,l8:st.l8,hits:new Set(),done:false,dead:false});},
  turret(m,st,ox,oy,ux,uy){const mine=R.TU.filter(u=>u.m===m&&!u.dead);if(mine.length>=st.max)mine[0].dead=true;
    capPush(R.TU,{m,x:ox,y:oy,vx:ux*120*U,vy:uy*120*U,t:0,life:st.life,cd:0.3,a:Math.atan2(uy,ux),l8:st.l8,dead:false},CAP.TU);burst(ox,oy,5,['#8ea0ff','#ffffff']);},
  minefield(m,st){if(R.MN.length>=CAP.MN)return false;
    for(let i=0;i<st.n;i++){const a=i/st.n*TAU+rand(-0.2,0.2),v=rand(80,160)*U;
      R.MN.push({x:R.x,y:R.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,t:0,dmg:st.dmg,rad:st.rad,life:st.life,l8:st.l8,dead:false});}},
  micro(m,st,ox,oy,ux,uy){const base=Math.atan2(uy,ux),tg=closest(ox,oy,st.n,320*U);
    for(let k=0;k<st.n;k++){const a=base+(k/(st.n-1)-0.5)*1.8+rand(-0.1,0.1);
      R.M.push({x:ox+ux*8,y:oy+uy*8,a,spd:rand(70,120)*U,dmg:st.dmg,rad:st.rad,target:tg.length?tg[k%tg.length]:null,life:2.6,tr:rand(0,0.05),dead:false,sm:1,l8:st.l8,turn:rand(6,9),vmax:rand(240,300)*U});}},
  emp(m,st){ring6({k:'emp',fol:m,x:0,y:0,t:0,dur:0.35,R:st.R,dmg:st.dmg,stun:st.stun,clear:true,l8:st.l8});},
});
/* はね返り弾：画面のふちではね返る */
function bounceEdge(b){let f=false;
  if(b.x<3&&b.vx<0){b.vx=-b.vx;b.x=3;f=true;}else if(b.x>GW-3&&b.vx>0){b.vx=-b.vx;b.x=GW-3;f=true;}
  if(b.y<3&&b.vy<0){b.vy=-b.vy;b.y=3;f=true;}else if(b.y>GH-3&&b.vy>0){b.vy=-b.vy;b.y=GH-3;f=true;}
  if(f){b.bnc--;b.last=-1;}return f;}
/* 当たったときの特別な動き（true＝この弾の処理は終わり） */
function onHit6(b,e){
  switch(b.k){
    case 10:{/* はね返り弾 */
      if(b.bnc<=0){b.dead=true;return true;}
      b.bnc--;b.last=e.id;const nx=b.x-e.x,ny=b.y-e.y,nl=Math.hypot(nx,ny)||1,ux=nx/nl,uy=ny/nl,dot=b.vx*ux+b.vy*uy;
      if(dot<0){b.vx-=2*dot*ux;b.vy-=2*dot*uy;}return true;}
    case 11:case 14:{/* 分裂弾・プリズム砲 */
      b.dead=true;const k=b.gen===0?b.k2:(b.k===11&&b.gen===1&&b.gen2)?2:0;
      if(k>0&&R.B.length<CAP.B){const base=Math.atan2(b.vy,b.vx),sp=Math.hypot(b.vx,b.vy)*0.8,wide=b.k===14?1.6:1.3;
        for(let i=0;i<k;i++){const a=base+(k>1?(i/(k-1)-0.5)*wide:0);
          R.B.push(mkB(b.x,b.y,Math.cos(a)*sp,Math.sin(a)*sp,b.dmg*(b.k===14?0.6:0.5),0,b.k,{gen:b.gen+1,gen2:b.gen2,k2:b.k2,col:(b.col+1+i)%4,life:0.45,l8:b.l8,hits:new Set([e.id])}));}}
      return true;}
    case 12:e.vul=Math.min(b.vmax,e.vul+b.vul);return false;/* ニードル砲 */
    case 13:b.dead=true;addPD('acid',b.x,b.y,b.pd);return true;/* 酸弾 */
    case 17:{const T=e.kind==='boss'?b.stopT*0.3:b.stopT;e.frz=Math.max(e.frz,R.t+T);e.zn=b.shard;e.zd=b.sdmg;return false;}/* 絶対零度：止める */
  }
  return false;
}
/* 近接（大剣・双剣・ランス・光のムチ・大鎌） */
function sweepHit(s,ox,oy,p){
  const a0=s.rev?s.a+s.sweep/2:s.a-s.sweep/2,kb=(s.k==='gs'?260:s.k==='st'?200:150)*U;
  near(ox,oy,s.range,e=>{if(s.hits.has(e.id))return;const dx=e.x-ox,dy=e.y-oy,d=Math.hypot(dx,dy)||1;if(d>s.range+e.r)return;
    const ang=Math.atan2(dy,dx),rel=s.rev?angDiff(a0,ang):angDiff(ang,a0);
    if(d<12||(rel>=-0.2&&rel<=s.sweep*p+0.2)){s.hits.add(e.id);hit(e,s.dmg,dx/d*kb,dy/d*kb);}});
  if(s.k==='gs'||s.k==='st')for(const b of R.EB){if(b.dead)continue;const dx=b.x-ox,dy=b.y-oy;if(dx*dx+dy*dy>(s.range+4)**2)continue;
    const ang=Math.atan2(dy,dx),rel=s.rev?angDiff(a0,ang):angDiff(ang,a0);if(rel>=-0.2&&rel<=s.sweep*p+0.2)ebGone(b,'#e3eaff','w');}
}
function melee6(dt){
  HSRC=1;
  for(const s of R.S){
    if(!s.k)continue;
    s.t+=dt;if(s.t>s.dur+0.12){s.dead=true;continue;}
    if(s.done||s.t<0)continue;
    const [ox,oy]=s.k==='sc'?[R.x+(s.m.cx||0),R.y+(s.m.cy||0)]:modPos(s.m),p=Math.min(1,s.t/s.dur);
    if(s.k==='gs'||s.k==='tw'||s.k==='st')sweepHit(s,ox,oy,p);
    else if(s.k==='ln'){const ux=Math.cos(s.a),uy=Math.sin(s.a),L=s.len*Math.min(1,p*1.6);
      near(ox+ux*L/2,oy+uy*L/2,L/2+s.w,e=>{if(s.hits.has(e.id))return;const dx=e.x-ox,dy=e.y-oy,pr=dx*ux+dy*uy;
        if(pr<-e.r||pr>L+e.r||Math.abs(dx*uy-dy*ux)>s.w/2+e.r)return;s.hits.add(e.id);hit(e,s.dmg,ux*120*U,uy*120*U);});
      if(p>=1&&s.tip&&!s.tipDone){s.tipDone=true;const tx=ox+ux*s.len,ty=oy+uy*s.len;blast(tx,ty,28*U,s.dmg*0.6,120*U,['#ffffff','#a8c8ff','#4588f2']);addX(tx,ty,EXPL.s,0.3);}}
    else if(s.k==='wh'){const pi=Math.min(s.pass-1,Math.floor(s.t/s.pd));if(pi!==s.pi){s.pi=pi;s.hits.clear();s.prev=null;}
      const lp=clamp((s.t-pi*s.pd)/s.pd,0,1),off=(pi%2?0.5-lp:lp-0.5)*s.sweep,prev=s.prev==null?off:s.prev;s.prev=off;s.cur=off;
      const lo=Math.min(prev,off)-0.12,hi=Math.max(prev,off)+0.12;
      near(ox,oy,s.len,e=>{if(s.hits.has(e.id))return;const dx=e.x-ox,dy=e.y-oy,d=Math.hypot(dx,dy)||1;if(d>s.len+e.r||d<s.len*0.25-e.r)return;
        const rel=angDiff(Math.atan2(dy,dx),s.a);if(rel<lo||rel>hi)return;s.hits.add(e.id);hit(e,s.dmg,dx/d*110*U,dy/d*110*U);});
      if(p>=1)s.done=true;continue;}
    else if(s.k==='sc'){near(ox,oy,s.R,e=>{if(s.hits.has(e.id))return;const dx=e.x-ox,dy=e.y-oy,d=Math.hypot(dx,dy)||1;if(d>s.R+e.r)return;
        const rel=((Math.atan2(dy,dx)-s.a)%TAU+TAU)%TAU;if(rel>p*TAU+0.2&&d>14)return;s.hits.add(e.id);e.reapNow=true;hit(e,s.dmg,dx/d*120*U,dy/d*120*U);e.reapNow=false;});}
    if(p>=1)s.done=true;
  }
  HSRC=0;
}
/* 輪（衝撃波・光の輪・音波・電磁パルス・ハンマーの見た目） */
function rings6(dt){
  for(const r of R.RH){r.t+=dt;if(r.t>r.dur+0.15)r.dead=true;}
  for(const r of R.RG){
    r.t+=dt;if(r.t<0)continue;if(r.t>r.dur+0.15){r.dead=true;continue;}
    if(r.fol&&r.t<=r.dur){const [x,y]=modPos(r.fol);r.x=x;r.y=y;}
    if(r.noHit||r.t>r.dur)continue;
    const p=r.t/r.dur,cr=r.R*(1-(1-p)*(1-p));r.cr=cr;
    near(r.x,r.y,cr,e=>{if(r.hits.has(e.id))return;const dx=e.x-r.x,dy=e.y-r.y,d=Math.hypot(dx,dy)||1;if(d>cr+e.r)return;
      if(r.half!=null&&d>10&&Math.abs(angDiff(Math.atan2(dy,dx),r.a))>r.half+0.08)return;
      r.hits.add(e.id);
      if(r.stun)e.stun=Math.max(e.stun,e.kind==='boss'?r.stun*0.3:r.stun);
      if(r.slowT){e.slow=Math.max(e.slow,r.slowT);e.slowF=Math.min(e.slowF,r.slowF);}
      if(r.son){e.son=2;e.sonV=Math.max(e.sonV,r.son);}
      hit(e,r.dmg,dx/d*r.kb||0,dy/d*r.kb||0);});
    if(r.clear)for(const b of R.EB){if(b.dead||(r.k==='shock'&&b.big))continue;const dx=b.x-r.x,dy=b.y-r.y;if(dx*dx+dy*dy<=cr*cr)ebGone(b,r.k==='emp'?'#c0fbff':'#d0e4ff','w');}
  }
}
/* 投げた弾・魚雷・プラズマ球・ナパーム */
function proj6(dt){
  for(const q of R.Q){
    if(q.dead)continue;q.t+=dt;
    if(q.k==='lob'){if(q.t<q.T)continue;q.dead=true;
      blast(q.x1,q.y1,q.rad,q.dmg,(q.small?60:110)*U,q.small?['#fff2a8','#ffffff']:['#ffffff','#fff2a8','#ffcd48']);addX(q.x1,q.y1,q.big?EXPL.m:EXPL.s,q.small?0.25:0.4);
      if(q.sub)for(let i=0;i<q.sub.k;i++){const a=i/q.sub.k*TAU+rand(-0.25,0.25),d=rand(30,62)*U;
        capPush(R.Q,{k:'lob',x0:q.x1,y0:q.y1,x1:q.x1+Math.cos(a)*d,y1:q.y1+Math.sin(a)*d,t:0,T:rand(0.26,0.4),h:12*U,rad:q.sub.rad,dmg:q.sub.dmg,spr:q.sub.l8?BLET8:BLET,small:1,dead:false},CAP.Q);}
    }else if(q.k==='torp'){q.spd=Math.min(170*U,q.spd+90*U*dt);const ux=Math.cos(q.a),uy=Math.sin(q.a);q.x+=ux*q.spd*dt;q.y+=uy*q.spd*dt;
      q.tr-=dt;if(q.tr<=0){q.tr=0.05;addPart(q.x-ux*10,q.y-uy*10,rand(-12,12),rand(-12,12),0.35,q.l8?(Math.random()<0.5?'#ffffff':'#8cc2ff'):(Math.random()<0.5?'#bfd0f0':'#4588f2'),q.l8?3:2);}
      let boom=false;near(q.x,q.y,8,e=>{const dx=e.x-q.x,dy=e.y-q.y,rr=e.r+6;if(dx*dx+dy*dy<=rr*rr){boom=true;return true;}});
      if(boom){q.dead=true;if(R.sh.bomb)ebClear(q.x,q.y,q.rad,'#ffe0b0',true);near(q.x,q.y,q.rad,e=>{const dx=e.x-q.x,dy=e.y-q.y,d=Math.hypot(dx,dy)||1;if(d<=q.rad+e.r)hit(e,q.dmg*(e.kind==='boss'?2:1),dx/d*150*U,dy/d*150*U);});
        ring(q.x,q.y,q.rad,['#ffffff','#bfd0f0','#4588f2']);addX(q.x,q.y,EXPL.m,0.45);}
      else if(q.x<-40||q.x>GW+40||q.y<-40||q.y>GH+40)q.dead=true;
    }else if(q.k==='orb'){q.x+=q.vx*dt;q.y+=q.vy*dt;q.tick-=dt;
      if(q.tick<=0){q.tick=0.2;near(q.x,q.y,q.r,e=>{const dx=e.x-q.x,dy=e.y-q.y,rr=q.r+e.r*0.7;if(dx*dx+dy*dy<=rr*rr)hit(e,q.dmg,0,0);});}
      if(q.t>9||q.x<-40||q.x>GW+40||q.y<-40||q.y>GH+40)q.dead=true;
    }else if(q.k==='nap'){if(q.t>q.run){q.dead=true;continue;}q.x+=q.vx*dt;q.y+=q.vy*dt;q.drop-=dt;
      if(q.drop<=0){q.drop=0.05;addPD('fire',q.x,q.y,{r:q.r,life:q.life,dmg:q.dmg,k:q.l8?'fire8':'fire'});}
      if(q.x<-20||q.x>GW+20||q.y<-20||q.y>GH+20)q.dead=true;}
  }
  for(const p of R.PD){p.t+=dt;if(p.t>=p.life){p.dead=true;continue;}p.tk-=dt;if(p.tk>0)continue;p.tk=p.k[0]==='f'?0.25:0.3;
    near(p.x,p.y,p.r,e=>{const dx=e.x-p.x,dy=e.y-p.y,rr=p.r+e.r*0.6;if(dx*dx+dy*dy<=rr*rr)hit(e,p.dmg,0,0);});}
}
/* 追尾レーザー・砲台・衛星 */
function seekers6(dt){
  for(const h of R.HL){
    h.life-=dt;if(h.life<=0||h.pierce<0){h.dead=true;continue;}
    if(!h.target||h.target.dead)h.target=nearestEx(h.x,h.y,360*U,h.hits);
    if(h.target){const want=Math.atan2(h.target.y-h.y,h.target.x-h.x),mt=7*dt;h.a+=clamp(angDiff(want,h.a),-mt,mt);}
    h.x+=Math.cos(h.a)*h.spd*dt;h.y+=Math.sin(h.a)*h.spd*dt;h.tr.push(h.x,h.y);if(h.tr.length>28)h.tr.splice(0,2);
    near(h.x,h.y,6,e=>{if(h.hits.has(e.id))return;const dx=e.x-h.x,dy=e.y-h.y,rr=e.r+4;if(dx*dx+dy*dy>rr*rr)return;
      h.hits.add(e.id);hit(e,h.dmg,Math.cos(h.a)*20*U,Math.sin(h.a)*20*U);spark(h.x,h.y,'#c4ffe3','g');h.pierce--;h.target=null;return true;});
    if(h.x<-60||h.x>GW+60||h.y<-60||h.y>GH+60)h.dead=true;
  }
  for(const u of R.TU){
    u.t+=dt;if(u.t>=u.life||u.dead){if(!u.dead)burst(u.x,u.y,6,['#8ea0ff','#ffffff']);u.dead=true;continue;}
    const damp=Math.pow(0.02,dt);u.vx*=damp;u.vy*=damp;u.x=clamp(u.x+u.vx*dt,8,GW-8);u.y=clamp(u.y+u.vy*dt,8,GH-8);
    u.cd-=dt;if(u.cd<=0){const st=stat('turret'),e=nearest(u.x,u.y,st.range);
      if(e){u.cd=st.fcd;u.a=Math.atan2(e.y-u.y,e.x-u.x);const ux=Math.cos(u.a),uy=Math.sin(u.a);R.B.push(mkB(u.x+ux*7,u.y+uy*7,ux*380*U,uy*380*U,st.dmg,0,15,{kb:0.05}));}
      else u.cd=0.2;}
  }
  for(const m of R.mods){
    if(m.t!=='satellite')continue;
    const st=stat('satellite');if(!m.sat)m.sat=[];while(m.sat.length<st.n)m.sat.push({cd:rand(0.1,0.4),x:R.x,y:R.y});
    const n=m.sat.length,ph=m.slot*1.3;
    m.sat.forEach((s,i)=>{const an=-R.t*1.6+ph+i*TAU/n;s.x=R.x+Math.cos(an)*62;s.y=R.y+Math.sin(an)*58;s.cd-=dt;
      if(s.cd<=0){const e=nearest(s.x,s.y,st.range);
        if(e){s.cd=st.fcd;const a=Math.atan2(e.y-s.y,e.x-s.x);R.B.push(mkB(s.x,s.y,Math.cos(a)*400*U,Math.sin(a)*400*U,st.dmg,0,15));SFX.shot('satellite');}
        else s.cd=0.2;}});
  }
  for(const t of R.TR){t.t+=dt;if(t.t>t.dur)t.dead=true;}
}
function weapons6(dt){melee6(dt);rings6(dt);proj6(dt);seekers6(dt);}

