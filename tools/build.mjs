// index.html を src/ から作る（Node の標準だけ・#26）。
//   node tools/build.mjs          … index.html を作りなおす
//   node tools/build.mjs --check  … いまの index.html とビルドしたものが同じか（ちがえば 1 で終わる）
// つなぎ方：src/shell.html の「/*@@style.css@@*/」の行に src/style.css を、
// 「/*@@js@@*/」の行に JS を下の順にそのままつないで入れる（中身は1文字も変えない）。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'index.html');

// つなぐ順（変えると動きが変わる。足すときは docs/MAP.md も）
export const JS = [
  'data', 'art-ships', 'art-enemies', 'art-stage', 'save', 'sfx', 'bgm',
  'hangar', 'menus', 'sortie', 'weapons', 'gear', 'special', 'loop', 'levelup', 'shots', 'gamecenter', 'title',
];

const read = f => fs.readFileSync(path.join(SRC, f), 'utf8');

function put(text, mark, body) {
  const line = mark + '\n';
  const at = text.indexOf(line);
  if (at < 0 || text.indexOf(line, at + 1) >= 0) throw new Error(`shell.html に ${mark} の行が1つだけ必要`);
  return text.slice(0, at) + body + text.slice(at + line.length);
}

export function build() {
  let html = read('shell.html');
  html = put(html, '/*@@style.css@@*/', read('style.css'));
  html = put(html, '/*@@js@@*/', JS.map(n => read(`js/${n}.js`)).join(''));
  return html;
}

const html = build();
if (process.argv.includes('--check')) {
  const now = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  if (now !== html) {
    console.error('index.html が src/ とずれています。node tools/build.mjs で作りなおしてください');
    process.exit(1);
  }
  console.log('ok: index.html は src/ から作ったものと同じ');
} else {
  fs.writeFileSync(OUT, html);
  console.log(`index.html を作りました（${Buffer.byteLength(html)} バイト）`);
}
