// Game Center の実績バッジ（1024×1024・文字なし）をゲームのドット絵で描く（11/26）。window.__A にゲームの絵が出ている前提
// 128×128 の点で描いて 8 倍にする。まわりはメダル（点で色：10 銅・25 銀・50 金・100 虹）、まんなかの丸にゲームの絵
async (arg) => {
  const A = window.__A, G = 128, C = 64;
  const rng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const seed = id => { let h = 7; for (const ch of id) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h; };
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; };
  const W = s => s.img || s;
  const px = (g, c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
  // 絵を (x,y) を中心に k 倍で置く
  const put = (g, s, x, y, k = 1) => { const c = W(s), cx = s.cx ?? c.width / 2, cy = s.cy ?? c.height / 2; g.drawImage(c, Math.round(x - cx * k), Math.round(y - cy * k), c.width * k, c.height * k); };
  const hx = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  A.MCOL.bronze = ['#2e1406', '#6a3412', '#a8622a', '#dc9a5e', '#ffd8b0'].map(hx); A.MRAD.bronze = 2.5;

  // ---- 表紙（tools/cover/cover.js）と同じ星・爆発・機体 ----
  function stars(g, r, n) {
    for (let i = 0; i < n; i++) {
      const x = r() * G, y = r() * G, l = r();
      if (l > 0.95) { px(g, '#8c94d8', x - 1, y); px(g, '#8c94d8', x + 1, y); px(g, '#8c94d8', x, y - 1); px(g, '#8c94d8', x, y + 1); px(g, '#ffffff', x, y); }
      else px(g, l > 0.78 ? '#ffffff' : l > 0.48 ? '#8c94d8' : '#3a3f78', x, y);
    }
  }
  function boom(g, x, y, r0, r) {
    const n = 14;
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + r() * 0.3, d = r0 * (0.6 + r() * 0.6); px(g, i % 3 ? '#ff8a3c' : '#ffd23f', x + Math.cos(a) * d, y + Math.sin(a) * d, 2, 2); }
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, d = r0 * 0.45; px(g, '#fff2a8', x + Math.cos(a) * d - 1, y + Math.sin(a) * d - 1, 2, 2); }
    px(g, '#ffffff', x - 2, y - 2, 4, 4); px(g, '#fff2a8', x - 3, y - 1, 6, 2); px(g, '#fff2a8', x - 1, y - 3, 2, 6);
  }
  function ship(g, id, x, y, load = [], fl = 1) {
    const sp = A.SHIPSPR[id], sl = A.SHIPS[id].slots;
    g.drawImage(sp.fl[fl % sp.fl.length], x - sp.cx, y - sp.cy); g.drawImage(sp.img, x - sp.cx, y - sp.cy);
    load.forEach((v, i) => { if (!v) return; const m = A.MSPR[v[0]][v[1]]; g.drawImage(m.img, x + sl[i].x - m.cx, y + sl[i].y - m.cy); });
  }
  // うしろの機体：暗くして奥に
  function shipBack(g, id, x, y, dark = 0.45) {
    const [c, cg] = mk(G, G); ship(cg, id, x, y);
    cg.globalCompositeOperation = 'source-atop'; cg.globalAlpha = dark; cg.fillStyle = '#05060f'; cg.fillRect(0, 0, G, G);
    g.drawImage(c, 0, 0);
  }
  function twinkle(g, x, y, s = 2, col = '#ffd23f') { // 4つの光（金）
    for (let i = 1; i <= s; i++) { const c = i === s ? '#a06a0a' : col; px(g, c, x - i, y); px(g, c, x + i, y); px(g, c, x, y - i); px(g, c, x, y + i); }
    px(g, '#ffffff', x, y);
  }
  function plus(g, x, y, col) { px(g, '#06331f', x - 3, y - 1, 7, 3); px(g, '#06331f', x - 1, y - 3, 3, 7); px(g, col, x - 2, y, 5, 1); px(g, col, x, y - 2, 1, 5); }
  function laser(g, x, y0, y1) { px(g, '#1f6c94', x - 3, y1, 7, y0 - y1); px(g, '#4cc9ff', x - 2, y1, 5, y0 - y1); px(g, '#ffffff', x - 1, y1, 3, y0 - y1); }
  const LOAD = [['laser', 0], ['missile', 7], ['missile', 1], ['gatling', 0], ['gatling', 0], ['shotgun', 0], ['shotgun', 0]]; // 表紙と同じ

  // ---- まんなかの場面（中心 64,64・見える丸は半径 49）----
  const SCENE = {
    shoot_clear1(g, r) { // スタンダード機がレーザーを撃つ
      laser(g, 64, 40, 8); boom(g, 64, 18, 7, r);
      [[30, 46], [98, 58], [36, 86]].forEach(([x, y]) => put(g, A.MISC.gem, x, y));
      ship(g, 'standard', 64, 76, [['laser', 0]]);
    },
    shoot_boss1(g, r) { // 大型の敵（ステージ1）に爆発
      put(g, A.ESPR.boss, 64, 58);
      boom(g, 40, 50, 10, r); boom(g, 86, 70, 9, r); boom(g, 62, 86, 11, r);
    },
    shoot_evo1(g, r) { // 進化したレーザー
      put(g, A.MSPRE.laser[0], 64, 62, 3);
      [[28, 36, 3], [100, 42, 2], [98, 92, 3], [30, 90, 2], [64, 20, 2]].forEach(([x, y, s]) => twinkle(g, x, y, s));
    },
    shoot_wmax(g, r) { // レーザーと8つの印（レベル8）
      put(g, A.MSPR.laser[0], 64, 54, 3);
      for (let i = 0; i < 8; i++) { const a = Math.PI * (0.78 - i / 7 * 0.56), x = Math.round(64 + Math.cos(a) * 42), y = Math.round(56 + Math.sin(a) * 42); px(g, '#a06a0a', x - 2, y - 1, 5, 3); px(g, '#a06a0a', x - 1, y - 2, 3, 5); px(g, '#ffd84a', x - 1, y - 1, 3, 3); px(g, '#fff6c0', x - 1, y - 1); }
    },
    shoot_ship3(g, r) { // 3機
      shipBack(g, 'rapid', 30, 70); shipBack(g, 'fortress', 98, 70);
      ship(g, 'standard', 64, 64);
    },
    shoot_lab10(g, r) { // 研究所の整備士（サラ）
      put(g, A.MECH.shut, 64, 70, 2);
    },
    shoot_kill1k(g, r) { // 敵の群れを撃ち落とす
      const sp = [[34, 34], [62, 26], [92, 36], [26, 62], [100, 66], [44, 92], [84, 96], [64, 64]];
      sp.forEach(([x, y], i) => { if (i % 3 === 1) boom(g, x, y, 9, r); else put(g, A.ESPR.bug, x, y); });
      [[50, 48], [80, 80], [70, 44]].forEach(([x, y]) => put(g, A.MISC.gem, x, y));
    },
    shoot_half(g, r) { // 修理の装備
      put(g, A.MSPR.repair[0], 64, 64, 3);
      [[32, 40], [96, 46], [38, 92], [92, 90]].forEach(([x, y]) => plus(g, x, y, '#5dffb0'));
    },
    shoot_clear10(g, r) { // 全部のせた機体と10の光
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i / 10 * Math.PI * 2; twinkle(g, Math.round(64 + Math.cos(a) * 42), Math.round(66 + Math.sin(a) * 42), i % 2 ? 2 : 3); }
      ship(g, 'standard', 64, 66, LOAD);
    },
    shoot_run1k(g, r) { // 下から群れへ撃ちまくる
      const foes = [[30, 30, 'bug'], [52, 22, 'shooter'], [78, 24, 'bug'], [100, 34, 'bug'], [40, 46, 'bug'], [88, 48, 'tank'], [64, 40, 'bug']];
      foes.forEach(([x, y, k]) => put(g, A.ESPR[k], x, y));
      laser(g, 64, 66, 44); boom(g, 64, 42, 9, r);
      for (const x of [49, 79]) for (let y = 70; y > 30; y -= 11) { px(g, '#7d9cff', x - 1, y, 2, 5); px(g, '#ffffff', x - 1, y, 2, 2); }
      boom(g, 40, 46, 8, r); boom(g, 88, 48, 8, r);
      ship(g, 'standard', 64, 100, LOAD);
    },
    shoot_nodmg(g, r) { // 重装甲と、はね返る敵の弾
      for (let i = 0; i < 48; i++) { if (i % 6 === 5) continue; const a = i / 48 * Math.PI * 2; px(g, i % 2 ? '#5cffef' : '#18b0b4', 64 + Math.cos(a) * 39 - 1, 64 + Math.sin(a) * 39 - 1, 2, 2); }
      put(g, A.MSPR.harmor[0], 64, 64, 3);
      [[34, 34, -1, -1], [94, 34, 1, -1], [34, 94, -1, 1], [94, 94, 1, 1]].forEach(([x, y, sx, sy]) => {
        px(g, '#d0349a', x - 2, y - 2, 5, 5); px(g, '#ff6ccc', x - 1, y - 1, 3, 3); px(g, '#ffffff', x, y);
        px(g, '#fff2a8', x - sx * 6, y - sy * 6); px(g, '#fff2a8', x - sx * 8, y - sy * 4); px(g, '#fff2a8', x - sx * 4, y - sy * 8); });
    },
    shoot_fast(g, r) { // 長い炎と速さの線
      for (const [x, y, h] of [[24, 30, 30], [36, 60, 40], [100, 24, 36], [90, 70, 34], [30, 96, 20], [104, 86, 22], [64, 104, 16]]) { px(g, '#3a3f78', x, y, 1, h); px(g, '#8c94d8', x, y, 1, Math.round(h * 0.4)); }
      const sp = A.SHIPSPR.standard;
      for (const dy of [22, 14, 7]) g.drawImage(sp.fl[(dy / 7 | 0) % sp.fl.length], 64 - sp.cx, 58 + dy - sp.cy);
      ship(g, 'standard', 64, 58, [['booster', 0], null, null, null, null, ['booster', 0], ['booster', 0]], 0);
    },
    shoot_kill10k(g, r) { // 大きな爆発と群れ
      const sp = [[26, 40, 'bug'], [100, 30, 'shooter'], [30, 96, 'tank'], [102, 94, 'bug'], [64, 22, 'bug'], [64, 106, 'bug']];
      sp.forEach(([x, y, k]) => put(g, A.ESPR[k], x, y));
      [[44, 42, 10], [86, 46, 11], [42, 84, 11], [88, 86, 10], [64, 64, 18], [64, 64, 9]].forEach(([x, y, s]) => boom(g, x, y, s, r));
      [[54, 30], [78, 96], [30, 66], [98, 64]].forEach(([x, y]) => put(g, A.MISC.gemb, x, y));
    },
    shoot_stage5(g, r) { // 深淵の核（隠し実績）
      g.fillStyle = '#18040f'; g.globalAlpha = 0.55; g.fillRect(0, 0, G, G); g.globalAlpha = 1;
      put(g, A.ESPR.core, 64, 64);
    },
    shoot_shipall(g, r) { // 機体がずらり（オメガは出さない）
      shipBack(g, 'bomber', 20, 76, 0.55); shipBack(g, 'carrier', 108, 76, 0.55);
      shipBack(g, 'rapid', 42, 70, 0.3); shipBack(g, 'fortress', 86, 70, 0.3);
      ship(g, 'standard', 64, 62);
    },
  };

  // ---- メダル（ゲームの paint：ふちからの高さ・左上の光・1色5段・ふち取り）----
  const M = 61.5, R1 = 61, R2 = 52, R3 = 49; // paint の中の座標（キャンバスの 64 ＝ 61.5 ＋ 2.5）
  const ringP = (g, a, b, a0 = 0, a1 = Math.PI * 2) => { g.beginPath(); g.arc(M, M, a, a0, a1); g.arc(M, M, b, a1, a0, true); g.closePath(); g.fill(); };
  function medal(tier) {
    const parts = [];
    if (tier === 'rainbow') {
      ['red', 'orangeA', 'gold', 'lime', 'green', 'teal', 'blue', 'purple'].forEach((m, i) => { const a0 = -Math.PI / 2 - Math.PI / 8 + i * Math.PI / 4; parts.push({ m, r: 3.5, f: g => ringP(g, R1, R2, a0, a0 + Math.PI / 4) }); });
      parts.push({ m: 'pearl', r: 1.2, b: -0.2, f: g => ringP(g, R2, R3) });
    } else {
      parts.push({ m: tier, r: 3.5, f: g => ringP(g, R1, R2) });
      parts.push({ m: tier, r: 1.2, b: -0.25, f: g => ringP(g, R2, R3) });
    }
    const rv = tier === 'rainbow' ? 'pearl' : tier;
    for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + i * Math.PI / 4, x = M + Math.cos(a) * 56.5, y = M + Math.sin(a) * 56.5; parts.push({ m: rv, r: 1.2, b: 0.15, f: g => { g.beginPath(); g.arc(x, y, 1.9, 0, Math.PI * 2); g.fill(); } }); }
    return A.paint(124, 124, parts, {});
  }
  const TIER = { 10: 'bronze', 25: 'pearl', 50: 'gold', 100: 'rainbow' };

  function badge(id, points) {
    const r = rng(seed(id)), [bg, b] = mk(G, G);
    b.fillStyle = '#05060f'; b.fillRect(0, 0, G, G); stars(b, r, 40);
    const [sc, g] = mk(G, G);
    g.fillStyle = '#05060f'; g.fillRect(0, 0, G, G);
    const nx = Math.floor(r() * (A.NEB.width - G)), ny = Math.floor(r() * (A.NEB.height - G));
    g.globalAlpha = 0.95; g.drawImage(A.NEB, nx, ny, G, G, 0, 0, G, G); g.globalAlpha = 1;
    stars(g, r, 70);
    SCENE[id](g, r);
    // 丸の外は消して、外の星の上に重ねる
    const d = g.getImageData(0, 0, G, G), D = d.data;
    for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) { const dx = x + 0.5 - C, dy = y + 0.5 - C; if (dx * dx + dy * dy > 49.5 * 49.5) D[(y * G + x) * 4 + 3] = 0; }
    g.putImageData(d, 0, 0); b.drawImage(sc, 0, 0);
    b.drawImage(medal(TIER[points]).img, 0, 0);
    const [o, og] = mk(1024, 1024); og.drawImage(bg, 0, 0, 1024, 1024);
    return o.toDataURL('image/png');
  }
  const out = {}, miss = [];
  for (const [id, points] of arg.list) { if (!SCENE[id] || !TIER[points]) { miss.push(id); continue; } out[id] = badge(id, points); }
  return { out, miss };
}
