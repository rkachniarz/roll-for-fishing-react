# For the owner's review

Things Claude decided, guessed or wrote that the owner should look at when there's time. None of them block work. When
an item is settled, delete it from this list (and record a decision if the answer changes something).

Newest first.

## The title screen, settings and strike words (3.7–3.9)

- **The light theme's colours** are mine: pale pine, a darker seam every 40 px, the sketch's red frames turned
  browner, and darker rarity colours (Common is dark brown rather than white). The weather icon sits on a small patch
  of sky blue in the light theme, since a yellow sun doesn't show on pale wood.
- **Dark is the default** for a new device.
- **The floating words:** "Fast strike!" in green, "Strike!" in white for an OK one, "Slow strike" in orange, "Too
  early!" in red. They rise from just above the bobber and fade over about a second.
- **The title screen** has no Continue: it's New game or Load game, then a slot, as you described. A reload always
  comes back to it. Character creation has no way back to the title once opened.
- **The menu lost New game**: it's on the title screen now, through Main menu.
- **The title shows over a dimmed scene,** using the same dialog style as character creation.

## The layout (3.2, from the sketch)

- **The XP bar** isn't in the sketch: it's a thin purple bar between the scene and the button row (WoW keeps it just
  above its action bars).
- **The hours behind each time word:** Night 22–5, Dawn 5–7, Morning 7–11, Noon 11–13, Afternoon 13–18, Sunset 18–20,
  Evening 20–22. Dawn and Sunset match the scene's warm light.
- **The weather icon** comes from the weather's levels, not from each named weather: snow, storm, rain, overcast, part
  cloudy, windy, clear (a moon after Sunset). Each named weather could get its own icon later if you want that.
- **The weather tap** shows the name only (e.g. "Blizzard"), as you described; the description stays in the log.
- **Log wording follows the sketch:** "You caught: [Large Roach] (23 cm). +5 XP.", "You caught: [Empty vial]",
  "Your [Ball of stale bread] was saved." The size and XP are my additions. An item's flavour text moved from the log
  line to its tooltip.
- **The strike and roll** ("Fast strike (261 ms). d20: 14 + 2 stat = 16, needed ?.") is a quieter grey line in the log,
  before the result; the old result box is gone. The status line ("Splash! Strike now!") is gone from view; it's kept
  only for screen readers.
- **Tooltips** show the name, Unique, the slot or Consumable, the flavour text, and "Sells for N copper". Effects join
  them with 5.4.
- **The brackets look like round ones** in Pixelify Sans; that's the font's square bracket.
- **The panes** open over the left of the scene, 360 px wide at most, so on a phone they cover the scene and on a wide
  screen there's still water to cast at. One pane at a time, except the bag (below); Escape closes the pane, then the
  bag.
- **The bucket pane** is a grid with an empty slot for each fish there's still room for. The bag shows whole rows of
  four; it has no size limit yet.
- **What goes in which tab:** anything with an equipment slot is Equipment, consumables are Consumables, everything else
  (junk and treasure without a slot) is Stuff. Equipped items show on the character pane, not in the bag.
- **The map pane** only says where you are, until Phase 8 brings spots and the town.
- **The menu** has New game and, with `?dev`, the dev bench. There's no main menu or settings yet.
- **The default portrait** is your sketch's black figure, drawn 16×16.

## Items (Phase 5)

- **A full bucket's dialog** (5.5): "Your bucket is full. Let one fish go to make room. It goes back into the water
  here, and you may meet it again." The new fish is listed first, marked "Just caught". A dialog rather than WoW's
  loot window, since D59 asks the player to choose.
- **The bag opens over the log** (5.1, D83), not over the scene, on phone and desktop alike, so it can sit beside the
  character pane; it hides the log while open. On a phone there wasn't room for the paper doll and the bag both over
  the scene.
- **The paper doll** (5.2): hat and the two trinkets down the left, rod, line, bobber and bait down the right, the
  stats between. Your sketch of the slots never reached me, so this is a guess. Empty slots show the slot's name in a
  dashed box where WoW draws a silhouette.
- **How items move** (5.1): a finger holds still for 350 ms to start a drag (the phone buzzes briefly where it can); the
  carried icon floats 36 px above the finger. Two bag stacks dropped on each other swap places; dropped on an empty
  slot, a stack moves to the end. Dropping on the bag button takes an equipped item off. Dropping outside does
  nothing (WoW would ask to destroy it). Right-click on a trinket fills the first empty trinket slot, else replaces
  the first, as WoW's.
- **No equipment changes while the line is out** (5.2), including the pause after a missed splash: "You can't change
  equipment while the line is out." WoW would let you and interrupt the cast.
- **Other error texts** (5.2): "That item doesn't go in that slot." and "That item can't be equipped." (WoW's wording).
  Errors show in red near the top of the scene for 2.5 s.
- **The test items** (5.2), all `devOnly` and to be replaced: Willow rod (scatter −6, bite delay +0.5 s), Horsehair
  line (strike limit +0.5 s, fast reaction window −50 ms), Bluejay-feather bobber (blue feather, no effects), Bread
  crumbs (bait: Fish Find +10, size band −1), Straw hat (Treasure Find +2, Fishing Skill −1). Flavour texts are mine.
- **Effect wording in tooltips** (5.4): times in seconds ("+0.5 s time to strike"), chances in percent, everything
  else as "+N name" using the game values' names (lower case except the three stats). Advantage as words, "Strong"
  for 2 or more, as the prototype's notes called the Eight-leaf clover's. A bobber says "Changes how your bobber
  looks."
- **Heavy bait is a trinket** (5.2), like the prototype's other effect items, not bait: it's a unique, lasting item,
  and the bait slot is for consumable bait (5.8).
- **A released fish comes back with its tries reset to 0** (5.5): the catch record's "most tries" (R3.6) counts escapes,
  not releases.

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
- **The roll shows "needed ?"** for a fish: its own d20 is a hidden roll until something reveals it (R5.2). The
  prototype printed the number.
- **The log isn't saved:** it starts empty after a reload. The accomplishments book (3.2) is what keeps records.
- **The buff bar's look** (3.6): 36 px squares, ▲ and ▼ as stand-in icons until buffs have art, a long-press of
  0.6 s to cancel on touch, and a tooltip reading "+20 Fish Find · right-click or long-press to cancel". The squares
  aren't yet drawn at the scene's pixel scale (D71). Their tooltip no longer blocks clicks on the row below.
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
