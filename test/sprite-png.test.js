// tools/sprite-png.mjs: sprites out to PNG for the owner to draw on, and back.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deflateSync, crc32 } from 'node:zlib';
import { readFile } from 'node:fs/promises';
import { MAGENTA, decodeImage, decodePng, encodePng, gridFromImage, imageFromGrid, sprites } from '../tools/sprite-png.mjs';

const KEYS = { r: '#d9343f', w: '#ffffff' };

test('a sprite survives the trip to PNG and back', async () => {
  for (const [name, { rows, keys }] of await sprites()) {
    const width = Math.max(...rows.map((r) => r.length));
    const back = gridFromImage(decodePng(encodePng(imageFromGrid(rows, keys))), keys);
    assert.deepEqual(back.rows, rows.map((r) => r.padEnd(width, '.')), name);
    assert.deepEqual(back.added, [], name);
  }
});

test('white is a colour, magenta is nothing', () => {
  const image = imageFromGrid(['.w', 'r.'], KEYS);
  assert.deepEqual([...image.rgba.slice(0, 4)], [255, 0, 255, 255]);
  assert.deepEqual(gridFromImage(image, KEYS).rows, ['.w', 'r.']);
  // Drawn on white: --bg says so, and the magenta is now a stray colour.
  assert.deepEqual(gridFromImage(image, KEYS, '#ffffff').rows, ['A.', 'rA']);
});

test("a 24-bit BMP, as Paint saves one: bottom up, rows padded to 4 bytes", () => {
  // 2×2: top row red, white; bottom row magenta, red. Stored BGR, bottom row first.
  const pixels = Buffer.from([255, 0, 255, 63, 52, 217, 0, 0, 63, 52, 217, 255, 255, 255, 0, 0]);
  const header = Buffer.alloc(54);
  header.write('BM', 0, 'latin1');
  header.writeUInt32LE(54 + pixels.length, 2);
  header.writeUInt32LE(54, 10);
  header.writeUInt32LE(40, 14);
  header.writeInt32LE(2, 18);
  header.writeInt32LE(2, 22);
  header.writeUInt16LE(1, 26);
  header.writeUInt16LE(24, 28);
  const image = decodeImage(Buffer.concat([header, pixels]));
  assert.deepEqual(gridFromImage(image, KEYS).rows, ['rw', '.r']);
  header.writeUInt16LE(8, 28);
  assert.throws(() => decodeImage(Buffer.concat([header, pixels])), /24-bit Bitmap/);
});

test('a colour not in the palette gets a new key and its nearest neighbour', () => {
  const image = imageFromGrid(['rx', 'xr'], { ...KEYS, x: '#d93440' });
  const { rows, added } = gridFromImage(image, KEYS, MAGENTA);
  assert.deepEqual(rows, ['rA', 'Ar']);
  assert.deepEqual(added, [{ key: 'A', colour: '#d93440', nearest: 'r #d9343f' }]);
});

/** A PNG as MS Paint might write it: RGB or palette, every row with its own filter. */
function paintStylePng(width, height, type, depth, rawRows, palette) {
  const chunk = (name, body) => {
    const out = Buffer.alloc(12 + body.length);
    out.writeUInt32BE(body.length, 0);
    out.write(name, 4, 'latin1');
    body.copy(out, 8);
    out.writeUInt32BE(crc32(out.subarray(4, 8 + body.length)), 8 + body.length);
    return out;
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([depth, type, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    ...(palette ? [chunk('PLTE', Buffer.from(palette))] : []),
    chunk('IDAT', deflateSync(Buffer.from(rawRows.flat()))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

test('RGB rows with the sub, up, average and Paeth filters', () => {
  // Two pixels a row, all red (217, 52, 63) then white, each row filtered differently.
  const r = [217, 52, 63];
  const w = [255, 255, 255];
  const rows = [
    [1, ...r, ...w.map((v, i) => (v - r[i]) & 0xff)], // sub
    [2, 0, 0, 0, 0, 0, 0], // up: same as the row above
    [3, ...r.map((v) => (v - (v >> 1)) & 0xff), ...w.map((v, i) => (v - ((r[i] + w[i]) >> 1)) & 0xff)], // average
    [4, 0, 0, 0, 0, 0, 0], // Paeth: picks the pixel above here
  ];
  const image = decodePng(paintStylePng(2, 4, 2, 8, rows));
  assert.deepEqual(gridFromImage(image, KEYS).rows, ['rw', 'rw', 'rw', 'rw']);
});

test('a 4-bit palette PNG', () => {
  // Palette: 0 magenta, 1 red, 2 white; three pixels, two to a byte.
  const image = decodePng(paintStylePng(3, 1, 3, 4, [[0, 0x01, 0x20]], [255, 0, 255, 217, 52, 63, 255, 255, 255]));
  assert.deepEqual(gridFromImage(image, KEYS).rows, ['.rw']);
});

test("the art sheet's import map is the game's", async () => {
  const map = async (file) => (await readFile(new URL(`../${file}`, import.meta.url), 'utf8')).match(/<script type="importmap">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(await map('index.html'));
  assert.deepEqual(JSON.parse(await map('art.html')), JSON.parse(await map('index.html')));
});
