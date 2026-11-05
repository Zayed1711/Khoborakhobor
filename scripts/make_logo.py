"""Build the KhoboraKhobor logo assets from the brand artwork (no font needed).

Usage (from the project folder):  python scripts/make_logo.py design/logo-source.png

Outputs (in public/):
  brand-logo.png        full logo, transparent background (light pages)
  brand-logo-white.png  same, white wordmark + gold tagline (dark pages)
  logo-mark.svg         the broadcast mark as a vector (icons, small sizes)
  og-image.png          1200x630 share image
and src/app/icon.png, src/app/apple-icon.png, src/app/favicon.ico, src/app/icon.svg
"""
import sys
import numpy as np
from PIL import Image, ImageDraw

SRC = sys.argv[1]
MAROON = (127, 29, 29)
GOLD = (217, 164, 65)
INK = (28, 25, 22)

src = Image.open(SRC).convert("RGB")
arr = np.asarray(src).astype(float)

# Tight crop around the ink, with a little breathing room
ink = arr.sum(axis=2) < 740
ys, xs = np.nonzero(ink)
pad = 10
x0, y0, x1, y1 = xs.min() - pad, ys.min() - pad, xs.max() + pad + 1, ys.max() + pad + 1
crop = arr[y0:y1, x0:x1]

# "Colour to alpha" against white: exact on white, clean on any light background
alpha = np.max((255 - crop) / 255.0, axis=2)
safe = np.where(alpha > 0, alpha, 1)[..., None]
colour = 255 - (255 - crop) / safe
rgba = np.dstack([np.clip(colour, 0, 255), alpha * 255]).astype(np.uint8)
Image.fromarray(rgba, "RGBA").save("public/brand-logo.png", optimize=True)

# Dark version: wordmark white, maroon arcs white, tagline gold, dot stays gold
r, g, b = colour[..., 0], colour[..., 1], colour[..., 2]
is_gold = (r > 170) & (g > 120) & (b < 130)
is_maroon = (r > 70) & (g < 90) & (b < 90) & ~is_gold
h, w = crop.shape[:2]
row = np.arange(h)[:, None]
col = np.arange(w)[None, :]
# The tagline sits under the wordmark, right of the mark (the arcs reach as low as it)
mark_right = 481 - x0 + 6
tagline_row = (row > (h * 0.78)) & (col > mark_right)
dark = np.zeros_like(colour)
dark[...] = 255  # default white
dark[is_gold] = GOLD
dark[is_maroon & tagline_row] = (253, 228, 139)  # soft gold tagline on dark
rgba_dark = np.dstack([dark, alpha * 255]).astype(np.uint8)
Image.fromarray(rgba_dark, "RGBA").save("public/brand-logo-white.png", optimize=True)
print("logo", crop.shape[1], "x", crop.shape[0])

# No-tagline version for the small phone header: drop the tagline, trim the bottom
notag = rgba.copy()
notag[tagline_row] = 0
ink_rows = np.nonzero(notag[..., 3].max(axis=1) > 8)[0]
notag = notag[: ink_rows.max() + 6]
Image.fromarray(notag, "RGBA").save("public/brand-logo-compact.png", optimize=True)
print("compact", notag.shape[1], "x", notag.shape[0])

# The mark as a vector, traced from the artwork (centre = the dot)
MARK_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="-76 -56 152 112" role="img" aria-label="খবরাখবর">
  <g fill="none" stroke="#7f1d1d" stroke-linecap="round">
    <path d="M-53.3 -45.5 Q-80 0 -53.3 45.5" stroke-width="15.5"/>
    <path d="M-28.3 -28.5 Q-46.3 0 -28.3 28.5" stroke-width="11"/>
    <path d="M28.3 -28.5 Q46.3 0 28.3 28.5" stroke-width="11"/>
    <path d="M53.3 -45.5 Q80 0 53.3 45.5" stroke-width="15.5"/>
  </g>
  <circle r="14.9" fill="#d9a441"/>
</svg>
"""
open("public/logo-mark.svg", "w", encoding="utf-8").write(MARK_SVG)

# App/tab icons: the mark on a white rounded square (readable on dark browser tabs too)
ICON_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#ffffff"/>
  <g transform="translate(32 32) scale(0.36)">
    <g fill="none" stroke="#7f1d1d" stroke-linecap="round">
      <path d="M-53.3 -45.5 Q-80 0 -53.3 45.5" stroke-width="15.5"/>
      <path d="M-28.3 -28.5 Q-46.3 0 -28.3 28.5" stroke-width="11"/>
      <path d="M28.3 -28.5 Q46.3 0 28.3 28.5" stroke-width="11"/>
      <path d="M53.3 -45.5 Q80 0 53.3 45.5" stroke-width="15.5"/>
    </g>
    <circle r="14.9" fill="#d9a441"/>
  </g>
</svg>
"""
for p in ["src/app/icon.svg", "public/favicon.svg", "public/icon.svg", "public/logo-icon.svg"]:
    open(p, "w", encoding="utf-8").write(ICON_SVG)


def draw_icon(size: int) -> Image.Image:
    """Raster icon drawn with the same geometry, supersampled for smooth curves."""
    S = size * 8
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * 14 / 64), fill=(255, 255, 255, 255))
    k = S / 64 * 0.36
    cx = cy = S / 2

    def curve(p0, c, p2, w):
        pts = []
        for i in range(81):
            t = i / 80
            x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * c[0] + t ** 2 * p2[0]
            y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * c[1] + t ** 2 * p2[1]
            pts.append((cx + x * k, cy + y * k))
        rad = w * k / 2
        for x, y in pts:
            d.ellipse([x - rad, y - rad, x + rad, y + rad], fill=MAROON + (255,))

    for sgn in (-1, 1):
        curve((sgn * 53.3, -45.5), (sgn * 80, 0), (sgn * 53.3, 45.5), 15.5)
        curve((sgn * 28.3, -28.5), (sgn * 46.3, 0), (sgn * 28.3, 28.5), 11)
    rd = 14.9 * k
    d.ellipse([cx - rd, cy - rd, cx + rd, cy + rd], fill=GOLD + (255,))
    return im.resize((size, size), Image.LANCZOS)


draw_icon(192).save("src/app/icon.png", optimize=True)
draw_icon(180).save("src/app/apple-icon.png", optimize=True)
draw_icon(192).save("public/icon.png", optimize=True)
draw_icon(256).save("src/app/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
draw_icon(256).save("public/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])

# Share image (Facebook, WhatsApp, X need PNG/JPG, not SVG): logo centred on white
og = Image.new("RGB", (1200, 630), (255, 255, 255))
logo = Image.open("public/brand-logo.png")
scale = 900 / logo.width
logo = logo.resize((int(logo.width * scale), int(logo.height * scale)), Image.LANCZOS)
og.paste(logo, ((1200 - logo.width) // 2, (630 - logo.height) // 2), logo)
og.save("public/og-image.png", optimize=True)
print("done")
