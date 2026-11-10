# Roll for Fishing: notes for Claude

A pixel-art fishing game for phone and desktop: cast, watch the bobber, strike when it splashes, and roll a d20 to land
the catch. PixiJS for the scene, plain DOM for the UI, no framework, no build step to run it. See README.md for the
file map.

## Development plan

**Read `DEV_PLAN.md` before starting work.** It holds the open questions and the remaining phases, with tickboxes. Tick
tasks off as they land. It has two tracks (D105): development, and creative work (art, writing, sound, `CR-n`).
**Creative work never blocks development:** when a task needs art or text that isn't there, build it with a
placeholder (squares and triangles, a plain sentence, a stand-in rule in REVIEW.md) and list the placeholder under the
`CR-n` task that will replace it. The rest is in `docs/`, read when a citation calls for it, since code comments cite all of these
by number:

- `docs/decisions.md`: the decision log, `D1` onwards. Record new decisions there rather than silently changing
  requirements.
- `docs/spec.md`: the vision, requirements (`R1.1`–`R16.5`) and catalogues (`§C.1`–`§C.6`).
- `docs/history.md`: finished phases, task by task, with what was measured.
- `docs/events.md`: how to write an event, and every word of the format (D84).
- `docs/art.md`: how the art is made with the owner (D90): style rules, sizes, trials, drawings in MS Paint. Read it
  before changing any art.
- `docs/REVIEW.md`: guesses and calls Claude made that the owner hasn't checked yet. **Add to it** whenever you pick a
  number, write content, or decide something the owner didn't (D76); the owner deletes items once settled.
- `docs/ideas.md`: the owner's loose ideas for events, people and the story, not requirements yet. Read it before
  writing events or content; the engine work they need is in DEV_PLAN.md.
- `docs/PORTING-NOTES.md`: what to port from the React prototype (tag `legacy-prototype`; read old files with
  `git show legacy-prototype:src/Data/weather.js`) and the lessons it taught.

Pushing `fresh-start` publishes the game to GitHub Pages once `npm test` passes (D91):
https://rkachniarz.github.io/roll-for-fishing-react/ (and `art.html`). Push only when the owner asks.

A phase ends with `npm test` and `npm run verify` passing, then `npm run build` (`npm run check` does all three), then a docs refresh: DEV_PLAN.md
(ticks, "Where things stand"), history.md, this file, README.md.

**UI: when in doubt, copy World of Warcraft (D29).** If you aren't sure how WoW does something, ask the owner instead
of guessing.

**Strings the owner changes:** when text in `src/strings.js` or `content/` changes without Claude changing it, the
owner did it on purpose (D85). Keep it; don't put Claude's wording back.

## Commands

```bash
npm install
npm run dev     # http://localhost:8001 - must be served, ES modules don't load over file://
npm run content # check content/ and regenerate src/generated/content.js (run after editing content)
npm test        # unit tests (node:test): rng, dice, content, weather, time, fish, the game engine
npm run verify  # browser checks in headless Chromium; starts its own server on :8123
npm run verify strike   # only the checks whose label contains "strike"
npm run build   # -> dist/artifact.html, the single-file copy for claude.ai
npm run check   # test, verify, build in turn, stopping at the first failure
npm run sprite export bobber   # a sprite as art/bobber.png to draw on; `import <file> [keys=icons] [bg=ffffff]` reads one back
npm run photo-icon <photo> name=icon-fish-<id>   # a first-draft 32×32 icon from a photo; follow the photo-to-icon skill
npm run cutout <photo> [flip=Name]   # cut the subject out of a busy photo, onto magenta (first: npm run cutout setup)
npm run commons search <slug> "<query>"   # Wikimedia Commons pictures on a contact sheet; then commons fetch <slug> <n> name=<Name>
npm run sim [casts=500 games=20 class=rogue-fisher strike=250..900 perks=first|passive|active]   # balance: seeded games per class (9.1)
# http://localhost:8001/art.html   the art sheet: trials, every sprite enlarged, the scene in five lights
# http://localhost:8001/?dev       dev bench; ?seed=N seeds a new game (a save wins); ?wait=MS fixes the bite delay
```

Screenshots from `verify` land in `dist/verify/` (untracked).

## Things that look arbitrary but are not

- **`src/generated/content.js` is generated and committed (D43, D72).** Edit `content/`, then `npm run content`; a test
  fails if the two disagree. Text in it is keys (`fish.pike.name`); read it with `t()` from `src/strings.js` (D46).
- **Content ids are permanent (D44).** Never rename or delete one; set `"retired": true` instead.
- **`src/engine/game.js` (`castLine`) rolls everything on the line when it goes out (D63),** hidden, and returns a
  `checkpoint` to save while the cast is in progress: buff charges spent, nothing else (D74). Saving the full state
  mid-cast would let a reload reroll the line.
- **The save holds every random stream's position (D53),** not just the seed. Take dice with `diceFrom(state)` and
  store `commit()` in the next state; never create a stream from the seed mid-game.

- **`src/dice.js`: the dice are separate named functions on purpose (D5).** `roll20`, `roll2d6`, `roll100`… Don't
  merge them into a generic `roll('NdM')`. A new die is a new function in the same style.
- **Nothing that affects an outcome may use `Math.random` (D4).** Draw from a stream: `deriveSeed(seed, 'label')`, one
  label per consumer, so extra draws in one system never shift another. Cosmetic randomness in the scene uses the
  `scenery` stream for the same reason (it keeps screenshots reproducible).
- **`src/engine/` takes `now` as an argument and never reads a clock (D7).** That's what lets the tests play a whole cast
  in a few lines.
- **`src/engine/cast.js` (`tickCast`) checks for a late strike straight after the bite starts,** in the same tick. A long
  gap between ticks (a background tab, a late strike) would otherwise skip past a bite that has already run out.
- **`src/main.js`: `biteAt` is reset to the frame that first shows the splash (D16).** The engine's scheduled time can
  be most of a frame earlier; the player is timed from what they can see.
- **`src/scene/scene.js` (`scene.fit`): the scale is a whole number of *device* pixels, not CSS pixels (D10).** At
  devicePixelRatio 2.625 a whole CSS multiple still smears. The canvas backing store is 256 tall and 256-320 wide; the
  browser scales it with `image-rendering: pixelated`.
- **The scene is wider than the play area (D93).** Strips of scenery either side fill the screen's width; everything the
  engine places, the cast and the bobber live in the `play` container in 256×256 coordinates, moved right past the
  left strip. Convert pointer positions with `scene.toScene` / `scene.toClient`, never by dividing by 256.
- **Sprites are never scaled at runtime (R7.3).** Depth uses separate sprites per depth band (`BOBBER` / `BOBBER_FAR`).
  Positions are rounded every frame.
- **`src/scene/sprites.js` (`paintBackdrop`): the dithered rows between water bands** stop the band edges reading as
  horizon lines.
- **`src/main.js` saves the `checkpoint` while a cast is in progress, the full state otherwise.** The dev bench
  only changes the state between casts for the same reason. Its game value overrides and `?wait` are `extra`
  sources passed to the engine, never saved.
- **`index.html` has a small script in `<head>`** that reads the theme from the settings key before the page draws,
  so a light page doesn't flash dark. It duplicates `src/settings.js`'s key on purpose (D81).
- **Icons are 32×32 (D98), but most grids in `src/scene/icons.js` are 16 wide:** those were drawn before D98 and
  `paintIcon` doubles them (`DRAWN_AT_16`). New icons go after that line, at 32. An icon can keep its own colours in
  `OWN_KEYS`; always draw and export with `iconKeys(name)`, never `KEYS` alone.
- **Rarity colours are CSS variables (`--rarity-*`),** not the hex values in `src/scene/icons.js`: each theme has its
  own, so use `rarityColour()` from `src/ui/links.js` for anything on the page (D81).
- **`art.html` repeats `index.html`'s import map;** a test checks the two agree. It's the art sheet, not part of the
  game, and the build leaves it out.
- **`createScene` takes a `SceneLook`** only for the art sheet's trials (`src/art-trials.js`). The game passes none;
  a knob goes once its trial is settled.
- **`styles.css`: `font-variant-ligatures: none`.** Pixelify Sans draws its "fi" ligature as an "A".
- **Equipped items are not in the bags (D83).** A slot holds a stack (`{ id, count }`); only the bait slot ever holds
  more than one, and bait is used up from it. Move items with `src/engine/equipment.js`, never by editing
  `equipped` and `bags` by hand.
- **The bag pane sits over the log, not over the scene (D83),** so it can be open with the character pane on a phone.
- **The save keeps only the perks taken, level -> id (D96).** What a character is owed is worked out from its level
  (`src/engine/perks.js`), and only the lowest owed level can be chosen, so a later level's random offer never
  depends on a choice not yet made. Universal offers come from a stream keyed by the level, never stored.
- **Cooldowns and an ability's "next cast" count attempts, not casts (D96):** a strike in time on a splash, the
  empty hook included. Ability buffs last `attempts`; one used mid-cast is `pending` and isn't spent by that cast.
  Lit abilities (`state.lit`) go dark when the next line goes out (`castLine`).
- **`src/ui/drag.js` reads `data-drag` / `data-drop` (`bag:3`, `bag:end`, `bag:pane`, `equip:rod`) off the elements;**
  `main.js` decides what a drop does. A `contextmenu` from a long-press on a phone is swallowed; only a mouse's
  right-click equips.
- **Events are `.md`, not JSON (D45, D84).** `tools/event-text.mjs` reads them and owns the vocabulary;
  `docs/events.md` is the author's guide, so a new word goes in both. The engine imports only typedefs from it.
  Event text is a list of parts, each its own string key (D88); a new placeholder goes in `PLACEHOLDERS` there and
  in `src/ui/event-words.js`, and a test checks the two agree.
- **The event dialog ignores clicks for 400 ms after it opens,** so the Space press or tap that ended the cast can't
  pick a choice.
- **`src/main.js`: the roll's log lines, the catch's flight and any dialog wait for the dice (D99),** and the next
  `apply` ends the show at once (`finishDice`). `body[data-dice]` is set while they're out; `tools/verify.mjs` waits
  for it to go before reading the log.
- **The spots hold the fish, not the locations (D101).** A location's `fish` list is empty; each spot's weights come
  from the owner's encounter ranks. A fish's `prefers` multiply its weight (`src/engine/tables.js`); the weather words
  are in `content/rules/fish-preferences.json`, and fog and snow are `tags` on the weather cells. Schools and big
  fish are listed per spot too (D102), and so are rift fish, `rift: true`, in each spot's `rift` table (D104).
- **Perks that change what comes up (D106) work through game values** (`riftChance`, `greedyChance`,
  `treasureChoice`, `junkToTreasure`), read in `rollLine` / `rollLoot` in `src/engine/game.js`, and every item that
  comes to the player goes through `receive()` there: Fence's choice of two waits in `state.pendingTreasure`, and
  Polish's buff is spent by the junk it turned.
- **`src/main.js`: a tap within 500 ms of the last action is ignored after a cast ends,** so a double tap on the splash
  strikes once instead of striking and instantly recasting.
