// Templates for drawing face parts (CR-19, D187, docs/art.md "Face parts"):
//
//   npm run face-template
//
// writes two files into art/:
//   face-template.pdf     A4, two templates a page, one square = one pixel at 2 mm: to print and draw on in pencil
//   face-template-64.png  64×64, transparent but for the guides: a layer to draw under, in Pixel Studio or Paint
//
// Both take their lines from src/scene/faces.js (FACE_GUIDES), so they can't drift from what the game draws: the
// round frame (corners cut off), the oval head, the brow, eye and mouth rows, the shoulders.

import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { chromium } from 'playwright';
import { encodePng } from './sprite-png.mjs';
import { FACE_GUIDES } from '../src/scene/faces.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'art');
const N = 64;

/** @param {number} x @param {number} y  A pixel, sampled at its centre as faces.js does. */
const inCircle = (x, y) => (x + 0.5 - 32) ** 2 + (y + 0.5 - 32) ** 2 <= 32 * 32;
/** @param {(x: number, y: number) => boolean} s */
const filled = (s) => (/** @type {number} */ x, /** @type {number} */ y) => x >= 0 && y >= 0 && x < N && y < N && s(x + 0.5, y + 0.5);
/** @param {number} x @param {number} y */
const inGrid = (x, y) => x >= 0 && y >= 0 && x < N && y < N;
/** The pixels on a shape's edge: in it, with a side touching a pixel that isn't. @param {(x: number, y: number) => boolean} s */
function edge(s) {
  const f = filled(s);
  /** @type {[number, number][]} */
  const out = [];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (f(x, y) && inCircle(x, y) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => inGrid(x + dx, y + dy) && !f(x + dx, y + dy))) out.push([x, y]);
    }
  }
  return out;
}

const head = filled(FACE_GUIDES.head);
const headEdge = edge(FACE_GUIDES.head);
const shoulderEdge = edge(FACE_GUIDES.shoulders);
const ROWS = /** @type {const} */ ([
  ['brow', FACE_GUIDES.brow, '#e08a1e', [224, 138, 30]],
  ['eyes', FACE_GUIDES.eye, '#d0342c', [208, 52, 44]],
  ['mouth', FACE_GUIDES.mouth, '#2f9e4f', [47, 158, 79]],
]);

// ---------- The 64×64 guide ----------

function guidePng() {
  const rgba = new Uint8Array(N * N * 4);
  /** @param {number} x @param {number} y @param {number[]} c @param {number} a */
  const put = (x, y, [r, g, b], a) => rgba.set([r, g, b, a], (y * N + x) * 4);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!inCircle(x, y)) put(x, y, [0, 0, 0], 110);
  for (const [x, y] of shoulderEdge) put(x, y, [80, 180, 255], 90);
  for (const [x, y] of headEdge) put(x, y, [80, 180, 255], 160);
  // The rows only outside the head, so they never sit under an eye or a mouth.
  for (const [, row, , colour] of ROWS) for (let x = 0; x < N; x++) if (inCircle(x, row) && !head(x, row)) put(x, row, [...colour], 150);
  return encodePng({ width: N, height: N, rgba });
}

// ---------- The printed sheet ----------

const MM = 2; // one pixel
const SIZE = N * MM;

/** One template, its top left at (ox, oy) in mm. @param {number} ox @param {number} oy */
function template(ox, oy) {
  const parts = [];
  const cell = (/** @type {number} */ x, /** @type {number} */ y, /** @type {string} */ fill) =>
    `<rect x="${ox + x * MM}" y="${oy + y * MM}" width="${MM}" height="${MM}" fill="${fill}"/>`;
  parts.push(`<text x="${ox}" y="${oy - 4}" font-size="3.6">Face part: ______________________   Name: ______________</text>`);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!inCircle(x, y)) parts.push(cell(x, y, '#e4e4e4'));
  for (const [x, y] of shoulderEdge) parts.push(cell(x, y, '#e3f1fa'));
  for (const [x, y] of headEdge) parts.push(cell(x, y, '#cde6f6'));
  for (let i = 0; i <= N; i++) {
    const major = i % 8 === 0;
    const w = major ? 0.18 : 0.07;
    const c = major ? '#8fa3ad' : '#c9d4d9';
    parts.push(`<line x1="${ox + i * MM}" y1="${oy}" x2="${ox + i * MM}" y2="${oy + SIZE}" stroke="${c}" stroke-width="${w}"/>`);
    parts.push(`<line x1="${ox}" y1="${oy + i * MM}" x2="${ox + SIZE}" y2="${oy + i * MM}" stroke="${c}" stroke-width="${w}"/>`);
    if (major && i < N) {
      parts.push(`<text x="${ox + i * MM + 0.5}" y="${oy - 0.8}" font-size="1.8" fill="#8fa3ad">${i}</text>`);
      parts.push(`<text x="${ox - 1}" y="${oy + i * MM + 1.8}" font-size="1.8" fill="#8fa3ad" text-anchor="end">${i}</text>`);
    }
  }
  // The middle, between pixels 31 and 32.
  parts.push(`<line x1="${ox + 32 * MM}" y1="${oy}" x2="${ox + 32 * MM}" y2="${oy + SIZE}" stroke="#7d8b92" stroke-width="0.25" stroke-dasharray="1.2 1.2"/>`);
  for (const [name, row, colour] of ROWS) {
    const y = oy + (row + 0.5) * MM;
    parts.push(`<line x1="${ox}" y1="${y}" x2="${ox + SIZE}" y2="${y}" stroke="${colour}" stroke-width="0.3" stroke-dasharray="2 1"/>`);
    parts.push(`<text x="${ox - 5}" y="${y + 1}" font-size="2.8" fill="${colour}" text-anchor="end">${name}</text>`);
  }
  parts.push(`<circle cx="${ox + SIZE / 2}" cy="${oy + SIZE / 2}" r="${SIZE / 2}" fill="none" stroke="#555" stroke-width="0.35"/>`);
  return parts.join('');
}

export function sheetHtml() {
  const ox = (210 - SIZE) / 2;
  const note = [
    'One square is one pixel of the 64×64 portrait. Draw inside the circle; the corners are cut off.',
    'Blue: the oval head and the shoulders, which every part fits. One part per template.',
    'Lines and shapes only, no colour: the game swaps colours. Hatch where it should be darker.',
  ];
  return `<!doctype html><meta charset="utf-8"><style>@page{size:A4;margin:0}html,body{margin:0}
svg{display:block;font-family:Arial,Helvetica,sans-serif}</style>
<svg xmlns="http://www.w3.org/2000/svg" width="210mm" height="297mm" viewBox="0 0 210 297">
${note.map((line, i) => `<text x="${ox}" y="${7 + i * 3.4}" font-size="2.6" fill="#555">${line}</text>`).join('')}
${template(ox, 22)}${template(ox, 22 + SIZE + 12)}</svg>`;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  await writeFile(join(OUT, 'face-template-64.png'), guidePng());
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(sheetHtml());
    await page.pdf({ path: join(OUT, 'face-template.pdf'), format: 'A4', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  } finally {
    await browser.close();
  }
  console.log('art/face-template.pdf        print at 100% ("Actual size"), not "Fit to page"');
  console.log('art/face-template-64.png     the guide layer, 64×64');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
