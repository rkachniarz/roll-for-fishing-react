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
