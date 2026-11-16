"""枠と文の総点検（11/16 しょーくん「枠と枠のスペースは適切か、枠の大きさは揃っていて、綺麗に整頓されているか、長すぎる文章や、割愛できる文章はないか」）
使い方: OUT=作業メモの場所 [FONTS=フォントの場所] [SRC=前の版] python3 tools/test/audit17.py [幅 高さ] [--noshot]
- FONTS：npm pack @fontsource/press-start-2p @fontsource/dotgothic16 を広げた場所。あるとスマホと同じフォントで撮る（ないと別のフォントで、文字の幅が少しちがう）
- copy16 の画面めぐり（タイトル〜エンディングの 43 画面）を使い、画面ごとに
  スクショ（OUT/a17/NN.png）と寸法（OUT/a17/metrics.json）をとる。出撃中の画面も足す
- 寸法で見ること：画面の外へのはみ出し・文字の切れ・ボタンの文字の折り返し・3行以上の文・
  となりの枠の高さ／幅のずれ・同じ入れ物の中のすき間のばらつき・枠の重なり・小さすぎる押す所・文字とわくのすき間
- まとめ（OUT/a17/report.txt）：画面ごとの気になる所と、画面をまたいだ枠・ボタン・文字の大きさの種類
"""
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import copy16
from copy16 import write_build, open_page, Screens, GO
from playwright.sync_api import sync_playwright

OUT = os.path.join(os.environ.get('OUT', '/tmp'), 'a17')
os.makedirs(OUT, exist_ok=True)
args = [a for a in sys.argv[1:] if not a.startswith('--')]
W, H = (int(args[0]), int(args[1])) if len(args) >= 2 else (390, 844)
SHOT = '--noshot' not in sys.argv

METRICS = r"""
()=>{const W=innerWidth,H=innerHeight,iss=[];
 const cs=e=>getComputedStyle(e);
 const vis=e=>{if(e.closest('[hidden]'))return false;const c=cs(e);if(c.display==='none'||c.visibility==='hidden'||+c.opacity<0.05)return false;const r=e.getBoundingClientRect();return r.width>0.5&&r.height>0.5;};
 const nm=e=>{if(!e||e===document.body)return 'body';let s=e.tagName.toLowerCase();if(e.id)s+='#'+e.id;else if(typeof e.className==='string'&&e.className.trim())s+='.'+e.className.trim().split(/\s+/).slice(0,2).join('.');return s;};
 const pth=e=>{const a=[];let x=e;for(let i=0;i<3&&x&&x!==document.body;i++){a.unshift(nm(x));x=x.parentElement;}return a.join('>');};
 const top=e=>{const r=e.getBoundingClientRect();const x=Math.min(W-1,Math.max(0,r.left+r.width/2)),y=Math.min(H-1,Math.max(0,r.top+r.height/2));const h=document.elementFromPoint(x,y);return !!h&&(h===e||e.contains(h)||h.contains(e)&&h.tagName!=='BODY'&&!h.matches('.howbg,.sheetbg,#overlay,#sheetBg'));};
 const inScroll=e=>{let x=e.parentElement;while(x&&x!==document.body){const c=cs(x);if(/(auto|scroll)/.test(c.overflowX)||/(auto|scroll)/.test(c.overflowY))return x;x=x.parentElement;}return null;};
 const own=e=>[...e.childNodes].filter(n=>n.nodeType===3&&n.textContent.trim()).map(n=>n.textContent.trim()).join(' ');
 const lines=e=>{const rg=document.createRange();rg.selectNodeContents(e);const ts=new Set();for(const q of rg.getClientRects())if(q.width>1)ts.add(Math.round(q.top/4));return ts.size;};
 const R=e=>{const r=e.getBoundingClientRect();return [Math.round(r.left*10)/10,Math.round(r.top*10)/10,Math.round(r.width*10)/10,Math.round(r.height*10)/10];};
 const all=[...document.querySelectorAll('body *')].filter(e=>!['SCRIPT','STYLE','BR'].includes(e.tagName)&&vis(e));
 const shown=all.filter(top);
 const boxed=e=>{const c=cs(e);const bw=parseFloat(c.borderTopWidth)+parseFloat(c.borderBottomWidth)+parseFloat(c.borderLeftWidth)+parseFloat(c.borderRightWidth);const bg=c.backgroundColor!=='rgba(0, 0, 0, 0)'&&c.backgroundColor!=='transparent';return bw>=2||(bg&&e.tagName==='BUTTON')||(bg&&parseFloat(c.paddingLeft)>=4&&e.children.length>0);};
 const boxes=shown.filter(e=>e.tagName!=='CANVAS'&&e.tagName!=='IMG'&&boxed(e));
 // はみ出し
 for(const e of shown){const r=e.getBoundingClientRect();if((r.right>W+0.5||r.left<-0.5)&&!inScroll(e)&&cs(e).position!=='fixed')iss.push(['はみ出し',pth(e),R(e)]);}
 // 文字の切れ
 for(const e of shown){const c=cs(e);if(!own(e))continue;if((/(hidden|clip)/.test(c.overflowX)&&e.scrollWidth>e.clientWidth+1)||(/(hidden|clip)/.test(c.overflowY)&&e.scrollHeight>e.clientHeight+1))iss.push(['文字が切れる',pth(e),own(e).slice(0,30)]);}
 // 文字（折り返し・行数・大きさ）
 const texts=[];
 for(const e of shown){const t=own(e);if(!t)continue;const c=cs(e),n=lines(e);const fs=parseFloat(c.fontSize);texts.push([t.slice(0,40),n,fs,pth(e)]);
   const btn=e.closest('button');
   if(btn&&n>1)iss.push(['ボタンの文字が2行',pth(e),t.slice(0,30)]);
   else if(n>=3)iss.push(['3行以上の文',pth(e),t.slice(0,40)+'…('+n+'行)']);
   if(btn){const b=btn.getBoundingClientRect(),rg=document.createRange();rg.selectNodeContents(e);const q=rg.getBoundingClientRect();const bl=parseFloat(cs(btn).borderLeftWidth);
     const m=Math.min(q.left-b.left-bl,b.right-bl-q.right);if(q.width>0&&m<4&&b.width>40)iss.push(['ボタンの文字がわくに近い',pth(e),t.slice(0,20)+' '+Math.round(m)+'px']);}}
 // 小さい押す所
 for(const e of shown.filter(e=>e.tagName==='BUTTON'&&!e.disabled)){const r=e.getBoundingClientRect();if(r.width<44||r.height<40)iss.push(['押す所が小さい',pth(e),Math.round(r.width)+'x'+Math.round(r.height)]);}
 // 入れ物ごとの枠：高さ・幅のずれ・すき間のばらつき・左右の余白
 const par=new Map();for(const e of boxes){const p=e.parentElement;if(!par.has(p))par.set(p,[]);par.get(p).push(e);}
 for(const [p,ks] of par){if(ks.length<2)continue;const rs=ks.map(k=>k.getBoundingClientRect());
   const rows=[];ks.forEach((k,i)=>{const r=rs[i];let g=rows.find(x=>Math.abs(x.t-r.top)<3);if(!g){g={t:r.top,m:[]};rows.push(g);}g.m.push(i);});
   for(const g of rows){if(g.m.length<2)continue;const hs=g.m.map(i=>rs[i].height);if(Math.max(...hs)-Math.min(...hs)>1.5)iss.push(['横にならぶ枠の高さがちがう',pth(p),g.m.map(i=>nm(ks[i])+':'+Math.round(rs[i].height)).join(' ')]);
     const xs=g.m.map(i=>rs[i]).sort((a,b)=>a.left-b.left);const gp=[];for(let j=1;j<xs.length;j++)gp.push(Math.round(xs[j].left-xs[j-1].right));if(gp.length>1&&Math.max(...gp)-Math.min(...gp)>2)iss.push(['横のすき間がばらばら',pth(p),gp.join(',')]);}
   if(cs(p).display==='grid'){const ws=rs.map(r=>r.width);if(Math.max(...ws)-Math.min(...ws)>1.5)iss.push(['ならびの幅がちがう',pth(p),[...new Set(ws.map(Math.round))].join(',')]);}
   const col=ks.map((k,i)=>[k,rs[i]]).sort((a,b)=>a[1].top-b[1].top);const vg=[];
   for(let j=1;j<col.length;j++){const a=col[j-1][1],b=col[j][1];if(b.top>=a.bottom-1)vg.push(Math.round(b.top-a.bottom));}
   const fw=col.filter(x=>x[1].width>W*0.6).map(x=>Math.round(x[1].width));if(fw.length>1&&Math.max(...fw)-Math.min(...fw)>1&&Math.max(...fw)-Math.min(...fw)<16)iss.push(['たてにならぶ枠の幅が少しちがう',pth(p),[...new Set(fw)].join(',')]);
   const ls=col.filter(x=>x[1].width>W*0.3).map(x=>Math.round(x[1].left));const lu=[...new Set(ls)];if(lu.length>1&&Math.max(...lu)-Math.min(...lu)<10)iss.push(['左のはしがそろわない',pth(p),lu.join(',')]);
   const uv=[...new Set(vg)];if(vg.length>1&&Math.max(...vg)-Math.min(...vg)>3&&rows.length>2)iss.push(['たてのすき間がばらばら',pth(p),vg.join(',')]);}
 for(const e of boxes){const p=e.parentElement;if(!p||p===document.body)continue;const r=e.getBoundingClientRect(),q=p.getBoundingClientRect(),c=cs(p);
   const l=r.left-q.left-parseFloat(c.borderLeftWidth),rr=q.right-parseFloat(c.borderRightWidth)-r.right;if(r.width>q.width*0.7&&l>=0&&rr>=0&&Math.abs(l-rr)>2.5)iss.push(['左右の余白がちがう',pth(e),Math.round(l)+'/'+Math.round(rr)]);}
 // 重なり
 for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];if(a.contains(b)||b.contains(a))continue;
   const p=cs(a).position,q=cs(b).position;const A=a.getBoundingClientRect(),B=b.getBoundingClientRect();const ox=Math.min(A.right,B.right)-Math.max(A.left,B.left),oy=Math.min(A.bottom,B.bottom)-Math.max(A.top,B.top);
   if(ox>2&&oy>2&&!(p==='fixed'&&q!=='fixed')&&!(q==='fixed'&&p!=='fixed'))iss.push(['枠が重なる',nm(a)+' × '+nm(b),Math.round(ox)+'x'+Math.round(oy)]);}
 // 画面をまたいでくらべる値
 const sty=boxes.map(e=>{const c=cs(e);return {k:nm(e),tag:e.tagName,w:Math.round(e.getBoundingClientRect().width),h:Math.round(e.getBoundingClientRect().height),bw:c.borderTopWidth,bc:c.borderTopColor,rad:c.borderTopLeftRadius,pad:c.paddingTop+' '+c.paddingLeft,fs:c.fontSize};});
 const scroll=[...document.querySelectorAll('body *')].filter(e=>vis(e)&&top(e)&&/(auto|scroll)/.test(cs(e).overflowY)&&e.scrollHeight>e.clientHeight+2).map(e=>nm(e)+' '+e.clientHeight+'/'+e.scrollHeight);
 return {iss,texts,sty,scroll,docH:document.documentElement.scrollHeight};}
"""

data = {}
order = []
cur = {'pg': None, 'n': 0}
_scan = Screens.scan


def scan(self, label):
    o = _scan(self, label)
    snap(self.pg, label)
    return o


def snap(pg, label):
    cur['n'] += 1
    key = '%02d %s' % (cur['n'], label)
    pg.wait_for_timeout(60)
    pg.evaluate("()=>document.fonts.ready.then(()=>0)")  # その画面の文字のフォントが読みこまれるのを待つ
    m = pg.evaluate(METRICS)
    data[key] = m
    order.append(key)
    if SHOT:
        pg.screenshot(path=os.path.join(OUT, '%02d.png' % cur['n']))


Screens.scan = scan


def play_shots(pg):
    """出撃中（ふつう・大型の敵）"""
    pg.evaluate(GO)
    pg.evaluate("""()=>{const T=window.__T;window.__seed(3);document.getElementById('overlay').hidden=true;const R=window.__go(1,'standard',['laser','gatling','shield','magnet']);
      document.getElementById('hangar').hidden=true;document.getElementById('sortie').hidden=false;R.pending=0;R.chestQ=0;
      for(let i=0;i<300;i++)T.update(1/60);T.draw();T.hud();}""")
    snap(pg, '出撃中')


def font_css():
    """FONTS=フォントの場所（@fontsource の press-start-2p と dotgothic16 の files）があれば、スマホと同じフォントで撮る"""
    import base64, glob, re
    d = os.environ.get('FONTS')
    if not d:
        return ''
    css = ''
    for f in glob.glob(os.path.join(d, '*', '400.css')):  # @fontsource の 400.css（unicode-range ごとの @font-face）を、data: のフォントにして使う
        base = os.path.dirname(f)
        for blk in re.findall(r'@font-face\s*\{[^}]*\}', open(f).read()):
            u = re.search(r"url\(\./(files/[^)]+\.woff2)\)", blk)
            if not u:
                continue
            data = base64.b64encode(open(os.path.join(base, u.group(1)), 'rb').read()).decode()
            css += re.sub(r'src:[^;]*;', "src:url(data:font/woff2;base64,%s) format('woff2');" % data, blk).replace('font-display: swap', 'font-display: block')
    return css


def main():
    pp = write_build(os.environ.get('SRC') or copy16.SRC, seed=True)  # SRC=前の版の index.html（git show で出したもの）で、直す前を撮れる
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = open_page(b, pp, W, H, [], [])
        css = font_css()
        if css:
            pg.context.add_init_script("document.addEventListener('DOMContentLoaded',()=>{const s=document.createElement('style');s.textContent=%s;document.head.appendChild(s);});" % json.dumps(css))
            pg.reload(); pg.wait_for_timeout(300); pg.evaluate("()=>document.fonts.ready.then(()=>document.fonts.size)")
        copy16.screens(pg)
        try:
            play_shots(pg)
        except Exception as e:
            print('出撃中のスクショ：', str(e)[:200])
        pg.close()
        b.close()
    json.dump({'W': W, 'H': H, 'order': order, 'data': data}, open(os.path.join(OUT, 'metrics-%dx%d.json' % (W, H)), 'w'), ensure_ascii=False)
    # まとめ
    L = ['幅%d・高さ%d・%d画面' % (W, H, len(order))]
    for k in order:
        m = data[k]
        seen = set()
        rows = []
        for i in m['iss']:
            s = ' '.join(str(x) for x in i)
            if s in seen:
                continue
            seen.add(s)
            rows.append(s)
        if m['scroll']:
            rows.append('スクロール ' + ' / '.join(m['scroll']))
        if m['docH'] > H + 1:
            rows.append('ページ全体が縦に長い %d' % m['docH'])
        if rows:
            L.append('■ ' + k)
            L += ['  ' + r for r in rows[:25]]
    # 画面をまたいだ種類
    from collections import Counter
    bc, rad, bw, fs = Counter(), Counter(), Counter(), Counter()
    for k in order:
        for s in data[k]['sty']:
            bc[s['bc'] + ' ' + s['bw']] += 1
            rad[s['rad']] += 1
            if s['tag'] == 'BUTTON':
                bw[(s['k'].split('.')[0].split('#')[0], s['h'])] += 1
        for t in data[k]['texts']:
            fs[t[2]] += 1
    L.append('■ わくの色と太さ ' + ', '.join('%s×%d' % x for x in bc.most_common(14)))
    L.append('■ 角の丸み ' + ', '.join('%s×%d' % x for x in rad.most_common(8)))
    L.append('■ ボタンの高さ ' + ', '.join('%s×%d' % (x[0][1], x[1]) for x in sorted(bw.items(), key=lambda x: -x[1])[:16]))
    L.append('■ 文字の大きさ ' + ', '.join('%gpx×%d' % x for x in sorted(fs.items())))
    open(os.path.join(OUT, 'report-%dx%d.txt' % (W, H)), 'w').write('\n'.join(L))
    print('\n'.join(L[:3]), '…', len(L), '行')


if __name__ == '__main__':
    main()
