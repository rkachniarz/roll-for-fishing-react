# Roll for Fishing: design and requirements

What the game is meant to be: the vision, the requirements (`R1`–`R16`) and the catalogues. Code cites these by number
(`R2.3`, `§C.2`). The reasons behind them are in [decisions.md](decisions.md); work still to do is in
[DEV_PLAN.md](../DEV_PLAN.md). A requirement changes by recording a decision first, then editing it here.

Sources: [OLD-CONCEPT.md](../OLD-CONCEPT.md), the design notes and data in the React prototype (tag `legacy-prototype`,
see [PORTING-NOTES.md](PORTING-NOTES.md)), and the decisions taken since.

Requirements marked *(open: Q-n)* depend on an open question in DEV_PLAN.md; the text there is the current proposal.

---

## 1. Vision

A tribute to World of Warcraft fishing, crossed with tabletop dice. You stand on the shore, cast, watch the bobber, and
strike when it splashes. **Timing earns you the roll; the dice decide the catch.** Around that small loop sit the things
that make it last: a character class with fishing abilities, items that always cost something for what they give, events
with choices, places to discover, weather and seasons, and records to beat.

Most of the dice are hidden at first. The d20 you roll to land a fish is always shown; the rest (is anything biting, which
fish, how big, what else is down there) are revealed as you level up, learn and find the right gear.

It's a small game for a small audience, played in short sessions on a phone or a desktop browser, and you can leave at any
moment without losing anything.

The UI follows World of Warcraft's wherever the design leaves a gap. Where it isn't clear how WoW does something, the owner
decides. *(D29)*

---

## 2. Requirements

### R1: Sessions and saving

- **R1.1** The game can be left at any time and resumed with nothing lost. Game time is frozen unless a cast is in
  progress.
- **R1.2** Progress is saved after every resolved cast, and on any other change of state (equipping an item, an event
  choice).
- **R1.3** A save holds the whole game state and a version number. Loading an older save migrates it. Saves keep
  working as content is added and changed (R15.4). *(D13, D44)*
- **R1.4** There is always a way to start a new game, with a confirmation step.
- **R1.5** Leaving or reloading during a cast voids that cast: no time passes and no roll is made. Buffs that last "the
  next n casts" spend a charge when the line goes out, so a voided cast still uses one up. *(D22)*
- **R1.6** A save holds the position of every random stream, so a reload continues the same dice. *(D53)*

### R2: The cast

- **R2.1** The player casts by tapping (or clicking) the water; the bobber lands near where they tapped, kept within the
  open water. How far off it may land is set by the rod's accuracy (R13.2). A key (Space or Enter) casts to a random
  spot. *(D18, D34)*
- **R2.2** After the cast, a fish bites after a random delay. The bite is shown as a splash: the bobber is pulled under,
  with spray and ripples.
- **R2.3** The player strikes by tapping anywhere on the scene, clicking, or pressing the key. Reaction time, from the
  splash appearing on screen to the strike, modifies the fishing roll: **fast +1, ok +0, bad −1**. *(D11)*
- **R2.4** No strike within **3 seconds** of the splash: whatever was on the line is gone, and no roll is made. The cast
  ends as resolved; then nothing happens to the bobber for 5 seconds, after which the line counts as freshly cast, a
  new cast with new dice. A tap during those 5 seconds pulls the line out (R2.5). A second miss in a row reels the line
  in. *(D64)*
- **R2.5** A strike before any bite pulls the line out: the cast ends with nothing. *(D15, provisional)*
- **R2.6** A successful strike leads to the fishing roll: d20 + skill + modifiers against the fish's difficulty. A natural
  20 always lands the fish. This roll is always shown to the player (R5).
- **R2.7** Reaction windows, bite delays and the 3-second limit are game values that items, perks and abilities can change.
- **R2.8** Every cast ends in a splash, whatever is on the line: junk and treasure bite too. Only a fish fights back
  (the d20, R2.6); anything else is landed by any strike in time. A "nothing" result is reported as an empty hook. No animation shows a fish or item being reeled in.
  *(D64, D69)*

### R3: What is on the line

The rolls behind a cast, in order. All are seeded (R9.1) and, at first, hidden (R5). They are made when the line goes
out; the splash only reveals the result. *(D63)*

- **R3.1** **Bite or not:** whether a fish takes the bait at all. Fish Find (base plus modifiers) raises the chance. With no
  bite, the cast still resolves, via the non-fish table (R3.4). *(D20)*
- **R3.2** **Which fish:** a weighted pick from the location and spot tables, with weights adjusted by the current weather
  (§C.4).
- **R3.3** **Size:** a size band (Tiny, Small, Medium, Large, Gigantic, Humongous), then a size in centimetres within that
  band's slice of the species' range. Bigger bands are harder to land.
- **R3.4** **Something else:** when no fish is found, a roll on the location's non-fish table: nothing, trash, a quest item,
  a collectible, or treasure. Treasure Find (base plus modifiers) raises the better outcomes. *(D20)*
- **R3.5** **The fish's resistance:** the fish's own d20 (with its own advantage or disadvantage) is added to its
  difficulty.
- **R3.6** A fish that gets away can be met again later, marked as "seen before", and the catch record remembers how many
  tries it took. A released fish (R8.3) joins the same pool; caught again, it counts as a new catch. *(D59, D60)*

### R4: Fish and records

The game has no end goal; collecting is the long-term pull. *(D23)*

- **R4.1** Each species has a name, subnames (Rainbow Trout, Northern Pike…), a size range in cm, a base difficulty, a
  table weight, and weather preferences (§C.4).
- **R4.2** The accomplishments book keeps, per species: number caught, smallest, largest and average size, with where,
  when and in what weather each record was set; per treasure: whether and where it was found, and how many; and overall
  casts and catch rate.
- **R4.3** A collection view shows every species and treasure found so far, with silhouettes for those the player knows
  of but hasn't found yet.
- **R4.4** Each location has a finite list of what can be found there (fish and non-fish), so its completion is a
  percentage.
- **R4.5** Entries not yet found start unknown: the player can't see what is missing from a location's list. They learn
  of them by fishing more, or by obtaining or buying knowledge (a book, a tip at the inn) that a species or an item can be
  found at a location (R5).
- **R4.6** A location's completion can drop when content is added. Retired content stays in the book for whoever found
  it but doesn't count towards completion. *(D52)*
- **R4.7** Every fish has a rarity (R8.8): its species' rarity, shifted by its size band (Tiny −1 tier, never below
  Poor; Gigantic +1; Humongous +2; capped at Epic). Legendary fish are named and unique. *(D49, D63)*

### R5: Hidden rolls and knowledge

- **R5.1** Every roll the game makes is recorded with what it was for, the dice, the result, its modifiers and whether
  the player may see it. The log and the scene show only visible rolls; hidden ones appear as "?". *(D7)*
- **R5.2** The fishing d20 (R2.6) is always visible. Other rolls become visible through levels, perks and items, e.g. a
  fish compendium that reveals the fish's resistance roll.
- **R5.3** Each location's completion percentage (R4.4) is a hidden discovery meter, revealed the same way.

### R6: Character

- **R6.1** The player has a name (with a generator), a gender (M/F), a class, and three stats: Fishing Skill (added to
  the d20), Fish Find (R3.1) and Treasure Find (R3.4). Stats are rolled within the class's ranges at creation, with
  unlimited rerolls (§C.1, D63). Class names follow the gender where they need to (Rogue Fisherman / Fisherwoman). *(D19, D20)*
- **R6.2** Fish and treasure give XP; levels follow the XP curve (§C.1).
- **R6.3** Each level-up offers a choice between two perks (§C.2): passive bonuses, and active abilities with cooldowns
  counted in casts.
- **R6.4** Abilities feel like the class: the Warrior overpowers fish, the Rogue goes after treasure, the Mage bends the
  odds.
- **R6.5** Button and flavour texts vary by class (the prototype's lists are ported).
- **R6.6** Every number used in a calculation (stats, chances, timings, thresholds, table weights, cooldowns) is a game
  value that modifiers can change: items, consumables, buffs, perks, events, weather. Stats are base values; the
  modifiers on top are always derived from the state. *(D13, D20)*
- **R6.7** **Luck** is a hidden fourth stat, a karma meter. It plays no part in the cast; events check it (an option that
  only appears when Luck is positive). The player doesn't see it. *(D21)*

### R7: The fishing scene

- **R7.1** The scene is the view from the shore, as in
  [design/sketch-fishing-spot.png](design/sketch-fishing-spot.png): open water filling most of the frame, a sandy shore
  along the bottom, reeds framing both sides, the bobber with its red feather out on the water, and the line running back
  to the player.
- **R7.2** The scene is pixel art, drawn at **256×256** and scaled up by a **whole number of device pixels**, the largest
  that fits. On a phone in portrait the scene sits above the rest of the UI; on a wide screen the UI sits beside it.
  *(D10)*
- **R7.3** Pixels stay crisp: nearest-neighbour scaling only, sprite positions snapped to whole pixels, and nothing
  scaled at runtime. Things at different depths get pre-drawn sprites per depth band.
- **R7.4** Depth is shown by layering: far water paler, with smaller and denser waves; ripples flatter further out; the
  bobber smaller when cast far.
- **R7.5** Time of day, season and weather change the scene by palette and overlays (rain, snow, wind on the water, cloud
  shadows), driven by the weather engine (R11.3).
- **R7.6** The scene animates the cast's current phase and never holds up the game: the engine doesn't wait for an
  animation. *(D7)*
- **R7.7** Placeholder art is generated (sprites as code first). *(D9)*

### R8: Items and inventory

- **R8.1** Inventory works like WoW's: a grid of bag slots, one item per slot, identical items stacking, drag and drop,
  and a tooltip with name (coloured by rarity), effects, downsides (in red) and flavour text.
- **R8.2** Equipment slots (e.g. rod, line, bait, hat, two trinkets): only equipped items apply their effects.
- **R8.3** Caught fish go into a bucket container, which holds only fish; the bags hold everything else. Fish keep their
  species and size, and stack only with an identical twin. The starting bucket holds 16 fish, so a full one sends the
  player to town; the bags stay generous. Uses for fish (selling, eating for buffs, quests) unlock gradually as the
  player fishes more. Landing a fish with a full bucket asks the player to release one, the new one included; a
  released fish joins the spot's pool of fish that got away (R3.6). *(D24, D50, D57, D59)*
- **R8.4** Four item categories: **fish**, **treasure** (gear and other items with effects), **consumables** (bait,
  potions…) and **junk**, the catch-all for everything else. Much junk has a use: an event requirement, barter
  currency, an alchemical ingredient (R11.7), a quest item, a collectible such as a map fragment. *(D65)*
- **R8.5** **Every beneficial item has at least one downside.** The data is checked for this.
- **R8.6** Tooltips are generated from an item's effects, so text and behaviour can't disagree.
- **R8.7** Everything works by touch: long-press to drag, tap to inspect, slots at least 44 CSS px. Nothing depends on
  hover.
- **R8.8** Rarity tiers, as in WoW: Poor (grey), Common (white), Uncommon (green), Rare (blue), Epic (purple), Legendary
  (orange). *(D49)*
- **R8.9** Items are hand-made: each is defined once and is always the same. An effect may roll when it applies (+1d4
  to a roll), with a named die (D5). *(D48)*
- **R8.10** An item marked unique can be found once per save. Most treasure is unique, as are some junk items (quest
  items). A location whose unique items are all found stops offering them. *(D65)*

### R9: Non-functional

- **R9.1** All randomness that can affect an outcome comes from a seed, split into one stream per consumer, so a seed
  replays a session exactly. *(D4)*
- **R9.2** Phone and desktop are both first-class targets. *(D10)*
- **R9.3** No build step to run the game: static files served as-is. Content is the exception: one command builds it
  after an edit (R15.3). *(D2, D43)*
- **R9.4** Unit tests for the engine and data; browser checks for the page, in Chromium. *(D6)*
- **R9.5** A development-only bench behind `?dev`: timings, and later location, weather, items, level and events, plus
  `?seed=N` replay. It exposes as many game values (R6.6) as practical, for tuning by hand. *(D27)*
- **R9.6** The latest changes can be tried on desktop and phone without deploying: `npm run dev` on the local network.
  *(D25)*
- **R9.7** No tutorial: the player learns from dialogue and events. *(D54)*
- **R9.8** Late in development, the game can be installed to the home screen and played offline. *(D55)*

### R10: Events

- **R10.1** Events are pop-ups with slides and choices, defined as data: options may have requirements (class, stats,
  items, flags, weather, time) and effects (stats, items, XP, flags, unlocks, follow-up events).
- **R10.2** Triggers: an event meter that fills with each cast (the prototype: a d20 per cast, +5 for finding nothing,
  fires above 100), world conditions (weather, season, time of day), and fishing up certain items.
- **R10.3** Choices matter: each leads to a visible reward, cost or change.
- **R10.4** Events drive meta progression: upgrading the inn, unlocking vendors.
- **R10.5** The first event is the frog encounter (§C.6).
- **R10.6** Events can recur. The first recurring one is the Alchemist's visit to town (R11.7). *(D30)*
- **R10.7** Quests are events linked by flags. Their objectives are mostly hidden conditions on what the game counts
  (catches per species, records), which can trigger events: catch enough of one species and the minor deity who loves
  it turns up, angry. *(D51)*
- **R10.8** An event can move the player to a location they can't leave until they meet an objective (the portal to
  hell); the event explains this. *(D51)*

### R11: World

- **R11.1** Locations each have their own fish, non-fish and event tables, and spots within them that add to those
  tables. The player starts at the Lake behind the inn and can switch freely between unlocked locations.
- **R11.8** Each location has a map of its spots. While at a location, the player can switch spots at any time. Spots
  start unknown and are learned about like other entries (R4.5). *(D58)*
- **R11.2** New locations are unlocked through collectibles and quests (River, Mage Tower pools); quest locations may
  disappear once done.
- **R11.3** **Weather and seasons:** the prototype's weather engine, ported (PORTING-NOTES §1.1): four seasons, each with
  19 weathers on a hex map, drifting one step at a time; fish preferences respond to temperature, wind, clouds and
  precipitation. The directions carry no meaning; the 2d6 bias towards some of them is intended. A move off the map
  wraps around, except across a marked edge, where the weather stays the same. *(D26)*
- **R11.4** **Time** is its own clock: each resolved cast advances it by 30 game minutes; a day is 48 casts and a season
  28 days. The weather steps once per cast. All of these are game values. *(D66)*
- **R11.5** The town: the inn (buys fish; upgrades raise demand), a scrap dealer (buys junk), later more vendors. Copper
  is the currency. The first use of fish: putting them into the inn's perpetual stew for a buff (R12.6). *(D24, D28)*
- **R11.6** The game has no ending; it ends when the player stops. Collecting (R4) is the long-term goal. *(D23)*
- **R11.7** **The Alchemist** visits town from time to time (R10.6). While in town, they sell buffing potions and buy
  alchemical ingredients, which are fished up as junk and range from vials to rare magical goo. *(D30)*

### R12: Buffs and debuffs

- **R12.1** Buffs and debuffs are temporary modifiers on game values (R6.6), kept in the game state (D13). Each one comes
  from a source (the stew, a potion, an event, a perk…) and has a description.
- **R12.2** A buff or debuff lasts for one of two kinds of duration: **a number of casts** (charges spent when the line
  goes out, R1.5) or **a length of time**. Both kinds are needed. Cast-counted modifiers are the stronger ones. Timed
  ones count down in real time, but only while the game is open; game time (R11.4) is separate and still moves only with
  the player's actions. *(D32)*
- **R12.3** Active buffs and debuffs are shown as square icons in the **top right of the game area**: buffs in one row
  with a green border, debuffs in a separate row with a red border. *(D29)*
- **R12.4** Each square shows its remaining duration in its **lower right corner**, clearly legible: the number of casts
  left, or the time left, rounded to the nearest minute (`4m`) until less than a minute remains, then in seconds
  (`45s`). Rounding to the nearest minute is deliberate; WoW rounds up. *(D31)*
- **R12.5** Hovering a square shows its description; on touch screens, tapping does (R8.7, D10).
- **R12.6** **The perpetual stew** (R11.5) gives a buff that is substantial in the early game. That creates the loop:
  fish while the buff lasts, then put the catch in the stew for the next one. The buff is stronger the rarer the fish
  added, measured against their location's table, and longer the more fish are added. It runs on time (R12.2); each
  fish added is worth some extra buff time, with the amounts left for balancing. *(D28, D37)*
- **R12.7** The player can cancel a buff early: right-click on desktop, long-press on touch. Debuffs can't be cancelled.
  *(D31)*

### R13: Rods and bait

- **R13.1** A rod is always equipped (R8.2). A new game starts with a stick with some string tied to it; better rods
  come from fished-up treasure, events and the like. *(D35)*
- **R13.2** All stats are the player's, each a total of what feeds it: character, items, buffs (R6.6). The rod and the
  character feed different stats. The character feeds the stats behind the rolls (R6.1); the rod feeds the stats behind
  the cast: **accuracy** (how far from the aim the bobber may land, R2.1), the **reaction window** for the strike bonus
  (R2.3), and the **bite delay** (R2.2). *(D35, provisional)*
- **R13.3** **Bait** is an optional consumable attached to the rod. Fishing without bait always works. Bait raises the
  chance of a fish rather than junk or treasure (R3.1), and some baits favour particular fish (bread pulp, meat, live
  bait). It is used up when a fish is caught, with a chance that it is saved, and the message says which ("[bait] was
  recovered", "[fish] has eaten [bait]"). Items can raise the recovery chance. A fish that gets away takes the bait
  with a small chance, 5% for now ("[fish] got away with [bait]"). *(D36, D39, D61)*
- **R13.4** Any fish landed in the Tiny size band (R3.3) can be used as bait, to catch predators. It is caught like any
  other fish first (accomplishments book, bucket). *(D36, D41)*
- **R13.5** Rods follow R8.5: each better rod has a downside, which lets its upsides be stronger. For example, a more
  accurate rod with a longer bite delay, or a wider reaction window with a bobber that drifts. *(D38)*

### R14: The water's surface

- **R14.1** Schools of fish, curious spots and disturbances show up on the water's surface. *(D33)*
- **R14.2** If the bobber lands directly in one, the odds of what comes up change (R3). Since the bobber lands near the
  aim rather than on it (R2.1), hitting one takes aim and an accurate rod. *(D33, D34)*
- **R14.3** Features drift around the scene and thin out as they are fished. A school favours a species or raises the
  bite rate; sometimes a single, specific big fish shows just under the surface. A curious spot does the same for
  treasure or specific junk. *(D40)*
- **R14.5** Features appear at random or are triggered (by an event, an item, the weather). They are never hidden: a
  feature is either on the water, visible and aimable, or not there at all. *(D62)*
- **R14.4** A disturbance starts a magical event (R10): a fish that can talk, a lady of the lake, a merman fishing for
  people, or a portal to hell that pulls the player in and changes the location (R11). *(D40)*

### R15: Content

- **R15.1** Locations, fish, items of every kind, events, buffs, surface features, spots, weather, classes and class
  texts can be added without changing code, one file per entity, as long as existing fields and effect words can
  express them. Items, buffs and events share one vocabulary of effects. *(D42, D56)*
- **R15.2** A location lists what can be found there, with weights, and may include shared lists; whatever only one
  location lists is exclusive to it. *(D42)*
- **R15.3** One command checks all content, reports mistakes and missing art, and builds what the game loads, plus a
  read-only overview of all content. The tests run the same checks. *(D43)*
- **R15.4** Existing saves pick up new and changed content. Ids are permanent; removed content is retired, not deleted.
  *(D44)*
- **R15.5** Every kind of entity has a default icon, used until its own art exists. *(D42)*
- **R15.6** Events are written as text, with a fixed vocabulary of requirements and effects. *(D45)*
- **R15.7** All player-facing text is read through a string table, so the game could be translated. *(D46)*


### R16: The screen

- **R16.1** The layout follows WoW's: the log under the scene (the chat frame), the XP bar along the bottom, weather,
  time and season top right (the minimap and clock) beside the buff bar (R12.3), and a row of buttons (the micro menu)
  opening the character, accomplishments, bucket and bags, and spot map panels over the scene. On a wide screen the log
  and panels sit beside the scene. *(D67; the owner's sketch to come)*
- **R16.2** Every cast's result is written to the log. Anything landed also appears as its icon at the bobber, flies to
  the bucket and bags button and disappears; escapes and empty hooks get only the log line. *(D70)*
---

## 3. Catalogues

The prototype's full data (fish, 38 junk items, weathers) is ported in Phase 2; the lists below are the design view.
Once a catalogue's data is in `content/`, its section here points there instead of copying it (D56).

### §C.1 Classes and levels

| Class (prototype name) | Fishing Skill | Treasure Find | Fish Find |
|---|---|---|---|
| Warrior (Fish Fighter) | 2–7 | 0–5 | 1–5 |
| Mage (Fishing Wizard) | 1–5 | 1–5 | 5–10 |
| Rogue (Rogue Fisherman) | 0–5 | 5–10 | 0–5 |

XP to reach each level: 0, 10, 25, 50, 100, 250, 500, 1000, 2000, 5000 (level 9). The prototype names are the class
names, with Rogue Fisherwoman for a female Rogue. *(D19)*

### §C.2 Perks (from the prototype's design notes)

Levels 1, 3, 6 and 9 per class; even levels draw from the universal list. Cooldowns count casts.

**Warrior**
- L1 active: jump in and beat up a fish that escaped, to catch it. Cooldown 10.
- L3 passive: critical success on 18 and up.
- L3 active: add your level to your fishing skill for the next cast. Cooldown 10 − level.
- L6 passive: fish with advantage; advantage from different sources stacks (roll one extra die per source, keep the
  best).
- L6 active: use Fish Find + Fishing Skill for both rolls on the next cast. Cooldown 10 − level.
- L9 passive: double your Fishing Skill, including skill from items.
- L9 active: jump into the water to fight fish: for 5 casts, immediately fight anything found. Chance of underwater
  events.

**Mage**
- L1 active: your next fish-find chance is 100%. Cooldown 10.
- L3 passive: sometimes find fish from other dimensions.
- L3 active: make sure your next fish comes from the pool of fish that escaped.
- L6 passive: your L1 ability becomes passive, with cooldown 1.
- L6 active: bend reality to make a caught fish bigger and special.
- L9 passive: fish find 100%; treasure only rarely; choose between two fish when you catch one.
- L9 active: choose 5 of 10 fish and catch them all immediately.

**Rogue**
- L1 active: gut a caught fish to look for junk or treasure. Cooldown 10.
- L3 passive: sometimes find Greedy fish, which carry junk or treasure.
- L3 active: make sure your next catch is not a fish. Cooldown 10.
- L6 passive: choose between two treasures when you find one; L1 cooldown becomes 3.
- L6 active: the next junk you'd find becomes jewellery or treasure. Cooldown 10.
- L9 passive: ignore the downsides of treasure.
- L9 active: bonuses to all rolls for 3 casts, scaling with your wealth. Cooldown 8.

**Universal (even levels)**
- A cow accompanies you; you can feed it weeds.
- Double the chance of events.
- A chance to find edible fish, which give temporary bonuses.
- Immediately find a piece of treasure from the current location.
- Reroll your base stats twice and keep one of the three sets.
- See the copper value of everything; the elusive vendor fish is twice as likely.
- Put any fish from your inventory into an aquarium.
- Fish with two rods at once.
- +level to your main stat; or +½ level to your main stat and another random stat.
- Level 10: reset to level 0, empty your inventory, and start levelling a second class, keeping your abilities. Or:
  level cap raised to 99, with some events only after level 10.

### §C.3 Items (prototype treasure, to be given real downsides in Phase 5)

| Item | Effect in the prototype | Downside |
|---|---|---|
| Mega Mass Fish Chum | Fish size band +2 | (bigger fish should also be harder: PORTING-NOTES §1.3) |
| Fishing pole laser sight | +2 Fishing Skill | −2 Treasure Find (promised in text, missing in data) |
| Heavy bait | +5 Fishing Skill | Disadvantage on the fishing roll |
| Industrial-strength gelatin | Fish roll with disadvantage | −10 Fish Find |
| Four-leaf underwater clover | Advantage on the fishing roll | +3 fish difficulty |
| Fish and where to find them (compendium) | +30 Fish Find | Fish give 1 less XP |
| Eight-leaf underwater clover | "Strong" advantage | +5 fish difficulty (and advantage doesn't stack yet: §C.2 Warrior L6) |

### §C.4 The Lake

- **Fish:** Carp, Bass, Trout, Pike, Roach, Cod, Sturgeon, with sizes from 10–35 cm (Roach) to 50–300 cm (Sturgeon) and
  weather preferences (e.g. Trout: +8 when the temperature is 9 or below, +5 when it's dry). Full data in the prototype's
  `src/Data/locations.js`.
- **Spots:** by the crossroads, by the back of the inn, Old Man's Cove, the forest's edge, in deep reeds. Their tables are
  still empty.
- **Non-fish:** 38 junk items (Vendor trash, Soggy treasure map, Dwarven stein…) and the seven items in §C.3.

### §C.5 Weather

Four seasons × 19 weathers, on a hex map per season; see PORTING-NOTES §1.1 for the engine and its known defects.

### §C.6 Events

**A froggy encounter** (the prototype's sketch): "You see a frog in the shallow water, just outside your reach."
- *Observe it closely* → "After a moment, a wave of calm washes over you. Everything is going to be alright." → *Thank
  you, frog* (+2 Luck).
- *Ignore it* → end.
- *Attempt to catch the frog* (Rogue only) → "You lunge forward and get wet, and it's like it was never there." → *Well,
  shit.* (−1 Luck).

Luck is the hidden fourth stat (R6.7). *(D21)*
