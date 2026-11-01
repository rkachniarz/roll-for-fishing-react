# Roll for Fishing: development plan

What's left to do. Tick boxes as work lands; record decisions in [docs/decisions.md](docs/decisions.md) rather than
silently changing requirements.

**Where things stand (2026-10-28):** fresh start (D1). Phase 0 is done: the new skeleton, the seeded dice, the docs.
Phase 1, the feel trial, is playable: the lake scene from the sketch in placeholder pixel art, cast where you tap, wait
for the splash, strike, a graded reaction and a d20 roll. The Normal timings are kept for now (D27); what's left of
Phase 1 is the frame-rate check on a phone and the write-up. Q-1 to Q-15 are answered (D19–D27). The 2026-11-01 notes
added buffs and debuffs (R12), the stew loop (D28), WoW as the UI reference (D29) and the Alchemist (D30), with the buff
bar's details (D31) and how timed buffs count down (D32). A second batch the same day added rods with their own stats
(R13, D35), bait (D36), a bobber that lands near the aim rather than on it (D34), and surface features such as fish
schools (R14, D33). Q-16 and Q-18 to Q-21 are open. The game is still in its vision phase, so there's no rush to build
on them.

## Where things are

| Cited as | What | Where |
|---|---|---|
| `D1`… | Decisions and their reasons | [docs/decisions.md](docs/decisions.md) |
| `R1.1`… `§C.1`… | Vision, requirements, catalogues | [docs/spec.md](docs/spec.md) |
| `PORTING-NOTES §n` | What carries over from the prototype, and its lessons | [docs/PORTING-NOTES.md](docs/PORTING-NOTES.md) |
| `0.1`… | Finished phases, task by task | [docs/history.md](docs/history.md) |
| `Q-n`, `1.x`–`9.x` | Open questions, work still to do | here |

---

## Open questions

Answered ones move into decisions.md (Q-1 → D9, Q-2 → D10, Q-3 → D19, Q-4 → D20/D21, Q-5 → D11, Q-6 → D22,
Q-7 → D12, Q-8 → D23, Q-9 → D1, Q-10 → D24, Q-11 → D25, Q-12 → D26, Q-13 → D2/D3/D8, Q-14 → "Ideas for later",
Q-15 → D27, Q-17 → D32).

- **Q-16** Does the stew buff (R12.6) run on time or on casts? *Leaning: time.* Cast-counted buffs are kept for
  stronger effects (D28).
- **Q-18** Do rods follow "every beneficial item has a downside" (R8.5)? For example, a more accurate rod with a
  shorter reaction window. WoW's poles are simply better as you go (D29), which would make rods an exception to R8.5.
- **Q-19** How is bait used up, and what does it do? Options: one per cast, one per bite, or lost only when a fish takes
  it; or, as WoW's lures do, a timed buff on the rod (R12). Does it change which fish bite, the bite chance, the bite
  delay, or a mix?
- **Q-20** How do surface features behave (R14)? The earlier idea: ripple patches that drift around the scene and thin
  out as they are fished, with a school favouring a species or raising the bite rate. What do curious spots and
  disturbances do differently from a school (treasure, an event)? Are they always visible, or revealed like hidden
  rolls (R5)?
- **Q-21** Bait fish (R13.4): is one caught like any other fish (accomplishments book, bucket) and then put on the hook
  from the bucket? Which species count as bait fish: a set list, or anything in the Tiny size band?

---

## Phase 1: Feel trial

The riskiest part first: the reflex loop and the scene tech, before anything is built on them. Requirements R2, R7.

- [x] **1.1** Pixi scene laid out like the sketch, in placeholder pixel art: water bands, waves, shore, reeds, bobber,
  line, ripples, splash (R7.1, R7.4).
- [x] **1.2** 256×256, scaled by whole device pixels, phone and desktop layouts; checked at devicePixelRatio 1, 2.625
  and 3 (R7.2, R7.3).
- [x] **1.3** Sprites as code (D9): `src/scene/sprites.js`.
- [x] **1.4** Try the timings on a real phone with the `?dev` presets and pick defaults: Normal, for now (D27).
- [ ] **1.5** Check 60 fps on a mid-range phone, and that the splash-to-tap delay feels fair (no sense of lag).
- [x] **1.6** Cast engine with reaction grades, pure and tested (`src/engine/cast.js`, R2.2–R2.6).
- [ ] **1.7** Write the trial up in history.md, with what was measured.

## Phase 2: Engine core and the port

Requirements R1, R3, R4, R5, R9, R11.3–R11.4. Port from `legacy-prototype` (PORTING-NOTES).

- [ ] **2.1** `GameState` and save v1 in localStorage: versioned, saved after every resolved cast, New game (R1).
- [ ] **2.2** Weighted tables with validation (`src/engine/tables.js`); data tests for weights, ids and references.
- [ ] **2.3** Port the fish data and fish generation, fixing the defects in PORTING-NOTES §1.3 (R3.2, R3.3, R4.1).
- [ ] **2.4** Port the weather engine faithfully, fixing PORTING-NOTES §1.1 (Torrential rain's missed edge line,
  random-at-load values); write the 38 missing Autumn and Winter descriptions (R11.3). A data test for the edge rule
  (D26): every marked edge repeats, every other edge wraps.
- [ ] **2.5** Time as its own clock, advanced per resolved cast (R11.4).
- [ ] **2.6** The cast pipeline with hooks: bite → which fish → size → strike → player roll → fish roll → outcome → loot
  → XP. Base stats plus derived modifiers on every game value (D13, R6.6), including the base Fish Find and Treasure
  Find the prototype ignored (D20). Roll records with visibility (R5.1).
- [ ] **2.9** "Next n casts" buff charges, spent when the line goes out, voided casts included (R1.5, D22).
- [ ] **2.11** Timed buffs and debuffs alongside cast-counted ones (R12.1, R12.2): timers count down only while
  the game is open (D32).
- [ ] **2.10** Luck as a hidden stat in the state, for events to check later (R6.7).
- [ ] **2.7** Junk and treasure tables ported (R3.4); the escaped-fish pool (R3.6).
- [ ] **2.12** The rod in the game state: the starting stick, whose stats feed the cast as game values: accuracy, reaction
  windows, bite delay (R13.1, R13.2, D35). An empty bait slot by default (R13.3).
- [ ] **2.13** Cast scatter: the bobber lands within the rod's accuracy of the aimed point, drawn from its own stream
  (R2.1, D34).
- [ ] **2.8** A full session runs headless from a seed in tests, and the same seed gives the same result.

## Phase 3: Core loop, playable

- [ ] **3.1** The scene driven by the Phase 2 engine: whatever bit, how big, what came up; the visible roll (R2.6, R5).
- [ ] **3.2** Log, accomplishments book (R4.2), weather and time display, class and stats, XP and levels.
- [ ] **3.3** Character creation: name generator, gender, class (gendered names, D19), stat rolls (R6.1).
- [ ] **3.4** `?dev` bench: location, spot, weather, time, items, level, and as many game values as practical (R9.5,
  D27).
- [ ] **3.5** Deployed to GitHub Pages; playable end to end on a phone.
- [ ] **3.6** Buff and debuff bar at the top right of the game area, WoW style: green and red rows, the duration in the
  corner (nearest minute, then seconds), a description on hover or tap, cancel a buff by right-click or long-press
  (R12.3–R12.7, D29, D31).

## Phase 4: Art pipeline and the living scene

- [ ] **4.1** A fixed palette, sprite sizes per depth band, the atlas format and naming; Aseprite → atlas export ready for
  when hand-drawn art arrives (D9).
- [ ] **4.2** Backdrops per spot in the sketch's layout.
- [ ] **4.3** Day/night and seasonal palettes; weather overlays: rain, snow, wind on the water, cloud shadows (R7.5).
- [ ] **4.4** Catch and escape feedback: the fish lifted out, its silhouette and size.
- [ ] **4.5** Surface features: schools, curious spots and disturbances on the water, with their own stream, and their
  effect on the odds when the bobber lands in one (R14, D33; Q-20).

## Phase 5: Items and inventory

Requirements R8.

- [ ] **5.1** Bag grid, stacking, drag and drop by touch and mouse, tap-to-inspect tooltips (R8.1, R8.7).
- [ ] **5.2** Equipment slots; effects on the engine's hooks (R8.2).
- [ ] **5.3** Port the seven items with real downsides (§C.3), plus about 15 more; the "every upside has a downside" data
  test (R8.5).
- [ ] **5.4** Tooltips generated from effects (R8.6).
- [ ] **5.5** Fish bucket, no capacity (R8.3, D24).
- [ ] **5.6** Review D8: plain DOM or Preact for the UI.
- [ ] **5.7** Better rods, found as treasure and through events (R13.1, D35; Q-18).
- [ ] **5.8** Bait as a consumable; small fish as bait for predators (R13.3, R13.4, D36; Q-19, Q-21).

## Phase 6: Classes, levels, abilities, knowledge

Requirements R5.2, R6.

- [ ] **6.1** Level-up perk choice between two (§C.2).
- [ ] **6.2** Active abilities with cooldowns; an ability bar.
- [ ] **6.3** Each class's level 1, 3 and 6 perks.
- [ ] **6.4** Hidden rolls revealed by levels, perks and items (R5.2).
- [ ] **6.5** Class-flavoured texts (R6.5).

## Phase 7: Events

Requirements R10.

- [ ] **7.1** The event engine: slides, options, requirements, effects, as data.
- [ ] **7.2** Triggers: event meter, world conditions, fished-up items.
- [ ] **7.3** The event dialog (with room for an illustration).
- [ ] **7.4** The frog encounter (§C.6), about ten more, and one short quest chain started by a quest item.

## Phase 8: World and town

Requirements R5.3, R11.

- [ ] **8.1** Location switcher; spot tables filled in.
- [ ] **8.2** Unlocks through map fragments and quests; the discovery meter.
- [ ] **8.3** The town: inn and scrap dealer, copper; fish put into the inn's perpetual stew for a buff, stronger for
  rarer fish and longer for more fish (R11.5, R12.6, D24, D28; Q-16).
- [ ] **8.6** The Alchemist's recurring visit: buffing potions for sale, alchemical ingredients bought; the ingredients
  added to the junk tables (R10.6, R11.7, D30).
- [ ] **8.5** Location lists and completion percentages; knowledge (found, bought) that reveals missing entries (R4.4,
  R4.5, R5.3).
- [ ] **8.4** River and Mage Tower pools.

## Phase 9: Content, balance, polish

- [ ] **9.1** Balance simulation over the seeded engine: catch rates, XP curve, loot rates per class and build.
- [ ] **9.2** Audio: water, splash, catch.
- [ ] **9.3** Settings, save export/import.
- [ ] **9.4** Collection view, fish and treasure (R4.3).

---

## Ideas for later

Not scheduled.

- **Consumables as a hand of cards** along the bottom of the screen, to make using them more tempting. A loose idea from
  the owner, not a decision.
