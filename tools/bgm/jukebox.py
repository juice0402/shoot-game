"""音の一覧のページを作る（index.html の SFX・SONGS・BGM をそのまま使う）
- BGM：12曲を A（chip）・B（synth）の音色で聞きくらべ
- 効果音：画面・出撃・撃つ音（武器）・必殺技
使い方：python3 tools/bgm/jukebox.py 出力.html
"""
import os, re, sys, json

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
src = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()

sfx = src[src.index('const SFX=(()=>{'):src.index('/* ---------- BGM')]
bgm = src[src.index('const BGM_STYLE='):src.index('/* ---------- hangar ---------- */')]
names = lambda block: re.findall(r'^\s+([a-z_0-9]+):\(', block, re.M)
shot = names(sfx[sfx.index('const SHOT={'):sfx.index('const SHOT_GAP')])
snd = names(sfx[sfx.index('const SND={'):])
wname = dict(re.findall(r"^  ([a-z0-9]+):\{name:'([^']+)'", src, re.M))
wname.update(dict(re.findall(r"id:'([a-z0-9]+)',name:'([^']+)'", src)))
sname = {k: v for k, v in re.findall(r"^  ([a-z]+):\{[^\n]*?name:'([^']+)'", src[src.index('const SHIPS'):], re.M)}

LB = {'btn': 'ボタン', 'clank': '装備（ガチャン）', 'unclank': '外す', 'buy': '買う', 'unlock': '解放', 'pick': '強化をえらぶ',
      'swish': 'カードが入る', 'sheet': '板を出す', 'sheetx': '板をしまう', 'tick': 'かぞえ上げ', 'wipe': '画面の切りかえ',
      'launch': '出撃', 'start': 'スタート', 'comm': '通信が開く', 'talk': '通信の文字', 'reroll': 'えらび直し', 'chest': '宝箱',
      'hit': '命中', 'kill': 'たおす', 'boss': '大型の敵をたおす', 'xp': '経験値', 'coin': 'お金', 'lvup': 'レベルアップ',
      'hurt': '被弾', 'barrier': 'バリア', 'heal': '回復', 'evo': '進化', 'bossin': '大型の敵が来る', 'bossin2': '最終ボスが来る',
      'crack': '岩がこわれる', 'lzwarn': 'レーザーの壁の予告', 'lzfire': 'レーザーの壁', 'wind': '吹雪', 'warp': 'ワープ',
      'zap': '雷雲', 'star': '流れ星', 'gun': '支援砲撃', 'frost': '冷気', 'revive': '復活', 'ebar': '緊急バリア', 'evade': '回避',
      'shield': 'シールドで防ぐ', 'fsbreak': 'シールドがこわれる', 'tstop': '時間停止', 'dash': '突進', 'block': '盾で防ぐ',
      'split': '割れる', 'spsnipe': '精密射撃', 'clear': 'クリア（BGM OFF のとき）', 'over': '撃墜（BGM OFF のとき）',
      'ending': 'おわり（BGM OFF のとき）'}
UI = ['btn', 'clank', 'unclank', 'buy', 'unlock', 'pick', 'swish', 'sheet', 'sheetx', 'tick', 'wipe', 'launch', 'start', 'comm', 'talk', 'reroll', 'chest']
sp = [k for k in snd if k.startswith('sp_')]
run = [k for k in snd if k not in UI and k not in sp]
groups = [['画面', [[k, LB.get(k, k)] for k in UI if k in snd]],
          ['出撃', [[k, LB.get(k, k)] for k in run]],
          ['撃つ音（武器）', [['shot:' + k, wname.get(k, k)] for k in shot]],
          ['必殺技', [[k, sname.get(k[3:], k[3:])] for k in sp]]]
SONGS = [['title', 'タイトル'], ['hangar', '格納庫'], ['st1', 'ステージ1 星の海'], ['st2', 'ステージ2 小惑星帯'], ['st3', 'ステージ3 氷の星雲'],
         ['st4', 'ステージ4 機械要塞'], ['st5', 'ステージ5 深淵'], ['boss', '大型の敵'], ['final', '最終ボス'], ['clear', 'クリア'],
         ['over', '撃墜'], ['ending', 'おわり']]

html = """<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ぜんぶのせシップ 音の一覧</title>
<link href="https://fonts.googleapis.com/css2?family=DotGothic16&display=swap" rel="stylesheet">
<style>
:root{--bg:#060a1c;--panel:#0d1534;--line:#243a86;--hi:#6fa8ff;--text:#e8ecff;--sub:#93a0d4}
*{box-sizing:border-box}html,body{margin:0;background:var(--bg);color:var(--text)}
body{font-family:'DotGothic16',system-ui,sans-serif;-webkit-text-size-adjust:100%}
main{max-width:420px;margin:0 auto;padding:18px 14px 48px}
h1{font-size:20px;margin:4px 0;font-weight:normal}.lead{color:var(--sub);font-size:13px;margin:0 0 8px;line-height:1.6}
h2{font-size:15px;color:var(--sub);margin:24px 0 10px;font-weight:normal;border-bottom:2px solid var(--line);padding-bottom:6px}
button{font:inherit;color:var(--text);background:var(--panel);border:2px solid var(--line);border-radius:6px;padding:8px;font-size:14px;min-height:48px;width:100%;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
button:active{background:#16224c}button.on{border-color:var(--hi);color:#fff;background:#13214d}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.wide{grid-column:1/-1}
.sty{position:sticky;top:0;background:var(--bg);padding:8px 0;z-index:2}
.note{color:var(--sub);font-size:12px;line-height:1.7;margin-top:22px}
</style></head><body><main>
<h1>ぜんぶのせシップ 音の一覧</h1>
<p class="lead">ゲームに入っている曲と効果音。全部コードで作った音</p>
<div class="sty"><div class="grid"><button id="sa" class="on">A ピコピコ</button><button id="sb">B シンセ</button></div></div>
<h2>BGM</h2><div class="grid" id="songs"></div>
<div id="se"></div>
<p class="note">iPhone はマナーモードだと鳴らないことがある。<br>A・B は曲を鳴らしたまま切りかえられる。</p>
</main>
<script>
(()=>{
'use strict';
const save={};
""" + sfx + bgm + """
const SONGL=""" + json.dumps(SONGS, ensure_ascii=False) + """,GROUPS=""" + json.dumps(groups, ensure_ascii=False) + """;
const $=id=>document.getElementById(id),mk=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e;};
const sb=$('songs');let on=null;
SONGL.forEach(([k,n])=>{const b=mk('button',null,n);b.addEventListener('click',()=>{SFX.unlock();BGM.play(k);sb.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));});sb.appendChild(b);});
const st=mk('button','wide','止める');st.addEventListener('click',()=>{BGM.play(null);sb.querySelectorAll('button').forEach(x=>x.classList.remove('on'));});sb.appendChild(st);
GROUPS.forEach(([g,list])=>{$('se').appendChild(mk('h2',null,g));const d=mk('div','grid');list.forEach(([k,n])=>{const b=mk('button',null,n);
  b.addEventListener('click',()=>{SFX.unlock();setTimeout(()=>{if(k.startsWith('shot:'))SFX.shot(k.slice(5));else SFX.play(k,6);},30);});d.appendChild(b);});$('se').appendChild(d);});
const sty=v=>{SFX.unlock();BGM.setStyle(v);$('sa').classList.toggle('on',v==='chip');$('sb').classList.toggle('on',v==='synth');};
$('sa').addEventListener('click',()=>sty('chip'));$('sb').addEventListener('click',()=>sty('synth'));
document.addEventListener('pointerdown',()=>SFX.unlock(),{capture:true});
})();
</script></body></html>
"""
out = sys.argv[1] if len(sys.argv) > 1 else 'sound.html'
open(out, 'w', encoding='utf-8').write(html)
print(out, len(html), 'bytes', len(shot), 'shots', len(snd), 'sounds')
