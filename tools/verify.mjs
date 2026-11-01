// Browser checks against the real page, in headless Chromium.
//
//   npm run verify                 all checks
//   node tools/verify.mjs strike   only the checks whose label contains "strike"
//
// Starts its own static server, so it needs nothing else running. Chromium
// only for now, as in SuperRollies (docs/decisions.md, D6). Screenshots of
// each viewport go to dist/verify/ (not tracked) for a look by eye.

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';

const PORT = 8123;
const BASE = `http://localhost:${PORT}/`;
const ONLY = process.argv[2];
const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true };
const ODD_PHONE = { viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true };
const DESKTOP = { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 };

let failures = 0;
function report(name, ok, detail = '') {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  - ' + detail : ''}`);
}

const server = spawn('npx', ['serve', '.', '--listen', String(PORT), '--no-port-switching'], {
  stdio: 'ignore',
  shell: true,
});
await waitForServer();
const browser = await chromium.launch();
await mkdir('dist/verify', { recursive: true });

/**
 * A fresh page at `query`, with page errors collected. `fn` gets the page and
 * a tap helper that taps the middle of the water.
 */
async function check(label, device, query, fn) {
  if (ONLY && !label.includes(ONLY)) return;
  const context = await browser.newContext(device);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  try {
    await page.goto(BASE + query);
    await page.waitForSelector('body[data-phase="idle"]', { timeout: 15000 });
    const tap = async () => {
      const box = await page.locator('#scene').boundingBox();
      const x = box.x + box.width / 2;
      const y = box.y + box.height * 0.45;
      if (device.hasTouch) await page.touchscreen.tap(x, y);
      else await page.mouse.click(x, y);
    };
    await fn(page, tap);
  } catch (e) {
    report(label, false, e.message.split('\n')[0]);
  }
  report(`${label}: no page errors`, errors.length === 0, errors.join(' | '));
  await context.close();
}

for (const [name, device] of [
  ['phone', PHONE],
  ['phone at dpr 2.625', ODD_PHONE],
  ['desktop', DESKTOP],
]) {
  await check(`layout on ${name}`, device, '?seed=1', async (page) => {
    const m = await page.evaluate(() => {
      const c = /** @type {HTMLCanvasElement} */ (document.getElementById('scene'));
      const r = c.getBoundingClientRect();
      return { w: c.width, h: c.height, css: r.width, dpr: devicePixelRatio, vw: innerWidth, vh: innerHeight };
    });
    report(`layout on ${name}: scene drawn at 256×256`, m.w === 256 && m.h === 256, `${m.w}×${m.h}`);
    const devicePx = m.css * m.dpr;
    const scale = devicePx / 256;
    report(
      `layout on ${name}: scaled by a whole number of device pixels`,
      Math.abs(scale - Math.round(scale)) < 0.01 && scale >= 1,
      `×${scale.toFixed(3)}`,
    );
    report(`layout on ${name}: scene fits the screen width`, m.css <= m.vw - 16, `${m.css.toFixed(1)} of ${m.vw}`);
    await page.screenshot({ path: `dist/verify/${name.replace(/\W+/g, '-')}.png` });
  });
}

await check('strike after the splash', PHONE, '?seed=1&wait=700', async (page, tap) => {
  await tap();
  await page.waitForSelector('body[data-phase="waiting"]', { timeout: 2000 });
  await page.waitForSelector('body[data-phase="bite"]', { timeout: 3000 });
  await page.screenshot({ path: 'dist/verify/bite.png' });
  await tap();
  await page.waitForSelector('body[data-phase="done"]', { timeout: 2000 });
  const headline = await page.textContent('#result .headline');
  const detail = await page.textContent('#result .detail');
  report('strike after the splash: an outcome with a roll', /Caught it!|It got away\./.test(headline ?? ''), headline);
  report('strike after the splash: the d20 roll is shown', /d20: \d+/.test(detail ?? ''), detail);
  report('strike after the splash: a quick strike is graded fast', /fast strike/.test(detail ?? ''), detail);
});

await check('strike too early', DESKTOP, '?seed=1&wait=6000', async (page, tap) => {
  await tap();
  await page.waitForSelector('body[data-phase="waiting"]');
  await page.waitForTimeout(300);
  await tap();
  await page.waitForSelector('body[data-phase="done"]', { timeout: 2000 });
  report('strike too early: pulled out', (await page.textContent('#result .headline')) === 'Too early!');
});

await check('no strike: the fish is gone after 3 s', DESKTOP, '?seed=1&wait=500', async (page, tap) => {
  await tap();
  await page.waitForSelector('body[data-phase="bite"]', { timeout: 3000 });
  await page.waitForSelector('body[data-phase="done"]', { timeout: 4000 });
  report('no strike: too slow', (await page.textContent('#result .headline')) === 'Too slow.');
});

await check('keyboard: space casts and strikes', DESKTOP, '?seed=2&wait=600', async (page) => {
  await page.keyboard.press(' ');
  await page.waitForSelector('body[data-phase="bite"]', { timeout: 3000 });
  await page.keyboard.press(' ');
  await page.waitForSelector('body[data-phase="done"]', { timeout: 2000 });
  report('keyboard: a full cast with the space bar', true);
});

await check('?dev shows the timing panel', DESKTOP, '?dev&seed=3', async (page) => {
  report('?dev: panel visible', await page.isVisible('#devPanel'));
  report('?dev: seed shown for replay', /seed=3/.test((await page.textContent('#devSeed')) ?? ''));
});

await browser.close();
server.kill();
console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
process.exit(failures ? 1 : 0);

async function waitForServer() {
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(BASE)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`No server on ${BASE}`);
}
