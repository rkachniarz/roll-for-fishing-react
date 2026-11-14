"""The light theme's background (D143): a tabletop of pine or oak, as a small repeating pixel tile.

    npm run planks [pine|oak]

Wide boards run the tile's whole width, their grain cut from a photo (docs/design/refs/Pine.jpg or Oak.jpg,
from `npm run commons fetch`; Wikimedia Commons, CC BY-SA, credited in assets/CREDITS.md), shrunk to board
size, brought to the light theme's colours with the grain at an even strength, and cut to a small palette.
Each board's grain loops: its last pixels fade into its first, so the tile repeats without a seam or a joint.
The tile goes into styles.css as a data URL, between the planks markers; an enlarged preview to art/planks.png.
"""
import base64
import io
import os
import re
import sys
from PIL import Image, ImageFilter, ImageStat

KIND = sys.argv[1] if len(sys.argv) > 1 else 'pine'
W, BOARD = 256, 32          # the tile's width; a board's height in pixels, its seam included
BOARDS = 3                  # boards in the tile, top to bottom
FADE = 48                   # pixels at a board's end that fade into its start, so the grain loops
TONE = [3, -4, 1]           # each board a shade lighter or darker, so the top doesn't look printed
GRAIN = 12                  # the grain's strength: its spread in lightness
# The light theme's wood (styles.css --bg #d9b98a).
TARGET = {'pine': (228, 196, 144), 'oak': (214, 184, 138)}

HERE = os.path.dirname(os.path.abspath(__file__))
REFS = os.path.join(HERE, '..', 'docs', 'design', 'refs')
photo = Image.open(os.path.join(REFS, 'Pine.jpg' if KIND == 'pine' else 'Oak.jpg')).convert('RGB')
# The grain should run along the board: the oak photo's runs up and down.
if KIND == 'oak':
    photo = photo.rotate(90, expand=True)


def board(n):
    """One board's grain, W x (BOARD - 1), looping at its ends."""
    w, h = photo.size
    length = W + FADE
    band_h = max(8, int(w * (BOARD - 1) / length))
    top = int((h - band_h) * ((n * 0.29 + 0.15) % 1))
    cut = photo.crop((0, top, w, top + band_h)).resize((length, BOARD - 1), Image.LANCZOS)
    # Specks the shrink leaves would turn into dark dots once the palette is cut: smoothed away.
    cut = cut.filter(ImageFilter.MedianFilter(3))
    mean = ImageStat.Stat(cut).mean
    k = GRAIN / max(1.0, ImageStat.Stat(cut.convert('L')).stddev[0])
    target = [c + TONE[n % len(TONE)] for c in TARGET[KIND]]
    src = cut.load()
    out = Image.new('RGB', (W, BOARD - 1))
    px = out.load()
    for y in range(BOARD - 1):
        for x in range(W):
            # The end fades into the start: x near 0 blends in what lies past W.
            a = src[x, y]
            if x < FADE:
                b = src[W + x, y]
                t = x / FADE
                a = tuple(int(b[i] * (1 - t) + a[i] * t) for i in range(3))
            px[x, y] = tuple(
                int(max(0, min(255, target[i] + max(-2 * GRAIN, min(2 * GRAIN, (a[i] - mean[i]) * k)))))
                for i in range(3)
            )
    return out


SEAM = (150, 110, 70)       # the gap between boards
EDGE = (240, 220, 180)      # a lit edge along each board's top
tile = Image.new('RGB', (W, BOARD * BOARDS))
for n in range(BOARDS):
    y0 = n * BOARD
    tile.paste(board(n), (0, y0))
    for x in range(W):
        top = tile.getpixel((x, y0))
        tile.putpixel((x, y0), tuple((a + b) // 2 for a, b in zip(EDGE, top)))
        tile.putpixel((x, y0 + BOARD - 1), SEAM)

small = tile.quantize(colors=12, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)

# ---------- Into styles.css ----------
buf = io.BytesIO()
small.save(buf, format='PNG', optimize=True)
url = 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode('ascii')
css_path = os.path.join(HERE, '..', 'styles.css')
with open(css_path, encoding='utf-8', newline='') as f:
    css = f.read()
nl = '\r\n' if '\r\n' in css else '\n'
start, end = '/* planks:start (npm run planks) */', '/* planks:end */'
if start not in css:
    sys.exit('styles.css has no planks markers')
block = f"{start}{nl}  --planks: url('{url}');{nl}  {end}"
css = re.sub(re.escape(start) + r'.*?' + re.escape(end), lambda m: block, css, flags=re.S)
with open(css_path, 'w', encoding='utf-8', newline='') as f:
    f.write(css)
# A preview: the tile twice across and down, three times as big, as the page shows it.
rgb = small.convert('RGB')
prev = Image.new('RGB', (W * 2, BOARD * BOARDS * 2))
for i in range(2):
    for k in range(2):
        prev.paste(rgb, (i * W, k * BOARD * BOARDS))
os.makedirs(os.path.join(HERE, '..', 'art'), exist_ok=True)
prev.resize((prev.size[0] * 3, prev.size[1] * 3), Image.NEAREST).save(os.path.join(HERE, '..', 'art', 'planks.png'))
print(f'planks: {KIND}, {W}x{BOARD * BOARDS}, {len(buf.getvalue())} bytes, into styles.css; preview art/planks.png')
