(()=>{
if(!document.documentElement.lang)document.documentElement.lang='ja';/* 日本語の改行（文節で折り返す）と字形（#14 の点検） */
'use strict';
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const rand=(a,b)=>a+Math.random()*(b-a);
const TAU=Math.PI*2;
const angDiff=(a,b)=>{let d=(a-b)%TAU;if(d>Math.PI)d-=TAU;if(d<-Math.PI)d+=TAU;return d;};
const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;};
const fmt=t=>{t=Math.floor(t);return String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0');};

/* ---------- data ---------- */
/* 画面は横480ドット。U＝試作4（横320）からの倍率。距離・速さ・大きさはUをかけて、遊んだ手ごたえを同じに保つ */
/* ゲームの名前（まだ仮）。ここ1か所で変えられる */
const GAME_NAME='ぜんぶのせシップ';/* 11/17 しょーくんが決めた */
const U=1.5,RUN_LEN=300,MAXE=280,GW=480,CELL=48,PADG=150,BASE_HP=70,WMAX=8;
const DIRV=[[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]];
const ARROW_NAME=['上','右上','右','右下','下','左下','左','左上'];
const dirAngle=d=>-Math.PI/2+d*Math.PI/4;
const angToDir=a=>((Math.round((a+Math.PI/2)/(Math.PI/4))%8)+8)%8;

const CATS={atk:'攻撃',def:'防御',sup:'補助'};
/* rate = [威力, 連射, 射程] 1〜5 / eff = 補助・防御の効き目
   はじめの12種とシールド・反射板の gt：レベルアップの文に出す％だけの表（強さは stat0 の式。gt はその式から出した数字で、強さには使わない #16） */
const MODS={
  laser:{name:'レーザー',cat:'atk',c:'#4cc9ff',price:200,rate:[2,4,4],desc:'向いた方へビームを連射する',
    up:{3:'ビームが2本になる',4:'弾が2体まで当たる',6:'ビームが3本になる',7:'弾が3体まで当たる'},gt:{d:{2:33,3:25,4:20,5:17,6:14,7:13,8:44},r:{2:11,5:11,8:11}}},
  gatling:{name:'ガトリング',cat:'atk',c:'#7d9cff',price:250,rate:[1,5,3],desc:'小さな弾をばらまくように高速で連射する',
    up:{5:'2列で撃つ',8:'弾が2体まで当たる'},gt:{d:{2:23,3:19,4:16,5:14,6:12,7:11,8:10},r:{2:4,3:18,4:4,6:18,7:4}}},
  mine:{name:'機雷',cat:'atk',c:'#8ea0c8',price:280,rate:[4,1,2],desc:'向いた方へ機雷をまく。敵が近づくと爆発する',
    up:{3:'2個ずつまく',5:'爆発が大きくなる',7:'3個ずつまく'},rl:'まく速さ',gt:{d:{2:35,3:26,4:20,5:17,6:15,7:13,8:30},r:{2:9,4:9,6:9,8:9}}},
  shotgun:{name:'散弾砲',cat:'atk',c:'#e8c07a',price:300,rate:[4,2,1],desc:'近くの敵に散弾を撃ちこみ、はじき飛ばす',
    up:{3:'弾が7発になる',4:'届く距離がのびる',6:'弾が9発になる',7:'届く距離がさらにのびる',8:'弾が2体まで当たる'},gt:{d:{2:28,3:22,4:18,5:15,6:13,7:12,8:10},r:{2:8,5:8}}},
  freeze:{name:'冷凍砲',cat:'atk',c:'#bfe9ff',price:320,rate:[2,3,4],desc:'当たった敵をこおらせて、動きを遅くする',
    up:{3:'こおる時間がのびる',4:'2発ずつ撃つ',5:'もっと遅くする',7:'弾が2体まで当たる'},gt:{d:{2:38,3:27,4:21,5:18,6:15,7:13,8:58},r:{2:9,6:9,8:9}}},
  missile:{name:'追撃ミサイル',cat:'atk',c:'#ffd23f',price:350,rate:[3,2,5],desc:'近くの敵を追いかけて爆発する',
    up:{3:'2発ずつ撃つ',4:'爆発が大きくなる',5:'3発ずつ撃つ',7:'爆発がさらに大きくなる',8:'4発ずつ撃つ'},gt:{d:{2:38,3:27,4:21,5:18,6:15,7:13,8:12},r:{2:9,6:9}}},
  flame:{name:'火炎放射',cat:'atk',c:'#6af0ff',price:380,rate:[3,5,1],desc:'青い炎をふき出して、近くの敵をまとめて焼く',
    up:{3:'炎が長くなる',5:'炎が広がる',7:'炎がさらに長くなる'},gt:{d:{2:28,3:22,4:18,5:15,6:13,7:12,8:38}}},
  sword:{name:'近接の剣',cat:'atk',c:'#b48cff',price:400,rate:[5,2,1],desc:'向いた方を大きく斬りはらう',
    up:{3:'届く距離がのびる',5:'ひと振りが大きくなる',7:'届く距離がさらにのびる',8:'2回つづけて斬る'},rl:'振る速さ',gt:{d:{2:41,3:29,4:23,5:18,6:16,7:13,8:12},r:{2:9,4:9,6:9}}},
  saw:{name:'回転ノコ',cat:'atk',c:'#c9d1e8',price:420,rate:[3,2,3],desc:'回るノコギリを投げる。行きも帰りも切る',
    up:{4:'2枚投げる',5:'刃が大きくなる',7:'3枚投げる'},rl:'投げる速さ',gt:{d:{2:33,3:25,4:20,5:17,6:14,7:13,8:41},r:{2:9,3:9,6:9,8:9}}},
  thunder:{name:'雷撃コイル',cat:'atk',c:'#e6ff5c',price:450,rate:[3,2,4],desc:'向いた側の敵に雷を落とし、近くの敵へつなぐ',
    up:{3:'つながる敵が1体ふえる',4:'届く距離がのびる',6:'つながる敵が1体ふえる',8:'つながる敵が2体ふえる'},gt:{d:{2:36,3:26,4:21,5:17,6:15,7:13,8:11},r:{2:9,5:9,7:9}}},
  gravity:{name:'重力弾',cat:'atk',c:'#7a5cff',price:480,rate:[2,1,3],desc:'ゆっくり進む玉が、敵を吸いこんで削る',
    up:{3:'吸いこむ範囲が広がる',4:'長く残る',6:'吸いこむ範囲がさらに広がる',8:'最後に大爆発する'},gt:{d:{2:33,3:25,4:20,5:17,6:14,7:13,8:11},r:{2:9,5:9,7:9}}},
  cannon:{name:'ビーム砲',cat:'atk',c:'#5cffef',price:520,rate:[5,1,5],desc:'ためてから、太いビームで一直線に撃ちぬく',
    up:{3:'ビームが太くなる',6:'ビームがさらに太くなる'},gt:{d:{2:30,3:23,4:19,5:16,6:14,7:12,8:38},r:{2:5,4:20,5:5,7:20,8:5}}},
  /* 試作6で足した攻撃30種（docs/design/parts.md）。g＝レベルごとの強さの表（d 威力・r 連射 の％）。
     レベルアップの文は up の文に g の数字をつないで作る（下の「レベルアップの文」）。stat() も同じ g を使うので、文と強さがずれない */
  /* 射撃 */
  pulse:{name:'パルス砲',cat:'atk',c:'#5ce1ff',price:260,rate:[2,4,3],desc:'3発ずつ、短い弾をまとめて撃つ',
    g:{d:{2:30,3:20,4:30,5:20,6:30,7:20,8:40},r:{2:15,6:15}},up:{3:'1回に4発撃つ',5:'1回に5発撃つ',7:'1回に6発撃つ'}},
  rail:{name:'レールガン',cat:'atk',c:'#9fd0ff',price:450,rate:[5,1,5],desc:'ためてから、4体まで当たる速い弾を撃つ',
    g:{d:{2:35,3:20,5:30,6:35,7:20,8:40}},up:{3:'5体まで当たる',4:'ためる時間が0.65秒に',5:'6体まで当たる',7:'ためる時間が0.5秒に',8:'8体まで当たる'}},
  sniper:{name:'狙撃砲',cat:'atk',c:'#e3e8ff',price:400,rate:[5,2,5],desc:'体力のいちばん多い敵をねらう。遠いほど強い',
    g:{d:{2:30,3:30,4:20,5:30,7:20,8:40},r:{2:10,4:15,5:10,7:15}},up:{6:'体力の多い2体をねらう'}},
  fan:{name:'扇レーザー',cat:'atk',c:'#5dffb0',price:340,rate:[2,3,3],desc:'扇の形に細いレーザーを5本撃つ',
    g:{d:{2:30,3:20,4:30,5:20,6:20,7:30,8:30},r:{2:25}},up:{3:'6本になる',4:'扇が広がる',5:'7本になる',6:'8本になる',7:'扇がさらに広がる',8:'9本になる'}},
  ricochet:{name:'はね返り弾',cat:'atk',c:'#ffd84a',price:300,rate:[2,3,4],desc:'敵と画面のふちで3回はね返る弾',
    g:{d:{3:30,5:20,6:20,8:30},r:{3:10}},up:{2:'はねる回数が4回に',4:'2発ずつ撃つ',5:'はねる回数が5回に',6:'はねる回数が6回に',7:'3発ずつ撃つ',8:'はねる回数が7回に'}},
  splitter:{name:'分裂弾',cat:'atk',c:'#c39bff',price:330,rate:[3,3,3],desc:'当たると小さな弾3つに分かれる',
    g:{d:{2:30,3:20,4:30,5:20,7:20,8:40},r:{2:10,5:15}},up:{3:'4つに分かれる',6:'分かれた弾がもう1回分かれる',7:'5つに分かれる'}},
  needle:{name:'ニードル砲',cat:'atk',c:'#bfe9ff',price:280,rate:[1,5,4],desc:'針を連射。刺さるたび敵の受けるダメージ＋3%',
    g:{d:{3:30,5:25,6:30,8:30},r:{2:20,5:20}},up:{4:'刺さるたび受けるダメージ＋4%',6:'2本ずつ撃つ',7:'刺さるたび受けるダメージ＋5%',8:'もろさの上限が＋40%に'}},
  acid:{name:'酸弾',cat:'atk',c:'#a4f55c',price:310,rate:[2,2,3],desc:'当たった所に酸の水たまりを2秒残す',
    g:{d:{2:25,4:25,5:30,7:25,8:40},r:{2:10,5:15}},up:{3:'水たまりの大きさ ＋20%',4:'水たまりが2.5秒残る',6:'水たまりの大きさ ＋20%',7:'水たまりが3秒残る'}},
  /* 爆発 */
  grenade:{name:'グレネード砲',cat:'atk',c:'#ffcd48',price:320,rate:[4,2,2],desc:'弧をえがいて前に落ち、爆発する',
    g:{d:{2:25,4:20,5:25,7:20,8:30},r:{5:15}},up:{3:'2発ずつ投げる',4:'爆発の大きさ ＋20%',6:'3発ずつ投げる',7:'爆発の大きさ ＋20%'}},
  cluster:{name:'クラスター爆弾',cat:'atk',c:'#fff2a8',price:420,rate:[4,1,3],desc:'大きく爆発したあと、子爆弾を6個まく',
    g:{d:{2:30,4:30,5:20,6:20,7:30,8:30},r:{4:15,7:15}},up:{3:'子爆弾が8個に',5:'子爆弾が9個に',6:'子爆弾が10個に',8:'子爆弾が12個に'}},
  napalm:{name:'ナパーム',cat:'atk',c:'#4c9dff',price:380,rate:[3,2,3],desc:'通った所に青い炎の帯を残す',
    g:{d:{2:30,4:20,5:30,7:20,8:40},r:{5:15}},up:{3:'炎の帯の長さ ＋25%',4:'炎が2.4秒残る',6:'炎の帯の長さ ＋25%',7:'炎が3秒残る'}},
  shockwave:{name:'衝撃波砲',cat:'atk',c:'#8cc2ff',price:360,rate:[2,2,2],desc:'まわりに衝撃波の輪。敵を押し返し、弾を消す',
    g:{d:{3:30,5:30,6:30,8:40},r:{3:15,6:15}},up:{2:'輪の大きさ ＋15%',4:'2回つづけて出す',5:'輪の大きさ ＋15%',7:'3回つづけて出す'}},
  torpedo:{name:'魚雷',cat:'atk',c:'#7d97cf',price:460,rate:[5,1,4],desc:'ゆっくり進む大きな弾。大型の敵に2倍',
    g:{d:{2:30,3:25,5:30,6:25,8:40},r:{3:15}},up:{4:'2発ずつ撃つ',6:'爆発の大きさ ＋20%',7:'3発ずつ撃つ'}},
  /* エネルギー */
  plasma:{name:'プラズマ球',cat:'atk',c:'#c9a8ff',price:500,rate:[4,1,3],desc:'ゆっくり進む光の球が、中の敵を焼き続ける',
    g:{d:{4:25,6:25,8:40},r:{6:15}},up:{2:'球の大きさ ＋20%',3:'2つずつ撃つ',5:'球の大きさ ＋20%',7:'3つずつ撃つ'}},
  prism:{name:'プリズム砲',cat:'atk',c:'#8cf0ff',price:430,rate:[3,3,3],desc:'3方向に撃つ。当たるともう1回分かれる',
    g:{d:{2:30,5:30,6:20,8:40},r:{2:10,5:15}},up:{3:'当たると3つに分かれる',4:'4方向に撃つ',6:'当たると4つに分かれる',7:'5方向に撃つ'}},
  halo:{name:'光の輪',cat:'atk',c:'#fff6c0',price:390,rate:[3,3,2],desc:'機体から光の輪が広がり、敵をつらぬく',
    g:{d:{4:30,5:20,7:30,8:40},r:{4:15}},up:{2:'輪の大きさ ＋15%',3:'輪が2つになる',5:'輪の大きさ ＋15%',6:'輪が3つになる'}},
  hlaser:{name:'追尾レーザー',cat:'atk',c:'#6dffa0',price:480,rate:[3,2,5],desc:'曲がりながら敵を追う長いレーザーを2本',
    g:{d:{2:30,4:30,6:30,7:20,8:20},r:{4:15}},up:{3:'3本になる',5:'4本になる',7:'5本になる',8:'6本になる'}},
  sonic:{name:'音波砲',cat:'atk',c:'#a8b8ff',price:350,rate:[2,3,2],desc:'前に音波。敵を遅くし、受けるダメージ＋10%',
    g:{d:{2:30,4:30,5:20,7:30,8:20},r:{2:10,7:15}},up:{3:'音波の幅と距離がのびる',5:'敵をもっと遅くする',6:'音波の幅と距離がさらにのびる',8:'受けるダメージ＋15%に'}},
  /* 近接（ブレードの「刃」で威力＋40%） */
  gsword:{name:'大剣',cat:'atk',c:'#d8e6ff',price:520,rate:[5,1,2],melee:1,rl:'振る速さ',desc:'ゆっくり大きくなぎ払う。敵の弾も切る',
    g:{d:{2:30,3:20,4:25,5:30,6:25,8:40},r:{4:15,7:15}},up:{3:'届く距離 ＋12%',7:'届く距離 ＋12%'}},
  twin:{name:'双剣',cat:'atk',c:'#7ff0ff',price:450,rate:[3,5,1],melee:1,rl:'振る速さ',desc:'左右かわるがわる、すばやく斬る',
    g:{d:{2:25,4:30,5:20,7:30},r:{2:15,5:15}},up:{3:'刃の長さ ＋15%',6:'刃の長さ ＋15%',8:'左右を同時に斬る'}},
  lance:{name:'ランス',cat:'atk',c:'#a8c8ff',price:470,rate:[4,3,2],melee:1,rl:'突く速さ',desc:'向いた方へ長く突き、並んだ敵をつらぬく',
    g:{d:{2:30,3:20,4:25,6:30,7:25,8:30},r:{4:15,7:15}},up:{3:'突きの長さ ＋15%',5:'突きの長さ ＋15%',8:'突きの先から衝撃波が出る'}},
  hammer:{name:'ハンマー',cat:'atk',c:'#9a7cff',price:490,rate:[4,2,1],melee:1,rl:'振る速さ',desc:'たたいた所に円の衝撃。敵を少し気絶させる',
    g:{d:{2:30,3:20,4:20,5:30,6:20,7:20,8:40},r:{5:15}},up:{3:'気絶が0.6秒に',4:'衝撃の大きさ ＋15%',6:'気絶が0.8秒に',7:'衝撃の大きさ ＋15%'}},
  whip:{name:'光のムチ',cat:'atk',c:'#7dff9a',price:410,rate:[3,2,3],melee:1,rl:'振る速さ',desc:'しなる長いムチで、横に広くはらう',
    g:{d:{2:30,4:25,6:20,7:30},r:{4:15}},up:{3:'ムチの長さ ＋12%',5:'1回で往復して2回打つ',6:'ムチの長さ ＋12%',8:'1回で3回打つ'}},
  chainsaw:{name:'チェーンソー',cat:'atk',c:'#f0e060',price:430,rate:[3,5,1],melee:1,rl:'削る速さ',desc:'刃が回り続け、ふれた敵を削る',
    g:{d:{2:30,3:20,4:30,5:20,6:30,8:40},r:{7:20}},up:{3:'刃の長さ ＋15%',5:'刃の長さ ＋15%'}},
  scythe:{name:'大鎌',cat:'atk',c:'#c09cff',price:540,rate:[5,1,2],melee:1,desc:'3秒ごとに1周なぎ払う。倒すと経験値＋20%',
    g:{d:{2:30,4:30,5:20,7:30,8:40}},up:{3:'鎌の大きさ ＋12%・2.5秒ごとに振る',5:'2.1秒ごとに振る',6:'鎌の大きさ ＋12%'}},
  /* 設置・ドローン */
  turret:{name:'砲台投下',cat:'atk',c:'#8ea0ff',price:440,rate:[2,3,3],desc:'砲台を置く。8秒間、近くの敵を自動で撃つ',
    g:{d:{2:20,4:30,6:30,8:40},r:{4:15}},up:{2:'砲台が10秒残る',3:'2台まで置ける',5:'3台まで置ける',6:'砲台が12秒残る',7:'4台まで置ける'}},
  minefield:{name:'地雷原',cat:'atk',c:'#a0b0d0',price:360,rate:[4,1,2],rl:'まく速さ',desc:'10秒ごとに、まわりへ機雷を8個まく',
    g:{d:{2:30,5:30,7:20,8:30},r:{4:15,7:15}},up:{3:'9個まく',4:'10個まく',5:'爆発の大きさ ＋20%',6:'12個まく',8:'14個まく'}},
  satellite:{name:'衛星砲',cat:'atk',c:'#7ad8ff',price:470,rate:[2,3,4],desc:'まわりを回る衛星が、近い敵を撃つ',
    g:{d:{2:30,4:30,6:30,8:30},r:{2:10,6:15}},up:{3:'衛星が2つに',5:'衛星が3つに',7:'衛星が4つに'}},
  /* 追尾・特殊 */
  micro:{name:'マイクロミサイル',cat:'atk',c:'#ffe58a',price:410,rate:[3,2,5],desc:'小さなミサイル8発が、ばらばらに敵を追う',
    g:{d:{2:30,3:20,4:30,6:30,7:20,8:20},r:{4:15}},up:{3:'10発になる',5:'12発になる',7:'14発になる',8:'16発になる'}},
  emp:{name:'電磁パルス',cat:'atk',c:'#7ff6ff',price:500,rate:[1,1,3],desc:'6秒ごとにまわりの弾を消し、敵を1秒止める',
    g:{d:{3:30,5:30,6:30,8:50}},up:{2:'とどく広さ ＋15%',3:'止める時間が1.3秒に',4:'5秒ごとに出す',5:'とどく広さ ＋15%',6:'止める時間が1.6秒に',7:'4秒ごとに出す'}},
  armor:{name:'装甲板',cat:'def',c:'#8d93c9',price:150,passive:true,eff:'最大HP ＋15',desc:'機体をかたくする。いくつでも重ねてつけられる'},
  shield:{name:'シールド',cat:'def',c:'#5dffb0',price:300,eff:'向いた側の弾を消す・敵をはじく',desc:'向いた側に盾を張る。弾を消して、敵をはじく',
    up:{2:'盾が広くなる',4:'盾がさらに広くなる',5:'盾が大きくなる',6:'はじく回数がふえる',8:'いちばん大きな盾'},gt:{d:{2:60,3:38,4:27,5:21,6:18,7:15,8:13}}},
  reflector:{name:'反射板',cat:'def',c:'#e3e5ff',price:350,eff:'敵の弾をはね返して当てる',desc:'向いた側の板で、弾をはね返し敵を押しもどす',
    up:{2:'板が広くなる',4:'はね返す弾が速くなる',5:'板が大きくなる',6:'はね返す弾が2体まで当たる',8:'いちばん大きな板'},gt:{d:{2:40,3:29,4:22,5:18,6:15,7:33,8:10}}},
  magnet:{name:'吸引装置',cat:'sup',c:'#5aa2ff',price:180,passive:true,eff:'吸いよせる距離 ＋30%',desc:'経験値の結晶を遠くから吸いよせる'},
  booster:{name:'ブースター',cat:'sup',c:'#ff9f43',price:200,passive:true,eff:'動く速さ ＋10%',desc:'機体が速く動けるようになる'},
  coin:{name:'集金装置',cat:'sup',c:'#ffcf5a',price:250,passive:true,eff:'かせぐお金 ＋10%',desc:'出撃でかせぐお金がふえる'},
  repair:{name:'修理ユニット',cat:'sup',c:'#7af7d9',price:400,passive:true,eff:'1秒に HP ＋0.3',desc:'出撃中、HPが少しずつ回復する'},
  /* 試作6で足した防御10種・補助10種（docs/design/parts.md）。盾ドローンと前面シールドはレベルアップの対象、ほかはつけた数だけ効く */
  harmor:{name:'重装甲',cat:'def',c:'#9aa4c8',price:280,passive:true,eff:'最大HP ＋40・速さ −8%',desc:'最大HP ＋40。重くなり、動く速さ −8%'},
  sdrone:{name:'盾ドローン',cat:'def',c:'#7dffcf',price:380,eff:'まわりを回る盾が敵の弾を消す',desc:'小さな盾2枚がまわりを回り、弾を消す',
    up:{2:'盾が大きくなる',3:'盾が3枚に',4:'盾が大きくなる',5:'盾が4枚に',6:'回る速さ ＋25%',7:'盾が5枚に',8:'盾がいちばん大きくなる'}},
  fshield:{name:'前面シールド',cat:'def',c:'#8cf0c8',price:340,eff:'弾を8発防ぐ・割れても6秒で戻る',desc:'向いた側に大きな盾。弾を8発まで防ぐ',
    up:{2:'盾が広くなる',3:'10発まで防ぐ',4:'盾が大きくなる',5:'12発まで防ぐ',6:'割れても4秒で戻る',7:'盾がさらに広くなる',8:'16発まで防ぐ'}},
  spike:{name:'トゲ装甲',cat:'def',c:'#c8c0e0',price:260,passive:true,eff:'体当たりの被ダメージ −30%',desc:'ぶつかった敵に15ダメージを返す'},
  evade:{name:'回避装置',cat:'def',c:'#e0e8ff',price:360,passive:true,eff:'かわす確率 ＋15%（最大45%）',desc:'敵の攻撃を15%の確率でかわす'},
  ebarrier:{name:'緊急バリア',cat:'def',c:'#c4ffe3',price:300,passive:true,eff:'1出撃に1回・3秒間 無敵',desc:'HPが30%を切ると、3秒間の無敵バリア'},
  absorber:{name:'吸収板',cat:'def',c:'#7af7d9',price:330,passive:true,eff:'弾を消すと HP ＋0.5',desc:'盾などで敵の弾を消すたび HP ＋0.5'},
  revive:{name:'復活装置',cat:'def',c:'#ffe58a',price:600,passive:true,eff:'1出撃に1回 復活（最大2回）',desc:'HPが0になっても1回だけ HP50%で復活'},
  iframe:{name:'無敵延長',cat:'def',c:'#dcd4ff',price:220,passive:true,eff:'無敵時間 ＋40%',desc:'攻撃を受けたあとの無敵時間 ＋40%'},
  frost:{name:'氷の装甲',cat:'def',c:'#bfe9ff',price:310,passive:true,eff:'まわりの敵を2.5秒こおらせる',desc:'攻撃を受けると、まわりの敵がこおる'},
  scope:{name:'照準装置',cat:'sup',c:'#9fd0ff',price:200,passive:true,eff:'射程と弾の速さ ＋15%',desc:'すべての武器の射程と弾の速さ ＋15%'},
  cooler:{name:'冷却装置',cat:'sup',c:'#8cf0ff',price:260,passive:true,eff:'連射 ＋8%',desc:'すべての武器の連射 ＋8%'},
  amp:{name:'増幅器',cat:'sup',c:'#e6c8ff',price:280,passive:true,eff:'範囲 ＋15%',desc:'爆発・剣・輪・水たまりの大きさ ＋15%'},
  crit:{name:'会心回路',cat:'sup',c:'#fff2a8',price:300,passive:true,eff:'会心の確率 ＋5%',desc:'5%の確率で会心。ダメージが2倍'},
  dur:{name:'持続装置',cat:'sup',c:'#a4f55c',price:240,passive:true,eff:'効果時間 ＋20%',desc:'炎・酸・こおる・設置物の時間 ＋20%'},
  multi:{name:'多弾装置',cat:'sup',c:'#ffd84a',price:380,passive:true,eff:'弾 ＋1・威力 −10%',desc:'撃つ弾の数 ＋1。そのぶん威力 −10%'},
  xpamp:{name:'経験値増幅器',cat:'sup',c:'#5aa2ff',price:220,passive:true,eff:'経験値 ＋10%',desc:'もらえる経験値 ＋10%'},
  cdrone:{name:'回収ドローン',cat:'sup',c:'#7af7d9',price:260,passive:true,eff:'ドローン1機が拾い集める',desc:'小さなドローンが経験値とお金を拾う'},
  reactor:{name:'エネルギー炉',cat:'sup',c:'#5cffef',price:320,passive:true,eff:'必殺ゲージ ＋20%',desc:'必殺ゲージのたまる速さ ＋20%'},
  berserk:{name:'怒りの回路',cat:'sup',c:'#ffaa4a',price:280,passive:true,eff:'威力 最大 ＋30%',desc:'HPが減るほど威力が上がる。最大 ＋30%'},
};
const TYPES=Object.keys(MODS);
/* ショップの品の解放（#15・docs/design/unlocks.md）。ここにない8こ（レーザー・ガトリング・散弾砲・近接の剣・装甲板・シールド・吸引装置・ブースター）は最初から。
   [記録, 種類, 数, 条件の文]。記録：runs 出撃の回数・wmax 武器の最高Lv（種類ごと）・big 大型の敵（種類ごと・図鑑のたおした数）・cw その品をつけてクリアした回数・
   そのほかは save.rec の名前（機体の解放と同じ）。お金や運では決まらない。分類ごとに、だいたいやさしい順（もうすぐ解放の並びに使う） */
const UNLOCK={
  /* 攻撃（38） */
  missile:['runs',0,1,'30秒以上の出撃1回'],ricochet:['bestKills',0,300,'1出撃で300体たおす'],fan:['wmax','laser',8,'レーザーをLv8'],hlaser:['wmax','laser',8,'レーザーをLv8'],
  mine:['bosses',0,1,'大型の敵を1体たおす'],thunder:['bosses',0,3,'大型の敵を合計3体たおす'],flame:['stageMax',0,1,'ステージ1クリア'],freeze:['kills',0,12000,'合計12000体たおす'],
  pulse:['wmax','gatling',8,'ガトリングをLv8'],needle:['wmax','gatling',8,'ガトリングをLv8'],gsword:['wmax','sword',8,'近接の剣をLv8'],twin:['wmax','sword',8,'近接の剣をLv8'],
  splitter:['wmax','shotgun',8,'散弾砲をLv8'],micro:['wmax','missile',8,'追撃ミサイルをLv8'],minefield:['wmax','mine',8,'機雷をLv8'],saw:['meleeK',0,300,'近接の武器で300体たおす'],
  acid:['evos',0,1,'武器を1回進化させる'],sonic:['stageMax',0,2,'ステージ2クリア'],grenade:['big','gnaw',1,'岩喰いをたおす'],gravity:['big','gnaw2',1,'双頭の岩喰いをたおす'],
  sniper:['fastBoss',0,5,'大型の敵を30秒以内に合計5体たおす'],shockwave:['nodmg',0,4,'無傷で大型の敵を合計4体たおす'],
  rail:['stageMax',0,3,'ステージ3クリア'],cannon:['big','icequeen',1,'氷の女王をたおす'],whip:['meleeK',0,1500,'近接の武器で1500体たおす'],
  napalm:['wmax','flame',8,'火炎放射をLv8'],prism:['wmax','fan',8,'扇レーザーをLv8'],lance:['wmax','twin',8,'双剣をLv8'],chainsaw:['wmax','saw',8,'回転ノコをLv8'],
  cluster:['wmax','grenade',8,'グレネード砲をLv8'],hammer:['wmax','gsword',8,'大剣をLv8'],satellite:['sup5',0,2,'支援を2つ最大レベルにする'],halo:['chests',0,15,'宝箱を合計15個ひらく'],
  torpedo:['bosses',0,20,'大型の敵を合計20体たおす'],turret:['big','fort',1,'要塞砲台をたおす'],plasma:['big','snake',1,'機械の大蛇をたおす'],
  emp:['stageMax',0,4,'ステージ4クリア'],scythe:['big','core',1,'深淵の核をたおす'],
  /* 防御（11） */
  iframe:['runs',0,2,'30秒以上の出撃2回'],reflector:['big','boss2',1,'紫の大蟹をたおす'],harmor:['cw','armor',1,'装甲板をつけてクリア'],fshield:['cw','shield',1,'シールドをつけてクリア'],
  ebarrier:['clears',0,3,'合計3回クリア'],evade:['halfClear',0,3,'HPを半分以上のこして3回クリア'],spike:['kills',0,20000,'合計20000体たおす'],frost:['big','icebeast',1,'氷晶獣をたおす'],
  sdrone:['cw','fshield',1,'前面シールドをつけてクリア'],absorber:['nodmg',0,10,'無傷で大型の敵を合計10体たおす'],revive:['clears',0,10,'合計10回クリア'],
  /* 補助（12） */
  cooler:['bestLv',0,10,'1出撃でLv10'],scope:['runs',0,3,'30秒以上の出撃3回'],xpamp:['kills',0,6000,'合計6000体たおす'],coin:['goldTotal',0,4000,'合計4000Gかせぐ'],
  cdrone:['cw','magnet',1,'吸引装置をつけてクリア'],berserk:['bestSpc',0,1,'特別な強化を取る'],repair:['bosses',0,6,'大型の敵を合計6体たおす'],amp:['chests',0,8,'宝箱を合計8個ひらく'],
  reactor:['spTotal',0,25,'必殺技を合計25回出す'],crit:['bestKills',0,3500,'1出撃で3500体たおす'],multi:['bestLv',0,25,'1出撃でLv25'],dur:['goldTotal',0,30000,'合計30000Gかせぐ'],
};
const UNL_ORDER={};Object.keys(UNLOCK).forEach((t,i)=>{const [k,x,n,txt]=UNLOCK[t];MODS[t].unlock={k,t:x||null,n,txt};UNL_ORDER[t]=i;});
const RATE_NAMES=['威力','連射','射程'];
/* レベルアップの文：up の文のあとに「威力 ＋30%」「連射 ＋15%」を g（はじめの12種などは gt）からつなぐ */
for(const t of TYPES){const m=MODS[t],G=m.g||m.gt;if(!G)continue;const u={};
  for(let L=2;L<=WMAX;L++){const a=[];if(m.up[L])a.push(m.up[L]);if(G.d&&G.d[L])a.push('威力 ＋'+G.d[L]+'%');if(G.r&&G.r[L])a.push((m.rl||'連射')+' ＋'+G.r[L]+'%');u[L]=a.join('・');}
  m.up=u;}
/* g の％をそのレベルまでかけ合わせた倍率（k：'d' 威力・'r' 連射） */
const GR=(t,k,lv)=>{const o=MODS[t].g&&MODS[t].g[k];let v=1;if(o)for(let L=2;L<=lv;L++)if(o[L])v*=1+o[L]/100;return v;};

/* 武器の進化（docs/design/parts.md）：武器 Lv8＋相手の装備をつけていると、レベルアップの最初の枠に出る。
   p＝相手・st＝進化したあとの強さ（D 威力の倍率・F 連射の倍率・c 機体と強化の連射）・k＝共通の数字が効く値（下の CSK と同じ形） */
const EVO={
  laser:{p:'cooler',id:'hyper',name:'ハイパーレーザー',desc:'太いレーザーを出し続け、並んだ敵を焼く',k:{n:'n'},
    st:(lv,c,D)=>({cd:0.08*c,dmg:55*D,w:14,len:560,n:1})},
  gatling:{p:'multi',id:'storm',name:'ストームガトリング',desc:'3列の弾幕。弾は3体まで当たる',k:{n:'n',s:'spd'},
    st:(lv,c,D)=>({cd:0.055*c,dmg:9*D,n:3,pierce:2,spd:480*U,spread:0.07})},
  missile:{p:'scope',id:'swarm',name:'スウォームミサイル',desc:'8発の群れが、外れても敵を追い続ける',k:{n:'n',a:'rad',g:'life'},
    st:(lv,c,D)=>({cd:1.05*c,dmg:70*D,n:8,rad:48*U,life:7})},
  sword:{p:'amp',id:'starblade',name:'星斬りの剣',desc:'画面の半分を切る一振りを2回。弾も切る',k:{a:'range'},
    st:(lv,c,D)=>({cd:1.2*c,dmg:240*D,range:150*U,sweep:Math.PI*1.1,dur:0.3})},
  saw:{p:'dur',id:'esaw',name:'永久ノコ',desc:'ノコ4枚が戻らず、まわりを回り続ける',k:{n:'n',a:'r'},
    st:(lv,c,D)=>({dmg:70*D,n:4,r:16,orb:75*U,w:2.8/c})},
  flame:{p:'berserk',id:'inferno',name:'蒼い業火',desc:'炎が渦になって、まわりの敵を焼く',k:{n:'n',g:'life',a:'vR'},
    st:(lv,c,D)=>({cd:0.07*c,dmg:7*D,life:0.44,spread:0.44,spd:150*U,n:1,vR:56*U,vdmg:18*D,vtick:0.15*c})},
  thunder:{p:'crit',id:'tenrai',name:'天雷',desc:'空から落ち、12体までつながるいなずま',k:{n:'chain'},
    st:(lv,c,D)=>({cd:0.7*c,dmg:75*D,chain:12,jump:120*U})},
  gravity:{p:'magnet',id:'bhole',name:'ブラックホール',desc:'大きく吸いこみ、中心の敵を砕く',k:{a:'r',u:'life'},
    st:(lv,c,D)=>({cd:2.4*c,dmg:10*D,cdmg:70*D,r:110*U,core:16*U,life:4})},
  cannon:{p:'reactor',id:'aurora',name:'極光ビーム',desc:'ためなしで撃つ、とても太いビーム',k:{a:'w',g:'len'},
    st:(lv,c,D)=>({cd:1.05*c,dmg:190*D,w:28*U,len:440*U})},
  freeze:{p:'frost',id:'zero',name:'絶対零度',desc:'当たった敵を止め、倒すと氷の破片が飛ぶ',k:{n:'n',s:'spd',u:'stopT'},
    st:(lv,c,D)=>({cd:0.3*c,dmg:34*D,n:3,pierce:2,spd:340*U,stopT:1.6,shard:8,sdmg:22*D})},
  shotgun:{p:'harmor',id:'fort',name:'要塞砲',desc:'大きな散弾12発。近い敵ほど威力が高い',k:{n:'n',s:'spd',g:'life'},
    st:(lv,c,D)=>({cd:0.75*c,dmg:30*D,n:12,cone:0.85,spd:360*U,life:0.4,pierce:2})},
  mine:{p:'coin',id:'gmine',name:'黄金機雷',desc:'大きな機雷。爆発すると、お金が落ちる',k:{n:'n',a:'rad',u:'life'},
    st:(lv,c,D)=>({cd:1.0*c,dmg:150*D,rad:66*U,n:4,life:8})},
  gsword:{p:'sdrone',id:'guard',name:'守護の大剣',desc:'斬るたびに盾が1枚ふえる。最大6枚',k:{a:'range'},
    st:(lv,c,D,F)=>({cd:1.7/F*c,dmg:72*D,range:46*U*1.12*1.12*1.2,sweep:Math.PI*1.05,dur:0.3,gmax:6})},
  plasma:{p:'xpamp',id:'sun',name:'小さな太陽',desc:'球に加えて、大きな太陽がまわりを回る',k:{n:'n',a:['r','sr']},
    st:(lv,c,D,F)=>({cd:3.0/F*c,dmg:3*D,r:12*U*1.44,n:3,spd:45*U,l8:true,sdmg:16*D,sr:26*U,orb:70*U,tick:0.15*c,sn:1,w:1.3/c})},
};

/* 機体の強化（道中だけ） */
const PAS={
  magnet:{name:'吸い寄せ',ic:'吸',c:'#5aa2ff',max:5,desc:'経験値を吸い取る距離が40%のびる'},
  speed:{name:'機体スピード',ic:'速',c:'#7af7d9',max:5,desc:'動く速さ＋12%'},
  armor:{name:'装甲',ic:'甲',c:'#e3e5ff',max:5,desc:'最大HP＋20、HPも20回復'},
  clock:{name:'オーバークロック',ic:'連',c:'#ff9f43',max:5,desc:'すべての武器の発射が8%速くなる'},
  power:{name:'火力アップ',ic:'力',c:'#ff9f43',max:5,desc:'すべての攻撃の威力＋10%'},
  regen:{name:'自動修理',ic:'修',c:'#7af7d9',max:5,desc:'HPが少しずつ回復する（1秒に＋0.4）'},
  xp:{name:'経験値アップ',ic:'経',c:'#5aa2ff',max:5,desc:'もらえる経験値が10%ふえる'},
  gold:{name:'収入アップ',ic:'金',c:'#ffd23f',max:5,desc:'この出撃でかせぐお金が15%ふえる'},
};
/* 支援（道中だけ） */
const SUP={
  wing:{name:'援軍',c:'#5dffb0',max:5,first:'ときどき横から味方の戦闘機が2機来て撃つ',more:'援軍が1機ふえて、来るのが早くなる'},
  drone:{name:'子機',c:'#5dffb0',max:5,first:'機体のまわりを回って、近くの敵を撃つ',more:'子機が1機ふえる',last:'子機の連射＋50%'},
  strike:{name:'空爆',ic:'撃',c:'#ffd23f',max:5,
    at:['敵が集まっている所に、上から光の柱を落とす','柱の威力＋50%・間かく7.8秒','柱の威力＋33%・間かく6.6秒','柱の威力＋25%・間かく5.4秒','柱の威力＋20%・間かく4.2秒']},
  barrier:{name:'バリア',ic:'障',c:'#c4ffe3',max:3,first:'敵の攻撃を1回ふせぐ。少したつと張りなおす',more:'張りなおすのが早くなる'},
};
/* ---------- #12 道中の強化（docs/design/upgrades.md）。数字は calcCS と sup12 の1か所 ---------- */
/* 機体の強化：8 → 20種。desc は次のレベルの文（at があればレベルごと） */
Object.assign(PAS,{
  bspd:{name:'弾速アップ',c:'#7af7d9',max:5,desc:'弾の速さ＋12%'},
  area:{name:'範囲アップ',c:'#ff9f43',max:5,desc:'爆発・剣・輪の大きさ＋10%'},
  dur:{name:'効果時間アップ',c:'#5aaedc',max:5,desc:'炎・酸・氷・設置物の時間＋12%'},
  critc:{name:'会心アップ',c:'#fff2a8',max:5,desc:'会心（2倍）の確率＋4%'},
  critd:{name:'会心ダメージ',c:'#ffcd48',max:5,desc:'会心のダメージ＋20%'},
  range:{name:'射程アップ',c:'#bfe9ff',max:5,desc:'射程が10%のびる'},
  knock:{name:'ノックバック',c:'#b8bfdc',max:5,desc:'当たった敵を押し返す力＋25%'},
  multi:{name:'多弾',c:'#ff6a7a',max:3,desc:'弾を撃つ武器の弾の数＋1'},
  iframe:{name:'無敵時間',c:'#e3e5ff',max:5,desc:'被弾したあとの無敵時間＋15%'},
  skillg:{name:'必殺チャージ',c:'#a98bff',max:5,desc:'必殺ゲージのたまる速さ＋12%'},
  evade:{name:'回避',c:'#e6dcff',max:5,desc:'敵の攻撃を4%の確率でかわす'},
  exec:{name:'とどめ',c:'#ff4a5e',max:3,at:['体力10%以下の小さい敵を一撃で倒す','とどめの線が体力15%以下になる','とどめの線が体力20%以下になる']},
});
const PAS_NEW=['bspd','area','dur','critc','critd','range','knock','multi','iframe','skillg','evade','exec'];
const EXEC=[0,0.1,0.15,0.2];
/* 支援：4 → 12種。v＝レベル1〜5の数字（cd 間かく・n 数・d 威力・r 半径・f 遅さ・h 回復）。at＝そのレベルになるときの文 */
Object.assign(SUP,{
  thunder:{name:'雷雲',c:'#fff36b',max:5,v:{cd:[4,3.6,3.2,2.8,2.4],n:[1,2,2,3,3],d:[24,30,36,42,50]},
    at:['4秒ごとに雷が敵1体に落ちる','雷が2本・間かく3.6秒','雷の威力＋20%・間かく3.2秒','雷が3本・間かく2.8秒','雷の威力＋20%・間かく2.4秒']},
  medic:{name:'回復ドローン',c:'#5dffb0',max:5,v:{cd:[20,18,16,14,12],h:[10,12,14,16,20]},
    at:['20秒ごとにHP10回復の玉を落とす','間かく18秒・回復12','間かく16秒・回復14','間かく14秒・回復16','間かく12秒・回復20']},
  frostaura:{name:'氷の結界',c:'#bfe9ff',max:5,v:{r:[62,68,74,80,90],f:[0.7,0.65,0.6,0.55,0.5]},
    at:['まわりの敵の速さを30%下げる','輪が大きく・遅さ35%','輪が大きく・遅さ40%','輪が大きく・遅さ45%','輪がさらに大きく・遅さ50%']},
  fireaura:{name:'炎のオーラ',c:'#ff9f43',max:5,v:{r:[54,58,62,66,74],d:[5,7,9,11,14]},
    at:['まわりの敵を0.5秒ごとに焼く','炎の威力＋40%','炎の威力＋30%・輪が大きく','炎の威力＋20%・輪が大きく','炎の威力＋25%・輪がさらに大きく']},
  guardsat:{name:'盾の衛星',c:'#e2e6f4',max:5,v:{n:[1,2,2,3,4],w:[2.2,2.2,2.8,2.8,3.2],d:[8,8,12,12,16]},
    at:['衛星1つが回り、敵の弾を防ぐ','衛星が2つになる','回る速さと威力＋50%','衛星が3つになる','衛星が4つ・回る速さ＋15%']},
  meteor:{name:'流れ星',c:'#a98bff',max:5,v:{cd:[3,2.7,2.4,2.1,1.8],n:[2,2,3,3,4],d:[20,26,30,36,40]},
    at:['3秒ごとに光の矢が2本降る','矢の威力＋30%・間かく2.7秒','矢が3本・間かく2.4秒','矢の威力＋20%・間かく2.1秒','矢が4本・間かく1.8秒']},
  battleship:{name:'支援砲撃',c:'#b8bfdc',max:5,v:{cd:[24,21,18,15,12],d:[30,38,46,54,64]},
    at:['24秒ごとに戦艦が横切り、砲撃','砲撃の威力＋25%・間かく21秒','砲撃の威力＋20%・間かく18秒','砲撃の威力＋15%・間かく15秒','砲撃の威力＋20%・間かく12秒']},
  timestop:{name:'時間停止',c:'#e6dcff',max:3,v:{cd:[30,27,24],t:[2,2.5,3]},
    at:['30秒ごとに2秒、敵と敵の弾が止まる','止まる時間2.5秒・間かく27秒','止まる時間3秒・間かく24秒']},
});
const SUP_NEW=['thunder','medic','frostaura','fireaura','guardsat','meteor','battleship','timestop'];
const SV=(k,key)=>SUP[k].v[key][Math.max(0,Math.min(SUP[k].max,R.sup[k])-1)];/* いまのレベルの数字 */
/* 特別な強化（代償つき・紫の枠）：レベル5から、ときどき1枠。1出撃にそれぞれ1回 */
const SPC={
  glass:{name:'ガラスの大砲',good:'すべての威力＋50%',bad:'最大HP−30%'},
  back:{name:'背水の陣',good:'HPが減るほど速さと連射＋（最大40%）',bad:'自動の回復がきかない'},
  greed:{name:'欲ばり',good:'お金と経験値＋40%',bad:'敵が20%多く出る'},
  heavy:{name:'重戦車',good:'最大HP＋50%',bad:'動く速さ−20%'},
  fury:{name:'狂戦士',good:'近接の武器の威力＋60%',bad:'射撃の武器の威力−20%'},
  one:{name:'一点集中',good:'いちばん高いLvの武器の威力＋40%',bad:'ほかの武器の威力−15%'},
  haste:{name:'時の加速',good:'経験値＋30%・動く速さ＋15%',bad:'敵と敵の弾も15%速い'},
  wall:{name:'鉄壁',good:'受けるダメージ−30%',bad:'すべての武器の連射−15%'},
};
const SPC_IDS=Object.keys(SPC);
/* レベルアップの枠の色：装備＝青・機体＝緑・支援＝黄・特別＝紫・進化＝白金 */
const CATC={w:'#4588f2',p:'#5dffb0',s:'#ffd23f',x:'#a98bff',e:'#fff2a8'};

/* ステージの間の強化（研究所）。G で買う・ずっと続く・全機体に効く。値段は1レベルごとに1.6倍（10G単位） */
const LAB=[
  {id:'r_hp',name:'機体の補強',max:5,p:200,per:'最大HP＋5%',u:5,unit:'%'},
  {id:'r_pow',name:'火力の研究',max:5,p:250,per:'すべての威力＋4%',u:4,unit:'%'},
  {id:'r_rate',name:'連射の研究',max:5,p:250,per:'すべての武器の連射＋3%',u:3,unit:'%'},
  {id:'r_spd',name:'エンジン',max:3,p:200,per:'動く速さ＋3%',u:3,unit:'%'},
  {id:'r_mag',name:'磁力',max:5,p:150,per:'吸い寄せる距離＋8%',u:8,unit:'%'},
  {id:'r_xp',name:'学習',max:5,p:200,per:'もらえる経験値＋5%',u:5,unit:'%'},
  {id:'r_gold',name:'商売',max:5,p:300,per:'出撃でかせぐお金＋5%',u:5,unit:'%'},
  {id:'r_regen',name:'自己修復',max:3,p:300,per:'HPが1秒に0.1ずつ回復',u:0.1,unit:'/秒'},
  {id:'r_reroll',name:'えらび直し',max:3,p:400,per:'レベルアップの候補を引き直す',u:1,unit:'回'},
  {id:'r_skip',name:'スキップ',max:3,p:300,per:'えらばずにお金と経験値をもらう',u:1,unit:'回'},
  {id:'r_ban',name:'除外',max:3,p:400,per:'その出撃で強化を1つ出なくする',u:1,unit:'回'},
  {id:'r_lv',name:'先行訓練',max:2,p:800,per:'はじめのレベル＋1',u:1,unit:''},
  {id:'r_slot',name:'増設',max:1,p:3000,per:'全機体の後ろに装備の場所＋1',u:1,unit:'か所'},
  {id:'r_skill',name:'予備電池',max:1,p:1200,per:'はじめから必殺ゲージが半分',u:1,unit:''},
  {id:'r_revive',name:'予備の機体',max:1,p:2500,per:'1出撃に1回、HP50%で復活',u:1,unit:'回'},
];
const LABK={};LAB.forEach(o=>{LABK[o.id]=o;});
/* 研究所の解放（11/16 しょーくん「研究所もアンロックは段階的に」）。ここにない4こ（機体の補強・火力の研究・磁力・商売）は最初から。
   形はショップの品と同じ [記録, 種類, 数, 条件の文]（お金や運では決まらない）。だいたいやさしい順（もうすぐ解放の並びに使う） */
const LAB_UNLOCK={r_rate:['runs',0,2,'30秒以上の出撃2回'],r_xp:['runs',0,3,'30秒以上の出撃3回'],r_spd:['bosses',0,1,'大型の敵を1体たおす'],r_reroll:['bestLv',0,10,'1出撃でLv10'],
  r_regen:['stageMax',0,1,'ステージ1クリア'],r_skip:['bosses',0,3,'大型の敵を合計3体たおす'],r_ban:['stageMax',0,2,'ステージ2クリア'],r_lv:['clears',0,3,'合計3回クリア'],
  r_skill:['spTotal',0,10,'必殺技を合計10回出す'],r_revive:['stageMax',0,3,'ステージ3クリア'],r_slot:['stageMax',0,4,'ステージ4クリア']};
const LAB_ORDER={};Object.keys(LAB_UNLOCK).forEach((id,i)=>{const [k,x,n,txt]=LAB_UNLOCK[id];LABK[id].unlock={k,t:x||null,n,txt};LAB_ORDER[id]=i;});
const labPrice=(o,lv)=>Math.round(o.p*Math.pow(1.6,lv)/10)*10;
/* 図鑑：敵（ステージの順。st＝はじめて出るステージ） */
const BOOK_E=[
  {k:'bug',st:1,name:'羽虫',desc:'まっすぐ向かってくる小さい敵'},
  {k:'tank',st:1,name:'鉄の殻',desc:'かたい。ゆっくり下りてくる'},
  {k:'shooter',st:1,name:'撃ち手',desc:'止まって、ねらった弾を撃つ'},
  {k:'boss',st:1,name:'紅の大蟹',desc:'大型の敵。弾を5方向に撃つ'},
  {k:'boss2',st:1,name:'紫の大蟹',desc:'大型の敵。2体目に出てくる'},
  {k:'hider',st:2,name:'岩やどり',desc:'岩をかぶって近づき、近くで飛び出す'},
  {k:'charger',st:2,name:'角突き',desc:'止まってねらい、まっすぐ突っこむ'},
  {k:'gnaw',st:2,name:'岩喰い',desc:'大型の敵。口から岩を投げる'},
  {k:'gnaw2',st:2,name:'双頭の岩喰い',desc:'大型の敵。2つの頭が交代で撃つ'},
  {k:'frost',st:3,name:'霜の撃ち手',desc:'当たると機体が少し遅くなる弾を撃つ'},
  {k:'splitter',st:3,name:'割れ氷',desc:'たおすと2つの小さな氷に分かれる'},
  {k:'shard',st:3,name:'氷のかけら',desc:'割れ氷から分かれた、すばやい敵'},
  {k:'icebeast',st:3,name:'氷晶獣',desc:'大型の敵。氷の弾を輪にして撃つ'},
  {k:'icequeen',st:3,name:'氷の女王',desc:'大型の敵。うずまきの弾と氷の手下'},
  {k:'turret',st:4,name:'砲台',desc:'床といっしょに流れ、3連の弾を撃つ'},
  {k:'guard',st:4,name:'盾持ち',desc:'前からの弾を盾で防ぐ。横か後ろをねらう'},
  {k:'fort',st:4,name:'要塞砲台',desc:'大型の敵。3つの砲とレーザーの壁'},
  {k:'snake',st:4,name:'機械の大蛇',desc:'大型の敵。長い体で画面をめぐる'},
  {k:'warp',st:5,name:'まぼろし',desc:'消えては、自機の近くにあらわれて撃つ'},
  {k:'core',st:5,name:'深淵の核',desc:'最終ボス。たおすとステージ5をクリア'},
];
/* ステージ（#13・docs/design/stages.md）。hp＝敵の体力の倍率・gold＝クリアのお金・big＝大型の敵の時間と種類（prev1・prev2＝前のステージの大型の敵）
   final＝最終ボスをたおすとクリア（5:00 で時間切れにならない） */
const STAGES=[
  {name:'星の海',desc:'青い星雲。はじめのステージ',hp:1,gold:300,big:[[150,'boss'],[270,'boss2']]},
  {name:'小惑星帯',desc:'流れてくる岩はこわすとお金になる',hp:1.4,gold:450,big:[[150,'gnaw'],[270,'gnaw2']]},
  {name:'氷の星雲',desc:'ときどき吹雪。敵も自機も遅くなる',hp:1.9,gold:600,big:[[150,'icebeast'],[270,'icequeen']]},
  {name:'機械要塞',desc:'予告の線のあとにレーザーの壁',hp:2.2,gold:800,big:[[150,'fort'],[270,'snake']]},
  {name:'深淵',desc:'最終ボスをたおすまで終わらない',hp:2.2,gold:1200,big:[[120,'prev1'],[210,'prev2'],[300,'core']],final:1},
];
const stOpen=n=>n<=1||save.rec.stageMax>=n-1;
/* 機体（12機）。slots＝装備の場所（機体の絵の中心からのずれ・out＝外向き・front＝ヴァンガードの前向き）。数字は 11/15 の案（docs/design/ships.md）
   sp＝必殺技（ゲージがいっぱいで自動で出る）。range 射程・area 範囲・boom 爆発の威力・evade 回避・xp 経験値（どれも倍率） */
const SL=(name,x,y,out,front)=>({name,x,y,out,front:!!front});
const SHIPS={
  standard:{name:'スタンダード',c:'#4588f2',hp:1,spd:1,mag:1,rate:1,pow:1,gold:1,price:0,
    desc:'はじめの機体。性能はすべてふつう',skill:'がんばり：やられても1回だけ HP1 で残る',sp:{name:'全方位レーザー',desc:'360°に光線を出し、まわりの敵を焼く'},
    start:[{t:'laser',s:1,d:0},{t:'laser',s:2,d:0}],
    slots:[SL('機首',0,-34,0),SL('左肩',-14,-10,7),SL('右肩',14,-10,1),SL('左翼',-25,8,6),SL('右翼',25,8,2),SL('左尾',-12,25,5),SL('右尾',12,25,3)]},
  rapid:{name:'ラピッド',c:'#ffcd48',hp:0.8,spd:1.05,mag:1,rate:1.25,pow:1,gold:1,price:800,
    desc:'前に撃つのが得意。HPは低め',skill:'連射：すべての武器の発射が25%速い',sp:{name:'早撃ち',desc:'6秒間、すべての武器の連射が2倍'},
    start:[{t:'gatling',s:0,d:0}],unlock:{k:'clears',n:1,txt:'1回クリアする'},
    slots:[SL('機首',0,-34,0),SL('左前',-7,-12,7),SL('右前',7,-12,1),SL('左翼',-22,8,6),SL('右翼',22,8,2),SL('尾',0,26,4)]},
  fortress:{name:'フォートレス',c:'#5dffb0',hp:1.6,spd:0.85,mag:1,rate:1,pow:1,gold:1,price:1200,
    desc:'とてもかたい。動きはおそい',skill:'重装甲：体当たりで受けるダメージ40%へる',sp:{name:'要塞バリア',desc:'4秒無敵になり、衝撃波で弾も消す'},
    start:[{t:'shield',s:0,d:0}],unlock:{k:'bosses',n:5,txt:'大型の敵を合計5体たおす'},
    slots:[SL('機首',0,-32,0),SL('左肩',-16,-12,7),SL('右肩',16,-12,1),SL('左翼',-30,4,6),SL('右翼',30,4,2),SL('背中',0,8,4),SL('左尾',-16,26,5),SL('右尾',16,26,3)]},
  collector:{name:'コレクター',c:'#ffd84a',hp:1,spd:1,mag:1.5,rate:1,pow:1,gold:1.25,price:1000,
    desc:'経験値とお金を集めるのが得意',skill:'集金：吸い寄せ＋50%・お金＋25%',sp:{name:'大吸引',desc:'画面の経験値とお金を全部吸いよせる'},
    start:[{t:'magnet',s:6,d:4}],unlock:{k:'goldTotal',n:5000,txt:'合計5000Gかせぐ'},
    slots:[SL('機首',0,-26,0),SL('左腕',-22,-18,7),SL('右腕',22,-18,1),SL('左翼',-22,12,6),SL('右翼',22,12,2),SL('左尾',-8,18,5),SL('右尾',8,18,3)]},
  blade:{name:'ブレード',c:'#a98bff',hp:0.9,spd:1.2,mag:1,rate:1,pow:1,gold:1,price:1500,blade:1.4,
    desc:'速い。近くで戦うのが得意',skill:'刃：剣・ノコ・ムチなど近接の威力＋40%',sp:{name:'なぎはらい',desc:'画面を横切る3本の斬撃。弾も消す'},
    start:[{t:'sword',s:1,d:7},{t:'sword',s:2,d:1}],unlock:{k:'wmax',t:['sword','saw'],n:8,txt:'近接の剣か回転ノコをLv8にする'},
    slots:[SL('機首',0,-34,0),SL('左肩',-12,-12,7),SL('右肩',12,-12,1),SL('左刃',-26,-10,7),SL('右刃',26,-10,1),SL('左尾',-12,24,5),SL('右尾',12,24,3)]},
  carrier:{name:'キャリア',c:'#18b0b4',hp:1.1,spd:0.95,mag:1,rate:1,pow:1,gold:1,price:2000,carrier:1,
    desc:'支援の味方といっしょに戦う',skill:'母艦：はじめから子機つき・支援が出やすい',sp:{name:'艦載機発進',desc:'味方の戦闘機6機が8秒間いっしょに戦う'},
    start:[{t:'laser',s:0,d:0}],unlock:{k:'sup5',n:3,txt:'支援を3つ最大レベルにする'},
    slots:[SL('機首',0,-36,0),SL('左肩',-16,-10,7),SL('右肩',16,-10,1),SL('左翼',-28,10,6),SL('右翼',28,10,2),SL('左尾',-17,28,5),SL('右尾',17,28,3)]},
  marksman:{name:'スナイパー',c:'#bfe9ff',hp:0.9,spd:1,mag:1,rate:0.85,pow:1.2,gold:1,range:1.3,focus:1,price:1100,
    desc:'射程＋30%・威力＋20%',skill:'集中：止まっている間、威力が最大＋30%',sp:{name:'精密射撃',desc:'大きい敵から5体をねらい、大ダメージ'},
    start:[{t:'sniper',s:0,d:0}],unlock:{k:'fastBoss',n:1,txt:'大型の敵を、出てから30秒以内にたおす'},
    slots:[SL('機首',0,-36,0),SL('左前',-7,-15,7),SL('右前',7,-15,1),SL('左翼',-16,8,7),SL('右翼',16,8,1),SL('背中',0,12,4)]},
  bomber:{name:'ボマー',c:'#ffaa4a',hp:1.1,spd:0.9,mag:1,rate:1,pow:1,gold:1,area:1.25,boom:1.3,bomb:1,price:1300,
    desc:'範囲＋25%・爆発の威力＋30%',skill:'爆風：爆発で小さい敵の弾も消える',sp:{name:'じゅうたん爆撃',desc:'画面を下から上へ爆発でうめる'},
    start:[{t:'grenade',s:0,d:0}],unlock:{k:'bestKills',n:1000,txt:'1回の出撃で1000体たおす'},
    slots:[SL('機首',0,-34,0),SL('左肩',-12,-14,7),SL('右肩',12,-14,1),SL('左翼',-21,4,6),SL('右翼',21,4,2),SL('左尾',-10,26,5),SL('右尾',10,26,3)]},
  phantom:{name:'ファントム',c:'#e44aec',hp:0.7,spd:1.3,mag:1,rate:1,pow:1,gold:1,evade:0.2,graze:1,price:1600,
    desc:'回避20%・速さ＋30%',skill:'かすり：弾をかすめると必殺ゲージがたまる',skill2:'被弾すると0.8秒すがたを消す',sp:{name:'分身',desc:'4秒間、分身2体が同じ攻撃をする'},
    start:[{t:'twin',s:0,d:0}],unlock:{k:'halfClear',n:1,txt:'HPを半分以上のこしてクリアする'},
    slots:[SL('機首',0,-36,0),SL('左翼',-20,-2,7),SL('右翼',20,-2,1),SL('左尾',-9,26,5),SL('右尾',9,26,3)]},
  vanguard:{name:'ヴァンガード',c:'#ff6a7a',hp:1.3,spd:1.1,mag:1,rate:1,pow:1,gold:1,front:1.3,ram:1,price:1400,
    desc:'機首と前の装備の威力＋30%',skill:'突撃装甲：体当たりで小さい敵を倒す',skill2:'体当たりで受けるダメージ−50%',sp:{name:'突撃',desc:'前へ突っこみ、道の敵をなぎ倒す。その間は無敵'},
    start:[{t:'lance',s:0,d:0}],unlock:{k:'meleeK',n:2000,txt:'近接の武器で合計2000体たおす'},
    slots:[SL('機首',0,-38,0,1),SL('左前',-10,-22,7,1),SL('右前',10,-22,1,1),SL('左肩',-22,-4,6),SL('右肩',22,-4,2),SL('左尾',-12,26,5),SL('右尾',12,26,3)]},
  alchemist:{name:'アルケミスト',c:'#e6ff5c',hp:0.95,spd:1,mag:1,rate:1,pow:1,gold:1.1,xp:1.15,evoLv:6,price:1800,
    desc:'経験値＋15%・お金＋10%',skill:'錬金：武器の進化が Lv6 からできる',sp:{name:'変換',desc:'敵の弾を4秒間、経験値の玉に変える'},
    start:[{t:'acid',s:0,d:0}],unlock:{k:'evos',n:1,txt:'武器を1回進化させる'},
    slots:[SL('機首',0,-36,0),SL('左肩',-9,-14,7),SL('右肩',9,-14,1),SL('左翼',-22,18,6),SL('右翼',22,18,2),SL('左尾',-8,28,5),SL('右尾',8,28,3)]},
  omega:{name:'オメガ',c:'#f2f7ff',hp:1.1,spd:1.1,mag:1.1,rate:1.1,pow:1.1,gold:1.1,xp:1.1,range:1.1,area:1.1,boom:1.1,evade:0.1,awaken:1,price:5000,
    desc:'すべての性能＋10%',skill:'覚醒：10回に1回、レベルアップで2つえらぶ',sp:{name:'主砲の一撃',desc:'画面全体に大ダメージ。敵の弾も消す'},
    start:[{t:'cannon',s:0,d:0}],unlock:{k:'stageMax',n:5,txt:'ステージ5をクリアする'},
    slots:[SL('機首',0,-38,0),SL('左前',-17,-24,7),SL('右前',17,-24,1),SL('左肩',-11,-6,7),SL('右肩',11,-6,1),SL('左翼',-27,16,6),SL('右翼',27,16,2),SL('左尾',-12,32,5),SL('右尾',12,32,3)]},
};
const SHIP_IDS=Object.keys(SHIPS);
let SLOTS=SHIPS.standard.slots;
const KIND={
  bug:{hp:4,spd:46*U,dmg:6,r:6.5*U,xp:1,col:['#ff3b4f','#fff36b','#ff8a5c']},
  tank:{hp:26,spd:27*U,dmg:12,r:9.5*U,xp:3,col:['#ff7a1a','#fff36b','#b84a0e']},
  shooter:{hp:9,spd:36*U,dmg:8,r:8*U,xp:2,col:['#ff3fb4','#fff36b','#ff8ce0']},
  /* 大型の敵は絵を160ドット以上にしたので、当たりの大きさも絵に合わせた（試作4は絵47・当たり20） */
  boss:{hp:380,spd:22*U,dmg:20,r:54,xp:30,col:['#e0304f','#fff36b','#ff7a8c'],kb:0.08,burst:50},
  /* #13 ステージ2〜5の敵。small＝突撃装甲で体当たりできる小さい敵・kb＝ノックバックの効き・fixed＝押されない */
  hider:{hp:10,spd:30*U,dmg:9,r:8.5*U,xp:2,col:['#ff9f43','#d6c4b0','#fff36b'],small:1},
  charger:{hp:9,spd:34*U,dmg:11,r:8*U,xp:2,col:['#ff4a5e','#fff36b','#ff9f43'],small:1},
  frost:{hp:11,spd:34*U,dmg:8,r:8*U,xp:2,col:['#ff6ccc','#fff2f9','#fff36b'],small:1},
  splitter:{hp:20,spd:30*U,dmg:10,r:9.5*U,xp:2,col:['#ff6ccc','#ffc4e2','#d43aa4'],kb:0.7,burst:12},
  shard:{hp:4,spd:50*U,dmg:5,r:5.5*U,xp:1,col:['#ff6ccc','#fff2f9'],small:1},
  turret:{hp:30,spd:0,dmg:12,r:10*U,xp:3,col:['#e0304f','#a0444e','#fff36b'],kb:0,fixed:1,burst:16},
  guard:{hp:24,spd:28*U,dmg:11,r:9.5*U,xp:3,col:['#e0304f','#ff9f43','#fff36b'],kb:0.5,burst:12},
  warp:{hp:14,spd:30*U,dmg:9,r:8*U,xp:3,col:['#e45e98','#ffc8ff','#fff36b'],small:1},
  /* しかけ（岩）と大蛇の体：図鑑・撃破には数えない */
  rock:{hp:12,spd:0,dmg:14,r:10,xp:0,col:['#9a8676','#d6c4b0','#64544a'],kb:0.25,trap:1},
  seg:{hp:1,spd:0,dmg:16,r:19,xp:0,col:['#e0304f','#a0444e'],kb:0,fixed:1,part:1},
};
KIND.tank.kb=0.5;KIND.tank.burst=16;KIND.bug.small=1;KIND.shooter.small=1;

