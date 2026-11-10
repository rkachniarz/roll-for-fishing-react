# Cuts the subject out of photos (rembg), keeps only its biggest piece, crops to
# it with a little room, and flattens it onto magenta, which photo-icon reads as
# the background (no fish or item is that colour), or keeps it transparent.
#
#   npm run cutout <photo>... [out=docs/design/cutouts] [flip=Name|Name] [bg=magenta|transparent] [all=1]
#
# flip: photos (by file name, without the extension) to mirror, so every fish
#   faces left (D98). all=1 keeps every piece, not just the biggest: a picture
#   with several things in it, or an event picture.
# Writes <out>/<name>.png for each photo.

import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from rembg import new_session, remove
from scipy import ndimage

args = sys.argv[1:]
is_opt = lambda a: re.match(r'^\w+=', a) is not None  # noqa: E731
opts = dict(a.split('=', 1) for a in args if is_opt(a))
photos = [a for a in args if not is_opt(a)]
if not photos:
    print('npm run cutout <photo>... [out=docs/design/cutouts] [flip=Name|Name] [bg=magenta|transparent] [all=1]')
    sys.exit(1)
out = Path(opts.get('out', 'docs/design/cutouts'))
flip = set(filter(None, opts.get('flip', '').split('|')))
transparent = opts.get('bg', 'magenta') == 'transparent'
keep_all = opts.get('all') == '1'

out.mkdir(parents=True, exist_ok=True)
session = new_session('u2net')
for name in photos:
    src = Path(name)
    if not src.is_file():
        print('no such file:', name, flush=True)
        continue
    img = Image.open(src).convert('RGB')
    img.thumbnail((1600, 1600))
    cut = remove(img, session=session)
    mask = np.array(cut.getchannel('A')) > 128
    if not keep_all:
        labels, count = ndimage.label(mask)
        if count > 1:
            sizes = ndimage.sum(mask, labels, range(1, count + 1))
            mask = labels == (int(np.argmax(sizes)) + 1)
    mask = ndimage.binary_fill_holes(mask)
    alpha = Image.fromarray((mask * 255).astype(np.uint8))
    if src.stem in flip:
        cut = cut.transpose(Image.FLIP_LEFT_RIGHT)
        alpha = alpha.transpose(Image.FLIP_LEFT_RIGHT)
    box = alpha.getbbox()
    if not box:
        print('nothing found:', src.name)
        continue
    pad = max(box[2] - box[0], box[3] - box[1]) // 20
    rgb = cut.convert('RGB').crop(box)
    a = alpha.crop(box)
    size = (rgb.width + 2 * pad, rgb.height + 2 * pad)
    if transparent:
        framed = Image.new('RGBA', size, (0, 0, 0, 0))
        framed.paste(rgb.convert('RGBA'), (pad, pad), mask=a)
    else:
        framed = Image.new('RGB', size, (255, 0, 255))
        framed.paste(rgb, (pad, pad), mask=a)
    framed.save(out / (src.stem + '.png'))
    print('ok', out / (src.stem + '.png'), framed.size, flush=True)
