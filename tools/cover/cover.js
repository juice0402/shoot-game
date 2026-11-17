// 表紙（ゲーム工房のパッケージ 800x1200）をゲームのドット絵で描く。window.__A にゲームの絵が出ている前提
async (arg) => {
  const A = window.__A;
  for (const [fam, b64, ur] of arg.fonts) {
    const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const f = new FontFace(fam, bin.buffer, ur ? { unicodeRange: ur } : {});
    await f.load(); document.fonts.add(f);
  }
  const rng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const GW = 200, GH = 300, K = 4;
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; };
  const W = s => s.img || s, cxOf = s => s.cx ?? Math.round((s.w || s.width) / 2), cyOf = s => s.cy ?? Math.round((s.h || s.height) / 2);
  const spr = (g, s, x, y) => g.drawImage(W(s), Math.round(x - cxOf(s)), Math.round(y - cyOf(s)));
  const px = (g, c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };

  function stars(g, r, n, y0 = 0, y1 = GH) {
    for (let i = 0; i < n; i++) {
      const x = r() * GW, y = y0 + r() * (y1 - y0), l = r();
      if (l > 0.96) { px(g, '#8c94d8', x - 1, y); px(g, '#8c94d8', x + 1, y); px(g, '#8c94d8', x, y - 1); px(g, '#8c94d8', x, y + 1); px(g, '#ffffff', x, y); }
      else px(g, l > 0.8 ? '#ffffff' : l > 0.5 ? '#8c94d8' : '#3a3f78', x, y);
    }
  }
  function boom(g, x, y, r0, r) {
    const n = 14;
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + r() * 0.3, d = r0 * (0.6 + r() * 0.6); px(g, i % 3 ? '#ff8a3c' : '#ffd23f', x + Math.cos(a) * d, y + Math.sin(a) * d, 2, 2); }
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, d = r0 * 0.45; px(g, '#fff2a8', x + Math.cos(a) * d - 1, y + Math.sin(a) * d - 1, 2, 2); }
    px(g, '#ffffff', x - 2, y - 2, 4, 4); px(g, '#fff2a8', x - 3, y - 1, 6, 2); px(g, '#fff2a8', x - 1, y - 3, 2, 6);
  }
  function ship(g, x, y, load, fl = 1) {
    const sp = A.SHIPSPR.standard, sl = A.SHIPS.standard.slots;
    g.drawImage(sp.fl[fl % sp.fl.length], x - sp.cx, y - sp.cy); g.drawImage(sp.img, x - sp.cx, y - sp.cy);
    load.forEach((v, i) => { if (!v) return; const m = A.MSPR[v[0]][v[1]]; g.drawImage(m.img, x + sl[i].x - m.cx, y + sl[i].y - m.cy); });
  }
  function emptySlot(g, x, y) { // 格納庫の「＋」の丸（点線）
    g.globalAlpha = 0.6; for (let yy = -8; yy <= 8; yy++) { const w = Math.round(Math.sqrt(64 - yy * yy)); px(g, '#05060f', x - w, y + yy, w * 2 + 1, 1); } g.globalAlpha = 1;
    for (let i = 0; i < 24; i++) { if (i % 3 === 2) continue; const a = i / 24 * Math.PI * 2; px(g, '#7fd0ff', x + Math.cos(a) * 9, y + Math.sin(a) * 9); }
    px(g, '#ffffff', x - 3, y, 7, 1); px(g, '#ffffff', x, y - 3, 1, 7);
  }

  // ---- 題名のロゴ（DotGothic16 の点をそのまま太くして、5段の色・ふち・厚み）----
  function mask(text, font, size, bold = true) { // DotGothic16 を 64px で描いて、4px ＝ 1点 として点の格子に戻す
    const Z = 64, Q = 4, [c, g] = mk(Z * text.length + 16, Z + 16);
    let best = null;
    for (let oy = 0; oy < 1; oy += 0.25) for (let ox = 0; ox < 1; ox += 0.25) {
      g.clearRect(0, 0, c.width, c.height); g.font = Z + 'px ' + font; g.textBaseline = 'top'; g.fillStyle = '#fff'; g.fillText(text, 4 + ox, 4 + oy);
      const dd = g.getImageData(0, 0, c.width, c.height).data; let bad = 0;
      for (let k = 3; k < dd.length; k += 4) if (dd[k] > 24 && dd[k] < 232) bad++;
      if (!best || bad < best.bad) best = { bad, dd };
    }
    const d = best.dd, A_ = (x, y) => d[(y * c.width + x) * 4 + 3];
    let fx = -1, fy = -1;
    for (let x = 0; x < c.width && fx < 0; x++) for (let y = 0; y < c.height; y++) if (A_(x, y) > 128) { fx = x % Q; break; }
    for (let y = 0; y < c.height && fy < 0; y++) for (let x = 0; x < c.width; x++) if (A_(x, y) > 128) { fy = y % Q; break; }
    let m = [];
    for (let y = fy + 2; y < c.height; y += Q) { const row = []; for (let x = fx + 2; x < c.width; x += Q) row.push(A_(x, y) > 128 ? 1 : 0); m.push(row); }
    // 太く：右どなりが空いていて、その先も空いているときだけ右へ1点（濁点のすき間はつぶさない）
    if (bold) m = m.map(row => row.map((v, x) => v || (x > 0 && row[x - 1] && !row[x + 1]) ? 1 : 0));
    let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1;
    m.forEach((row, y) => row.forEach((v, x) => { if (v) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } }));
    return m.slice(y0, y1 + 1).map(r => r.slice(x0, x1 + 1));
  }
  function logo(g, text, s, cx, top, pal) {
    const m = mask(text, 'DG', 16), h = m.length, w = m[0].length, ox = Math.round(cx - w * s / 2), oy = top;
    const at = (x, y) => y >= 0 && y < h && x >= 0 && x < w && m[y][x];
    const D = 2, o = Math.max(4, Math.round(s * 0.5));
    // ふち（厚みもふくめて）
    g.fillStyle = pal.edge;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (m[y][x]) g.fillRect(ox + x * s - o, oy + y * s - o, s + o * 2, s + o * 2 + D * s);
    // 厚み
    for (let d = D; d >= 1; d--) { g.fillStyle = d === D ? pal.deep : pal.side;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (m[y][x]) g.fillRect(ox + x * s, oy + (y + d) * s, s, s); }
    // 面（上から5段）
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!m[y][x]) continue;
      let c = pal.face[Math.min(4, Math.floor(y / h * 5))];
      if (!at(x, y - 1)) c = pal.hi; else if (!at(x, y + 1)) c = pal.lo;
      g.fillStyle = c; g.fillRect(ox + x * s, oy + y * s, s, s);
    }
    return oy + (h + D) * s + o;
  }
  function textPix(g, text, s, cx, top, col, sh) {
    const m = mask(text, 'DG', 16, false), h = m.length, w = m[0].length, ox = Math.round(cx - w * s / 2);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (m[y][x]) { g.fillStyle = sh; g.fillRect(ox + x * s, top + y * s + s, s, s); }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (m[y][x]) { g.fillStyle = col; g.fillRect(ox + x * s, top + y * s, s, s); }
    return [ox, ox + w * s, top + h * s];
  }
  const GOLD = { edge: '#12060a', deep: '#5a2206', side: '#a84c0c', hi: '#ffffff', lo: '#c4600e', face: ['#fffbe0', '#ffe873', '#ffd23f', '#f5a623', '#e8841a'] };
  const ICE = { edge: '#060a1c', deep: '#0f2c5a', side: '#1f5c9c', hi: '#ffffff', lo: '#3d8fd0', face: ['#f2fbff', '#bfe9ff', '#7fd0ff', '#4cb0f2', '#3a8ee0'] };

  function subtitle(g, y) {
    const [x0, x1] = textPix(g, 'シューティング × サバイバー', 3, 400, y, '#cfeaff', '#060a1c');
    for (const [a, b] of [[x0 - 44, x0 - 14], [x1 + 14, x1 + 44]]) { g.fillStyle = '#5aaedc'; g.fillRect(a, y + 14, b - a, 4); g.fillStyle = '#ffd23f'; g.fillRect(b - 8, y + 12, 8, 8); g.fillRect(a, y + 12, 8, 8); }
  }

  // ---- A：ぜんぶのせシップ（ぜんぶ積んで、群れに全部撃つ）----
  function coverA() {
    const r = rng(7), [c, g] = mk(GW, GH);
    g.fillStyle = '#05060f'; g.fillRect(0, 0, GW, GH); g.globalAlpha = 0.95; g.drawImage(A.NEB, 120, 420, GW, GH, 0, 0, GW, GH); g.globalAlpha = 1;
    stars(g, r, 150);
    const pl = A.PLANETS[0]; g.drawImage(pl, GW - pl.width + 22, 64);
    const sx = 100, sy = 222, sl = A.SHIPS.standard.slots;
    const load = [['laser', 0], ['missile', 7], ['missile', 1], ['gatling', 0], ['gatling', 0], ['shotgun', 0], ['shotgun', 0]];
    // 敵の群れ
    const foes = [];
    const E = ['bug', 'bug', 'bug', 'shooter', 'bug', 'tank', 'bug', 'bug', 'shooter', 'bug', 'bug', 'bug', 'bug'];
    const spots = [[30, 120], [62, 108], [138, 112], [170, 124], [18, 156], [52, 144], [148, 148], [184, 162], [68, 128], [134, 128], [36, 184], [166, 188], [100, 146]];
    spots.forEach(([x, y], i) => foes.push({ x: x + (r() - 0.5) * 6, y: y + (r() - 0.5) * 6, k: E[i] }));
    foes.forEach(f => spr(g, A.ESPR[f.k], f.x, f.y));
    // レーザー（機首から上へ・群れの真ん中の敵に当たる）
    const nx = sx + sl[0].x, ny = sy + sl[0].y - 8, hitY = 150;
    px(g, '#1f6c94', nx - 3, hitY, 7, ny - hitY); px(g, '#4cc9ff', nx - 2, hitY, 5, ny - hitY); px(g, '#ffffff', nx - 1, hitY, 3, ny - hitY);
    boom(g, nx, hitY, 9, r);
    // ガトリングの弾
    for (const s of [3, 4]) { const x = sx + sl[s].x, y0 = sy + sl[s].y - 10; for (let y = y0; y > 136; y -= 11) { px(g, '#7d9cff', x - 1, y, 2, 5); px(g, '#ffffff', x - 1, y, 2, 2); } }
    // ミサイル（肩から外へ曲がって敵へ）
    [[1, 30, 120], [2, 170, 124], [1, 52, 144], [2, 148, 148]].forEach(([s, tx, ty], k) => {
      const x0 = sx + sl[s].x, y0 = sy + sl[s].y, cx1 = x0 + (tx - x0) * 0.1 + (s === 1 ? -26 : 26), cy1 = y0 - 30;
      const P = t => [(1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx1 + t * t * tx, (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy1 + t * t * ty];
      const tEnd = k < 2 ? 1 : 0.78;
      for (let t = 0.12; t < tEnd - 0.06; t += 0.05) { const [x, y] = P(t); px(g, t < tEnd - 0.3 ? '#3a3f78' : '#8c94d8', x, y, 2, 2); }
      const [hx, hy] = P(tEnd); if (k < 2) boom(g, hx, hy, 8, r); else { px(g, '#ffd23f', hx - 1, hy - 1, 3, 3); px(g, '#ffffff', hx, hy - 2, 1, 2); px(g, '#ff8a3c', hx, hy + 2, 1, 2); }
    });
    // 散弾（尾から扇に）
    for (const s of [5, 6]) { const x = sx + sl[s].x, y = sy + sl[s].y - 10;
      for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k - 2) * 0.22, n = 3; for (let q = 1; q <= n; q++) { const d = 12 + q * 13; px(g, q === n ? '#ffffff' : '#e8c07a', x + Math.cos(a) * d - 1, y + Math.sin(a) * d - 1, 2, 2); } } }
    // 撃ち落とした所の宝石
    [[74, 172], [128, 170], [26, 206], [176, 210]].forEach(([x, y]) => spr(g, A.GEMS, x, y));
    ship(g, sx, sy, load);
    // 下を暗く（副題のため）・上も少し暗く（題名のため）
    for (let i = 0; i < 26; i++) { g.globalAlpha = i / 26 * 0.85; px(g, '#05060f', 0, GH - 26 + i, GW, 1); } g.globalAlpha = 1;
    for (let i = 0; i < 30; i++) { g.globalAlpha = (1 - i / 30) * 0.6; px(g, '#05060f', 0, i, GW, 1); } g.globalAlpha = 1;
    const [o, og] = mk(800, 1200); og.drawImage(c, 0, 0, 800, 1200);
    let y = logo(og, 'ぜんぶのせ', 8, 400, 56, GOLD);
    logo(og, 'シップ', 12, 400, y + 4, GOLD);
    subtitle(og, 1128);
    return o.toDataURL('image/png');
  }

  // ---- B：カスタムシップ（格納庫で組み立てる）----
  function coverB() {
    const r = rng(11), [c, g] = mk(GW, GH);
    g.fillStyle = '#070a1c'; g.fillRect(0, 0, GW, GH);
    // 壁のパネル
    for (let x = 0; x < GW; x += 25) { px(g, '#0e1336', x, 0, 1, 236); px(g, '#04050f', x + 1, 0, 1, 236); }
    for (const y of [70, 150]) { px(g, '#121842', 0, y, GW, 2); px(g, '#04050f', 0, y + 2, GW, 1); for (let x = 6; x < GW; x += 25) { px(g, '#2a3270', x, y - 3); px(g, '#2a3270', x + 13, y - 3); } }
    // 大きな窓（外は星の海）
    const wx = 10, wy = 84, ww = 180, wh = 58;
    px(g, '#1a2050', wx - 3, wy - 3, ww + 6, wh + 6); px(g, '#05060f', wx, wy, ww, wh);
    g.save(); g.beginPath(); g.rect(wx, wy, ww, wh); g.clip(); g.globalAlpha = 0.9; g.drawImage(A.NEB, 60, 120, ww, wh, wx, wy, ww, wh); g.globalAlpha = 1;
    stars(g, r, 60, wy, wy + wh); const pl = A.PLANETS[1] || A.PLANETS[0]; g.drawImage(pl, wx + ww - pl.width + 10, wy - 6); g.restore();
    for (let x = wx + 45; x < wx + ww; x += 45) { px(g, '#1a2050', x - 1, wy, 3, wh); }
    px(g, '#2e3a80', wx - 3, wy - 3, ww + 6, 1);
    // 天井の明かり
    for (const lx of [50, 150]) { px(g, '#ffe873', lx - 8, 30, 16, 2); px(g, '#fff6c0', lx - 6, 30, 12, 1);
      for (let i = 0; i < 40; i++) { g.globalAlpha = 0.05; px(g, '#ffe873', lx - 8 - i * 0.6, 32 + i, 16 + i * 1.2, 1); } g.globalAlpha = 1; }
    // 床としま模様
    px(g, '#0a0d26', 0, 236, GW, GH - 236);
    for (let x = -10; x < GW + 10; x += 8) for (let k = 0; k < 4; k++) { px(g, '#ffd23f', x + k, 232 + k, 4, 1); }
    px(g, '#1a1a1a', 0, 236, GW, 1);
    for (let y = 244; y < GH; y += 9) px(g, '#11153a', 0, y, GW, 1);
    // 台座
    const sx = 100, sy = 196;
    const ell = (cx, cy, rx, ry, col) => { for (let y = -ry; y <= ry; y++) { const w = Math.round(rx * Math.sqrt(1 - (y * y) / (ry * ry))); px(g, col, cx - w, cy + y, w * 2, 1); } };
    ell(sx, 252, 62, 12, '#05060f'); ell(sx, 248, 60, 11, '#1f2a66'); ell(sx, 247, 56, 9, '#14183e');
    for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2; if (i % 2) px(g, '#5aaedc', sx + Math.cos(a) * 56, 247 + Math.sin(a) * 9); }
    for (let i = 0; i < 26; i++) { g.globalAlpha = 0.06; px(g, '#5aaedc', sx - 40 + i * 0.4, 247 - i, 80 - i * 0.8, 1); } g.globalAlpha = 1;
    // 機体（はまった装備と、空いている所）
    const sl = A.SHIPS.standard.slots;
    const load = [['laser', 0], null, ['missile', 1], null, ['gatling', 0], ['shield', 5], ['shield', 3]];
    ship(g, sx, sy, load, 0);
    emptySlot(g, sx + sl[1].x, sy + sl[1].y); emptySlot(g, sx + sl[3].x, sy + sl[3].y);
    // 浮かんでいる装備と、はまる先への点線
    const fly = [['sword', 0, 28, 156, 1], ['cannon', 0, 26, 210, 3]];
    for (const [t, d, x, y, s] of fly) {
      const tx = sx + sl[s].x, ty = sy + sl[s].y, n = 8;
      for (let i = 2; i < n - 1; i++) { const k = i / n; px(g, '#ffd23f', x + (tx - x) * k, y + (ty - y) * k, 2, 2); }
      const m = A.MSPR[t][d]; g.globalAlpha = 0.5; g.drawImage(m.img, x - m.cx, y - m.cy + 2); g.globalAlpha = 1; g.drawImage(m.img, x - m.cx, y - m.cy);
      for (let i = 0; i < 4; i++) px(g, '#bfe9ff', x - 10 + i * 6, y + 14, 3, 1);
    }
    // 整備士の通信（右下）
    const fx = 154, fy = 176, F = A.MECH;
    px(g, '#2e3277', fx - 4, fy - 4, 48, 54); px(g, '#081a2c', fx - 2, fy - 2, 44, 50); px(g, '#1f6c94', fx - 2, fy - 2, 44, 1);
    g.drawImage(F.open || F.shut, fx, fy);
    for (let y = fy; y < fy + 46; y += 2) { g.globalAlpha = 0.25; px(g, '#000814', fx, y, 40, 1); } g.globalAlpha = 1;
    // 上を暗く（題名のため）
    for (let i = 0; i < 70; i++) { g.globalAlpha = (1 - i / 70) * 0.55; px(g, '#04050f', 0, i, GW, 1); } g.globalAlpha = 1;
    const [o, og] = mk(800, 1200); og.drawImage(c, 0, 0, 800, 1200);
    let y = logo(og, 'カスタム', 9, 400, 56, ICE);
    logo(og, 'シップ', 12, 400, y + 4, GOLD);
    subtitle(og, 1128);
    return o.toDataURL('image/png');
  }
  return { a: coverA(), b: coverB(), masks: { a: mask('ぜんぶのせ', 'DG', 16).map(r => r.join('')), b: mask('シップ', 'DG', 16).map(r => r.join('')) } };
}
