# For the owner's review

Things Claude decided, guessed or wrote that the owner should look at when there's time. None of them block work. When
an item is settled, delete it from this list (and record a decision if the answer changes something).

Newest first.

## The scene (Phase 4)

- **The light of the day** (4.3, `src/scene/light.js`): full night from 21:00 to 05:00, lightening until 07:00,
  darkening from 18:00; a warm glow at its strongest at 06:00 and 19:00. Night darkens the view by about half.
- **Seasons and weather on the scene** (4.3, `src/scene/sky.js`): summer slightly golden, autumn amber, winter pale
  and cold; spring as drawn. Cloud level 2 and up brings one to three drifting cloud shadows; rain from
  precipitation 2 up; snow instead of rain at temperature 2 or below. Tints over the whole view, not palette swaps.

- **Surface features' numbers** (4.5, D78), all in `content/features/` and `content/locations/lake.json`:
  - The Lake: a 12% chance of a new one after each cast, at most two at once; roach school weight 5, carp school 3,
    glint 2, big pike 1.
  - Roach school: +40 Fish Find, only roach, 4 casts before it's fished out, gone after 24 casts, drifts up to 4 px
    a cast, 14 px across. Carp school: +30, only carp, 3 uses, 20 casts.
  - Big pike: +100 Fish Find (it always bites), always a Gigantic or Humongous pike, one cast, gone after 10, drifts
    6 px, only 8 px across: a hard target.
  - Glint: no fish at all (−100 Fish Find), +40 Treasure Find, 2 uses, 16 casts, doesn't drift.
- **How features look**: a school is a few dark fish backs milling about (fewer as it thins out), the big fish a long
  shadow, the glint a blinking white cross, a disturbance purple rings. Subtle on purpose; the school may be too
  subtle.
- **Log lines for features**: "On the water: a school of roach.", "Your bobber lands in a school of roach.", "A
  school of roach is gone."

- **The four default icons** (4.4): a fish, an old boot for junk, a chest for treasure, a potion bottle for
  consumables. Drawn by Claude in `src/scene/icons.js`.
- **The flying icon** rises a little at the bobber, then flies to "Bucket & bags" in 0.65 s, fading as it goes, with
  a border in its rarity colour (WoW's item border).
- **"Bucket & bags"** opens a plain list for now (equipped, bucket, bags), names in rarity colours. Phase 5 replaces
  it with WoW's grid.

## The page (Phase 3)

- **All the game's own wording** (the status line, results, log lines, character creation) was written by Claude. It
  is all in one place, `UI_STRINGS` in `src/strings.js`.
- **Character creation** preselects a random gender and the Fish Fighter; the classes are listed Fighter, Wizard,
  Rogue. Each class shows its stat ranges.
- **The result shows "needed ?"** for a fish: its own d20 is a hidden roll until something reveals it (R5.2). The
  prototype printed the number.
- **The log isn't saved:** it starts empty after a reload. The accomplishments book (3.2) is what keeps records.
- **The buff bar's look** (3.6): 36 px squares, ▲ and ▼ as stand-in icons until buffs have art, a long-press of
  0.6 s to cancel on touch, and a tooltip reading "+20 Fish Find · right-click or long-press to cancel". The squares
  aren't yet drawn at the scene's pixel scale (D71); that comes with the layout.
- **`?seed=N` only seeds a new game;** with a save in the browser, the save wins. Use New game first to replay a seed.

## Guesses at numbers and content

- **Base rarities of the Lake's fish** (D72): Carp and Roach Common; Bass, Trout and Cod Uncommon; Pike and Sturgeon
  Rare. In `content/fish/*.json`, field `rarity`.
- **Treasure rarities** (D72): Heavy bait and Industrial-strength gelatin Uncommon; the chum, the laser sight and the
  four-leaf clover Rare; the compendium and the eight-leaf clover Epic. All junk is Poor. In `content/items/`.
- **Bait is saved 10% of the time** when a fish is caught (D74). `baitRecovery` in `src/engine/values.js`.
- **The stick's scatter: the bobber lands within 12 scene pixels of the aim** (D74). `castScatter` in
  `src/engine/values.js`.
- **The 38 Autumn and Winter weather descriptions** were written by Claude (2.4), in the style of Spring and Summer.
  In `content/weather/autumn.json` and `winter.json`, field `descriptions`; a cell can have several, one picked at
  random.
- **The cloud levels became words** (2.4): Clear, A few, Scattered, Mostly cloudy, Overcast, Black, in place of the
  prototype's emoji, until there are icons. In `content/rules/weather-scales.json`.
- **"Medium" is now said out loud** (D72): "Medium Northern Pike", where the prototype said "Northern Pike".
  PORTING-NOTES asked for a real name; if a medium fish should have no size word, that's a small change.

## Calls on how things work

- **Pulling the line out early still uses 30 minutes of game time** (D74), like any cast that went out and ended.
  Only leaving mid-cast voids a cast without time passing (D22).
- **A fish from the escaped pool that you pull out early goes back to the pool unharmed** (D74).
- **Fish twins** (D50): two fish stack only if species, subname *and* size match, so a 40 cm Northern Pike and a 40 cm
  Amur Pike don't stack. The owner said "size and species"; the subname is in because the two have different names.
- **New game start** (`content/rules/new-game.json`): the Lake, no spot, the stick, the first Spring weather (cell 0,
  "Clear and nippy"), 08:00 on day 1 of spring.
