# Roll for Fishing: development plan

What's left to do. Tick boxes as work lands; record decisions in [docs/decisions.md](docs/decisions.md) rather than
silently changing requirements. Within a phase, tasks are listed in the order they should be done; their numbers are
only ids, so a task added later keeps its number wherever it lands.

**Where things stand (2026-11-04):** Phases 0, 1 and 2 are done. **Phase 3: the game is playable on the real engine**:
character creation, the full cast with its hidden rolls, saving, New game, the buff bar and the `?dev` bench, all in
the owner's phone layout (D79), with a title screen, three save slots and a light theme (D80, D81). Left in Phase 3: GitHub Pages (3.5), deferred (D77). Phases 4 and 5 are under way:
the bag and the seven equipment slots work by drag and drop and right-click (5.1, 5.2, D83), with a placeholder item
for each slot. Most of what's left needs the owner's art or design, or the real items (5.3). **Phase 7 has begun:**
events are written as text (`docs/events.md`, D84), the event meter brings them, and the frog encounter is the
first. Claude's guesses and calls are listed in
[docs/REVIEW.md](docs/REVIEW.md), for the owner to check.

## Where things are

| Cited as | What | Where |
|---|---|---|
| `D1`… | Decisions and their reasons | [docs/decisions.md](docs/decisions.md) |
| `R1.1`… `§C.1`… | Vision, requirements, catalogues | [docs/spec.md](docs/spec.md) |
| `PORTING-NOTES §n` | What carries over from the prototype, and its lessons | [docs/PORTING-NOTES.md](docs/PORTING-NOTES.md) |
| `0.1`… | Finished phases, task by task | [docs/history.md](docs/history.md) |
| `Q-n`, `1.x`–`9.x` | Open questions, work still to do | here |
| | Claude's guesses and calls, for the owner to check | [docs/REVIEW.md](docs/REVIEW.md) |

---

## Open questions

Answered ones move into decisions.md (Q-1 → D9, Q-2 → D10, Q-3 → D19, Q-4 → D20/D21, Q-5 → D11, Q-6 → D22,
Q-7 → D12, Q-8 → D23, Q-9 → D1, Q-10 → D24, Q-11 → D25, Q-12 → D26, Q-13 → D2/D3/D8, Q-14 → "Ideas for later",
Q-15 → D27, Q-16 → D37, Q-17 → D32, Q-18 → D38, Q-19 → D39, Q-20 → D40, Q-21 → D41, Q-24 → D48, Q-25 → D49,
Q-26 → D50, Q-27 → D51, Q-28 → D52, Q-29 → D53, Q-30 → D54, Q-31 → D57, Q-32 → D55, Q-33 → D58, Q-34 → D59, Q-22 → D61, Q-23 → D62, Q-35 → D64, Q-36 → D65, Q-37 → D66, Q-38 → D79, Q-39 → D70).

None open.

---

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
- [ ] **3.5** *(Deferred, D77.)* Deployed to GitHub Pages, so the owner can play anywhere without a server; playable end to end on a phone
  (D68).
- [x] **3.6** Buff and debuff bar at the top right of the game area, WoW style: green and red rows, the duration in the
  corner (nearest minute, then seconds), a description on hover or tap, cancel a buff by right-click or long-press
  (R12.3–R12.7, D29, D31).
- [x] **3.7** A title screen with New game and Load game over three save slots; Main menu in the in-game menu goes
  back to it (R1.7, D80).
- [x] **3.8** Settings in the menu, kept per device: the theme, dark or light wooden planks (R16.6, D81).
- [x] **3.9** How a strike went floats up from the bobber; the roll stays in the log (R16.7, D82).

## Phase 4: Art pipeline and the living scene

- [ ] **4.1** A fixed palette, sprite sizes per depth band, the atlas format and naming; Aseprite → atlas export ready for
  when hand-drawn art arrives (D9).
- [ ] **4.2** Backdrops per spot in the sketch's layout.
- [x] **4.3** Day/night and seasonal palettes; weather overlays: rain, snow, wind on the water, cloud shadows (R7.5).
- [x] **4.4** Catch feedback: the catch's icon appears at the bobber, flies to the bucket and bags button and disappears;
  no reeling-in animation; the log line always (R16.2, D69, D70).
- [x] **4.5** Surface features: schools, curious spots and disturbances on the water, with their own stream, and their
  effect on the odds when the bobber lands in one (R14, D33, D40, D62).

## Phase 5: Items and inventory

Requirements R8.

- [x] **5.1** Bag grid, stacking, drag and drop by touch and mouse, tap-to-inspect tooltips, names in rarity colours
  (R8.1, R8.7, R8.8).
- [x] **5.2** Equipment slots; effects on the engine's hooks (R8.2, D83).
- [ ] **5.3** Port the seven items with real downsides (§C.3), plus about 15 more; the "every upside has a downside" data
  test (R8.5).
- [x] **5.4** Tooltips generated from effects (R8.6).
- [x] **5.5** Fish bucket: fish only, identical twins stack, 16 fish to start; a full bucket asks which fish to release,
  and the released fish joins the spot's escaped-fish pool (R8.3, R3.6, D24, D50, D57, D59).
- [ ] **5.6** Review D8: plain DOM or Preact for the UI.
- [ ] **5.7** Better rods, found as treasure and through events (R13.1, R13.5, D35, D38).
- [ ] **5.8** Bait as a consumable; small fish as bait for predators (R13.3, R13.4, D36, D39, D41, D61).

## Phase 6: Classes, levels, abilities, knowledge

Requirements R5.2, R6.

- [ ] **6.1** Level-up perk choice between two (§C.2).
- [ ] **6.2** Active abilities with cooldowns; an ability bar.
- [ ] **6.3** Each class's level 1, 3 and 6 perks.
- [ ] **6.4** Hidden rolls revealed by levels, perks and items (R5.2).
- [ ] **6.5** Class-flavoured texts (R6.5).

## Phase 7: Events

Requirements R10.

- [x] **7.1** The event engine: slides, options, requirements, effects, as data. The event text format and its
  vocabulary written down alongside the frog encounter, and parsed by `npm run content`; effects come from 2.15
  (R15.6, D45, D56, D84).
- [x] **7.2** Triggers: event meter, world conditions, fished-up items, and hidden objectives on counters and flags
  (R10.7, D51). *World conditions are season and time of day for now; the weather comes when an event needs it.*
- [x] **7.3** The event dialog (with room for an illustration).
- [ ] **7.4** The frog encounter (§C.6), about ten more, and one short quest chain started by a quest item. *The frog
  is in; the rest is the owner's writing.*
- [ ] **7.6** Locations an event can lock the player into until an objective is met (R10.8, D51).
- [ ] **7.5** The content editor app: forms generated from the schemas, saving into `content/` (D47).

## Phase 8: World and town

Requirements R5.3, R11.

- [ ] **8.1** Location switcher; each location's spot map, switching spots at any time, spots learned about before
  they show; spot tables filled in (R11.8, D58).
- [ ] **8.2** Unlocks through map fragments and quests; the discovery meter.
- [ ] **8.3** The town: inn and scrap dealer, copper; fish put into the inn's perpetual stew for a buff, stronger for
  rarer fish and longer for more fish (R11.5, R12.6, D24, D28, D37).
- [ ] **8.6** The Alchemist's recurring visit: buffing potions for sale, alchemical ingredients bought; the ingredients
  added to the junk tables (R10.6, R11.7, D30).
- [ ] **8.5** Location lists and completion percentages; knowledge (found, bought) that reveals missing entries (R4.4,
  R4.5, R5.3).
- [ ] **8.4** River and Mage Tower pools.

## Phase 9: Content, balance, polish

- [ ] **9.1** Balance simulation over the seeded engine: catch rates, XP curve, loot rates per class and build.
- [ ] **9.2** Audio: water, splash, catch.
- [ ] **9.3** More settings (sound, once there is any), save export/import. *(Settings and the theme landed with 3.8.)*
- [ ] **9.4** Collection view, fish and treasure (R4.3).
- [ ] **9.5** Installable and offline: web app manifest and service worker (R9.8, D55).

---

## Ideas for later

Not scheduled.

- **Consumables as a hand of cards** along the bottom of the screen, to make using them more tempting. A loose idea from
  the owner, not a decision.
- **Catching the same fish again and again**: a hidden event or achievement for catching one released fish several
  times (D60).
