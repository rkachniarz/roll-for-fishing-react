// @ts-check
// The game's name on the title screen (D134), a first logo until the owner's:
// ROLL big, its O left open for the player's d20 to roll into and land on 20,
// and "for fishing" under it, smaller, the same width. Set in Pixelify Sans
// (the Pixel font, D132) on a canvas and cut to hard pixels: every pixel
// fully on or off, outlined, with a drop shadow.

/** Colours: the name's gold (the page's --accent), the smaller line's cream, the outline. */
const GOLD = '#ffd36b';
const GOLD_DARK = '#d99a2b';
const CREAM = '#fbf1d3';
const INK = '#2a1a10';
const FONT = '"Pixelify Sans", monospace';

/**
 * Text cut to hard pixels: which pixels it covers, on a canvas `pad` larger all round.
 * @param {string} text
 * @param {string} font
 * @param {number} pad
 */
function mask(text, font, pad) {
  const probe = /** @type {CanvasRenderingContext2D} */ (document.createElement('canvas').getContext('2d'));
  probe.font = font;
  const m = probe.measureText(text);
  const w = Math.ceil(m.actualBoundingBoxLeft + m.actualBoundingBoxRight) + pad * 2;
  const h = Math.ceil(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) + pad * 2;
  const c = Object.assign(document.createElement('canvas'), { width: w, height: h });
  const ctx = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d', { willReadFrequently: true }));
  ctx.font = font;
  ctx.fillStyle = '#000';
  ctx.fillText(text, pad + m.actualBoundingBoxLeft, pad + m.actualBoundingBoxAscent);
  const data = ctx.getImageData(0, 0, w, h).data;
  const on = new Uint8Array(w * h);
  for (let i = 0; i < on.length; i++) on[i] = data[i * 4 + 3] >= 128 ? 1 : 0;
  // The ink's own box, to trim the padding the font leaves.
  let x0 = w, x1 = -1, y0 = h, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!on[y * w + x]) continue;
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  return { on, w, h, box: { x0, y0, x1, y1 } };
}

/**
 * Draws a mask onto `ctx` at (x, y) (its box's top left): a shadow a pixel
 * right and two down, the outline all round, then the fill, the bottom
 * `lower` rows in `fill2`.
 * @param {CanvasRenderingContext2D} ctx
 * @param {ReturnType<typeof mask>} m
 * @param {number} x @param {number} y
 * @param {string} fill @param {string} fill2 @param {number} lower
 */
function stamp(ctx, m, x, y, fill, fill2, lower) {
  const { on, w, h, box } = m;
  const at = (/** @type {number} */ i, /** @type {number} */ j) => i >= 0 && j >= 0 && i < w && j < h && on[j * w + i] === 1;
  const px = (/** @type {number} */ i, /** @type {number} */ j) => ctx.fillRect(x + i - box.x0, y + j - box.y0, 1, 1);
  ctx.fillStyle = INK;
  for (let j = -1; j <= h + 2; j++) for (let i = -1; i <= w + 1; i++) {
    const edge = at(i - 1, j) || at(i + 1, j) || at(i, j - 1) || at(i, j + 1);
    if (at(i - 1, j - 2) || (!at(i, j) && edge)) px(i, j);
  }
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    if (!at(i, j)) continue;
    ctx.fillStyle = j > box.y1 - lower ? fill2 : fill;
    px(i, j);
  }
}

/**
 * The logo, for a die `die` pixels across in place of the O.
 * @param {number} die
 * @returns {Promise<{ canvas: HTMLCanvasElement, dieAt: { x: number, y: number } }>}
 *   `dieAt`: the die's middle, on the canvas.
 */
export async function paintLogo(die) {
  // The font comes from Google Fonts with the page (D132); it may not be
  // loaded yet if the Clear font is chosen. Without it, monospace.
  try {
    await document.fonts.load(`600 40px ${FONT}`);
  } catch {
    // The fallback's fine.
  }
  // ROLL's letters as tall as the die, less a little.
  const cap = die - 4;
  let size = cap;
  let r = mask('R', `600 ${size}px ${FONT}`, 2);
  size = Math.round((size * cap) / (r.box.y1 - r.box.y0 + 1));
  r = mask('R', `600 ${size}px ${FONT}`, 2);
  const l = mask('L', `600 ${size}px ${FONT}`, 2);
  const gap = Math.max(3, Math.round(size / 10));
  const rw = r.box.x1 - r.box.x0 + 1;
  const lw = l.box.x1 - l.box.x0 + 1;
  const capH = r.box.y1 - r.box.y0 + 1;
  const wide = rw + gap + die + gap + lw + gap + lw;
  // "for fishing" as wide as ROLL: the size that fits, then letter by letter
  // spread to the last pixel.
  let small = 16;
  let line = mask('for fishing', `400 ${small}px ${FONT}`, 2);
  small = Math.max(8, Math.floor((small * wide) / (line.box.x1 - line.box.x0 + 1)) - 1);
  for (; small > 8; small--) {
    line = mask('for fishing', `400 ${small}px ${FONT}`, 2);
    if (line.box.x1 - line.box.x0 + 1 <= wide) break;
  }
  // Each letter cut on its own, so they can be spread to the full width;
  // `rise`: how far its top is above the baseline.
  const font = `400 ${small}px ${FONT}`;
  const probe = /** @type {CanvasRenderingContext2D} */ (document.createElement('canvas').getContext('2d'));
  probe.font = font;
  const letters = [...'for fishing'].map((ch) => {
    if (ch === ' ') return null;
    const m = mask(ch, font, 2);
    return { m, w: m.box.x1 - m.box.x0 + 1, rise: 2 + probe.measureText(ch).actualBoundingBoxAscent - m.box.y0, h: m.box.y1 - m.box.y0 + 1 };
  });
  const rise = Math.max(...letters.map((c) => (c ? Math.round(c.rise) : 0)));
  const fall = Math.max(...letters.map((c) => (c ? c.h - Math.round(c.rise) : 0)));
  const between = Math.max(4, Math.round(cap / 7));
  const top = 2;
  const lineTop = top + die + between;
  const canvas = Object.assign(document.createElement('canvas'), { width: wide + 4, height: lineTop + rise + fall + 4 });
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  const capTop = top + Math.round((die - capH) / 2);
  let x = 1;
  stamp(ctx, r, x, capTop, GOLD, GOLD_DARK, Math.round(capH / 3));
  x += rw + gap;
  const dieAt = { x: x + Math.floor(die / 2), y: top + Math.floor(die / 2) };
  x += die + gap;
  stamp(ctx, l, x, capTop, GOLD, GOLD_DARK, Math.round(capH / 3));
  x += lw + gap;
  stamp(ctx, l, x, capTop, GOLD, GOLD_DARK, Math.round(capH / 3));

  // The spare width shared out between the letters, the space getting three
  // shares, so the line ends where ROLL does.
  const baseline = lineTop + rise;
  const inkW = letters.reduce((sum, c) => sum + (c ? c.w : 0), 0);
  const shares = letters.length;
  const spare = wide - inkW;
  let used = 0;
  x = 1;
  letters.forEach((c, i) => {
    if (c) {
      stamp(ctx, c.m, x, baseline - Math.round(c.rise), CREAM, CREAM, 0);
      x += c.w;
    }
    if (i === letters.length - 1) return;
    const n = c ? 1 : 2;
    const next = Math.round((spare * (used + n)) / shares) - Math.round((spare * used) / shares);
    used += n;
    x += next;
  });
  return { canvas, dieAt };
}
