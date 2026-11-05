# Roll for Fishing: development history

Finished phases as they were done: what each task turned into, and what was found on the way. Code and docs cite task
numbers (`0.3`, `1.6`). Current work is in [DEV_PLAN.md](../DEV_PLAN.md).

## Milestones

**Before the fresh start:** a React + Vite prototype (2023–2026), tag `legacy-prototype`: one-button casts with the d20
roll, fish with sizes and weather preferences, junk and treasure, a weather engine with four seasons, a record book,
localStorage saves. Its review, and what carries over, are in [PORTING-NOTES.md](PORTING-NOTES.md).

**Since Phase 0 (2026-10-28):** a new codebase without a framework or build step, seeded dice, the docs below, CI.

---

## Phase 0: Groundwork and spec (2026-10-28)

- **0.1** The prototype tagged `legacy-prototype`; work moved to the branch `fresh-start` and the old tree removed.
- **0.2** Skeleton as in SuperRollies (D2, D3, D6): `index.html` with an import map (PixiJS 8.22.0), `styles.css`,
  `src/`, `serve` for development, `jsconfig.json` with `checkJs`.
- **0.3** `src/rng.js` ported from SuperRollies unchanged, with its tests (D4).
- **0.4** `src/dice.js`: the prototype's named dice, bound to a stream (D5). Tests: faces, the 2d6 bell, advantage and
  disadvantage means (about 13.8 and 7.2 against 10.5), and determinism by seed.
- **0.5** `tools/verify.mjs`: Playwright checks that start their own server; `tools/build-artifact.mjs`: the single-file
  copy (about 26 kB, PixiJS from the CDN); `.github/workflows/ci.yml`: tests, checks and build on every push.
- **0.6** Docs: [spec.md](spec.md) from OLD-CONCEPT.md, the prototype's design notes and the decisions so far;
  [decisions.md](decisions.md) D1–D18; DEV_PLAN.md; CLAUDE.md; README.md. The first review of the prototype became
  PORTING-NOTES.md.

## Phase 1: Feel trial (2026-10-28 to 2026-11-02)

- **1.1–1.3** The scene from the sketch in placeholder pixel art, all drawn by code. A first pass had a bobber too small
  to react to comfortably at 2× and hard stripes between the water bands that read as horizon lines; the bobber is now
  9×14 (7×11 when cast far) and the band edges are dithered.
- **1.6** The cast engine. Its tests found a bug on the first run: a single tick moved a cast from waiting to bite but
  didn't then check whether the bite had already run out, so a strike long after the bite was still rolled. Fixed in
  `tickCast`.

- **1.4** The owner tried the `?dev` timing presets on a real phone and kept Normal for now (D27): fast under 450 ms,
  ok under 900 ms, gone at 3 s, a bite 2.5 to 8 s after the cast.
- **1.5** On the owner's phone, over the local network, the frame rate looked stable. No lag in the splash-to-tap
  timing was reported; the reaction is timed from the frame that shows the splash (D16).
- **1.7** What the trial settled: Pixi with whole-device-pixel scaling holds up on a phone at devicePixelRatio 2.625
  and 3, the reflex loop works with taps and keys, and the cast engine's tests caught a real bug before any player
  could. The trial's page was replaced by the real engine in Phase 3.

## Phase 2: Engine core and the port (2026-11-02)

- **2.14** The content pipeline (D42–D46, D72). The prototype's Lake ported into `content/` by a one-off script, not by
  hand: 7 fish, 38 junk items, 7 treasures, 5 spots, and the size bands. Two flavour typos fixed ("bif", "Severly");
  `items-junk.js` turned out to be an older copy of the same list, differing only in "Rusted iron dagger". The laser
  sight finally has the −2 Treasure Find its text promised. `npm run content` checks schemas, ids against file names,
  every reference, and R8.5 (a warning for now: only the Mega Mass Fish Chum fails it), then writes the generated module
  (139 strings) and an overview page. A test feeds it a broken copy of the content to show each check bites.
- **2.4** The weather engine, ported faithfully into `content/weather/` and `src/engine/weather.js`. The data was ported
  by script, with the random-at-load calls stubbed so their arguments survived as ranges (`{ "min": 0, "max": 1 }`) and
  description lists, now rolled from the `weather` stream when the weather turns. Summer #8's north fixed to hold. The 38
  missing Autumn and Winter descriptions are written; the owner may want to rework them. `npm run content` now checks
  the maps: every move goes to the hex neighbour or holds, and every move can be made back. Restoring the prototype's
  Summer #8 makes that check fail, which a test confirms. The display words from `LocationInfo.jsx` are in
  `content/rules/weather-scales.json`; the cloud emoji became words until there are icons.
- **2.5** Time as its own clock (`src/engine/time.js`): whole game minutes since the first spring midnight, with day,
  season, year and part of the day worked out from them. A new game starts at 08:00 on day 1 of spring. The D66
  baseline (30 minutes a cast, 28-day seasons) is a `TIME` object the bench can change, like `TIMING`.
- **2.15** Game values and the effect vocabulary (`src/engine/values.js`): 19 named values with their bases and which
  direction helps the player, covering the rolls, the cast's timings, the rod's scatter and the bait chances.
  `deriveValues` totals them from the character's stats and any sources of effects; `applyValue` rolls an effect's
  dice each time a value is used and keeps the breakdown for the roll record.
- **2.2** Weighted tables (`src/engine/tables.js`) built from a location's lists plus its spot's, with shared tables
  expanded, retired content and found unique items skipped, the weather bonuses added to fish, and the empty hook as an
  entry of its own.
- **2.3** Fish generation (`src/engine/fish.js`), the prototype's algorithm with the PORTING-NOTES §1.3 fixes: the
  difficulty follows the shifted band, Medium has a name, plain weights. Sizes are whole centimetres in non-overlapping
  slices. Writing the rarity test showed that D63's band shifts didn't match the owner's examples (a Humongous roach came
  out Rare); D73 corrects them.
- **2.1** The game state (`src/engine/state.js`): ids and the player's own state only, with a version, migrations, and
  each random stream's position (D53). `src/save.js` holds the save slot; a save that can't be read is reported and
  left in place, never overwritten. A new game starts from `content/rules/new-game.json`.
- **2.6** The cast pipeline (`src/engine/game.js`): `castLine` rolls the bite (d100 + Fish Find), the fish or the
  treasure-or-junk roll, the fish's resistance d20, all hidden; `strikeLine` rolls the visible d20 for a fish only;
  `tick` handles the bite, a missed splash, the 5-second pause and the recast, and the reel-in after a second miss
  (D64). Every outcome returns plain events for the log. `cast.js` gained landed catches, end times, advantage and
  named modifiers.
- **2.7** Junk and treasure in `content/` (2.14); unique treasure found once; the escaped pool per location or spot,
  where a fish is met again with its tries counted.
- **2.9, 2.11** Buffs counted in casts (spent as the line goes out, covering that cast) and in real time (counted down
  by the page while the game is open); cancelling, but not debuffs.
- **2.10** Luck in the character, at 0.
- **2.12** The stick in the rod slot; the rod feeds the cast's values (scatter, bite delay, reaction windows) through
  the same effects as everything else. Bait used up on a catch unless saved, lost to an escaping fish 5% of the time.
- **2.13** Cast scatter in whole scene pixels from its own stream, clamped to the water. The scene doesn't use it yet:
  that is Phase 3's wiring.
- **2.8** A 1,000-cast session runs headless and replays exactly from its seed. Seed 2026, striking at 300 ms: 56% of
  casts bite, 55% of fish are landed, all seven treasures are found, and the weather changes on 38% of casts, as in the
  prototype. Once the treasures were gone, treasure rolls came up as "cleaned out" 47 times; the owner chose junk
  instead (D75).
- Phase end: 75 unit tests and all browser checks pass; the artifact builds (26 kB). The page is still the Phase 1
  trial, unaffected.

## Phase 3: Core loop, playable (in progress)

- **3.1** The page runs on the Phase 2 engine. A tap aims; the engine scatters the landing and the scene throws the
  bobber there (the keyboard casts to a seeded random spot, since landings will matter for surface features). The
  result box shows the visible d20 with "needed ?", as the fish's own roll is hidden (R5). Every event goes to the log
  through `t()`. The page saves the checkpoint as the line goes out and the whole state once a cast resolves; a reload
  mid-cast leaves the clock where it was, which a browser check confirms. After a missed splash the bobber stays put
  for the pause and the line counts as cast again; a second miss reels it in. Spring's and the new descriptions got
  the full stop Summer's already had, so the log shows them as written.
- **3.3** Character creation in a dialog: a generated name with rerolls, gender, the three classes with their stat
  ranges (now content in `content/classes/`), stats rolled from the new game's seed with unlimited rerolls. The
  screenshot showed "A new Asher": Pixelify Sans draws "fi" as an "A". Ligatures are now off everywhere.
- **3.4** The `?dev` bench (`src/dev.js`): every game value as an override (not saved), timing presets, location, spot,
  weather and time, XP and Luck, adding and equipping items, the inventory and escaped pools at a glance, Empty bucket,
  test buffs of both kinds.
- Browser checks grew from 23 to 41: junk landed without a roll, the pause, recast and reel-in, saving and reloading,
  New game with the choices sticking, the bench.
- **3.6** The buff and debuff bar (`src/ui/buffbar.js`), over the scene's top right in the layer D71 describes: green
  and red rows, casts or time in the corner (nearest minute, then seconds), the effects on hover or tap, cancel by
  right-click or long-press, debuffs not. Taps on it never cast. Its browser check first failed because the bar only
  redrew on the next frame; it now redraws with the rest of the page too.

- **3.2** The owner's phone sketch, built (D79). The scene, then a row of eight square columns: the portrait, the
  time and weather across three, then the journal, map, bucket and bag; the log fills what's left, with the menu
  button in its corner. On a wide screen the row and log sit in a 360 px column beside the scene. The row's icons, like
  the scene, are a whole number of device pixels per icon pixel. The phone gutter went from 16 to 8 px, so the scene at
  devicePixelRatio 2.625 grew from 292 to 390 CSS px. Fifteen new 16×16 icons as code, in the sketch's colours. Each
  button opens a pane over the scene (`src/ui/panels.js`): character, journal, map, a bucket grid with a slot per
  free place, a bag grid with three tabs, and the menu, which now holds New game and the dev bench. The log
  (`src/ui/log.js`) runs oldest to newest and follows new lines unless scrolled up; fish and items are links in rarity
  colours (`src/ui/links.js`) with a tooltip (`src/ui/tooltip.js`), built with `tParts()`. The time shows as one of
  seven words; the clock moved to a data attribute the checks read. Browser checks now number 86, with the layout measured
  on three screens (square buttons, the log on screen, no sideways scroll) and every pane opened. The buff bar's
  tooltip turned out to block clicks on the debuff row below it; it no longer catches clicks.

- **3.7** The title screen (D80): New game and Load game, each listing three slots with who is in them. The old single
  save moves to slot 1 on first load. `src/save.js` takes a slot; the menu's Main menu goes back to the title between
  casts.
- **3.8** Settings (`src/settings.js`, D81), kept per device: the theme. The light one is wooden planks drawn in CSS,
  and rarity colours became CSS variables so each theme has its own. A line in `index.html`'s head applies the theme
  before the page draws.
- **3.9** The strike's grade floats over the bobber (`src/ui/floater.js`, D82), without the milliseconds; the roll
  stays in the log. The first screenshot showed the word sitting on the catch's flying icon, so it now starts higher.
  The weather icon shrank to three quarters of the row's icons, as in the sketch, since "Spring, day 1" was clipped.
  Unit tests 92, browser checks all passing, with new ones for the slots, the theme surviving a reload and the
  floating words.

## Phase 4: Art pipeline and the living scene (in progress)

- **4.4** A catch's icon appears at the bobber, rises, and flies to the new "Bucket & bags" button, outlined in its
  rarity colour; the game doesn't wait for it. Default 16×16 icons drawn as code (fish, boot, chest, bottle) stand in
  for every kind (R15.5); `iconName` picks an entity's own icon once its art exists. The button opens a plain list of
  what's equipped, in the bucket and in the bags, until Phase 5's inventory. The screenshot showed one cast's log lines
  upside down (the weather before the catch); a cast's lines now keep their order.
- **4.5** Surface features (`src/engine/features.js`, `content/features/`): a school of roach, a school of carp, a big
  pike under the surface and a glint, listed by the Lake with weights, a 12% chance per cast and at most two at once.
  They drift with each cast (not real time, so they replay from the seed), thin out as they are fished, and go when
  their casts run out. A cast landing inside one gets its effects and its fish or junk table; the big pike is at least
  Gigantic; a voided cast leaves the feature untouched. The save moved to version 2, its first migration (surface
  features and their own stream). The scene draws each kind differently and glides them between casts; the bench can
  spawn them. Disturbances have their kind and an `event` field, waiting for Phase 7.
- **4.3** Time, season and weather on the scene (`src/scene/sky.js`), drawn as code: tints for night, dawn and dusk
  that follow the game clock and ease between casts, a faint cast per season, an overcast grey with the clouds, cloud
  shadows drifting with the wind, rain slanting with it, snow when it's 2 or colder, livelier waves and reeds in the
  wind. Tints rather than palette swaps for now, which works for generated art; hand-drawn art may want real palettes
  (4.1). The first night screenshot lost the blizzard under the night tint, so rain and snow are now drawn above it.

## Phase 5: Items and inventory (in progress)

- **5.5** The bucket holds 16 fish to start (`bucketSize`, a game value, so bigger buckets can come as items). A fish
  caught with the bucket full still counts in the book and gives its XP, then waits as `pendingCatch`: no cast goes
  out until the player lets one go, the new one included (D59). The released fish goes into this spot's pool of fish
  that can be met again. A dialog lists the choices in rarity colours; the bench can fill the bucket. Two fixes from
  the phone-sized checks: the bench's long item names pushed its layout wider than the screen, so a section covered
  its buttons; and the dialog's scrolling list squeezed its buttons until their text spilled out.
- **5.1, 5.2** Seven equipment slots (`src/engine/equipment.js`): rod, line, bobber, bait, hat, two trinkets, each
  holding a stack; equipped items leave the bags, and every slot's effects feed the game values. Bait goes in as the
  whole stack and is used up from the slot. No rod: the cast is refused with "Must have a fishing pole equipped." in red
  over the scene (`src/ui/errors.js`). The save moved to version 3: equipped bait moves out of the bags. The character
  pane is a paper doll; the bag became its own pane over the log, so both can be open, on a phone too
  (`src/ui/drag.js`): a mouse drags at once, a finger after 350 ms of holding still, and the slots an item fits light up.
  Right-click equips and takes off. A bobber item recolours the bobber (`bobber` in an item's content). One placeholder
  item per slot, `devOnly`; the prototype's seven effect items became trinkets; the bench adds every equippable item at
  once. The phone checks drive real touch events through Chromium's DevTools protocol: a quick swipe scrolls, a
  long-press drags. Found on the way: the bench's scroll position carried over to the next pane, which opened halfway
  down; and a tap straight after a drag was being swallowed as the drag's own click.
- **5.4** Tooltips are made from an item's effects (`src/ui/effects.js`): "+2 Fishing Skill", "+0.5 s time to strike",
  "+15% chance to save bait", "+d6 Fishing Skill", in green when the change helps and red when it hurts, by the
  direction each game value is better in. Advantage reads as words ("Strong advantage on your roll" for 2 or more).
  Game values gained a `unit` for this. A test checks every game value and every effect in content has words.
- **7.1–7.3** Events, written as text in `content/events/` (D84; the format and its words in `docs/events.md`).
  `tools/event-text.mjs` reads a file into slides, choices, requirements and effects, with line numbers in its
  errors; `npm run content` checks what each event names and warns about slides nothing leads to and slides where
  every choice is locked. The engine (`src/engine/events.js`) hides a choice whose needs aren't met, applies Luck, XP,
  items and flags, and starts events three ways after a cast: an item fished up, an event's own needs met (hidden
  objectives), and the event meter (a d20 per cast, +5 for an empty hook, above 100), which picks from the location's
  list. The save moved to version 4, with an `events` stream, the meter and the open slide; no cast goes out while
  an event is open. The dialog copies WoW's gossip window and ignores a click in its first 400 ms, so the tap or key
  that ended the cast can't pick a choice. The frog is the first event, `once: true`, at the Lake; in the 1,000-cast
  test session the meter brings it once. The bench can start any event, fill the meter, forget seen events, clear
  flags and change class.
- **Review 1 (D85, D86)** The owner's first pass through docs/REVIEW.md. `src/engine/time.js` gained the sun
  (Gdynia's sunrise and sunset as a curve over the year), time words that follow it, and a random start date leaning
  to the season outside; the light (`src/scene/light.js`) follows the same sun. An early strike moves no time on (the features already there still age, or retrying a school would be free), so
  the 1,000-cast test session ends 142 casts' worth of time sooner. One cast in 100 goes wild ("Way off!"); the
  stick's scatter went from 12 to 20 px after measuring that a 14 px school was hit every time it was aimed at. The
  big pike swims off once with the same fish. Medium fish lost their size word, tooltips their sell price (barter,
  D86), character creation its stat ranges (a random class, class descriptions instead); the title screen gained
  Continue; a buff's cancel long-press is 1.2 s. Hidden numbers became open question Q-40.
