/* ---------- shop ---------- */
let shopCat='atk',shopNote='';
const SHOP_TABS=[['ship','機体'],['atk','攻撃'],['def','防御'],['sup','補助']];
const tabOf=k=>SHIPS[k]?'ship':MODS[k]?MODS[k].cat:null;
const canBuy=k=>SHIPS[k]?(!haveShip(k)&&shipProg(k).ok&&save.gold>=SHIPS[k].price):(save.owned[k]===0&&isUnl(k)&&save.gold>=MODS[k].price);/* 品は解放ずみだけ（#15） */
function shopList(cat){return cat==='ship'?SHIP_IDS:TYPES.filter(t=>MODS[t].cat===cat);}
function renderShop(){
  $('goldNum2').textContent=save.gold;$('shopNote').textContent=shopNote;
  const tabs=$('shopTabs');tabs.textContent='';
  SHOP_TABS.forEach(([k,label])=>{const b=el('button',null,label);b.type='button';b.setAttribute('role','tab');b.setAttribute('aria-selected',shopCat===k?'true':'false');
    b.addEventListener('click',()=>{shopCat=k;shopNote='';renderShop();$('shopGrid').scrollTop=0;tilesIn($('shopGrid'),'.sitem,.soonh,.lockc,.soonn');});tabs.appendChild(b);});
  const grid=$('shopGrid');grid.textContent='';
  const all=shopList(shopCat),isS=shopCat==='ship',lock=isS?[]:all.filter(t=>!isUnl(t));
  all.filter(k=>isS||isUnl(k)).forEach(k=>{
    const isShip=!!SHIPS[k],it=isShip?SHIPS[k]:MODS[k],b=el('button','sitem'+(canBuy(k)?' can':''));b.type='button';b.style.setProperty('--c',it.c);
    const img=el('img');img.alt='';
    let price;
    if(isShip){const pg=shipProg(k),have=haveShip(k);img.src=(have||pg.ok?SHIPSPR[k].img:shipSil(k)).toDataURL();
      price=have?el('small','short','持っている'):pg.ok?el('small',save.gold<it.price?'short':null,it.price+'G'):el('small','short','解放 '+pg.cur+'/'+pg.n);}
    else{img.src=ICON[k];price=el('small',save.gold<it.price?'short':null,it.price+'G');if(save.owned[k]>0)b.appendChild(el('i',null,'×'+save.owned[k]));}
    b.append(img,el('span',null,it.name),price);
    b.dataset.k=k;b.addEventListener('click',()=>openDetail(k));
    grid.appendChild(b);
  });
  /* まだの品（#15）：進みぐあいの大きい3こだけ（シルエット・条件・棒）と、のこりの数 */
  if(lock.length){grid.appendChild(el('h3','soonh','もうすぐ解放'));
    lock.map(t=>({t,p:modProg(t)})).sort((a,b)=>b.p.cur/b.p.n-a.p.cur/a.p.n||UNL_ORDER[a.t]-UNL_ORDER[b.t]).slice(0,3).forEach(({t,p})=>{
      const c=el('div','lockc'),im=el('img'),mid=el('div'),pr=el('div','prog'),bar=el('i');im.alt='';im.src=silUrl('m'+t,MSPR[t][0].img);
      bar.style.width=(p.cur/p.n*100)+'%';pr.appendChild(bar);mid.append(el('p',null,MODS[t].unlock.txt),pr,el('p','dim num',p.cur+' / '+p.n));c.append(im,mid);grid.appendChild(c);});
    if(lock.length>3)grid.appendChild(el('p','soonn','のこり '+(lock.length-3)+'こ'));}
}
function buyShip(id){const sh=SHIPS[id];if(haveShip(id)||!shipProg(id).ok||save.gold<sh.price)return false;
  save.gold-=sh.price;save.ships[id].have=true;sh.start.forEach(v=>{if(save.owned[v.t]<sh.start.filter(w=>w.t===v.t).length)save.owned[v.t]++;if(MODS[v.t].unlock&&!save.unl.includes(v.t))save.unl.push(v.t);});/* ついてきた品は解放ずみ（お知らせなし） */
  save.ships[id].eq=startLoad(id);persist();return true;}
function openDetail(k){
  const isShip=!!SHIPS[k],it=isShip?SHIPS[k]:MODS[k];
  const s=openSheet(it.name,isShip?'機体':CATS[it.cat],it.c,()=>renderShop());
  const top=el('div','dtop'),img=el('img');img.alt='';
  const info=el('div');
  if(isShip){const pg=shipProg(k);img.src=(haveShip(k)||pg.ok?SHIPSPR[k].img:shipSil(k)).toDataURL();
    info.append(el('p',null,it.desc),...shipText(it).map(t=>el('p',null,t)));if(it.price)info.appendChild(el('p',null,'はじめの武器：'+it.start.map(v=>MODS[v.t].name).join('と')));}/* 装備の場所は下の表へ *//* スタンダードは、はじめのレーザー1つを自分でつける（#15） */
  else{img.src=ICON[k];info.append(el('p',null,it.desc));}
  top.append(img,info);s.appendChild(top);
  if(isShip){
    const ul=el('ul','statl'),pc=v=>(v>=1?'+':'')+Math.round((v-1)*100)+'%';
    shipRows(it,false).concat([['装備の場所',it.slots.length+'か所']]).forEach(([a,b])=>{const li=el('li');li.append(el('span',null,a),el('b','num',b));ul.appendChild(li);});s.appendChild(ul);
    if(it.unlock){const pg=shipProg(k);s.appendChild(el('p',null,'解放の条件：'+it.unlock.txt));const pr=el('div','prog'),bar=el('i');bar.style.width=(pg.cur/pg.n*100)+'%';pr.appendChild(bar);s.append(pr,el('p','dim num',pg.cur+' / '+pg.n+(pg.ok?'　達成':'')));}
  }else if(it.rate){const r=el('div','drate');it.rate.forEach((v,i)=>{const rt=el('div','rt');rt.appendChild(el('span',null,RATE_NAMES[i]));
      const bars=el('span','bars');for(let q=0;q<5;q++)bars.appendChild(el('i',q<v?'on':null));rt.appendChild(bars);r.appendChild(rt);});s.appendChild(r);}
  else{const p=el('p','eff');p.append(el('span',null,'こうか：'),document.createTextNode(it.eff+(it.passive?'（1つにつき）':'')));s.appendChild(p);}
  if(!isShip&&EVO[k]){const E=EVO[k],seen=save.evo&&save.evo[k],p=el('p','eff');/* 1回進化させると名前と相手が見える */
    p.append(el('span',null,'進化：'),document.createTextNode(seen?E.name+'（'+MODS[E.p].name+'をつけて Lv8）':'？？？'));s.appendChild(p);}
  if(!isShip){const own=el('p','own');own.append(document.createTextNode('持っている '),el('b','num',String(save.owned[k])));s.appendChild(own);}
  const buy=el('button','buybig');buy.type='button';
  if(isShip&&haveShip(k)){buy.disabled=true;buy.textContent='持っている';}
  else if(isShip&&!shipProg(k).ok){buy.disabled=true;buy.textContent='まだ解放されていない';}
  else if(!isShip&&!isUnl(k)){buy.disabled=true;buy.textContent='まだ解放されていない';s.appendChild(el('p',null,'解放の条件：'+it.unlock.txt));}
  else if(save.gold>=it.price){buy.append(el('span','num',String(it.price)),document.createTextNode('G で買う'));
    buy.addEventListener('click',()=>{
      SFX.play('buy');const g0=save.gold;
      if(isShip){if(!buyShip(k))return;shopNote=it.name+'を手に入れた。出撃する機体にした';view=k;setShip(k);}
      else{if(save.gold<it.price)return;save.gold-=it.price;save.owned[k]++;persist();shopNote=it.name+'を買った。格納庫の「＋」からつけられる';}
      const got=checkAch();if(got.length)shopNote+='\n'+achText(got);/* 11/16 総点検：実績は次の行に（とちゅうで折り返さない） */
      closeSheet();renderAll();buyFx($('shopGrid'),k,$('goldNum2'),g0);});}
  else{buy.disabled=true;buy.append(document.createTextNode('あと '),el('span','num',String(it.price-save.gold)),document.createTextNode('G'));}
  s.appendChild(buy);
}
function openShop(k){pixWipe(300);commOff('lab');shopNote='';if(k&&tabOf(k))shopCat=tabOf(k);closeSheet();renderShop();$('shopSheet').hidden=false;tilesIn($('shopGrid'),'.sitem,.soonh,.lockc,.soonn');if(k)openDetail(k);}
function closeShop(){pixWipe(300);closeSheet();$('shopSheet').hidden=true;renderAll();}
const achText=got=>got.map(a=>'実績「'+a.name+'」 ＋'+a.g+'G').join('・');

/* ---------- #12 研究所（ショップと同じ2列のカード → タップでくわしく・数字はくわしくの中） ---------- */
let labNote='';
function labEff(o,lv){if(lv<=0)return 'なし';
  if(o.unit==='%')return '＋'+(o.u*lv)+'%';if(o.unit==='/秒')return '1秒に＋'+(o.u*lv).toFixed(1);
  if(o.id==='r_lv')return 'Lv '+(1+lv)+' から';if(o.unit==='回')return '1出撃に'+lv+'回';if(o.unit==='か所')return '＋'+lv+'か所';return 'あり';}
function renderLab(){
  $('goldNum3').textContent=save.gold;$('labNote').textContent=labNote;
  const grid=$('labGrid');grid.textContent='';
  const lock=LAB.filter(o=>!labUnl(o.id));
  LAB.filter(o=>labUnl(o.id)).forEach(o=>{const lv=save.lab[o.id],mx=lv>=o.max,pr=labPrice(o,lv),b=el('button','sitem lab');b.type='button';
    b.style.setProperty('--c',mx?'#6e5a1c':'var(--edge)');
    const img=el('img');img.alt='';img.src=LICON[o.id];
    const pips=el('span','lpips');pips.setAttribute('aria-label','Lv '+lv+' / '+o.max);for(let i=0;i<o.max;i++)pips.appendChild(el('i',i<lv?'on':null));
    b.append(img,el('span',null,o.name),pips,mx?el('small','short','最大'):el('small',save.gold<pr?'short':null,pr+'G'));
    b.dataset.k=o.id;b.addEventListener('click',()=>openLabDetail(o.id));grid.appendChild(b);});
  /* まだの研究（11/16）：ショップと同じ形。進みぐあいの大きい3こだけ（シルエット・条件・棒）と、のこりの数 */
  if(lock.length){grid.appendChild(el('h3','soonh','もうすぐ解放'));
    lock.map(o=>({o,p:progOf(o.unlock,save)})).sort((a,b)=>b.p.cur/b.p.n-a.p.cur/a.p.n||LAB_ORDER[a.o.id]-LAB_ORDER[b.o.id]).slice(0,3).forEach(({o,p})=>{
      const c=el('div','lockc'),im=el('img'),mid=el('div'),pr=el('div','prog'),bar=el('i');im.alt='';labSil(o.id,im);
      bar.style.width=(p.cur/p.n*100)+'%';pr.appendChild(bar);mid.append(el('p',null,o.unlock.txt),pr,el('p','dim num',p.cur+' / '+p.n));c.append(im,mid);grid.appendChild(c);});
    if(lock.length>3)grid.appendChild(el('p','soonn','のこり '+(lock.length-3)+'こ'));}
}
/* 研究のシルエット（アイコンは data URL なので、読みこんでから影にする） */
function labSil(id,im){const k='l'+id;if(SILC[k]){im.src=SILC[k];return;}const src=new Image();src.onload=()=>{im.src=silUrl(k,src);};src.src=LICON[id];}
/* 11/16 作りこみ4：買ったとき。そのカードが光ってはずみ、白いわくが広がる。お金の数は前の数から動く。研究所は新しくついた目もりもはねる */
function buyFx(grid,k,goldEl,g0){if(RM()||!grid)return;const c=grid.querySelector('[data-k="'+k+'"]');if(c){c.scrollIntoView({block:'nearest'});fxRestart(c,'fxbuy');const on=c.querySelectorAll('.lpips i.on');if(on.length)fxRestart(on[on.length-1],'fxpop');}
  rollNum(goldEl,g0,save.gold);}
function buyLab(id){const o=LABK[id],lv=save.lab[id];if(!o||lv>=o.max||!labUnl(id))return false;const pr=labPrice(o,lv);if(save.gold<pr)return false;
  save.gold-=pr;save.lab[id]=lv+1;if(id==='r_slot')ensureSlots(save);persist();return true;}
function openLabDetail(id){
  const o=LABK[id],lv=save.lab[id],mx=lv>=o.max,pr=labPrice(o,lv);
  const s=openSheet(o.name,'研究所','#ffd23f',()=>renderLab());
  const top=el('div','dtop'),img=el('img');img.alt='';img.src=LICON[id];
  const info=el('div');info.append(el('p',null,o.per),el('p','dim',o.max>1?'1レベルごとに＋'+o.u+(o.unit==='/秒'?'/秒':o.unit):'1回だけ'));top.append(img,info);s.appendChild(top);
  const ul=el('ul','statl'),row=(a,b)=>{const li=el('li');li.append(el('span',null,a),el('b',null,b));ul.appendChild(li);};
  row('レベル',lv+' / '+o.max);row('いまの効果',labEff(o,lv));if(!mx)row('次の効果',labEff(o,lv+1));s.appendChild(ul);
  const buy=el('button','buybig');buy.type='button';
  if(!labUnl(id)){buy.disabled=true;buy.textContent='解放の条件：'+o.unlock.txt;}
  else if(mx){buy.disabled=true;buy.textContent='最大レベル';}
  else if(save.gold>=pr){buy.append(el('span','num',String(pr)),document.createTextNode('G で強化'));
    buy.addEventListener('click',()=>{const g0=save.gold;if(!buyLab(id))return;SFX.play('buy');const got=checkAch();setTimeout(()=>buyFx($('labGrid'),id,$('goldNum3'),g0),0);
      labNote=o.name+'を Lv'+save.lab[id]+' にした'+(id==='r_slot'?'。格納庫で機体の後ろに場所がふえた':'')+(got.length?'\n'+achText(got):'');closeSheet();renderAll();});}
  else{buy.disabled=true;buy.append(document.createTextNode('あと '),el('span','num',String(pr-save.gold)),document.createTextNode('G'));}
  s.appendChild(buy);
}
function openLab(){pixWipe(300);labNote='';closeSheet();renderLab();$('labSheet').hidden=false;tilesIn($('labGrid'),'.sitem,.soonh,.lockc,.soonn');
  if(save.tut&&!save.talk.lab){save.talk.lab=1;persist();commShow(TALK.labIntro,{wait:true,key:'lab',pos:'bot'});}/* 11/17：はじめて開いたときだけ整備士がひとこと。はじめの案内と同じく、ほかは暗くして押せない・タップで次へ（しょーくん「自動文字送りだったから聞き逃しちゃった」） */}
function closeLab(){pixWipe(300);closeSheet();$('labSheet').hidden=true;if(COMM.key==='lab')commHide();renderAll();}

/* ---------- #12 図鑑（装備・進化・機体・敵。まだのものはシルエット） ---------- */
const SILC={};
function silUrl(key,src){if(SILC[key])return SILC[key];const c=document.createElement('canvas');c.width=src.width;c.height=src.height;const g=c.getContext('2d');
  g.drawImage(src,0,0);g.globalCompositeOperation='source-in';g.fillStyle='#2e3277';g.fillRect(0,0,c.width,c.height);return SILC[key]=c.toDataURL();}
const URLC={};const urlOf=(key,c)=>URLC[key]||(URLC[key]=c.toDataURL());
function bookSections(){
  return [
    {name:'装備',c:CATC.w,list:TYPES.map(t=>({found:save.owned[t]>0,img:()=>ICON[t],sil:()=>silUrl('m'+t,MSPR[t][0].img),name:MODS[t].name,sub:CATS[MODS[t].cat],desc:MODS[t].desc,c:MODS[t].c,hint:isUnl(t)?'ショップで買うと記録される':'解放の条件：'+MODS[t].unlock.txt}))},
    {name:'進化',c:CATC.e,list:Object.keys(EVO).map(t=>({found:!!save.evo[t],img:()=>ICONE[t],sil:()=>silUrl('e'+t,MSPRE[t][0].img),name:EVO[t].name,sub:MODS[t].name+'の進化',desc:EVO[t].desc,c:MODS[t].c,hint:'武器を進化させると記録される'}))},
    {name:'機体',c:CATC.p,list:SHIP_IDS.map(k=>({found:haveShip(k),img:()=>urlOf('s'+k,SHIPSPR[k].img),sil:()=>urlOf('ss'+k,shipSil(k)),name:SHIPS[k].name,sub:'機体',desc:SHIPS[k].desc,c:SHIPS[k].c,hint:'機体を手に入れると記録される'}))},
    {name:'敵',c:'#ff4a5e',list:BOOK_E.map(b=>({found:save.book.e[b.k]!=null,img:()=>urlOf('n'+b.k,ESPR[b.k].img),sil:()=>silUrl('n'+b.k,ESPR[b.k].img),name:b.name,sub:'敵',desc:b.desc,c:'#ff4a5e',
      extra:'たおした数 '+(save.book.e[b.k]||0)+'体',hint:'出撃で出会うと記録される'}))},
  ];
}
function renderBook(){
  const body=$('bookBody');body.textContent='';
  $('bookAll').textContent=bookCount(save)+' / '+BOOK_N();
  bookSections().forEach(sec=>{const box=el('section','bsec'),h=el('h3');h.append(el('span',null,sec.name),el('small',null,sec.list.filter(o=>o.found).length+' / '+sec.list.length));
    const grid=el('div','bgrid');
    sec.list.forEach(o=>{const b=el('button',o.found?null:'no');b.type='button';b.setAttribute('aria-label',o.found?o.name:'まだ見つけていない');
      const im=el('img');im.alt='';im.src=o.found?o.img():o.sil();b.appendChild(im);b.addEventListener('click',()=>openBookItem(o));grid.appendChild(b);});
    box.append(h,grid);body.appendChild(box);});
}
function openBookItem(o){
  const s=openSheet(o.found?o.name:'？？？',o.sub,o.found?o.c:'var(--edge)',()=>{});
  const top=el('div','dtop'),img=el('img','big');img.alt='';img.src=o.found?o.img():o.sil();
  const info=el('div');if(o.found){info.appendChild(el('p',null,o.desc));if(o.extra)info.appendChild(el('p',null,o.extra));}else info.appendChild(el('p',null,o.hint));
  top.append(img,info);s.appendChild(top);
}
function openBook(){pixWipe(300);commOff('lab');closeSheet();renderBook();$('bookSheet').hidden=false;$('bookBody').scrollTop=0;tilesIn($('bookBody'),'.bgrid>button');}
function closeBook(){pixWipe(300);closeSheet();$('bookSheet').hidden=true;renderAll();}

/* ---------- #12 実績（24個・決まった G） ---------- */
function renderAch(){
  const body=$('achBody');body.textContent='';const ul=el('ul','alist');let done=0;
  ACH.forEach(a=>{const ok=!!save.ach[a.id];if(ok)done++;const li=el('li','arow'+(ok?' done':'')),img=el('img');img.alt='';img.src=MEDAL[ok?1:0];
    const mid=el('div');mid.append(el('b',null,a.name),el('small',null,a.desc));
    const em=el('em');em.append(el('span',null,a.g+'G'),el('br'),el('span',null,ok?'達成':Math.min(a.cur(save),a.n)+'/'+a.n));
    li.append(img,mid,em);ul.appendChild(li);});
  $('achAll').textContent=done+' / '+ACH.length;body.appendChild(ul);
}
function openAch(){pixWipe(300);commOff('lab');closeSheet();renderAch();$('achSheet').hidden=false;$('achBody').scrollTop=0;tilesIn($('achBody'),'.arow');}
function closeAch(){pixWipe(300);closeSheet();$('achSheet').hidden=true;renderAll();}

$('shopBtn').addEventListener('click',()=>openShop());
$('shopClose').addEventListener('click',closeShop);
$('labBtn').addEventListener('click',openLab);$('labClose').addEventListener('click',closeLab);
$('bookBtn').addEventListener('click',openBook);$('bookClose').addEventListener('click',closeBook);
$('achBtn').addEventListener('click',openAch);$('achClose').addEventListener('click',closeAch);
$('shipPrev').addEventListener('click',()=>stepShip(-1));$('shipNext').addEventListener('click',()=>stepShip(1));
$('stPrev').addEventListener('click',()=>stepStage(-1));$('stNext').addEventListener('click',()=>stepStage(1));
$('infoBtn').addEventListener('click',openInfo);
$('launchBtn').addEventListener('click',()=>{if(!haveShip(view))return;SFX.play('launch');commHide();if(!save.tut&&save.load.some(Boolean)){save.tut=1;persist();}/* はじめの案内は出撃で終わり */startRun();pixWipe(420);});
if(window.ResizeObserver)new ResizeObserver(()=>{layoutEditor();renderSlots();}).observe(bay);
else window.addEventListener('resize',()=>{layoutEditor();renderSlots();});
{const im=el('img');im.alt='';im.src=FINGERURL;$('tfinger').prepend(im);}/* はじめの案内の指 */requestAnimationFrame(tutLoop);
$('toTitle').appendChild(pixIcon('l',3));$('shipPrev').appendChild(pixIcon('l',3));$('shipNext').appendChild(pixIcon('r',3));$('stPrev').appendChild(pixIcon('l',3));$('stNext').appendChild(pixIcon('r',3));

