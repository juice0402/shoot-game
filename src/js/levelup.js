/* ---------- level-up screen ---------- */
/* 候補の山（#12）：カテゴリーごとの割合（装備45%・機体30%・支援25%。キャリアは支援45%）を、その中の数で分ける。除外したもの・skip のものは入れない */
function upPool(skip){
  const W=[],P=[],S=[];
  TYPES.forEach(t=>{const lv=R.tlv[t],m=MODS[t],key='w:'+t;if(lv>0&&lv<WMAX&&!R.ban.has(key)&&!skip.has(key))
    W.push({key,cat:'w',icon:{img:ICON[t]},name:m.name,tag:m.cat==='atk'?'武器':CATS[m.cat],lv,max:WMAX,desc:m.up[lv+1],fn:()=>{R.tlv[t]++;}});});
  Object.keys(PAS).forEach(k=>{const p=PAS[k],lv=R.pas[k],key='p:'+k;if(lv>=p.max||R.ban.has(key)||skip.has(key))return;
    P.push({key,cat:'p',icon:{img:PICON[k]},name:p.name,tag:'機体',lv,max:p.max,desc:p.at?p.at[lv]:p.desc,
      fn:()=>{R.pas[k]++;if(k==='armor'){R.maxHp+=20;R.hp=Math.min(R.maxHp,R.hp+20);}}});});
  Object.keys(SUP).forEach(k=>{const s=SUP[k],lv=R.sup[k],key='s:'+k;if(lv>=s.max||R.ban.has(key)||skip.has(key))return;
    const desc=s.at?s.at[lv]:lv===0?s.first:(lv+1===s.max&&s.last)?s.last:s.more;
    S.push({key,cat:'s',w:lv===0?1.2:1,icon:SICON[k]?{img:SICON[k]}:{ch:s.ic},name:s.name,tag:'支援',lv,max:s.max,desc,fn:()=>supUp(k)});});
  const sh=R.sh.carrier?[0.35,0.2,0.45]:[0.45,0.3,0.25],out=[];
  [[W,sh[0]],[P,sh[1]],[S,sh[2]]].forEach(([L,share])=>{let tw=0;L.forEach(o=>{tw+=o.w||1;});L.forEach(o=>{o.w=share*(o.w||1)/tw;out.push(o);});});
  return out;
}
function drawW(pool){let tot=0;pool.forEach(o=>{tot+=o.w;});let r=Math.random()*tot,i=0;for(;i<pool.length-1;i++){r-=pool[i].w;if(r<=0)break;}return pool.splice(i,1)[0];}
const fixC=o=>{o.c=CATC[o.cat]||'#7af7d9';return o;};
const fallback=()=>fixC({key:'f',cat:'p',icon:{img:PICON.regen},name:'修理',tag:'回復',lv:-1,max:0,desc:'HPを40回復',fn:()=>{R.hp=Math.min(R.maxHp,R.hp+40);}});
/* 支援を1つ上げる（はじめて取ったときは、すぐ動くように間かくを短く） */
function supUp(k){const lv=R.sup[k]++;if(lv>0)return;
  if(k==='wing')R.wingT=1.5;if(k==='strike')R.strikeT=1;if(k==='barrier')R.bar=true;
  if(k==='thunder')R.thT=1;if(k==='medic')R.mdT=4;if(k==='meteor')R.msT=1;if(k==='battleship')R.bsT=3;if(k==='timestop')R.tsT=6;}
const spcChoice=k=>fixC({key:'x:'+k,cat:'x',spc:1,icon:{img:XICON[k]},name:SPC[k].name,tag:'特別',lv:-1,max:0,desc:SPC[k].good,bad:SPC[k].bad,fn:()=>takeSpc(k)});
function takeSpc(k){if(R.spc[k])return;R.spc[k]=1;R.spcN++;
  if(k==='glass'){R.maxHp=Math.max(1,Math.round(R.maxHp*0.7));R.hp=Math.min(R.hp,R.maxHp);}
  if(k==='heavy'){const a=Math.round(R.maxHp*0.5);R.maxHp+=a;R.hp+=a;}
  calcCS();}
const evoChoice=t=>{const E=EVO[t];return fixC({key:'e:'+t,cat:'e',evo:1,icon:{img:ICONE[t]},name:E.name,tag:'進化',lv:-1,max:0,sub:MODS[t].name+' ＋ '+MODS[E.p].name,desc:E.desc,fn:()=>evolve(t)});};
function buildChoices(skip){
  skip=skip||new Set();const pool=upPool(skip),out=[],ev=evoReady().filter(t=>!skip.has('e:'+t));
  if(ev.length)out.push(evoChoice(ev[0]));/* 進化は最初の枠 */
  while(out.length<3&&pool.length)out.push(fixC(drawW(pool)));
  /* 特別な強化：レベル5から 15% で、最後の枠が特別になる（1出撃にそれぞれ1回） */
  if(R.lv>=5&&Math.random()<0.15){const xs=SPC_IDS.filter(k=>!R.spc[k]&&!R.ban.has('x:'+k)&&!skip.has('x:'+k));
    if(xs.length){const o=spcChoice(xs[(Math.random()*xs.length)|0]);if(out.length>=3&&!out[out.length-1].evo)out[out.length-1]=o;else if(out.length<3)out.push(o);}}
  while(out.length<3)out.push(fallback());
  return out;
}
function oneChoice(skip){const pool=upPool(skip);return pool.length?fixC(drawW(pool)):fallback();}
/* 宝箱：中身は必ず3つ（えらばずに全部）。進化できるときは進化から。特別な強化は入らない */
function chestPicks(){const out=[],ev=evoReady();if(ev.length)out.push(evoChoice(ev[0]));const pool=upPool(new Set());
  while(out.length<3&&pool.length)out.push(fixC(drawW(pool)));while(out.length<3)out.push(fallback());return out;}
function iconEl(icon,cls){const s=el('span',cls);if(icon.img){const im=el('img');im.alt='';im.src=icon.img;s.appendChild(im);}else s.textContent=icon.ch;return s;}
function cardEl(o){
  const b=el('button','card'+(o.evo?' evo':'')+(o.cat==='x'?' x':''));b.type='button';b.style.setProperty('--c',o.c);
  const body=el('span','cbody'),top=el('span','ctop');top.append(el('b',null,o.name),el('em',null,o.tag));body.appendChild(top);
  if(o.max>0){const pips=el('span','pips');for(let i=0;i<o.max;i++)pips.appendChild(el('i',i<o.lv?'on':i===o.lv?'nx':null));
    pips.appendChild(el('small',null,'LV'+o.lv+'→'+(o.lv+1)));body.appendChild(pips);}
  if(o.sub)body.appendChild(el('span','d2',o.sub));
  body.appendChild(el('span','d',o.desc));if(o.bad)body.appendChild(el('span','d3','代償：'+o.bad));
  b.append(iconEl(o.icon,'ic'),body);return b;
}
function buildSummary(){
  const wrap=el('div','build'),ul=el('ul');
  const add=(c,icon,lvTxt)=>{const li=el('li');li.style.setProperty('--c',c);li.append(iconEl(icon,icon.img?null:'ch'),el('b',null,lvTxt));ul.appendChild(li);};
  TYPES.forEach(t=>{if(R.tlv[t]>0)add(CATC.w,{img:R.evo[t]?ICONE[t]:ICON[t]},R.evo[t]?'進化':'LV'+R.tlv[t]);});
  Object.keys(PAS).forEach(k=>{if(R.pas[k]>0)add(CATC.p,{img:PICON[k]},'LV'+R.pas[k]);});
  Object.keys(SUP).forEach(k=>{if(R.sup[k]>0)add(CATC.s,SICON[k]?{img:SICON[k]}:{ch:SUP[k].ic},'LV'+R.sup[k]);});
  SPC_IDS.forEach(k=>{if(R.spc[k])add(CATC.x,{img:XICON[k]},'特別');});
  wrap.append(el('p',null,'いまの強化（HP '+Math.ceil(R.hp)+' / '+R.maxHp+'）'),ul);
  return wrap;
}
let lvChoices=null,banMode=false;
function openLevelUp(){
  SFX.play('lvup');
  R.state='lvup';sdrag=null;R.target=null;banMode=false;
  lvChoices=buildChoices();R.pick=R.sh.awaken&&(R.lvupN+1)%10===0?2:1;
  renderLvUp(true);
}
function renderLvUp(fresh,anim){
  if(anim==null)anim=fresh;
  overlay.textContent='';
  const wrap=el('div','cards');
  lvChoices.forEach(o=>{const b=cardEl(o);o.btn=b;const nb=!!o.evo||o.key==='f';b.disabled=fresh||o.used||(banMode&&nb);if(banMode&&!nb)b.classList.add('banpick');
    b.addEventListener('click',()=>pickChoice(o));wrap.appendChild(b);});
  const lv=R.lv-R.pending+1,used=lvChoices.some(o=>o.used);
  overlay.append(el('h2',null,'レベルアップ'),el('p','sub',banMode?'この出撃で出なくする強化をえらぶ':R.pick>1?'Lv '+lv+' ・ 覚醒：2つえらぶ':used?'覚醒：あと1つえらぶ':'Lv '+lv+' ・ 1つえらぶ'),wrap);
  const acts=lvActs();if(acts)overlay.appendChild(acts);
  overlay.appendChild(buildSummary());
  overlay.hidden=false;
  if(anim)cardsIn(wrap);
  if(fresh)setTimeout(()=>{if(!lvChoices)return;lvChoices.forEach(o=>{if(o.btn&&!o.used&&!(banMode&&(o.evo||o.key==='f')))o.btn.disabled=false;});},350);
}
/* えらび直し・スキップ・除外（研究所で買った回数だけ。買っていないときはボタンを出さない） */
function lvActs(){const L=R.lab;if(!(L.r_reroll||L.r_skip||L.r_ban))return null;const row=el('div','lvacts');
  const mk=(on,label,n,fn,pressed)=>{if(!on)return;const b=el('button');b.type='button';b.append(document.createTextNode(label),el('span','num',String(n)));
    b.disabled=n<=0&&!pressed;if(pressed!=null)b.setAttribute('aria-pressed',pressed?'true':'false');b.addEventListener('click',fn);row.appendChild(b);};
  mk(L.r_reroll,'えらび直し',R.rr,doReroll);mk(L.r_skip,'スキップ',R.sk,doSkip);mk(L.r_ban,'除外',R.bn,toggleBan,banMode);
  if(L.r_skip&&lvChoices&&lvChoices.some(o=>o.used)){const b=row.children[L.r_reroll?1:0];if(b)b.disabled=true;}/* 覚醒で1つ取ったあとはスキップできない（#12 の点検） */
  return row;}
function doReroll(){if(!R||R.state!=='lvup'||!lvChoices||R.rr<=0)return;R.rr--;banMode=false;SFX.play('reroll');
  const keep=lvChoices.filter(o=>o.used);lvChoices=keep.concat(buildChoices(new Set(keep.map(o=>o.key)))).slice(0,3+keep.length);renderLvUp(false,true);}
function doSkip(){if(!R||R.state!=='lvup'||!lvChoices||R.sk<=0||lvChoices.some(o=>o.used))return;R.sk--;banMode=false;
  R.gold+=10+2*R.lv;R.xp=Math.min(R.xp+R.need*0.1,R.need*0.999);/* スキップ：お金（10＋レベル×2）と、次のレベルまでの経験値の10% */
  SFX.play('coin');ghostCards(null,'skip');lvChoices=null;R.lvupN++;R.pending--;if(R.pending>0)openLevelUp();else resume();}
function toggleBan(){if(!R||R.state!=='lvup'||!lvChoices)return;if(!banMode&&R.bn<=0)return;banMode=!banMode;renderLvUp(false);}
function pickChoice(o){if(!R||R.state!=='lvup'||o.used)return;
  if(banMode){if(o.evo||o.key==='f'||!lvChoices)return;/* 進化と修理は除外できない */R.ban.add(o.key);R.bn--;banMode=false;const i=lvChoices.indexOf(o);
    lvChoices[i]=oneChoice(new Set(lvChoices.map(q=>q.key)));renderLvUp(false);return;}
  o.used=true;o.fn();calcCS();SFX.play('pick');
  if(--R.pick>0){if(o.btn){o.btn.disabled=true;if(!RM())o.btn.classList.add('fxpick');}const sb=overlay.querySelector('.sub');if(sb)sb.textContent='覚醒：あと1つえらぶ';
    const acts=overlay.querySelector('.lvacts');if(acts&&R.lab.r_skip){const b=acts.children[R.lab.r_reroll?1:0];if(b)b.disabled=true;}return;}/* オメガの覚醒（1つ取ったあとはスキップできない） */
  ghostCards(o.btn,'pick');lvChoices=null;banMode=false;R.lvupN++;R.pending--;if(R.pending>0)openLevelUp();else resume();}
/* 11/16 作りこみ：カードが左から上の順に「シュシュシュ」と入る */
function cardsIn(wrap){if(RM())return;[...wrap.children].forEach((b,k)=>{b.classList.add('fxin');b.style.setProperty('--d',(k*0.08)+'s');setTimeout(()=>SFX.play('swish'),k*80);});}
/* えらんだあと：画面はすぐ閉じて（ゲームの中身はすぐ進む）、写しのカードで動きを見せる。えらんだカードは光って上へ消え、ほかは右へ消える。
   mode：'pick' えらんだ1枚・'skip' 全部右へ・'all' 全部光る（宝箱）。動いている間（約0.26秒）だけ、敵と弾を止める（fxHold） */
let fxHold=0;
function ghostCards(pick,mode){
  if(RM()||overlay.hidden||!overlay.parentNode)return;
  const g=overlay.cloneNode(true);g.removeAttribute('id');g.hidden=false;g.classList.add('fxghost');g.setAttribute('aria-hidden','true');
  g.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));
  g.querySelectorAll('button').forEach(b=>{b.disabled=false;b.tabIndex=-1;});
  const src=[...overlay.querySelectorAll('.cards .card')];
  [...g.querySelectorAll('.cards .card')].forEach((c,k)=>{c.classList.remove('fxin','fxpick');const got=mode==='all'||(mode==='pick'&&src[k]===pick);
    c.classList.add(got?'fxgot':'fxout');c.style.setProperty('--d',(mode==='all'?0.06*k:got?0:0.04*k)+'s');});
  overlay.parentNode.appendChild(g);g.scrollTop=overlay.scrollTop;
  fxHold=performance.now()+260;setTimeout(()=>g.remove(),560);
}
let chestShown=null;
function openChest(){
  SFX.play('chest');
  R.state='lvup';sdrag=null;R.target=null;lvChoices=null;banMode=false;R.chestQ--;R.chestN++;
  const picks=chestPicks();picks.forEach(o=>{o.fn();});calcCS();chestShown=picks;
  overlay.textContent='';
  const wrap=el('div','cards');picks.forEach(o=>{const b=cardEl(o);b.classList.add('got');b.disabled=true;b.tabIndex=-1;wrap.appendChild(b);});
  const row=el('div','btnrow'),go=el('button','go','受け取る');go.type='button';go.disabled=true;
  go.addEventListener('click',()=>{if(!R||R.state!=='lvup')return;chestShown=null;SFX.play('pick');ghostCards(null,'all');if(R.chestQ>0)openChest();else if(R.pending>0)openLevelUp();else resume();});
  row.appendChild(go);
  overlay.append(el('h2',null,'宝箱'),el('p','sub','中の強化3つを手に入れた'),wrap,row,buildSummary());
  overlay.hidden=false;cardsIn(wrap);
  setTimeout(()=>{go.disabled=false;},350);
}
function resume(){if(!R)return;overlay.hidden=true;R.state='play';last=performance.now();BGM.duck(false);}
function openPause(){
  if(!R||R.state!=='play')return;
  R.state='pause';sdrag=null;R.target=null;overlay.textContent='';BGM.duck(true);
  const row=el('div','btnrow'),c=el('button','go','続ける'),q=el('button','btn2','撤退して格納庫へ');
  c.type='button';q.type='button';c.addEventListener('click',resume);q.addEventListener('click',()=>endRun(false,true));
  const sr=el('div','hrow');['bgm','se'].forEach(k=>{const b=el('button','btn2',sndLabel(k));b.type='button';b.addEventListener('click',()=>{sndToggle(k);b.textContent=sndLabel(k);});sr.appendChild(b);});
  row.append(c,sr,q);
  overlay.append(el('h2',null,'一時停止'),el('p','sub',fmt(R.t)+' ・ 撃破 '+R.kills+'体 ・ Lv '+R.lv),buildSummary(),row);
  overlay.hidden=false;
}
function endRun(clear,retreat){
  if(!R||R.state==='over')return;
  R.state='over';sdrag=null;banner.hidden=true;BGM.duck(false);/* 一時停止から撤退したときも、BGM の大きさをもどす */
  const S=STAGES[R.stg-1],gk=Math.floor(R.kills/2),gt=Math.floor(Math.min(R.t,RUN_LEN)/2),gb=R.bossKills*50,gc=clear?S.gold:0,gm=Math.floor(R.gold),base=gk+gt+gb+gc+gm;/* クリアのお金はステージごと（#13） */
  const gi=Math.floor(base*((1+0.15*R.pas.gold+R.bonus.gold)*R.sh.gold*R.cs.goldM-1)),total=base+gi;/* cs.goldM：研究所の商売・欲ばり（#12） */
  save.gold+=total;
  /* 記録（機体の解放に使う） */
  const rc=save.rec;if(clear)rc.clears++;rc.bosses+=R.bossKills;rc.goldTotal+=total;
  TYPES.forEach(t=>{if(R.tlv[t]>(rc.wmax[t]||0))rc.wmax[t]=R.tlv[t];});
  Object.keys(SUP).forEach(k=>{if(R.sup[k]>=SUP[k].max&&!rc.sup5.includes(k))rc.sup5.push(k);});
  rc.fastBoss+=R.fastBoss;if(R.kills>rc.bestKills)rc.bestKills=R.kills;if(clear&&R.hp>=R.maxHp/2)rc.halfClear++;
  rc.meleeK+=R.meleeK;rc.evos+=R.evoN;if(R.t>=30)rc.runs++;/* 出撃の回数は30秒以上の出撃だけ（すぐ撤退するだけで解放できないように #15 の点検） */
  if(clear)new Set(R.mods.map(m=>m.t)).forEach(t=>{rc.cw[t]=(rc.cw[t]||0)+1;});/* #15：その品をつけてクリアした回数 */
  /* #12：実績の記録と図鑑（出会った敵・たおした数） */
  rc.kills+=R.kills;rc.bestLv=Math.max(rc.bestLv,R.lv-(R.lab.r_lv||0));/* 先行訓練の分は数えない（#12 の点検） */rc.chests+=R.chestN;rc.spTotal+=R.spN;rc.bestSpc=Math.max(rc.bestSpc,R.spcN);rc.nodmg+=R.nodmg||0;
  for(const k in R.seenE)if(BOOK_E.some(b=>b.k===k))save.book.e[k]=(save.book.e[k]||0)+(R.kE[k]||0);
  rc.time+=Math.floor(R.t);
  const opened=clear&&R.stage<STAGES.length&&rc.stageMax<R.stage;/* 次のステージが解放された */
  const firstEnd=clear&&S.final&&rc.stageMax<R.stage;/* エンディングは、はじめてステージ5をクリアした回だけ（#13 の点検） */
  if(clear)rc.stageMax=Math.max(rc.stageMax,R.stage);/* ステージ5をクリアするとオメガの条件・実績「深淵の先へ」 */
  if(opened)save.st=R.stage+1;
  const newly=SHIP_IDS.filter(id=>!save.ships[id].have&&shipProg(id).ok&&!(save.seen||[]).includes(id));
  if(newly.length){save.seen=(save.seen||[]).concat(newly);}
  const got=checkAch(),newU=syncUnl(),newL=syncLabUnl();/* #15：この出撃で解放された品・11/16：研究所 */
  COMM.pend=save.tut?talkUnl(newly,newU,newL,opened?STAGES[R.stage].name:null):null;/* 11/17：格納庫にもどったら整備士が知らせる */
  const rec={t:Math.floor(R.t),kills:R.kills,clear};let isBest=false;
  if(!save.best||rec.t>save.best.t||(rec.t===save.best.t&&rec.kills>save.best.kills)){save.best=rec;isBest=true;}
  persist();
  if(!retreat){if(bgmOn())BGM.play(firstEnd?'ending':clear?'clear':'over');if(!BGM.key)SFX.play(clear?'clear':'over');if(clear)setTimeout(()=>SFX.play('coin'),900);}else BGM.play('hangar');
  const result=()=>{
  overlay.textContent='';
  overlay.append(el('h2',null,clear?'クリア！':retreat?'撤退':'撃墜…'));
  if(clear&&S.final)overlay.appendChild(el('p','sub','深淵の核をたおした'));/* 11/16 総点検：「5分 生きのびた」「HPが0になった」「とちゅうで格納庫にもどった」は見出しと下の表でわかるので出さない */
  if(opened)overlay.appendChild(el('p','sub unl','ステージ'+(R.stage+1)+'「'+STAGES[R.stage].name+'」が解放された'));
  /* 解放された機体と品（#15・#16）：アイコンと名前を小さく並べる。ショップで買える */
  /* 11/16：研究所の解放も同じ並びに（画面の高さをふやさない） */
  if(newly.length||newU.length||newL.length){const box=el('div','unlb'),ul=el('ul','unll');
    const chip=(src,name,cls)=>{const li=el('li',cls),im=el('img');im.alt='';im.src=src;li.append(im,el('span',null,name));ul.appendChild(li);};
    newly.forEach(id=>chip(urlOf('s'+id,SHIPSPR[id].img),SHIPS[id].name,'ship'));newU.forEach(t=>chip(ICON[t],MODS[t].name));newL.forEach(id=>chip(LICON[id],LABK[id].name,'lab'));
    const head=[newly.length?'機体':null,newU.length?'品':null,newL.length?'研究':null].filter(Boolean).join('・')+'の解放';/* 11/16 総点検：見出しの形をそろえる（すぐ下に「ショップへ」があるので「ショップで買える」は出さない） */
    box.append(el('p',null,head),ul);overlay.appendChild(box);}
  const ul=el('ul','stats');
  const row=(k,v,cls)=>{const li=el('li',cls||null);li.append(el('span',null,k),el('b',null,v));ul.appendChild(li);};
  row('ステージ',R.stg+' '+S.name);row((S.final&&clear?'クリアの時間':'生きのびた時間')+(isBest?'（新記録）':''),fmt(R.t),isBest?'best':null);row('撃破',R.kills+'体');row('到達レベル','Lv '+R.lv);
  row('撃破ボーナス','+'+gk+'G');row('時間ボーナス','+'+gt+'G');
  if(gb)row('大型の敵','+'+gb+'G');if(gm)row('ひろったお金','+'+gm+'G');if(gc)row('クリアボーナス','+'+gc+'G');if(gi)row('収入アップ','+'+gi+'G');
  row('かせいだお金','+'+total+'G','total');
  let gotl=null;if(got.length){gotl=el('ul','gotl');const li=el('li');const ns=el('span',null,'実績');got.forEach(a=>ns.appendChild(el('span',null,'「'+a.name+'」')));li.append(ns,el('b',null,'+'+got.reduce((n,a)=>n+a.g,0)+'G'));gotl.appendChild(li);}/* 実績は1行にまとめる（#16） */
  const btns=el('div','btnrow end'),back=el('button','go','格納庫へ'),shop=el('button','btn2','ショップへ');back.type='button';shop.type='button';
  const toHangar=()=>{pixWipe();cancelAnimationFrame(raf);R=null;BGM.play('hangar');sortie.hidden=true;hangar.hidden=false;overlay.hidden=true;overlay.classList.remove('over');layoutEditor();renderAll();commPend();};
  back.addEventListener('click',()=>{toHangar();toast(total+'G かせいだ');});
  shop.addEventListener('click',()=>{toHangar();openShop();});
  btns.append(shop,back);
  overlay.append(ul);if(gotl)overlay.appendChild(gotl);overlay.append(btns);overlay.hidden=false;tilesIn(overlay,'.unll li,.stats li,.gotl li');/* 11/16 作りこみ：結果の行も左上から */
  if(!RM()){/* 11/16 作りこみ4：数字をかぞえ上げ、さいごに合計がはずむ。解放のお知らせは光が走り、ステージの解放と実績もはずむ */
    const rows=[...ul.children].slice(1);rows.forEach((li,k)=>countUp(li.querySelector('b'),140+k*60,420));
    const end=140+rows.length*60+420,tl=ul.querySelector('li.total');setTimeout(()=>{if(tl&&tl.isConnected){fxRestart(tl,'fxpop');SFX.play('coin');}},end);
    const ub=overlay.querySelector('.unlb');if(ub){ub.classList.add('fxunl');setTimeout(()=>{if(ub.isConnected)SFX.play('unlock');},320);}
    const su=overlay.querySelector('.sub.unl');if(su)fxRestart(su,'fxpop');
    if(gotl)setTimeout(()=>{if(gotl.isConnected)fxRestart(gotl,'fxpop');},end+120);}
  overlay.classList.toggle('over',overlay.scrollHeight>overlay.clientHeight+1);/* あふれるときだけ、ボタンを下にのこす */
  };
  if(firstEnd)ending(result);else result();
}
/* エンディング（#13）：ステージ5のクリア。「おわり」と、これまでの記録 → 結果へ（#16：英語の一言を日本語に） */
function ending(next){
  const rc=save.rec,h=Math.floor(rc.time/3600),m=Math.floor(rc.time%3600/60);
  overlay.textContent='';overlay.classList.add('endg');
  const ul=el('ul','stats'),row=(k,v)=>{const li=el('li');li.append(el('span',null,k),el('b',null,v));ul.appendChild(li);};
  row('出撃した時間',(h?h+'時間':'')+m+'分');row('クリア',rc.clears+'回');row('たおした敵',rc.kills+'体');row('たおした大型の敵',rc.bosses+'体');
  row('いちばん高いレベル','Lv '+rc.bestLv);row('実績',ACH.filter(a=>save.ach[a.id]).length+' / '+ACH.length);row('図鑑',bookCount(save)+' / '+BOOK_N());
  const b=el('button','go','結果へ');b.type='button';b.addEventListener('click',()=>{overlay.classList.remove('endg');next();});
  overlay.append(el('p','endt','おわり'),el('p','sub','全ステージクリア！'),el('h3','endh','これまでの記録'),ul,b);overlay.hidden=false;
  if(!bgmOn())SFX.play('ending');
}

/* sortie input */
stage.addEventListener('pointerdown',e=>{
  if(!R||R.state!=='play')return;
  sdrag={id:e.pointerId,sx:e.clientX,sy:e.clientY,px:R.x,py:R.y};
  try{stage.setPointerCapture(e.pointerId);}catch(err){}
  e.preventDefault();
});
stage.addEventListener('pointermove',e=>{
  if(!sdrag||!R||e.pointerId!==sdrag.id||R.state!=='play')return;
  const k=1.25/scale;
  R.target={x:clamp(sdrag.px+(e.clientX-sdrag.sx)*k,PMX,GW-PMX),y:clamp(sdrag.py+(e.clientY-sdrag.sy)*k,PMY,GH-PMY)};
});
const endSDrag=e=>{if(sdrag&&e.pointerId===sdrag.id){sdrag=null;if(R)R.target=null;}};
stage.addEventListener('pointerup',endSDrag);stage.addEventListener('pointercancel',endSDrag);
$('pauseBtn').addEventListener('click',openPause);
const keyName=e=>e.key.length===1?e.key.toLowerCase():e.key;
window.addEventListener('keydown',e=>{
  if(!R)return;const k=keyName(e);
  if(R.state==='lvup'&&lvChoices&&['1','2','3'].includes(k)){const o=lvChoices[+k-1];if(o&&!o.used&&!(o.btn&&o.btn.disabled))pickChoice(o);return;}
  if(k==='Escape'||k==='p'){if(R.state==='play')openPause();else if(R.state==='pause')resume();return;}
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','a','d','w','s'].includes(k)){keys.add(k);if(k.startsWith('Arrow'))e.preventDefault();}
});
window.addEventListener('keyup',e=>{keys.delete(keyName(e));});
window.addEventListener('blur',()=>keys.clear());
document.addEventListener('visibilitychange',()=>{if(document.hidden&&R&&R.state==='play')openPause();});

document.querySelectorAll('img.coin').forEach(i=>{i.src=COINURL;});
$('bookIc').src=BOOKIC;$('infoIc').src=INFOIC;$('stLock').src=LOCKI;$('achIc').src=MEDAL[1];
