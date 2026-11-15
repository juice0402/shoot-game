"""防御・補助20種と武器の進化14種のテスト（issue #10）
使い方: python3 tools/test/parts10.py [index.html] [出力フォルダ]
- テスト用のコピーに window.__T を足して Playwright（chromium）で開く。外への読みこみ（フォント）は止める
- 文：新しい名前・説明・レベルアップの文の長さと、使わない言葉
- 20種の効き目を数字で確かめる（HP・速さ・盾・回避・復活・会心・範囲・経験値・回収 など）
- 20種を1つずつつけて5分早送り（盾ドローン・前面シールドは Lv1→Lv8）：エラー0
- 進化14種：条件（Lv8＋相手）どおりに出るか・えらぶと変わるか・60秒早送りでダメージとエラー
- 重さ：敵280体＋進化14種＋防御・補助をつけた場面の1フレームの時間
"""
import json, os, sys, tempfile
from playwright.sync_api import sync_playwright

SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', '..', 'index.html')
OUT = sys.argv[2] if len(sys.argv) > 2 else tempfile.mkdtemp()
SECS = float(os.environ.get('SECS', '300'))
ESECS = float(os.environ.get('ESECS', '60'))

NEW = ['harmor', 'sdrone', 'fshield', 'spike', 'evade', 'ebarrier', 'absorber', 'revive', 'iframe', 'frost',
       'scope', 'cooler', 'amp', 'crit', 'dur', 'multi', 'xpamp', 'cdrone', 'reactor', 'berserk']


def build(src):
    h = open(src, encoding='utf-8').read()
    def rp(a, b):
        nonlocal h
        assert h.count(a) == 1, a
        h = h.replace(a, b)
    rp("  if(R.cs.crit>0&&Math.random()<R.cs.crit){", "  window.__HITS++;if(R.cs.crit>0&&Math.random()<R.cs.crit){window.__CRIT++;")
    rp("  e.hp-=amt;e.flash=0.07;", "  window.__DMG+=amt;e.hp-=amt;e.flash=0.07;")
    rp("function hurt(d){\n  if(R.inv>0)return;", "function hurt(d){\n  if(R.inv>0)return;window.__HURT++;")
    rp("function ebGone(b,c,h){b.dead=true;", "function ebGone(b,c,h){window.__EBG++;b.dead=true;")
    rp("  if(!R)return;\n  raf=requestAnimationFrame(frame);", "  if(!R||window.__HOLD)return;\n  raf=requestAnimationFrame(frame);")
    expose = ("window.__DMG=0;window.__HITS=0;window.__CRIT=0;window.__HURT=0;window.__EBG=0;"
              "window.__T={get R(){return R},update,draw,stat,startRun,addEnemy,openShop,renderShop,openDetail,closeSheet,buildChoices,openLevelUp,"
              "pickChoice,get lvChoices(){return lvChoices},evoReady,evolve,hurt,hit,gainXp,ebGone,addCoin,movePlayer,contact,buildGrid,calcCS,"
              "get save(){return save},MODS,TYPES,EVO,CSK,WMAX,get GH(){return GH},setShip,ICON,ICONE,MSPR,MSPRE,shootAt};\n")
    i = h.rindex('})();\n</script>')
    h = h[:i] + expose + h[i:]
    return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' + h + '</body></html>'


HELPERS = r"""
()=>{window.__go=(list,lv)=>{const T=window.__T;window.__HOLD=1;T.save.st=1;T.setShip('standard');const L=T.save.load;for(let i=0;i<L.length;i++)L[i]=null;
  list.forEach((t,i)=>{L[i]={t,d:0};});T.startRun();const R=T.R;if(lv)for(const t in lv)R.tlv[t]=lv[t];R.need=1e9;return R;};}
"""

TEXT = r"""
()=>{const T=window.__T,bad=[],rows=[];
  const BAN=/[！!✨★▶✓☆♪]|してね|だよ|しよう|しましょう|ぜひ|便利|簡単|安心|おすすめ|ポイント|コツ|最強|圧倒的|——|―|NEW|[\u{1F300}-\u{1FAFF}]/u;
  const chk=(where,s,max)=>{if(!s){bad.push(where+' 文なし');return;}const n=[...s].length;if(max&&n>max)bad.push(where+' 長い '+n+'字：'+s);if(BAN.test(s))bad.push(where+' 使わない言葉：'+s);};
  for(const t of NEWT){const m=T.MODS[t];chk(t+' name',m.name);chk(t+' desc',m.desc,22);chk(t+' eff',m.eff,22);rows.push([t,m.name,m.desc,[...m.desc].length]);
    if(m.up)for(let L=2;L<=T.WMAX;L++)chk(t+' up'+L,m.up[L],22);}
  for(const t in T.EVO){const E=T.EVO[t];chk(t+' evo name',E.name);chk(t+' evo desc',E.desc,22);rows.push([t,E.name,E.desc,[...E.desc].length]);}
  /* レベルアップの文は2つまで（「・」でつなぐ数） */
  for(const t of T.TYPES){const m=T.MODS[t];if(!m.up)continue;for(let L=2;L<=T.WMAX;L++){const u=m.up[L];if(u&&u.split('・').length>2)bad.push(t+' up'+L+' 3つ以上：'+u);}}
  return {bad,rows};}
"""

CHECKS = r"""
()=>{const T=window.__T,go=window.__go,res={};const ok=(k,pass,val)=>{res[k]={pass:!!pass,val};};
  const near1=(a,b,e)=>Math.abs(a-b)<=(e||0.011);
  /* 重装甲：最大HP ＋40・速さ −8%（2つで ＋80・−16%） */
  const mv=R=>{R.target={x:R.x+400,y:R.y};const x0=R.x;T.movePlayer(0.05);return R.x-x0;};
  let R0=go(['laser']),h0=R0.maxHp,s0=mv(R0),R1=go(['laser','harmor']),h1=R1.maxHp,s1=mv(R1),R2=go(['laser','harmor','harmor']),h2=R2.maxHp,s2=mv(R2);
  ok('harmor',h1-h0===40&&h2-h0===80&&near1(s1/s0,0.92)&&near1(s2/s0,0.84),{hp:[h0,h1,h2],spd:[+(s1/s0).toFixed(3),+(s2/s0).toFixed(3)]});
  /* 弾を撃ちこむ：dirs の方向（ラジアン）から n 発ずつ、機体に向けて */
  const volley=(R,dirs,n,secs)=>{R.E.length=0;R.acc=-1e9;const e0=window.__EBG,h0=window.__HURT;let t=0;
    for(let w=0;w<n;w++)for(const a of dirs){const x=R.x+Math.cos(a)*170,y=R.y+Math.sin(a)*170;R.EB.push({x,y,vx:-Math.cos(a)*138,vy:-Math.sin(a)*138,dmg:1,big:false,dead:false,
      t0:w*0.4});}
    const pend=R.EB.splice(0);for(let i=0;i<secs*30;i++){t+=1/30;for(let j=pend.length-1;j>=0;j--)if(pend[j].t0<=t){R.EB.push(pend[j]);pend.splice(j,1);}
      R.hp=R.maxHp;R.inv=0;R.pending=0;R.acc=-1e9;T.update(1/30);}
    return {blocked:window.__EBG-e0,hurt:window.__HURT-h0};};
  const ring12=[...Array(12)].map((_,i)=>i/12*Math.PI*2);
  /* 盾ドローン：まわりから来る弾を消す。Lv1 は2枚・Lv8 は5枚 */
  let R3=go(['sdrone']);const a1=volley(R3,ring12,5,4);const n1=T.stat('sdrone').n;R3=go(['sdrone'],{sdrone:8});const a8=volley(R3,ring12,5,4);const n8=T.stat('sdrone').n;
  ok('sdrone',a1.blocked>0&&a8.blocked>a1.blocked&&n1===2&&n8===5,{lv1:a1,lv8:a8,n:[n1,n8]});
  /* 前面シールド（上向き）：上から来る弾は8発まで防いで割れる。下から来る弾は防がない。割れて6秒で戻る */
  let R4=go(['fshield']);const up=volley(R4,[-Math.PI/2],20,9);const m4=R4.mods[0],fhAfter=m4.fh;
  R4=go(['fshield']);const dn=volley(R4,[Math.PI/2],10,5);
  R4=go(['fshield']);R4.mods[0].fh=0;R4.mods[0].fr=6;for(let i=0;i<5.9*30;i++){R4.hp=R4.maxHp;R4.acc=-1e9;R4.E.length=0;T.update(1/30);}const before=R4.mods[0].fh;for(let i=0;i<6;i++){R4.acc=-1e9;R4.E.length=0;T.update(1/30);}
  const fs8=(go(['fshield'],{fshield:8}),T.stat('fshield'));
  ok('fshield',up.blocked===8&&dn.blocked===0&&before===0&&R4.mods[0].fh===8&&fs8.hp===16,{up,dn,regen:[before,R4.mods[0].fh],lv8hp:fs8.hp});
  /* トゲ装甲：ぶつかった敵に15・体当たりの被ダメージ −30% */
  const sp=list=>{const R=go(list);R.E.length=0;R.acc=-1e9;R.inv=0;const e=T.addEnemy('tank',R.x+8,R.y);const hp0=e.hp,ph=R.hp;T.buildGrid();T.contact();return [+(hp0-e.hp).toFixed(2),+(ph-R.hp).toFixed(2)];};
  const sp0=sp(['laser']),sp1=sp(['laser','spike']);ok('spike',sp0[0]===0&&near1(sp1[0],15)&&near1(sp1[1],sp0[1]*0.7),{without:sp0,with:sp1});
  /* 回避装置：15%・3つで45%・4つでも45% */
  const ev=list=>{const R=go(list);let dodge=0;const N=6000;for(let i=0;i<N;i++){R.inv=0;R.bar=false;R.hp=1e6;R.maxHp=1e6;R.ebLeft=0;const h=R.hp;T.hurt(1);if(R.hp===h)dodge++;}return +(dodge/N).toFixed(3);};
  const e1=ev(['laser','evade']),e3=ev(['laser','evade','evade','evade']),e4=ev(['laser','evade','evade','evade','evade']);
  ok('evade',Math.abs(e1-0.15)<0.02&&Math.abs(e3-0.45)<0.025&&Math.abs(e4-0.45)<0.025,{e1,e3,e4});
  /* 緊急バリア：HP30%を切ると3秒無敵。1つにつき1回 */
  const eb=n=>{const R=go(['laser'].concat(Array(n).fill('ebarrier')));let uses=0;for(let i=0;i<3;i++){R.inv=0;R.ebT=0;R.hp=R.maxHp*0.4;T.hurt(R.maxHp*0.15);if(R.ebT===3&&R.inv>=3)uses++;}return uses;};
  const eb1=eb(1),eb2=eb(2);ok('ebarrier',eb1===1&&eb2===2,{one:eb1,two:eb2});
  /* 吸収板：弾を1つ消すと HP ＋0.5（2つで ＋1） */
  const ab=n=>{const R=go(['laser'].concat(Array(n).fill('absorber')));R.hp=50;T.ebGone({x:R.x,y:R.y,dead:false});return R.hp-50;};
  const ab0=ab(0),ab1=ab(1),ab2=ab(2);ok('absorber',ab0===0&&near1(ab1,0.5)&&near1(ab2,1),{ab0,ab1,ab2});
  /* 復活装置：HP0 で HP50% に。1つで1回、3つでも2回まで */
  const rv=n=>{const R=go(['laser'].concat(Array(n).fill('revive')));R.guts=false;let k=0;for(let i=0;i<4;i++){R.inv=0;R.ebT=0;R.hp=3;T.hurt(50);if(R.hp===Math.round(R.maxHp*0.5))k++;}return k;};
  const rv1=rv(1),rv3=rv(3);ok('revive',rv1===1&&rv3===2,{one:rv1,three:rv3});
  /* 無敵延長：被弾後の無敵 0.55秒 → ＋40% */
  const ifr=list=>{const R=go(list);R.inv=0;R.cs.evade=0;T.hurt(1);return +R.inv.toFixed(3);};
  const if0=ifr(['laser']),if1=ifr(['laser','iframe']);ok('iframe',near1(if1/if0,1.4),{if0,if1});
  /* 氷の装甲：被弾すると近くの敵（約105ドット）がこおる。遠くの敵はそのまま */
  const R5=go(['laser','frost']);R5.E.length=0;const en=T.addEnemy('tank',R5.x+70,R5.y),ef=T.addEnemy('tank',R5.x+300,R5.y);T.buildGrid();R5.inv=0;T.hurt(1);
  ok('frost',near1(en.slow,2.5)&&en.slowF<=0.15&&ef.slow===0,{near:[en.slow,en.slowF],far:ef.slow});
  /* 照準装置・冷却装置・増幅器・持続装置・多弾装置：stat() の値 */
  const sv=(list,t,k)=>{go(list);return T.stat(t)[k];};
  const r=(t,k,item)=>+(sv(['laser',t==='laser'?'gatling':t,item],t,k)/sv(['laser',t==='laser'?'gatling':t],t,k)).toFixed(3);
  ok('scope',near1(r('laser','spd','scope'),1.15)&&near1(r('shotgun','life','scope'),1.15)&&near1(r('thunder','range','scope'),1.15),{laserSpd:r('laser','spd','scope'),shotgunLife:r('shotgun','life','scope')});
  ok('cooler',near1(r('laser','cd','cooler'),1/1.08),{laserCd:r('laser','cd','cooler'),pulseCd:r('pulse','cd','cooler')});
  ok('amp',near1(r('mine','rad','amp'),1.15)&&near1(r('sword','range','amp'),1.15)&&near1(r('halo','R','amp'),1.15)&&near1(r('acid','r','amp'),1.15),{mine:r('mine','rad','amp'),sword:r('sword','range','amp')});
  ok('dur',near1(r('acid','life','dur'),1.2)&&near1(r('freeze','slowT','dur'),1.2)&&near1(r('turret','life','dur'),1.2),{acid:r('acid','life','dur'),freeze:r('freeze','slowT','dur')});
  const mn=(t,k)=>sv(['laser',t,'multi'],t,k)-sv(['laser',t],t,k);
  ok('multi',mn('laser','n')===1&&mn('shockwave','n')===1&&mn('cluster','k')===1&&near1(r('laser','dmg','multi'),0.9),{laserN:mn('laser','n'),dmg:r('laser','dmg','multi')});
  /* 会心回路：5%で2倍（ダメージの平均が1.05倍） */
  const cr=list=>{const R=go(list);R.E.length=0;const e=T.addEnemy('boss',R.x,R.y-200);e.hp=1e12;window.__DMG=0;window.__CRIT=0;const N=20000;for(let i=0;i<N;i++)T.hit(e,1,0,0);return [+(window.__DMG/N).toFixed(3),+(window.__CRIT/N).toFixed(3)];};
  const c0=cr(['laser']),c1=cr(['laser','crit']),c2=cr(['laser','crit','crit']);ok('crit',c0[0]===1&&Math.abs(c1[0]-1.05)<0.008&&Math.abs(c2[0]-1.1)<0.01,{c0,c1,c2});
  /* 経験値増幅器：＋10% */
  const xp=list=>{const R=go(list);R.xp=0;T.gainXp(10);return +R.xp.toFixed(3);};ok('xpamp',xp(['laser'])===10&&near1(xp(['laser','xpamp']),11),{x0:xp(['laser']),x1:xp(['laser','xpamp'])});
  /* 回収ドローン：吸い寄せより遠い経験値の玉10個を集める */
  const cd=list=>{const R=go(list);R.E.length=0;R.G.length=0;R.EB.length=0;R.acc=-1e9;R.x=240;R.y=T.GH*0.7;
    for(let i=0;i<10;i++){const a=-Math.PI*0.1-i*Math.PI*0.08;R.G.push({x:R.x+Math.cos(a)*230,y:R.y+Math.sin(a)*230,v:1,big:false,vx:0,vy:-12,dead:false,pull:false,sp:105});}
    R.xp=0;for(let i=0;i<6*30;i++){R.hp=R.maxHp;R.acc=-1e9;R.E.length=0;R.pending=0;T.update(1/30);}return Math.round(R.xp);};
  const cd0=cd(['laser']),cd1=cd(['laser','cdrone']);ok('cdrone',cd1>=8&&cd0<=2,{without:cd0,with:cd1});
  /* エネルギー炉：必殺ゲージの速さ（#11 で使う共通の数字） */
  go(['laser','reactor']);ok('reactor',near1(T.R.cs.gauge,1.2),{gauge:T.R.cs.gauge});
  /* 怒りの回路：HP 75% で ＋15%・50%以下で ＋30% */
  const bz=f=>{const R=go(['laser','berserk']);R.hp=R.maxHp*f;return T.stat('laser').dmg;};
  const bz1=bz(1),bz75=bz(0.75),bz50=bz(0.5),bz10=bz(0.1);ok('berserk',near1(bz75/bz1,1.15)&&near1(bz50/bz1,1.3)&&near1(bz10/bz1,1.3),{r75:+(bz75/bz1).toFixed(3),r50:+(bz50/bz1).toFixed(3),r10:+(bz10/bz1).toFixed(3)});
  /* お金：拾うと出撃のお金に足す */
  const R6=go(['laser']);T.addCoin(R6.x+5,R6.y,1);for(let i=0;i<10;i++){R6.acc=-1e9;T.update(1/30);}ok('coin',R6.gold===1,{gold:R6.gold});
  return res;}
"""

RUN_ONE = r"""
([t,secs,dt])=>{const T=window.__T,R=window.__go(t==='sdrone'||t==='fshield'?[t,'laser']:['laser',t]);
  window.__DMG=0;const steps=Math.round(secs/dt),t0=performance.now();let lvMax=0;
  for(let i=0;i<steps;i++){const lv=Math.min(T.WMAX,1+Math.floor(R.t/36));for(const k in R.tlv)if(R.tlv[k]>0)R.tlv[k]=lv;lvMax=lv;
    R.hp=R.maxHp=1e7;R.pending=0;T.update(dt);if(T.R!==R||R.state==='over')break;if(i%45===0)T.draw();}
  return {t,secs:Math.round(R.t),lv:lvMax,kills:R.kills,dmg:Math.round(window.__DMG),ebg:window.__EBG,ms:Math.round(performance.now()-t0)};}
"""

EVO_ONE = r"""
([t,secs,dt])=>{const T=window.__T,E=T.EVO[t],go=window.__go,out={t,name:E.name};
  /* 条件：Lv7＋相手 → 出ない／Lv8 だけ → 出ない／Lv8＋相手 → 最初の枠に出る */
  let R=go([t,E.p],{[t]:7});out.lv7=T.evoReady().includes(t);
  R=go([t],{[t]:8});out.noPartner=T.evoReady().includes(t);
  R=go([t,E.p],{[t]:8});out.ready=T.evoReady().includes(t);
  R.pending=1;T.openLevelUp();const card=document.querySelector('#overlay .card.evo');out.card=card?card.textContent:'';
  const ch=T.lvChoices[0];out.first=!!(ch&&ch.evo&&ch.name===E.name);T.pickChoice(ch);
  out.evolved=!!R.evo[t];out.again=T.evoReady().includes(t);out.seen=!!T.save.evo[t];
  window.__DMG=0;window.__EBG=0;const seen={};const t0=performance.now();R.t=120;
  for(let i=0;i<Math.round(secs/dt);i++){R.hp=R.maxHp=1e7;R.pending=0;
    if(i%30===0&&R.E.length<120)for(let k=0;k<8;k++)T.addEnemy(Math.random()<0.2?'tank':'bug',Math.random()*480,Math.random()*T.GH*0.5);
    if(i%60===0)for(let k=0;k<5;k++)T.shootAt(R.E[(Math.random()*R.E.length)|0]||{x:240,y:0,r:0},92,0);
    T.update(dt);if(T.R!==R||R.state==='over')break;if(i%40===0)T.draw();
    for(const b of R.B)if(b.k>=16)seen['B'+b.k]=1;for(const m of R.M)if(m.sw)seen.swarm=1;for(const s of R.S)if(s.k==='st')seen.star=1;
    for(const o of R.GV)if(o.bh)seen.bh=1;for(const l of R.L)if(l.au)seen.aurora=1;for(const z of R.Z)if(z.big)seen.tenrai=1;for(const n of R.MN)if(n.gold)seen.gmine=1;
    for(const m of R.mods){if(m.bm!=null)seen.beam=1;if(m.gsh>0)seen.guard=Math.max(seen.guard||0,m.gsh);if(m.ep&&m.ep.length)seen.orbit=m.ep.length;}}
  out.secs=Math.round(R.t-120);out.dmg=Math.round(window.__DMG);out.kills=R.kills;out.gold=R.gold+R.C.length;out.seen=Object.keys(seen).join(',');out.guard=seen.guard||0;
  out.ms=Math.round(performance.now()-t0);out.stat=T.stat(t);return out;}
"""

PERF = r"""
([mods,lvs,frames])=>{const T=window.__T,R=window.__go(['laser']);
  R.mods=mods.map((t,i)=>({t,slot:i%7,d:i%8,cd:Math.random()*0.5}));T.calcCS();for(const k of T.TYPES)R.tlv[k]=0;for(const t of mods)if(!T.MODS[t].passive)R.tlv[t]=8;
  for(const t of lvs)R.evo[t]=true;
  R.t=200;const top=()=>{while(R.E.length<280)T.addEnemy(Math.random()<0.15?'tank':'bug',Math.random()*480,Math.random()*T.GH*0.8);};
  for(let i=0;i<150;i++){top();R.hp=R.maxHp=1e7;R.pending=0;T.update(1/60);if(i%10===0)T.draw();}
  const ts=[];const cnt={};
  for(let i=0;i<frames;i++){top();R.hp=R.maxHp=1e7;R.pending=0;if(i%20===0)for(let k=0;k<6;k++)T.shootAt(R.E[k],92,0);const a=performance.now();T.update(1/60);T.draw();ts.push(performance.now()-a);}
  for(const k of ['E','B','M','Q','PD','RG','MN','GV','P','X','EB','C'])cnt[k]=R[k].length;
  ts.sort((x,y)=>x-y);const avg=ts.reduce((s,v)=>s+v,0)/ts.length;
  return {avg:+avg.toFixed(2),p95:+ts[Math.floor(ts.length*0.95)].toFixed(2),max:+ts[ts.length-1].toFixed(2),cnt};}
"""


def main():
    os.makedirs(OUT, exist_ok=True)
    tmp = tempfile.mkdtemp()
    page_path = os.path.join(tmp, 'test.html')
    open(page_path, 'w', encoding='utf-8').write(build(SRC))
    errs = []
    res = {}
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={'width': 390, 'height': 844})
        pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith('file:') else r.abort())
        pg.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)))
        pg.on('console', lambda m: errs.append('console: ' + m.text) if m.type == 'error' and 'ERR_FAILED' not in m.text else None)
        pg.goto('file://' + page_path)
        pg.wait_for_timeout(400)
        res['boot_ms'] = pg.evaluate("Math.round(performance.now())")
        pg.evaluate(HELPERS)
        pg.evaluate("NEWT=>{window.NEWT=NEWT}", NEW)
        res['text'] = pg.evaluate(TEXT)
        print('TEXT bad:', res['text']['bad'])
        res['checks'] = pg.evaluate(CHECKS)
        fails = {k: v for k, v in res['checks'].items() if not v['pass']}
        print('checks:', len(res['checks']), 'fail:', json.dumps(fails, ensure_ascii=False))
        for k, v in res['checks'].items():
            print(' ', k, 'OK' if v['pass'] else 'NG', json.dumps(v['val'], ensure_ascii=False))
        only = os.environ.get('ONLY')
        if not os.environ.get('SKIPRUN'):
            res['runs'] = []
            for t in (only.split(',') if only else NEW):
                r = pg.evaluate(RUN_ONE, [t, SECS, 1 / 30])
                res['runs'].append(r)
                print('run', json.dumps(r), flush=True)
        res['evo'] = []
        for t in pg.evaluate("Object.keys(window.__T.EVO)"):
            r = pg.evaluate(EVO_ONE, [t, ESECS, 1 / 30])
            res['evo'].append(r)
            good = (not r['lv7']) and (not r['noPartner']) and r['ready'] and r['first'] and r['evolved'] and (not r['again']) and r['dmg'] > 0
            print('evo', 'OK' if good else 'NG', t, r['name'], 'dmg', r['dmg'], 'kills', r['kills'], 'gold', r['gold'], 'seen', r['seen'], r['ms'], 'ms', flush=True)
        evo_all = list(pg.evaluate("Object.keys(window.__T.EVO)"))
        partners = list(set(pg.evaluate("Object.values(window.__T.EVO).map(e=>e.p)")))
        res['perf_evo'] = pg.evaluate(PERF, [evo_all + partners + ['sdrone', 'fshield', 'cdrone', 'multi', 'amp', 'dur'], evo_all, 300])
        heavy = ['napalm', 'acid', 'cluster', 'minefield', 'turret', 'micro', 'hlaser', 'plasma', 'splitter', 'prism', 'halo', 'emp', 'shockwave', 'satellite']
        res['perf_heavy'] = pg.evaluate(PERF, [heavy + ['multi', 'multi', 'amp', 'dur', 'sdrone', 'cdrone'], [], 300])
        print('perf evo:', res['perf_evo'])
        print('perf heavy+multi:', res['perf_heavy'])
        res['errors'] = errs
        b.close()
    json.dump(res, open(os.path.join(OUT, 'parts10.json'), 'w'), ensure_ascii=False, indent=1)
    print('boot ms', res['boot_ms'])
    print('errors', len(errs), errs[:5])


if __name__ == '__main__':
    main()
