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
    // A fresh browser has no save: take character creation's defaults.
    if (await page.isVisible('#create')) await page.click('#createStart');
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
  report('strike after the splash: a quick strike is graded fast', /Fast strike/.test(detail ?? ''), detail);
  report("strike after the splash: the fish's roll stays hidden", /needed \?/.test(detail ?? ''), detail);
});

await check('junk is landed without a roll', PHONE, '?seed=4&wait=600', async (page, tap) => {
  await tap();
  await page.waitForSelector('body[data-phase="bite"]', { timeout: 3000 });
  await tap();
  await page.waitForSelector('body[data-phase="done"]', { timeout: 2000 });
  report('junk: landed', (await page.textContent('#result .headline')) === 'Got something!');
  report('junk: no d20', !/d20/.test((await page.textContent('#result')) ?? ''));
  const log = (await page.textContent('#log')) ?? '';
  report('junk: in the log', /You found: Bit of scroll parchment\./.test(log), log);
  report('junk: its icon flies to the bag', (await page.locator('.flying-icon').count()) === 1);
  await page.waitForTimeout(150);
  await page.screenshot({ path: 'dist/verify/catch-flight.png' });
  await page.waitForTimeout(1200);
  report('junk: and disappears', (await page.locator('.flying-icon').count()) === 0);
  await page.click('#bags');
  const inv = (await page.textContent('#inventory')) ?? '';
  report('junk: listed in the bags', inv.includes('Bit of scroll parchment') && inv.includes('A stick with some string tied to it'), inv);
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
  report('no strike: the pause', (await page.textContent('#status')) === 'The bobber bobs back up…');
});

await check('a missed splash: pause, cast again, then reel in', DESKTOP, '?seed=1&wait=500', async (page, tap) => {
  await tap();
  await page.waitForSelector('body[data-phase="done"]', { timeout: 5000 });
  await page.waitForSelector('body[data-phase="waiting"]', { timeout: 7000 });
  report('missed splash: the line counts as cast again after the pause', true);
  await page.waitForSelector('body[data-phase="done"]', { timeout: 5000 });
  await page.waitForTimeout(5500);
  report('missed splash: a second miss reels in', (await page.getAttribute('body', 'data-phase')) === 'done');
  report('missed splash: ready to cast', (await page.textContent('#status')) === 'Tap to cast again.');
});

await check('saving', PHONE, '?seed=1&wait=600', async (page, tap) => {
  const who = await page.textContent('#who');
  report('saving: the character is shown', /level 0/.test(who ?? ''), who);
  await tap();
  await page.waitForSelector('body[data-phase="bite"]', { timeout: 3000 });
  await tap();
  await page.waitForSelector('body[data-phase="done"]', { timeout: 2000 });
  report('saving: a cast takes 30 minutes', /08:30/.test((await page.textContent('#where')) ?? ''));
  await page.reload();
  await page.waitForSelector('body[data-phase="idle"]', { timeout: 15000 });
  report('saving: no character creation after a reload', !(await page.isVisible('#create')));
  report('saving: the game is back', /08:30/.test((await page.textContent('#where')) ?? ''));

  await tap();
  await page.waitForSelector('body[data-phase="waiting"]', { timeout: 2000 });
  await page.reload();
  await page.waitForSelector('body[data-phase="idle"]', { timeout: 15000 });
  report('saving: leaving mid-cast voids the cast, no time passes', /08:30/.test((await page.textContent('#where')) ?? ''));
});

await check('new game', DESKTOP, '?seed=5', async (page) => {
  page.on('dialog', (d) => d.accept());
  await page.click('#newGame');
  await page.waitForSelector('#create[open]', { timeout: 2000 });
  await page.click('#createGender label:nth-child(2)');
  await page.click('#createClass label:nth-child(3)');
  const name = await page.inputValue('#createName');
  await page.screenshot({ path: 'dist/verify/character-creation.png' });
  await page.click('#createStart');
  const who = (await page.textContent('#who')) ?? '';
  report('new game: back to character creation, and the choices stick', who.includes('Rogue Fisherwoman') && who.includes(name), who);
});

await check('keyboard: space casts and strikes', DESKTOP, '?seed=2&wait=600', async (page) => {
  await page.keyboard.press(' ');
  await page.waitForSelector('body[data-phase="bite"]', { timeout: 3000 });
  await page.keyboard.press(' ');
  await page.waitForSelector('body[data-phase="done"]', { timeout: 2000 });
  report('keyboard: a full cast with the space bar', true);
});

await check('?dev shows the bench', DESKTOP, '?dev&seed=3', async (page) => {
  report('?dev: panel visible', await page.isVisible('#devPanel'));
  await page.click('#devPanel summary');
  report('?dev: seed shown for replay', /seed=3/.test((await page.textContent('#devBench')) ?? ''));
  report('?dev: game values shown', (await page.inputValue('#dev-strikeLimit')) === '3000');
  await page.fill('#dev-strikeLimit', '4000');
  await page.press('#dev-strikeLimit', 'Enter');
  await page.click('body', { position: { x: 5, y: 5 } });
  report('?dev: a value can be changed', (await page.inputValue('#dev-strikeLimit')) === '4000');
  report('?dev: an empty bucket button', await page.isVisible('text=Empty bucket'));
  await page.screenshot({ path: 'dist/verify/dev-bench.png', fullPage: true });
});

await check('the buff bar', DESKTOP, '?dev&seed=3', async (page) => {
  await page.click('#devPanel summary');
  await page.click('text=+ Fish Find buff, 3 casts');
  await page.click('text=+ Fish Find buff, 2 min');
  await page.click('text=+ debuff, 90 s');
  report('buff bar: two buffs, one debuff', (await page.locator('.buffs .buff').count()) === 2 && (await page.locator('.debuffs .buff').count()) === 1);
  const corners = await page.locator('.buff-left').allTextContents();
  report('buff bar: casts and time in the corner', corners.join(' ') === '3 2m 2m', corners.join(' '));
  await page.hover('.buffs .buff >> nth=0');
  report('buff bar: hovering describes it', /\+20 Fish Find/.test((await page.textContent('.buff-tip')) ?? ''));
  await page.screenshot({ path: 'dist/verify/buff-bar.png' });
  await page.click('.debuffs .buff', { button: 'right' });
  report("buff bar: a debuff can't be cancelled", (await page.locator('.debuffs .buff').count()) === 1);
  await page.click('.buffs .buff >> nth=0', { button: 'right' });
  report('buff bar: right-click cancels a buff', (await page.locator('.buffs .buff').count()) === 1);
  await page.click('.buffs .buff >> nth=0');
  report('buff bar: a click on it is not a cast', (await page.getAttribute('body', 'data-phase')) === 'idle');
});

await check('surface features', PHONE, '?dev&seed=3&wait=600', async (page) => {
  await page.click('#devPanel summary');
  await page.selectOption('#dev-feature', 'roach-school');
  await page.click('text=Spawn in the middle');
  await page.locator('#scene').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'dist/verify/surface-feature.png' });
  // Cast at the middle of the scene (128, 100), where the school is.
  const box = await page.locator('#scene').boundingBox();
  await page.touchscreen.tap(box.x + (box.width * 128) / 256, box.y + (box.height * 100) / 256);
  await page.waitForSelector('body[data-phase="waiting"]', { timeout: 2000 });
  const log = (await page.textContent('#log')) ?? '';
  report('surface features: landing in a school says so', log.includes('Your bobber lands in a school of roach.'), log);
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
