# For the owner's review

Things Claude decided, guessed or wrote that the owner should look at when there's time. None of them block work. When
an item is settled, delete it from this list (and record a decision if the answer changes something).

Newest first.

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
