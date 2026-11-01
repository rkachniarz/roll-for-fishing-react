# Porting notes: what carries over from the prototype

The React prototype (tag `legacy-prototype`) is not continued (docs/decisions.md, D1). Read its files with `git show legacy-prototype:<path>`.
This file lists what moves into the new codebase, how it should change on the way, and the lessons the old code taught.
Paths refer to the prototype's tree.

---

## 1. Port as code (with tests)

### 1.1 Weather engine (`src/Data/weather.js`)

The most finished system in the prototype. Port it faithfully; only the defects listed below change.

**How it works:**

- Each season (Spring, Summer, Autumn, Winter) has **19 weathers laid out on a hexagonal map** (a centre cell plus two
  rings). Each weather has `temperature` (0–15), `wind` (0–5), `clouds` (0–4), `precipitation` (0–4), a short and long
  description, and a `changeSet`: its six neighbours in the order `[n, ne, se, s, sw, nw]`.
- The links are symmetric (checked: if A's north is B, then B's south is A). Cells on the edge point to themselves in the
  directions that would leave the map, so the weather "holds" there.
- **One change step:** roll a d6; on 4–6 nothing changes. Otherwise roll 2d6 for the direction:

  | 2d6 | 2 | 3–4 | 5–6 | 7 | 8 | 9–10 | 11 | 12 |
  |---|---|---|---|---|---|---|---|---|
  | Direction | NW | SW | S | SE | NE | stay | N | NW |
  | Chance (of the 2d6) | 1/36 | 5/36 | 9/36 | 6/36 | 5/36 | 7/36 | 2/36 | 1/36 |

  So the weather drifts with a bias towards S and SE. That is intended: the directions carry no meaning, and the map was
  laid out around the bias (D26). Off the map, a move wraps around, except across an edge marked with a line, where the
  weather stays the same.
- Season: 90 days; at day 91 the next season starts and the weather maps to the same cell index on the new season's map.
- Fish react to weather through `weatherChanceMod` conditions on the fish: `{ param, min?, max?, bonus }`, summed into the
  fish's table weight.

**Fix on port:**

| Defect | Detail |
|---|---|
| Time is tied to weather | The day only advances (with a 3-in-6 chance) when the weather actually changes. Make time its own clock (R11.4). |
| Missing descriptions | All 19 Autumn and all 19 Winter weathers have an empty `longDescription`, so the log prints "The weather changes. " and nothing more. To write: 38 descriptions. |
| Missed edge line | Summer #8 "Torrential rain" has north → #14, but the map has an edge line above it, so north must repeat: `changeSet: [8, 18, 9, 1, 7, 10]`. The row was left as the wrap-around template value; #14 "Dry heat surges" south → itself is correct (edge line below it). |
| Random at load time | Some weathers call `getRandomNumber` inside the data (e.g. Winter "Cold and clear" wind), so the value is fixed per page load. Either make it a fixed value or a declared range rolled from the `weather` stream. |
| Implicit index mapping | The season change depends on every season having exactly 19 cells in the same layout. Make that a validated invariant (test) and document the cell positions (`q, r` coordinates would make the map readable). |
| Duplicate logic | `Components/Weather.jsx` is an older copy with its own bugs. Port only `Data/weather.js`. |

Also keep the display mappings from `Components/LocationInfo.jsx` (temperature, wind, clouds and precipitation words and
icons) as part of the weather data.

### 1.2 The named dice (`src/Functions/helpers.js`)

`getRandomNumber(min, max)`, `roll20(vantage)` (negative = disadvantage, positive = advantage), `roll100()`, `roll6()`,
`roll2d6()`. Keep them as named functions with the same names and behaviour (D5). The
only change: they draw from a seeded stream instead of `Math.random`. Add more dice in the same style as needed (`roll4`,
`roll8`, `roll3d6`…).

### 1.3 Fish generation (`src/Functions/fish.js`)

Keep the algorithm:

1. Pick a species from location + spot tables, with weights adjusted by weather (`applyWeatherMods`).
2. Pick a subname (e.g. "Rainbow" Trout).
3. Pick a size band (Tiny 5%, Small 20%, Medium 40%, Large 20%, Gigantic 15%, Humongous 5%), shift it by modifiers, and
   clamp to the range.
4. Numeric size = uniform within that band's slice of the species' `[min, max]` cm range (6 equal slices).
5. Difficulty = species mod + size band mod + modifiers; XP = difficulty + XP mod (min 0).
6. Required roll = difficulty + the fish's d20 (with the fish's own vantage).

**Fix on port:**
- Difficulty should use the *shifted* size band, so bigger fish are harder.
- Give Medium a real name instead of the empty-string sentinel.
- No leading space for species without subnames.
- Replace the weight rescaling (which crams weights under 99 around a filler entry) with plain relative weights.

### 1.4 Small pieces

| What | From | Note |
|---|---|---|
| Record book | `Components/RecordBook.jsx` | Per-species count, smallest, largest, average; casts and catch rate. Port the logic; rebuild the UI. |
| Inventory stacking | `Components/PlayerInventory.jsx` | Stack by item id; show the count in the slot corner. |
| Tooltip layout | `Components/ItemTooltip.jsx`, `App.css` | Name, description, flavour, follows the cursor. |
| Name generator | `Functions/player.js` | `generateName()` with its prefix and suffix lists, plus the reroll button idea. |
| Advantage/disadvantage display | `Components/PlayerInfo.jsx`, `ModStat.jsx` | Modifier shown as base + green/red delta. |

---

## 2. Port as data (convert to typed data, validate)

| Data | From | Notes |
|---|---|---|
| Lake fish: 7 species | `Data/locations.js` | Sizes in cm, subnames, difficulty, weather preferences. Roach is the old filler entry; give it an explicit weight. |
| Junk: 38 items | `Data/locations.js` (`lake.junk`) | Name, flavour, copper value, weight. Fix the typo "bif". `Data/items-junk.js` is a near-duplicate; diff the two before dropping it. |
| Treasure: 7 items | `Data/locations.js` (`lake.treasure`) | Mechanics carry over, but each needs a **real downside** (several only have upsides). The laser sight's description promises −2 treasure find, but its mechanics don't have it. |
| Lake spots: 5 | `Data/locations.js` | Names only: by the crossroads, back of the inn, Old Man's Cove, forest's edge, deep reeds. |
| Classes: 3 | `Functions/player.js` | Stat ranges per class. |
| XP curve | `Functions/player.js` | `[0, 10, 25, 50, 100, 250, 500, 1000, 2000, 5000]`. |
| Button texts | `Data/buttontext.js` | Per class and per outcome (regular, treasure, nothing, nat 1, nat 20). |

## 3. Port into the spec (`docs/spec.md`)

| Design material | From |
|---|---|
| The concept | `OLD-CONCEPT.md` |
| Perks per class (levels 1/3/6/9) and universal perks, including the level-10 second-class idea | `Data/perks.js` |
| Event structure: slides, options with requirements, `nextSlide`/`end` actions, callbacks; the frog encounter as the first example | `Components/Event.jsx` |
| Level-up popup: a choice between two rewards | `Components/Popup.jsx` |
| Item modifier vocabulary: `playerVantage`, `playerSkillMod`, `playerFishFindMod`, `playerTreasureFindMod`, `fishVantage`, `fishDifficultyMod`, `fishSizeIndexMod`, `fishXPmod`, extra callbacks | `Components/MainContent.jsx`, `Data/items.js` |
| Event meter: rises by a d20 per cast (+5 on finding nothing) and fires above 100 | `Components/PlayGameButton.jsx` |
| Escaped fish come back: a fish that got away can be met again, marked "seen before", and is remembered on the catch record | `Components/PlayGameButton.jsx` |

---

## 4. Lessons from the prototype

Each of these was a real bug in the old code. The new engine is designed so they can't recur.

| Lesson | What went wrong before |
|---|---|
| Derive modifiers; never add and subtract them on toggle | Toggling mutated a copy, so effects stacked without bound; after a reload, item flags and modifiers disagreed and stats went negative. |
| One serialisable state, saved whole, with a version | The escaped-fish pool, remaining treasure, modifiers and event meter weren't saved, so unique items could be found again after a reload. |
| Save after the state update, not from the render before it | The save captured the world from before the cast, one step behind. |
| No mutable objects in UI state | Mutating the `Player` instance only showed on screen because a log update happened to re-render. |
| Explicit weights, validated tables | The `chance: 0` filler had to appear exactly once per table, or the picker silently returned `undefined`. |
| Generate descriptions from mechanics | The hand-written text drifted from what items actually did. |
| One spelling per field, checked by types | `startActive` vs `active`, `mechanics` vs `itemMechanics`: found items never activated. |
| Every stat must feed a rule | `fishFind` and `treasureFind` were rolled at character creation and never used. |
| Dev tools behind `?dev` | The debug modal shipped to players. |
| A way out | Once a save existed there was no way to start a new game. |
