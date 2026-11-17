#!/usr/bin/env node
// BGM の楽譜データ（index.html の /* SONGS:BEGIN */〜/* SONGS:END */）を点検する。 使い方: node tools/bgm/check_songs.js [-v]
// -v で、強拍（1拍目・3拍目）で和音に入っていない音の場所も出す。
'use strict';
const fs = require('fs');
const path = require('path');

const VERBOSE = process.argv.includes('-v');
const FILE = path.join(__dirname, '..', '..', 'index.html');

const errors = [];
const warns = [];
const E = (k, m) => errors.push(`${k}: ${m}`);
const W = (k, m) => warns.push(`${k}: ${m}`);

function finish(lines) {
  if (lines) lines.forEach(l => console.log(l));
  if (warns.length) { console.log(`warnings (${warns.length}):`); warns.forEach(w => console.log('  ' + w)); }
  if (errors.length) {
    console.log(`ERRORS (${errors.length}):`);
    errors.forEach(e => console.log('  ' + e));
    process.exit(1);
  }
  console.log('OK');
  process.exit(0);
}

// ---------- 読みこみ ----------
let src;
try { src = fs.readFileSync(FILE, 'utf8'); } catch (e) { E('file', 'cannot read ' + FILE); finish(); }
{ const a = src.indexOf('/* SONGS:BEGIN */'), b = src.indexOf('/* SONGS:END */'); if (a < 0 || b < a) { E('file', 'SONGS markers not found'); finish(); } src = src.slice(a + 17, b); }
const code = src.replace(/\/\/[^\n]*/g, '').trim();
if (!/^const SONGS\s*=\s*\{/.test(code)) E('file', 'must start with "const SONGS={"');
if (!/\}\s*;$/.test(code)) E('file', 'must end with "};"');
if ((code.match(/;/g) || []).length !== 1) E('file', 'must be exactly one statement (one ";")');
if (/\b(export|import|require|function)\b|=>/.test(code)) E('file', 'only the SONGS object literal is allowed');
let SONGS;
try { SONGS = new Function(src + ';return SONGS;')(); } catch (e) { E('file', 'load failed: ' + e.message); finish(); }
if (!SONGS || typeof SONGS !== 'object') { E('file', 'SONGS is not an object'); finish(); }

// ---------- 決まり ----------
const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const NOTE = /^([A-G])([#b]?)(\d)$/;
const CHORD = /^([A-G])([#b]?)(m?)$/;
const NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const midiOf = t => {
  const m = NOTE.exec(t);
  return m ? 12 * (+m[3] + 1) + SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) : null;
};
const nameOf = n => NAMES[((n % 12) + 12) % 12] + (Math.floor(n / 12) - 1);
const C4 = 60, C6 = 84, G3 = 55, E5 = 76;

const BASS = ['oct', 'eighth', 'pulse', 'gallop', 'whole', 'half', 'walk'];
const ARP = ['up', 'updown', 'down', 'wide', 'off'];
const DRUMS = ['drive', 'four', 'half', 'march', 'boss', 'calm', 'none'];
const FIELDS = ['bpm', 'chords', 'lead', 'counter', 'bass', 'arp', 'arpOct', 'drums', 'fill', 'pad', 'loop', 'loopFrom', 'then', 'gain', 'shift'];

// 曲ごとの注文（bpm・小節数・ドラムなど）
const SPEC = {
  title:  { bpm: [132, 144], bars: [16, 20], drums: ['four', 'drive'], loopFrom: 2 },
  hangar: { bpm: [104, 116], bars: [16, 16], drums: ['calm'], arp: ['updown', 'off'], pad: true, major: true },
  st1:    { ref: true },
  st2:    { bpm: [156, 164], bars: [16, 16], drums: ['drive'], bass: ['gallop'], minor: true },
  st3:    { bpm: [128, 136], bars: [16, 16], drums: ['half'], arp: ['wide'], arpOct: 12, minor: true },
  st4:    { bpm: [140, 148], bars: [16, 16], drums: ['march'], bass: ['pulse', '*line'] },
  st5:    { bpm: [120, 132], bars: [16, 24], minor: true },
  boss:   { bpm: [166, 176], bars: [8, 16], drums: ['boss'] },
  final:  { bpm: [148, 156], bars: [16, 24] },
  clear:  { jingle: true, bars: [2, 3], drums: ['none', '*custom'] },
  over:   { jingle: true, bars: [2, 2], drums: ['none'] },
  ending: { bpm: [88, 100], bars: [16, 24], drums: ['calm'], pad: true },
};

// st1 は見本をそのまま写すこと
const ST1 = {
  bpm: 152, shift: { chip: -12, synth: -12 }, chords: 'Am F G Em Am F G E F G Am Am F G E E', bass: 'oct', arp: 'up', drums: 'drive',
  lead: 'E5 - - - A5 - - - G5 - E5 - D5 - E5 - C5 - - - F5 - - - E5 - C5 - A4 - C5 - D5 - - - G5 - - - F5 - D5 - B4 - D5 - ' +
    'E5 - - - - - - - B4 - - - E5 - G5 - A5 - - - G5 - E5 - C6 - - - B5 - A5 - A5 - - - G5 - F5 - E5 - - - C5 - D5 - ' +
    'D5 - E5 - F5 - G5 - B5 - - - A5 - G5 - G#5 - - - - - - - E5 - F5 - G#5 - B5 - C6 - - - A5 - - - F5 - - - A5 - C6 - ' +
    'D6 - - - B5 - - - G5 - - - B5 - D6 - E6 - - - - - - - D6 - C6 - B5 - C6 - A5 - - - - - - - - - - - E5 - A5 - ' +
    'C6 - - - B5 - A5 - G5 - A5 - - - F5 - G5 - - - A5 - B5 - D6 - - - C6 - B5 - B5 - - - - - - - G#5 - - - - - - - ' +
    'E5 - F5 - G#5 - A5 - B5 - C6 - D6 - E6 -',
};

function chordPcs(name) {
  const m = CHORD.exec(name);
  if (!m) return null;
  const r = SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  return [r, r + (m[3] ? 3 : 4), r + 7].map(x => ((x % 12) + 12) % 12);
}

// 1つの声部（lead / counter / 自作の bass）を読む。鳴っている音を16分ごとに返す。
function parseVoice(k, field, str, bars, opt) {
  if (typeof str !== 'string') { E(k, `${field} must be a string`); return null; }
  const lines = str.split('\n').map(s => s.trim()).filter(Boolean);
  lines.forEach((ln, i) => {
    const n = ln.split(/\s+/).length;
    if (n % 16) E(k, `${field} line ${i + 1} has ${n} tokens (bars need 16 each)`);
  });
  const toks = str.trim().split(/\s+/);
  if (toks.length !== bars * 16) E(k, `${field} has ${toks.length} tokens, need ${bars * 16} (${bars} bars x 16)`);
  const sound = [];
  let cur = null, prev = null, min = Infinity, max = -Infinity;
  toks.forEach((t, i) => {
    const pos = `bar ${Math.floor(i / 16) + 1} step ${(i % 16) + 1}`;
    if (t === '-') {
      if (i === 0) E(k, `${field} starts with "-" (nothing to hold)`);
      else if (prev === '.') E(k, `${field} ${pos}: "-" after a rest`);
    } else if (t === '.') {
      cur = null;
    } else {
      const m = midiOf(t);
      if (m === null) { E(k, `${field} ${pos}: bad token "${t}"`); cur = null; }
      else {
        if (/^(E#|B#|Cb|Fb)/.test(t)) W(k, `${field} ${pos}: "${t}" is easy to misread, prefer the plain name`);
        if (opt.octaves && !opt.octaves.includes(+t.slice(-1))) E(k, `${field} ${pos}: "${t}" octave must be ${opt.octaves.join('-')}`);
        cur = m + (opt.shift || 0);
        min = Math.min(min, cur); max = Math.max(max, cur);
      }
    }
    sound.push(cur);
    prev = t;
  });
  if (opt.range && min !== Infinity && (min < opt.range[0] || max > opt.range[1])) {
    E(k, `${field} range ${nameOf(min)}-${nameOf(max)} is outside ${nameOf(opt.range[0])}-${nameOf(opt.range[1])}`);
  }
  if (opt.loopFrom && toks[opt.loopFrom * 16] === '-') W(k, `${field} bar ${opt.loopFrom + 1} (loop start) begins with "-"`);
  return { sound, min, max };
}

// 強拍（1拍目と3拍目）の音が和音に入っているか
function strongBeatCheck(k, field, v, chords) {
  let n = 0;
  if (!v) return 0;
  chords.forEach((pcs, b) => {
    if (!pcs) return;
    [0, 8].forEach(s => {
      const note = v.sound[b * 16 + s];
      if (note != null && !pcs.includes(((note % 12) + 12) % 12)) {
        n++;
        if (VERBOSE) W(k, `${field} bar ${b + 1} beat ${s ? 3 : 1}: ${nameOf(note)} not in chord`);
      }
    });
  });
  return n;
}

// ---------- 点検 ----------
const out = [];
for (const k of Object.keys(SPEC)) if (!(k in SONGS)) E(k, 'song is missing');
for (const k of Object.keys(SONGS)) if (!(k in SPEC)) W(k, 'not in the song list');

for (const [k, s] of Object.entries(SONGS)) {
  const spec = SPEC[k] || {};
  if (!s || typeof s !== 'object') { E(k, 'must be an object'); continue; }
  for (const f of Object.keys(s)) if (!FIELDS.includes(f)) E(k, `unknown field "${f}"`);
  for (const f of ['bpm', 'chords', 'lead', 'drums']) if (!(f in s)) E(k, `missing ${f}`);

  // st1 は見本と同じか
  if (spec.ref) {
    const norm = x => String(x).trim().split(/\s+/).join(' ');
    const extra = Object.keys(s).filter(f => !(f in ST1));
    if (extra.length) E(k, `fields not in the reference: ${extra.join(',')}`);
    for (const f of Object.keys(ST1)) {
      const a = f === 'lead' || f === 'chords' ? norm(s[f]) : JSON.stringify(s[f]);
      const b = f === 'lead' || f === 'chords' ? norm(ST1[f]) : JSON.stringify(ST1[f]);
      if (a !== b) E(k, `${f} differs from the reference`);
    }
  }

  // bpm
  if (typeof s.bpm !== 'number' || !(s.bpm > 0)) E(k, 'bpm must be a positive number');
  else if (spec.bpm && (s.bpm < spec.bpm[0] || s.bpm > spec.bpm[1])) E(k, `bpm ${s.bpm} not in ${spec.bpm[0]}-${spec.bpm[1]}`);

  // chords
  const chordNames = typeof s.chords === 'string' ? s.chords.trim().split(/\s+/) : [];
  if (typeof s.chords !== 'string' || !chordNames.length) E(k, 'chords must be a non-empty string');
  const chords = chordNames.map(c => { const p = chordPcs(c); if (!p) E(k, `bad chord "${c}"`); return p; });
  const bars = chordNames.length;
  if (spec.bars && (bars < spec.bars[0] || bars > spec.bars[1])) E(k, `${bars} bars, need ${spec.bars[0]}-${spec.bars[1]}`);
  if (spec.minor && !/m$/.test(chordNames[0] || '')) E(k, 'should be in a minor key (first chord minor)');
  if (spec.major && /m$/.test(chordNames[0] || '')) E(k, 'should be major / mixolydian (first chord major)');

  // loop / jingle
  const loop = s.loop !== false;
  if ('loop' in s && typeof s.loop !== 'boolean') E(k, 'loop must be true/false');
  if (spec.jingle && loop) E(k, 'jingle must have loop:false');
  if (!spec.jingle && !spec.ref && !loop) E(k, 'must loop');
  if (!loop) {
    if (typeof s.then !== 'string' || !(s.then in SONGS)) E(k, `then "${s.then}" is not a song`);
    else if (SONGS[s.then].loop === false) E(k, `then "${s.then}" must be a looping song`);
    if (spec.jingle && s.then !== 'hangar') E(k, 'jingle must go to hangar');
    if ('loopFrom' in s) E(k, 'jingle cannot have loopFrom');
  } else if ('then' in s) E(k, 'then is only for jingles');
  let loopFrom = 0;
  if ('loopFrom' in s) {
    if (!Number.isInteger(s.loopFrom) || s.loopFrom < 0 || s.loopFrom >= bars) E(k, `loopFrom ${s.loopFrom} must be an integer 0-${bars - 1}`);
    else loopFrom = s.loopFrom;
  }
  if (spec.loopFrom !== undefined && loopFrom !== spec.loopFrom) E(k, `loopFrom must be ${spec.loopFrom}`);

  // shift
  let leadShift = 0;
  if ('shift' in s) {
    const sh = s.shift;
    if (!sh || typeof sh !== 'object') E(k, 'shift must be {chip, synth}');
    else {
      for (const f of Object.keys(sh)) {
        if (!['chip', 'synth'].includes(f)) E(k, `shift has unknown key "${f}"`);
        else if (!Number.isInteger(sh[f]) || Math.abs(sh[f]) > 24) E(k, `shift.${f} must be an integer -24..24`);
      }
      leadShift = Number.isInteger(sh.synth) ? sh.synth : 0;
    }
  }

  // lead / counter
  const lead = parseVoice(k, 'lead', s.lead, bars, { range: spec.ref ? null : [C4, C6], shift: leadShift, loopFrom });
  let counter = null;
  if ('counter' in s) counter = parseVoice(k, 'counter', s.counter, bars, { range: [G3, E5], loopFrom });
  const nct = strongBeatCheck(k, 'lead', lead, chords) + strongBeatCheck(k, 'counter', counter, chords);

  // bass
  if ('bass' in s) {
    if (typeof s.bass !== 'string') E(k, 'bass must be a string');
    else if (BASS.includes(s.bass)) { if (spec.bass && !spec.bass.includes(s.bass)) E(k, `bass should be ${spec.bass.join(' / ')}`); }
    else if (/\s/.test(s.bass.trim())) {
      if (spec.bass && !spec.bass.includes('*line')) E(k, `bass should be ${spec.bass.join(' / ')}`);
      parseVoice(k, 'bass', s.bass, bars, { octaves: [1, 2, 3], loopFrom });
    } else E(k, `unknown bass "${s.bass}"`);
  } else if (spec.bass) E(k, `bass should be ${spec.bass.filter(b => b[0] !== '*').join(' / ')}`);

  // arp
  if ('arp' in s && !ARP.includes(s.arp)) E(k, `unknown arp "${s.arp}"`);
  if (spec.arp && !spec.arp.includes(s.arp)) E(k, `arp should be ${spec.arp.join(' / ')}`);
  if ('arpOct' in s && ![-12, 0, 12].includes(s.arpOct)) E(k, 'arpOct must be -12, 0 or 12');
  if (spec.arpOct !== undefined && s.arpOct !== spec.arpOct) E(k, `arpOct should be ${spec.arpOct}`);

  // drums
  let drumName = s.drums;
  if (typeof s.drums === 'string') {
    if (!DRUMS.includes(s.drums)) E(k, `unknown drums "${s.drums}"`);
  } else if (s.drums && typeof s.drums === 'object') {
    drumName = '*custom';
    for (const f of Object.keys(s.drums)) if (!['k', 's', 'h'].includes(f)) E(k, `drums has unknown key "${f}"`);
    for (const f of ['k', 's', 'h']) {
      if (typeof s.drums[f] !== 'string' || !/^[xo.]{16}$/.test(s.drums[f])) E(k, `drums.${f} must be 16 chars of x o .`);
    }
  } else if ('drums' in s) E(k, 'drums must be a name or {k,s,h}');
  if (spec.drums && !spec.drums.includes(drumName)) E(k, `drums should be ${spec.drums.join(' / ')}`);

  // そのほか
  for (const f of ['fill', 'pad']) if (f in s && typeof s[f] !== 'boolean') E(k, `${f} must be true/false`);
  if (spec.pad && s.pad !== true) E(k, 'pad:true required');
  if ('gain' in s && (typeof s.gain !== 'number' || s.gain < 0.6 || s.gain > 1.2)) E(k, 'gain must be 0.6-1.2');

  // 長さ
  const barSec = 240 / (s.bpm || 120);
  const secs = (loop ? bars - loopFrom : bars) * barSec;
  if (loop && (secs < 20 || secs > 40.5)) W(k, `loop is ${secs.toFixed(1)}s (aim for 20-40s)`);

  const rng = v => (v && v.min !== Infinity ? `${nameOf(v.min)}-${nameOf(v.max)}` : '-');
  out.push(
    `${k.padEnd(7)} ${String(s.bpm).padStart(3)}bpm ${String(bars).padStart(2)} bars ` +
    `${(loop ? (loopFrom ? `loop ${loopFrom + 1}-${bars}` : 'loop') : 'once').padEnd(10)} ` +
    `${secs.toFixed(1).padStart(5)}s  lead ${rng(lead)}${leadShift ? ` (shift ${leadShift})` : ''}` +
    `${counter ? `  counter ${rng(counter)}` : ''}  off-chord strong beats: ${nct}`
  );
}

finish(out);
