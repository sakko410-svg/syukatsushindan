// og:image（1200x630）を生成する。default.png 1枚 ＋ タイプ別 16枚。
//
//   make ogp
//
// 版下は images/ogp/_default.source.html と images/ogp/_type.source.html。
// タイプ別は版下の {{...}} を index.html の TD から埋めた一時ファイルを撮る。
// 一時ファイルは撮り終えたら消す（公開ディレクトリに残さない）。
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { requireChrome, EXTRA_FLAGS } from './chrome-path.mjs';
import { loadTypes, esc } from './type-data.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const OGP = path.join(ROOT, 'images/ogp');
const CHROME = requireChrome('gen-ogp');

/** 版下1枚をヘッドレスChromeで撮る。 */
function shot(srcAbs, outAbs) {
  return new Promise((resolve, reject) => {
    const p = spawn(CHROME, [
      '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
      '--no-default-browser-check',
      // OGP は等倍で1200x630 ちょうどでなければならない（Twitter/Slack が
      // 2:1 前後を要求する）。Retina 機で撮ると 2400x1260 になるため固定する。
      '--force-device-scale-factor=1',
      // 版下は ../chars/*.webp を file:// で読む。これが無いと画像が空になる。
      '--allow-file-access-from-files',
      '--window-size=1200,630', '--virtual-time-budget=5000',
      `--screenshot=${outAbs}`, ...EXTRA_FLAGS, srcAbs,
    ], { stdio: 'ignore' });
    p.on('close', () => resolve());
    p.on('error', reject);
  });
}

/* PNG のヘッダから実寸を読む（IHDR は先頭16バイト目から幅・高さ各4バイト）。
   撮れていない・サイズが違うまま気づかず配るのを防ぐ。 */
function pngSize(file) {
  const b = fs.readFileSync(file);
  if (b.length < 24 || b.toString('ascii', 1, 4) !== 'PNG') return null;
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), bytes: b.length };
}

const { types } = await loadTypes();

/* --- 1. default.png（トップと、タイプが判らない共有のフォールバック） ---
   既定では作り直さない。PNG の出力は Chrome のバージョンやフォントの
   ラスタライズで1バイト単位では再現しない（同じ版下から撮り直したら
   266KB → 218KB になった。絵は同じ）。default.png は既に公開され、
   各SNSのキャッシュにも載っている。版下を意図的に変えたときだけ
   --with-default を付けて撮り直す。 */
if (process.argv.includes('--with-default')) {
  const defOut = path.join(OGP, 'default.png');
  await shot(path.join(OGP, '_default.source.html'), defOut);
  const s = pngSize(defOut);
  console.log(`  default.png            ${s.w}x${s.h}  ${(s.bytes / 1024).toFixed(0)}KB  ★撮り直した`);
  if (s.w !== 1200 || s.h !== 630) { console.error('[gen-ogp] default.png のサイズが不正'); process.exit(1); }
} else {
  const s = pngSize(path.join(OGP, 'default.png'));
  console.log(`  default.png            ${s.w}x${s.h}  ${(s.bytes / 1024).toFixed(0)}KB  （据え置き。撮り直すなら --with-default）`);
}

/* --- 2. タイプ別 16枚 --- */
const tpl = fs.readFileSync(path.join(OGP, '_type.source.html'), 'utf8');
let ng = 0;

for (const t of types) {
  /* 見出しの級数は名前の長さで決める。最長は10文字（ナチュラルケアリスト等）。
     58px 固定だと10文字で 580px となり .left の 660px から溢れないが、
     字間を詰めた見た目が窮屈になるので、9文字以上だけ一段落とす。 */
  const nameSize = t.name.length >= 9 ? 52 : 58;

  const html = tpl
    .replaceAll('{{CODE}}', esc(t.code))
    .replaceAll('{{NAME}}', esc(t.name))
    .replaceAll('{{NAME_SIZE}}', String(nameSize))
    .replaceAll('{{TAG}}', esc(t.tag))
    .replaceAll('{{CAT}}', t.cat)
    .replaceAll('{{CAT_LABEL}}', esc(`${t.code.slice(0, 2)}系 — ${t.label}`))
    .replaceAll('{{IMG}}', esc(t.img));

  if (html.includes('{{')) { console.error(`[gen-ogp] ${t.code}: 未置換の {{...}} が残っている`); process.exit(1); }

  // 一時ファイルは版下と同じディレクトリに置く（../chars/ の相対パスを保つため）。
  const tmp = path.join(OGP, `__tmp_${t.code}.html`);
  const out = path.join(OGP, `${t.code}.png`);
  fs.writeFileSync(tmp, html);
  try {
    await shot(tmp, out);
  } finally {
    fs.unlinkSync(tmp);
  }

  const s = fs.existsSync(out) && pngSize(out);
  if (!s || s.w !== 1200 || s.h !== 630) {
    console.error(`  NG ${t.code}.png  ${s ? `${s.w}x${s.h}` : '生成されなかった'}`);
    ng++;
  } else {
    console.log(`  ${(t.code + '.png').padEnd(23)}${s.w}x${s.h}  ${(s.bytes / 1024).toFixed(0)}KB  ${t.name}`);
  }
}

/* 16枚がすべて異なる画像であること。テンプレートの差し込みが効いていないと
   同じ絵が16枚できるが、サイズ検査だけでは通ってしまう。 */
{
  const seen = new Map();
  for (const t of types) {
    const b = fs.readFileSync(path.join(OGP, `${t.code}.png`));
    const key = b.length + ':' + b.subarray(0, 4096).toString('base64');
    if (seen.has(key)) { console.error(`  NG ${t.code}.png が ${seen.get(key)}.png と同一`); ng++; }
    seen.set(key, t.code);
  }
}

if (ng) { console.error(`\n[gen-ogp] FAIL: ${ng} 件`); process.exit(1); }
console.log(`\n[gen-ogp] PASS  default ＋ ${types.length}枚`);
