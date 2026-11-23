/* ---------- 試作6：防御・補助の装備と、武器の進化（docs/design/parts.md） ---------- */
/* 敵の弾を消す（シールド・反射板・衝撃波・電磁パルス・盾ドローンなど）。吸収板があると HP ＋0.5 */
function ebGone(b,c,h){b.dead=true;spark(b.x,b.y,c||'#c4ffe3',h||'g');if(R.cs.absorb>0)R.hp=Math.min(R.maxHp,R.hp+R.cs.absorb);}
/* 黄金機雷のお金（拾うと、出撃でかせぐお金に足す） */
function addCoin(x,y,v){if(R.C.length>=120){R.gold+=v;return;}R.C.push({x,y,v,vx:rand(-50,50)*U,vy:rand(-80,-30)*U,pull:false,sp:70*U,dead:false});}
/* 絶対零度：止めた敵を倒すと、氷の破片が飛ぶ */
function zeroShards(e){for(let i=0;i<e.zn&&R.B.length<CAP.B;i++){const a=i/e.zn*TAU+rand(-0.2,0.2),v=300*U;
  R.B.push(mkB(e.x,e.y,Math.cos(a)*v,Math.sin(a)*v,e.zd,0,18,{life:0.32,kb:0.05,hits:new Set([e.id])}));}
  burst(e.x,e.y,8,['#ffffff','#bfe9ff','#5aaedc']);}
/* 氷の装甲：被弾すると、まわりの敵をこおらせる（つけた数だけ広く・長く） */
function frostNova(){const n=R.cs.frost,rad=(70+15*(n-1))*U*R.cs.area,T=2.5*(1+0.4*(n-1))*R.cs.dur;
  near(R.x,R.y,rad,e=>{const dx=e.x-R.x,dy=e.y-R.y;if(dx*dx+dy*dy>(rad+e.r)**2)return;e.slow=Math.max(e.slow,T);e.slowF=Math.min(e.slowF,0.15);});
  ring(R.x,R.y,rad,['#ffffff','#bfe9ff','#5aaedc']);R.frostFx=0.3;R.frostR=rad;SFX.play('frost');}
/* 復活装置：まわりの敵の弾を消し、敵を押しもどす */
function reviveFx(){for(const b of R.EB){const dx=b.x-R.x,dy=b.y-R.y;if(dx*dx+dy*dy<160*160)b.dead=true;}
  near(R.x,R.y,110*U,e=>{const dx=e.x-R.x,dy=e.y-R.y,d=Math.hypot(dx,dy)||1;if(d<110*U+e.r){e.kx+=dx/d*260*U;e.ky+=dy/d*260*U;}});
  burst(R.x,R.y,30,['#ffffff','#fff2a8','#ffe58a']);ring(R.x,R.y,60,['#ffffff','#ffe58a']);SFX.play('revive');}

/* 進化した武器の撃ち方（false＝撃たない：永久ノコと小さな太陽は evo10() で動く） */
const EFIRE={
  laser(m,st,ox,oy,ux,uy){m.bm=R.t;for(let k=0;k<st.n;k++){ATK++;const off=(k-(st.n-1)/2)*(st.w+4),sx=ox+ux*14-uy*off,sy=oy+uy*14+ux*off;
    for(const e of R.E){if(e.dead)continue;const dx=e.x-sx,dy=e.y-sy,pr=dx*ux+dy*uy;if(pr<-e.r||pr>st.len)continue;if(Math.abs(dx*uy-dy*ux)<=st.w/2+e.r)hit(e,st.dmg,ux*6,uy*6);}}},
  gatling(m,st,ox,oy,ux,uy){const base=Math.atan2(uy,ux);for(let k=0;k<st.n;k++){const a=base+rand(-st.spread,st.spread),off=(k-(st.n-1)/2)*7;
    R.B.push(mkB(ox+ux*14-uy*off,oy+uy*14+ux*off,Math.cos(a)*st.spd,Math.sin(a)*st.spd,st.dmg,st.pierce,16,{kb:0.08}));}},
  missile(m,st,ox,oy,ux,uy){const a=Math.atan2(uy,ux),tg=closest(ox,oy,st.n,500*U);for(let k=0;k<st.n;k++){const off=(k/(st.n-1)-0.5)*2.2;
    R.M.push({x:ox+ux*9,y:oy+uy*9,a:a+off,spd:90*U,dmg:st.dmg,rad:st.rad,target:tg.length?tg[k%tg.length]:null,life:st.life,tr:rand(0,0.04),dead:false,sw:1,turn:7,vmax:300*U});}},
  sword(m,st,ox,oy,ux,uy){const a=Math.atan2(uy,ux);
    R.S.push({m,k:'st',t:0,dur:st.dur,a,sweep:st.sweep,range:st.range,dmg:st.dmg,hits:new Set(),done:false,dead:false});
    R.S.push({m,k:'st',t:-0.24,dur:st.dur,a,rev:true,sweep:st.sweep,range:st.range,dmg:st.dmg,hits:new Set(),done:false,dead:false});},
  saw(){return false;},
  flame(m,st,ox,oy,ux,uy){return FIRE.flame(m,st,ox,oy,ux,uy);},
  thunder(m,st){let first=null,bd=1e12;for(const e of R.E){if(e.dead||e.hide||e.y<0||e.y>GH||e.x<0||e.x>GW)continue;const d=(e.x-R.x)**2+(e.y-R.y)**2;if(d<bd){bd=d;first=e;}}
    if(!first)return false;const chain=[first],pts=[[first.x,-8],[first.x,first.y]];let cur=first;
    for(let i=0;i<st.chain;i++){let nx=null,nd=st.jump*st.jump;near(cur.x,cur.y,st.jump,e=>{if(chain.includes(e))return;const d=(e.x-cur.x)**2+(e.y-cur.y)**2;if(d<nd){nd=d;nx=e;}});
      if(!nx)break;chain.push(nx);pts.push([nx.x,nx.y]);cur=nx;}
    chain.forEach(e=>hit(e,st.dmg,0,0));R.Z.push({poly:jag(pts),t:0,big:1,dead:false});},
  gravity(m,st,ox,oy,ux,uy){R.GV.push({x:ox+ux*12,y:oy+uy*12,vx:ux*60*U,vy:uy*60*U,t:0,life:st.life,r:st.r,dmg:st.dmg,cdmg:st.cdmg,core:st.core,tick:0,boom:true,bh:1,dead:false});},
  cannon(m,st,ox,oy,ux,uy){const sx=ox+ux*15,sy=oy+uy*15;
    for(const e of R.E){if(e.dead)continue;const dx=e.x-sx,dy=e.y-sy,pr=dx*ux+dy*uy;if(pr<-e.r||pr>st.len)continue;if(Math.abs(dx*uy-dy*ux)<=st.w/2+e.r)hit(e,st.dmg,ux*110,uy*110);}
    for(const b of R.EB){if(b.dead)continue;const dx=b.x-sx,dy=b.y-sy,pr=dx*ux+dy*uy;if(pr>=0&&pr<=st.len&&Math.abs(dx*uy-dy*ux)<=st.w/2+4.5)ebGone(b,'#e0fffb','w');}
    R.L.push({x:sx,y:sy,ux,uy,w:st.w,len:st.len,t:0,au:1,dead:false});},
  freeze(m,st,ox,oy,ux,uy){for(let k=0;k<st.n;k++){const off=(k-(st.n-1)/2)*8;
    R.B.push(mkB(ox+ux*14-uy*off,oy+uy*14+ux*off,ux*st.spd,uy*st.spd,st.dmg,st.pierce,17,{stopT:st.stopT,shard:st.shard,sdmg:st.sdmg,kb:0.03}));}},
  shotgun(m,st,ox,oy,ux,uy){const base=Math.atan2(uy,ux);for(let k=0;k<st.n;k++){const a=base+(k/(st.n-1)-0.5)*st.cone+rand(-0.04,0.04),v=st.spd*rand(0.9,1.1);
    R.B.push(mkB(ox+ux*12,oy+uy*12,Math.cos(a)*v,Math.sin(a)*v,st.dmg,st.pierce,19,{life:st.life,max:st.life,d0:st.dmg,kb:0.5}));}},
  mine(m,st,ox,oy,ux,uy){const base=Math.atan2(uy,ux);for(let k=0;k<st.n;k++){const a=base+(k-(st.n-1)/2)*0.45;
    R.MN.push({x:ox+ux*9,y:oy+uy*9,vx:Math.cos(a)*100*U,vy:Math.sin(a)*100*U,t:0,dmg:st.dmg,rad:st.rad,life:st.life,gold:1,dead:false});}},
  gsword(m,st,ox,oy,ux,uy){R.S.push({m,k:'gs',gd:1,t:0,dur:st.dur,a:Math.atan2(uy,ux),sweep:st.sweep,range:st.range,dmg:st.dmg,l8:true,hits:new Set(),done:false,dead:false});
    m.gsh=Math.min(st.gmax,(m.gsh||0)+1);},
  plasma(m,st,ox,oy,ux,uy){return FIRE.plasma(m,st,ox,oy,ux,uy);},/* 球はそのまま撃つ。太陽は evo10() */
};
/* 盾ドローン・前面シールド・守護の大剣の盾・緊急バリア */
function shields10(dt){
  let si=0;
  for(const m of R.mods){
    if(m.t==='sdrone'){const st=stat('sdrone'),orb=st.orb+si*12;si++;m.sa=(m.sa==null?m.slot*1.3:m.sa)+dt*st.w;
      if(!m.sp)m.sp=[];m.sp.length=st.n;
      for(let i=0;i<st.n;i++){const a=m.sa+i*TAU/st.n,p=m.sp[i]||(m.sp[i]={});p.x=R.x+Math.cos(a)*orb;p.y=R.y+Math.sin(a)*orb*0.92;p.r=st.r;p.l8=st.l8;
        for(const b of R.EB){if(b.dead)continue;const dx=b.x-p.x,dy=b.y-p.y,rr=st.r+(b.big?8:5);if(dx*dx+dy*dy<=rr*rr){ebGone(b,'#d2ffe8','g');SFX.play('shield');}}}}
    else if(m.t==='fshield'){const st=stat('fshield');if(m.fh==null){m.fh=st.hp;m.fr=0;m.fg=0;m.fm=st.hp;}
      if(st.hp>m.fm){if(m.fh>0)m.fh+=st.hp-m.fm;m.fm=st.hp;}/* Lv で耐久の上限がふえたら、ふえた分をいまの耐久に足す */
      if(m.fh<=0){m.fr-=dt;if(m.fr<=0){m.fh=st.hp;m.fg=0;SFX.play('barrier');}continue;}
      if(m.fh<st.hp){m.fg+=dt;if(m.fg>=2.5){m.fg=0;m.fh++;}}/* 割れていなければ2.5秒で1ずつ戻る */
      const a=dirAngle(m.d),lo=(st.R-14)**2,hi=(st.R+6)**2;
      for(const b of R.EB){if(b.dead)continue;const dx=b.x-R.x,dy=b.y-R.y,d2=dx*dx+dy*dy;if(d2>hi||d2<lo)continue;
        if(Math.abs(angDiff(Math.atan2(dy,dx),a))>st.half)continue;
        ebGone(b,'#dcfffb','g');m.fh--;m.fg=0;SFX.play('shield');
        if(m.fh<=0){m.fr=st.regen;burst(R.x+Math.cos(a)*st.R,R.y+Math.sin(a)*st.R,14,['#ffffff','#8cf0c8','#18b0b4']);SFX.play('fsbreak');break;}}}
    else if(m.t==='gsword'&&R.evo.gsword&&m.gsh>0){m.ga=(m.ga||0)+dt*2.2;if(!m.gp)m.gp=[];m.gp.length=m.gsh;
      for(let i=0;i<m.gsh;i++){const a=m.ga+i*TAU/m.gsh,p=m.gp[i]||(m.gp[i]={});p.x=R.x+Math.cos(a)*66;p.y=R.y+Math.sin(a)*66*0.92;}
      for(let i=0;i<m.gp.length;i++){const p=m.gp[i];for(const b of R.EB){if(b.dead)continue;const dx=b.x-p.x,dy=b.y-p.y,rr=b.big?14:11;
        if(dx*dx+dy*dy<=rr*rr){ebGone(b,'#e3eaff','w');burst(p.x,p.y,6,['#e3eaff','#ffffff']);m.gsh--;m.gp.splice(i,1);i--;break;}}}}/* 盾は弾を1発防ぐと消える */
  }
  if(R.ebT>0){R.ebT-=dt;for(const b of R.EB){if(b.dead)continue;const dx=b.x-R.x,dy=b.y-R.y;if(dx*dx+dy*dy<=62*62)ebGone(b,'#c4ffe3','g');}}
}
/* 回収ドローン：経験値の玉とお金を拾いに行き、機体へ送る（1つにつき1機） */
function drones10(dt){
  while(R.CD.length<R.cs.cdrone)R.CD.push({x:R.x,y:R.y,tg:null,rt:R.CD.length*0.1,a:R.CD.length*2.1});
  for(const d of R.CD){
    d.rt-=dt;if(d.tg&&(d.tg.dead||d.tg.pull))d.tg=null;
    if(!d.tg&&d.rt<=0){d.rt=0.2;d.tg=pickLoot(d);}
    let tx,ty,sp;
    if(d.tg){tx=d.tg.x;ty=d.tg.y;sp=320*U;}else{d.a+=dt*2;tx=R.x+Math.cos(d.a)*34;ty=R.y+40+Math.sin(d.a)*10;sp=240*U;}
    const dx=tx-d.x,dy=ty-d.y,dd=Math.hypot(dx,dy)||1,st=Math.min(dd,sp*dt);d.x+=dx/dd*st;d.y+=dy/dd*st;
    if(d.tg&&dd<12){d.tg.pull=true;d.tg=null;}
  }
}
function pickLoot(d){let best=null,bd=(300*U)**2;
  const look=(arr,w)=>{for(const g of arr){if(g.dead||g.pull||g.y<0||g.y>GH)continue;let taken=false;for(const o of R.CD)if(o!==d&&o.tg===g){taken=true;break;}if(taken)continue;
    const v=((g.x-d.x)**2+(g.y-d.y)**2)*w;if(v<bd){bd=v;best=g;}}};
  look(R.C,0.4);look(R.G,1);return best;}
/* 進化した武器のうち、ずっと動くもの：永久ノコ・蒼い業火の渦・小さな太陽 */
function evo10(dt){
  for(const m of R.mods){
    if(!R.evo[m.t])continue;
    if(m.t==='saw'){const st=stat('saw'),orb=st.orb*(1+0.45*Math.sin(R.t*1.3+m.slot));m.ea=(m.ea==null?m.slot:m.ea)+dt*st.w;if(!m.ep)m.ep=[];m.ep.length=st.n;
      for(let i=0;i<st.n;i++){const a=m.ea+i*TAU/st.n,p=m.ep[i]||(m.ep[i]={}),x=R.x+Math.cos(a)*orb,y=R.y+Math.sin(a)*orb;p.x=x;p.y=y;
        HSRC=1;near(x,y,st.r,e=>{const dx=e.x-x,dy=e.y-y,rr=st.r+e.r;if(dx*dx+dy*dy>rr*rr||R.t-e.sawT<0.15)return;e.sawT=R.t;const d=Math.hypot(dx,dy)||1;hit(e,st.dmg,dx/d*60*U,dy/d*60*U);spark(x+dx/2,y+dy/2,'#ffffff');});HSRC=0;}
      if(((R.t*3)|0)!==(((R.t-dt)*3)|0))SFX.shot('esaw');}
    else if(m.t==='flame'){const st=stat('flame');m.vt=(m.vt||0)-dt;if(m.vt<=0){m.vt=st.vtick;
        near(R.x,R.y,st.vR,e=>{const dx=e.x-R.x,dy=e.y-R.y,d=Math.hypot(dx,dy)||1;if(d>st.vR+e.r)return;hit(e,st.vdmg,-dy/d*40*U,dx/d*40*U);});}}
    else if(m.t==='plasma'){const st=stat('plasma'),orb=st.orb*(1+0.25*Math.sin(R.t*0.9+m.slot));m.ea=(m.ea==null?m.slot:m.ea)+dt*st.w;if(!m.ep)m.ep=[];m.ep.length=st.sn;m.vt=(m.vt||0)-dt;const tk=m.vt<=0;if(tk)m.vt=st.tick;
      for(let i=0;i<st.sn;i++){const a=m.ea+i*TAU/st.sn,p=m.ep[i]||(m.ep[i]={}),x=R.x+Math.cos(a)*orb,y=R.y+Math.sin(a)*orb*0.92;p.x=x;p.y=y;p.r=st.sr;
        if(tk)near(x,y,st.sr,e=>{const dx=e.x-x,dy=e.y-y,rr=st.sr+e.r*0.7;if(dx*dx+dy*dy<=rr*rr)hit(e,st.sdmg,0,0);});}}
  }
}
function defs10(dt){shields10(dt);drones10(dt);evo10(dt);if(R.dodge>0)R.dodge-=dt;if(R.frostFx>0)R.frostFx-=dt;}
/* 進化：武器 Lv8（アルケミストは Lv6・#11）＋相手の装備をつけている */
const evoLv=()=>R.sh.evoLv||WMAX;
function evoReady(){const out=[];for(const t in EVO){if(R.evo[t]||R.tlv[t]<evoLv())continue;const p=EVO[t].p;if(R.mods.some(m=>m.t===p))out.push(t);}return out;}
function evolve(t){R.evo[t]=true;R.evoN++;for(const m of R.mods)if(m.t===t){m.cd=0.2;m.bq=0;}
  if(!save.evo)save.evo={};if(!save.evo[t]){save.evo[t]=1;persist();}
  if(t==='plasma')sunSpr(stat('plasma').sr);/* 太陽の絵は進化したときに作る（レベルアップの画面の間） */
  SFX.play('evo');showBanner(MODS[t].name+'が'+EVO[t].name+'に進化');}
/* 絵：ブラックホール */
function drawBH(g,o){const n=40;for(let i=0;i<n;i++){const k=((i/n+R.t*0.6)%1),a=i*2.4-R.t*4,rr=o.r*(1-k)*0.9+10;
    g.fillStyle=k>0.8?'#ffffff':k>0.5?'#e6dcff':'#a98bff';px2(g,o.x+Math.cos(a)*rr,o.y+Math.sin(a)*rr);}
  arcPix(g,o.x,o.y,0,Math.PI,15,'#e6dcff',0.9,2);DS(g,BHS,o.x,o.y);}
/* 絵：防御・補助・進化（機体の上） */
function draw10(g,px,py){
  if(R.dodge>0){g.globalAlpha=0.35*R.dodge/0.3;g.drawImage(R.spr.img,px-R.spr.cx-9,py-R.spr.cy);g.drawImage(R.spr.img,px-R.spr.cx+9,py-R.spr.cy);g.globalAlpha=1;}
  for(const m of R.mods){
    if(m.t==='flame'&&R.evo.flame){const st=stat('flame'),f=(R.t*14)|0;/* 3本の炎の腕が回る渦（白 → 水色 → 青） */
      for(let arm=0;arm<3;arm++)for(let j=0;j<22;j++){const k=j/21,a=R.t*4+arm*TAU/3+k*1.5,rr=st.vR*(0.35+0.65*k),q=(j*5+arm*3+f)%4,x=px+Math.cos(a)*rr,y=py+Math.sin(a)*rr*0.92;
        const s=Math.round(6-3*k)+(q===0?1:0);g.fillStyle=k<0.2?'#ffffff':k<0.45?'#bff8ff':k<0.7?'#6af0ff':'#2f7fb8';g.fillRect(Math.round(x-s/2),Math.round(y-s/2),s,s);
        if(q===1){g.fillStyle='#173690';px2(g,x-Math.sin(a)*4,y+Math.cos(a)*4);}}}
    else if(m.t==='laser'&&R.evo.laser&&R.t-(m.bm==null?-9:m.bm)<0.12){const st=stat('laser'),a=dirAngle(m.d),ux=Math.cos(a),uy=Math.sin(a),ox=px+SLOTS[m.slot].x+ux*14,oy=py+SLOTS[m.slot].y+uy*14,f=((R.t*30)|0)%2;
      for(let k=0;k<st.n;k++){const off=(k-(st.n-1)/2)*(st.w+4);g.save();g.translate(Math.round(ox-uy*off),Math.round(oy+ux*off));g.rotate(a);
        g.globalAlpha=0.5;g.fillStyle='#2659d0';g.fillRect(0,-st.w/2-3-f,st.len,st.w+6+f*2);g.globalAlpha=1;g.fillStyle='#4cc9ff';g.fillRect(0,-st.w/2,st.len,st.w);
        g.fillStyle='#e0fbff';g.fillRect(0,-st.w/6,st.len,Math.max(2,st.w/3));g.restore();}}
    else if(m.t==='saw'&&R.evo.saw&&m.ep){const fr=SAWB[((R.t*20)|0)%2];for(const p of m.ep)DS(g,fr,p.x,p.y);}
    else if(m.t==='plasma'&&R.evo.plasma&&m.ep){for(const p of m.ep){DS(g,sunSpr(p.r),p.x,p.y);g.fillStyle='#fff2a8';
        for(let i=0;i<12;i++){const a=R.t*2+i*TAU/12,rr=p.r+3+((i+((R.t*12)|0))%3)*2;px2(g,p.x+Math.cos(a)*rr,p.y+Math.sin(a)*rr);}}}
    else if(m.t==='sdrone'&&m.sp){for(const p of m.sp)DS(g,sdSpr(p.r,p.l8),p.x,p.y);}
    else if(m.t==='fshield'&&m.fh>0){const st=stat('fshield'),a=dirAngle(m.d),k=m.fh/st.hp;
      arcPix(g,px,py,a,st.half,st.R,st.l8?'#ffffff':'#dcfffb',0.45+0.55*k,1.8);arcPix(g,px,py,a,st.half,st.R-3,'#5cffef',0.3+0.5*k,1.8);
      if(st.l8)arcPix(g,px,py,a,st.half,st.R-6,'#18b0b4',0.2+0.4*k,2);}
    else if(m.t==='gsword'&&R.evo.gsword&&m.gp)for(const p of m.gp)DS(g,GSHD,p.x,p.y);
  }
  for(const d of R.CD)DS(g,CDRN,d.x,d.y);
  if(R.ebT>0&&(R.ebT>0.8||((R.t*12)|0)%2)){arcPix(g,px,py,0,Math.PI,60,'#ffffff',1,2);arcPix(g,px,py,0,Math.PI,57,'#5dffb0',0.6,2.4);arcPix(g,px,py,0,Math.PI,54,'#1fae63',0.35,2.8);}
  if(R.frostFx>0){const rr=R.frostR*(1-R.frostFx/0.3);if(rr>4){arcPix(g,px,py,0,Math.PI,rr,'#ffffff',R.frostFx/0.3,2.5);arcPix(g,px,py,0,Math.PI,rr-3,'#bfe9ff',R.frostFx/0.3*0.7,3);}}
}

/* 絵：水たまり・炎の帯（2コマ・ドット） */
const PDC={},PDCOL={fire:['#173690','#2f7fb8','#6af0ff','#e0fbff'],fire8:['#2659d0','#4adcf6','#bff8ff','#ffffff'],acid:['#0f4a1e','#1fae63','#7ee04a','#d2ffb0'],acid8:['#1f6a2e','#3fd07a','#b4ff6a','#f0ffd8']};
function pdSpr(k,r,f){const key=k+(r|0)+'_'+f;if(PDC[key])return PDC[key];
  const R0=Math.max(4,Math.round(r)),w=R0*2+1,c=document.createElement('canvas');c.width=w;c.height=w;const g=c.getContext('2d');
  const cols=PDCOL[k];
  for(let y=0;y<w;y++)for(let x=0;x<w;x++){const dx=x-R0,dy=y-R0,d=Math.hypot(dx,dy)/R0;if(d>1)continue;
    const n=(x*7+y*13+f*11)%9;let ci;
    if(d>0.82)ci=n<5?2:1;else if(k[0]==='f')ci=n<2?3:n<5?2:n<7?1:-1;else ci=n<1?3:n<3?2:n<6?1:0;
    if(ci<0)continue;g.fillStyle=cols[ci];g.fillRect(x,y,1,1);}
  return PDC[key]=c;}
const CLUS=paint(9,9,[{m:'steel',r:2.5,f:g=>E(g,4,4,4)},{m:'gold',r:1,f:g=>{E(g,2.8,3,1.1);E(g,5.6,5.2,1.1);}}],{});
const CLUS8=paint(11,11,[{m:'steel',r:3,b:0.12,f:g=>E(g,5,5,5)},{m:'yel',r:1,f:g=>{E(g,3.4,3.6,1.3);E(g,6.8,6.4,1.3);}}],{});
const PRISMC=['#4588f2','#ffcd48','#5dffb0','#a98bff'];
/* 敵より下：水たまり・炎の帯・砲台 */
function draw6Under(g){
  for(const p of R.PD){const k=1-p.t/p.life,s=pdSpr(p.k,p.r,p.k[0]==='f'?((R.t*8+p.x)|0)%2:0);
    g.globalAlpha=Math.min(1,k*3)*(p.k[0]==='f'?0.85:0.7);g.drawImage(s,Math.round(p.x)-(s.width>>1),Math.round(p.y)-(s.height>>1));}
  g.globalAlpha=1;
  for(const u of R.TU){if(u.life-u.t<1.5&&((R.t*10)|0)%2)continue;DS(g,u.l8?TURRET8:TURRET,u.x,u.y);
    const ux=Math.cos(u.a),uy=Math.sin(u.a);for(let i=3;i<=8;i++){g.fillStyle=i===8?'#d2d9e8':'#5f6a86';px2(g,u.x+ux*i,u.y+uy*i);}}
}
/* 敵より上：投げた弾・魚雷・球・輪・気絶の印 */
function draw6Over(g){
  for(const e of R.E){if(e.stun>0){g.fillStyle=((R.t*12)|0)%2?'#fff2a8':'#ffffff';const a=R.t*9;
    px2(g,e.x+Math.cos(a)*e.r*0.7,e.y-e.r-3+Math.sin(a)*2);px2(g,e.x-Math.cos(a)*e.r*0.7,e.y-e.r-3-Math.sin(a)*2);}}
  for(const q of R.Q){
    if(q.k==='lob'){const p=Math.min(1,q.t/q.T),x=q.x0+(q.x1-q.x0)*p,y=q.y0+(q.y1-q.y0)*p,z=Math.sin(Math.PI*p)*q.h;
      g.fillStyle='#060a1c';g.globalAlpha=0.45;g.fillRect(Math.round(x)-2,Math.round(y)+1,5,2);g.globalAlpha=1;DS(g,q.spr,x,y-z);}
    else if(q.k==='torp')DS(g,TORP[((Math.round(q.a/(Math.PI/8))%16)+16)%16],q.x,q.y);
    else if(q.k==='orb'){const s=orbSpr(q.r);DS(g,s,q.x,q.y);g.fillStyle='#e6dcff';
      const nf=q.l8?10:6;if(q.l8)g.fillStyle='#ffffff';for(let i=0;i<nf;i++){const a=R.t*4+i*TAU/nf,rr=q.r+2+((i+((R.t*14)|0))%3);px2(g,q.x+Math.cos(a)*rr,q.y+Math.sin(a)*rr);}}
    else if(q.k==='nap'){g.fillStyle='#2f7fb8';px3(g,q.x-q.vx*0.02,q.y-q.vy*0.02);g.fillStyle='#6af0ff';px3(g,q.x,q.y);g.fillStyle='#ffffff';g.fillRect(Math.round(q.x),Math.round(q.y),1,1);}
  }
  g.dense(1);/* 輪はまとめて描く（#34） */
  for(let q=0;q<2;q++)for(const r of q?R.RH:R.RG){if(r.t<0)continue;/* 2つの配列を順に（毎フレーム新しい配列を作らない） */
    const fade=r.t>r.dur?Math.max(0,1-(r.t-r.dur)/0.15):1,cr=r.noHit?r.R*Math.min(1,r.t/r.dur):(r.cr||0);if(cr<2)continue;
    const st=Math.max(2.2,cr*TAU/360);/* 大きな輪は点の数を360までにする */
    switch(r.k){
      case 'shock':arcPix(g,r.x,r.y,0,Math.PI,cr,'#ffffff',fade,st);arcPix(g,r.x,r.y,0,Math.PI,cr-3,'#8cc2ff',fade*0.7,st*1.2);if(r.l8)arcPix(g,r.x,r.y,0,Math.PI,cr-6,'#dcefff',fade*0.6,st*1.3);break;
      case 'halo':arcPix(g,r.x,r.y,0,Math.PI,cr,r.l8?'#ffffff':'#fff6c0',fade,st);arcPix(g,r.x,r.y,0,Math.PI,cr-2,'#ffd84a',fade*0.8,st*1.1);arcPix(g,r.x,r.y,0,Math.PI,cr-5,'#ec9a1e',fade*0.35,st*1.4);break;
      case 'sonic':for(let j=0;j<(r.l8?4:3);j++){const rr=cr-j*9;if(rr>4)arcPix(g,r.x,r.y,r.a,r.half,rr,j?'#a8b8ff':r.l8?'#ffffff':'#e6ecff',fade*(1-j*0.2),2);}break;
      case 'emp':{const n=Math.min(360,Math.ceil(TAU*cr/3));g.globalAlpha=fade;for(let i=0;i<n;i++){const a=i/n*TAU,j=((i*5+((R.t*30)|0))%4)-1.5;
        g.fillStyle=i%3?'#7ff6ff':'#ffffff';(r.l8?px3:px2)(g,r.x+Math.cos(a)*(cr+j),r.y+Math.sin(a)*(cr+j));}g.globalAlpha=1;break;}
      case 'ham':{arcPix(g,r.x,r.y,0,Math.PI,cr,r.l8?'#ffffff':'#e6dcff',fade,2);arcPix(g,r.x,r.y,0,Math.PI,cr-3,'#9a7cff',fade*0.6,2.4);
        if(r.t<0.16){g.save();g.translate(Math.round(r.x),Math.round(r.y));g.rotate(r.a+Math.PI/2);if(r.l8)g.scale(1.3,1.3);g.fillStyle='#3c2496';g.fillRect(-9,-6,18,10);g.fillStyle='#a98bff';g.fillRect(-8,-5,16,8);
          g.fillStyle='#e6dcff';g.fillRect(-8,-5,16,2);g.fillStyle='#949fb8';g.fillRect(-1,4,3,10);g.restore();}break;}
    }
  }
  g.dense(0);
}
/* 機体の上：チェーンソーの刃・レールガンのため・衛星・近接の振り */
function draw6Ship(g,px,py){
  for(const m of R.mods){
    if(m.t==='chainsaw'){const st=stat('chainsaw'),a=dirAngle(m.d),ux=Math.cos(a),uy=Math.sin(a),ox=px+SLOTS[m.slot].x+ux*8,oy=py+SLOTS[m.slot].y+uy*8,L=st.len,sh=(R.t*60)|0;
      for(let i=0;i<=L;i+=2){const x=ox+ux*i,y=oy+uy*i;g.fillStyle=i>L-3?'#eef0ff':'#7a83a8';px3(g,x,y);g.fillStyle='#b8bfdc';g.fillRect(Math.round(x),Math.round(y),1,1);
        if(((i>>1)+sh)%3===0){g.fillStyle=st.l8?'#fff2a8':'#f0e060';px2(g,x-uy*3,y+ux*3);px2(g,x+uy*3,y-ux*3);}}}
    else if(m.t==='rail'){const st=stat('rail');if(m.cd<st.chg){const a=dirAngle(m.d),q=1-Math.max(0,m.cd)/st.chg,r=Math.round(1+q*3),mx=px+SLOTS[m.slot].x+Math.cos(a)*15,my=py+SLOTS[m.slot].y+Math.sin(a)*15;
      g.fillStyle=(((R.t*24)|0)%2)?'#ffffff':'#9fd0ff';g.fillRect(Math.round(mx)-r,Math.round(my)-r,r*2,r*2);}}
    else if(m.t==='satellite'&&m.sat){const s8=stat('satellite').l8;for(const s of m.sat)DS(g,s8?SAT8:SAT,s.x,s.y);}
  }
  g.dense(1);/* 近接の振りはまとめて描く（#34） */
  for(const s of R.S){
    if(!s.k||s.t<0)continue;
    const cx=s.m.cx||0,cy=s.m.cy||0,[ox,oy]=s.k==='sc'?[px+cx,py+cy]:[px+SLOTS[s.m.slot].x+cx,py+SLOTS[s.m.slot].y+cy],p=Math.min(1,s.t/s.dur),fade=s.t>s.dur?Math.max(0,1-(s.t-s.dur)/0.12):1;
    if(s.k==='gs'||s.k==='tw'||s.k==='sc'||s.k==='st'){
      const full=s.k==='sc'?TAU:s.sweep,dir=s.rev?-1:1,a0=s.k==='sc'?s.a:s.a-dir*full/2,ext=full*p,tailL=s.k==='sc'?2.2:1.3;
      const cols=s.k==='st'?['#ffffff','#fff6c0','#c09cff','#6a48e0']:s.k==='gs'?['#ffffff','#e3eaff','#bfd0f0','#7d97cf']:s.k==='tw'?(s.l8?['#ffffff','#ffffff','#dcfffb','#5cffef']:['#ffffff','#dcfffb','#7ff0ff','#18b0b4']):['#ffffff','#e6dcff','#c09cff','#6a48e0'];
      const R0=s.k==='sc'?s.R:s.range,depth=s.k==='st'?0.2:s.k==='gs'?0.45:s.k==='sc'?0.3:0.35;
      for(let rad=R0,j=0;rad>R0*(1-depth);rad-=s.k==='st'?4:2,j++){
        g.globalAlpha=fade*Math.max(0.25,1-j*0.07);g.fillStyle=j===0?cols[0]:j<3?cols[1]:j<6?cols[2]:cols[3];
        const e1=ext,e0=Math.max(0,ext-tailL),n=Math.max(1,Math.ceil((e1-e0)*rad/(s.k==='st'?2.2:1.6)));
        for(let i=0;i<=n;i++){const an=a0+dir*(e0+(e1-e0)*i/n);px2(g,ox+Math.cos(an)*rad,oy+Math.sin(an)*rad);}}
      g.globalAlpha=1;
      if(s.k==='st'&&p<1){const an=a0+dir*ext;for(let i=0;i<5;i++){const rr=R0*(0.6+0.1*i),x=Math.round(ox+Math.cos(an)*rr),y=Math.round(oy+Math.sin(an)*rr);
        g.fillStyle=i%2?'#fff6c0':'#ffffff';g.fillRect(x-3,y,7,1);g.fillRect(x,y-3,1,7);g.fillRect(x-1,y-1,3,3);}}
      if(s.k==='sc'&&p<1){const an=a0+ext;g.fillStyle=s.l8?'#ffffff':'#e6dcff';
        for(let i=0;i<7;i++){const b2=an-0.5+i*0.07,rr=s.R-2-i*1.2;px3(g,ox+Math.cos(b2)*rr,oy+Math.sin(b2)*rr);}}}
    else if(s.k==='ln'){const ux=Math.cos(s.a),uy=Math.sin(s.a),L=s.len*Math.min(1,p*1.6);g.globalAlpha=fade;
      for(let i=6;i<=L;i+=2){const x=ox+ux*i,y=oy+uy*i,w=i>L-10?Math.max(1,(L-i)/3):2.5;g.fillStyle=i>L-10?'#ffffff':'#a8c8ff';g.fillRect(Math.round(x-w/2),Math.round(y-w/2),Math.ceil(w)+1,Math.ceil(w)+1);}
      g.globalAlpha=1;}
    else if(s.k==='wh'){const off=s.cur==null?0:s.cur,a=s.a+off,bend=(s.pi%2?-1:1)*0.35;g.globalAlpha=fade;
      for(let i=1;i<=24;i++){const k=i/24,an=a-bend*Math.sin(Math.PI*k)*(1-k*0.3),rr=s.len*k;g.fillStyle=i>21?'#ffffff':i%2?(s.l8?'#d2ffe8':'#7dff9a'):(s.l8?'#5dffb0':'#1fae63');
        (s.l8?px3:px2)(g,ox+Math.cos(an)*rr,oy+Math.sin(an)*rr);}g.globalAlpha=1;}
  }
  g.dense(0);
}
/* 弾より上：追尾レーザー・狙撃とレールガンの線 */
function draw6Top(g){g.dense(1);/* #34 */
  for(const h of R.HL){const t=h.tr,n=t.length>>1;
    for(let i=0;i<n;i++){const x=t[i*2],y=t[i*2+1],k=i/n;g.fillStyle=k>(h.l8?0.6:0.8)?'#ffffff':k>0.4?'#6dffa0':'#1fae63';(k>0.4||h.l8?px3:px2)(g,x,y);
      if(i>0){g.fillRect(Math.round((x+t[i*2-2])/2)-1,Math.round((y+t[i*2-1])/2)-1,2,2);}}}
  for(const t of R.TR){const k=1-t.t/t.dur,dx=t.x1-t.x0,dy=t.y1-t.y0,l=Math.hypot(dx,dy)||1,n=Math.ceil(l/3);g.globalAlpha=k;
    for(let i=0;i<n;i+=1){const x=t.x0+dx*i/n,y=t.y0+dy*i/n;if(x<-4||x>GW+4||y<-4||y>GH+4)break;g.fillStyle=i%2?t.c:'#ffffff';const tw=t.w||2;g.fillRect(Math.round(x)-(tw>2?1:0),Math.round(y)-(tw>2?1:0),tw,tw);}
    g.globalAlpha=1;}
  g.dense(0);
}
/* 試作6の弾の絵（kind 7〜15） */
function drawB6(g,b,ux,uy){
  const big=b.l8?1:0;
  switch(b.k){
    case 7:for(let k=2;k>=0;k--){g.fillStyle=k?'#5ce1ff':'#e0fbff';(big?px3:px2)(g,b.x-ux*k*2,b.y-uy*k*2);}break;
    case 8:for(let k=16;k>=0;k--){const x=b.x-ux*k*3,y=b.y-uy*k*3;g.fillStyle=k>10?(b.l8?'#4588f2':'#2659d0'):(b.l8?'#dcefff':'#9fd0ff');px3(g,x,y);g.fillStyle='#ffffff';if(k<12)g.fillRect(Math.round(x),Math.round(y),1,1);}break;
    case 9:for(let k=4;k>=0;k--){g.fillStyle=k?'#5dffb0':'#ffffff';(big?px3:px2)(g,b.x-ux*k*2,b.y-uy*k*2);}break;
    case 10:{const z=b.l8?1:0;g.fillStyle='#b8600e';g.fillRect(Math.round(b.x)-2-z,Math.round(b.y)-2-z,5+z*2,5+z*2);g.fillStyle=b.l8?'#fff2a8':'#ffd84a';g.fillRect(Math.round(b.x)-2-z,Math.round(b.y)-2-z,4+z*2,4+z*2);g.fillStyle='#ffffff';g.fillRect(Math.round(b.x)-1,Math.round(b.y)-1,2+z,2+z);break;}
    case 11:if(b.gen){g.fillStyle=b.l8?'#e6dcff':'#c39bff';(b.l8?px3:px2)(g,b.x,b.y);}else{const z=b.l8?1:0;g.fillStyle='#3c2496';g.fillRect(Math.round(b.x)-2-z,Math.round(b.y)-2-z,5+z*2,5+z*2);g.fillStyle=b.l8?'#e6dcff':'#c39bff';g.fillRect(Math.round(b.x)-2-z,Math.round(b.y)-2-z,4+z*2,4+z*2);g.fillStyle='#ffffff';g.fillRect(Math.round(b.x)-1,Math.round(b.y)-1,1,1);}break;
    case 12:for(let k=b.l8?5:3;k>=0;k--){g.fillStyle=k?(b.l8?'#f4fcff':'#bfe9ff'):'#ffffff';g.fillRect(Math.round(b.x-ux*k*2),Math.round(b.y-uy*k*2),1,1);g.fillRect(Math.round(b.x-ux*(k*2+1)),Math.round(b.y-uy*(k*2+1)),1,1);}break;
    case 13:g.fillStyle='#1fae63';g.fillRect(Math.round(b.x)-2,Math.round(b.y)-2,5,5);g.fillStyle='#a4f55c';g.fillRect(Math.round(b.x)-2,Math.round(b.y)-2,4,4);g.fillStyle='#d2ffb0';g.fillRect(Math.round(b.x)-1,Math.round(b.y)-1,1,1);break;
    case 14:g.fillStyle=PRISMC[b.col||0];(b.gen&&!b.l8?px2:px3)(g,b.x,b.y);if(!b.gen){g.fillStyle='#ffffff';g.fillRect(Math.round(b.x),Math.round(b.y),1,1);}g.fillStyle=PRISMC[((b.col||0)+1)%4];px2(g,b.x-ux*3,b.y-uy*3);break;
    case 15:g.fillStyle='#2f7fb8';px2(g,b.x-ux*3,b.y-uy*3);g.fillStyle='#7ad8ff';px2(g,b.x,b.y);g.fillStyle='#ffffff';g.fillRect(Math.round(b.x),Math.round(b.y),1,1);break;
    case 16:for(let k=3;k>=0;k--){g.fillStyle=k>1?'#4588f2':k?'#8cc2ff':'#ffffff';px3(g,b.x-ux*k*2.5,b.y-uy*k*2.5);}break;
    case 17:{const x=Math.round(b.x),y=Math.round(b.y);g.fillStyle='#5aaedc';px3(g,b.x-ux*5,b.y-uy*5);g.fillStyle='#bfe9ff';g.fillRect(x-1,y-4,3,9);g.fillRect(x-4,y-1,9,3);g.fillStyle='#ffffff';g.fillRect(x-1,y-1,3,3);break;}
    case 18:g.fillStyle='#bfe9ff';px2(g,b.x-ux*2,b.y-uy*2);g.fillStyle='#ffffff';px2(g,b.x,b.y);break;
    case 19:{const x=Math.round(b.x),y=Math.round(b.y);g.fillStyle='#5a3a04';g.fillRect(x-3,y-3,7,7);g.fillStyle='#e0a418';g.fillRect(x-3,y-3,6,6);g.fillStyle='#ffd84a';g.fillRect(x-3,y-3,5,5);g.fillStyle='#ffffff';g.fillRect(x-2,y-2,2,2);break;}
  }
}
const SPK={16:'#dcefff',17:'#ffffff',18:'#e9f8ff',19:'#fff6c0',0:'#bfefff',1:'#c4ffe3',3:'#e9f8ff',4:'#ffffff',5:'#c9d6ff',6:'#ffe2a8',7:'#c0f4ff',8:'#ffffff',9:'#c4ffe3',10:'#fff2a8',11:'#e6dcff',12:'#ffffff',13:'#d2ffb0',14:'#ffffff',15:'#c0f4ff'};
function moveBullets(dt){
  for(const b of R.B){
    if(b.life!=null){b.life-=dt;if(b.life<=0){b.dead=true;if(b.pd)addPD('acid',b.x,b.y,b.pd);continue;}if(b.d0)b.dmg=b.d0*(0.5+b.life/b.max);}
    const steps=Math.max(1,Math.ceil(Math.hypot(b.vx,b.vy)*dt/9)),sx=b.vx*dt/steps,sy=b.vy*dt/steps;
    for(let s=0;s<steps&&!b.dead;s++){
      b.x+=sx;b.y+=sy;
      if(b.k===10&&b.bnc>0&&bounceEdge(b))continue;
      if(b.x<-15||b.x>GW+15||b.y<-15||b.y>GH+15){b.dead=true;break;}
      near(b.x,b.y,6,e=>{
        if(b.hits&&b.hits.has(e.id))return;
        if(b.last===e.id)return;
        const dx=e.x-b.x,dy=e.y-b.y,rr=e.r+(b.k===2||b.k===8?6:3);
        if(dx*dx+dy*dy<=rr*rr){
          const kb=b.kb!=null?b.kb:0.12;LKB=1;hit(e,b.dmg,b.vx*kb,b.vy*kb);LKB=0;
          if(b.slowT){e.slow=Math.max(e.slow,b.slowT);e.slowF=Math.min(e.slowF,b.slowF);}
          if(b.k!==2)spark(b.x,b.y,SPK[b.k]||'#ffffff',b.k===1?'g':b.k===6?'y':'w');
          if(b.k>=10&&onHit6(b,e))return true;
          if(b.pierce>0){b.pierce--;b.hits.add(e.id);}else{b.dead=true;return true;}
        }
      });
    }
  }
}
function explode(ms){ms.dead=true;
  if(ms.sw){blast(ms.x,ms.y,ms.rad,ms.dmg,90*U,['#ffffff','#8cc2ff','#4588f2']);addX(ms.x,ms.y,EXPL.s,0.3);return;}/* スウォームミサイル */
  if(ms.sm){blast(ms.x,ms.y,ms.rad,ms.dmg,50*U,['#fff2a8','#ffffff','#ffe58a']);addX(ms.x,ms.y,EXPL.s,0.24);return;}/* マイクロミサイル */
  blast(ms.x,ms.y,ms.rad,ms.dmg,107*U,['#ffd23f','#fff3b0','#ff9f43']);addX(ms.x,ms.y,EXPL.s,0.3);}
function moveMissiles(dt){
  for(const ms of R.M){
    if(ms.dead)continue;
    ms.life-=dt;
    if(!ms.target||ms.target.dead)ms.target=nearest(ms.x,ms.y,ms.sw?600*U:280*U);
    if(ms.target){const want=Math.atan2(ms.target.y-ms.y,ms.target.x-ms.x),mt=(ms.turn||5.5)*dt;ms.a+=clamp(angDiff(want,ms.a),-mt,mt);}
    ms.spd=Math.min(ms.vmax||285*U,ms.spd+360*U*dt);
    ms.x+=Math.cos(ms.a)*ms.spd*dt;ms.y+=Math.sin(ms.a)*ms.spd*dt;
    ms.tr-=dt;if(ms.tr<=0){ms.tr=ms.sm?0.06:0.03;addPart(ms.x-Math.cos(ms.a)*6,ms.y-Math.sin(ms.a)*6,rand(-15,15),rand(-15,15),ms.sm?0.18:0.3,ms.sm?(ms.l8?'#ffffff':'#fff2a8'):ms.sw?(Math.random()<0.5?'#8cc2ff':'#2659d0'):Math.random()<0.5?'#ffb032':'#7a5a74',ms.sm&&!ms.l8?1:2);}
    let boom=false;
    near(ms.x,ms.y,6,e=>{const dx=e.x-ms.x,dy=e.y-ms.y,rr=e.r+4.5;if(dx*dx+dy*dy<=rr*rr){boom=true;return true;}});
    if(boom||ms.life<=0)explode(ms);
    else if(ms.x<-45||ms.x>GW+45||ms.y<-45||ms.y>GH+45){if(!ms.sw||ms.x<-200||ms.x>GW+200||ms.y<-200||ms.y>GH+200)ms.dead=true;}/* スウォームは外れても戻ってくる */
  }
}
function slashes(dt){
  HSRC=1;
  for(const s of R.S){
    if(s.k)continue;/* 試作6の近接は melee6() */
    s.t+=dt;if(s.t>s.dur+0.1){s.dead=true;continue;}
    if(s.done||s.t<0)continue;
    const [ox,oy]=modPos(s.m),p=Math.min(1,s.t/s.dur),a0=s.a-s.sweep/2;
    near(ox,oy,s.range,e=>{
      if(s.hits.has(e.id))return;
      const dx=e.x-ox,dy=e.y-oy,d=Math.hypot(dx,dy)||1;if(d>s.range+e.r)return;
      const rel=angDiff(Math.atan2(dy,dx),a0);
      if(d<12||(rel>=-0.2&&rel<=s.sweep*p+0.2)){s.hits.add(e.id);hit(e,s.dmg,dx/d*230*U,dy/d*230*U);}
    });
    if(p>=1)s.done=true;
  }
  HSRC=0;
}
function defenses(){
  for(const m of R.mods){
    if(m.t!=='shield'&&m.t!=='reflector')continue;
    const st=stat(m.t),[ox,oy]=modPos(m),a=dirAngle(m.d),inArc=(dx,dy,pad)=>Math.abs(angDiff(Math.atan2(dy,dx),a))<=st.half+pad;
    if(m.t==='shield'){
      near(ox,oy,st.R+4.5,e=>{
        const dx=e.x-ox,dy=e.y-oy,d=Math.hypot(dx,dy)||1;if(d>st.R+e.r||!inArc(dx,dy,0.15))return;
        if(R.t-e.shield<st.hitcd)return;
        e.shield=R.t;hit(e,st.dmg,dx/d*200*U,dy/d*200*U);
      });
      for(const b of R.EB){if(b.dead)continue;const dx=b.x-ox,dy=b.y-oy;if(Math.hypot(dx,dy)<=st.R+6&&inArc(dx,dy,0.1))ebGone(b,'#c4ffe3','g');}
    }else{
      for(const b of R.EB){if(b.dead)continue;const dx=b.x-ox,dy=b.y-oy,d=Math.hypot(dx,dy)||1;
        if(d<=st.R+6&&inArc(dx,dy,0.1)){ebGone(b,'#ffffff','w');R.B.push(mkB(b.x,b.y,dx/d*st.spd,dy/d*st.spd,st.dmg,st.pierce,4));}}
      near(ox,oy,st.R+4.5,e=>{
        const dx=e.x-ox,dy=e.y-oy,d=Math.hypot(dx,dy)||1;if(d>st.R+e.r||!inArc(dx,dy,0.15))return;
        if(R.t-e.refl<0.5)return;e.refl=R.t;hit(e,st.dmg*0.4,dx/d*170*U,dy/d*170*U);
      });
    }
  }
}
function weaponFx(dt){
  HSRC=1;
  for(const w of R.W){
    w.t+=dt;const [mx,my]=modPos(w.m);
    if(w.t<0.5){const v=w.v0*(1-w.t/0.5);w.x+=w.ux*v*dt;w.y+=w.uy*v*dt;}
    else{const dx=mx-w.x,dy=my-w.y,d=Math.hypot(dx,dy)||1,v=Math.min(420*U,(w.t-0.5)*650*U);w.x+=dx/d*v*dt;w.y+=dy/d*v*dt;if(d<12)w.dead=true;}
    if(w.t>3)w.dead=true;
    near(w.x,w.y,w.r,e=>{const dx=e.x-w.x,dy=e.y-w.y,rr=w.r+e.r;if(dx*dx+dy*dy>rr*rr)return;
      const lt=w.hits.get(e.id);if(lt!=null&&R.t-lt<0.25)return;w.hits.set(e.id,R.t);hit(e,w.dmg,dx*3,dy*3);spark(w.x+dx/2,w.y+dy/2,'#ffffff');});
  }
  HSRC=0;
  for(const n of R.MN){
    n.t+=dt;const damp=Math.pow(0.15,dt);n.vx*=damp;n.vy*=damp;n.x+=n.vx*dt;n.y+=(n.vy+6*U)*dt;
    let trig=n.t>(n.life||7);
    if(!trig&&n.t>0.25)near(n.x,n.y,21,e=>{const dx=e.x-n.x,dy=e.y-n.y,rr=18+e.r;if(dx*dx+dy*dy<=rr*rr){trig=true;return true;}});
    if(trig){n.dead=true;const hn=blast(n.x,n.y,n.rad,n.dmg,140*U,n.gold?['#ffffff','#fff6c0','#ffd84a']:['#ffffff','#ffd23f','#8ea0c8']);addX(n.x,n.y,EXPL.m,0.42);
      if(n.gold&&hn>0){addCoin(n.x,n.y,1);if(hn>=5)addCoin(n.x,n.y,1);}}/* 黄金機雷：敵に当たるとお金が落ちる */
    else if(n.y>GH+30||n.y<-30||n.x<-30||n.x>GW+30)n.dead=true;
  }
  for(const o of R.GV){
    o.t+=dt;const damp=Math.pow(0.3,dt);o.vx*=damp;o.vy*=damp;o.x+=o.vx*dt;o.y+=o.vy*dt;
    o.tick-=dt;const tick=o.tick<=0;if(tick)o.tick=0.25;
    near(o.x,o.y,o.r,e=>{const dx=o.x-e.x,dy=o.y-e.y,d=Math.hypot(dx,dy)||1;if(d>o.r+e.r)return;
      if(e.kind!=='boss'){const q=1-Math.min(1,d/o.r),s=Math.min(d,(o.bh?70+170*q:40+70*q)*U*dt);e.x+=dx/d*s;e.y+=dy/d*s;}
      if(tick)hit(e,o.bh&&d<o.core+e.r*0.5?o.cdmg:o.dmg,0,0);});/* ブラックホール：中心の敵に大きなダメージ */
    if(o.t>=o.life){o.dead=true;if(o.boom){blast(o.x,o.y,o.bh?o.r*0.8:o.r,o.bh?o.cdmg*3:o.dmg*12,160*U,['#ffffff','#d9ccff','#7a5cff']);addX(o.x,o.y,EXPL.m,0.5);}}
  }
  for(const z of R.Z){z.t+=dt;if(z.t>(z.big?0.24:0.16))z.dead=true;}
  for(const l of R.L){l.t+=dt;if(l.t>0.3)l.dead=true;}
}

