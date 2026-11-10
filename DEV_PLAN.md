# Roll for Fishing: development plan

What's left to do. Tick boxes as work lands; record decisions in [docs/decisions.md](docs/decisions.md) rather than
silently changing requirements. Within a phase, tasks are listed in the order they should be done; their numbers are
only ids, so a task added later keeps its number wherever it lands.

**Two tracks (D105).** The plan is split in two: **development**, which builds the requirements and the owner's ideas,
and **creative work**, the art, writing and sound. Development never waits for creative work. Where a task needs a
picture, a name or a text that doesn't exist yet, it is built with a placeholder: squares and triangles, a flat colour,
a plain generic sentence, a stand-in rule. A town of placeholder squares is better than no town. Each placeholder is
listed under the creative task that will replace it, so nothing is forgotten; a placeholder that fits no task gets a
new one.

**Where things stand (2026-11-10):** Phases 1–3 are done: the game is playable on the real engine, on GitHub Pages
(D91), with character creation, saves, the buff bar and the `?dev` bench in the owner's phone layout (D79–D81).
Phases 4–8 are under way. The bag and the seven equipment slots work (D83); events are text (`docs/events.md`, D84)
and the frog encounter is the first; perks at levels 1–8 and an action bar of abilities (D96), every class perk
working (D106). The fish are the
owner's (D101): 80 species over nine spots, six at the Lake and three at the River, each likelier in its own time,
weather, season and bait, with schools and big single predators per spot (D102), and 42 rift fish waiting for the
wizard's Rift Fishing (D104). The art has a process (D90, D97, `docs/art.md`), and most fish have icons drawn from
photos. Claude's guesses and calls are listed in [docs/REVIEW.md](docs/REVIEW.md) for the owner to check.

## Where things are

| Cited as | What | Where |
|---|---|---|
| `D1`… | Decisions and their reasons | [docs/decisions.md](docs/decisions.md) |
| `R1.1`… `§C.1`… | Vision, requirements, catalogues | [docs/spec.md](docs/spec.md) |
| `PORTING-NOTES §n` | What carries over from the prototype, and its lessons | [docs/PORTING-NOTES.md](docs/PORTING-NOTES.md) |
| `0.1`… | Finished phases, task by task | [docs/history.md](docs/history.md) |
| `Q-n`, `1.x`–`9.x` | Open questions, development still to do | here |
| `CR-n` | Creative work: art, writing, sound | here, [Creative work](#creative-work) |
| | The owner's loose ideas: events, people, the story | [docs/ideas.md](docs/ideas.md) |
| | Claude's guesses and calls, for the owner to check | [docs/REVIEW.md](docs/REVIEW.md) |

---

## Open questions

Answered ones move into decisions.md (Q-1 → D9, Q-2 → D10, Q-3 → D19, Q-4 → D20/D21, Q-5 → D11, Q-6 → D22,
Q-7 → D12, Q-8 → D23, Q-9 → D1, Q-10 → D24, Q-11 → D25, Q-12 → D26, Q-13 → D2/D3/D8, Q-14 → "Ideas for later",
Q-15 → D27, Q-16 → D37, Q-17 → D32, Q-18 → D38, Q-19 → D39, Q-20 → D40, Q-21 → D41, Q-24 → D48, Q-25 → D49,
Q-26 → D50, Q-27 → D51, Q-28 → D52, Q-29 → D53, Q-30 → D54, Q-31 → D57, Q-32 → D55, Q-33 → D58, Q-34 → D59, Q-22 → D61, Q-23 → D62, Q-35 → D64, Q-36 → D65, Q-37 → D66, Q-38 → D79, Q-39 → D70).

- **Q-40 How are hidden numbers revealed?** Hidden rolls stay hidden until something reveals them (R5.2). The number
  a fish needed shows from level 1 (D107). Still open: what reveals the bite and treasure rolls and Luck (a perk, an
  item, a class?), and where those rolls would show; the game values to reveal them are in.

---

# Development

Building the requirements and the owner's ideas. Anything the creative track hasn't delivered yet is a placeholder
(D105), named in the task and listed under its `CR-n`.

## Phase 1: Feel trial

The riskiest part first: the reflex loop and the scene tech, before anything is built on them. Requirements R2, R7.

- [x] **1.1** Pixi scene laid out like the sketch, in placeholder pixel art: water bands, waves, shore, reeds, bobber,
  line, ripples, splash (R7.1, R7.4).
- [x] **1.2** 256×256, scaled by whole device pixels, phone and desktop layouts; checked at devicePixelRatio 1, 2.625
  and 3 (R7.2, R7.3).
- [x] **1.3** Sprites as code (D9): `src/scene/sprites.js`.
- [x] **1.4** Try the timings on a real phone with the `?dev` presets and pick defaults: Normal, for now (D27).
- [x] **1.5** Check 60 fps on a mid-range phone, and that the splash-to-tap delay feels fair (no sense of lag).
- [x] **1.6** Cast engine with reaction grades, pure and tested (`src/engine/cast.js`, R2.2–R2.6).
- [x] **1.7** Write the trial up in history.md, with what was measured.

## Phase 2: Engine core and the port

Requirements R1, R3, R4, R5, R9, R11.3–R11.4, R15. Port from `legacy-prototype` (PORTING-NOTES). Ported data lands in
`content/` (D42), not in code.

- [x] **2.14** The content pipeline: `content/` laid out one file per entity, a JSON Schema per kind, `npm run content`
  (checks, bundle, string table, missing-art report, overview page), the same checks in `npm test`, and a test that the
  committed bundle is up to date (R15.1–R15.3, R15.5, R15.7, D42, D43, D46).
- [x] **2.1** `GameState` and save v1 in localStorage: versioned, saved after every resolved cast, New game (R1). The
  save holds ids only; retired content still resolves; a test loads an old save against new content (R15.4, D44). The
  save holds every random stream's position (R1.6, D53).
- [x] **2.15** Game values and the effect vocabulary: every number a modifier can change, by name (R6.6), and the
  effects items, rods, bait, buffs and events use, including dice rolled when an effect applies (R8.9, D48, D56).
- [x] **2.2** Weighted tables (`src/engine/tables.js`), built from the location files and shared tables in `content/`
  (R15.2).
- [x] **2.3** Port the fish data into `content/fish/` and fish generation, fixing the defects in PORTING-NOTES §1.3
  (R3.2, R3.3, R4.1). Rarity from species and size band (R4.7, D49). §C.4 then points at `content/` (D56).
- [x] **2.4** Port the weather engine faithfully, fixing PORTING-NOTES §1.1 (Torrential rain's missed edge line,
  random-at-load values); write the 38 missing Autumn and Winter descriptions (R11.3). A data test for the edge rule
  (D26): every marked edge repeats, every other edge wraps.
- [x] **2.5** Time as its own clock: 30 game minutes per resolved cast, 48-cast days, 28-day seasons, the weather
  stepping once per cast (R11.4, D66).
- [x] **2.6** The cast pipeline with hooks: bite → which fish → size → strike → player roll → fish roll → outcome → loot
  → XP. Base stats plus derived modifiers on every game value (D13, R6.6), including the base Fish Find and Treasure
  Find the prototype ignored (D20). Roll records with visibility (R5.1). Everything on the line is rolled when the line
  goes out (D63). Every cast splashes; only fish get the d20; a missed splash resolves the cast, then 5 seconds of
  nothing and a fresh cast, and a second miss in a row reels in (R2.4, R2.8, D64).
- [x] **2.9** "Next n casts" buff charges, spent when the line goes out, voided casts included (R1.5, D22).
- [x] **2.11** Timed buffs and debuffs alongside cast-counted ones (R12.1, R12.2): timers count down only while
  the game is open (D32).
- [x] **2.10** Luck as a hidden stat in the state, for events to check later (R6.7).
- [x] **2.7** Junk and treasure ported into `content/` (R3.4), using the effect vocabulary (2.15); §C.3 then points at
  `content/`. Unique items, found once per save (R8.10, D65). The escaped-fish pool (R3.6).
- [x] **2.12** The rod in the game state: the starting stick, whose stats feed the cast as game values: accuracy, reaction
  windows, bite delay (R13.1, R13.2, D35). An empty bait slot by default (R13.3).
- [x] **2.13** Cast scatter: the bobber lands within the rod's accuracy of the aimed point, drawn from its own stream
  (R2.1, D34).
- [x] **2.8** A full session runs headless from a seed in tests, and the same seed gives the same result.

## Phase 3: Core loop, playable

- [x] **3.1** The scene driven by the Phase 2 engine: whatever bit, how big, what came up; the visible roll (R2.6, R5).
- [x] **3.2** The screen laid out as the owner's sketch (R16.1, R16.4, R16.5, D79): the button row, panes over the
  scene, the log with links and tooltips, the journal (R4.2), weather and time, the character with stats, XP bar and
  levels. A refinement pass on the looks comes later (D77).
- [x] **3.3** Character creation: name generator, gender, class (gendered names, D19), stat rolls (R6.1).
- [x] **3.4** `?dev` bench: location, spot, weather, time, items, level, and as many game values as practical; an
  "empty bucket" button (R9.5, D27, D68).
- [x] **3.5** Deployed to GitHub Pages, so the owner can play anywhere without a server; playable end to end on a phone
  (D68, D91): https://rkachniarz.github.io/roll-for-fishing-react/ and `art.html` there.
- [x] **3.6** Buff and debuff bar at the top right of the game area, WoW style: green and red rows, the duration in the
  corner (nearest minute, then seconds), a description on hover or tap, cancel a buff by right-click or long-press
  (R12.3–R12.7, D29, D31).
- [x] **3.7** A title screen with New game and Load game over three save slots; Main menu in the in-game menu goes
  back to it (R1.7, D80).
- [x] **3.8** Settings in the menu, kept per device: the theme, dark or light wooden planks (R16.6, D81).
- [x] **3.9** How a strike went floats up from the bobber; the roll stays in the log (R16.7, D82).

## Phase 4: Art pipeline and the living scene

The machinery the art plugs into. The art itself is in the creative track.

- [ ] **4.1** Sprite sizes per depth band, the atlas format and naming; Aseprite → atlas export ready for when
  hand-drawn art arrives (D9). The fixed palette is picked with the owner (CR-9).
- [x] **4.6** How the art is made (D90): the style guide (`docs/art.md`), the art sheet with trials (`art.html`),
  sprites to PNG and back for drawing in MS Paint (`tools/sprite-png.mjs`), and any scene saved as a PNG to
  draw over.
- [ ] **4.2** A backdrop per spot, chosen by the spot, in the sketch's layout, and each spot's casting area (`WATER`)
  as data. Placeholders until the paintings (CR-1): the current scene with a colour and a few plain shapes per spot
  (reeds, rocks, a far bank, flowing water) so the nine spots can be told apart, and a version per season.
- [x] **4.3** Day/night and seasonal palettes; weather overlays: rain, snow, wind on the water, cloud shadows (R7.5).
- [x] **4.4** Catch feedback: the catch's icon appears at the bobber, flies to the bucket and bags button and disappears;
  no reeling-in animation; the log line always (R16.2, D69, D70).
- [x] **4.5** Surface features: schools, curious spots and disturbances on the water, with their own stream, and their
  effect on the odds when the bobber lands in one (R14, D33, D40, D62).
- [ ] **4.7** Weather and life on a spot (D100; was the engine half of 8.11): the scene picks each spot's sky from
  the weather (heaped clouds, overcast, rain, wind, light) and moves its plants and water. Placeholder clouds and
  plants (flat shapes) until CR-2.

## Phase 5: Items and inventory

Requirements R8.

- [x] **5.1** Bag grid, stacking, drag and drop by touch and mouse, tap-to-inspect tooltips, names in rarity colours
  (R8.1, R8.7, R8.8).
- [x] **5.2** Equipment slots; effects on the engine's hooks (R8.2, D83).
- [x] **5.3** Port the seven items with real downsides (§C.3), and about 15 more as placeholders, enough to use every
  effect in the vocabulary and every slot; the "every upside has a downside" data test (R8.5), bait aside. Sixteen
  pieces of placeholder gear in the shared treasure list; names, texts and icons are CR-4.
- [x] **5.4** Tooltips generated from effects (R8.6).
- [x] **5.5** Fish bucket: fish only, identical twins stack, 16 fish to start; a full bucket asks which fish to release,
  and the released fish joins the spot's escaped-fish pool (R8.3, R3.6, D24, D50, D57, D59).
- [ ] **5.6** Review D8: plain DOM or Preact for the UI.
- [x] **5.7** Better rods, found as treasure and through events (R13.1, R13.5, D35, D38): the willow rod, ash rod,
  reed pole and dwarven steel rod, each with a downside, as treasure; the junk collector's trade can give the willow
  rod. Default icons until CR-4.
- [x] **5.8** Bait as a consumable; small fish as bait for predators (R13.3, R13.4, D36, D39, D41, D61). Bait kinds
  and placeholder baits (D101); a Tiny fish goes from the bucket onto the hook as Small fish bait.

## Phase 6: Classes, levels, abilities, knowledge

Requirements R5.2, R6.

How it works is D96: perks at levels 1–8, a badge rather than a stop, cooldowns in casts that count only an
attempt at a catch, the action bar under the button row, abilities that light up, crits.

**Perks are development (D105).** What a perk does comes from the prototype's notes (§C.2) and D96. Where the notes
leave a gap, Claude picks a stand-in rule and lists it in REVIEW.md rather than waiting. A perk's name, its text, its
icon and any new look it brings (a Greedy fish, a bent fish) are creative work (CR-8, CR-12); placeholders until then.

- [x] **6.6** Perks as content (`content/perks/`), the save's `character.perks`, passive perks feeding the game
  values; crits as D96 (6); the bench grants perks.
- [x] **6.1** Choosing a perk at level-up: the badge, and the choice in the character pane (D96).
- [x] **6.2** Active abilities with cooldowns; the action bar under the button row, keys 1–9.
- [x] **6.7** Abilities that light up after something happens: the warrior's Jump In, the rogue's Gut, the mage's
  Bend Reality.
- [x] **6.3** Each class's level 1, 3 and 5 perks working (the notes' level 6 moved to 5, D96): Rift Fishing,
  Greedy Fish, Ever-Summoning, Bend Reality (which also doubles the rift chance), Fence and Polish were the last
  (D106). Their names, the "Greedy" and "Bent" marks and their icons are placeholders (CR-8, CR-12).
- [x] **6.4** Hidden rolls revealed by levels, perks and items (R5.2, D107): the number a fish needed from level 1;
  `revealResistance`, `revealBite` and `revealTreasure` for perks and items. Which ones reveal the rest is Q-40.
- [x] **6.8** The fish's dice on the desk (D99), once 6.4 reveals its roll: its d20s thrown in from the top right,
  as the player's come in from the bottom right, in the fish's own colour, `#31899F`, a deep-water teal. A roll
  still hidden throws no fish dice.
- [ ] **6.5** Class-flavoured texts (R6.5): a string can have a version per class, falling back to the plain one;
  the prototype's lists ported. New writing is CR-11.

## Phase 7: Events

Requirements R10. Each new piece of the engine is tried with a placeholder event, short and plain, that the owner's
writing replaces or joins (CR-10).

- [x] **7.1** The event engine: slides, options, requirements, effects, as data. The event text format and its
  vocabulary written down alongside the frog encounter, and parsed by `npm run content`; effects come from 2.15
  (R15.6, D45, D56, D84).
- [x] **7.2** Triggers: event meter, world conditions, fished-up items, and hidden objectives on counters and flags
  (R10.7, D51). *World conditions are season and time of day for now; the weather comes when an event needs it.*
- [x] **7.3** The event dialog (with room for an illustration).
- [x] **7.4** One short quest chain started by a quest item, as placeholders: the item, three events, a reward; it
  proves the engine can carry a chain. The message in a bottle (`content/events/quest-bottle*.md`); the owner's
  events and the real chain are CR-10.
- [x] **7.6** Locations an event can lock the player into until an objective is met (R10.8, D51).
- [x] **7.7** Counters: numbers an event keeps, not just flags. `add: cat-trust 1`, `needs: cat-trust 5+`, and a
  placeholder to show one ("12 of 25"). For the cat and the raid supplies (`docs/ideas.md`).
- [x] **7.8** Events that take fish from the bucket: any fish, a species, a number of one species, the rarest one. For
  feeding the cat, the cat stealing and handing in raid supplies.
- [x] **7.9** Giving up every item of a kind at once: their hidden values added up, the reward picked from a table by
  the total. Junk needs telling apart, the useless from the kind with a use. For the junk collector.
- [x] **7.10** Visitors who come back now and then: an event with a gap of so many casts (or days) between visits.
  For the junk collector and the Alchemist (8.6). *7.6–7.10 are event words (D108, `docs/events.md`): `go:`,
  `lock:`, `add:`, `needs: count`, `{#counter}`, `lose: fish`, `needs: fish`, `trade: junk`, `again:`.*
- [ ] **7.5** The content editor app: forms generated from the schemas, saving into `content/` (D47).

## Phase 8: World and town

Requirements R5.3, R11.

- [ ] **8.1** Location switcher; each location's spot map, switching spots at any time, spots learned about before
  they show; spot tables filled in (R11.8, D58). *The spot tables are filled in, and the map pane is a plain list of
  every spot known of to go to (D101); spots are learned by fishing at a location or from an event (D109); still to
  do: a map of placeholder shapes (CR-7).*
- [x] **8.2** Unlocks through map fragments and quests; the discovery meter. A hidden location opens once its
  fragments are found, or by an event's `open:`; `close:` takes a quest's place away (D110). The discovery meter is
  each place's completion (D109).
- [ ] **8.3** The town: inn and scrap dealer, barter (D86); fish put into the inn's perpetual stew for a buff,
  stronger for rarer fish and longer for more fish (R11.5, R12.6, D24, D28, D37). Squares and triangles for the
  buildings and people, and plain lines for what they say, until CR-5 and CR-13.
- [ ] **8.6** The Alchemist's recurring visit: buffing potions for sale, alchemical ingredients bought; the ingredients
  added to the junk tables (R10.6, R11.7, D30). Placeholder potions, ingredients and lines.
- [x] **8.5** Location lists and completion percentages; knowledge (found, bought) that reveals missing entries (R4.4,
  R4.5, R5.3). In the journal per location; `learn:` in events (D109). Bought knowledge comes with the town.
- [x] **8.4** The Mage Tower pool (the River is in, D101): the location and its spots, with a placeholder table of
  existing fish until the owner's list. `content/locations/mage-tower.json`: one pool, six fish, hidden until its
  three map fragments are found (two in the Lake's junk, one in the River's).
- [x] **8.7** Item sets and the strange people who collect them: a set id on each piece, progress per set, a reward
  for the whole set; the pieces unique and spread over the spots; a visitor who turns up once the player holds a
  piece; pages that can be read, for the story (`docs/ideas.md`). One placeholder set of three pieces, with
  placeholder pages, until CR-4 and CR-10. *The old lorebook (`content/sets/`, D111) and the scholar who wants it.*
- [ ] **8.8** Raid supply orders in town: 10, 25 or 40 of one fish over several hand-ins, the progress shown, consumables
  and gear as the reward (needs 7.7, 7.8).
- [ ] **8.9** Companions at the fishing spot: the cat, once it trusts the player. A placeholder cat until CR-5.

## Phase 9: Balance and finish

- [x] **9.1** Balance simulation over the seeded engine: catch rates, XP curve, loot rates per class and build.
  `npm run sim` (`tools/sim.mjs`); the tuning it's for is the owner's, with the numbers on REVIEW.md.
  *Notes for it: the stick's scatter is 20 px so a school isn't hit every time; a 12 px rod is the next tier up, and
  hits a school whenever it's aimed at (D85).*
- [ ] **9.2** Audio: the engine for sound, a volume setting, sounds for water, splash and catch. Placeholder
  sounds made in code until CR-14.
- [ ] **9.3** More settings (sound, once there is any), save export/import. *(Settings and the theme landed with 3.8.
  Saving to a file is in the menu, loading from one on the title screen, into a slot the player picks; the sound
  setting waits for 9.2.)*
- [x] **9.4** Collection view, fish and treasure (R4.3): grids in the journal, the records on a tap; a fish that got
  away before one was caught shows as a silhouette. Knowing of fish and treasure in other ways comes with 8.5.
- [ ] **9.6** The dice's feel (D99): timing, where they land, the floating total; the open items on
  `docs/REVIEW.md`. The ivory colour is settled.
- [ ] **9.5** Installable and offline: web app manifest and service worker (R9.8, D55).

---

# Creative work

Art, writing and sound: the owner's to lead, with Claude drawing and drafting under D90 and D97. Nothing in the
development track waits for these (D105). Each task lists the placeholders it replaces; when development leaves a new
placeholder, it's added here.

## Art

- [ ] **CR-1** The spots painted from the owner's photos (D97, D100; was 8.10), working from the pond trial on the art
  sheet (`src/scene/pond.js`): a version per season for each of the nine spots. *Replaces 4.2's placeholder
  backdrops.*
- [ ] **CR-2** Weather and life on the painted spots (D100; the art half of 8.11): clouds per weather (summer's heaped
  clouds, autumn's overcast so far), rain, wind, light, moving plants and water. *Replaces 4.7's flat shapes.*
- [ ] **CR-3** Fish icons (D97, D98; was 9.7): the eyes, one by one, since they were placed by script (a 2×2 a tenth of
  the way in from the snout) and some look comedic or out of place; the weak icons on
  `docs/design/fish-image-hunt.md`; and the four with no icon yet: Mainland eel, golomyanka, Grasslands silverside,
  Wildlands pejerrey.
- [ ] **CR-4** Item icons, and the items' names and texts: the placeholder items and rods (5.3, 5.7), the bait items
  (D101) and Small fish (5.8), the Alchemist's potions and ingredients (8.6), the set pieces (8.7).
- [ ] **CR-5** The town and its people (8.3, 8.6, 8.9): the inn, the scrap dealer, the Alchemist, the cat, and the
  portraits. *Replaces the squares and triangles.*
- [ ] **CR-6** Event illustrations: the dialog has room for one (7.3).
- [ ] **CR-7** The map, each location's spots drawn on it (8.1). *Replaces the placeholder shapes.*
- [ ] **CR-8** Perk and ability icons (the action bar shows initials), and the look of a Greedy fish and a bent fish
  (6.3).
- [ ] **CR-9** The fixed palette (4.1) and the art sheet's open trials (`art.html`).

## Writing

- [ ] **CR-10** Events: about ten more after the frog, the real quest chain (in place of 7.4's placeholder), the set
  pages (8.7), and the story (`docs/ideas.md`).
- [ ] **CR-11** Class-flavoured texts (R6.5): new lines for 6.5's mechanism, beyond the prototype's.
- [ ] **CR-12** Names: the spots (placeholder names since D101), the "Greedy" and "Bent" marks on fish (D106), and the perks' names and texts (REVIEW.md lists them
  as Claude's).
- [ ] **CR-13** What the town's people say: the inn, the scrap dealer, the Alchemist, the raid orders (8.3, 8.6, 8.8).

## Sound

- [ ] **CR-14** Sounds: water, splash, catch, and whatever else 9.2 plays. *Replaces the sounds made in code.*

---

## Ideas for later

Not scheduled.

- **A precision timing bar for the cast**: tap a spot, a bar appears with a marker running up and down; the target
  area depends on the rod's quality, the marker's speed on the wind. The scatter (D85) would carry over to it. The
  owner's idea.
- **Random scenes on the title screen**, from the locations the player has unlocked.

- **Consumables as a hand of cards** along the bottom of the screen, to make using them more tempting. A loose idea from
  the owner, not a decision.
- **Catching the same fish again and again**: a hidden event or achievement for catching one released fish several
  times (D60).
