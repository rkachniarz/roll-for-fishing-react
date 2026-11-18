"""The map (12.1, CR-7): the owner's distressed paper with the owner's lake outline inked on it, as pixel art.

    npm run map

From docs/design/map/ (local only, like every photo): `paper.jpg`, the owner's photo of a crumpled, stained sheet
on a white table, and `outline.jpg`, the owner's pencil drawing of the lake's shores. The paper is cut out by its
warmth (the table is grey, the paper cream), shrunk to SIZE pixels across, and cut to a small palette with its
creases and stains kept. The outline is laid over the whole sheet, the water given a faint wash, and the shores
inked in two tones of sepia. Everything off the paper is transparent.

Writes src/generated/map-paper.js (the picture as a data URL, with its size) and an enlarged preview to
art/map.png. The spots' places on it are content: `map` on each spot (or on a town), in this picture's pixels.
"""
import base64
import io
import os
import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageOps
from scipy.ndimage import gaussian_filter

SIZE = 320                  # the map's width and height in pixels
COLOURS = 14                # the paper's palette, before the ink and the wash
WARMTH = 9                  # red above blue that counts as paper, not table
INSET = (0.03, 0.03)        # how far in from the paper's box the outline's square starts, as a share of it
WASH = (110, 150, 150)      # the water's wash, mixed in by WASH_ALPHA
WASH_ALPHA = 0.14
INK = (88, 62, 44)          # the shore's line
INK_SOFT = (150, 118, 88)   # its softer edge

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')
SRC = os.path.join(ROOT, 'docs', 'design', 'map')

# ---------- The paper ----------
photo = Image.open(os.path.join(SRC, 'paper.jpg')).convert('RGB')
r, g, b = photo.split()
warm = ImageChops.subtract(r, b).filter(ImageFilter.GaussianBlur(6)).point(lambda v: 255 if v > WARMTH else 0)
# Specks of table inside, or of paper outside, closed and opened away.
warm = warm.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.MinFilter(17)).filter(ImageFilter.MaxFilter(9))
# Only the biggest piece: flood the table from the corners, and everything not table is paper.
table = warm.copy()
for corner in [(0, 0), (table.width - 1, 0), (0, table.height - 1), (table.width - 1, table.height - 1)]:
    if table.getpixel(corner) == 0:
        ImageDraw.floodfill(table, corner, 128)
mask = table.point(lambda v: 0 if v == 128 else 255)
box = mask.getbbox()
side = max(box[2] - box[0], box[3] - box[1])
cx, cy = (box[0] + box[2]) // 2, (box[1] + box[3]) // 2
square = (cx - side // 2, cy - side // 2, cx - side // 2 + side, cy - side // 2 + side)
shrunk = photo.crop(square).resize((SIZE, SIZE), Image.LANCZOS).filter(ImageFilter.MedianFilter(3))
# The paper's edge: hard, at the pixel size, no half-transparent fringe.
edge = mask.crop(square).resize((SIZE, SIZE), Image.LANCZOS).point(lambda v: 255 if v >= 128 else 0)
# The photo is lit unevenly and its white balance is grey: what is kept is its texture, the creases (lightness
# against the area around) and the stains (warmth against the area around), laid over the cream the eye sees.
CREAM = (238, 224, 196)
STAIN = (196, 132, 74)      # the rust of the creases and spots
CREASE = 1.5                # how strongly the creases' light and shade show
SPREAD = 0.25               # how much of the photo's broad light and shade is kept
STAINING = 0.07             # a stain's strength per step of warmth above the paper around it
AGEING = 0.025              # and per step of warmth above the whole sheet's, for the broad yellowing
inside = np.asarray(edge.filter(ImageFilter.MinFilter(7))) > 0  # the rim, the table's shadow, kept out of averages
rgb = np.asarray(shrunk, dtype=np.float64)
L = 0.3 * rgb[..., 0] + 0.59 * rgb[..., 1] + 0.11 * rgb[..., 2]
warmth = rgb[..., 0] - rgb[..., 2]


def blurred(a, radius):
    """A blur that averages only the paper, so the table's grey doesn't bleed in at the edge."""
    m = inside.astype(np.float64)
    return gaussian_filter(a * m, radius) / np.maximum(0.05, gaussian_filter(m, radius))


broad = blurred(L, 18)
light = np.where(inside, L, broad)
d = CREASE * (light - broad) + SPREAD * (broad - L[inside].mean())
local = warmth - blurred(warmth, 5)
stain = np.clip(STAINING * local + AGEING * (blurred(warmth, 5) - np.median(warmth[inside])), 0, 0.6)
# The rim, where the photo shows the table's shadow, takes the brown of an old edge instead.
stain = np.where(inside, stain, 0.3)
cream, rust = np.array(CREAM, dtype=np.float64), np.array(STAIN, dtype=np.float64)
out = cream * (1 - stain[..., None]) + rust * stain[..., None] + d[..., None]
paper = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), 'RGB')

# ---------- The outline ----------
pencil = ImageOps.invert(Image.open(os.path.join(SRC, 'outline.jpg')).convert('L'))
# The scan's specks and the ruler marks along its top: only real strokes count.
pencil = pencil.point(lambda v: 0 if v < 40 else v)
ImageDraw.Draw(pencil).rectangle((0, 0, pencil.width, 120), fill=0)
# Where the outline's square sits on the paper.
pad_x, pad_y = int(SIZE * INSET[0]), int(SIZE * INSET[1])
inner_size = SIZE - 2 * pad_x
lines = pencil.resize((inner_size, inner_size), Image.BOX)
level = lines.point(lambda v: min(255, v * 9))
strong = level.point(lambda v: 255 if v >= 150 else 0)
soft = level.point(lambda v: 255 if 70 <= v < 150 else 0)


def specks_out(img, smallest=8):
    """Only lines: specks of dust in the scan, under `smallest` pixels with their soft edge, go."""
    from scipy.ndimage import label
    any_ink = np.asarray(strong) | np.asarray(soft)
    parts, n = label(any_ink > 0, structure=np.ones((3, 3)))
    sizes = np.bincount(parts.ravel())
    keep = sizes >= smallest
    keep[0] = False
    return Image.fromarray(np.where(keep[parts], np.asarray(img), 0).astype(np.uint8), 'L')


strong, soft = specks_out(strong), specks_out(soft)

# The water: everything reached from the open lake (the owner's 8) without crossing a shore. The streams that
# run off the drawing's edge (the 4 at the top) are closed with lines that are never drawn.
# Thickened, so the small breaks in the pencil line don't let the water out onto the land.
fill = level.point(lambda v: 255 if v >= 70 else 0).filter(ImageFilter.MaxFilter(5))
walls = ImageDraw.Draw(fill)
k = inner_size / 1223  # the numbered picture's pixels (docs/design/map/spots-numbered.png) to these
# The stream at 4 runs off the top: its water ends in a round, not a ruled line.
walls.line([(p[0] * k, p[1] * k) for p in [(292, 296), (310, 318), (350, 328), (390, 316), (408, 294)]], fill=255, width=4, joint='curve')
# The open lake, the bay inside the curl at 3, and the river below its narrows.
for seed in [(1060, 580), (330, 578), (742, 1205)]:
    at = (int(seed[0] * k), int(seed[1] * k))
    if fill.getpixel(at) == 0:
        ImageDraw.floodfill(fill, at, 128)
water = fill.point(lambda v: 255 if v == 128 else 0).filter(ImageFilter.MaxFilter(5))
if water.histogram()[255] > 0.6 * inner_size * inner_size:
    raise SystemExit('map: the water leaked onto the land; a break in the outline needs closing')

picture = paper.convert('RGB')
sheet = Image.new('L', (SIZE, SIZE), 0)
sheet.paste(water, (pad_x, pad_y))
wash = Image.blend(picture, Image.new('RGB', picture.size, WASH), WASH_ALPHA)
picture = Image.composite(wash, picture, sheet)

small = picture.quantize(colors=COLOURS, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
for layer, colour in ((soft, INK_SOFT), (strong, INK)):
    sheet = Image.new('L', (SIZE, SIZE), 0)
    sheet.paste(layer, (pad_x, pad_y))
    small = Image.composite(Image.new('RGB', small.size, colour), small, sheet)

out = small.convert('RGBA')
out.putalpha(edge)

# ---------- Out ----------
buf = io.BytesIO()
out.save(buf, format='PNG', optimize=True)
url = 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode('ascii')
js = (
    '// Generated by `npm run map` (tools/map.py) from the owner\'s paper and outline (12.1). Do not edit.\n'
    f'export const MAP_SIZE = {SIZE};\n'
    f'export const MAP_PAPER = \'{url}\';\n'
)
with open(os.path.join(ROOT, 'src', 'generated', 'map-paper.js'), 'w', encoding='utf-8', newline='\n') as f:
    f.write(js)
os.makedirs(os.path.join(ROOT, 'art'), exist_ok=True)
preview = Image.new('RGBA', out.size, (40, 40, 40, 255))
preview.alpha_composite(out)
preview.resize((SIZE * 3, SIZE * 3), Image.NEAREST).save(os.path.join(ROOT, 'art', 'map.png'))
print(f'map: {SIZE}x{SIZE}, {len(buf.getvalue())} bytes, src/generated/map-paper.js; preview art/map.png; the outline at {pad_x},{pad_y} size {inner_size}')
