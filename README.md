# Roll for Fishing

A pixel-art fishing game: cast, watch the bobber, strike when it splashes, and roll a d20 to land the catch. A tribute to
World of Warcraft fishing, crossed with tabletop dice. Plays on phones and desktop browsers.

The game is in early development: see [DEV_PLAN.md](DEV_PLAN.md) for where things stand, and
[docs/spec.md](docs/spec.md) for what it's meant to become. The original React prototype is at the tag
`legacy-prototype`.

## Running it

```bash
npm install
npm run dev      # then open http://localhost:8001 (add ?dev for the dev bench)
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
| `content/` | Game content as data, one JSON file per thing: fish, items, locations, classes, weather, surface features, tables, rules |
| `schemas/` | A JSON Schema per kind of content; VS Code uses them to check and complete content files |
| `src/generated/content.js` | Built from `content/` by `npm run content`; don't edit |
| `src/strings.js` | `t()`: all player-facing text goes through it |
| `src/save.js` | The three save slots in the browser's storage |
| `src/settings.js` | Settings, kept per device: the theme |
| `src/ui/buffbar.js` | The buff and debuff bar over the scene's top right |
| `src/dev.js` | The `?dev` bench: game values, world, character, inventory, buffs |
| `src/main.js` | Wiring: input → engine → scene and page; character creation; saving |
| `src/rng.js` | Seeded random streams (from SuperRollies) |
| `src/dice.js` | The dice: `roll20`, `roll2d6`, `roll100`… |
| `src/engine/cast.js` | One cast: waiting, bite, strike, reaction grade, the d20 roll |
| `src/engine/values.js` | Game values and the effect vocabulary |
| `src/engine/tables.js` | Weighted tables from a location's lists, with weather bonuses |
| `src/engine/fish.js` | One fish: species, subname, size band, size, difficulty, rarity |
| `src/engine/state.js` | The game state: new game, saves and their migrations, the random streams |
| `src/engine/game.js` | One cast from the game's side: the line, the strike, what it changes; buffs |
| `src/engine/equipment.js` | The equipment slots; moving items between them and the bags |
| `src/engine/character.js` | Character creation: names, classes, stat rolls |
| `src/engine/features.js` | Surface features: appearing, drifting, thinning out; the open water's bounds |
| `src/engine/time.js` | Game time: minutes per cast, days, seasons, part of the day |
| `src/engine/weather.js` | Weather drifting over each season's hex map (`hexmap.js`: the layout) |
| `src/scene/scene.js` | The PixiJS fishing view; whole-pixel scaling |
| `src/scene/sprites.js` | Placeholder pixel art, drawn by code |
| `src/scene/sky.js` | Time of day, season and weather on the scene: tints, cloud shadows, rain, snow (`light.js`: the day's light curves) |
| `src/scene/icons.js` | 16×16 icons: items and fish (a default for each kind), the button row, the weather; rarity colours |
| `src/ui/flight.js` | A catch's icon flying from the bobber to the bucket or bag |
| `src/ui/floater.js` | How a strike went, floating up from the bobber |
| `src/ui/log.js` | The log under the scene |
| `src/ui/links.js` | Names of fish and items, links to them in rarity colours, bag tabs |
| `src/ui/tooltip.js` | The one tooltip, for links and slots |
| `src/ui/drag.js` | Dragging items between the bag and the slots, by mouse and long-press |
| `src/ui/effects.js` | An item's effects as tooltip lines, green or red |
| `src/ui/errors.js` | Red error text over the scene ("Must have a fishing pole equipped.") |
| `src/ui/panels.js` | The panes: character (the paper doll), journal, map, bucket, bag (over the log), menu |
| `test/` | Unit tests (`node:test`) |
| `tools/content.mjs` | Checks content and builds the generated module, plus `dist/content-overview.html` |
| `tools/verify.mjs` | Browser checks (Playwright) |
| `tools/build-artifact.mjs` | Builds `dist/artifact.html` |
| `docs/` | Spec, decisions, history, porting notes, design sketches |
