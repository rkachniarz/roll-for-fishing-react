# Roll for Fishing: notes for Claude

A pixel-art fishing game for phone and desktop: cast, watch the bobber, strike when it splashes, and roll a d20 to land
the catch. PixiJS for the scene, plain DOM for the UI, no framework, no build step to run it. See README.md for the
file map.

## Development plan

**Read `DEV_PLAN.md` before starting work.** It holds the open questions and the remaining phases, with tickboxes. Tick
tasks off as they land. The rest is in `docs/`, read when a citation calls for it, since code comments cite all of these
by number:

- `docs/decisions.md`: the decision log, `D1` onwards. Record new decisions there rather than silently changing
  requirements.
- `docs/spec.md`: the vision, requirements (`R1.1`–`R14.2`) and catalogues (`§C.1`–`§C.6`).
- `docs/history.md`: finished phases, task by task, with what was measured.
- `docs/PORTING-NOTES.md`: what to port from the React prototype (tag `legacy-prototype`; read old files with
  `git show legacy-prototype:src/Data/weather.js`) and the lessons it taught.

A phase ends with `npm test` and `npm run verify` passing, then `npm run build`, then a docs refresh: DEV_PLAN.md
(ticks, "Where things stand"), history.md, this file, README.md.

**UI: when in doubt, copy World of Warcraft (D29).** If you aren't sure how WoW does something, ask the owner instead
of guessing.

## Commands

```bash
npm install
npm run dev     # http://localhost:8001 - must be served, ES modules don't load over file://
npm test        # unit tests (node:test): rng, dice, cast engine
npm run verify  # browser checks in headless Chromium; starts its own server on :8123
node tools/verify.mjs strike   # only the checks whose label contains "strike"
npm run build   # -> dist/artifact.html, the single-file copy for claude.ai
# http://localhost:8001/?dev       timing panel; ?seed=N replays; ?wait=MS fixes the bite delay
```

Screenshots from `verify` land in `dist/verify/` (untracked).

## Things that look arbitrary but are not

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
- **`src/scene/scene.js` (`fitCanvas`): the scale is a whole number of *device* pixels, not CSS pixels (D10).** At
  devicePixelRatio 2.625 a whole CSS multiple still smears. The canvas backing store stays 256×256; the browser scales
  it with `image-rendering: pixelated`.
- **Sprites are never scaled at runtime (R7.3).** Depth uses separate sprites per depth band (`BOBBER` / `BOBBER_FAR`).
  Positions are rounded every frame.
- **`src/scene/sprites.js` (`paintBackdrop`): the dithered rows between water bands** stop the band edges reading as
  horizon lines.
- **`src/main.js`: a tap within 500 ms of the last action is ignored after a cast ends,** so a double tap on the splash
  strikes once instead of striking and instantly recasting.
