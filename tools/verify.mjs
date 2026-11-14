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
import { mkdir, readFile } from 'node:fs/promises';
import { decodePng } from './sprite-png.mjs';

const PORT = 8123;
const BASE = `http://localhost:${PORT}/`;
const ONLY = process.argv[2];
const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true };
const ODD_PHONE = { viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true };
// The owner's Pixel 9 Pro at its default "High resolution" (960 device pixels across), as read off a screenshot.
const PIXEL = { viewport: { width: 427, height: 830 }, deviceScaleFactor: 2.25, isMobile: true, hasTouch: true };
const DESKTOP = { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 };

let failures = 0;
function report(name, ok, detail = '') {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  - ' + detail : ''}`);
}

/** The log's lines, as text. */
const logText = async (page) => (await page.textContent('#log')) ?? '';
/** The game's clock, which the page keeps out of sight (R16.4). */
const clockShown = (page) => page.getAttribute('#world', 'data-clock');
const closePane = async (page) => {
  if (await page.isVisible('#pane')) await page.click('#paneClose');
};
/**
 * The welcome at the start of a new game (R17.3): its last choices, each
 * after the dialog's 400 ms guard, until it closes.
 */
const passWelcome = async (page) => {
  try {
    await page.waitForSelector('#event[open]', { timeout: 2000 });
  } catch {
    return;
  }
  for (let i = 0; i < 6 && (await page.isVisible('#event[open]')); i++) {
    await page.waitForTimeout(450);
    await page.click('#eventChoices button:last-child');
  }
};
/** From the title screen: New game, a slot, and character creation's defaults; past the welcome. */
const newGameIn = async (page, slot) => {
  await page.click('#titleNew');
  await page.click(`#slot-${slot}`);
  await page.click('#createStart');
  await passWelcome(page);
};
/** From the title screen: Load game, a slot. */
const loadFrom = async (page, slot) => {
  await page.waitForSelector('#title[open]', { timeout: 15000 });
  await page.click('#titleLoad');
  await page.click(`#slot-${slot}`);
};
/** Opens the dev bench from the menu. */
const openBench = async (page) => {
  await page.click('#menu');
  await page.click('#openBench');
};

const server = spawn('npx', ['serve', '.', '--listen', String(PORT), '--no-port-switching'], {
  stdio: 'ignore',
  shell: true,
});
await waitForServer();
const browser = await chromium.launch();
await mkdir('dist/verify', { recursive: true });

/**
 * A fresh page at `query`, with page errors collected. `fn` gets the page and
 * a tap helper that taps the middle of the water. With `query` null, `fn`
 * opens its own page.
 */
async function check(label, device, query, fn) {
  if (ONLY && !label.includes(ONLY)) return;
  const context = await browser.newContext(device);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  try {
    // A null query: a page other than the game (the content editor), which `fn` opens.
    if (query !== null) {
      await page.goto(BASE + query);
      await page.waitForSelector('body[data-phase="idle"]', { timeout: 15000 });
      // A fresh browser has no save: a new game in slot 1, with character creation's defaults.
      await newGameIn(page, 1);
    }
    const tap = async () => {
      const box = await page.locator('#scene').boundingBox();
      const x = box.x + box.width / 2;
      const y = box.y + box.height * 0.45;
      if (device.hasTouch) await page.touchscreen.tap(x, y);
      else await page.mouse.click(x, y);
    };
    await fn(page, tap);
  } catch (e) {
    // The first line, and what was in the way if something was.
    const lines = e.message.split('\n');
    report(label, false, [lines[0], ...lines.filter((l) => /intercepts|not visible|not stable/.test(l)).slice(-1)].join(' | '));
  }
  report(`${label}: no page errors`, errors.length === 0, errors.join(' | '));
  await context.close();
}

for (const [name, device] of [
  ['phone', PHONE],
  ['phone at dpr 2.625', ODD_PHONE],
  ['Pixel 9 Pro', PIXEL],
  ['desktop', DESKTOP],
]) {
  await check(`layout on ${name}`, device, '?seed=1', async (page) => {
    const m = await page.evaluate(() => {
      const c = /** @type {HTMLCanvasElement} */ (document.getElementById('scene'));
      const r = c.getBoundingClientRect();
      return { w: c.width, h: c.height, css: r.width, cssH: r.height, dpr: devicePixelRatio, vw: innerWidth, vh: innerHeight };
    });
    // 256 tall, and 256 to 320 wide: strips either side of the play area (D93).
    report(`layout on ${name}: scene drawn 256 tall, 256-320 wide`, m.h === 256 && m.w >= 256 && m.w <= 320, `${m.w}×${m.h}`);
    const scale = (m.cssH * m.dpr) / 256;
    report(
      `layout on ${name}: scaled by a whole number of device pixels`,
      Math.abs(scale - Math.round(scale)) < 0.01 && scale >= 1 && Math.abs((m.css * m.dpr) / m.w - scale) < 0.01,
      `×${scale.toFixed(3)}`,
    );
    report(`layout on ${name}: scene fits the screen width`, m.css <= m.vw - 4, `${m.css.toFixed(1)} of ${m.vw}`);
    if (device.isMobile) {
      // Less the margins and border, the scene loses under one scale step.
      report(`layout on ${name}: scene fills the width`, m.css >= m.vw - 8 - Math.round(scale) / m.dpr, `${m.css.toFixed(1)} of ${m.vw}`);
    }
    const hud = await page.evaluate(() => {
      const box = (/** @type {string} */ sel) => /** @type {Element} */ (document.querySelector(sel)).getBoundingClientRect();
      const buttons = [...document.querySelectorAll('.bar .bar-button')].map((b) => b.getBoundingClientRect());
      return {
        square: buttons.every((b) => Math.abs(b.width - b.height) < 1),
        inside: buttons.every((b) => b.left >= 0 && b.right <= innerWidth && b.bottom <= innerHeight),
        log: box('#log').height,
        logBottom: box('.log-frame').bottom,
        scroll: document.documentElement.scrollWidth - innerWidth,
        vh: innerHeight,
      };
    });
    report(`layout on ${name}: the row's buttons are square and on screen`, hud.square && hud.inside);
    report(`layout on ${name}: the log has room and ends on screen`, hud.log >= 100 && hud.logBottom <= hud.vh, `${hud.log.toFixed(0)} px tall`);
    report(`layout on ${name}: no sideways scrolling`, hud.scroll <= 0, `${hud.scroll} px`);
    await page.screenshot({ path: `dist/verify/${name.replace(/\W+/g, '-')}.png` });
  });
}

await check('panes over the scene', PHONE, '?seed=1', async (page) => {
  for (const id of ['player', 'journal', 'map', 'bucket', 'menu']) {
    await page.click(`#${id}`);
    const open = (await page.isVisible('#pane')) && (await page.getAttribute(`#${id}`, 'aria-pressed')) === 'true';
    report(`panes: ${id} opens`, open);
    await page.screenshot({ path: `dist/verify/pane-${id}.png` });
  }
  // The menu is a box in the middle of the scene, and no line goes out past it (D94).
  const centred = await page.evaluate(() => {
    const p = /** @type {Element} */ (document.getElementById('pane')).getBoundingClientRect();
    const s = /** @type {Element} */ (document.getElementById('scene')).getBoundingClientRect();
    return Math.abs(p.left + p.width / 2 - (s.left + s.width / 2)) < 2 && Math.abs(p.top + p.height / 2 - (s.top + s.height / 2)) < 2;
  });
  report('panes: the menu sits in the middle of the scene', centred);
  const box = await page.locator('#scene').boundingBox();
  await page.touchscreen.tap(box.x + 12, box.y + 12);
  await page.keyboard.press('Space');
  await page.waitForTimeout(200);
  report('panes: no casting with the menu open', (await page.getAttribute('body', 'data-phase')) === 'idle');
  await page.click('#menu');
  report('panes: a second tap closes it', !(await page.isVisible('#pane')));
  await page.click('#journal');
  await page.click('#paneClose');
  report('panes: the close button closes it', !(await page.isVisible('#pane')));
  // The bag is its own pane, over the log, open alongside the others (D83).
  await page.click('#bag');
  await page.click('#bucket');
  report('panes: the bag stays open beside another pane', (await page.isVisible('#bagPane')) && (await page.isVisible('#pane')));
  report('panes: the bag button shows it is open', (await page.getAttribute('#bag', 'aria-pressed')) === 'true');
  await page.screenshot({ path: 'dist/verify/pane-bag.png' });
  const names = await page.locator('#bagPane .tab').allTextContents();
  report('panes: the bag has its four tabs', names.join(',') === 'Equipment,Consumables,Stuff,Junk', names.join(','));
  await page.click('#bagClose');
  report('panes: the bag closes on its own', !(await page.isVisible('#bagPane')) && (await page.isVisible('#pane')));
});

await check('the map: going to another spot (D101)', PHONE, '?seed=1', async (page) => {
  await page.click('#map');
  report('map: the reedy shore is where a new game starts', (await page.textContent('.map-spot[aria-pressed="true"]')) === 'the reedy shore');
  // A new game knows each location's first spot; the rest are noticed later (R11.8).
  const shown = await page.locator('.map-spot').allTextContents();
  // The town is on the map only once night has pointed the way (R17.3).
  report('map: only the spots known of', shown.join(', ') === 'the reedy shore, the upper river', shown.join(', '));
  await page.click('.map-spot:has-text("the upper river")');
  report('map: a tap moves there', (await logText(page)).includes('You move to the upper river.'));
  report('map: and the pane shows it', (await page.textContent('.map-spot[aria-pressed="true"]')) === 'the upper river');
  await page.screenshot({ path: 'dist/verify/map.png' });
});

await check('the content editor (7.5)', DESKTOP, null, async (page) => {
  const fork = await readFile('content/items/bent-fork.json', 'utf8');
  const frog = await readFile('content/events/frog.md', 'utf8');
  // The browser's own private folder stands in for the picker: a content folder with two files.
  await page.goto(`http://localhost:${PORT}/editor.html`);
  await page.evaluate(async ({ fork, frog }) => {
    const opfs = await navigator.storage.getDirectory();
    const content = await opfs.getDirectoryHandle('content', { create: true });
    const put = async (/** @type {string} */ dir, /** @type {string} */ name, /** @type {string} */ text) => {
      const w = await (await (await content.getDirectoryHandle(dir, { create: true })).getFileHandle(name, { create: true })).createWritable();
      await w.write(text);
      await w.close();
    };
    await put('items', 'bent-fork.json', fork);
    await put('events', 'frog.md', frog);
    /** @type {any} */ (window).showDirectoryPicker = async () => opfs;
  }, { fork, frog });
  await page.click('#openFolder');
  await page.click('nav button:has-text("items")');
  await page.click('#files button:has-text("bent-fork")');
  // The form draws once the schemas have loaded.
  await page.waitForSelector('.field > label', { timeout: 5000 });
  await page.screenshot({ path: 'dist/verify/editor-item.png' });
  const label = await page.locator('.field > label').allTextContents();
  report('editor: a form from the item schema', label.includes('name') && label.includes('rarity'), label.join(', '));
  await page.fill('.field:has(> label:text-is("name")) input', 'Bent fork, edited');
  await page.dispatchEvent('.field:has(> label:text-is("name")) input', 'change');
  report('editor: a field typed in marks the file changed', ((await page.textContent('#status')) ?? '').includes('changed, not saved'));
  await page.click('#save');
  // ": saved." exactly: "changed, not saved" holds the word too.
  await page.waitForSelector('#status:has-text(": saved.")', { timeout: 3000 });
  const saved = await page.evaluate(async () => {
    const opfs = await navigator.storage.getDirectory();
    const file = await (await (await (await opfs.getDirectoryHandle('content')).getDirectoryHandle('items')).getFileHandle('bent-fork.json')).getFile();
    return file.text();
  });
  const data = JSON.parse(saved);
  report('editor: saved into the file, the rest kept', data.name === 'Bent fork, edited' && data.id === 'bent-fork' && saved.endsWith('}\n'), JSON.stringify([data.name, data.id, saved.slice(-3)]));
  report('editor: its keys in their order', Object.keys(data).join() === Object.keys(JSON.parse(fork)).join());
  await page.click('nav button:has-text("events")');
  await page.click('#files button:has-text("frog")');
  report('editor: an event as text', ((await page.inputValue('textarea.event')) ?? '').startsWith('---\nid: frog'));
  await page.screenshot({ path: 'dist/verify/editor.png' });
});

await check('each spot looks different until painted (4.2)', PHONE, '?dev&seed=1', async (page) => {
  /** @type {string[]} */
  const looks = [];
  for (const [location, spot] of [['lake', 'reedy-shore'], ['lake', 'swamp'], ['lake', 'rocky-shore'], ['lake', 'deep-water'], ['river', 'upper-river'], ['river', 'river-mouth'], ['mage-tower', 'the-first-pool']]) {
    await openBench(page);
    await page.selectOption('#dev-location', location);
    await page.selectOption('#dev-spot', spot);
    await page.waitForTimeout(300);
    // The look painted, to compare (the water moves, so two pictures of one spot differ too).
    looks.push((await page.getAttribute('body', 'data-spot-look')) ?? 'null');
    // The swamp's ghost greets every arrival (owner's item 24): its dialog is
    // passed after the look is read, since backing away leaves the swamp.
    if (await page.isVisible('#event[open]')) {
      await page.waitForTimeout(450);
      await page.click('#eventChoices button:last-child');
    } else {
      await closePane(page);
      await page.waitForTimeout(300);
      // The scene alone, to look at.
      await page.locator('canvas').first().screenshot({ path: `dist/verify/spot-${spot}.png` });
    }
  }
  report(
    'each spot looks different until painted: seven spots, seven looks',
    // Reedy Shore is the plain scene: no look is its look, so null may come once.
    new Set(looks).size === looks.length,
    `${new Set(looks).size} different`,
  );
});

await check('strike after the splash', PHONE, '?seed=1&wait=700', async (page, tap) => {
  await tap();
  await page.waitForSelector('body[data-phase="waiting"]', { timeout: 2000 });
  await page.waitForSelector('body[data-phase="bite"]', { timeout: 3000 });
  await page.screenshot({ path: 'dist/verify/bite.png' });
  await tap();
  await page.waitForSelector('body[data-phase="done"]', { timeout: 2000 });
  const floated = (await page.textContent('.floater')) ?? '';
  await page.waitForTimeout(250);
  await page.screenshot({ path: 'dist/verify/strike-floater.png' });
  await page.waitForSelector('body:not([data-dice])', { timeout: 3000 });
  const log = await logText(page);
  const detail = await page.textContent('#log .roll');
  report('strike after the splash: an outcome with a roll', /You caught: \[.*\]|got away!/.test(log), log);
  report('strike after the splash: the d20 roll is shown', /d20: \d+/.test(detail ?? ''), detail);
  report('strike after the splash: "Fast strike!" floats over the bobber', floated === 'Fast strike!', floated);
  report('strike after the splash: no milliseconds anywhere', !/ ms\b/.test(log + floated), log);
  const gone = await page.waitForFunction(() => document.querySelectorAll('.floater').length === 0, null, { timeout: 4000 }).then(() => true, () => false);
  report('strike after the splash: the words fade and go', gone);
  report("strike after the splash: the fish's roll stays hidden", /needed \?/.test(detail ?? ''), detail);
});

await check("the fish's roll from level 1", PHONE, '?dev&seed=1&wait=600', async (page, tap) => {
  await openBench(page);
  await page.fill('#dev-xp', '10');
  await page.press('#dev-xp', 'Enter');
  await page.fill('#dev-fishFind', '100');
  await page.press('#dev-fishFind', 'Enter');
  await closePane(page);
  await tap();
  await page.waitForSelector('body[data-phase="bite"]', { timeout: 3000 });
  await tap();
  await page.waitForSelector('body[data-phase="done"]', { timeout: 2000 });
  await page.waitForSelector('body:not([data-dice])', { timeout: 3000 });
  const detail = (await page.textContent('#log .roll')) ?? '';
  report("the fish's roll from level 1: the number it needed is shown", /needed \d+\./.test(detail), detail);
});

await check('advantage shows both dice', PHONE, '?dev&seed=1&wait=600', async (page, tap) => {
  await openBench(page);
  for (const [name, value] of [['fishFind', '100'], ['playerVantage', '1']]) {
    await page.fill(`#dev-${name}`, value);
    await page.press(`#dev-${name}`, 'Enter');
  }
  await closePane(page);
  await tap();
  await page.waitForSelector('body[data-phase="bite"]', { timeout: 3000 });
  await tap();
  await page.waitForSelector('body[data-phase="done"]', { timeout: 2000 });
  await page.waitForSelector('body:not([data-dice])', { timeout: 3000 });
  const detail = (await page.textContent('#log .roll')) ?? '';
  const dropped = Number(await page.textContent('#log .roll s'));
  const kept = Number(/d20: \d+ (\d+)/.exec(detail)?.[1]);
  report('advantage: the die that did not count is struck through, before the one that did', dropped >= 1 && kept >= dropped, detail);
});

await check('dice roll over the scene, then the catch flies (D99)', PHONE, '?dev&seed=1&wait=600', async (page, tap) => {
  await openBench(page);
  for (const [name, value] of [['fishFind', '100'], ['playerVantage', '1']]) {
    await page.fill(`#dev-${name}`, value);
    await page.press(`#dev-${name}`, 'Enter');
  }
  await closePane(page);
  await tap();
  await page.waitForSelector('body[data-phase="bite"]', { timeout: 3000 });
  await tap();
  await page.waitForSelector('body[data-phase="done"]', { timeout: 2000 });
  report('dice: out while they roll', (await page.locator('body[data-dice]').count()) === 1);
  report('dice: the roll waits for them to land', (await page.locator('#log .roll').count()) === 0);
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'dist/verify/dice-rolling.png' });
  await page.waitForSelector('#log .roll', { timeout: 2000 });
  await page.waitForTimeout(150);
  await page.screenshot({ path: 'dist/verify/dice-landed.png' });
  const detail = (await page.textContent('#log .roll')) ?? '';
  const total = /= (\d+)/.exec(detail)?.[1];
  const floated = await page.locator('.floater.roll, .floater.crit').allTextContents();
  report('dice: the total floats up over the die', total !== undefined && floated.includes(total), `${floated} vs ${detail}`);
  report('dice: no catch flies before they go', (await page.locator('.flying-icon').count()) === 0);
  await page.waitForSelector('body:not([data-dice])', { timeout: 3000 });
  report('dice: then the catch flies', (await page.locator('.flying-icon').count()) === 1 || !/You caught/.test(await logText(page)));
});

await check("the fish's dice, once its roll shows (6.8)", PHONE, '?dev&seed=1&wait=600', async (page, tap) => {
  await openBench(page);
  for (const [name, value] of [['xp', '10'], ['fishFind', '100'], ['fishVantage', '1']]) {
    await page.fill(`#dev-${name}`, value);
    await page.press(`#dev-${name}`, 'Enter');
  }
  await closePane(page);
  await tap();
  await page.waitForSelector('body[data-phase="bite"]', { timeout: 3000 });
  await tap();
  await page.waitForSelector('#log .roll', { timeout: 3000 });
  await page.waitForTimeout(150);
  await page.screenshot({ path: 'dist/verify/fish-dice.png' });
  const detail = (await page.textContent('#log .roll')) ?? '';
  const needed = /needed (\d+)/.exec(detail)?.[1];
  const floated = await page.locator('.floater.fish').allTextContents();
  report("the fish's dice: its total floats over its die", needed !== undefined && floated.includes(needed), `${floated} vs ${detail}`);
});

await check('perks: a badge, then a choice in the character pane', PHONE, '?dev&seed=1', async (page) => {
  await openBench(page);
  await page.selectOption('#dev-class', 'fish-fighter');
  await page.fill('#dev-xp', '50');
  await page.press('#dev-xp', 'Enter');
  await closePane(page);
  report('perks: the character button shows a badge for a perk to choose', await page.locator('#player.badge').isVisible());
  await page.click('#player');
  const heading = (await page.textContent('#perkChoice h3')) ?? '';
  report('perks: level 1 gave its perk; the choice is for level 2', /level 2/.test(heading), heading);
  report('perks: Learn waits for a pick', await page.isDisabled('#learnPerk'));
  await page.click('#perkChoice .perk >> nth=0');
  await page.click('#learnPerk');
  await page.click('#perkChoice [data-perk="heavy-hand"]');
  await page.screenshot({ path: 'dist/verify/perk-choice.png' });
  await page.click('#learnPerk');
  report('perks: every level chosen, the choice goes', (await page.locator('#perkChoice').count()) === 0);
  report('perks: three perks taken', (await page.locator('#perksTaken li').count()) === 3);
  report('perks: the badge goes', (await page.locator('#player.badge').count()) === 0);
  const log = await logText(page);
  report('perks: the log says what was learnt', /You learn Jump In..*You learn Heavy Hand./s.test(log), log);
  await page.screenshot({ path: 'dist/verify/perks-taken.png' });
});

/** From the bench: a warrior at level 3, with Battle Focus as the level-3 pick. */
async function warriorAtLevel3(page) {
  await openBench(page);
  await page.selectOption('#dev-class', 'fish-fighter');
  await page.fill('#dev-xp', '50');
  await page.press('#dev-xp', 'Enter');
  await closePane(page);
  await page.click('#player');
  await page.click('#perkChoice .perk >> nth=0');
  await page.click('#learnPerk');
  await page.click('#perkChoice [data-perk="battle-focus"]');
  await page.click('#learnPerk');
  await closePane(page);
}

await check('action bar: on the scene, a next-cast ability and its cooldown', PHONE, '?dev&seed=1&wait=600', async (page, tap) => {
  report('action bar: hidden before any ability', await page.isHidden('#actions'));
  const sceneBefore = await page.locator('#scene').boundingBox();
  await warriorAtLevel3(page);
  report('action bar: two abilities', (await page.locator('#actions .action').count()) === 2);
  const actions = await page.locator('#actions').boundingBox();
  const wrap = await page.locator('#sceneWrap').boundingBox();
  // D120: drawn on the scene's bottom left, inside it with a margin.
  report(
    'action bar: on the scene, bottom left',
    actions.x > wrap.x && actions.x < wrap.x + 20 && actions.y + actions.height < wrap.y + wrap.height && actions.y + actions.height > wrap.y + wrap.height - 20,
    `${JSON.stringify(actions)} in ${JSON.stringify(wrap)}`,
  );
  const sceneAfter = await page.locator('#scene').boundingBox();
  report('action bar: the scene keeps its size', sceneAfter.width === sceneBefore.width && sceneAfter.height === sceneBefore.height);
  report('action bar: Jump In is greyed out until something lights it', await page.locator('[data-ability="jump-in"].unusable').isVisible());
  await page.tap('[data-ability="battle-focus"]');
  report('action bar: a used next-cast ability is armed and on the buff bar', await page.locator('[data-ability="battle-focus"].armed').isVisible() && (await page.locator('#buffBar .buff[data-id="battle-focus"]').count()) === 1);
  await page.screenshot({ path: 'dist/verify/action-bar.png' });
  await tap();
  await page.waitForSelector('body[data-phase="bite"]', { timeout: 3000 });
  await tap();
  await page.waitForSelector('body[data-phase="done"]', { timeout: 2000 });
  await page.waitForSelector('body:not([data-dice])', { timeout: 3000 });
  const detail = (await page.textContent('#log .roll')) ?? '';
  const left = (await page.textContent('[data-ability="battle-focus"] .action-cd')) ?? '';
  report('action bar: after an attempt, the cooldown shows the casts left', left === '6', left);
  report('action bar: the buff did its job', /Battle Focus/.test(detail) || !/d20/.test(detail), detail);
});

await check('action bar: Jump In lights up when a fish gets away', PHONE, '?dev&seed=1&wait=600', async (page, tap) => {
  await warriorAtLevel3(page);
  await openBench(page);
  for (const [name, value] of [['fishFind', '100'], ['fishDifficulty', '99']]) {
    await page.fill(`#dev-${name}`, value);
    await page.press(`#dev-${name}`, 'Enter');
  }
  await closePane(page);
  // A strike against an impossible fish, until one gets away (a natural 20 still lands it).
  for (let i = 0; i < 4; i++) {
    await tap();
    await page.waitForSelector('body[data-phase="bite"]', { timeout: 3000 });
    await tap();
    await page.waitForSelector('body[data-phase="done"]', { timeout: 2000 });
    await page.waitForSelector('body:not([data-dice])', { timeout: 3000 });
    if (/got away/.test(await logText(page))) break;
    await page.waitForTimeout(600);
  }
  report('action bar: Jump In glows', await page.locator('[data-ability="jump-in"].lit').isVisible());
  await page.screenshot({ path: 'dist/verify/action-lit.png' });
  const bucket = await page.getAttribute('#bucket', 'aria-label');
  await page.keyboard.press('1');
  const log = await logText(page);
  // Jump In is the dive now (D128): under the water, with a time limit.
  report('action bar: key 1 uses it, and the Fighter dives', /You use Jump In\.You dive in after it!/.test(log) && (await page.isVisible('#diveTimer')), log.slice(-160));
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'dist/verify/dive.png' });
  report('action bar: then it cools down', (await page.textContent('[data-ability="jump-in"] .action-cd')) === '10');
  report('action bar: no longer lit', (await page.locator('[data-ability="jump-in"].lit').count()) === 0, bucket ?? '');
});

await check('junk is landed without a roll', PHONE, '?seed=4&wait=600', async (page, tap) => {
  await tap();
  await page.waitForSelector('body[data-phase="bite"]', { timeout: 3000 });
  await tap();
  await page.waitForSelector('body[data-phase="done"]', { timeout: 2000 });
  await page.waitForSelector('body:not([data-dice])', { timeout: 3000 });
  const log = await logText(page);
  report('junk: no d20', !/d20/.test(log), log);
  // Whichever junk this seed brings up: the check doesn't change when the junk list does.
  const junk = /You caught: \[([^\]]+)\]/.exec(log)?.[1] ?? '';
  report('junk: in the log as a link', junk !== '', log);
  report('junk: its icon flies to the bag', (await page.locator('.flying-icon').count()) === 1);
  await page.waitForTimeout(150);
  await page.screenshot({ path: 'dist/verify/catch-flight.png' });
  await page.waitForTimeout(1200);
  report('junk: and disappears', (await page.locator('.flying-icon').count()) === 0);
  // The last link: the welcome may have given something before it (R17.3).
  await page.click('#log .link >> nth=-1');
  const tip = (await page.textContent('.tip')) ?? '';
  report('junk: a tap on the link shows its tooltip', junk !== '' && tip.startsWith(junk), tip);
  await page.click('#bag');
  await page.click('#tab-junk');
  const slots = await page.locator('#bagBody .slot:not(.empty)').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')));
  report('junk: in the bag, under Junk', slots.includes(junk), slots.join(', '));
  await page.screenshot({ path: 'dist/verify/bag.png' });
  await page.click('#player');
  const rod = await page.getAttribute('[data-slot="rod"]', 'aria-label');
  report('junk: the stick is equipped', rod === 'A stick with some string tied to it', rod ?? '');
});

await check('strike too early', DESKTOP, '?seed=1&wait=6000', async (page, tap) => {
  await tap();
  await page.waitForSelector('body[data-phase="waiting"]');
  await page.waitForTimeout(300);
  await tap();
  await page.waitForSelector('body[data-phase="done"]', { timeout: 2000 });
  await page.waitForSelector('body:not([data-dice])', { timeout: 3000 });
  report('strike too early: pulled out', (await logText(page)).includes('Too early!'));
  report('strike too early: says so over the bobber', (await page.textContent('.floater')) === 'Too early!');
});

await check('no strike: the fish is gone after 3 s', DESKTOP, '?seed=1&wait=500', async (page, tap) => {
  await tap();
  await page.waitForSelector('body[data-phase="bite"]', { timeout: 3000 });
  await page.waitForSelector('body[data-phase="done"]', { timeout: 4000 });
  report('no strike: too slow', (await logText(page)).includes('Too slow'));
  report('no strike: the pause', (await page.textContent('#status')) === 'The bobber bobs back up…');
});

await check('a missed splash: pause, cast again, then reel in', DESKTOP, '?seed=1&wait=500', async (page, tap) => {
  await tap();
  await page.waitForSelector('body[data-phase="done"]', { timeout: 5000 });
  await page.waitForSelector('body[data-phase="waiting"]', { timeout: 7000 });
  report('missed splash: the line counts as cast again after the pause', true);
  await page.waitForSelector('body[data-phase="done"]', { timeout: 5000 });
  // Reeled in: the pause ends with the line out of the water, not cast again.
  const ready = await page
    .waitForFunction(() => document.getElementById('status')?.textContent === 'Tap to cast again.', null, { timeout: 9000 })
    .then(() => true, () => false);
  report('missed splash: a second miss reels in', ready && (await page.getAttribute('body', 'data-phase')) === 'done');
  report('missed splash: ready to cast', (await page.textContent('#status')) === 'Tap to cast again.');
});

await check('saving', PHONE, '?seed=1&wait=600', async (page, tap) => {
  await page.click('#player');
  const who = await page.textContent('#paneBody');
  report('saving: the character is shown', /Level 0/.test(who ?? ''), who);
  await closePane(page);
  // A new game starts on a random morning (D85).
  const [h, m] = ((await clockShown(page)) ?? '').split(':').map(Number);
  const later = `${String(h + (m === 30 ? 1 : 0)).padStart(2, '0')}:${m === 30 ? '00' : '30'}`;
  await tap();
  await page.waitForSelector('body[data-phase="bite"]', { timeout: 3000 });
  await tap();
  await page.waitForSelector('body[data-phase="done"]', { timeout: 2000 });
  await page.waitForSelector('body:not([data-dice])', { timeout: 3000 });
  report('saving: a cast takes 30 minutes', (await clockShown(page)) === later, `${h}:${m} -> ${await clockShown(page)}`);
  await page.reload();
  await page.waitForSelector('#title[open]', { timeout: 15000 });
  await page.screenshot({ path: 'dist/verify/title.png' });
  report('saving: a reload opens the title screen', !(await page.isVisible('#create')));
  report('saving: Continue is offered for the game played last', await page.isVisible('#titleContinue'));
  await page.click('#titleLoad');
  report('saving: empty slots can\'t be loaded', await page.isDisabled('#slot-2'));
  report('saving: the slot says who is in it', /Level 0|level 0/.test((await page.textContent('#slot-1')) ?? ''), (await page.textContent('#slot-1')) ?? '');
  await page.screenshot({ path: 'dist/verify/title-load.png' });
  await page.click('#slot-1');
  report('saving: the game is back', (await clockShown(page)) === later);

  await tap();
  await page.waitForSelector('body[data-phase="waiting"]', { timeout: 2000 });
  await page.reload();
  await loadFrom(page, 1);
  report('saving: leaving mid-cast voids the cast, no time passes', (await clockShown(page)) === later);
});

await check('new game', DESKTOP, '?seed=5', async (page) => {
  page.on('dialog', (d) => d.accept());
  await page.click('#menu');
  await page.click('#mainMenu');
  await page.waitForSelector('#title[open]', { timeout: 2000 });
  await page.click('#titleNew');
  await page.click('#slot-2');
  await page.waitForSelector('#create[open]', { timeout: 2000 });
  await page.click('#createGender label:nth-child(2)');
  await page.click('#createClass label:nth-child(3)');
  const name = await page.inputValue('#createName');
  await page.screenshot({ path: 'dist/verify/character-creation.png' });
  await page.click('#createStart');
  await passWelcome(page);
  await page.click('#player');
  const who = (await page.textContent('#pane')) ?? '';
  report('new game: back to character creation, and the choices stick', who.includes('Rogue Fisherwoman') && who.includes(name), who);
  await closePane(page);
  await page.click('#menu');
  await page.click('#mainMenu');
  await page.click('#titleLoad');
  const filled = [await page.isDisabled('#slot-1'), await page.isDisabled('#slot-2'), await page.isDisabled('#slot-3')];
  report('new game: in its own slot, the first game kept', filled.join() === 'false,false,true', filled.join());
});

await check('the collection (9.4)', PHONE, '?dev&seed=1&wait=600', async (page, tap) => {
  await openBench(page);
  await page.fill('#dev-fishFind', '100');
  await page.press('#dev-fishFind', 'Enter');
  await closePane(page);
  await tap();
  await page.waitForSelector('body[data-phase="bite"]', { timeout: 3000 });
  await tap();
  await page.waitForSelector('body[data-phase="done"]', { timeout: 2000 });
  await page.waitForSelector('body:not([data-dice])', { timeout: 3000 });
  const caught = /You caught: \[([^\]]+)\]/.exec(await logText(page));
  await page.click('#journal');
  const shown = await page.locator('#paneBody .collection .slot').count();
  report('the collection: the fish caught is in it', !caught || shown === 1, `${caught?.[1] ?? 'nothing caught'}, ${shown} shown`);
  if (shown) await page.click('#paneBody .collection .slot');
  report('the collection: a tap shows its records', !shown || /caught,/.test((await page.textContent('.tip')) ?? ''), (await page.textContent('.tip')) ?? '');
  await page.screenshot({ path: 'dist/verify/collection.png' });
});

await check('a save to a file and back (9.3)', DESKTOP, '?seed=7', async (page) => {
  page.on('dialog', (d) => d.accept());
  await page.click('#menu');
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('#exportSave')]);
  const file = await download.path();
  report('save to a file: downloaded, named for the character', /^roll-for-fishing-.+-\d{4}-\d\d-\d\d\.json$/.test(download.suggestedFilename()), download.suggestedFilename());
  await page.click('#mainMenu');
  await page.waitForSelector('#title[open]', { timeout: 2000 });
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.click('#titleImport')]);
  await chooser.setFiles(file);
  await page.waitForSelector('#slot-3', { timeout: 2000 });
  report('load from a file: asks which slot', /Which slot for/.test((await page.textContent('#titlePrompt')) ?? ''));
  await page.click('#slot-3');
  await page.click('#menu');
  await page.click('#mainMenu');
  await page.click('#titleLoad');
  const filled = [await page.isDisabled('#slot-1'), await page.isDisabled('#slot-3')];
  report('load from a file: the game is in slot 3 too', filled.join() === 'false,false', filled.join());
});

await check('sound (9.2)', PHONE, '?seed=1&wait=600', async (page, tap) => {
  await page.click('#menu');
  await page.click('#openSettings');
  report('sound: a volume in the settings, at 60', (await page.inputValue('#sound-volume')) === '60');
  await page.fill('#sound-volume', '30');
  await page.dispatchEvent('#sound-volume', 'change');
  const kept = await page.evaluate(() => JSON.parse(localStorage.getItem('roll-for-fishing:settings') ?? '{}').sound);
  report('sound: the volume is kept', kept === 30, String(kept));
  await closePane(page);
  // A whole cast with sound on: the cast, the splash, the dice, the outcome.
  await tap();
  await page.waitForSelector('body[data-phase="bite"]', { timeout: 3000 });
  await tap();
  await page.waitForSelector('body[data-phase="done"]', { timeout: 2000 });
  await page.waitForSelector('body:not([data-dice])', { timeout: 3000 });
});

await check('settings: the light theme', PHONE, '?seed=6', async (page) => {
  await page.click('#menu');
  await page.click('#openSettings');
  await page.click('#theme-light');
  report('settings: the page turns light', (await page.getAttribute('html', 'data-theme')) === 'light');
  await closePane(page);
  await page.click('#bag');
  await page.screenshot({ path: 'dist/verify/light-theme.png' });
  await page.reload();
  await page.waitForSelector('#title[open]', { timeout: 15000 });
  report('settings: kept after a reload', (await page.getAttribute('html', 'data-theme')) === 'light');
  await page.screenshot({ path: 'dist/verify/light-title.png' });
});

await check('settings: the font', DESKTOP, '?seed=6', async (page) => {
  const font = () => page.evaluate(() => getComputedStyle(document.body).fontFamily);
  report('settings: Alegreya Sans by default (D132)', (await font()).startsWith('"Alegreya Sans"'), await font());
  await page.click('#menu');
  await page.click('#openSettings');
  report('settings: Clear is chosen', await page.isChecked('#font-clear'));
  await page.click('#font-pixel');
  report('settings: Pixel turns the page to Pixelify Sans', (await font()).startsWith('"Pixelify Sans"'), await font());
  await page.reload();
  await page.waitForSelector('#title[open]', { timeout: 15000 });
  report('settings: the font is kept after a reload', (await font()).startsWith('"Pixelify Sans"'), await font());
});

await check('settings: no dice (D99)', PHONE, '?seed=1&wait=700', async (page, tap) => {
  await page.click('#menu');
  await page.click('#openSettings');
  report('settings: dice are shown at first', await page.isChecked('#show-dice'));
  await page.click('#show-dice');
  await page.screenshot({ path: 'dist/verify/settings.png' });
  await closePane(page);
  await tap();
  await page.waitForSelector('body[data-phase="bite"]', { timeout: 3000 });
  await tap();
  await page.waitForSelector('body[data-phase="done"]', { timeout: 2000 });
  report('settings: with no dice, the roll is in the log at once', (await page.locator('body[data-dice]').count()) === 0 && (await page.locator('#log .roll').count()) === 1);
  await page.reload();
  await page.waitForSelector('#title[open]', { timeout: 15000 });
  const kept = await page.evaluate(() => JSON.parse(localStorage.getItem('roll-for-fishing:settings') ?? '{}').dice);
  report('settings: no dice, kept after a reload', kept === false, String(kept));
});

await check('keyboard: space casts and strikes', DESKTOP, '?seed=2&wait=600', async (page) => {
  await page.keyboard.press(' ');
  await page.waitForSelector('body[data-phase="bite"]', { timeout: 3000 });
  await page.keyboard.press(' ');
  await page.waitForSelector('body[data-phase="done"]', { timeout: 2000 });
  await page.waitForSelector('body:not([data-dice])', { timeout: 3000 });
  report('keyboard: a full cast with the space bar', true);
});

await check('?dev shows the bench', DESKTOP, '?dev&seed=3', async (page) => {
  await page.click('#menu');
  report('?dev: the bench is in the menu', await page.isVisible('#openBench'));
  await page.click('#openBench');
  report('?dev: seed shown for replay', /seed=3/.test((await page.textContent('#devBench')) ?? ''));
  report('?dev: game values shown', (await page.inputValue('#dev-strikeLimit')) === '3000');
  await page.fill('#dev-strikeLimit', '4000');
  await page.press('#dev-strikeLimit', 'Enter');
  await page.click('#paneTitle');
  report('?dev: a value can be changed', (await page.inputValue('#dev-strikeLimit')) === '4000');
  report('?dev: an empty bucket button', await page.isVisible('text=Empty bucket'));
  await page.screenshot({ path: 'dist/verify/dev-bench.png' });
});

await check('the buff bar', DESKTOP, '?dev&seed=3', async (page) => {
  await openBench(page);
  await page.click('text=+ Fish Find buff, 3 casts');
  await page.click('text=+ Fish Find buff, 2 min');
  await page.click('text=+ debuff, 90 s');
  report('buff bar: two buffs, one debuff', (await page.locator('.buffs .buff').count()) === 2 && (await page.locator('.debuffs .buff').count()) === 1);
  const corners = await page.locator('.buff-left').allTextContents();
  // The 90 s debuff rounds to 2m, or to 1m once a slow run has ticked it below 90 s.
  report('buff bar: casts and time in the corner', /^3 2m [12]m$/.test(corners.join(' ')), corners.join(' '));
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
  await openBench(page);
  await page.selectOption('#dev-feature', 'roach-school');
  await page.click('text=Spawn in the middle');
  await closePane(page);
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'dist/verify/surface-feature.png' });
  // Cast at the middle of the scene (128, 100), where the school is.
  const box = await page.locator('#scene').boundingBox();
  // The middle of the reedy shore's water (x 40-216, y 118-180, D117), where the bench spawned it.
  await page.touchscreen.tap(box.x + (box.width * 128) / 256, box.y + (box.height * 149) / 256);
  await page.waitForSelector('body[data-phase="waiting"]', { timeout: 2000 });
  const log = await logText(page);
  report('surface features: landing in a school says so', log.includes('Your bobber lands in a school of roach.'), log);
});

await check('class fish (D114)', PHONE, '?dev&seed=3', async (page) => {
  await openBench(page);
  await page.selectOption('#dev-champion', 'witch');
  await page.click('#dev-champion-spawn');
  await closePane(page);
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'dist/verify/class-fish.png' });
  const debuff = page.locator('.debuffs .buff');
  report('class fish: a debuff while the witch is on the spot', (await debuff.count()) === 1);
  await debuff.first().click();
  const tip = (await page.textContent('.buff-tip')) ?? '';
  report('class fish: its tooltip names the witch and her spell', tip.startsWith('Witch: '), tip);
});

await check('the sky', PHONE, '?dev&seed=3', async (page) => {
  await openBench(page);
  const bench = page.locator('#devBench');
  /** @param {string} season @param {string} cell */
  const weather = async (season, cell) => {
    await bench.locator('select').nth(2).selectOption(season);
    await bench.locator('select').nth(3).selectOption(cell);
    await page.click('text=Set weather');
  };
  // Heavy rain at dusk (spring, 20:00).
  for (let i = 0; i < 2; i++) await page.click('text=+6 hours');
  await weather('spring', '8');
  await closePane(page);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'dist/verify/sky-rain-dusk.png' });
  // A winter blizzard at night (02:00).
  await openBench(page);
  for (let i = 0; i < 3; i++) await page.click('text=+1 season');
  await page.click('text=+6 hours');
  await weather('winter', '16');
  await closePane(page);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'dist/verify/sky-blizzard-night.png' });
  const shown = [await page.textContent('#timeOfDay'), await page.textContent('#seasonDay'), await page.getAttribute('#weather', 'data-icon')].join(' ');
  report('the sky: the time and weather are shown', /^Night \w{3}, \w+ \d+ weather\/snow$/.test(shown), shown);
  await page.click('#weather');
  report('the sky: a tap on the weather names it', (await page.textContent('.tip')) === 'Blizzard', (await page.textContent('.tip')) ?? '');
  await page.screenshot({ path: 'dist/verify/weather-name.png' });
});

await check('a full bucket', PHONE, '?dev&seed=1&wait=600', async (page, tap) => {
  await openBench(page);
  for (const [name, value] of [['fishingSkill', '100'], ['fishFind', '100']]) {
    await page.fill(`#dev-${name}`, value);
    await page.press(`#dev-${name}`, 'Enter');
  }
  await page.click('text=Fill bucket');
  await closePane(page);
  await tap();
  await page.waitForSelector('body[data-phase="bite"]', { timeout: 3000 });
  await tap();
  await page.waitForSelector('#release[open]', { timeout: 2000 });
  await page.screenshot({ path: 'dist/verify/full-bucket.png' });
  const options = await page.locator('#releaseList button').count();
  report('a full bucket: the new fish and the bucket to choose from', options >= 2, `${options} options`);
  // On a phone the strike's own click lands on the dialog as it opens: ignored.
  await page.click('#releaseList button >> nth=0', { delay: 0 });
  report('a full bucket: a click as it opens lets nothing go', await page.isVisible('#release'));
  await page.waitForTimeout(450);
  await page.click('#releaseList button >> nth=1');
  report('a full bucket: the choice closes it', !(await page.isVisible('#release')));
  report('a full bucket: the log says so', /You let the .* go\./.test(await logText(page)));
  await page.click('#bucket');
  const full = (await page.textContent('#paneBody')) ?? '';
  report('a full bucket: 16 of 16 in the bucket pane', full.includes('16 of 16 fish'), full);
  await page.screenshot({ path: 'dist/verify/bucket.png' });
});

await check('two treasures (Fence)', PHONE, '?dev&seed=1&wait=600', async (page, tap) => {
  await openBench(page);
  for (const [name, value] of [['biteCertain', '-1'], ['treasureFind', '1000'], ['treasureChoice', '1']]) {
    await page.fill(`#dev-${name}`, value);
    await page.press(`#dev-${name}`, 'Enter');
  }
  await closePane(page);
  await tap();
  await page.waitForSelector('body[data-phase="bite"]', { timeout: 3000 });
  await tap();
  await page.waitForSelector('#release[open]', { timeout: 4000 });
  await page.screenshot({ path: 'dist/verify/two-treasures.png' });
  const title = await page.textContent('#releaseTitle');
  const options = await page.locator('#releaseList button').count();
  report('two treasures: a dialog with both to choose from', title === 'Two treasures' && options === 2, `${title}, ${options} options`);
  await page.waitForTimeout(450);
  await page.click('#releaseList button >> nth=1');
  report('two treasures: the choice closes it', !(await page.isVisible('#release')));
  report('two treasures: the log says which was kept', /You keep .*\. The other sinks back/.test(await logText(page)));
});

await check('the town: the inn, the innkeeper, the room (R17)', DESKTOP, '?dev&seed=1', async (page) => {
  await openBench(page);
  await page.selectOption('#dev-event', 'nightfall');
  await page.click('#devBench >> text=Start');
  await page.waitForSelector('#event[open]', { timeout: 2000 });
  await page.waitForTimeout(450);
  await page.click('#eventChoices button:has-text("Go straight to the inn")');
  await page.waitForSelector('#event[open]', { timeout: 2000 });
  await page.waitForFunction(() => document.querySelector('#eventTitle')?.textContent === 'The innkeeper', null, { timeout: 2000 }).catch(() => {});
  report('the town: the innkeeper greets the player', (await page.textContent('#eventTitle')) === 'The innkeeper');
  report('the town: no fishing here', (await page.getAttribute('body', 'data-place')) === 'town');
  await page.screenshot({ path: 'dist/verify/town-innkeeper.png' });
  await page.waitForTimeout(450);
  await page.click("text=Thank you. I'll go up.");
  await page.waitForSelector('#event[open]', { timeout: 2000 });
  report('the town: up in the room', (await page.textContent('#eventTitle')) === 'Your room');
  await page.waitForTimeout(450);
  await page.click('#eventChoices button:has-text("Go back down")');
  await page.waitForSelector('#event[open]', { timeout: 2000 });
  report('the town: back down, the inn has its choices now', (await page.textContent('#eventTitle')) === 'The inn');
  await page.waitForTimeout(450);
  await page.click('#eventChoices button:has-text("The perpetual stew")');
  report('the town: the stew opens in a pane', ((await page.textContent('#paneTitle')) ?? '') === 'The perpetual stew');
  await page.screenshot({ path: 'dist/verify/town-stew.png' });
});

await check('a Tiny fish on the hook', PHONE, '?dev&seed=1', async (page) => {
  await openBench(page);
  await page.click('text=Tiny fish');
  await closePane(page);
  await page.click('#bucket');
  // In the fish's options, on right-click (R21.1).
  await page.click('[data-fish="0"]', { button: 'right' });
  const button = page.locator('.context-menu button:has-text("Hook as bait")');
  report('a Tiny fish on the hook: in its options', (await button.count()) === 1, (await page.textContent('.context-menu')) ?? '');
  report('a Tiny fish on the hook: Release is there too', (await page.locator('.context-menu button:has-text("Release fish")').count()) === 1);
  await page.screenshot({ path: 'dist/verify/tiny-fish.png' });
  await button.click();
  report('a Tiny fish on the hook: the log says so', /You put \[?Tiny Roach\]? on the hook\./.test(await logText(page)), await logText(page));
  report('a Tiny fish on the hook: it left the bucket', (await page.locator('[data-fish]').count()) === 0);
});

// ---------- Equipment and the bag (5.1, 5.2, D83) ----------

/** The middle of an element, on the page. */
const centre = async (page, selector) => {
  // A long bag scrolls: bring the slot into view first.
  await page.locator(selector).scrollIntoViewIfNeeded();
  const box = await page.locator(selector).boundingBox();
  if (!box) throw new Error(`${selector} not visible`);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
};
/** What a slot holds, by its aria-label. */
const slotLabel = (page, key) => page.getAttribute(`[data-slot="${key}"]`, 'aria-label');
/** A bag slot by the item's name. */
const bagSlot = (name) => `#bagBody .slot[aria-label^="${name}"]`;
/** The ?dev bench's button that puts one of every equippable item in the bags. */
const addEquippables = async (page) => {
  await openBench(page);
  await page.click('text=Add every equippable item');
};

await check('equipment: drag, right-click, no rod', DESKTOP, '?dev&seed=1', async (page, tap) => {
  await addEquippables(page);
  await page.click('#player');
  await page.click('#bag');
  report('equipment: the character and the bag open together', (await page.isVisible('#pane')) && (await page.isVisible('#bagPane')));
  const shown = await page.locator('#doll .slot').count();
  report('equipment: seven slots on the paper doll', shown === 7, `${shown}`);

  // A mouse drag from the bag onto the hat slot.
  const from = await centre(page, bagSlot('Straw hat'));
  const to = await centre(page, '[data-slot="hat"]');
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + 20, from.y, { steps: 3 });
  report('equipment: dragging lights up the slot it fits', await page.locator('[data-slot="hat"].drop-ok').count() === 1);
  await page.mouse.move(to.x, to.y, { steps: 8 });
  await page.mouse.up();
  report('equipment: dragged into the hat slot', (await slotLabel(page, 'hat')) === 'Straw hat', await slotLabel(page, 'hat'));
  report('equipment: and out of the bag', (await page.locator(bagSlot('Straw hat')).count()) === 0);
  // The pointer rests on the hat slot, so its tooltip may show on hover (D119);
  // nothing else may be left over from the drag.
  const after = (await page.isVisible('.tip')) ? ((await page.textContent('.tip')) ?? '') : '';
  report('equipment: no tooltip left over from the drag', after === '' || after.startsWith('Straw hat'), after);

  // The wrong slot is refused, in red.
  const crumbs = await centre(page, bagSlot('Bread crumbs'));
  const rod = await centre(page, '[data-slot="rod"]');
  await page.mouse.move(crumbs.x, crumbs.y);
  await page.mouse.down();
  await page.mouse.move(rod.x, rod.y, { steps: 8 });
  await page.mouse.up();
  report('equipment: the wrong slot says so', ((await page.textContent('#errors')) ?? '').includes("doesn't go in that slot"));

  // Right-click equips, and swaps with what was there.
  await page.click(bagSlot('Willow rod'), { button: 'right' });
  report('equipment: right-click equips', (await slotLabel(page, 'rod')) === 'Willow rod', await slotLabel(page, 'rod'));
  report('equipment: the old rod goes to the bag', (await page.locator(bagSlot('A stick with some string tied to it')).count()) === 1);
  await page.click(bagSlot('Bread crumbs'), { button: 'right' });
  report('equipment: bait goes in as the whole stack', (await slotLabel(page, 'bait')) === 'Bread crumbs ×10', await slotLabel(page, 'bait'));
  await page.click(bagSlot('Fish and where to find them'), { button: 'right' });
  await page.click(bagSlot('Heavy bait'), { button: 'right' });
  report('equipment: two trinkets', (await slotLabel(page, 'trinket1')) === 'Fish and where to find them - waterproof compendium' && (await slotLabel(page, 'trinket2')) === 'Heavy bait');
  await page.click(bagSlot('Bluejay-feather bobber'), { button: 'right' });
  await page.screenshot({ path: 'dist/verify/equipment.png' });

  // Right-click on the rod takes it off; a cast then needs one.
  await page.click('[data-slot="rod"]', { button: 'right' });
  report('equipment: right-click on a slot takes it off', ((await slotLabel(page, 'rod')) ?? '').startsWith('Rod'), await slotLabel(page, 'rod'));
  await closePane(page);
  await tap();
  await page.waitForTimeout(100);
  report('equipment: no rod, no cast', (await page.getAttribute('body', 'data-phase')) === 'idle');
  const error = (await page.textContent('#errors')) ?? '';
  report('equipment: "Must have a fishing pole equipped."', error.includes('Must have a fishing pole equipped.'), error);
  await page.screenshot({ path: 'dist/verify/no-rod.png' });

  // It all survives a reload.
  await page.reload();
  await loadFrom(page, 1);
  await page.click('#player');
  report('equipment: saved', (await slotLabel(page, 'hat')) === 'Straw hat' && (await slotLabel(page, 'trinket2')) === 'Heavy bait');
});

await check('equipment: the bobber, and nothing changes while the line is out', DESKTOP, '?dev&seed=1&wait=6000', async (page, tap) => {
  await addEquippables(page);
  await closePane(page);
  await page.click('#bag');
  await page.click(bagSlot('Bluejay-feather bobber'), { button: 'right' });
  await page.click('#bag');
  await tap();
  await page.waitForSelector('body[data-phase="waiting"]');
  await page.waitForTimeout(1500);
  // The canvas can't be read back (WebGL), so the check reads what the scene
  // was told to draw; the screenshot shows it.
  const look = await page.getAttribute('#scene', 'data-bobber');
  report('equipment: the bobber drawn in the bluejay blue', (look ?? '').includes('#3a6fd8'), look ?? '');
  await page.screenshot({ path: 'dist/verify/bobber.png' });
  await page.click('#player');
  await page.click('[data-slot="rod"]', { button: 'right' });
  report('equipment: not while the line is out', (await slotLabel(page, 'rod')) === 'A stick with some string tied to it');
  report('equipment: and says so', ((await page.textContent('#errors')) ?? '').includes("can't change equipment"));
});

await check('equipment by touch: long-press drag', PHONE, '?dev&seed=1', async (page) => {
  await addEquippables(page);
  await page.click('#player');
  await page.click('#bag');
  report('equipment by touch: the bag over the log, the character over the scene', (await page.isVisible('#pane')) && (await page.isVisible('#bagPane')));
  await page.screenshot({ path: 'dist/verify/equipment-phone.png' });
  const cdp = await page.context().newCDPSession(page);
  const touch = (type, p) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: p ? [{ x: p.x, y: p.y }] : [] });
  const from = await centre(page, bagSlot('Horsehair line'));
  const to = await centre(page, '[data-slot="line"]');

  // A quick swipe is a scroll, not a drag.
  await touch('touchStart', from);
  await touch('touchMove', { x: from.x, y: from.y - 40 });
  await touch('touchEnd');
  report('equipment by touch: a swipe doesn\'t drag', (await slotLabel(page, 'line')) === 'Line: Empty', await slotLabel(page, 'line'));

  // Hold, then drag. The icon is carried above the finger, so the finger ends below the slot.
  await touch('touchStart', from);
  await page.waitForTimeout(500);
  for (let i = 1; i <= 10; i++) await touch('touchMove', { x: from.x + ((to.x - from.x) * i) / 10, y: from.y + ((to.y + 36 - from.y) * i) / 10 });
  await touch('touchEnd');
  report('equipment by touch: long-press and drag equips', (await slotLabel(page, 'line')) === 'Horsehair line', await slotLabel(page, 'line'));

  // A tap still shows the tooltip.
  await page.tap('[data-slot="line"]');
  report('equipment by touch: a tap shows the tooltip', ((await page.textContent('.tip')) ?? '').startsWith('Horsehair line'));
  // Its effects, made from the item (5.4): the upside green, the downside red.
  const good = await page.locator('.tip .tip-good').allTextContents();
  const bad = await page.locator('.tip .tip-bad').allTextContents();
  report('tooltips: no sell price, there is no money (D85)', !((await page.textContent('.tip')) ?? '').includes('Sells'));
  report('tooltips: effects in green and red', good.join() === '+0.5 s time to strike' && bad.join() === '−0.05 s time for a fast strike', `${good} / ${bad}`);
  await page.screenshot({ path: 'dist/verify/tooltip-effects.png' });
});

// ---------- Events (7.1-7.3, D84) ----------

await check('events: the frog, from the event meter', PHONE, '?dev&seed=1&wait=600', async (page, tap) => {
  await openBench(page);
  await page.selectOption('#dev-class', 'rogue-fisher');
  await page.click('text=Fill the meter');
  await closePane(page);
  await tap();
  await page.waitForSelector('body[data-phase="bite"]', { timeout: 3000 });
  await tap();
  await page.waitForSelector('#event[open]', { timeout: 2000 });
  report('events: a full meter brings the frog after the cast', (await page.textContent('#eventTitle')) === 'A froggy encounter');
  const choices = await page.locator('#eventChoices button').allTextContents();
  report('events: a rogue may try to catch it', choices.join('|') === 'Observe it closely|Ignore it|Attempt to catch the frog', choices.join('|'));
  const box = await page.locator('#event').boundingBox();
  report('events: the dialog fits a phone', Boolean(box && box.x >= 0 && box.x + box.width <= 390), JSON.stringify(box));
  await page.screenshot({ path: 'dist/verify/event-frog.png' });
  await page.waitForTimeout(450);
  await page.click('#eventChoices button >> nth=2');
  report('events: a choice leads to the next slide', ((await page.textContent('#eventText')) ?? '').startsWith('You lunge forward'));
  await page.waitForTimeout(450);
  await page.click('text=Well, shit.');
  report('events: the last choice closes it', !(await page.isVisible('#event')));
  await openBench(page);
  report('events: Luck went down by 1, unseen', (await page.inputValue('#dev-luck')) === '-1' && !(await logText(page)).includes('Luck'));
  report('events: the frog is seen once', /frog ×1/.test((await page.textContent('#devBench')) ?? ''));
});

await check('events: a fighter only sees two choices, and a quick tap picks nothing', DESKTOP, '?dev&seed=1', async (page) => {
  await openBench(page);
  await page.selectOption('#dev-class', 'fish-fighter');
  await page.selectOption('#dev-event', 'frog');
  await page.click('#devBench >> text=Start');
  await page.waitForSelector('#event[open]', { timeout: 2000 });
  report('events: no rogue choice for a fighter', (await page.locator('#eventChoices button').count()) === 2);
  // Straight after it opens, a click is taken as the end of whatever opened it.
  await page.click('#eventChoices button >> nth=0', { delay: 0 });
  report('events: a click as it opens picks nothing', ((await page.textContent('#eventText')) ?? '').startsWith('You see a frog'));
  await page.waitForTimeout(450);
  await page.click('#eventChoices button >> nth=0');
  await page.waitForTimeout(450);
  await page.click('text=Thank you, frog');
  report('events: Thank you, frog closes it', !(await page.isVisible('#event')));
});

// The art sheet (art.html, docs/art.md) is its own page, not the game, so it
// skips check()'s title screen. Its screenshot is the one Claude looks at
// after changing art: dist/verify/art.png.
if (!ONLY || 'art sheet'.includes(ONLY)) {
  const context = await browser.newContext(DESKTOP);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  try {
    await page.goto(BASE + 'art.html');
    await page.waitForSelector('body[data-ready="true"]', { timeout: 20000 });
    const counts = await page.evaluate(() => ({
      scenes: document.querySelectorAll('figure:not(.sprite) > canvas').length,
      sprites: document.querySelectorAll('figure.sprite').length,
    }));
    report('art sheet: scenes and sprites drawn', counts.scenes > 0 && counts.sprites > 0, `${counts.scenes} scenes, ${counts.sprites} sprites`);
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'dist/verify/art.png', fullPage: true });
    // Save as PNG gives the owner the scene at its real size, to draw over.
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('text=Pond, 256 wide >> .. >> button.save'),
    ]);
    await download.saveAs('dist/verify/art-scene.png');
    const png = decodePng(await readFile('dist/verify/art-scene.png'));
    // Painted, not blank: the top left pixel is opaque.
    const opaque = png.rgba[3] === 255;
    report(
      'art sheet: Save as PNG gives the scene at 256×256',
      png.width === 256 && png.height === 256 && opaque,
      `${download.suggestedFilename()}, ${png.width}×${png.height}`,
    );
  } catch (e) {
    report('art sheet', false, e.message.split('\n')[0]);
  }
  report('art sheet: no page errors', errors.length === 0, errors.join(' | '));
  await context.close();
}

// The owner reads the art sheet on a phone too, away from the computer.
if (!ONLY || 'art sheet on a phone'.includes(ONLY)) {
  const context = await browser.newContext(PHONE);
  const page = await context.newPage();
  try {
    await page.goto(BASE + 'art.html');
    await page.waitForSelector('body[data-ready="true"]', { timeout: 20000 });
    const m = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, width: innerWidth }));
    report('art sheet on a phone: no sideways scrolling', m.scroll <= m.width, `${m.scroll} of ${m.width}`);
    await page.screenshot({ path: 'dist/verify/art-phone.png' });
  } catch (e) {
    report('art sheet on a phone', false, e.message.split('\n')[0]);
  }
  await context.close();
}

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
