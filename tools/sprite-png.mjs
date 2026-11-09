// Sprites to PNG and back, so the owner can draw in MS Paint (docs/art.md).
//
//   npm run sprite list                    every sprite this can export
//   npm run sprite export bobber           -> art/bobber.png, to open in Paint
//   npm run sprite export all              every sprite at once
//   npm run sprite import art/bobber.png   prints the grid, to paste into the code
//                                          (a file named after a sprite uses its palette)
//   npm run sprite import art/new.bmp keys=icons bg=ffffff
//
// (`node tools/sprite-png.mjs ...` is the same, and also takes --keys / --bg.)
//
// Import reads PNG and 24-bit BMP; export writes PNG.
//
// A sprite in the code is a grid of palette keys, one character per pixel
// (src/scene/sprites.js). Export paints it 1:1 on magenta, the old sprite
// artists' "nothing here" colour, since Paint can't keep transparency and
// white is in the palette. Import reads a PNG back into keys: magenta (or
// bg=, or a transparent pixel) is '.', a palette colour is its key, and any
// other colour gets a new key and is listed with the palette colour nearest
// to it, for Claude to snap or add.
//
// Decoding and encoding are written out here (zlib does the compression), so
// no image library is needed.

import { inflateSync, deflateSync, crc32 } from 'node:zlib';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { basename, dirname, join } from 'node:path';

/** The background colour exports are painted on, and imports read as transparent. */
export const MAGENTA = '#ff00ff';

/**
 * @typedef {Object} Image
 * @property {number} width
 * @property {number} height
 * @property {Uint8Array} rgba  Four bytes a pixel, row by row.
 */

// ---------- PNG ----------

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/**
 * Reads a PNG: greyscale, RGB, palette (any depth up to 8 bits), greyscale with
 * alpha, or RGBA; 8 bits a channel; not interlaced. That covers what MS Paint,
 * Aseprite and browsers save.
 * @param {Uint8Array} file
 * @returns {Image}
 */
export function decodePng(file) {
  const buf = Buffer.from(file);
  if (!buf.subarray(0, 8).equals(SIGNATURE)) throw new Error('not a PNG file');
  let width = 0;
  let height = 0;
  let depth = 0;
  let type = 0;
  /** @type {Buffer | null} */
  let palette = null;
  /** @type {Buffer | null} */
  let alphas = null;
  /** @type {Buffer[]} */
  const data = [];
  for (let at = 8; at < buf.length; ) {
    const length = buf.readUInt32BE(at);
    const name = buf.toString('latin1', at + 4, at + 8);
    const body = buf.subarray(at + 8, at + 8 + length);
    at += 12 + length;
    if (name === 'IHDR') {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      depth = body[8];
      type = body[9];
      if (body[12] !== 0) throw new Error('interlaced PNGs are not supported: save it again without interlacing');
    } else if (name === 'PLTE') palette = body;
    else if (name === 'tRNS') alphas = body;
    else if (name === 'IDAT') data.push(body);
    else if (name === 'IEND') break;
  }
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[type];
  if (!channels) throw new Error(`PNG colour type ${type} is not supported`);
  if (type === 3 ? depth > 8 : depth !== 8) throw new Error(`${depth}-bit PNGs of colour type ${type} are not supported`);
  if (type === 3 && !palette) throw new Error('palette PNG without a palette');

  const raw = inflateSync(Buffer.concat(data));
  const bitsPerPixel = channels * depth;
  const stride = Math.ceil((width * bitsPerPixel) / 8);
  const step = Math.max(1, bitsPerPixel / 8); // bytes back to "the pixel to the left"
  const rows = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= step ? rows[y * stride + x - step] : 0;
      const b = y > 0 ? rows[(y - 1) * stride + x] : 0;
      const c = x >= step && y > 0 ? rows[(y - 1) * stride + x - step] : 0;
      let v = line[x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      rows[y * stride + x] = v & 0xff;
    }
  }

  const rgba = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4;
      const p = y * stride + x * step;
      if (type === 3) {
        const bit = x * depth;
        const index = (rows[y * stride + (bit >> 3)] >> (8 - depth - (bit & 7))) & ((1 << depth) - 1);
        const pal = /** @type {Buffer} */ (palette);
        rgba.set([pal[index * 3], pal[index * 3 + 1], pal[index * 3 + 2], alphas && index < alphas.length ? alphas[index] : 255], o);
      } else if (type === 0) rgba.set([rows[p], rows[p], rows[p], 255], o);
      else if (type === 4) rgba.set([rows[p], rows[p], rows[p], rows[p + 1]], o);
      else if (type === 2) rgba.set([rows[p], rows[p + 1], rows[p + 2], 255], o);
      else rgba.set(rows.subarray(p, p + 4), o);
    }
  }
  return { width, height, rgba };
}

/**
 * Reads a 24- or 32-bit uncompressed BMP, as MS Paint's "24-bit Bitmap" saves.
 * Paint's 256-, 16-colour and monochrome bitmaps are refused: saving one
 * changes the colours, so the drawing is no longer what was drawn.
 * @param {Uint8Array} file
 * @returns {Image}
 */
export function decodeBmp(file) {
  const buf = Buffer.from(file);
  if (buf.toString('latin1', 0, 2) !== 'BM') throw new Error('not a BMP file');
  const start = buf.readUInt32LE(10);
  const width = buf.readInt32LE(18);
  const rawHeight = buf.readInt32LE(22);
  const bits = buf.readUInt16LE(28);
  const compression = buf.readUInt32LE(30);
  if ((bits !== 24 && bits !== 32) || (compression !== 0 && compression !== 3)) {
    throw new Error(`${bits}-bit BMPs change the colours: save it as "24-bit Bitmap" or PNG instead`);
  }
  const height = Math.abs(rawHeight);
  const stride = Math.ceil((width * bits) / 32) * 4;
  const rgba = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    // Rows are stored bottom up unless the height is negative.
    const row = start + (rawHeight > 0 ? height - 1 - y : y) * stride;
    for (let x = 0; x < width; x++) {
      const p = row + (x * bits) / 8;
      rgba.set([buf[p + 2], buf[p + 1], buf[p], 255], (y * width + x) * 4);
    }
  }
  return { width, height, rgba };
}

/**
 * Reads a PNG or a BMP, by what the file starts with.
 * @param {Uint8Array} file
 */
export function decodeImage(file) {
  return Buffer.from(file).toString('latin1', 0, 2) === 'BM' ? decodeBmp(file) : decodePng(file);
}

/**
 * Writes an RGBA PNG, unfiltered.
 * @param {Image} image
 * @returns {Buffer}
 */
export function encodePng({ width, height, rgba }) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    Buffer.from(rgba.buffer, rgba.byteOffset + y * width * 4, width * 4).copy(raw, y * (width * 4 + 1) + 1);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 6, 0, 0, 0], 8);
  /** @param {string} name @param {Buffer} body */
  const chunk = (name, body) => {
    const out = Buffer.alloc(12 + body.length);
    out.writeUInt32BE(body.length, 0);
    out.write(name, 4, 'latin1');
    body.copy(out, 8);
    out.writeUInt32BE(crc32(out.subarray(4, 8 + body.length)), 8 + body.length);
    return out;
  };
  return Buffer.concat([SIGNATURE, chunk('IHDR', header), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

// ---------- Grids ----------

/** @param {string} hex  '#rrggbb' or 'rrggbb'. */
const parseHex = (hex) => {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
/** @param {number[]} rgb */
const toHex = (rgb) => '#' + rgb.map((v) => v.toString(16).padStart(2, '0')).join('');

/**
 * Paints a grid of keys as an image, on the background colour.
 * @param {string[]} rows
 * @param {Record<string, string>} keys
 * @param {string} [bg]
 * @returns {Image}
 */
export function imageFromGrid(rows, keys, bg = MAGENTA) {
  const width = Math.max(...rows.map((r) => r.length));
  const height = rows.length;
  const rgba = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const key = rows[y][x] ?? '.';
      if (key !== '.' && !keys[key]) throw new Error(`no colour for key "${key}"`);
      rgba.set([...parseHex(key === '.' ? bg : keys[key]), 255], (y * width + x) * 4);
    }
  }
  return { width, height, rgba };
}

/** Letters for colours the palette doesn't have, in the order they're handed out. */
const SPARE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Reads an image back into keys.
 * @param {Image} image
 * @param {Record<string, string>} keys
 * @param {string} [bg]
 * @returns {{ rows: string[], added: { key: string, colour: string, nearest: string }[] }}
 *   `added`: colours not in the palette, each with a new key and the
 *   palette's nearest colour.
 */
export function gridFromImage({ width, height, rgba }, keys, bg = MAGENTA) {
  /** @type {Map<string, string>} */
  const byColour = new Map(Object.entries(keys).map(([k, c]) => [c.toLowerCase(), k]));
  const background = toHex(parseHex(bg));
  /** @type {{ key: string, colour: string, nearest: string }[]} */
  const added = [];
  const rows = [];
  for (let y = 0; y < height; y++) {
    let row = '';
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4;
      const colour = toHex([rgba[o], rgba[o + 1], rgba[o + 2]]);
      if (rgba[o + 3] < 128 || colour === background) {
        row += '.';
        continue;
      }
      let key = byColour.get(colour);
      if (!key) {
        key = SPARE.split('').find((k) => !keys[k] && !added.some((a) => a.key === k)) ?? '?';
        byColour.set(colour, key);
        added.push({ key, colour, nearest: nearest(colour, keys) });
      }
      row += key;
    }
    rows.push(row);
  }
  return { rows, added };
}

/**
 * The palette's closest colour, as "key #hex".
 * @param {string} colour
 * @param {Record<string, string>} keys
 */
function nearest(colour, keys) {
  const [r, g, b] = parseHex(colour);
  let best = '';
  let bestDistance = Infinity;
  for (const [key, c] of Object.entries(keys)) {
    const [r2, g2, b2] = parseHex(c);
    const d = (r - r2) ** 2 + (g - g2) ** 2 + (b - b2) ** 2;
    if (d < bestDistance) {
      bestDistance = d;
      best = `${key} ${c}`;
    }
  }
  return best;
}

// ---------- The sprites this can export ----------

/**
 * Every grid sprite by a file-friendly name, with its palette.
 * @returns {Promise<Map<string, { rows: string[], keys: Record<string, string> }>>}
 */
export async function sprites() {
  const scene = await import('../src/scene/sprites.js');
  const icons = await import('../src/scene/icons.js');
  const sceneKeys = scene.bobberKeys(null);
  /** @type {Map<string, { rows: string[], keys: Record<string, string> }>} */
  const all = new Map();
  all.set('bobber', { rows: scene.BOBBER, keys: sceneKeys });
  all.set('bobber-far', { rows: scene.BOBBER_FAR, keys: sceneKeys });
  scene.SPLASH.forEach((rows, i) => all.set(`splash-${i + 1}`, { rows, keys: sceneKeys }));
  for (const [band, frames] of Object.entries(scene.WAVES)) {
    frames.forEach((rows, i) => all.set(`wave-${band}-${i + 1}`, { rows, keys: sceneKeys }));
  }
  for (const [name, rows] of Object.entries(icons.ICONS)) {
    all.set(`icon-${name.replace('/', '-')}`, { rows, keys: icons.iconKeys(name) });
  }
  return all;
}

/**
 * The palettes `import keys=` can read against: the scene's, the icons',
 * and any sprite's own by its name (`keys=icon-fish-carp`).
 * @returns {Promise<Record<string, Record<string, string>>>}
 */
async function palettes() {
  const scene = await import('../src/scene/sprites.js');
  const icons = await import('../src/scene/icons.js');
  /** @type {Record<string, Record<string, string>>} */
  const all = { scene: scene.bobberKeys(null), icons: icons.KEYS };
  for (const [name, sprite] of await sprites()) all[name] = sprite.keys;
  return all;
}

// ---------- Command line ----------

async function main() {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const [command, target, ...rest] = process.argv.slice(2);
  // `--keys icons` or `keys=icons`: npm keeps `--` options for itself, so
  // `npm run sprite` needs the second form.
  /** @param {string} name */
  const option = (name) => {
    const i = rest.indexOf(`--${name}`);
    if (i >= 0) return rest[i + 1];
    return rest.find((a) => a.startsWith(`${name}=`))?.slice(name.length + 1);
  };

  if (command === 'list') {
    for (const [name, { rows }] of await sprites()) console.log(`${name}  ${Math.max(...rows.map((r) => r.length))}×${rows.length}`);
    return;
  }

  if (command === 'export' && target) {
    const all = await sprites();
    const names = target === 'all' ? [...all.keys()] : [target];
    await mkdir(join(root, 'art'), { recursive: true });
    for (const name of names) {
      const sprite = all.get(name);
      if (!sprite) throw new Error(`no sprite "${name}": see "npm run sprite list"`);
      const path = join('art', `${name}.png`);
      await writeFile(join(root, path), encodePng(imageFromGrid(sprite.rows, sprite.keys)));
      console.log(`wrote ${path}`);
    }
    return;
  }

  if (command === 'import' && target) {
    // A file named after a sprite (art/icon-fish-carp.png, as export names
    // it) reads against that sprite's palette; otherwise the scene's.
    const all = await palettes();
    const named = basename(target).replace(/\.(png|bmp)$/i, '');
    const which = option('keys') ?? (named in all ? named : 'scene');
    const keys = all[which];
    if (!keys) throw new Error(`keys= must be scene, icons or a sprite's name, not "${which}"`);
    const image = decodeImage(await readFile(target));
    const { rows, added } = gridFromImage(image, keys, option('bg') ?? MAGENTA);
    console.log(`// ${target}: ${image.width}×${image.height}, ${which} palette`);
    console.log('[');
    for (const row of rows) console.log(`  '${row}',`);
    console.log(']');
    if (added.length) {
      console.log('\nColours not in the palette, given new keys:');
      for (const a of added) console.log(`  ${a.key}  ${a.colour}   nearest: ${a.nearest}`);
    }
    if (!rows.some((r) => r.includes('.'))) {
      console.log('\nNo background found. Drawn on white? Add bg=ffffff.');
    }
    return;
  }

  console.log('Usage: npm run sprite list | export <name|all> | import <file.png|file.bmp> [keys=scene|icons|<sprite>] [bg=rrggbb]');
  process.exitCode = 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
