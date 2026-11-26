/* ---------- Game Center（App Store のアプリだけ・11/26） ----------
   アプリの shell が window.APP_SCORE・APP_ACHIEVE を出す。工房（ブラウザ）にはないので何もしない。
   実績：ACH のうち GC_ACH の15こ。Game Center の id は 'shoot_'＋小文字（docs/kobo/gamecenter.json と同じ。一度出したら変えない）
   ランキング shoot_best：1回の出撃でたおした数の最高（rec.bestKills） */
const GC_ACH=['clear1','boss1','evo1','wmax','ship3','lab10','kill1k','half','clear10','run1k','nodmg','fast','kill10k','stage5','shipAll'];
const gcId=id=>'shoot_'+id.toLowerCase();
function gcAch(ids){if(typeof window.APP_ACHIEVE!=='function')return;for(const id of ids)if(GC_ACH.includes(id)){try{window.APP_ACHIEVE(gcId(id));}catch(e){}}}
function gcScore(){const n=Math.floor(save.rec.bestKills||0);if(n>0&&typeof window.APP_SCORE==='function'){try{window.APP_SCORE(n);}catch(e){}}}
/* 取ってある実績と最高記録を全部送りなおす（開いたとき・Game Center にサインインしたとき） */
function gcSync(){gcAch(Object.keys(save.ach).filter(id=>save.ach[id]));gcScore();}
window.addEventListener('app-gamecenter',gcSync);window.addEventListener('load',gcSync);
