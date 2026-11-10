// A photo to a first draft of an icon (D97, D98): the mechanical half of
// turning a photo into pixel art, so Claude spends its effort on the hand
// fixes, not on the cutting out. See .claude/skills/photo-to-icon/SKILL.md.
//
//   npm run photo-icon docs/design/photo-carp.jpg name=fish-carp
//   npm run photo-icon <photo> name=<file name> [angle=30] [size=32] [margin=1] [colours=12] [detail=90] [bg=a49e9e] [cut=36] [eye=1]
//
// A busy photo: cut it out first (npm run cutout, onto magenta), then bg=ff00ff.
//
// The photo should show the thing on a plain background (a cut-out, or a
// studio shot). What it does:
//   1. Finds the background (the corners' colour, or bg=) and cuts the thing out.
//   2. Turns it by angle= degrees (positive lifts the left end; fish lie tilted, D98)
//      and fits it to the square, a pixel short each side for the outline.
//   3. Averages the photo under each pixel, firms up the contrast a little, and
//      boils the colours down to colours= of its own (k-means, so the photo
//      decides which), named A, B, C… from dark to light.
//   4. Darkens a pixel a shade where the photo under it hides something much
//      darker than its average (detail=, 0 for none): scale rims, fin rays,
//      the eye, which averaging would wash out.
//   5. Outlines it with the icons' `k`, inside a margin= of empty pixels.
//   6. With eye=1, a fish's eye (D98): a 2×2 about a tenth of the length in from
//      the snout, a little towards the back. The head is at the left before the
//      turn. On a light head the eye is dark with a light glint (`e` over `x`);
//      on a dark head, a light ring round a dark pupil.
// Writes art/<name>.png at real size on magenta (to mark up, or to import),
// and art/<name>-big.png enlarged with a grid, to look at. Prints the grid and
// its palette as code, ready for OWN_KEYS and ICONS in src/scene/icons.js.
//
// Chromium (Playwright, already a dev dependency) decodes the photo, so JPEGs
// work without an image library.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';
import { encodePng, imageFromGrid } from './sprite-png.mjs';
import { KEYS } from '../src/scene/icons.js';

const args = process.argv.slice(2);
const photo = args.find((a) => !a.includes('='));
/** @param {string} name @param {string} fallback */
const option = (name, fallback) => args.find((a) => a.startsWith(`${name}=`))?.slice(name.length + 1) ?? fallback;
if (!photo) {
  console.log('Usage: npm run photo-icon <photo> name=<file name> [angle=30] [size=32] [margin=1] [colours=12] [detail=90] [bg=rrggbb] [cut=36] [eye=1]');
  process.exit(1);
}
const name = option('name', 'photo-icon');
const angle = Number(option('angle', '30'));
const size = Number(option('size', '32'));
const margin = Number(option('margin', '1'));
const eye = option('eye', '0') === '1';
const colours = Number(option('colours', '12'));
const cut = Number(option('cut', '36'));
const detail = Number(option('detail', '90'));
const bgOption = option('bg', '');

const type = extname(photo).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
const src = `data:${type};base64,${(await readFile(photo)).toString('base64')}`;

const browser = await chromium.launch();
const page = await browser.newPage();
/** @type {{ grid: string[], palette: string[], bg: number[] }} */
const result = await page.evaluate(
  async ({ src, size, angle, colours, cut, bgOption, detail }) => {
    const im = new Image();
    im.src = src;
    await im.decode();
    const W = im.width, H = im.height;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
    g.drawImage(im, 0, 0);
    const d = g.getImageData(0, 0, W, H).data;
    const at = (/** @type {number} */ x, /** @type {number} */ y) => {
      const o = (y * W + x) * 4;
      return [d[o], d[o + 1], d[o + 2]];
    };

    // 1. The background, and what isn't it.
    let bg;
    if (bgOption) bg = [0, 2, 4].map((i) => parseInt(bgOption.slice(i, i + 2), 16));
    else {
      const corners = [at(4, 4), at(W - 5, 4), at(4, H - 5), at(W - 5, H - 5)];
      bg = [0, 1, 2].map((i) => corners.reduce((s, p) => s + p[i], 0) / 4);
    }
    const solid = (/** @type {number} */ x, /** @type {number} */ y) => {
      x = Math.round(x);
      y = Math.round(y);
      if (x < 0 || y < 0 || x >= W || y >= H) return null;
      const p = at(x, y);
      return Math.abs(p[0] - bg[0]) + Math.abs(p[1] - bg[1]) + Math.abs(p[2] - bg[2]) > cut ? p : null;
    };

    // 2. Turned, and fitted to the square.
    const a = (angle * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
    const step = Math.max(2, Math.round(Math.max(W, H) / 400));
    /** @type {number[][]} */
    const turned = [];
    for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) if (solid(x, y)) turned.push([x * ca - y * sa, x * sa + y * ca]);
    const minU = Math.min(...turned.map((q) => q[0])), maxU = Math.max(...turned.map((q) => q[0]));
    const minV = Math.min(...turned.map((q) => q[1])), maxV = Math.max(...turned.map((q) => q[1]));
    const per = Math.max(maxU - minU, maxV - minV) / (size - 2.2);
    const mu = (minU + maxU) / 2, mv = (minV + maxV) / 2;
    const toPhoto = (/** @type {number} */ tx, /** @type {number} */ ty) => {
      const u = mu + (tx - size / 2) * per, v = mv + (ty - size / 2) * per;
      return [u * ca + v * sa, -u * sa + v * ca];
    };

    // 3. The photo under each pixel: 5×5 samples, half or more solid to count.
    const lum = (/** @type {number[]} */ p) => 0.3 * p[0] + 0.59 * p[1] + 0.11 * p[2];
    /** @type {(number[] | null)[][]} */
    const cells = [];
    /** How much darker the darkest sample under each pixel is than their average. */
    /** @type {number[][]} */
    const dips = [];
    for (let ty = 0; ty < size; ty++) {
      cells.push([]);
      dips.push([]);
      for (let tx = 0; tx < size; tx++) {
        let n = 0;
        let darkest = 255;
        const sum = [0, 0, 0];
        for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
          const [px, py] = toPhoto(tx + (i + 0.5) / 5, ty + (j + 0.5) / 5);
          const p = solid(px, py);
          if (!p) continue;
          n++;
          darkest = Math.min(darkest, lum(p));
          sum[0] += p[0];
          sum[1] += p[1];
          sum[2] += p[2];
        }
        cells[ty].push(n >= 13 ? sum.map((v) => v / n) : null);
        dips[ty].push(n >= 13 ? lum(sum.map((v) => v / n)) - darkest : 0);
      }
    }
    // A little more contrast and colour: averaging flattens both.
    const all = cells.flat().filter((p) => p !== null);
    const mean = [0, 1, 2].map((i) => all.reduce((s, p) => s + p[i], 0) / all.length);
    for (const row of cells) for (const p of row) {
      if (!p) continue;
      const grey = (p[0] + p[1] + p[2]) / 3;
      for (let i = 0; i < 3; i++) {
        const sat = grey + (p[i] - grey) * 1.2;
        p[i] = Math.max(0, Math.min(255, mean[i] + (sat - mean[i]) * 1.15));
      }
    }
    // k-means, started from colours spread through the photo's lightness.
    const sorted = [...all].sort((x, y) => lum(x) - lum(y));
    let centres = Array.from({ length: Math.min(colours, sorted.length) }, (_, i) => [...sorted[Math.floor(((i + 0.5) * sorted.length) / colours)]]);
    const nearest = (/** @type {number[]} */ p) => {
      let best = 0, bd = Infinity;
      centres.forEach((q, i) => {
        const dd = 2 * (p[0] - q[0]) ** 2 + 4 * (p[1] - q[1]) ** 2 + 3 * (p[2] - q[2]) ** 2;
        if (dd < bd) { bd = dd; best = i; }
      });
      return best;
    };
    for (let round = 0; round < 20; round++) {
      const sums = centres.map(() => [0, 0, 0, 0]);
      for (const p of all) {
        const s = sums[nearest(p)];
        s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; s[3]++;
      }
      centres = centres.map((q, i) => (sums[i][3] ? [sums[i][0] / sums[i][3], sums[i][1] / sums[i][3], sums[i][2] / sums[i][3]] : q));
    }
    // Dark to light, so A is the darkest.
    const order = centres.map((q, i) => i).sort((x, y) => lum(centres[x]) - lum(centres[y]));
    const letters = 'ABCDEFGHIJLMNOPQRSTUVWXYZ';
    const rankOf = new Map(order.map((ci, rank) => [ci, rank]));
    // Each colour's shade: the darker colour most like it in hue, not merely
    // the next darkest (gold's next darkest may be orange).
    const chroma = (/** @type {number[]} */ q) => q.map((v) => v - lum(q));
    const shadeOf = centres.map((q, i) => {
      let best = i, score = Infinity;
      centres.forEach((r, j) => {
        const drop = lum(q) - lum(r);
        if (drop < 8) return;
        const cq = chroma(q), cr = chroma(r);
        const s = Math.hypot(cq[0] - cr[0], cq[1] - cr[1], cq[2] - cr[2]) + Math.abs(drop - 30) * 0.8;
        if (s < score) { score = s; best = j; }
      });
      return best;
    });
    const grid = cells.map((row, y) =>
      row.map((p, x) => {
        if (!p) return '.';
        const at = nearest(p);
        return letters[/** @type {number} */ (rankOf.get(detail > 0 && dips[y][x] > detail ? shadeOf[at] : at))];
      }),
    );

    // 4. The outline.
    const filled = grid.map((row) => row.map((v) => v !== '.'));
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      if (!filled[y][x] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => filled[y + dy]?.[x + dx])) grid[y][x] = 'k';
    }
    const hex = (/** @type {number[]} */ p) => '#' + p.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
    return { grid: grid.map((r) => r.join('')), palette: order.map((ci) => hex(centres[ci])), bg };
  },
  { src, size: size - 2 * margin, angle, colours, cut, bgOption, detail },
);
await browser.close();

/** @type {Record<string, string>} */
const keys = { k: KEYS.k };
result.palette.forEach((colour, i) => (keys['ABCDEFGHIJLMNOPQRSTUVWXYZ'[i]] = colour));

// The margin: nothing touches the square's edge.
const blank = '.'.repeat(size);
result.grid = [
  ...Array(margin).fill(blank),
  ...result.grid.map((r) => '.'.repeat(margin) + r + '.'.repeat(margin)),
  ...Array(margin).fill(blank),
];

/** @param {string} hex */
const lum = (hex) => [1, 3, 5].reduce((s, i, j) => s + parseInt(hex.slice(i, i + 2), 16) * [0.299, 0.587, 0.114][j], 0);
/** @param {string} hex */
const sat = (hex) => {
  const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return (Math.max(...v) - Math.min(...v)) / 255;
};
/** @type {Record<string, string>} */
const notes = {};
if (eye) placeEye();

/**
 * The eye (6. above), in result.grid; adds its colours to keys.
 */
function placeEye() {
  const rows = result.grid.map((r) => r.split(''));
  const a = (angle * Math.PI) / 180;
  const D = [Math.cos(a), Math.sin(a)]; // along the fish, head to tail (x, y)
  const N = [D[1], -D[0]]; // across it, towards the back
  /** @type {number[][]} */
  const body = [];
  rows.forEach((row, r) => row.forEach((ch, c) => { if (ch !== '.' && ch !== 'k') body.push([r, c]); }));
  if (!body.length) return;
  const along = (/** @type {number[]} */ [r, c]) => c * D[0] + r * D[1];
  const across = (/** @type {number[]} */ [r, c]) => c * N[0] + r * N[1];
  const tip = Math.min(...body.map(along));
  const t = tip + Math.max(2.5, 0.09 * (Math.max(...body.map(along)) - tip));
  const slice = body.filter((p) => Math.abs(along(p) - t) < 0.8);
  const lo = Math.min(...slice.map(across)), hi = Math.max(...slice.map(across));
  const want = lo + 0.55 * (hi - lo);
  const isBody = (/** @type {number} */ r, /** @type {number} */ c) => !['.', 'k', undefined].includes(rows[r]?.[c]);
  const inner = (/** @type {number[]} */ [r, c]) => [[-1, 0], [1, 0], [0, -1], [0, 1]].every(([dr, dc]) => isBody(r + dr, c + dc));
  // The 2×2, the ring above and left of the pupil, all of it inside the body.
  const fits = (/** @type {number[]} */ [r, c]) => inner([r, c]) && inner([r - 1, c - 1]) && inner([r - 1, c]) && inner([r, c - 1]);
  const pool = body.filter(fits).length ? body.filter(fits) : body;
  const [er, ec] = pool.reduce((best, p) => (Math.hypot(along(p) - t, across(p) - want) < Math.hypot(along(best) - t, across(best) - want) ? p : best));
  /** @type {number[]} */
  const around = [];
  for (let r = er - 2; r <= er + 1; r++) for (let c = ec - 2; c <= ec + 1; c++) {
    if (!(r >= er - 1 && c >= ec - 1) && isBody(r, c)) around.push(lum(keys[rows[r][c]]));
  }
  const light = around.length > 0 && around.reduce((x, y) => x + y, 0) / around.length >= 95;
  const look = light ? ['e', 'x', 'x', 'x'] : ['e', 'e', 'e', 'x'];
  [[er - 1, ec - 1], [er - 1, ec], [er, ec - 1], [er, ec]].forEach(([r, c], i) => { if (isBody(r, c)) rows[r][c] = look[i]; });
  keys.x = '#141414';
  keys.e = '#e9e6de';
  notes.x = 'eye';
  notes.e = light ? 'eye glint' : 'eye ring';
  result.grid = rows.map((r) => r.join(''));
}

// A first guess at what each colour is for, from how dark and how strong it is:
// in a fish's words with eye=1, plain words otherwise. A starting point for the
// comments in OWN_KEYS, to correct by eye.
const ranked = Object.keys(keys).filter((k) => k !== 'k' && !notes[k]).sort((p, q) => lum(keys[p]) - lum(keys[q]));
const WORDS = eye ? ['back, dark shading', 'upper flank', 'lower flank', 'belly, highlights'] : ['darkest', 'dark', 'light', 'lightest'];
ranked.forEach((k, i) => {
  const f = i / Math.max(1, ranked.length - 1);
  const base = WORDS[f < 0.25 ? 0 : f < 0.55 ? 1 : f < 0.8 ? 2 : 3];
  notes[k] = sat(keys[k]) > 0.35 ? `${base}; ${eye ? 'fin colour' : 'strong colour'}` : base;
});

await mkdir('art', { recursive: true });
await writeFile(join('art', `${name}.png`), encodePng(imageFromGrid(result.grid, keys)));
// Enlarged ×12 with a faint grid, on the page's dark blue: the one to look at.
const zoom = 12;
const big = { width: size * zoom, height: size * zoom, rgba: new Uint8Array(size * zoom * size * zoom * 4) };
const page_ = [0x14, 0x23, 0x2b];
for (let y = 0; y < big.height; y++) for (let x = 0; x < big.width; x++) {
  const key = result.grid[Math.floor(y / zoom)][Math.floor(x / zoom)];
  const rgb = key === '.' ? page_ : [1, 3, 5].map((i) => parseInt(keys[key].slice(i, i + 2), 16));
  const line = x % zoom === 0 || y % zoom === 0;
  const o = (y * big.width + x) * 4;
  for (let i = 0; i < 3; i++) big.rgba[o + i] = line ? Math.round(rgb[i] * 0.8) : rgb[i];
  big.rgba[o + 3] = 255;
}
await writeFile(join('art', `${name}-big.png`), encodePng(big));

console.log(`// ${photo}: ${size}×${size} (margin ${margin}), turned ${angle}°, ${result.palette.length} colours; background #${result.bg.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`);
console.log(`// wrote art/${name}.png (real size) and art/${name}-big.png (enlarged)`);
console.log('// OWN_KEYS:');
console.log('{');
for (const [key, colour] of Object.entries(keys)) if (key !== 'k') console.log(`  ${key}: '${colour}', // ${notes[key]}`);
console.log('}');
console.log('// ICONS:');
console.log('[');
for (const row of result.grid) console.log(`  '${row}',`);
console.log(']');
