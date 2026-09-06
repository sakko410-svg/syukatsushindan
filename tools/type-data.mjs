// index.html を単一の真実として読み、生成器が必要とする型データを取り出す。
//
// タイプ名・キャッチ・職種などは index.html のインラインJS（TD）にしか無い。
// 生成器ごとに書き写すと二重管理になり、片方だけ直された状態が必ず起きる。
// weighted-scoring-and-type-pages.md §生成の方針「入力は index.html を
// 単一の真実として読む」に従う。
import path from 'node:path';
import { load } from './dom-stub.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');

/* カテゴリ4色。index.html の :has(img[src*="chars/x"]) による注入
   （528〜534行 / 1077〜1079行 / 489〜491行）と同じ値を持つ。
   cat  … 面に使う色（カードの影・下端・コードの地）
   ink  … その色の上に濃い文字を置くときの色（現状 OGP では未使用） */
const CATS = {
  HA: { key: 'a', label: 'リーダー', cat: '#1a56db', ink: '#123c9b' },
  HB: { key: 'b', label: 'サポート', cat: '#1d6b4c', ink: '#14523a' },
  DA: { key: 'c', label: '推進',     cat: '#c8412e', ink: '#a4301f' },
  DB: { key: 'd', label: '分析',     cat: '#4b4483', ink: '#3d376c' },
};

/** index.html から TD / CODE_IMG / SITE_BASE を読み、16件の配列にして返す。 */
export async function loadTypes() {
  const w = await load('index.html');
  const TD = w.__eval('TD');
  const CODE_IMG = w.__eval('CODE_IMG');
  const SITE_BASE = w.__eval('SITE_BASE');

  const codes = Object.keys(TD);
  if (codes.length !== 16) throw new Error(`TD が16件ではない: ${codes.length}件`);

  const types = codes.map(code => {
    const cat = CATS[code.slice(0, 2)];
    if (!cat) throw new Error(`未知のカテゴリ: ${code}`);
    const img = CODE_IMG[code];
    if (!img) throw new Error(`CODE_IMG に ${code} が無い`);
    if (img[0] !== cat.key) {
      // 画像の接頭辞（a/b/c/d）はカテゴリ色の注入に使われている。ここがずれると
      // 一覧・結果画面・OGP で違う色になる。生成時に気づけるようにする。
      throw new Error(`${code} の画像 ${img} がカテゴリ ${cat.key} と一致しない`);
    }
    return { code, img, ...cat, ...TD[code] };
  });

  return { types, SITE_BASE, ROOT };
}

/** HTML に差し込む文字列のエスケープ。 */
export const esc = s => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
