# Roll for Fishing

A pixel-art fishing game: cast, watch the bobber, strike when it splashes, and roll a d20 to land the catch. A tribute to
World of Warcraft fishing, crossed with tabletop dice. Plays on phones and desktop browsers.

The game is in early development: see [DEV_PLAN.md](DEV_PLAN.md) for where things stand, and
[docs/spec.md](docs/spec.md) for what it's meant to become. The original React prototype is at the tag
`legacy-prototype`.

## Running it

```bash
npm install
npm run dev      # then open http://localhost:8001 (add ?dev for the timing panel)
npm run content  # after editing content/: checks it and regenerates the game's copy
npm test         # unit tests
npm run verify   # browser checks (headless Chromium)
npm run build    # single-file copy in dist/artifact.html
```

No build step is needed to play: any static file server works, and GitHub Pages serves the repo as-is.

## Files

| Path | What |
|---|---|
| `index.html` | The page, and the import map pinning PixiJS |
| `styles.css` | Layout: scene above the panel on phones, beside it on wide screens |
| `content/` | Game content as data, one JSON file per thing: fish, items, locations, tables, rules |
| `schemas/` | A JSON Schema per kind of content; VS Code uses them to check and complete content files |
| `src/generated/content.js` | Built from `content/` by `npm run content`; don't edit |
| `src/strings.js` | `t()`: all player-facing text goes through it |
| `src/main.js` | Wiring: input → engine → scene and page; `?dev` panel |
| `src/rng.js` | Seeded random streams (from SuperRollies) |
| `src/dice.js` | The dice: `roll20`, `roll2d6`, `roll100`… |
| `src/engine/cast.js` | One cast: waiting, bite, strike, reaction grade, the d20 roll |
| `src/engine/values.js` | Game values and the effect vocabulary |
| `src/engine/time.js` | Game time: minutes per cast, days, seasons, part of the day |
| `src/engine/weather.js` | Weather drifting over each season's hex map (`hexmap.js`: the layout) |
| `src/scene/scene.js` | The PixiJS fishing view; whole-pixel scaling |
| `src/scene/sprites.js` | Placeholder pixel art, drawn by code |
| `test/` | Unit tests (`node:test`) |
| `tools/content.mjs` | Checks content and builds the generated module, plus `dist/content-overview.html` |
| `tools/verify.mjs` | Browser checks (Playwright) |
| `tools/build-artifact.mjs` | Builds `dist/artifact.html` |
| `docs/` | Spec, decisions, history, porting notes, design sketches |
