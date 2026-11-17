"""絵が変わっていないかの点検（11/17・PR #34）
使い方: python3 tools/test/same34.py 前の index.html [場面の名前 ...]
perf34 の場面を、前の index.html といまの index.html で同じ乱数のまま動かし、何フレームかごとに画面のドットをくらべる。
色の差が 8/255 をこえるドットが1つでもあれば NG（描く回数をへらすと、半とうめいの重なりの丸めで 1〜5/255 ずれる・目では分からない）
"""
import os, sys, base64
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import perf34 as P
from playwright.sync_api import sync_playwright

# 乱数を使う「あとで作る絵」（warmLazy）がはさまらないよう、準備から最後まで1回の evaluate で動かす
GRAB = r"""([setup,args,steps])=>{window.__seed(5);(0,eval)('('+setup+')')(args);const T=window.__T,out=[];
  for(const n of steps){for(let i=0;i<n;i++){window.__fill();T.update(1/60);T.draw();window.__keep();}
    const c=document.getElementById('game');const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
    let s='';const CH=0x8000;for(let i=0;i<d.length;i+=CH)s+=String.fromCharCode.apply(null,d.subarray(i,i+CH));out.push(btoa(s));}
  return out;}"""


def frames(b, src, args, steps):
    pg, cdp, errs = P.page(b, src, 1)
    out = [base64.b64decode(x) for x in pg.evaluate(GRAB, [P.SETUP, args, steps])]
    pg.context.close()
    return out, errs


def main():
    old = sys.argv[1]; names = sys.argv[2:]
    steps = [20, 20, 20, 20, 20, 20]
    bad = 0
    with sync_playwright() as p:
        b = p.chromium.launch()
        for nm, args in P.scenarios():
            if names and nm not in names:
                continue
            A, ea = frames(b, old, args, steps); B, eb = frames(b, P.SRC, args, steps)
            mx = 0; n1 = n3 = 0
            for x, y in zip(A, B):
                for i in range(0, len(x)):
                    d = abs(x[i] - y[i])
                    if d:
                        n1 += 1; mx = max(mx, d)
                        if d > 8:
                            n3 += 1
            ng = n3 > 0 or eb
            bad += 1 if ng else 0
            print('%s %-14s 6枚 色の差の最大 %d/255・差のある色 %d・8/255 をこえる %d%s' % ('NG' if ng else 'ok', nm, mx, n1, n3, (' ERR ' + eb[0]) if eb else ''))
        b.close()
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
