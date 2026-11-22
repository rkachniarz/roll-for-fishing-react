# Roll for Fishing: development history

Finished phases as they were done: what each task turned into, and what was found on the way. Code and docs cite task
numbers (`0.3`, `1.6`). Current work is in [DEV_PLAN.md](../DEV_PLAN.md).

## Milestones

**Before the fresh start:** a React + Vite prototype (2023–2026), tag `legacy-prototype`: one-button casts with the d20
roll, fish with sizes and weather preferences, junk and treasure, a weather engine with four seasons, a record book,
localStorage saves. Its review, and what carries over, are in [PORTING-NOTES.md](PORTING-NOTES.md).

**Since Phase 0 (2026-10-28):** a new codebase without a framework or build step, seeded dice, the docs below, CI (switched off
since D133: `npm run check` runs locally before a push, and Pages runs `npm test`). Later phases are below, one
section each.

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

## Phase 3: Core loop, playable (done 2026-11-06)

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

## Phase 4: Art pipeline and the living scene (done 2026-11-22)

- **4.4** A catch's icon appears at the bobber, rises, and flies to the new "Bucket & bags" button, outlined in its
  rarity colour; the game doesn't wait for it. Default 16×16 icons drawn as code (fish, boot, chest, bottle) stand in
  for every kind (R15.5); `iconName` picks an entity's own icon once its art exists. The button opens a plain list of
  what's equipped, in the bucket and in the bags, until Phase 5's inventory. The screenshot showed one cast's log lines
  upside down (the weather before the catch); a cast's lines now keep their order.
- **4.8** Champions, class fish (D114; `src/engine/champions.js`, `content/rules/champions.json`): a Witch, Knight,
  Shaman, Rogue and Cleric, Large or bigger, that come up now and then in place of a surface feature and stay on their
  spot until caught. Their effects are five new game values, on casts at their spot only; the witch's spell and the
  class effects show as debuffs; the Rogue's loot comes back with it. The save moved to version 11, with a
  `champions` stream. The bench spawns any class. Eleven tests (`test/champions.test.js`) and a browser check.
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
- **4.2** A placeholder look per spot: a spot's `look` (a tint and flat shapes: lily pads, rocks, a far bank, a
  sandbar) draws over the water until the spot is painted (CR-1). A spot may set its own casting area (`water`), and
  surface features drift within it. The bench's pickers gained ids, and a browser check shows the spots differ.
- **4.7** Weather and life on a spot (D100), done by later work rather than as one task: the sky and its clouds in
  Phase 12 (D169, D170), the waves with the wind's strength and direction (D176, D177), the painted reeds swaying in
  it. Their art is CR-2.
- **4.1** The sprite atlas and Aseprite export, dropped (D178): the art is drawn as code or in MS Paint.

## Phase 5: Items and inventory (done 2026-11-22)

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
- **Events, once more (D87)** `once` defaults to true; requirements on the weather's four levels, with exact, at
  least, at most and between amounts; a front matter key given twice is an error.
- **Event text (D88)** Placeholders (`{name}`, `{class}`…, filled by `src/ui/event-words.js`) and conditional
  text in square brackets (`tools/event-text.mjs`, `parseText`); slide, choice and title text became lists of parts,
  each with its own string key, which the engine picks from when a slide opens (`textNow`). A `gender` requirement.
- **Arriving (D89)** `trigger: arrive` and the `location` / `spot` requirement words; a new game arrives at its
  location, and so does a move with the bench's pickers. An empty `gain:` or `lose:` line now says what's missing.
- **4.6 How the art is made (D90)** `docs/art.md`: the loop, how to ask for changes, drawing at real size in MS
  Paint, the sizes and the style rules as they stand. `art.html` (`src/art.js`) is the art sheet: trials from
  `src/art-trials.js`, the scene at noon, sunset, in rain, in snow and at night, every sprite and icon enlarged on
  its pixel grid, and the palettes. `createScene` takes a `SceneLook` for trials; the first knob is the reeds'
  blade count. `tools/sprite-png.mjs` exports any grid sprite as a PNG on magenta and imports PNG or 24-bit BMP back
  into keys, with no image library (zlib only); a test round-trips every sprite and reads filtered RGB, 4-bit palette
  and BMP files. `npm run verify` loads the sheet and saves `dist/verify/art.png`; a test keeps the sheet's import
  map the same as the game's. Each scene on the sheet has a Save as PNG button, which reads the frame back from
  the renderer at 256×256 for the owner to draw over; `verify` presses it and checks the file.
- **3.5 GitHub Pages (D91)** `.github/workflows/pages.yml` publishes on a push to `fresh-start` or `master` once
  `npm test` passes, copying only what the page loads. The art sheet fits a phone's width (a verify check), so the owner
  can look at it away from home.
- **Notes from the phone (D92–D95)** The owner played on GitHub Pages. Every fish is worth at least 1 XP; the
  weather changes half as often (a d12 at 1–3 instead of a d6), and the log shows only the new weather's description.
  A fish that gets away after the strike reels the bobber in. On a phone the scene keeps its whole-device-pixel scale
  and widens to fill the screen (D93): the 256×256 play area in the middle, strips of water, shore, waves and reeds
  either side, up to 320 pixels, so nothing the engine places can be cut off; the browser checks gained the owner's
  Pixel 9 Pro. The owner picked reeds C and bobber B from the art sheet's trials (D94); a spacer the height of the
  button row sits above the scene on a phone; the game menu and settings open in the middle of the scene, and no line
  can be cast while either is open. With advantage or disadvantage the log shows the dropped d20 struck through (D95).
  The full-bucket dialog ignores clicks for 400 ms: on a phone the strike's own tap landed on "let the new fish go".
- **Icons at 32×32 (D97, D98)** The older 16×16 grids are drawn doubled (`DRAWN_AT_16`); an icon can keep its own
  colours (`OWN_KEYS`). `npm run photo-icon` makes a first-draft icon from a photo, and the photo-to-icon skill
  describes the hand pass after it; the carp was the first. The art sheet gained a trial scene painted from a photo of
  an autumn pond. `docs/design/` became local only.
- **Dice over the scene (D99)** The fight's d20s are thrown across the scene, drawn pixel by pixel at its scale, and
  come to rest on what the engine rolled; dice that didn't count turn grey. The total floats up when they land, the
  log follows, and the catch flies when they go; the next action ends the show at once. The d20's geometry and
  numbering are SuperRollies'. Settings gained Show dice, which follows the device's reduce-motion preference until
  set.
- **The owner's fish (D101–D104)** 80 fish over nine spots from the owner's spawn table: six at the Lake, three at a
  new River, each fish's weight in a spot set by its rank. The old seven fish and the lake's old spots went; a save
  from version 5 drops them. A fish's preferences (time of day, weather, season, bait) each double its weight when
  met; fog and snow are tags on the weather cells, and bait items carry a bait kind. Each spot has schools of its
  three commonest fish and its predators as big fish (D102). No places from our world in fish names (D103). 76 icons
  were drawn from Wikipedia and Wikimedia Commons pictures, cut out and given eyes; four fish kept the default icon.
  The build grew from 386 kB to 532 kB with them. Then 42 rift fish (D104), from the rest of the world, 3 to 6 in
  each spot's `rift` table, with icons made the same way.
- **Tools for reference pictures** `npm run cutout` cuts the subject out of a busy photo (rembg) in its own Python
  environment, `.venv-cutout/`; `npm run commons` searches Wikimedia Commons into a numbered contact sheet and fetches
  a pick with its licence and author; `photo-icon eye=1` places a fish's eye.
- **Two tracks (D105)** The plan split into development and creative work (`CR-n`); development builds with
  placeholders, each listed under the creative task that replaces it.
- **5.8** A Tiny fish in the bucket has an "On the hook" button that puts it on the bait slot as a Small fish, the
  bait predators prefer. Bait kinds and placeholder baits came with D101.
- **5.3, 5.7** Sixteen unique pieces of placeholder gear in the shared treasure list: four rods (the willow rod, ash
  rod, reed pole and dwarven steel rod), two lines, a bobber, two hats and seven trinkets, using the game values
  nothing used yet. The chum got its downside, and "every upside has a downside" became an error, bait aside. Unique
  rewards already found are left out of a junk trade. The equipment check scrolls a long bag.
- **Junk and stuff (D112)** Junk is grey and of no use but its value; things used for something (the bottle, map
  fragments, the lorebook's pages) became the category `stuff`, white. The bag gained a Junk tab, the `useful` flag
  went, and the content check keeps junk grey and without a use.
- **5.6** The review of D8 (D179): the UI stays plain DOM; what is ahead for it is more of the same kind.

## Phase 6: Classes, levels, abilities, knowledge (in progress)

How it works is D96.

- **6.6** Perks as content (`content/perks/`, `src/engine/perks.js`); the save keeps only the perks taken, level by
  level, and what is owed is worked out from the level. Passive perks feed the game values as items do. Crits as D96:
  a natural 20 lands the fish unless the fish's own d20 is a 20 too. The bench grants perks.
- **6.1** Choosing a perk: a badge on the character button, and the choice in the character pane; a level-up never
  stops the game.
- **6.2, 6.7** The action bar under the button row (`src/ui/actionbar.js`), keys 1–9: active abilities with cooldowns
  that count attempts at a catch (`src/engine/abilities.js`). Jump In and Gut light up after something happens and
  stay lit until the next line goes out.
- **6.3** The last level 3 and 5 perks (D106): Rift Fishing brings fish from the spot's rift table now and then,
  twice as often with Bend Reality held; a Greedy fish brings a loot roll with it; Ever-Summoning makes every other
  cast a certain bite; Bend Reality makes the fish just caught one band and one rarity higher; Fence offers two
  treasures to keep one of (save version 7, `pendingTreasure`) and shortens Gut's cooldown; Polish waits for junk and
  turns it to treasure.
- **6.4** The number a fish needed shows from level 1 (D107): each roll record says whether the player sees it, from
  a level in `rules/levels.json` or a perk or item with `revealResistance`, `revealBite` or `revealTreasure`.
- **6.8** The fish's dice on the desk (D99, D107): once its roll shows, its d20s come in from the top right in teal;
  the resistance roll records its dropped dice from the same draws.

## Phase 7: Events (done 2026-11-10)

7.1–7.3 are above, under Phase 5, where they were written up as they landed.

- **7.6–7.10** Event words for the owner's ideas (D108, `docs/events.md`): counters among the flags (`add:`,
  `needs: count`, `{#name}` in text), fish taken from the bucket (`lose: fish`, the least valuable first; of a species,
  the smallest first; `lose: rarest fish`; `needs: fish`), visitors who come back after so many casts or days
  (`again:`, with the save keeping when each event last started), the player moved and held at a location (`go:`,
  `lock:`, `unlock:`; travel and the map refuse the rest), and every useless piece of junk traded at once for a reward
  picked by their total value from a `rewards` table (`trade: junk`). Save version 8.
- **7.4** A placeholder quest chain, the message in a bottle: an item starts it, a stranger at the lower river takes
  three roach, a package on the line brings the reward. Item, arrive, hand-in and needs triggers, linked by flags; a
  test plays it through. Adding the bottle to the Lake's junk changed which junk a seeded cast brings up, so the
  browser check now reads the item's name from the log rather than expecting one.
- **7.5** The content editor (`editor.html`, D47): forms drawn from the schemas, saving into `content/` through the
  browser's File System Access API (Chrome, Edge), events as text. Its browser check stands the private file system
  in for the folder picker; the first run read the file back before the save had finished.
- Phase end, measured at the review on 2026-11-10 (after D112): `npm run check` passes, with 197 unit tests and every
  browser check; the artifact builds at 708.5 kB.

## Phase 8: World and town (in progress)

- **8.1, 8.5** What the player knows of each place (`src/engine/knowledge.js`, D109): spots with `learnAfter` are
  noticed after that many casts at their location, or from an event's `learn:`; the map lists only known spots. Each
  location has its list and a completion, hidden until revealed (level 3, or `revealCompletion`). The journal shows
  each place's found entries and silhouettes of the rest. Save version 9; an old save keeps every spot. The spot map
  of placeholder shapes (8.1) was never built: the owner's map (D161, 12.1) took its place.
- **8.2, 8.4** Hidden places (D110): a hidden location stays off the map until its map fragments are found or an event
  opens it (`open:`); `close:` takes a quest's place away. The Mage Tower pools are a placeholder: one pool, six fish,
  three fragments in the junk. Save version 10.
- **8.7** Item sets and readable pages (D111): sets are content (`content/sets/`), their pieces unique items with
  `set`, and an item's `page` reads in its tooltip. Events check `needs: set` and take pieces with `lose: set`; the
  journal shows each set's progress. A placeholder three-page lorebook, from the owner's story notes, and a scholar
  who comes by while the player holds a page.

## Phase 9: Balance and finish (in progress)

- **9.3** A save to a file: Save to a file in the in-game menu downloads the game as JSON; Load from a file on the
  title screen reads one, migrated, into a slot the player picks, asking before overwriting.
- **9.4** The collection in the journal (R4.3): every species caught, its records on a tap, silhouettes for fish that
  got away before one was caught, then the treasure found. It later moved into per-place sections (8.5).
- **9.1** `npm run sim` (`tools/sim.mjs`): seeded games per class on the real engine, the player striking within a
  reaction range, taking perks, using abilities and answering every prompt. It reports outcomes, what came up, fish
  rarity, XP per cast, casts to each level, abilities and events. A test checks it plays every cast and is repeatable.
- **9.2, 9.3** Placeholder sounds made with the Web Audio API (`src/audio.js`): the cast, the splash of a bite, a
  catch, an escape, a find, the dice and a level. The volume is a setting, 60 of 100 to start; the sound starts on the
  first tap or key.

## Review 2 (2026-11-10)

A code and docs review of everything since Review 1, by four reviewers (engine, page, tools and tests, docs), each
finding checked before it was fixed.

- **Engine:** no ability can be used while a full bucket or two treasures wait for a choice: Gut could overwrite
  Fence's pair, and Jump In a fish waiting for a full bucket. Travel waits for that choice too, and puts out lit
  abilities. An event's XP levels up like a cast's (`levelUp`, now in `perks.js`): the level-1 ability given, a perk
  owed logged. Bend Reality writes the bent fish's own record into the book. Gut draws only from the abilities'
  stream (D4).
- **Page:** the bucket and treasure dialogs act on the state as it is when clicked, not as it was when they opened;
  leaving for the title screen drops dice still rolling; no dialog opens before the dice land; the action bar gives
  the keyboard back after a click; Ctrl, Alt and Cmd with a number use no ability; the settings pane isn't rebuilt
  under a slider being moved; the dialogs' Escape guards are added once.
- **Editor:** typing in a field marks the file changed; "+ new" won't save over a file that is there; an emptied
  number box leaves the key out; saving a file whose id differs from its name asks first.
- **Content checks:** a map fragment of no location, a cooldown with neither casts nor time, a perk's `cooldowns` for
  something that isn't an active perk, a spot's water box out of order, and an event picture that isn't there. A test
  shows each newer check catching a mistake.
- **Browser checks:** the spot check compares the looks painted (`body[data-spot-look]`), since the moving water made
  two pictures of one spot differ and the check could never fail; two checks wait for what they test instead of a
  fixed sleep.
- **Cooldowns (D113, the owner's call):** an ability used while the line was out came back one cast early, since
  that cast counted towards its cooldown. A cooldown now counts from the next line out, as the ability's buff does.
- **Docs:** brought up to date with the code; decisions changed by later ones point at them; REVIEW.md items
  overtaken by later work are marked for the owner.
- Measured: `npm run check` passes, with 200 unit tests and every browser check; the artifact builds at 709.5 kB.

## Phase 10: The night, the town and the stew (built 2026-11-14, overnight)

The owner's brainstorm (`docs/brainstorm-2026-11-14.md`, D123), built with placeholders while the owner slept.

- **10.1** Placeholders marked where they live (D124): `"placeholder"` in content, `placeholder: true` in events,
  `PLACEHOLDER_UI` for the game's own text; `npm run content` writes `docs/placeholders.md` and the bundle carries
  the keys, so `?ph` marks them with a °. The schemas got the field by inserting one line each: rewriting them with
  `JSON.stringify` had reflowed every file.
- **10.2** The clock's weekday (day 0 a Monday); buffs that last game minutes (`until`); time passing in half-hour
  steps (`src/engine/passage.js`), shared by casts and by `wait:` and `sleep:`; `buff:`, `shop:`, `needs: vendor`,
  `needs: perk`, `needs: weekday`. An event's `go:` arrives when the event closes, which is how the night's "straight
  to the inn" reaches the innkeeper.
- **10.3** White items as a tier (D125): a second d100 against `stuffThreshold`, Stuff Find, the Rogue's +10 as a
  class effect; the CSV's plants and the other white things in per-spot `stuff` lists. The extra roll shifted the
  dice of a seeded test that waited for the Rogue champion to steal something; it settled once the stuff lists existed.
- **10.4** The town: a location with `town: true`, no casting, its places drawn as squares and triangles
  (`src/scene/views.js`), a click going to a place or opening its dialogue again; the welcome, nightfall, the
  innkeeper (the owner's words), the inn, the room. The welcome made every new game open with a dialog, so the
  browser checks, the balance sim and the unit tests' helpers now take an event's last choice (staying, leaving).
- **10.5** Barter (R18): vendors in `content/vendors/` with schedules and offers; `src/engine/barter.js`; the barter
  window as a pane; trades counted as `trades-<vendor>` counters; potions used from the bag by right-click.
- **10.6** Cold and night (D126): worked out from the state like the class fish's effects; shown on the buff bar.
  A perk test that read a raw Fishing Skill caught a chilly morning and now compares against the same moment.
- **10.7** The stew (D127) and every fish's stew buff, by rule; new game values. Save version 12.
- **10.8** A fish's options on right-click or long-press (`src/ui/menu.js`); Tiny fish hooking moved there from the
  bucket's buttons.
- **10.9–10.11, 10.13** Fish that swim (D129, `src/scene/swim.js`): side views turned level from the icons (a check on
  a synthetic diagonal showed the turn's direction, 29×5 one way, 17×27 the other), the aquarium, the dive (D128),
  shadows under the surface, the hook pointer. The turned icons were replaced by fish drawn as code (D131).
- **10.12** The haunted swamp and the Old torn doll; at weight 12 the doll turns up within 200 casts in 83% of
  simulated games with no Treasure Find (weight 9 gave 77%).
- **10.14** Measured at the end: `npm run check` passes, with 226 unit tests and every browser check (a new one walks
  the town: the map, the innkeeper, the room, the inn, the stew); the artifact builds at 915.4 kB.
- **10.15** The owner's answers (D130): the town hidden until nightfall, the cold from dark, no Release in town, the
  Warm woolen hat at the inn (a placeholder).
- **10.16** The title screen under the water (D134): the art sheet's tank across the scene, with fish caught in any
  slot and the reedy shore's.
- **10.17** The title's logo (D135, `src/scene/logo.js`): ROLL with the d20 as its O, "for fishing" under it.
- **10.18** Fish keep to their depth (D136): every fish's `swims` quarter, used wherever fish swim side on.
- **10.19** Fish Find by depth (D137): `bottomFishFind` and `otherFishFind`, and the Heavyweight heavy weights.

## Alongside the tasks (2026-11-11 to 2026-11-14)

Work that came from the owner's asks rather than a numbered task; the decisions hold the detail.

- **Painted spots** (D115-D118): the pond trial became still water's scene, the reedy shore was painted from the
  owner's sketch, then in four seasons; the original scene left the art sheet.
- **The page** (D119-D121): tooltips on hover, the action bar on the scene's bottom left, the page 1.25 times larger
  on a wide screen.
- **Every fish drawn to swim** (D131, CR-17): shapes and colours as code, replacing D129's turned icons.
- **The font** (9.7, D132): Alegreya Sans by default, Pixelify Sans as a setting.
- **CI off, the branches swapped** (D133): `master` publishes.
- **Event pictures** (D142): 64×64 icons in a round portrait, an old scroll by default.
- **Backgrounds** (D143-D145): the first load shows only the background; a pine tabletop for the light theme,
  obsidian for the dark, and a setting to turn them off.

## Phase 11: What the real species do (in progress)

- **11.1** Taste (D138): `taste`, `tasteLine` and `parasites` on all 122 fish; the grade's factor on a bowl's
  minutes and a raw fish's casts; the Queasy debuff from a hidden d100; `state.tasted` and a `taste` stream (save
  version 13); the line in the log, the journal and, for a Sushi enjoyer, the tooltip. The tooltip has no way to
  see the game, so the page tells `src/ui/links.js` when to show a taste (`showTasteWhen`). Measured: 236 unit
  tests, and a browser check that plants the perk and two roach in a save, eats one and reads the log and the
  tooltip.
- **11.13** The stocked pools and Look Underwater (D139): `src/engine/pool.js` tends a pool when it is looked at
  (`castLine`, the dive, the look, and the page before each redraw between casts); `state.pools` and a `pool`
  stream, in save version 13 with 11.1. Seven seeded unit tests had counted on an empty pool and now count the fish
  the player has met; two browser checks changed (the collection's fish got away under the new dice, and the dive's
  timer is waited for). The look reuses the title's water with the spot's own plants. Measured: 239 unit tests, a
  browser check that stocks a pool of 12, looks, and taps back to the bank; the artifact builds at 1041.0 kB.
- **11.2** Endangered fish (D140): `endangered` on 16 fish, the Conservationist perk, `conserve` in
  `src/engine/barter.js` called from both ways of letting a fish go, counted in a flag so the save needed no new
  version. Six web searches for Red List statuses confirmed five species and left the rest to memory (REVIEW.md).
  Measured: 240 unit tests, one of which checks that every spot has exactly two endangered kinds.
- **A fix to 11.13:** `startDive` took the streams, then stocked the pool, then wrote the old positions back,
  winding the pool stream back. Found reading the code back; a test now fails on the old order.
- **11.3** Fight styles (D141): `fights` and `fighter` on all 122 fish, `rules/fight-styles.json`, a `fight` phase
  in `src/engine/cast.js` (`fightStrike`, a timeout in `tickCast`), the tilt and a head-shaker's throw in `strike`,
  `fightFor` in `src/engine/game.js` drawing from a new `fight` stream (save version 14). Three test helpers and
  the sim strike again when a cast goes to `fight`. The scene sees the fight as a wait, then a bite, so it needed no
  change. Measured: 244 unit tests; the sim's catch rates unchanged within noise (it strikes fast).
- **11.4** Weight (D146): the scientific names from the owner's reference lists, mapped back through D103's renames;
  117 species looked up on FishBase by three helpers in parallel, reading the summary pages with curl so the numbers
  weren't retyped; every fish checked at its largest size for anything absurd (the electric eel was). A `condition`
  stream (save version 15), `fishWeight` in `src/engine/fish.js`, the heaviest record in the book. Seeded tests that
  compared streams around the pool's stocking now leave the condition stream out too. Measured: 248 unit tests.
- **11.5** Swimming (D147): `swim` on all 122 fish, written by a script from seven ways of swimming and per-species
  changes; `createShoal` (`src/scene/swim.js`) rests, bursts with the species' lunge, and winds. Measured: 249 unit
  tests, every browser check; the motion itself not seen.
- **11.6** The adjustable line (D148): Fish Find per depth, `depthSources` in `valuesFor`, `setLineDepth`, a gear
  button on the action bar (the bar now takes statuses that aren't perks, with their own label and tooltip) and its
  window over the scene. A browser check plants the line in a save, opens the window and sets the bottom; the first
  screenshot showed the button's tooltip covering the window, so opening it hides the tooltip. Measured: 251 unit tests.
- **11.7** Spawning (D149): three helpers looked up each species' spawning temperatures and seasons (85 with a
  temperature, 25 with a season alone); a script turned them into windows on the scale. `src/engine/spawning.js`: the
  water (stepped in `stepTime`), `spawningIn`, `spawningNow`; spawning fish weigh three times as much in
  `preferenceFactor`, and their schools in the feature pick. A migration crashed on a file that wasn't a save, before
  the loader could refuse it, so it reads the weather carefully. Measured: 254 unit tests, every browser check.
- **11.8** Plants and fish (D150): every species' FishBase page fetched and its plant sentences pulled out by a script,
  then cut by hand; `plants` on 35 fish, `hasPlants` and the factor in `src/engine/tables.js`, `luckOf` in
  `src/engine/events.js`. The spot-table test now counts the plants (the muskie lives among them). Measured: 255 unit
  tests, every browser check.
- **11.9** Shoaling (D151): `shoals` on 27 fish; leaders and followers, and `scatter`, in `createShoal`; the dive calls
  `viewScatter` on a strike. The look's screenshot now waits three seconds, long enough for a shoal to gather; it also
  showed the ability's tooltip covering the view, so using one hides it. Measured: 256 unit tests, every browser check.
- **11.11** Who eats whom (D152): `predator` on 52 fish from the saved FishBase pages (a first pattern caught the pages'
  own menus, "Food items (preys)", everywhere; the second left them out); `eats`, `tankDanger`, `tankMeals` and
  `feedTank` in `src/engine/barter.js`, the meals on coming into the room; the warning through the fish's menu; hiding
  in `createShoal`. One full check failed when its local server stopped partway; the rerun passed. Measured: 258 unit
  tests, every browser check.

## Review 3 (2026-11-15)

A code and doc review of everything since Review 2 (D114 to D152), and a look at how the lake's rules meet. What
the rules do together, where it may not be what was meant, is at the top of REVIEW.md for the owner; nothing there
was changed. Fixed:

- **The fight (D141):** a manoeuvre nobody answered never ran out in the real game, since `timingFrom` left out
  `fightMs` (the test used the default timing); a double tap on the splash yanked the hook from a fish about to move.
- **The line's depth (D148):** set to the bottom, the "something else" roll could replace a summoned fish or a class
  fish cast by; the depth window stayed open after the line went out and could set a depth mid-cast.
- **The aquarium (D152):** its meals ran only on walking to the room, never on going up by the inn's dialog, the usual
  way, so in practice nobody was ever eaten; and a first walk there could then roll a week of meals on fish just
  put in. An event's `go:` runs them now.
- **The bucket:** fish taken back from the pot or the tank could fill it past its size.
- **Barter:** a trade worked from anywhere, and the window stayed open on walking to another place in town.
- **Saves:** a file saved while the line was out held the state with the line's dice spent, so reading it back rolled
  the line anew; a release or a meal in the pause after a missed splash wasn't saved if the player then reeled in.
- **The dive:** a failed dive set the fish's "got away" count back to one; leaving for the title mid-dive left the
  breath timer on screen.
- **The log:** "cast again" was written when an event had opened on the missed splash and no line went out.
- **Swimming (D147, D151):** a fish in a small patch (a big fish's or a class fish's shadow) rolled a new goal every
  frame and so barely moved; shoal-mates' places were rolled anew on every redraw, so a school drew together onto one
  point; followers swam tail first; goals too near the glass left fish pressing on it; taking a fish out of the tank
  moved every fish after it.
- **Bubbles:** the title's carried into the room and rose outside the tank; their speed went by the frame.

The docs were checked against the code and brought up to date: CLAUDE.md, README.md's file map, DEV_PLAN.md,
decisions.md (earlier rows now say what refined or replaced them), spec.md where later decisions contradict it,
this file's missing entries, art.md, events.md. Left for the owner: REVIEW.md's own length and its stale items, the
content checker's gaps (ids the engine names that it never checks), and requirements for the systems spec.md doesn't
cover.

Then, at the owner's word, the three fixes Claude proposed (D153): the water's trend from its own slow average
(`waterSlow`, save version 19), burbot, icefish and polar cod spawning up to 2, and pools stocked with no bait and
none of the player's values. And the schools brought in step with the shoaling marks (D154): six fish marked, six
schools retired, two new; and the big fish with the predator mark (D155): five new. Measured: 265 unit tests, every
browser check.

- **11.14** The pool turns over, and a shadow is a fish to aim at (D156): `tendPool` rewritten (a part of the day's
  turn, the met fish's days, a place for every fish), `joinPool`, `shadowsOf` and `aimedAt` in
  `src/engine/pool.js`; `bringFeature`, `fishOf` and `partFish` in `src/engine/features.js`, a school's and a big
  fish's own fish in the pool marked `of`; `rollLine` takes the aimed fish or the feature's; the schools' Fish Find
  gone from their files; save version 20. A first rule, "only the unsuited leave", turned over 3 pools in 20,
  nearly every fish having its season or hour met, so every wild fish can leave, the less likely the better
  suited. Measured: 270 unit tests, every browser check; the sim plays through.
- **11.12** The simulation under the surface (D157): `stepPools`, `driftPool` and `shoalsIn` in
  `src/engine/pool.js`, called from `stepTime` (which takes the whole dice record now) and from `resolveCast`;
  `rollLine` takes the pool's own fish for most bites, `onLine` giving it the cast's values; schools no longer come
  up from the list; `scene.swirl` for a predator's strike; the shadows keyed by each fish's number. A research pass
  on what real predators eat found usable numbers for pike only. Tuned by measuring a year of unfished pools: the
  chance to leave from 50% to 30%, spawners slow to leave where they first stayed for certain, the crowd's cap from
  twice the number to one and a half. Measured: 275 unit tests, every browser check; the sim plays through, the
  Fish Fighter landing a fish on 28% of casts as before.
  The bench has a section for the pool here (who is in it, its schools, who spawns, the predators' chance; add
  fish of a kind and size, stock anew, empty), a button to the next part of the day, and its time buttons now pass
  time as the game does, so the weather, the water and every pool move with them.

## Phase 12: The map, the sun and the moon, the sky and its clouds (2026-11-18 to 2026-11-19)

The owner's ask (D160): clouds that follow the weather, which first needed the map, the spots' facings and the sun
and the moon. One task at a time, with the owner's refinement questions before each; their answers are in the
decisions.

- **12.1** The map from the owner's drawing (D161) and every spot that shows sky facing a compass bearing, one 60°
  width of view for all (D166): `look.facing` on each spot in `content/locations/`, `VIEW`, `facingOf` and
  `acrossView` in `src/engine/sky.js`, `test/sky.test.js`. The swamp and the town have none.
- **12.2** The sun's and the moon's height and bearing for Gdynia, and a 14-day moon whose first full moon is rolled
  (D167): `sunPosition`, `moonPosition`, `moonPhase`, `moonPhaseName`, `sunOf`, `moonOf`, `firstFullMoon`, `MOON`,
  `HORIZON` in `src/engine/sky.js`; `roll14` in `src/dice.js`; `state.fullMoonAt` (`SAVE_VERSION` 22, from the
  one-off stream `moon`).
- **12.3** The moon counts for the fish, all four ways the owner asked for (D168): phase preferences (`prefers.moon`
  on fifteen fish), solunar periods as buffs on the bar, moonlight at night, and the pools feeding in the periods;
  `src/engine/moon.js` (`moonNow`, `moonWords`, `moonlight`, `solunarPeriod`), `moonHourAngle` in
  `src/engine/sky.js`, `content/rules/moon.json`, the phase in the weather's tooltip, `test/moon.test.js`.
- **12.4** The sky as its own layer behind the still water and the reedy shore (D169, `src/scene/sky-layer.js`): its
  colour by the sun's height, the stars, the sun, the moon in its phase, and a path of glitter under a low sun or
  moon. Each sky-showing painting gives `horizon` (row 110), `skyline`, `waterLayer` and `isWater` and paints no sky
  of its own; the art sheet's "The sky (12.4)", the verify check "the sky layer".
- **12.5** Clouds that follow the weather (D170): references from Wikimedia Commons first (a contact sheet per cloud
  type, local only), then a library of cloud types drawn as code (`CLOUD_PATTERNS`, `skySpec`, `layOutSky` in
  `src/scene/clouds.js`) and a table per season and cloud level in `content/rules/sky.json`
  (`schemas/sky.schema.json`); the 23 descriptions that name a sky as their own case; fog hiding the sky; Downpour,
  Heavy downpour and Hail moved up to black, a storm overcast that brings a dusk; the light coming and going with a
  cloud over the sun (`setShade` in `src/scene/sky.js`); the still water mirroring the sky (`mirrorSky`); fewer
  glints under cloud. Measured: every unit test and browser check pass, with a new check, "the clouds", and its
  screenshots (`dist/verify/clouds-*.png`); `test/clouds.test.js`.

## The testers' fixes (2026-11-18 to 2026-11-19)

The owner's list after testers played on phones, built before Phase 12 went on, one task at a time.

- **T.1** On a phone, a tap on the scene closes an open pane and does nothing else; a second tap casts (D162,
  `closedByTap` in `src/main.js`). A wide screen, 900 px and up, is unchanged.
- **T.2** A long press equips on a touch screen, as a right-click does with a mouse, and touch dragging went; a fish
  in the bucket keeps its long-press menu. An equippable item's tooltip says how, by the last pointer used (D163,
  `hold` in `src/ui/drag.js`, `quickMove` in `src/main.js`).
- **T.3** A tap or left click on a paper-doll slot opens a list of what in the bags fits it, as WoW's flyout (D164,
  `slotFlyout` in `src/ui/panels.js`).
- **T.4** The stew cooking for two game hours and the inn's morning greeting (D165), taken back after testing (D172):
  the stew's buff stands still in town and asleep instead.

## Alongside the tasks (2026-11-19 to 2026-11-22)

After Phase 12, from the owner's asks; the decisions hold the detail.

- **The open water** (D171): the reedy shore's lake without the reeds is the default scene for every spot without a
  painting of its own, each facing its own way, with an art sheet testbed to turn it by hand.
- **Skies on the art sheet only** (D173–D175): the special sky (the land's magic, a film of colour over the night), the
  blood moon (a full moon gone red over a red night) and the green sun (a cloudless summer sun gone green). How the
  game brings them is still open (DEV_PLAN.md, "From our talks").
- **Clouds** (after D170): broken masses that no longer cut off at their box, lopsided towers, a noise-drawn overcast,
  blue between the cells of a dry spring and summer overcast.
- **The wind** (D176): a direction on its own hexflower, each season blowing as Gdynia's wind rose says, turned for a
  sea due east; the clouds drift by the share across the view.
- **The waves** (D177): the open water and the reedy shore draw their ripples live, more, longer and darker in a
  stronger wind, rolling in or out with its direction.
- **Ideas written down** (`docs/ideas.md`): the town and the lands around it, the dwarven caravan, the stew's makings
  and the well; other guests at the stew.
