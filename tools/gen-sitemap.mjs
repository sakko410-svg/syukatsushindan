// sitemap.xml と robots.txt を生成する。
//
//   make sitemap
//
// なぜ手書きしないか
// -----------------------------------------------------------------------
// 索引対象は index.html の TD に連動する（タイプが増減すれば t/*.html も増減
// する）。手書きの sitemap は「タイプを足したのに載せ忘れた」「消したのに
// 404 のURLを送り続けている」を必ず起こす。t/*.html と同じく TD を単一の
// 真実として読み、lint が生成物との差分を見る。
//
// なぜ <lastmod> を入れないか
// -----------------------------------------------------------------------
// ファイルごとの更新日を機械的に取る手段が、この構成には無い。
//   ・生成時刻を使う  → 中身が変わっていない日も更新扱いになり、値が嘘になる
//   ・git のコミット日を使う → CI の actions/checkout@v4 は既定で浅いクローン
//     なので、HEAD で触っていないファイルの日付が取れない。ローカルとCIで
//     生成結果が変わり、lint の「最新か」判定が壊れる
// Google は不正確な lastmod を無視する（正確な場合のみヒントとして使う）。
// 入れないほうが正しい。changefreq / priority も同様に読まれないので省く。
//
// 何を載せないか
// -----------------------------------------------------------------------
//   ・characters.html … 現役でない旧ページ（noindex 済み）。
//     robots.txt でも遮断しない。遮断するとクロールが止まり noindex が
//     読まれず、「URLだけ検索結果に残る」状態になるため。
//   ・images/ogp/*.png … og:image はページ側の meta から辿られる。
//   ・tools/ Makefile README.md … 公開ディレクトリに出てはいるが読み物では
//     ない。robots.txt 側で遮断する（.mjs や .txt には noindex を書けず、
//     GitHub Pages では HTTP ヘッダも足せないので robots.txt が唯一の手段）。
import fs from 'node:fs';
import path from 'node:path';
import { loadTypes, esc } from './type-data.mjs';

/* 公開ディレクトリに出てしまうが、検索結果に出したくないもの。
   実測（curl）で 200 を返すものだけを挙げている。.github/ は
   GitHub Pages が配信しないので不要。 */
export const DISALLOW = ['/tools/', '/Makefile', '/README.md'];

const sitemap = urls =>
  `<?xml version="1.0" encoding="UTF-8"?>\n`
  + `<!-- tools/gen-sitemap.mjs が生成する。直接編集しない（make sitemap） -->\n`
  + `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`
  + urls.map(u => `  <url><loc>${esc(u)}</loc></url>\n`).join('')
  + `</urlset>\n`;

const robots = SITE_BASE =>
  `# tools/gen-sitemap.mjs が生成する。直接編集しない（make sitemap）\n`
  + `#\n`
  + `# characters.html は意図的に遮断していない。遮断するとクロールが止まり、\n`
  + `# ページ内の <meta name="robots" content="noindex"> が読まれなくなる。\n`
  + `User-agent: *\n`
  + `Allow: /\n`
  + DISALLOW.map(p => `Disallow: ${p}\n`).join('')
  + `\n`
  + `Sitemap: ${SITE_BASE}sitemap.xml\n`;

/**
 * 索引対象URLと、生成した2ファイルを返す（ディスクには書かない）。
 * lint はこれを呼んで、置いてあるファイルと突き合わせる。
 */
export async function renderAll() {
  const { types, SITE_BASE } = await loadTypes();

  /* 順序は「入口 → タイプ16枚 → 法務」。sitemap に順位の意味は無いが、
     差分を読む人間のために固定する。 */
  const urls = [
    SITE_BASE,
    ...types.map(t => `${SITE_BASE}t/${t.code}.html`),
    `${SITE_BASE}privacy.html`,
  ];

  return {
    urls,
    SITE_BASE,
    files: [
      { file: 'sitemap.xml', text: sitemap(urls) },
      { file: 'robots.txt', text: robots(SITE_BASE) },
    ],
  };
}

/* 直接実行されたときだけ書き出す（lint から import されたときは書かない）。 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const { ROOT } = await loadTypes();
  const { files, urls } = await renderAll();
  for (const f of files) {
    fs.writeFileSync(path.join(ROOT, f.file), f.text);
    console.log(`  ${f.file.padEnd(14)} ${f.text.length}B`);
  }
  console.log(`\n[gen-sitemap] ${urls.length}URL`);
}
