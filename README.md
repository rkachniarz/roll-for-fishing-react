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
                 # and http://localhost:8001/art.html for the art sheet
npm run content  # after editing content/: checks it and regenerates the game's copy
npm test         # unit tests
npm run verify   # browser checks (headless Chromium); `npm run verify strike` runs only those
npm run build    # single-file copy in dist/artifact.html
npm run check    # all three in turn: test, verify, build (what ends a phase)

npm run sprite list                    # the sprites that can go out to MS Paint
npm run sprite export bobber           # -> art/bobber.png, to draw on
npm run sprite import art/bobber.png   # a drawing back into code (PNG or 24-bit BMP)
npm run photo-icon docs/design/photo-carp.jpg name=icon-fish-carp   # a photo to a first-draft 32×32 icon
npm run cutout setup                         # once: the Python tools' environment (.venv-cutout/)
npm run cutout docs/design/refs/Ruffe.jpg    # cut the subject out of a busy photo, onto magenta
npm run commons search ruffe "Category:Gymnocephalus cernua" shape=wide   # Commons pictures to pick from
```

How the art is made, and drawing for the game in MS Paint: [docs/art.md](docs/art.md).

No build step is needed to play: any static file server works. The game is published to GitHub Pages from every push
to `fresh-start` whose tests pass (`.github/workflows/pages.yml`): https://rkachniarz.github.io/roll-for-fishing-react/,
and the art sheet at `/art.html` there.

## Files

| Path | What |
|---|---|
| `index.html` | The page, and the import map pinning PixiJS |
| `art.html` | The art sheet: trials, every sprite enlarged, the scene in five lights (`src/art.js`, `src/art-trials.js`; how we work: `docs/art.md`) |
| `art/` | The owner's real-size drawings, and sprites exported to draw on |
| `styles.css` | Layout: scene above the panel on phones, beside it on wide screens |
| `content/` | Game content as data, one JSON file per thing: fish, items, locations, classes, weather, surface features, tables, rules; events are text (`.md`) |
| `schemas/` | A JSON Schema per kind of content; VS Code uses them to check and complete content files |
| `src/generated/content.js` | Built from `content/` by `npm run content`; don't edit |
| `src/strings.js` | `t()`: all player-facing text goes through it |
| `src/save.js` | The three save slots in the browser's storage |
| `src/settings.js` | Settings, kept per device: the theme |
| `src/ui/buffbar.js` | The buff and debuff bar over the scene's top right |
| `src/ui/actionbar.js` | The action bar under the button row: abilities, cooldowns, glows |
| `src/dev.js` | The `?dev` bench: game values, world, character, inventory, buffs |
| `src/main.js` | Wiring: input → engine → scene and page; character creation; saving |
| `src/rng.js` | Seeded random streams (from SuperRollies) |
| `src/dice.js` | The dice: `roll20`, `roll2d6`, `roll100`… |
| `src/engine/cast.js` | One cast: waiting, bite, strike, reaction grade, the d20 roll |
| `src/engine/values.js` | Game values and the effect vocabulary |
| `src/engine/tables.js` | Weighted tables from a location's and spot's lists; what fish prefer (D101) |
| `src/engine/fish.js` | One fish: species, subname, size band, size, difficulty, rarity |
| `src/engine/state.js` | The game state: new game, saves and their migrations, the random streams |
| `src/engine/game.js` | One cast from the game's side: the line, the strike, what it changes; buffs |
| `src/engine/equipment.js` | The equipment slots; moving items between them and the bags |
| `src/engine/events.js` | Events: requirements, choices and their effects, the event meter and other triggers |
| `src/engine/character.js` | Character creation: names, classes, stat rolls |
| `src/engine/perks.js` | Perks: what each level offers, what is owed and taken, passive perks' effects |
| `src/engine/abilities.js` | Active abilities: the action bar's contents, cooldowns, which are lit |
| `src/engine/features.js` | Surface features: appearing, drifting, thinning out; the open water's bounds |
| `src/engine/time.js` | Game time: minutes per cast, days, seasons, part of the day |
| `src/engine/weather.js` | Weather drifting over each season's hex map (`hexmap.js`: the layout) |
| `src/scene/scene.js` | The PixiJS fishing view; whole-pixel scaling |
| `src/scene/sprites.js` | Placeholder pixel art, drawn by code |
| `src/scene/sky.js` | Time of day, season and weather on the scene: tints, cloud shadows, rain, snow (`light.js`: the day's light curves) |
| `src/scene/pond.js` | A trial for the art sheet only: a whole scene painted from a photo (`docs/design/photo-autumn-pond.jpg`) |
| `src/scene/dice.js` | The fight's d20s thrown over the scene, coming to rest on the numbers rolled (D99; `d20.js`: the die's shape and numbering) |
| `src/scene/icons.js` | 32×32 icons (D98): items and fish (a default for each kind), the button row, the weather; rarity colours |
| `src/ui/flight.js` | A catch's icon flying from the bobber to the bucket or bag |
| `src/ui/floater.js` | How a strike went, floating up from the bobber |
| `src/ui/log.js` | The log under the scene |
| `src/ui/links.js` | Names of fish and items, links to them in rarity colours, bag tabs |
| `src/ui/tooltip.js` | The one tooltip, for links and slots |
| `src/ui/drag.js` | Dragging items between the bag and the slots, by mouse and long-press |
| `src/ui/event-words.js` | The placeholders in event text (`{name}`, `{class}`…), and putting a slide's text together |
| `src/ui/effects.js` | An item's effects as tooltip lines, green or red |
| `src/ui/errors.js` | Red error text over the scene ("Must have a fishing pole equipped.") |
| `src/ui/panels.js` | The panes: character (the paper doll), journal, map, bucket, bag (over the log), menu |
| `test/` | Unit tests (`node:test`) |
| `tools/content.mjs` | Checks content and builds the generated module, plus `dist/content-overview.html` |
| `tools/event-text.mjs` | Reads the event text format (`content/events/*.md`) and holds its vocabulary |
| `tools/verify.mjs` | Browser checks (Playwright) |
| `tools/sprite-png.mjs` | Sprites out to PNG for drawing in MS Paint, and PNG or BMP drawings back into the code's grids |
| `tools/photo-icon.mjs` | A photo to a first-draft 32×32 icon, a fish's eye included (`eye=1`); the photo-to-icon skill |
| `tools/cutout.py` | Cuts the subject out of a photo (rembg), onto magenta or transparent; run by `tools/py.mjs` |
| `tools/commons.py` | Wikimedia Commons pictures: search to a contact sheet, fetch a pick with its licence |
| `tools/py.mjs` | Runs the Python tools in their own environment, `.venv-cutout/` (`npm run cutout setup`) |
| `tools/build-artifact.mjs` | Builds `dist/artifact.html` |
| `docs/` | Spec, decisions, history, porting notes, design sketches; `docs/events.md` is how to write an event, `docs/art.md` how the art is made, `docs/ideas.md` the owner's ideas for events and the story |
