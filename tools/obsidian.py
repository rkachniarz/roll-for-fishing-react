"""The dark theme's background (D145): obsidian, drawn as code as a small repeating pixel tile.

    npm run obsidian

Drawn after a photo of obsidian's shell-shaped (conchoidal) fractures (Wikimedia Commons, James St. John,
CC BY 2.0, credited in assets/CREDITS.md): a near-black glassy surface with slow swells of light; a few
fan-shaped shells, each a set of concentric ripple lines catching the light and fading outward, with a glassy
gradient inside; and a few sharp facet edges. Every distance is measured across the tile's wrap, so it repeats
without a seam. Coloured along the dark theme's teals, cut to a small palette, and written into styles.css as a
data URL between the obsidian markers; an enlarged preview to art/obsidian.png.
"""
import base64
import io
import math
import os
import random
import re
import sys
from PIL import Image

SIZE = 160                  # the tile, square, in pixels
COLOURS = 10
SEED = 7                    # the same tile every time
# Dark to light along the dark theme's colours (styles.css: --bg #14232b, --panel #1d3540, --panel-edge #2c4f5e);
# the brightest is the sheen on a ripple, kept well below the text.
RAMP = [(11, 21, 27), (15, 28, 35), (20, 35, 43), (25, 43, 53), (32, 55, 66), (44, 74, 88), (62, 98, 114)]

rnd = random.Random(SEED)


def wrap(d):
    """A difference across the tile's wrap: the shortest way round."""
    return (d + SIZE / 2) % SIZE - SIZE / 2


# The surface: slow swells of light, from waves that fit the tile exactly.
waves = [(1, 0, rnd.random() * 6.28, 0.04), (0, 1, rnd.random() * 6.28, 0.04), (2, 1, rnd.random() * 6.28, 0.025)]

# Shells: a centre, the way the fan opens, how wide it is, the first ripple's radius, the spacing, how many.
shells = []
while len(shells) < 4:
    x, y = rnd.random() * SIZE, rnd.random() * SIZE
    # Apart from each other across the wrap, so their ripples don't cross-hatch.
    if any(math.hypot(wrap(x - s['x']), wrap(y - s['y'])) < 62 for s in shells):
        continue
    shells.append({
        'x': x, 'y': y,
        'dir': rnd.random() * 6.28, 'width': 0.8 + rnd.random() * 0.9,
        'r0': 6 + rnd.random() * 8, 'step': 3.2 + rnd.random() * 2.2, 'rings': rnd.randint(6, 10),
    })
# Facet edges: straight breaks across the glass, lit on one side.
facets = [(rnd.random() * SIZE, rnd.random() * SIZE, rnd.random() * 6.28, 30 + rnd.random() * 50) for _ in range(4)]

level = [[0.0] * SIZE for _ in range(SIZE)]
for y in range(SIZE):
    for x in range(SIZE):
        v = 0.18
        for kx, ky, ph, amp in waves:
            v += amp * math.sin(2 * math.pi * (kx * x + ky * y) / SIZE + ph)
        for s in shells:
            dx, dy = wrap(x - s['x']), wrap(y - s['y'])
            r = math.hypot(dx, dy)
            # Only inside the fan's opening, softly at its sides.
            ang = math.atan2(dy, dx) - s['dir']
            ang = (ang + math.pi) % (2 * math.pi) - math.pi
            side = max(0.0, 1 - abs(ang) / s['width'])
            if side <= 0:
                continue
            reach = s['r0'] + s['step'] * s['rings']
            if r > reach + 2:
                continue
            # The glassy inside: lighter near the shell's start, fading out.
            v += 0.22 * side * max(0.0, 1 - r / reach)
            # The ripples: a thin bright line on each ring, fainter further out.
            for k in range(s['rings']):
                rk = s['r0'] + s['step'] * k
                d = r - rk
                if -0.9 < d < 0.6:
                    v += (0.55 - 0.045 * k) * side * (1 - abs(d) / 0.9)
                elif 0.6 <= d < 1.6:
                    v -= 0.12 * side           # a shadow just outside each ripple
        for fx, fy, fa, flen in facets:
            dx, dy = wrap(x - fx), wrap(y - fy)
            along = dx * math.cos(fa) + dy * math.sin(fa)
            across = -dx * math.sin(fa) + dy * math.cos(fa)
            if abs(along) < flen / 2:
                fade = 1 - abs(along) / (flen / 2)
                if 0 <= across < 1:
                    v += 0.45 * fade               # the lit edge
                elif -1.5 < across < 0:
                    v -= 0.15 * fade               # its shadow
        level[y][x] = v

flat = sorted(v for row in level for v in row)
lo, hi = flat[int(len(flat) * 0.02)], flat[int(len(flat) * 0.995)]
tile = Image.new('RGB', (SIZE, SIZE))
tp = tile.load()
for y in range(SIZE):
    for x in range(SIZE):
        t = min(1.0, max(0.0, (level[y][x] - lo) / (hi - lo))) * (len(RAMP) - 1)
        i = min(len(RAMP) - 2, int(t))
        f = t - i
        tp[x, y] = tuple(int(RAMP[i][c] * (1 - f) + RAMP[i + 1][c] * f) for c in range(3))
small = tile.quantize(colors=COLOURS, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)

# ---------- Into styles.css ----------
HERE = os.path.dirname(os.path.abspath(__file__))
buf = io.BytesIO()
small.save(buf, format='PNG', optimize=True)
url = 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode('ascii')
css_path = os.path.join(HERE, '..', 'styles.css')
with open(css_path, encoding='utf-8', newline='') as f:
    css = f.read()
nl = '\r\n' if '\r\n' in css else '\n'
start, end = '/* obsidian:start (npm run obsidian) */', '/* obsidian:end */'
if start not in css:
    sys.exit('styles.css has no obsidian markers')
block = f"{start}{nl}  --obsidian: url('{url}');{nl}  {end}"
css = re.sub(re.escape(start) + r'.*?' + re.escape(end), lambda m: block, css, flags=re.S)
with open(css_path, 'w', encoding='utf-8', newline='') as f:
    f.write(css)
rgb = small.convert('RGB')
prev = Image.new('RGB', (SIZE * 3, SIZE * 2))
for i in range(3):
    for k in range(2):
        prev.paste(rgb, (i * SIZE, k * SIZE))
os.makedirs(os.path.join(HERE, '..', 'art'), exist_ok=True)
prev.resize((prev.size[0] * 3, prev.size[1] * 3), Image.NEAREST).save(os.path.join(HERE, '..', 'art', 'obsidian.png'))
print(f'obsidian: {SIZE}x{SIZE}, {len(buf.getvalue())} bytes, into styles.css; preview art/obsidian.png')
