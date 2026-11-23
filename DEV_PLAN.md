# Roll for Fishing: development plan

What's left to do. Tick boxes as work lands; record decisions in [docs/decisions.md](docs/decisions.md) rather than
silently changing requirements. Within a phase, tasks are listed in the order they should be done; their numbers are
only ids, so a task added later keeps its number wherever it lands. Once a phase is done, its tasks move out of here
into [docs/history.md](docs/history.md), and the owner's answers that shaped them are in the decisions they cite.

**Not here:** what's done (`docs/history.md`), why things are so (`docs/decisions.md`), where a fact came from
(`docs/sources.md`), the owner's loose ideas (`docs/ideas.md`).

**Two tracks (D105).** The plan is split in two: **development**, which builds the requirements and the owner's ideas,
and **creative work**, the art, writing and sound. Development never waits for creative work. Where a task needs a
picture, a name or a text that doesn't exist yet, it is built with a placeholder: squares and triangles, a flat colour,
a plain generic sentence, a stand-in rule. A town of placeholder squares is better than no town. Each placeholder is
listed under the creative task that will replace it, so nothing is forgotten; a placeholder that fits no task gets a
new one.

**Where things stand (2026-11-23):** Phases 1 to 7, 10 and 12 are done, and so are the testers' fixes (T.1–T.4);
Phases 8, 9 and 11 have a few tasks each still open, listed below. Since Phase 12: the open water as the
default scene (D171), three skies on the art sheet only (the special sky, the blood moon, the green sun, D173–D175),
the wind's direction (D176) and waves that follow it (D177); on 2026-11-23 the docs were put in order (D182–D185:
`docs/sources.md`, the self-checking pointers, `docs/areas.md`, traps beside their code), and a code review of the whole codebase was fixed in four batches (history.md). Nothing is scheduled next; the open tasks below and the
ideas under [From our talks](#from-our-talks-not-yet-planned) are the owner's to pick from. Claude's guesses are on
[docs/REVIEW.md](docs/REVIEW.md).

## Where things are

| Cited as | What | Where |
|---|---|---|
| `D1`… | Decisions and their reasons | [docs/decisions.md](docs/decisions.md) |
| `R1.1`… `§C.1`… | Vision, requirements, catalogues | [docs/spec.md](docs/spec.md) |
| `PORTING-NOTES §n` | What carries over from the prototype, and its lessons | [docs/PORTING-NOTES.md](docs/PORTING-NOTES.md) |
| `0.1`…, `T.n` | Finished phases and tasks, task by task | [docs/history.md](docs/history.md) |
| `Q-n`, `8.x`–`11.x` | Open questions, development still to do | here |
| `CR-n` | Creative work: art, writing, sound | here, [Creative work](#creative-work) |
| | The owner's loose ideas: events, people, the story | [docs/ideas.md](docs/ideas.md), [docs/ideas/items.md](docs/ideas/items.md) |
| | Questions about the town, many still open | [docs/town-questions.md](docs/town-questions.md) |
| | Claude's guesses and calls, for the owner to check | [docs/REVIEW.md](docs/REVIEW.md) |

---

## Open questions

Answered ones move into decisions.md (Q-1 → D9, Q-2 → D10, Q-3 → D19, Q-4 → D20/D21, Q-5 → D11, Q-6 → D22,
Q-7 → D12, Q-8 → D23, Q-9 → D1, Q-10 → D24, Q-11 → D25, Q-12 → D26, Q-13 → D2/D3/D8, Q-14 → "Ideas for later",
Q-15 → D27, Q-16 → D37, Q-17 → D32, Q-18 → D38, Q-19 → D39, Q-20 → D40, Q-21 → D41, Q-24 → D48, Q-25 → D49,
Q-26 → D50, Q-27 → D51, Q-28 → D52, Q-29 → D53, Q-30 → D54, Q-31 → D57, Q-32 → D55, Q-33 → D58, Q-34 → D59,
Q-22 → D61, Q-23 → D62, Q-35 → D64, Q-36 → D65, Q-37 → D66, Q-38 → D79, Q-39 → D70, Q-41 → D167, Q-42 → D166).

- **Q-40 How are hidden numbers revealed?** Hidden rolls stay hidden until something reveals them (R5.2). The number
  a fish needed shows from level 1 (D107). Still open: what reveals the bite and treasure rolls and Luck (a perk, an
  item, a class?), and where those rolls would show; the game values to reveal them are in. *The owner (2026-11-22):*
  information should come with the level, the same for every class (see "Progression" under From our talks).

---

# Development

Building the requirements and the owner's ideas. Anything the creative track hasn't delivered yet is a placeholder
(D105), named in the task and listed under its `CR-n`.

**Done, in [docs/history.md](docs/history.md):** Phase 1, the feel trial; Phase 2, the engine core and the port;
Phase 3, the core loop, playable on GitHub Pages; Phase 4, the art pipeline and the living scene; Phase 5, items
and inventory; Phase 6, classes, levels, abilities and knowledge; Phase 7, events; Phase 10, the night, the town and
the stew; Phase 12, the map, the sun and the moon, the sky and its clouds; the testers' fixes, T.1–T.4. The done tasks of the phases below are there too.

## Phase 8: World and town

Done: 8.2, 8.4–8.7; and **8.1**, the spots learned and travelled to (D101, D109), with the owner's map (D161) in place
of the planned placeholder shapes; the town, the inn, barter, the stew and the Alchemist came with Phase 10 (D123).

- [ ] **8.3** The rest of the town (R11.5, R10.4). Squares and triangles and plain lines until CR-5 and CR-13.
  - [ ] The scrap dealer (a codename, D180), who deals in equipment: unwanted gear traded for something they have,
    and equipment crafted from parts the player fishes up. Crafting is new to the engine: what the parts are, where
    they are found and what each recipe makes are questions for the owner before it starts.
  - [ ] The inn's upgrades (R10.4): how they come and what each level changes (town question 13).
  - [ ] Bought knowledge, R4.5's tip at the inn: what it costs and what it reveals (town question 14).
- [ ] **8.12** The junk collector (D180, `docs/ideas.md`): the crazy visitor who comes now and then and takes all
  the grey items for white stuff, through `trade: junk` (7.9) and `again:` (7.10); the one person who knows the
  story. A placeholder event until CR-13.
- [ ] **8.8** Raid supply orders in town: 10, 25 or 40 of one fish over several hand-ins, the progress shown,
  consumables and gear as the reward (7.7 and 7.8 are built; town questions 26–29).
- [ ] **8.9** Companions at the fishing spot: the cat, once it trusts the player (`docs/ideas.md`, town questions
  30–32). A placeholder cat until CR-5.
- [ ] **8.13** Faces and names from parts (D187, D188). First, the owner's name lists (`docs/names/`: first names, male
  and female, and surnames for dwarves, humans and orcs; one-column CSVs, gitignored) imported into `content/` in
  the format the content checks want, by a tool that can be run again when the lists change, the CSVs staying where
  they are. Then: an appearance recipe per person, with their people, name list and name, read by both the portrait
  and the figure;
  portraits layered from parts with palette swaps for skin and hair; recipes rolled on a stream (named townsfolk from
  their content id, strangers from the game's seed) and written out in `content/` to handcraft one; the player's
  creator, picking each part with a roll button for the face and for one part. Placeholder shapes for every part
  until CR-19. A test bed on the art sheet that rolls thirty faces at once, each with its name under it, to see how
  many look like twins. The player's name keeps the prototype's generator (`generateName`).
  *The owner's answers (2026-11-23), in D188:* names read `Name the Role`, or `Name Surname` without a role; beards
  for dwarves only, women too; tusks for orcs; skin palettes per people (human: real human range; orc: greens, greys,
  brick colours; dwarf: both but no greens); the town mostly human; the player picks their people on the new-game
  screen (a second page if needed); the face is the character pane's icon, and bigger in the pane if it fits; no
  migration for old saves. First recipes: the innkeeper, the Alchemist (an orc), the scholar, the scrap dealer (a
  dwarf) and the junk collector (a woman).
- [ ] **8.14** Town figures from a 3D stand-in (D187): a page in this repo (as `editor.html` is; three.js as an ES
  module, no build step) where a scene's painting sits behind a few boxes and sliders move the camera (height, angle,
  lens) and the light until the boxes sit on the painted floor, bar and table; blocky figures posed there with short
  idle loops (stirring, wiping a tankard, lifting a mug); renders at the scene's size, unsmoothed, flat-shaded,
  outlined and snapped to the palette, one layer at a time from the same pose, exported for `npm run sprite import`.
  Free CC0 animated low-poly characters (Quaternius, for one) may stand in for hand-built figures once their licence is
  checked, credited in `assets/CREDITS.md`. Needs a painted interior to fit to; until then, the inn's placeholder.
- [ ] **8.15** The peoples in play (D188): what being a dwarf, a human or an orc changes for the player beyond looks,
  and `{race}` in events (`docs/events.md`), so an event can name the player's people or branch on it. Questions for
  the owner before it starts: which differences (stats, perks, prices, how townsfolk greet them), and how big.

## Phase 9: Balance and finish

Done: 9.1–9.4, 9.7.

- [ ] **9.6** The dice's feel (D99): timing, where they land, the floating total; the open items on
  `docs/REVIEW.md`. The ivory colour is settled.
- [ ] **9.5** Installable and offline: web app manifest and service worker (R9.8, D55).

## Phase 11: What the real species do

Done: 11.1–11.9, 11.11–11.14 (D138–D141, D146–D157).

- [ ] **11.10** Folklore events: the carp leaping the dragon gate, the catfish that shakes the earth, the archerfish
  spitting insects off leaves. Writing work, so placeholders until the creative track. *The owner (2026-11-15):* to
  be used when Legendary fish are worked on, somewhere down the line.
- [ ] **11.15** Balance by simulation (the owner, 2026-11-15; Review 3's numbers are in history.md and D153): how
  strongly preferences, spawning, plants and now the moon (D168) stack (up to ×96 at Review 3, one fish up to 90% of a
  spot's bites); a new bed of plants rolled now and then; seasons that turn gradually instead of in a step. The
  mechanics exist and are knobs in `content/rules/`; the numbers wait for the simulations.

## From our talks, not yet planned

Ideas the owner and Claude have talked over, written down so they have a place, but not yet a task or an order. A
line becomes a task once the owner picks it and answers its questions.

**Progression** (the owner, 2026-11-22):
- **Places opened by events and items, not by noticing.** The finished game has no "you noticed a spot" (`learnAfter`,
  D109): a boat to reach the open and the deep water, the dwarves' permission to cross the river's only bridge to the
  rocky shore, and so on. The machinery is partly there (`learn:`, `open:`, map fragments, D110); what opens each
  spot is the owner's to write.
- **Achievements**, a second track of progression: each one unlocks something, if only something cosmetic. The
  "same fish again and again" idea below would be one.
- **Information that comes with the level**, the same for every class: as the fish's roll shows from level 1 (D107),
  the other hidden numbers and knowledge (the bite and treasure rolls, Luck, the place's completion, a fish's
  spawning, taste and the like) open on a plan by level, instead of the mix of levels, perks and items they come from
  now. Takes in Q-40.

**The wider world** (the owner, 2026-11-22; `docs/ideas.md`, "The town and the lands around it"): the next stage after
the town's visitors, kingdoms and peoples that live beyond the town (Kolradia, Ferrstad, the Breadbasket, the
Wildlands), simulated as the pools are, their doings reaching the town and the lake. Growing in `docs/ideas.md`.

**The sky in the game.** Each is on the art sheet only so far:
- **The special sky** (D173), the magic of the land: how the game brings it (a weather, an event, a place?), and how
  it looks by day.
- **The blood moon** (D174): how often the game brings one, and whether it does anything beyond the look.
- **The green sun** (D175): how the game brings one on a cloudless, dry summer day, and whether it does anything
  beyond the look.
- **Clouds lit orange from below at dusk** (left for later in 12.5; the tints do for now).

**A busier town** (`docs/ideas.md`, 2026-11-18 and 2026-11-19):
- **Visitors**, as events like the junk collector: settlers coming with the seasons, the villagers, the dwarven caravan
  twice a year (before winter and after), soldiers, tax collectors, travellers from the Wildlands.
- **Other guests at the stew**: they add their own catch and eat from the pot, so a pot left for days changes while
  the player is away (likely stepped with each part of the day, as the pools are).
- **What goes into the pot** changes with who is in town and the season (the dwarves' goat and mushrooms, the
  villagers' eggs and fowl, fruit and vegetables in season).
- **Delayed effects** such as D165's cooking and morning greeting, taken back by D172 until the town is busier.
- **The well**, fed by the lake: the lake's magic touching the townsfolk, and perhaps a player who stays long enough.
- **Later vendors**, unlocked by events (R11.5, town question 35).

**The story's things** (`docs/ideas.md`, "The story"): elven treasure and ruins under the water, dragon things of fire
and of water, the water that once stopped dragonfire. Items, spots and events; writing under CR-10.

**Items** (`docs/ideas/items.md`): twenty picked from a hundred, among them the Lucky d20 bobber, the Fish-scale
compass, Polarised spectacles, the Trophy plaque in the room, the Stopped pocket watch and the Last Bobber. Each
needs a little engine work of its own; none is scheduled.

## Ideas for later

Not scheduled, and with less behind them than the above.

- **A precision timing bar for the cast**: tap a spot, a bar appears with a marker running up and down; the target
  area depends on the rod's quality, the marker's speed on the wind. The scatter (D85) would carry over to it. The
  owner's idea.
- **Consumables as a hand of cards** along the bottom of the screen, to make using them more tempting. A loose idea from
  the owner, not a decision.
- **Full screen, with the UI drawn over the game, as in WoW** (the owner, 2026-11-14): the scene fills the whole
  screen and the panes, the log, the buff bar and the action bar sit on top of it, instead of beside and below it as
  now. Touches the layout (`styles.css`, `fit` in `src/main.js`), the scene's sizing (D10, D93) and every pane. To
  look into later; nothing decided.
- **Catching the same fish again and again**: a hidden event or achievement for catching one released fish several
  times (D60).

## Known gaps

Loose ends, limits and things never seen working, found along the way (D182). Not tasks yet; each wants a word from
the owner or a place in a phase.

- **Never seen in a browser:** a fight manoeuvre's splash and its text over the bobber (no check reaches one, and
  the dev bench can't force one); the aquarium with a predator in it (its warning and Feed button); a predator's
  strike under the water; whether hiding, the shoals' turning and scatter, the pike's lunge and resting fish read
  well in motion (a screenshot can't show it). A manoeuvre running out after `fightMs` (D141) has never been felt
  in play. The long presses on touch since the code review's batch C (a bucket fish's menu once per press, with no
  tooltip over it; a buff cancelled only by the 1200 ms hold) have never been tried on a real phone.
- **Uncredited icons:** the fish and item icons drawn from Commons photos (D97, D98) aren't in `assets/CREDITS.md`;
  their sources are only in the local, untracked `docs/design/refs/credits.csv`. Many are CC BY or CC BY-SA, so
  they want listing before the game is shared more widely.
- **A failed load** (the scripts never arrive, say no network for the graphics library) leaves a blank background.
  A line of text could say so.
- **The rivers' unlock order** is still the interim one (D161): the upper river opens with the town, the lower river
  and the mouth are noticed after 20 and 50 casts there.
- **Fog doesn't dim the moonlight** (`src/engine/moon.js` reads only the clouds).
- **From Review 3, small rules meeting oddly:** a second twin is lost without a word when the bucket is full; a
  predator can eat an endangered fish or a class fish in the tank; a Conservationist can let the same fish go,
  Recall it and let it go again, counting each time; a pool fish struck at in a dive and missed is still "new".
- **The tank's two sizes:** a meal needs the prey under half the eater's own length, but hiding compares the
  species' middle lengths, so a trophy roach hides from a small pike that can't eat it. The hiding zone (80 by 36)
  covers most of the glass (96 by 66), so small fish beside a pike flee about a third of the time.
- **The swamp's picture under the water is one all year:** no sinking leaves in autumn, no darker winter.
- **The reedy shore's winter grass** sweeps through the lower reeds and may be too much next to the photo's dark
  mass; never judged.
- **The fallback font** is still `ui-monospace, monospace` (`styles.css`) if Google Fonts doesn't load; with
  Alegreya Sans the default, a plain sans-serif may be the better stand-in.
- **Only fish show their icon in a tooltip** (D119); items could too, the same way (`icon` in `tipFor`,
  `src/ui/links.js`).
- **The buff bar's squares** aren't drawn at the scene's pixel scale (D71).
- **A Tiny fish goes on the hook from a button** under the bucket's grid (5.8), since the bucket and the character
  pane don't show together on a phone; WoW would right-click it.
- **The content editor** (7.5) doesn't check what it saves (`npm run content` does), and nothing stops two windows
  saving the same file. Firefox and Safari can't open a folder.

---

# Creative work

Art, writing and sound: the owner's to lead, with Claude drawing and drafting under D90 and D97. Nothing in the
development track waits for these (D105). Each task lists the placeholders it replaces; when development leaves a new
placeholder, it's added here.

## Art

- [ ] **CR-1** The spots painted from the owner's photos (D97, D100; was 8.10), working from the pond trial on the art
  sheet (`src/scene/pond.js`): a version per season for each of the nine spots, and the Mage Tower's pool. *Replaces
  4.2's placeholder looks (each spot's `look` in `content/locations/`).* Painted so far: still water (the pond, D115,
  D116; autumn and summer) and the reedy shore (D117, D118; all four seasons). The swamp (D158; all four seasons,
  from the photos in `docs/design/swamp/`), waiting on the owner's final pass, with the first picture under the
  water (D159); the pond's and the reedy shore's are still to do. Spots painted from now on are painted without a
  sky, only their horizon, facing the spot's way (D166, D169).
  *Placeholder (D171):* every other spot shows the open water (`paintOpen`), the reedy shore's lake without the
  reeds, facing the spot's way, with its old `tint` over the water; the owner may make copies of it with slight
  differences per spot first.
- [ ] **CR-2** Weather and life on the painted spots (D100; the art half of 8.11): clouds per weather, rain, wind,
  light, moving plants and water. The clouds are in as code (D170), from Wikimedia Commons references (contact sheets
  in `docs/design/commons/`, local only; the files used are in `docs/sources.md`); the owner's own sky photos would go in
  beside them, as references only.
  *Placeholders still here:* every cloud pattern, the table and the palettes in `content/rules/sky.json` (marked
  `placeholder`) are Claude's first go; the still water mirrors the live sky only faintly over its photo's baked
  sky (`mirrorSky`), not as a true reflection; the clouds' tints at dusk and night (`CLOUD_TINT`); the sky's
  twilight, golden and night colours (`SKY_LOW`) and the sun's and the moon's sprites (D169); the special sky's,
  the blood moon's and the green sun's colours (D173–D175). Not started: rain and wind on the painted spots beyond
  what the scene already lays over them, light, moving plants, and the painted trees and reeds leaning and swaying
  with the wind's direction (D176; the owner, 2026-11-21; `docs/art.md`), where now they lean one fixed way.
- [ ] **CR-3** Fish icons (D97, D98): the eyes, one by one, since they were placed by script (a 2×2 a tenth of the way
  in from the snout) and some look comedic or out of place; the weak icons on `docs/design/fish-image-hunt.md`; and
  the four with no icon yet: Mainland eel, golomyanka, Grasslands silverside, Wildlands pejerrey.
- [ ] **CR-4** Item icons, and the items' names and texts: the placeholder items and rods (5.3, 5.7), the bait items
  (D101) and Small fish (5.8), the Alchemist's potions and ingredients (8.6), the set pieces (8.7). *From Phase 10:
  the ten potions, the eight plants (the owner's names, Claude's flavour), the Shiny pebble, Alchemist's vial, Shiny
  fish scales, Mysterious resin and the Old torn doll, all on default icons. From Phase 11: the Warm woolen hat,
  Heavyweight heavy weights, the Paralysing rod and the Adjustable line.*
- [ ] **CR-5** The town and its people (8.3, 8.6, 8.9): the inn, the scrap dealer, the Alchemist, the cat, and the
  portraits. *Replaces the squares and triangles: the town's buildings, the room and the aquarium, the dive's water
  (`src/scene/views.js`), and the dive's dice as labels.* The interiors are painted from photos like the spots;
  the owner looks for interior photos with simple, consistent perspective, so the 3D figures of 8.14 fit them
  (D187). The people in them are drawn over 8.14's renders, their scale found by trial.
- [ ] **CR-6** Event pictures (D142): 64×64 icons, `event/<name>`, in the round portrait beside the event's title,
  made from photos like the item icons. An event names its own with `art:`. *Replaces the default, an old scroll
  (`event/scroll`), that every event shows until it has its own; the scroll itself is a first draft for the owner's
  markup.*
- [ ] **CR-7** The map's marks (8.1, 12.1). *The paper and the outline are the owner's (D161). Still placeholders:
  the green and red circles (`src/ui/map.js`), until the owner's picture for each spot once it is discovered.*
- [ ] **CR-8** Perk and ability icons (the action bar shows initials), and the look of a Greedy fish and a bent fish
  (6.3). *Also replaces the green eye around Look Underwater (D139), four flat rings in `src/scene/views.js`.*
- [ ] **CR-9** The fixed palette and the art sheet's open trials (`art.html`).
- [ ] **CR-15** Class fish (D114): how each looks on the water, its aura and the witch's spells, and their log lines.
  *The fish itself shows below the surface in its ring, seen from the bank (D131). Still Claude's: the ring of dots
  (`src/scene/scene.js`) and the lines in `src/strings.js` (`log.champion-*`).*

- [ ] **CR-19** Face parts (D187, 8.13): heads, eyes, brows, noses, mouths, beards, hair, hats and hoods, ears for
  other peoples, and the palettes for skin and hair, drawn in Paint inside the 64×64 circle. The big shapes first,
  since they set faces apart. Then the handcrafted recipes of the most important people. *Replaces 8.13's placeholder
  shapes once it is built.*

## Writing

- [ ] **CR-10** Events: about ten more after the frog, the real quest chain (in place of 7.4's placeholder), the set
  pages (8.7), and the story (`docs/ideas.md`), with the town's visitors when they come.
- [ ] **CR-12** Names: the spots (placeholder names since D101), the "Greedy" and "Bent" marks on fish (D106), and the
  perks' names and texts (all Claude's). *From Phase 11: the Conservationist's and Look
  Underwater's descriptions, the Queasy debuff, the fight styles' journal and manoeuvre lines
  (`content/rules/fight-styles.json`), and six placeholder taste lines (`docs/placeholders.md` lists them).*
- [ ] **CR-13** What the town's people say: the inn, the scrap dealer, the junk collector, the Alchemist, the raid
  orders (8.3, 8.6, 8.8, 8.12).
  *From Phase 10: Claude's events (`welcome`, `nightfall`, `innkeeper-first`, `the-inn`, `your-room`, `alchemist`,
  `swamp-ghost`, all `placeholder: true`) and the new log lines (`PLACEHOLDER_UI` in `src/strings.js`); the
  innkeeper's first words are the owner's, edited.*
- [ ] **CR-16** Stew buffs and potions (R19.4): every fish's stew buff was set by rule (D127), the potions' by the
  plants' rarity; the owner's own, fish by fish, where they matter. *Listed in `docs/placeholders.md`.*
- [ ] **CR-17** Swimming fish drawn for swimming (R20.1): each fish its own side view, in its icon's colours, with a
  real swim. *Done as code for all 122 after the owner liked the carp trial (D131); the owner's markup, fish by fish,
  is what's left: `npm run sprite export swim-<fish>`. The stingray (a disc from above) is the roughest.*
- [ ] **CR-18** The logo (D135). *Replaces the first one in `src/scene/logo.js`: Pixelify Sans cut to pixels, gold
  ROLL, cream "for fishing", the game's d20 as the O.*

## Sound

- [ ] **CR-14** Sounds: water, splash, catch, and whatever else 9.2 plays. *Replaces the sounds made in code.*
