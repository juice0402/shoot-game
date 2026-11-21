/* ---------- 効果音（Web Audio でコードで作る・音のファイルは使わない） ---------- */
const SFX=(()=>{
  const VOLUME=0.32;            /* 全体の音の大きさはここ1か所 */
  let ac=null,master=null,noiseBuf=null,comp=null;const last={};let made=0;
  function init(){
    if(ac)return true;
    try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return false;
      try{if(navigator.audioSession)navigator.audioSession.type='ambient';}catch(_){}
      ac=new A();master=ac.createGain();master.gain.value=VOLUME;
      comp=ac.createDynamicsCompressor();comp.threshold.value=-18;comp.ratio.value=6;master.connect(comp);comp.connect(ac.destination);
      noiseBuf=ac.createBuffer(1,ac.sampleRate*0.6,ac.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    }catch(e){ac=null;return false;}
    return true;
  }
  /* 最初のタップで音を始める（iPhone の決まり） */
  function unlock(){if(!init())return;if(ac.state!=='running'&&ac.state!=='closed')ac.resume().then(()=>BGM.kick()).catch(()=>{});else BGM.kick();}
  /* 裏に回ったら音を止め、もどったら続きから（BGM も同じ ac） */
  document.addEventListener('visibilitychange',()=>{if(!ac||ac.state==='closed')return;if(document.hidden)ac.suspend().catch(()=>{});else ac.resume().then(()=>BGM.kick()).catch(()=>{});});
  const on=()=>save.snd!==false&&ac&&ac.state!=='closed';
  /* 1つの音：type・高さ f0→f1・長さ・大きさ・はじまりの遅れ */
  function tone(type,f0,f1,dur,vol,delay){
    const t=ac.currentTime+(delay||0),o=ac.createOscillator(),g=ac.createGain();
    o.type=type;o.frequency.setValueAtTime(f0,t);if(f1!==f0)o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
    g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+Math.min(0.012,dur*0.2));g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(g);g.connect(master);o.start(t);o.stop(t+dur+0.02);made++;
  }
  function noise(dur,vol,fType,f0,f1,delay,q){
    const t=ac.currentTime+(delay||0),s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();
    s.buffer=noiseBuf;f.type=fType||'lowpass';f.frequency.setValueAtTime(f0,t);if(f1&&f1!==f0)f.frequency.exponentialRampToValueAtTime(f1,t+dur);f.Q.value=q||0.8;
    g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+0.008);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    s.connect(f);f.connect(g);g.connect(master);s.start(t);s.stop(t+dur+0.02);made++;
  }
  /* 武器ごとに少しちがう撃つ音（何百発も撃つので、とくに小さく・間引く） */
  const SHOT={
    laser:()=>tone('square',1320,700,0.05,0.035),
    gatling:()=>noise(0.03,0.04,'highpass',2400,2400),
    mine:()=>tone('sine',220,110,0.09,0.06),
    shotgun:()=>noise(0.09,0.07,'lowpass',2200,500),
    freeze:()=>{tone('triangle',1800,2400,0.07,0.035);tone('sine',2600,2600,0.05,0.02,0.03);},
    missile:()=>noise(0.16,0.045,'bandpass',600,2400,0,2),
    flame:()=>noise(0.08,0.022,'lowpass',900,500),
    sword:()=>noise(0.12,0.07,'bandpass',800,3200,0,3),
    saw:()=>tone('sawtooth',500,700,0.08,0.03),
    thunder:()=>{noise(0.14,0.07,'highpass',1500,800);tone('square',90,60,0.08,0.03);},
    gravity:()=>tone('sine',300,90,0.22,0.06),
    cannon:()=>{tone('sawtooth',160,50,0.3,0.08);noise(0.25,0.06,'lowpass',1800,200);},
    /* 試作6：射撃は高く短い音・爆発は低い音と雑音・エネルギーはのびる音・近接は風を切る雑音・設置はポンという音 */
    pulse:()=>tone('square',1500,900,0.035,0.03),
    rail:()=>{tone('sawtooth',2400,300,0.12,0.05);noise(0.08,0.04,'highpass',3000,3000);},
    sniper:()=>{noise(0.12,0.08,'bandpass',1800,600,0,2);tone('square',300,120,0.06,0.04);},
    fan:()=>tone('triangle',1100,1500,0.06,0.03),
    ricochet:()=>tone('square',900,1400,0.04,0.03),
    splitter:()=>tone('triangle',700,1000,0.05,0.035),
    needle:()=>tone('square',2600,2000,0.02,0.018),
    acid:()=>{tone('sine',500,240,0.08,0.05);noise(0.06,0.02,'bandpass',1200,800,0,3);},
    grenade:()=>tone('sine',260,140,0.1,0.06),
    cluster:()=>{tone('sine',200,100,0.14,0.07);noise(0.1,0.04,'lowpass',800,300);},
    napalm:()=>noise(0.18,0.05,'lowpass',700,300),
    shockwave:()=>{tone('sine',160,60,0.25,0.08);noise(0.15,0.04,'lowpass',600,150);},
    torpedo:()=>{tone('sine',120,80,0.3,0.07);noise(0.25,0.03,'bandpass',300,600,0,1.5);},
    plasma:()=>tone('sawtooth',220,440,0.25,0.04),
    prism:()=>{tone('triangle',1320,1320,0.05,0.025);tone('triangle',1760,1760,0.05,0.02,0.03);},
    halo:()=>tone('sine',880,1760,0.2,0.04),
    hlaser:()=>tone('square',600,1800,0.12,0.03),
    sonic:()=>{tone('triangle',330,220,0.18,0.05);tone('sine',336,224,0.18,0.04);},
    gsword:()=>noise(0.22,0.09,'bandpass',500,2200,0,2.5),
    twin:()=>noise(0.07,0.05,'bandpass',1500,4000,0,3),
    lance:()=>noise(0.1,0.07,'bandpass',2500,900,0,3),
    hammer:()=>{tone('sine',120,50,0.2,0.1);noise(0.12,0.07,'lowpass',900,200);},
    whip:()=>{noise(0.06,0.07,'highpass',3000,5000);tone('square',2000,3000,0.03,0.02);},
    chainsaw:()=>{tone('sawtooth',90,110,0.12,0.03);noise(0.1,0.02,'bandpass',1800,1800,0,4);},
    scythe:()=>noise(0.35,0.06,'bandpass',300,1600,0,2),
    turret:()=>tone('square',400,800,0.08,0.04),
    minefield:()=>[0,0.04,0.08].forEach(d=>tone('sine',300,200,0.05,0.04,d)),
    satellite:()=>tone('square',1700,1100,0.03,0.02),
    micro:()=>noise(0.2,0.04,'bandpass',800,3000,0,2),
    emp:()=>{tone('sawtooth',60,1200,0.3,0.05);noise(0.3,0.05,'highpass',2000,600);},
    /* 進化した武器（id で鳴らす） */
    hyper:()=>tone('sawtooth',180,210,0.1,0.018),
    storm:()=>noise(0.035,0.045,'highpass',1800,1800),
    swarm:()=>noise(0.22,0.05,'bandpass',500,2600,0,2),
    starblade:()=>{noise(0.3,0.1,'bandpass',400,2600,0,2.5);tone('triangle',1760,2640,0.18,0.03);},
    esaw:()=>tone('sawtooth',420,560,0.12,0.025),
    inferno:()=>noise(0.08,0.026,'lowpass',1100,500),
    tenrai:()=>{noise(0.25,0.1,'highpass',1200,500);tone('square',70,40,0.15,0.05);},
    bhole:()=>tone('sine',200,50,0.4,0.08),
    aurora:()=>{tone('sawtooth',300,120,0.35,0.06);tone('triangle',900,1500,0.3,0.03);},
    zero:()=>{tone('triangle',2400,3000,0.06,0.03);tone('sine',3200,3200,0.06,0.02,0.03);},
    fort:()=>{noise(0.14,0.1,'lowpass',1600,300);tone('sine',110,60,0.12,0.07);},
    gmine:()=>{tone('sine',240,120,0.09,0.06);tone('square',1500,1500,0.04,0.02,0.05);},
    guard:()=>{noise(0.24,0.09,'bandpass',500,2200,0,2.5);tone('triangle',990,990,0.12,0.03,0.08);},
  };
  const SHOT_GAP={gatling:0.12,flame:0.12,laser:0.1,pulse:0.1,needle:0.12,satellite:0.15,chainsaw:0.25,hyper:0.15,storm:0.12,inferno:0.12,esaw:0.3};
  const GAP={talk:0.05,shot:0.07,hit:0.045,kill:0.035,xp:0.04,btn:0.05,coin:0.06,frost:0.2,evade:0.1,shield:0.06,zap:0.08,star:0.08,gun:0.12,
    crack:0.06,dash:0.15,block:0.08,warp:0.1,lzwarn:0.3,lzfire:0.2,split:0.05,bossin:0.3,tick:0.05,wipe:0.25,sheet:0.1,sheetx:0.1,launch:0.5};
  const SND={
    hit:()=>tone('square',260,180,0.025,0.025),
    kill:()=>{noise(0.07,0.06,'lowpass',1800,300);tone('square',420,140,0.06,0.025);},
    boss:()=>{noise(1.1,0.22,'lowpass',1600,60);tone('sine',90,30,1.0,0.25);tone('square',140,40,0.5,0.06,0.15);},
    xp:p=>tone('sine',900+p*40,1300+p*40,0.05,0.03),
    coin:()=>{tone('square',1320,1320,0.06,0.04);tone('square',1760,1760,0.14,0.04,0.06);},
    lvup:()=>[523,659,784,1047].forEach((f,i)=>tone('triangle',f,f,0.14,0.07,i*0.07)),
    hurt:()=>{tone('square',240,70,0.18,0.08);noise(0.12,0.06,'lowpass',900,200);},
    barrier:()=>tone('triangle',700,1400,0.16,0.06),
    buy:()=>{tone('square',988,988,0.07,0.05);tone('square',1319,1319,0.2,0.05,0.07);tone('triangle',1976,1976,0.18,0.03,0.12);},
    btn:()=>tone('triangle',660,880,0.04,0.035),
    clear:()=>[523,659,784,1047,784,1047,1319].forEach((f,i)=>tone('triangle',f,f,i===6?0.5:0.14,0.08,i*0.11)),
    over:()=>[392,330,262,196].forEach((f,i)=>tone('triangle',f,f*0.97,i===3?0.6:0.2,0.07,i*0.16)),
    start:()=>{tone('sawtooth',220,880,0.35,0.05);noise(0.4,0.05,'bandpass',400,3000,0,1.5);},
    evo:()=>[523,784,1047,1568].forEach((f,i)=>tone('triangle',f,f,0.18,0.08,i*0.08)),
    evade:()=>noise(0.08,0.05,'highpass',3000,6000),
    revive:()=>[392,523,659,784].forEach((f,i)=>tone('triangle',f,f*1.01,0.3,0.07,i*0.09)),
    ebar:()=>tone('triangle',500,1500,0.3,0.07),
    frost:()=>{tone('triangle',2600,1800,0.12,0.04);noise(0.1,0.03,'highpass',4000,4000);},
    shield:()=>tone('square',1100,1400,0.03,0.02),
    fsbreak:()=>noise(0.18,0.07,'bandpass',1500,500,0,2),
    /* 必殺技（#11）：機体ごとにちがう音 */
    sp_standard:()=>{tone('sawtooth',300,1200,0.45,0.06);tone('square',1200,1800,0.3,0.03,0.12);noise(0.4,0.05,'highpass',2000,5000,0.1);},
    sp_rapid:()=>[660,880,1100,1320,1760].forEach((f,i)=>tone('square',f,f,0.06,0.045,i*0.045)),
    sp_fortress:()=>{tone('sine',120,45,0.7,0.14);noise(0.55,0.09,'lowpass',1400,100);tone('triangle',700,1400,0.3,0.04,0.05);},
    sp_collector:()=>{noise(0.6,0.06,'bandpass',3200,400,0,2);tone('sine',1400,500,0.5,0.05);},
    sp_blade:()=>[0,0.22,0.44].forEach(d=>noise(0.2,0.1,'bandpass',600,4200,d,3)),
    sp_carrier:()=>{noise(0.9,0.06,'bandpass',300,1600,0,1.5);tone('sawtooth',110,220,0.8,0.04);},
    sp_marksman:()=>[0,0.07,0.14,0.21,0.28].forEach(d=>tone('square',1800,1800,0.04,0.035,d)),
    spsnipe:()=>{noise(0.25,0.12,'bandpass',2000,500,0,2);tone('square',300,90,0.2,0.06);},
    sp_bomber:()=>{for(let i=0;i<7;i++){tone('sine',150,50,0.25,0.09,i*0.2);noise(0.25,0.07,'lowpass',1000,150,i*0.2);}},
    sp_phantom:()=>{tone('triangle',440,660,0.45,0.045);tone('triangle',447,671,0.45,0.04);tone('sine',880,1320,0.35,0.025,0.1);},
    sp_vanguard:()=>{noise(0.55,0.1,'bandpass',400,2400,0,1.5);tone('sawtooth',200,620,0.35,0.06);},
    sp_alchemist:()=>[784,988,1175,1568,1976].forEach((f,i)=>tone('triangle',f,f,0.14,0.05,i*0.06)),
    sp_omega:()=>{tone('sawtooth',100,800,0.5,0.05);noise(1.0,0.22,'lowpass',2200,80,0.5);tone('sine',80,30,0.9,0.22,0.5);},
    /* #12：宝箱・雷雲・回復・流れ星・支援砲撃・時間停止・えらび直し */
    chest:()=>[392,523,659,784,1047].forEach((f,i)=>tone('square',f,f,0.1,0.05,i*0.06)),
    zap:()=>{noise(0.18,0.07,'highpass',3000,800);tone('square',900,200,0.12,0.03);},
    heal:()=>[660,880,1175].forEach((f,i)=>tone('sine',f,f,0.12,0.05,i*0.05)),
    star:()=>tone('triangle',1800,700,0.16,0.03),
    gun:()=>{tone('sine',140,50,0.22,0.1);noise(0.18,0.06,'lowpass',900,150);},
    tstop:()=>{tone('sine',1200,300,0.5,0.06);tone('triangle',600,150,0.6,0.04,0.05);},
    reroll:()=>[880,660,990].forEach((f,i)=>tone('square',f,f,0.05,0.035,i*0.04)),
    /* 11/16 作りこみ：装備がはまる「ガチャン」・カードが入る「シュッ」・カードを取る */
    clank:()=>{noise(0.05,0.09,'bandpass',2600,1400,0,3);tone('square',180,90,0.07,0.07);noise(0.07,0.06,'bandpass',4200,3000,0.06,6);tone('square',1250,1250,0.04,0.03,0.07);},
    swish:()=>noise(0.07,0.025,'bandpass',900,3200,0,1.5),
    unlock:()=>[1047,1319,1568,2093].forEach((f,i)=>tone('square',f,f,0.08,0.035,i*0.05)),
    unclank:()=>{noise(0.04,0.06,'bandpass',3200,4200,0,4);tone('square',620,1300,0.06,0.04);tone('triangle',1700,2100,0.05,0.025,0.05);},
    pick:()=>{tone('square',784,784,0.05,0.05);tone('square',1175,1175,0.05,0.05,0.05);tone('triangle',1568,1568,0.16,0.05,0.1);noise(0.12,0.03,'highpass',5000,7000,0.05);},
  };
  /* #13：大型の敵の登場・最終ボス・岩がこわれる・突進・盾・ワープ・吹雪・レーザーの壁・分かれる・エンディング */
  Object.assign(SND,{
    bossin:()=>{tone('sawtooth',92,62,0.9,0.1);tone('square',184,124,0.5,0.045,0.12);noise(0.8,0.06,'lowpass',600,120,0.05);},
    bossin2:()=>{[0,0.38,0.76].forEach(d=>tone('sawtooth',74,46,0.6,0.11,d));noise(1.6,0.09,'lowpass',500,60);tone('sine',44,30,1.6,0.2,0.2);},
    crack:()=>{noise(0.14,0.08,'bandpass',900,300,0,1.5);tone('square',160,80,0.06,0.03);},
    dash:()=>noise(0.25,0.06,'bandpass',500,2000,0,2),
    block:()=>tone('square',1600,1200,0.03,0.022),
    warp:()=>{tone('sine',300,1200,0.16,0.04);tone('triangle',1200,300,0.16,0.03,0.16);},
    wind:()=>{noise(2.6,0.07,'bandpass',500,1500,0,0.7);noise(2.2,0.04,'highpass',3000,5000,0.3);},
    lzwarn:()=>[0,0.25,0.5,0.75,1].forEach(d=>tone('square',1250,1250,0.06,0.028,d)),
    lzfire:()=>{tone('sawtooth',220,110,0.5,0.06);noise(0.5,0.06,'highpass',1800,900);},
    split:()=>tone('triangle',2000,2600,0.06,0.03),
    /* 整備士の通信（11/17）：開くときのザザッ・1字ずつのピッ */
    comm:()=>{noise(0.16,0.05,'bandpass',1800,900,0,1.2);tone('square',1560,1560,0.04,0.025,0.15);},
    talk:()=>tone('square',1040+Math.random()*160,1040,0.025,0.018),
    ending:()=>[523,659,784,1047,988,784,880,1047,1319,1568].forEach((f,i)=>tone('triangle',f,f,i===9?0.9:0.2,0.07,i*0.16)),
    /* #37：板の出し入れ・数字のかぞえ上げ・出撃・画面の切りかえ */
    sheet:()=>noise(0.12,0.03,'bandpass',700,2600,0,1.4),
    sheetx:()=>noise(0.1,0.025,'bandpass',2400,800,0,1.4),
    tick:()=>tone('square',2200,2200,0.015,0.016),
    launch:()=>{tone('sawtooth',110,440,0.5,0.05);noise(0.6,0.06,'bandpass',300,2400,0,1.2);tone('square',880,1760,0.25,0.03,0.3);},
    wipe:()=>[1568,1175,784].forEach((f,i)=>tone('square',f,f,0.03,0.014,i*0.04)),
  });
  function play(name,arg){
    if(!on())return;const now=ac.currentTime,gap=GAP[name]||0.02;
    if(last[name]!=null&&now-last[name]<gap)return;last[name]=now;
    try{SND[name](arg||0);}catch(_){}
  }
  function shot(t){
    if(!on()||!SHOT[t])return;const now=ac.currentTime;
    if(last.shot!=null&&now-last.shot<GAP.shot)return;
    const k='s_'+t,g=SHOT_GAP[t]||0.08;if(last[k]!=null&&now-last[k]<g)return;
    last.shot=now;last[k]=now;try{SHOT[t]();}catch(_){}
  }
  return {unlock,play,shot,get made(){return made},get ready(){return !!ac},get ac(){return ac},get comp(){return comp}};
})();
