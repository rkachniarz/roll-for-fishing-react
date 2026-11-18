# For the owner's review

Things Claude decided, guessed or wrote that the owner should look at when there's time. None of them block work.

**How to answer**, right here in the file:

- **Fine as it is:** delete the item. Deleted means settled.
- **Not looked at yet:** leave it untouched. It stays for another day.
- **A change or a question:** write under the item, indented as a quote. Claude answers the same way, and the thread
  carries on in place until it's settled:

  ```markdown
  - **The frog happens once per game** (`once: true`).
    > **Owner:** OK, but let it come back once a season.
    > **Claude:** Done: `once` can now be `season` too (D85).
  ```

When asked to go through the review, Claude takes every `**Owner:**` note in one pass:

- **A change:** Claude makes it, records a decision if it changes something, and deletes the item.
- **A question:** Claude answers it under the note.

Items with no note are left alone.

Newest first.

## The map (2026-11-18, D161, 12.1)

On the phone and the desktop: `dist/verify/map.png`, `dist/verify/map-wide.png` after `npm run verify map`; the
picture alone, three times as big, in `art/map.png` after `npm run map`. Calls Claude made:

- **The paper as pixel art at 320 pixels square,** like the scene's 256, drawn at whole device pixels: on a
  1280×800 screen that is 640 pixels, so the margin is bigger than "small" there; on a phone it fills the width.
  The photo's grey white balance is set to cream (`CREAM` in `tools/map.py`), its uneven lighting flattened, the
  creases kept at 1.5 times their strength, the rusty stains from the photo's own warmth, the rim browned, 14
  colours. Every number there is a knob.
- **The ink and the water:** the outline in two sepia tones, specks of the scan dropped; a faint grey-green wash
  on the water, the bay at 3 and the river included. The stream at 4 runs off the top of your drawing, so its
  water ends in a round where your lines end.
- **Where the outline sits:** your drawing's square laid over the whole paper, 3% in from its edges, so the river
  and the east shore run off the torn edge.
- **The marks:** at your numbers' places (open water and deep water at your O and D). The upper river is at
  (195, 291), as low in the channel as a circle fits on the paper; the lower river at (189, 247), in the channel
  between the mouth and your old 6. The Mage Tower: your (180, 40) read on the 256-pixel reference you sent,
  which is (221, 56) on the map, just under the name. The town (1) is moved a little in from the paper's edge. Circles 11 pixels
  across with an ink rim and a glint; a ring round the one named. A press goes to the nearest circle within reach,
  since the town and the reedy shore are close and small on a phone.
- **The name at the top:** the spot's name, capitalised, in bold; under it the location ("The Lake"), or its
  completion when that shows. With nothing under the pointer it names where the player is.
- **On a phone a first tap names the spot and a second goes;** with a mouse, hovering names it and a click goes.
  A close × on the paper's top right; Escape, the map button, or a tap on the dark round it close it too. Going
  somewhere closes the map.
- **Held by an event** (`locked`), the other places' circles fade and a red line says so at the paper's foot.
- **The river opens at nightfall with the town** (`open: river` on each of the event's choices), the upper river
  known then; the lower river and the mouth are still noticed after 20 and 50 casts there, until the unlock order
  is redone.

## The simulation under the surface (2026-11-15, D157, 11.12)

- **Spawners are slow to leave, not certain to stay.** You chose "they arrive in groups and stay". With that, every
  pool sat at its cap for whole seasons, since some kind is spawning at most spots through spring and summer. So:
  a spawning fish is four times less likely to leave, and a spawning crowd tops out at one and a half times the
  pool's number (`spawnCrowd`), not twice.
- **What an unfished pool holds, measured over a year at four spots:** 0.7 to 0.9 of its number out of the spawning
  seasons, 1.2 to 1.5 in them; a little over one fish leaves and one arrives each part of the day. For that the
  chance to leave came down from 50% to 30% (`leave`). You asked for the leaving rate: at 50% a pool held only 0.6.
- **A predator takes only wild fish,** never one that got away from you or that you let go. `eat` is 0.8% per point
  of water temperature, for every predator alike; the deep water has about six predators in its pool, so its
  small fish go fastest.
- **The strike has not been looked at in a browser by Claude:** the predator's shadow swims to where the prey was,
  three rings and a few pixels of foam. Worth a look, and a word if it should be bigger.
- **Bites from the pool: 80% at its number** (`fromPool`), measured 65 to 92% in play; the rest are passers-by.
  A thin pool gives more passers-by, as you chose, so there is no fishing a spot out.
- **Bigger-fish bait and perks** now mostly choose which of the pool's fish bites (the bigger the likelier); only a
  passer-by is rolled a size up. Difficulty and XP values count for every fish.
- **Rift Fishing is rolled before the pool,** so it keeps its full chance.
- **Schools from the list are gone from play.** The school features and D154's lists stay in content, used only by
  the bench; `schools` in `rules/spawning.json` is no longer read. Say if they should be retired outright.
- **A school always shows,** whatever the depth or the hour; its fish keep 6 pixels apart across and 3 up
  (`shoalGap`) and close half the distance with each cast. Each fish alone drifts up to 4 pixels a cast (`drift`).
- **The night counts as one part of the day across midnight,** so there are seven turns a day.

## Fish leave the pool; aiming at a shadow (2026-11-15, D156, 11.14)

- **Class fish are shown under the water but are not in the pool.** You chose "truly in the pool" for schools,
  big fish and class fish. Schools and big fish are. A class fish holds its spot when you travel, isn't caught in
  a dive and carries what it stole, so it stays in its own list and only shows in Look Underwater. Say if it
  should be in the dive too.
- **Every wild fish can leave, not only the unsuited.** With "the unsuited may leave" almost nobody left: nearly
  every fish has its season or hour met. So: 50% to leave with nothing met, halved for each preference met and
  for spawning. Plants don't count, being always there.
- **After a day away, every wild fish is new;** within a day, one turn however many parts of the day went by.
- **What shows:** surface and upper swimmers always; lower 40%, bottom 15%; half at night or in rain (precipitation
  2 and up); 12 at most. At the deep water, where everyone swims low, that is few shadows: worth a look.
- **Landing on a shadow:** 16 pixels across, 6 up and down, the patch the shadow mills about in. With a cast's
  scatter of 20 it takes some luck; a better rod narrows it.
- **A school is 3 to 5 fish and has no Fish Find any more,** as you said; it lasts until its fish are gone or its
  24 casts are up. A fish of it that gets away is still the school's. Its fish are rolled as it comes up, so a
  perk for bigger fish doesn't reach them, nor the big fish (as with the pool, D153).
- **A fish that gets away reappears where the bobber was;** one let go finds a place of its own.
- **Jump In now works after a big fish too:** it used to be "somewhere else"; it is in the pool now.
- **Older saves** lose the schools and big fish that were on the water at the time.

## Review 3: how the lake's rules meet (2026-11-15)

The bugs the review found are fixed and listed in history.md. These are not bugs: places where two of the lake's
rules meet and the result may not be what was meant. The owner has answered most (2026-11-15): the stacking
multipliers, the plants and the seasons' steps are knobs for the balance simulations later (DEV_PLAN, Phase 11);
the adjustable line, Luck (events will roll with it and gate choices by it) and the one water temperature are
fine as they are. What's left:

- **Weight touches nothing but the records (D146), by the owner's call,** with one side effect: twins must share a
  condition, 21 steps, so fish almost never stack in the bucket now.
- **The tank goes by the fish, hiding by the kind (D152).** A meal needs the prey under half the eater's own
  length; hiding compares the species' middle lengths. A trophy roach hides from a small pike that can't eat it.
  In the tank the hiding zone (80 by 36) covers most of the glass (96 by 66): small fish beside a pike are fleeing
  about a third of the time.
- **Smaller things:** a second twin is lost without a word when the bucket is full; a predator can eat an
  endangered fish or a class fish in the tank; a Conservationist can let the same fish go, Recall it and let it go
  again; a pool fish struck at in a dive and missed is still "new" to the player.

Calls made while fixing, for a look:

- **Big fish by the predator mark (D155).** New: big chub, rock bass, brown trout, smallmouth bass, ide (names
  marked placeholders). **Kept, though the rule would not make them today:** the five without the mark (channel
  catfish, landlocked salmon, eel, sea lamprey, pejerrey) and the two that shoal (black crappie, silverside); say
  if any should go. Left out as too small: Cassalan sleeper, Wildlands perch.
- **Schools follow shoaling now (D154).** Marked as shoaling **from common knowledge, not a source** (FishBase says
  nothing either way): rudd, ruffe, crucian carp, common carp, Ferrstad carp, white sucker. Taken as keeping alone,
  their schools retired: central mudminnow, deepwater sculpin, mainland bullhead, stone loach, chub, rock bass.
  New schools: grayling and frostfin grayling (their names, "a school of grayling", are marked placeholders). The
  swamp now has two schools, the deep water one, the rocky shore two: say if a spot should always have three.
- **The three fixes the owner asked for (D153):** the water's trend from its own average of about a week
  (`trendLag` 336 half-hours, a guess that measured well); burbot, icefish and polar cod spawning up to 2 on the
  scale, wider than their sources (0.6 to 1.7 °C and colder), because the game's winter water averages 3; pools
  stocked with no bait and none of the player's values, so a perk for bigger fish doesn't reach the 5 to 15% of
  bites that come from the pool.
- **A fish's manoeuvre runs out after 1.5 s (`fightMs`), as D141 meant.** Until now it never did in the real game,
  so nobody has yet felt that timing in play.
- **A second tap within half a second of the strike is ignored in a fight too,** so a double tap on the splash
  doesn't yank the hook.
- **Set to the bottom, a certain fish (summoned, a class fish cast by) is never turned into something else.**
- **The pot and the tank give a fish back only to a bucket with room;** the pot itself still has no limit.
- **Trades only where the vendor is;** walking off closes the barter window.
- **No saving to a file while the line is out** ("Not while your line is out."): the file would have rolled the
  line anew.
- **A failed dive adds to the fish's "got away" count** instead of setting it back to one.
- **Swimming:** a fish in a small patch (a big fish's shadow, a class fish) now moves; shoal-mates keep their
  places instead of being reshuffled on every redraw, and face the way they swim. Worth a look in the game.

## Who eats whom (2026-11-15, D152, 11.11)

- **Predators from FishBase's diet sentences** ("feed mainly on fishes", "piscivore", "voracious predator"), 44 of them,
  and **eight known fish-eaters whose pages are silent:** muskie and chain pickerel (pike's genus), brown trout,
  Wildlands perch, payara, goliath tigerfish, arapaima, goonch. Fish that eat a little fish among much else (bluegill,
  lenok, rainbow trout, capelin) are left out; perch, yellow perch, ide and chub are in, as FishBase says the bigger ones
  eat mainly fish.
- **The numbers** (half its length, 15% a day, up to 7 days counted, 3 days for a feeding, twice the size to make a fish
  hide) are guesses in `rules/tank.json`.
- **Any bait feeds the tank,** the first bait in the bags. Say if it should be a particular food.
- **Only checked when you come into the room,** so a tank isn't hunting while you watch it. Sleeping in the room counts
  from the next time you come in.
- **Not checked in a browser:** the warning and the Feed button pass every browser check without errors, but none of
  them opens the aquarium with a predator in it. The engine side has unit tests.
- **Hiding** is drawn only: in the tank, the dive and the look. Whether it reads as hiding, or as fish twitching, wants
  your eye.

## Shoaling (2026-11-15, D151, 11.9)

- **Who shoals,** from FishBase: bream, bleak, silver bream, barbel, nase, dace, minnow, gudgeon, vendace, whitefish,
  smelt, both graylings, yellow perch, black crappie, piranha, discus, frontosa, capelin, four-eyed fish, archerfish,
  peacock bass, silver carp, mangrove jack, pejerrey; and **roach and perch**, from your examples, though FishBase's
  pages don't say it in so many words. **Alone:** ide, chub and asp too, whose young shoal but adults don't.
- **A shoal is the fish of one kind in one view.** In a tank of six with two roach, the two roach swim together.
- **The scatter:** 1.5 s, and only the middle of a bolting fish counts as a tap: guesses.
- **Not seen moving by eye:** a screenshot three seconds into a look shows a loose group of the pool's silver fish
  together; the turning together and the scatter can only be seen in the game.

## Plants and fish (2026-11-15, D150, 11.8)

- **Read from FishBase's own sentences,** every species' page fetched and searched for vegetation, weed, macrophytes,
  water plants; then cut by hand to the clear cases. **Left out:** the ruffe's "lives" (its page says it prefers water
  _without_ vegetation; it still spawns on weed), the bleak's and chub's spawning ("occasionally", "rarely"), the chub's
  "lives", the brown trout, grayling, barramundi and archerfish (they keep under _overhanging_ bank plants), the lumpfish
  (sea-weed), the snow trout (it eats plants). **Added:** the stone loach, which "breeds among aquatic vegetation".
- **Which plants doesn't matter,** only whether a spot has any: real fish keep to weed beds, not to one species of
  plant. A marimo counts as a plant.
- **Twice as likely** at a spot with plants is a guess. Most of the lake's spots have plants in their lists, so it
  mostly shifts the balance between weed fish and others there; the open and deep water have fewer.
- **The marimo's Luck counts only for events,** since that's all Luck does yet.

## Spawning (2026-11-15, D149, 11.7)

- **About 2 °C a step of the weather's scale** is my reading of its words (cold 1-3, moderate 4-6, just right 7-9,
  warm 10-12, hot 13-14). The water's floor is level 1, so a fish that spawns colder still (burbot, polar cod, icefish)
  spawns at the coldest water there is.
- **Where sources disagreed, the helpers picked one,** and each fish's `from` keeps the °C used: capelin (10-12.5 °C, out
  of 2.8-13.7 by stock), channel catfish (18-27), pumpkinseed (16-18), rainbow trout (4-10), perch (FishBase's own
  "7-8 °C", narrow; its records run 6-16), Arctic char (an autumn record, 5-6 °C).
- **Single thresholds got 4 °C added** for the top of the window (roach, rudd, chub, wels, gudgeon, ide, weatherfish,
  and others); and **the eel's** 20-24 °C is the Sargasso Sea's, which no lake in this world reaches, so it never spawns
  here. That may be right.
- **Known only by their season (25),** mostly tropical and rift fish: spring is warming water at 3-7, summer warming at
  8-12, autumn cooling at 4-8, winter cooling at 1-3, the rains warming at 10-14. Marked by `from: "season: ..."`.
- **No spawning at all (12):** the coelacanth, the stingray (both live-bearers), the goliath tigerfish, the yellow lab
  cichlid, frontosa, the four-eyed fish, the mudskipper, the hillstream loach, peacock bass, mangrove jack, silver
  arowana, tiger shovelnose: all year round, by the rains, or no record.
- **Tripled** in the tables while spawning, schools too: a guess. With 110 species having a window, a fair few gather at
  once in spring; the sim didn't measure it.
- **Not shown anywhere,** as you asked; a perk or an item to read it is for later.

## The adjustable line (2026-11-15, D148, 11.6)

- **How it's found:** in the common treasure at weight 2, like the other gear. Its name and text are placeholders.
  Say if it should come from a vendor instead.
- **The button sits on the action bar** after the abilities, with the depth's first letter (S, U, L, B; a dash when
  unset). It isn't a perk, so it has no cooldown; it's greyed while the line is out.
- **The window** draws the line as a dashed line with the four depths on it. There's no "unset" choice: once set, a
  depth stays until another is picked. Say if you want a way back to "every depth alike".
- **The numbers** are the plan's (+10, −10) and 5% for the bottom's extra non-fish, guesses.
- **Kept when the line comes off:** the depth is remembered, and counts again when it goes back on.

## How each fish swims (2026-11-15, D147, 11.5)

- **Claude's numbers, from what the fish do,** not looked up: there is no published "swimming speed in pixels".
  Each fish starts from one of seven ways of swimming, then gets its own: the pike rests 75% of the time and lunges at
  7× its cruise; bleak cruise at 22 px/s and dart; eels and lampreys wind 3 px; trout and grayling hold still half
  the time, as if against the current. All in `swim` in each fish file.
- **Not watched by eye:** the browser checks pass with no errors, but a still screenshot can't show motion. Worth a
  look in the aquarium or the dive: whether the pike's lunge reads, and whether the resting fish look alive or stuck
  (they drift a fin's worth while resting).
- **The winding is drawn only:** an eel's body goes up and down on screen, but where it is (and what a tap hits)
  follows its straight path.

## Weight from length (2026-11-15, D146, 11.4)

- **The numbers are FishBase's,** read straight from each species' summary page (the raw pages are kept locally). Many
  are FishBase's own estimates from relatives rather than measurements of the species; each fish's `from` says whose.
- **Two look heavy for the real fish:** the **marbled lungfish** comes out at 52 kg at 2 m (the real one is nearer
  17 kg), FishBase's estimate for its body shape; and the **electric eel** did too (118 kg at 2.5 m), so it borrows the
  European eel's numbers instead and comes out near 20 kg. Say if the lungfish should borrow too.
- **The Blackfish is read as the Alaska blackfish** (_Dallia pectoralis_), since it sits among the swamp's other
  air-breathers in the rift. If you meant another blackfish, say which.
- **The goonch** is listed on FishBase as _Bagarius bagarius_, whose page _B. yarrelli_ opens; its numbers are that page's.
- **The giant freshwater stingray** is weighed by total length, tail included, as FishBase gives it: 389 kg at 3 m.
- **The strange fish weigh as their kin would**, so the 6.4 m Strange shark weighs nearly two tonnes. Marked
  placeholders; the rift's magic may want them lighter or heavier.
- **The spread, ±10%,** is a guess. A class fish is always at 1.
- **Weights read** "850 g", "4.3 kg", "17 kg": grams under a kilo, one decimal under ten kilos.

## Obsidian and the background setting (2026-11-14, D144, D145)

- **Pattern is the default** for both themes; Plain is the page's colour alone, as on the loading screen.
- **The obsidian is drawn, not photographed:** the photo, shrunk and blended into a repeating tile, lost the glass and
  became dark blotches. The drawn one keeps what reads as obsidian at this size, the ripple lines of its fractures.
  The four shells, their ripple spacing and the facet lines come from a fixed seed in `tools/obsidian.py`; change
  `SEED` for another arrangement. It repeats every 480 CSS pixels, and the shells mark the repeat if you look.
- **An art trial, ripples against banded:** `npm run obsidian banded` makes the other, from a photo of flow-banded
  golden-sheen obsidian: horizontal bands with a speckled sheen, busier and a little brighter, its light patches near
  the panels' colour. The ripples stay in until you choose; `npm run obsidian` puts them back.
- **Its brightness:** the ripples peak at about the dark theme's panel edge colour. Say if it should be fainter or
  bolder, or the swells darker.

## The first load and the pine tabletop (2026-11-14, D143)

- **Pine, not oak:** both were made; at 32 pixels a board the oak photo's coarse grain turned blotchy. `npm run planks oak`
  puts it in, if you want to compare in the game.
- **Three boards, 96 CSS pixels each,** three CSS pixels to one of the tile's. The tile repeats every 768 CSS pixels
  across; a light patch in the top board marks the repeat if you look for it.
- **The grain is softened** to read behind text, and a smoothing pass removed specks the photo left.
- **Licence:** the pine photo is CC BY-SA 3.0, so the tile in `styles.css` is shared under it. Its author isn't
  given on the file's record that the tool fetched; `assets/CREDITS.md` points at the file page.
- **A gap found on the way:** the fish and item icons drawn from Commons photos (D97) aren't credited anywhere in
  the repo; their sources were only in the local, untracked `docs/design/refs/credits.csv`. Many of those photos are
  CC BY or CC BY-SA. Worth adding them to `assets/CREDITS.md` before the game is shared more widely.
- **Loading:** if the game's scripts never arrive (no network for the graphics library), the page now stays a blank
  background, where before it showed empty frames. Neither tells the player anything; a line of text could.

## Event pictures as portraits (2026-11-14, D142)

- **The default scroll** is from a public-domain photo of a medieval rotulus (Bern, Burgerbibliothek Cod. 803), found
  after five rounds of Commons searches: most "scrolls" there are Japanese hanging scrolls or flat papyri. The draft
  tool lost the rolled top and the writing, so the shapes were drawn as code from the photo, in the draft's colours.
  It's a first draft for your markup: `npm run sprite export icon-event-scroll`.
- **The frame:** a round portrait left of the title, in the legendary orange (`--rarity-legendary`) with a thin
  dark inner ring. WoW's quest portraits have a gold ring; say if it should be gold, or bigger, or sit over the
  dialog's top edge instead of inside it.
- **Size:** the 64 pixels at about one and a half times a bag slot's scale, whole device pixels (`--portrait`).
- **Every event shows a portrait now,** the scroll when it has no picture of its own, so the dialog is never bare.

## How fish fight (2026-11-14, D141, 11.3)

- **Which style each fish has** is Claude's, from what it knows of the real fish, not looked up. The ones most
  worth a look: roach, chub, ide and the small silver fish as **jumpers** (they flip at the surface, but hardly fight);
  bluegill and pumpkinseed as **head-shakers** (they circle more than shake); lake trout, char and the whitefish as
  **long runners**; mangrove jack as a **bottom-hugger** (it dives for the snags, which is its fame). The made-up
  strange fish are placeholders. The whole list is in the fish files (`fights`).
- **The famous fighters (35% manoeuvre):** pike, Cassalan pike, muskellunge, huchen, taimen, asp, the salmon,
  smallmouth and largemouth bass, golden dorado, silver carp, common carp, grass carp, wels, both big sturgeons; and in
  the rift arapaima, barramundi, payara, peacock bass, goliath tigerfish, bull shark, golden mahseer, mangrove jack,
  giant freshwater stingray. Everyone else 5%.
- **The numbers are guesses:** each style's tilt (±1, −2, natural 1–2), the 1.5 s to answer a manoeuvre, its delay of
  0.5–1.2 s after the strike, the Rogue's +2.
- **Long runner without a line:** "harder on a light line" became "−2 with no line equipped", since lines have no
  strength yet. A line's strength could come later.
- **Striking before the fish moves throws the hook.** That makes a nervous double tap costly. Say if a tap before it
  moves should just be ignored instead.
- **The manoeuvre only happens when the roll would have landed the fish;** if the roll failed, the fish simply got
  away, as before. So it can only ever cost a catch, and the Rogue's +2 is what pays them back.
- **The roll's line shows the tilt as "its fight",** not the style's name, so the log doesn't give the style away
  before the journal does. The text over the bobber during a manoeuvre ("It leaps!", "It dives for the weed!") does
  hint at it.
- **The calming items:** Calming draught at the Alchemist for a waterweed, a pebble and a vial, 10 casts; the
  Paralysing rod in the common treasure at weight 1, its downside +6 scatter (every item with an upside has one,
  R8.5). Names and texts are placeholders.
- **Balance:** the sim's catch rates didn't move, but it strikes in 250–900 ms, mostly fast; slow strikers will feel
  the bottom-huggers and rollers more.
- **Not checked in a browser:** the manoeuvre's splash and its text over the bobber. The engine's side has unit tests,
  but no browser check reaches a manoeuvre, since one can't be forced from the dev bench yet.

## Endangered fish and the Conservationist (2026-11-14, D140, 11.2)

- **Which fish, two per spot.** The status belongs to the species, and many fish live at several spots, so the picks
  had to overlap exactly for every spot to have two:
  reedy shore: Common carp, Muskellunge · swamp: Mainland eel, Mainland mudminnow · still water: Common carp, Grass
  carp · rocky shore: Frostfin char, Wildlands perch · open water: Mainland whitefish, Omul · deep water: Lake
  sturgeon, Frostfin char · upper river: Huchen, Taimen · lower river: Lake sturgeon, Golden dorado · river mouth:
  Mainland eel, Lake sturgeon. **The Mage Tower's first pool has only one** (Golden dorado): any second pick there
  would have given another spot three.
- **What the lookup confirmed** (web searches, secondary sources citing the Red List; the Red List's own pages didn't
  come up): European eel, critically endangered; lake sturgeon, endangered since 2022; huchen, endangered; Siberian
  taimen, vulnerable (an older source says critically endangered); European mudminnow, vulnerable. Common carp:
  sources disagree (vulnerable in one, least concern in another).
- **Not confirmed, picked from memory or to make up the two:** Mainland whitefish and Omul (searches found nothing);
  Golden dorado (nothing found; threatened in parts of its range, as far as I know); and four that are, as far as I
  know, **not** threatened in our world and are there only to fill a spot's second place: Muskellunge, Grass carp,
  Frostfin (Arctic) char, Wildlands perch.
- **Really threatened, but left out to keep to two per spot:** the Sterlet and the Frostfin (Siberian) sturgeon, both
  on the Red List; flagging either would give the river mouth three or four.
- **Rift fish, three:** Coelacanth, Giant freshwater stingray (endangered in the sources found), Golden mahseer
  (endangered in one source). The coelacanth's status didn't come up in the searches; critically endangered from memory.
- **Both ways of letting go count:** from a fish's options, and when a full bucket makes you choose. Not in town.
- **The first 20 releases show almost nothing:** Luck is hidden, so the 10th and 20th only log a hint ("The water
  seems to think better of you."), a placeholder; the other 18 log nothing beyond the release.
- **A fish let go can be caught and let go again,** and counts again. The pool makes that easier than before
  (Recall, the dive).
- **The tooltip line is red** ("Endangered"), the tone used for bad effects. The perk's description is a placeholder.

## The fish under the surface, and Look Underwater (2026-11-14, D139)

- **Every spot now starts with 5 to 15 fish in its pool, for every class,** as you chose. A pool fish comes back on
  the line with a chance equal to the pool's size in percent (the old rule for fish that got away), so roughly one
  bite in ten is now a pool fish. Those fish were rolled when the pool was stocked, so they follow that moment's
  time and weather, not the cast's. Not measured with the balance sim yet.
- **"Tops up with time":** one fish per game day, up to the number first rolled. The rate is a guess
  (`content/rules/pool.json`).
- **"Reroll new season" keeps the fish you've met:** only the stocked fish nobody has hooked are replaced; one that
  got away or was let go stays, with its tries. Otherwise a season would wipe the "seen before" fish.
- **"Roll anew under 2":** a fresh 2d6+3 is added on top of the one fish left.
- **A stocked fish isn't "seen before"** when it bites, unless the wizard has looked at it. Once it gets away it is
  an ordinary fish that got away.
- **Recall** ("one that got away here before") picks from the fish you've met, if there are any, and only otherwise
  from the stocked ones.
- **The dive's other fish are the pool's own now,** back in the pool if not caught; it only rolls new ones if the
  pool is too small.
- **Shadows on the water:** up to 12 of the pool's fish, each milling in its own small patch. They are the small
  swimming sprites, the same as a school's, so a sharp eye can tell a pike from a roach from the bank.
- **The look's "shadow" is the fish's darkened bank view, not a flat black shape,** because that is what the drawn
  fish have for a shadow. It hides the colours, but the outline still gives the kind away. Say if it should be a
  flat silhouette.
- **Each fish keeps its own look count,** as you suggested. A fish that joins the pool later starts at none.
  On the third look the species goes in the journal as "known to be here" and the log names it; fish in the view
  can't be tapped for a tooltip.
- **The cooldown is 10 casts** (Summon Fish's), and the look can't be started while a line is out. A reload during
  a look is back on the bank; the look still counted.
- **The eye** is four green rings darkening to the corners, a placeholder (CR-8). **The plants** in the view are the
  ones in the spot's and location's `stuff` lists; a spot with none has bare sand.
- **The perk's name, "Look Underwater", is from your words;** its description is a placeholder.

## Taste (2026-11-14, D138, 11.1)

- **The grades are Claude's reading of each fish's reputation at the table,** not a measured thing: 18 delicacies
  (burbot, eel, the sturgeons, zander, walleye, whitefish, char, salmon, vendace, sea lamprey among them), poor for the
  bony or muddy (roach, rudd, chub, dace, nase, the mudminnows, bowfin). Pike is **plain**: good meat, counted down for
  its bones, as the plan's "bony pike" asked; carp is plain too, for the mud. Each is one word in the fish's file.
- **The taste lines for real species are written as facts, from memory, not checked against a source.** The ones
  most worth a second look: barbel roe being poisonous, raw eel blood being poisonous, grayling smelling of thyme,
  smelt smelling of cucumber, the coelacanth making people ill, the icefish's colourless blood, a king dying of
  lampreys, chub as "cotton wool stuffed with needles".
- **Six lines are placeholders, marked:** the five strange fish, and the **Blackfish**, since Claude doesn't know
  which real fish it is. Tell Claude and it gets a real line.
- **The numbers:** a bowl's minutes and a raw fish's casts times 0.5 (poor), 1, 1.25, 1.5 (delicacy), so a raw
  fish's buff lasts 3, 5, 6 or 8 casts. Parasites: 5% for a low risk, 20% for a high one. **Queasy** (a placeholder
  name): −2 Fishing Skill for 8 casts.
- **Which fish are a high risk:** the pikes and perches (pike, Cassalan pike, pickerel, muskellunge, perch, yellow
  perch, walleye, sauger, ruffe), burbot, roach, ide and dace, the snakehead, the weatherfish and the eel (for its
  blood). Loosely after the real hosts of fish tapeworm and liver fluke; every other freshwater fish is low. Zander
  is low, which is a guess.
- **Rift fish carry no risk at all,** as you chose, though many are real freshwater fish (arapaima, pacu, piranha).
- **A bowl teaches the taste of one fish it didn't know before, if there is one,** rather than any fish at random:
  otherwise a pot of ten roach and one sturgeon would nearly always say "roach" again. Only that one fish's taste
  becomes known.
- **The parasite risk is never shown,** before or after: only the Queasy debuff and its log line tell. The eel's
  line gives its own away.
- **The raw fish's log line lost "Not bad."** (Claude's placeholder), since the taste line now follows it.
- **The tooltip and the journal show the grade as well as the line:** "Taste: Poor", then the sentence.

## The title screen under the water (2026-11-14, D134)

> _Owner_: Are all fish behaviors implemented later than the title screen present on the screen?

## The night, the town and the stew (2026-11-14, D123–D129)

Built overnight from your brainstorm (`docs/brainstorm-2026-11-14.md`). Everything Claude made up is marked as a
placeholder (D124): `docs/placeholders.md` lists them all, and `?ph` in the address puts a ° after placeholder text in
the game.

> _Owner_: All these neat parameters you've introduced are listed somewhere, right?

### Calls Claude made

- **The dive** (D128): the fish's dice are the player's d20 over it (ivory) and the fish's under it (teal), for 1.6
  s; caught fish swim off when their dice go. A full bucket holds one back for the usual choice; more get away.

  > _Owner_: Player's under, fish over - like above water

- **The date** on the button row is "Fri, Spring 5"; the first day of the first spring is a Monday.
  > _Owner_: The first day of the first spring should be rolled (as a DM I would do 1d8, reroll on 8). And the player doesn't know the day of the week by default, hide the value. We will use it in places, but these are Earth-English names and useless most of the time in the UI.

## Class fish (2026-11-11, D114)

- **Log lines** (`src/strings.js`, `log.champion-*`): "A Witch Gigantic Northern pike rises to the surface. It won't
  leave until it's caught.", "The Knight … comes to the rescue: advantage on the fish's roll.", "The Rogue … snatches
  {item} before you can reach it.", "It had stolen {item}. Yours again." The Rogue's moving isn't logged; the scene
  shows it.
  > _Owner_: When a fish has a class, skip the size in logs because it's a mouthful.

## The content editor (7.5)

- **`http://localhost:8001/editor.html`** under `npm run dev`, in Chrome or Edge: "Open the content folder", pick a
  kind and a file, change it, Save. It writes the file in place, keeping its key order; run `npm run content` after to
  check it and rebuild what the game loads. Firefox and Safari can't open a folder.
- **Fields the file has show first;** the ones it could have are "+" buttons, and "×" takes an optional one away.
  An id field suggests every id there is. Anything the form can't show is a raw JSON box. Events are a plain text box.
- **It doesn't check content itself** (that's still `npm run content`), and nothing stops two windows saving the same
  file.

## Sets and the old lorebook (8.7, D111)

- **The old lorebook is a placeholder,** three "sodden pages" (stuff, white, unique, weight 1 in their spot's junk): deep
  water at the Lake, the river mouth, the Mage Tower's first pool. Their text is your story from `docs/ideas.md`, cut
  down to three sentences by Claude: rewrite freely (CR-10).
- **The scholar** turns up whenever the player holds a page, at most every 100 casts, and takes all three for 100 XP and
  ten worms. Placeholder words and reward.
- **A page reads in its tooltip,** under a line, rather than in a dialog of its own. A longer text may want a reading
  window.
  > _Owner_: Add reading windows to the plan. Right click to read.

## Hidden places and the Mage Tower pools (8.2, 8.4, D110)

- **The Mage Tower pools are all placeholder:** "The Mage Tower pools", one spot "the first pool", and six of your fish
  picked for looking ornamental (golden shiner, pumpkinseed, bluegill, rainbow trout, golden dorado, golomyanka). It
  waits for your list, and for art.
- **Three map fragments open it,** "Map fragment (1 of 3)" and so on, weight 1 each in the junk: two at the Lake, one
  at the River. They're unique, so each comes up once, and stuff (D112), so the junk collector leaves them.
- **The River is open from the start,** as you've been playing it. Say if it should be found too.

## What the player knows of each place (8.1, 8.5, D109)

- **When spots are noticed is Claude's guess:** at the Lake the swamp after 15 casts there, still water 30, the rocky
  shore 50, open water 80, deep water 120; at the River the lower river after 20, the river mouth 50. The reedy shore
  and the upper river are known from the start. The bottle's note points out the lower river.
- **Completion shows from level 3,** a placeholder (`levels.json`); before that, the map and journal say only the
  place's name. Floored to a whole percent.
- **The collection moved into per-place sections** of the journal: found things in colour, things only known of as
  silhouettes. A fish found in two places shows in both.
- **Rift fish don't count towards a place's completion,** since only a wizard with the perk can find them; one caught
  still shows under the place.
- **A fish that got away is "known of" there,** not found. A missed splash (never struck) doesn't count.

## The balance simulation's first numbers (9.1)

`npm run sim`, 20 games of 500 casts per class, striking 250–900 ms after the splash, the first perk on offer, every
ability used when it can be. Things worth a look, none changed:

- **Levels come at about 16, 35–45, 65–90, 125–165 and 300–390 casts** (L1–L5). L6 needs 500 XP more than L5 and only a
  few fighters reach it in 500 casts.
- **The rogue levels slowest** (0.60 XP a cast against the fighter's 0.88 and the wizard's 0.77): Sleight of Hook and Gut
  trade fish for loot, and loot gives little XP.
- **A fish gets away 16–28% of the time,** most for the wizard, whose Summon Fish brings fish it then has to land.
- **Treasure is 3–4% of casts,** junk about 20%, the empty hook 13–19%.
- **Epic fish are 11–13% of catches,** more than rare is to uncommon: the size bands' rarity shift lifts big fish of
  rarer species to Epic. Worth checking against how special Epic should feel.

## Event words for counters, fish, visitors, holding and trading (7.6–7.10, D108)

- **The words are Claude's:** `add:`, `needs: count`, `{#name}`, `lose: fish`, `lose: rarest fish`, `needs: fish`,
  `again:`, `go:`, `lock:`, `unlock:`, `trade: junk`. They're in `docs/events.md`; rename any you'd write differently.
- **"Any fish" means the least valuable** (lowest rarity, then smallest), so feeding the cat never costs the best
  fish by accident; a species hands in its smallest first.
- **Junk worth 0 still goes in a trade,** adding nothing. (What counts as junk is settled: D112.)
- **The junk collector's rewards are a placeholder** (`content/tables/junk-collector.json`): worms or maggots for
  junk worth under 5, more bait from 5, the straw hat or horsehair line from 15, the willow rod from 30.
- **Being moved by an event doesn't count as arriving,** so a `trigger: arrive` event there waits for the next
  arrival.
- **Locked, the map greys out the other locations** and says "Something keeps you here. You can't leave yet." The
  event that locks should say why (R10.8).

## The last level 3 and 5 perks (6.3, D106)

- **The chances are Claude's:** a rift fish one fish in ten with Rift Fishing (one in five with Bend Reality too), and
  a Greedy fish one in ten. A Greedy fish's catch is rolled like a cast with no fish, so it can be the empty hook, and
  then the fish isn't Greedy after all.
- **The marks in the names are placeholders (CR-12):** "Greedy" before the fish's name in the log line that catches it
  (the fish in the bucket is a plain one), and "Bent" for good, in the bucket too. A bent fish never stacks with a
  plain twin.
- **Bend Reality caps the rarity at Epic,** as fish are (D49), and a fish already in the top size band keeps its size.
  The XP for the bigger band is added; the book's records take the new size.
- **Ever-Summoning counts every line that goes out,** a recast after a missed splash included, and works on the even
  ones. Summon Fish can still be used on the odd ones.
- **Polish waits as long as it takes,** a buff with no count on the bar, and is used up only by junk that actually
  comes up: pulling out early or an empty hook leaves it. It turns a Greedy fish's junk and a gutted fish's junk too.
- **Fence:** the treasure not kept goes back into the water, not counted as found, so a unique one can come up again.
  The choice reuses the full bucket's dialog, titled "Two treasures". A Greedy fish's or a gutted fish's treasure is a
  choice of two as well. A treasure chosen this way starts no item event (none has one yet).
- **A rift fish's log line,** "For a moment the water was somewhere else: this fish is not from here.", is Claude's.

## Dice over the scene (D99)

- **Timing**: 0.7 s rolling, 0.55 s at rest, 0.2 s dithering away, so the catch flies about 1.45 s after the strike
  (`ROLL_MS`, `HOLD_MS`, `FADE_MS` in `src/scene/dice.js`). First guesses.
- **The log waits for the dice**, so it doesn't give the result away before they land. The bucket's count and the XP
  bar don't wait; they change at the strike.
- **The die**: dark ink on ivory (the colour is settled), 35 pixels across, numbers in a 3×5 pixel font, upright on the page whichever way
  the face is turned. A natural 20's number is red, and its total floats up gold. The colours are `DICE_COLOURS`.
  > _Owner_: 20 should be gold for the player (like splash screen), red for opposing die.

## The pond from a photo (art sheet trial, `src/scene/pond.js`)

- **Fifty named colours,** far more than the game's scene uses, to get close to the photo. A real spot would want them
  cut down.
  > _Owner_: Is the number of colors we use in general a potential issue? I don't believe so, not for scenes anyway, but we should keep a style guide for ui - correct?

## Perks and abilities (Phase 6, D96)

- **Gut finds what a cast with no fish would:** the treasure roll with your Treasure Find, else junk.
  > _Owner_: is gut working correctly now? We've tinkered with the basics recently

## How the art is made (4.6, D90)

- **The style rules in `docs/art.md`** were read off the sketch and the art so far: hard pixels, a small named
  palette, drawn for a clear spring noon, depth by size and paleness, outlines on icons but not in the scene. Worth
  a read, since every later piece of art will follow them.

## Events (7.1–7.3)

- **The event meter** is the prototype's: a d20 per cast, +5 when the hook comes up empty, fires above 100, so about
  one event every 9–10 casts once there are events to fire. When it fires and nothing can happen, it empties anyway.
  It keeps filling while an event is open.
  > _Owner_: This is going to be way too often. Let's cut that sharply: d4 per cast, +1 when hook empty. Do the maths for me, feels right after seeing myself and others play (turns out the main loop is fun enough)
- **Luck and flags change silently;** items and XP get a log line: "You receive: [Iron key]", "You lose: [Bent
  fork]", "You gain 50 XP.". Starting an event writes nothing to the log.
  > _Owner_: I would like all event text that actually happen to go into log, baldur's gate style: Everything the player has read + the dialogue choices they've made. All so the player can review it when they're done.
