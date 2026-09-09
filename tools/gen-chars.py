# 紙細工キャラクター（16体）をサイトの素材に変換する。
# ============================================================================
# なぜ「そのまま縮小」では駄目か
# ----------------------------------------------------------------------------
#   素材は1体ずつ別々に生成されており、頭身が揃っていない。
#   実測（bbox を枠に収める従来の方法）:
#       実体の高さ … 90〜100%（ほぼ揃う）
#       頭の幅     … 2.07倍のばらつき
#   高さで揃えると、頭が小さく描かれた体（a1 オンオフのエース /
#   c4 のめり込みビルダー）だけ「小さい人」に見える。
#   逆に頭で揃えると、その2体が他より 1.5倍の背丈になって収まらない。
#
#   よって sqrt(頭幅 × 実体高) を揃える。頭だけ・高さだけの中間で、
#   実測でばらつきは 頭 2.07→1.46倍 / 高さ 1.11→1.46倍 になる。
#   ★残るばらつきは素材そのものの頭身差であり、ここでは消せない。
#     完全に揃えるなら描き直しが要る。
#
# 使い方: python3 tools/gen-chars.py <元画像のフォルダ>
#   出力: images/chars/*.webp（480x640）と images/chars/sm/*.webp（320x427）
# ============================================================================
from PIL import Image
import os, sys, statistics, math, unicodedata, json

NAME2IMG = {
 "オンオフのエース":"a1","あったかリーダー":"a2","全力キャプテン":"a3","熱血プレイヤー":"a4",
 "ナチュラルケアリスト":"b1","ほっこりサポーター":"b2","黒子のプロデューサー":"b3","まっすぐガーディアン":"b4",
 "ひらめきクリエイター":"c1","じっくりクラフター":"c2","突き抜けパイオニア":"c3","のめり込みビルダー":"c4",
 "冷静なブレイン":"d1","きっちり参謀":"d2","鉄壁コントローラー":"d3","コツコツマイスター":"d4"}

WHITE = 242          # これ以上明るい画素を背景とみなして透過にする
FRAMES = [(480, 640, "images/chars"), (320, 427, "images/chars/sm")]   # 3:4

def load(path):
    im = Image.open(path).convert("RGBA")
    im.putdata([(r, g, b, 0) if (r > WHITE and g > WHITE and b > WHITE) else (r, g, b, a)
                for r, g, b, a in im.getdata()])
    return im.crop(im.getbbox())

def head_width(im):
    """各行の「最も長い連続した不透明の区間」を取り、上部30%の中央値を頭幅とする。
       髪は頭と地続きなので入る。離れて上がった腕は別の区間になるので入らない。"""
    W, H = im.size
    a = im.split()[3].load()
    runs = []
    for y in range(0, max(1, int(H * 0.30))):
        best = cur = 0
        for x in range(W):
            if a[x, y] > 128:
                cur += 1
                best = max(best, cur)
            else:
                cur = 0
        if best > 4:
            runs.append(best)
    return statistics.median(runs) if runs else 1

def main(src_dir):
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    figs = {}
    for fn in sorted(os.listdir(src_dir)):
        if not fn.lower().endswith(".png"):
            continue
        key = NAME2IMG.get(unicodedata.normalize("NFC", os.path.splitext(fn)[0]))
        if not key:
            print(f"  対応するタイプが無い: {fn}")
            continue
        im = load(os.path.join(src_dir, fn))
        figs[key] = (im, head_width(im))
    if len(figs) != 16:
        raise SystemExit(f"16体そろっていない（{len(figs)}体）")

    metric = {k: math.sqrt(h * im.size[1]) for k, (im, h) in figs.items()}
    target = statistics.median(metric.values())
    # 揃えたあとの最大寸法を求め、そこから全体の倍率を決める（枠にちょうど収まるように）
    sized = {k: (im.size[0] * target / metric[k], im.size[1] * target / metric[k])
             for k, (im, _) in figs.items()}
    mw = max(v[0] for v in sized.values())
    mh = max(v[1] for v in sized.values())

    report = {}
    for W, H, out in FRAMES:
        os.makedirs(os.path.join(root, out), exist_ok=True)
        k0 = min(W / mw, H / mh)                     # 最大の体が枠に収まる倍率
        for key, (im, hd) in figs.items():
            s = (target / metric[key]) * k0
            r = im.resize((max(1, round(im.size[0] * s)), max(1, round(im.size[1] * s))), Image.LANCZOS)
            c = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            c.paste(r, ((W - r.width) // 2, H - r.height), r)   # 下寄せ（立ち姿を揃える）
            c.save(os.path.join(root, out, key + ".webp"), "WEBP", quality=86, method=6)
            if out.endswith("sm"):
                report[key] = {"scale": round(s, 3), "head": round(hd * s, 1),
                               "h": round(im.size[1] * s, 1)}
    hs = [v["head"] for v in report.values()]
    ht = [v["h"] for v in report.values()]
    print(f"16体を変換した（{FRAMES[0][0]}x{FRAMES[0][1]} と {FRAMES[1][0]}x{FRAMES[1][1]}）")
    print(f"  頭幅のばらつき : {max(hs)/min(hs):.2f}倍")
    print(f"  高さのばらつき : {max(ht)/min(ht):.2f}倍")
    json.dump(report, open(os.path.join(root, "images/chars/scale.json"), "w"), indent=1)

if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else
         "/Users/keiya/Downloads/ChatGPT Image 2026年9月8日 20_10_48 (2)")
