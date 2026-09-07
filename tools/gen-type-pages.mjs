// t/<CODE>.html 16枚を生成する。
//
//   make types
//
// これはシェアされたURLの着地先であり、og:image 16枚の置き場所である。
//
// なぜ中継ページ（r/<CODE>.html）ではないか
// -----------------------------------------------------------------------
// agent-referral-funnel.md は「即 location.replace する薄い中継」を予定して
// いたが、weighted-scoring-and-type-pages.md §D がそれを却下している。
// 中継は検索エンジンにとって中身がゼロで、OGP は中身のあるページからでも
// 同じように出せる。両方は作らない（重複コンテンツになる）。
//
// 何を載せないか（funnel §3 / §D の禁止事項）
// -----------------------------------------------------------------------
//   ・送客リンク（#agent-primary / .ab-link）を1つも置かない。
//     このページは「診断前」であり、診断前の送客は funnel §3 が排除した。
//   ・4軸スコアの棒グラフ・判定理由。診断していない人のスコアは存在しない。
//   ・ニックネーム（diagnosis-experience-revamp.md D-2 ②）。
//
// 現時点で載せていないが、仕様にはあるもの
// -----------------------------------------------------------------------
//   ・就活あるある（§E の TD[].aru 48行）… まだ書かれていない
//   ・4軸解説 axes/*.html へのリンク    … まだ作られていない
//   どちらも後から足す。生成器はテンプレートを直して make types で足りる。
//
// 見出しから「の例」を外した理由（workplace-fit.md §5-3 / I-5）
// -----------------------------------------------------------------------
//   旧「力を発揮しやすい仕事の例」は、「〜しやすい」で既に断定を避けている
//   のに、名詞側にも「例」を足していた。ヘッジが二重になっている。
//   弱めるのは動詞側だけで行う。直下の .note「職種は例示です。〜」は残す
//   （断定していない文への注記であり、二重になっていない）。
//   ★この説明を HTML コメントで書くと16ページに出荷されてしまう。
//     生成器の判断は生成器側（ここ）に書くこと。
import fs from 'node:fs';
import path from 'node:path';
import { loadTypes, esc } from './type-data.mjs';

/* tools/lint.mjs もここから renderPage を読み、生成物が最新かを検査する
   （weighted-scoring-and-type-pages.md §生成の方針）。テンプレートを直して
   make types を忘れた状態を、機械が見つけられるようにするため。 */
export const OUT_DIR = 't';

let _byCode = null;

/* 相性の相手はカード1枚ぶんの情報しか出さない。診断していない人に
   「あなたと誰の相性が良いか」は言えないので、見出しも「相性がよい組み合わせ」
   （タイプ同士の話）にする。「あなたと相性がよい」にはしない。 */
const miniCard = code => {
  const o = _byCode[code];
  if (!o) return '';
  return `<a class="mini" href="${esc(o.code)}.html">`
       + `<img src="../images/chars/sm/${esc(o.img)}.webp" alt="" loading="lazy" width="56" height="84">`
       + `<span class="mini-t"><b style="color:${o.cat}">${esc(o.code)}</b>${esc(o.name)}</span></a>`;
};

const page = (t, SITE_BASE) => {
  const url = `${SITE_BASE}t/${t.code}.html`;
  /* og:title は受け手に向けて書く（funnel #19）。送り手のニックネームは入れない。
     「あなたは○○です」にしない — 受け手はまだ診断していない。 */
  const ogTitle = `「${t.name}」タイプって、どんな人？ — 就活キャリアタイプ診断`;
  const title   = `${t.name}（${t.code}） | 就活キャリアタイプ診断 16Types`;

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '就活キャリアタイプ診断', item: SITE_BASE },
      { '@type': 'ListItem', position: 2, name: `${t.name}（${t.code}）`, item: url },
    ],
  };

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<!-- このファイルは tools/gen-type-pages.mjs が生成している。直接編集しないこと。
     文言は index.html の TD["${t.code}"] にある。直したら make types で作り直す。 -->
<meta name="description" content="${esc(t.desc)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="就活キャリアタイプ診断">
<meta property="og:locale" content="ja_JP">
<meta property="og:title" content="${esc(ogTitle)}">
<meta property="og:description" content="${esc(t.desc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(SITE_BASE)}images/ogp/${esc(t.code)}.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(`${t.name}（${t.code}）— 就活キャリアタイプ診断`)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(ogTitle)}">
<meta name="twitter:description" content="${esc(t.desc)}">
<meta name="twitter:image" content="${esc(SITE_BASE)}images/ogp/${esc(t.code)}.png">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo+Narrow:wght@600;700&family=Noto+Sans+JP:wght@400;500;700&family=Zen+Kaku+Gothic+New:wght@700;900&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
:root{
  --paper:#f2ece0;--paper2:#e7dfcd;--ink-field:#132043;--navy:#111a30;
  --ink:#1e293b;--mid:#5f5a52;--border:#d5cbb6;--must:#cf9a24;--verm:#c8412e;
  --cat:${t.cat};--cat-ink:${t.ink};
  --jp-disp:'Zen Kaku Gothic New','Hiragino Sans',sans-serif;
  --lat:'Archivo Narrow','Helvetica Neue',Arial,sans-serif;
}
html,body{background:var(--ink-field);color:var(--ink);
  font-family:'Noto Sans JP','Hiragino Sans',sans-serif;line-height:1.85;
  -webkit-text-size-adjust:100%;}
img{max-width:100%;display:block;}
a{color:var(--cat-ink);}
.wrap{max-width:480px;margin:0 auto;padding:0 16px;}
/* --- ヘッダ（index.html と同じ見え方にする） --- */
.hdr{position:sticky;top:0;z-index:40;background:var(--paper);
  border-bottom:2px solid var(--navy);}
.hdr-in{max-width:480px;margin:0 auto;padding:13px 16px;display:flex;
  align-items:center;justify-content:space-between;gap:12px;}
.logo{font-family:var(--lat);font-weight:700;font-size:1.02rem;letter-spacing:2px;
  color:var(--navy);text-decoration:none;display:flex;align-items:center;gap:7px;}
.logo i{width:11px;height:11px;background:var(--verm);display:block;}
.logo span{color:#1a56db;}
.hdr-cta{font-size:.76rem;font-weight:700;color:var(--navy);text-decoration:none;
  border:2px solid var(--navy);border-radius:4px;padding:6px 11px;
  background:var(--must);box-shadow:2px 2px 0 var(--navy);white-space:nowrap;}
/* --- ヒーロー（暗い面。index.html の .result-hero と同じ役割） --- */
.hero{background:var(--ink-field);padding:34px 0 30px;position:relative;overflow:hidden;}
.hero::before{content:'';position:absolute;inset:0;pointer-events:none;
  background-image:repeating-conic-gradient(from 0deg at 50% 34%,
    rgba(255,255,255,.055) 0deg 1.05deg,transparent 1.05deg 3.6deg);}
.hero::after{content:'';position:absolute;left:0;right:0;bottom:0;height:7px;
  background:linear-gradient(90deg,#1a56db 0 25%,#1d6b4c 25% 50%,#c8412e 50% 75%,#4b4483 75% 100%);}
.hero .wrap{position:relative;z-index:1;text-align:center;}
.crumb{font-size:.72rem;color:#8792a8;margin-bottom:14px;}
.crumb a{color:#c3cbdd;}
.pill{display:inline-block;font-family:var(--lat);font-size:.72rem;font-weight:700;
  letter-spacing:2px;color:var(--navy);background:var(--cat);
  border:2px solid var(--navy);border-radius:3px;padding:4px 11px;
  box-shadow:2px 2px 0 rgba(0,0,0,.4);margin-bottom:12px;}
.face{width:186px;height:279px;margin:0 auto 16px;background:#f7f6f3;
  border:3px solid var(--navy);border-radius:8px;overflow:hidden;
  box-shadow:8px 8px 0 var(--cat);}
.face img{width:100%;height:100%;object-fit:cover;object-position:50% 4%;}
.code{font-family:var(--lat);font-weight:700;font-size:1.5rem;letter-spacing:3px;
  color:var(--cat);line-height:1;}
h1{font-family:var(--jp-disp);font-weight:900;font-size:1.72rem;line-height:1.3;
  color:var(--paper);margin:8px 0 10px;letter-spacing:-.02em;}
.tag{font-size:.94rem;color:#c3cbdd;font-weight:500;}
/* --- 本文（読む面） --- */
main{background:var(--paper2);padding:28px 0 40px;}
.card{background:var(--paper);border:2px solid var(--navy);border-radius:10px;
  padding:18px 18px 20px;margin-bottom:14px;box-shadow:4px 4px 0 rgba(15,23,42,.18);}
.card h2{font-family:var(--jp-disp);font-size:1.02rem;font-weight:900;color:var(--navy);
  margin-bottom:9px;padding-bottom:7px;border-bottom:2px solid var(--border);}
.card p{font-size:.9rem;color:var(--ink);}
.kw{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:14px;justify-content:center;}
.kw span{font-size:.78rem;font-weight:700;color:var(--navy);background:var(--paper);
  border:2px solid var(--navy);border-radius:99px;padding:4px 12px;
  box-shadow:2px 2px 0 var(--cat);}
.jobs{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px;}
.jobs span{font-size:.8rem;font-weight:700;color:#fff;background:var(--cat-ink);
  border-radius:4px;padding:4px 11px;}
.minis{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:4px;}
.mini{display:flex;flex-direction:column;align-items:center;gap:6px;
  text-decoration:none;background:var(--paper);border:2px solid var(--navy);
  border-radius:8px;padding:9px 5px;box-shadow:2px 2px 0 rgba(15,23,42,.16);}
.mini img{width:56px;height:84px;object-fit:contain;}
/* line-break:strict は長音符（ー）と小書き仮名を行頭に置かせない。
   これが無いと「あったかリーダ／ー」のように ー だけが次行に落ちる
   （3列 390px で1列 約100px しかなく、10文字の名前は必ず2行になる）。 */
.mini-t{font-size:.68rem;font-weight:700;color:var(--ink);text-align:center;line-height:1.4;
  line-break:strict;word-break:normal;}
.mini-t b{display:block;font-family:var(--lat);font-size:.82rem;letter-spacing:1px;}
/* --- CTA --- */
.cta{display:block;text-align:center;text-decoration:none;
  font-family:var(--jp-disp);font-weight:900;font-size:1.06rem;color:#fff;
  background:var(--verm);border:2px solid var(--navy);border-radius:8px;
  padding:17px 16px;box-shadow:5px 5px 0 var(--navy);margin:22px 0 8px;}
.cta-note{text-align:center;font-size:.76rem;color:var(--mid);}
.note{font-size:.76rem;color:var(--mid);margin-top:10px;}
/* --- フッター --- */
.ftr{background:var(--ink-field);border-top:2px solid var(--navy);
  padding:26px 0 30px;text-align:center;}
.ftr-logo{font-family:var(--lat);font-weight:700;letter-spacing:2px;color:var(--paper);
  margin-bottom:9px;}
.ftr p{font-size:.74rem;color:#8792a8;line-height:1.8;}
.ftr nav{margin:12px 0 10px;display:flex;gap:16px;justify-content:center;flex-wrap:wrap;}
.ftr nav a{font-size:.78rem;color:#c3cbdd;}
.ftr .cp{font-size:.72rem;color:#8792a8;}
@media (min-width:768px){
  .wrap,.hdr-in{max-width:640px;}
  h1{font-size:2.05rem;}
  .face{width:220px;height:330px;}
}
/* Shared pages follow the editorial diagnosis design. */
:root{--paper:#fff;--paper2:#edf1f7;--ink-field:#101c36;--navy:#15213b;
  --mid:#53617a;--border:#dce3ef;--must:#edc74c;}
html,body{font-size:16px;}
.wrap,.hdr-in{max-width:760px;}
.hdr{background:rgba(255,255,255,.97);border-bottom:1px solid var(--border);}
.hdr-in{min-height:64px;}
.logo{font-size:1.25rem;letter-spacing:1px;}
.logo i{background:#315ee8;border-radius:3px;}
.hdr-cta{font-size:.875rem;background:#315ee8;color:#fff;border:0;border-radius:10px;
  padding:9px 14px;box-shadow:none;min-height:44px;}
.hero{padding:40px 0 36px;}
.hero::before{background:none;}
.hero::after{height:4px;}
.crumb{font-size:.8125rem;color:#b9c4d9;}
.pill{border:0;border-radius:99px;box-shadow:none;font-size:.8125rem;padding:5px 14px;}
.face{border:1px solid rgba(255,255,255,.18);border-radius:100px 100px 20px 20px;
  background:#e7edf8;box-shadow:0 16px 40px rgba(0,0,0,.16);}
.code{font-size:3rem;letter-spacing:4px;color:#b9cbff;}
h1{font-size:clamp(1.75rem,5vw,2.5rem);margin-top:14px;}
.tag{font-size:1rem;}
main{padding:32px 0 48px;}
.card{border:1px solid var(--border);border-radius:18px;padding:24px;
  box-shadow:0 6px 24px rgba(16,28,54,.04);margin-bottom:18px;}
.card h2{font-size:1.125rem;border-bottom:1px solid var(--border);padding-bottom:12px;}
.card p{font-size:1rem;line-height:1.95;}
.kw span{font-size:.875rem;border:1px solid var(--border);box-shadow:none;padding:5px 13px;}
.jobs span{font-size:.875rem;border-radius:8px;padding:5px 12px;}
.mini{border:1px solid var(--border);border-radius:14px;padding:14px 6px;box-shadow:none;
  transition:transform .18s ease,border-color .18s ease;}
.mini:hover{transform:translateY(-3px);border-color:#315ee8;}
.mini-t{font-size:.8125rem;line-height:1.6;}.mini-t b{font-size:1rem;}
.cta{background:#315ee8;border:0;border-radius:14px;box-shadow:0 8px 24px rgba(49,94,232,.18);
  transition:background .18s ease;}.cta:hover{background:#254cca;}
.note,.cta-note{font-size:.875rem;line-height:1.85;}
.ftr{border-top:1px solid #27354f;}.ftr p,.ftr nav a,.ftr .cp{font-size:.8125rem;}
a:focus-visible{outline:3px solid #edc74c;outline-offset:4px;}
@media(max-width:360px){.card{padding:18px;}.logo{font-size:1.1rem;}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important;}}
</style>
</head>
<body>

<header class="hdr">
  <div class="hdr-in">
    <a class="logo" href="../index.html"><i></i>CAREER <span>TYPE</span></a>
    <a class="hdr-cta" href="../index.html?ref=type">診断する</a>
  </div>
</header>

<div class="hero">
  <div class="wrap">
    <nav class="crumb"><a href="../index.html">就活キャリアタイプ診断</a> ／ ${esc(t.code)}</nav>
    <div class="pill">${esc(t.code.slice(0, 2))}系 — ${esc(t.label)}</div>
    <div class="face"><img src="../images/chars/${esc(t.img)}.webp" alt="${esc(t.name)}のイメージイラスト" width="800" height="1200"></div>
    <div class="code">${esc(t.code)}</div>
    <h1>${esc(t.name)}</h1>
    <p class="tag">${esc(t.tag)}</p>
  </div>
</div>

<main>
  <div class="wrap">

    <div class="kw">${t.kw.map(k => `<span>${esc(k)}</span>`).join('')}</div>

    <section class="card">
      <h2>どんなタイプ？</h2>
      <p>${esc(t.per)}</p>
    </section>

    <section class="card">
      <h2>強み</h2>
      <p>${esc(t.str)}</p>
    </section>

    <section class="card">
      <h2>力を発揮しやすい仕事</h2>
      <div class="jobs">${t.jobs.map(j => `<span>${esc(j)}</span>`).join('')}</div>
      <p style="margin-top:11px;">${esc(t.why)}</p>
      <p class="note">職種は例示です。特定の企業の採用基準や、選考の結果とは関係ありません。</p>
    </section>

    <section class="card">
      <h2>相性がよい組み合わせ</h2>
      <div class="minis">${t.good.map(miniCard).join('')}</div>
      <p class="note">タイプ同士の傾向の話であり、特定の人との関係を判定するものではありません。</p>
    </section>

    <a class="cta" href="../index.html?ref=type">20問で自分のタイプを調べる →</a>
    <p class="cta-note">約3分 ／ 登録不要 ／ メールアドレス不要 ／ 無料</p>

  </div>
</main>

<footer class="ftr">
  <div class="wrap">
    <div class="ftr-logo">CareerType</div>
    <p>本診断は、20問の回答から働き方の傾向を4つの軸・16タイプに分類するものです。職業への適性や、選考の合否を判定するものではありません。</p>
    <nav>
      <a href="../index.html">診断トップ</a>
      <a href="../privacy.html">プライバシーポリシー</a>
      <a href="../privacy.html#operator">運営者情報</a>
    </nav>
    <div class="cp">© キャリアタイプ診断 運営事務局</div>
  </div>
</footer>

</body>
</html>
`;
};

/** 16枚ぶんの { code, file, html } を返す（ディスクには書かない）。 */
export async function renderAll() {
  const { types, SITE_BASE } = await loadTypes();
  _byCode = Object.fromEntries(types.map(t => [t.code, t]));
  return types.map(t => ({
    code: t.code,
    name: t.name,
    file: `${OUT_DIR}/${t.code}.html`,
    html: page(t, SITE_BASE),
  }));
}

/* 直接実行されたときだけ書き出す（lint から import されたときは書かない）。 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const { ROOT } = await loadTypes();
  const out = path.join(ROOT, OUT_DIR);
  fs.mkdirSync(out, { recursive: true });
  const pages = await renderAll();
  for (const p of pages) {
    const f = path.join(ROOT, p.file);
    fs.writeFileSync(f, p.html);
    console.log(`  ${p.file}`.padEnd(22) + `${(fs.statSync(f).size / 1024).toFixed(1)}KB  ${p.name}`);
  }
  console.log(`\n[gen-type-pages] ${pages.length}枚`);
}
