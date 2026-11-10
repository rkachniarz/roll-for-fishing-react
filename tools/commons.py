# Pictures from Wikimedia Commons, for references (fish, items, event pictures).
#
#   npm run commons search <slug> <query> [n=12] [shape=wide|any] [min=800]
#       <query>: "Category:Esox lucius" lists a category (best for a species, by its
#       scientific name); anything else searches file names and descriptions.
#       shape=wide keeps landscape pictures only (a fish side-on). Writes small
#       numbered previews to docs/design/commons/<slug>/ and a contact sheet,
#       docs/design/commons/<slug>.jpg, to pick from.
#   npm run commons sheet <out.jpg> <slug>...
#       One contact sheet of several searches, a block each: fewer images to look at.
#   npm run commons fetch <slug> <n> name=<Name> [out=docs/design/refs]
#       Downloads preview n at up to 1280 px as <out>/<Name>.<ext>, and adds its
#       licence, author and source to <out>/credits.csv.
#
# Commons answers 429 (too many requests) when asked too fast: the tool waits and
# tries again, and asks for its standard thumbnail sizes rather than originals.

import csv
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw

UA = 'RollForFishingRefs/1.0 (personal game project)'
API = 'https://commons.wikimedia.org/w/api.php'
ROOT = Path('docs/design/commons')
SKIP = ('map', 'distribution', 'range', 'areal', 'verbreitung', 'stamp', 'coin', 'logo')


def get(url, binary=False):
    for attempt in range(6):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA})
            with urllib.request.urlopen(req, timeout=60) as r:
                data = r.read()
                return data if binary else json.loads(data)
        except urllib.error.HTTPError as e:
            if e.code != 429 or attempt == 5:
                raise
            wait = 5 * (attempt + 1)
            print(f'   429, waiting {wait}s', flush=True)
            time.sleep(wait)


def api(params):
    return get(API + '?' + urllib.parse.urlencode({'action': 'query', 'format': 'json', **params}))


def search(slug, query, n=12, shape='any', min_width=800):
    info = {'prop': 'imageinfo', 'iiprop': 'url|size|mime', 'iiurlwidth': 250}
    if query.startswith('Category:'):
        # A category's own files, and a search for its name: a species' pictures are
        # often in subcategories only.
        name = query.split(':', 1)[1]
        sources = [{'generator': 'categorymembers', 'gcmtitle': query, 'gcmtype': 'file', 'gcmlimit': 200},
                   {'generator': 'search', 'gsrsearch': f'"{name}"', 'gsrnamespace': 6, 'gsrlimit': 100}]
    else:
        sources = [{'generator': 'search', 'gsrsearch': query, 'gsrnamespace': 6, 'gsrlimit': 100}]
    found = {}
    for params in sources:
        for p in api({**params, **info}).get('query', {}).get('pages', {}).values():
            found.setdefault(p['title'], (p.get('imageinfo') or [{}])[0])

    def good(title, i):
        if any(w in title.lower() for w in SKIP):
            return False
        if i.get('mime') not in ('image/jpeg', 'image/png', 'image/tiff', 'image/svg+xml'):
            return False
        w, h = i.get('width', 0), i.get('height', 1)
        return w >= min_width and (shape != 'wide' or 1.4 <= w / h <= 4.5)

    # Larger originals first: more often studio shots and plates than snapshots.
    picks = sorted(((t, i) for t, i in found.items() if good(t, i)), key=lambda c: -c[1]['width'])[:n]
    d = ROOT / slug
    d.mkdir(parents=True, exist_ok=True)
    index = []
    for k, (title, i) in enumerate(picks, 1):
        (d / f'{k:02}.jpg').write_bytes(get(i['thumburl'], binary=True))
        index.append({'n': k, 'title': title, 'url': i['url'], 'page': i.get('descriptionurl'), 'width': i['width']})
        time.sleep(0.7)
    (d / 'index.json').write_text(json.dumps({'query': query, 'files': index}, indent=1))
    print(f'{slug}: {len(index)} of {len(found)} found', flush=True)
    sheet(ROOT / f'{slug}.jpg', [slug])


def sheet(out, slugs):
    TW, TH, COLS = 250, 125, 6
    blocks = []
    for slug in slugs:
        meta = json.loads((ROOT / slug / 'index.json').read_text())
        blocks.append((slug, meta))
    heights = [22 + max(1, (len(m['files']) + COLS - 1) // COLS) * (TH + 16) for _, m in blocks]
    img = Image.new('RGB', (COLS * TW, sum(heights)), (255, 255, 255))
    draw = ImageDraw.Draw(img)
    y0 = 0
    for (slug, meta), h in zip(blocks, heights):
        draw.rectangle([0, y0, COLS * TW, y0 + 18], fill=(30, 30, 30))
        draw.text((6, y0 + 3), f"{slug}: {meta['query']}", fill=(255, 255, 255))
        if not meta['files']:
            draw.text((6, y0 + 30), 'nothing found', fill=(200, 0, 0))
        for i, e in enumerate(meta['files']):
            thumb = Image.open(ROOT / slug / f"{e['n']:02}.jpg").convert('RGB')
            thumb.thumbnail((TW - 6, TH))
            x, y = (i % COLS) * TW, y0 + 22 + (i // COLS) * (TH + 16)
            img.paste(thumb, (x + 3, y))
            draw.text((x + 4, y + TH + 1), str(e['n']), fill=(200, 0, 0))
        y0 += h
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    img.save(out, quality=85)
    print('sheet', out, flush=True)


def fetch(slug, n, name, out):
    entry = next(e for e in json.loads((ROOT / slug / 'index.json').read_text())['files'] if e['n'] == n)
    pages = api({'titles': entry['title'], 'prop': 'imageinfo', 'iiprop': 'url|extmetadata', 'iiurlwidth': 1280})['query']['pages']
    info = next(iter(pages.values()))['imageinfo'][0]
    src = info.get('thumburl') if entry['width'] > 1280 else info['url']
    out.mkdir(parents=True, exist_ok=True)
    path = out / f'{name}{Path(urllib.parse.urlparse(src).path).suffix.lower()}'
    path.write_bytes(get(src, binary=True))
    meta = info.get('extmetadata', {})
    row = {
        'name': name, 'file': path.name,
        'license': meta.get('LicenseShortName', {}).get('value', ''),
        'author': re.sub(r'<[^>]+>', '', meta.get('Artist', {}).get('value', '')).strip(),
        'source': entry['page'] or info['url'], 'commons_title': entry['title'],
    }
    credits = out / 'credits.csv'
    rows = []
    if credits.exists():
        with open(credits, newline='', encoding='utf-8') as fh:
            rows = [r for r in csv.DictReader(fh) if r.get('name') != name]
    rows.append(row)
    with open(credits, 'w', newline='', encoding='utf-8') as fh:
        w = csv.DictWriter(fh, fieldnames=list(row))
        w.writeheader()
        w.writerows(rows)
    print('ok', path, row['license'], flush=True)


def main(args):
    opts = dict(a.split('=', 1) for a in args if re.match(r'^\w+=', a))
    rest = [a for a in args if not re.match(r'^\w+=', a)]
    cmd = rest[0] if rest else ''
    if cmd == 'search' and len(rest) >= 3:
        search(rest[1], ' '.join(rest[2:]), int(opts.get('n', 12)), opts.get('shape', 'any'), int(opts.get('min', 800)))
    elif cmd == 'sheet' and len(rest) >= 3:
        sheet(Path(rest[1]), rest[2:])
    elif cmd == 'fetch' and len(rest) == 3 and 'name' in opts:
        fetch(rest[1], int(rest[2]), opts['name'], Path(opts.get('out', 'docs/design/refs')))
    else:
        print('npm run commons search <slug> <query> [n=12] [shape=wide|any] [min=800]\n'
              '                sheet <out.jpg> <slug>...\n'
              '                fetch <slug> <n> name=<Name> [out=docs/design/refs]')
        sys.exit(1)


if __name__ == '__main__':
    main(sys.argv[1:])
