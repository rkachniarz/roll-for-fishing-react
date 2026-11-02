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

## Phase 1: Feel trial (in progress)

- **1.1–1.3** The scene from the sketch in placeholder pixel art, all drawn by code. A first pass had a bobber too small
  to react to comfortably at 2× and hard stripes between the water bands that read as horizon lines; the bobber is now
  9×14 (7×11 when cast far) and the band edges are dithered.
- **1.6** The cast engine. Its tests found a bug on the first run: a single tick moved a cast from waiting to bite but
  didn't then check whether the bite had already run out, so a strike long after the bite was still rolled. Fixed in
  `tickCast`.

## Phase 2: Engine core and the port (in progress)

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
