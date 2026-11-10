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

## The content editor (7.5)

- **`http://localhost:8001/editor.html`** under `npm run dev`, in Chrome or Edge: "Open the content folder", pick a
  kind and a file, change it, Save. It writes the file in place, keeping its key order; run `npm run content` after to
  check it and rebuild what the game loads. Firefox and Safari can't open a folder.
- **Fields the file has show first;** the ones it could have are "+" buttons, and "×" takes an optional one away.
  An id field suggests every id there is. Anything the form can't show is a raw JSON box. Events are a plain text box.
- **It doesn't check content itself** (that's still `npm run content`), and nothing stops two windows saving the same
  file.

## A placeholder look per spot (4.2)

- **Each spot gets a tint and a few flat shapes,** only so they can be told apart: green-brown water and lily pads in
  the swamp, grey rocks at the rocky shore, dark water out deep, a far bank and flow lines on the river, a sandbar at
  the mouth, a violet tint and a grey tower at the Mage Tower. The reedy shore stays the scene as it was. All of it
  goes when the spots are painted (CR-1).
- **Every spot casts on the same water for now;** a spot can have its own (`water`), for when a painting needs it.

## Sound (9.2)

- **Every sound is made in code,** a placeholder until real ones (CR-14): a whoosh and a plop for the cast, a splash
  for the bite, a rising two-note chime for a catch, a falling tone for an escape, a small chime for a find, clicks
  for the dice, a four-note fanfare for a level. The best news of a cast plays, one sound.
- **The volume starts at 60 of 100,** in steps of 10 in the settings; all the way left is silence.
- **No sound of water in the background:** a loop made in code would grate. It waits for a recording.

## Sets and the old lorebook (8.7, D111)

- **The old lorebook is a placeholder,** three "sodden pages" (rare junk, unique, weight 1 in their spot's junk): deep
  water at the Lake, the river mouth, the Mage Tower's first pool. Their text is your story from `docs/ideas.md`, cut
  down to three sentences by Claude: rewrite freely (CR-10).
- **The scholar** turns up whenever the player holds a page, at most every 100 casts, and takes all three for 100 XP and
  ten worms. Placeholder words and reward.
- **A page reads in its tooltip,** under a line, rather than in a dialog of its own. A longer text may want a reading
  window.

## Hidden places and the Mage Tower pools (8.2, 8.4, D110)

- **The Mage Tower pools are all placeholder:** "The Mage Tower pools", one spot "the first pool", and six of your fish
  picked for looking ornamental (golden shiner, pumpkinseed, bluegill, rainbow trout, golden dorado, golomyanka). It
  waits for your list, and for art.
- **Three map fragments open it,** "Map fragment (1 of 3)" and so on, weight 1 each in the junk: two at the Lake, one
  at the River. They're unique, so each comes up once, and `useful`, so the junk collector leaves them.
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

## The collection (9.4)

- **It's in the journal,** in place of the list of records: a grid of every species caught, the records on a tap,
  then the treasure found. WoW keeps collections in their own window; one more button didn't seem worth it yet.
- **A silhouette means a fish that got away** before one of its kind was caught: the only way to know of a fish so far.
  The tooltip says "An unknown fish". Knowledge from books and tips comes with 8.5.

## A save to a file (9.3)

- **"Save to a file" is in the in-game menu,** downloading `roll-for-fishing-<name>-<date>.json`, the slot's own text.
  **"Load from a file" is on the title screen,** then asks which slot, as New game does. WoW has nothing like it, so
  the places are Claude's.

## Placeholder gear (5.3, 5.7)

- **Sixteen pieces of gear, all Claude's,** unique, weight 1 each in the shared treasure list beside the prototype's
  seven: rods (willow rod, ash rod, reed pole, dwarven steel rod), a silk line and the horsehair line, a cork bobber,
  the straw hat and a wide-brimmed hat, and trinkets (lucky hook, bait pouch, wicker creel, tide charm, stopwatch,
  rift shard, magpie feather). Each has one upside and one downside; the numbers are guesses for 9.1 to tune.
- **The willow rod, straw hat and horsehair line** were bench-only; now they're found like the rest.
- **The chum's downside is −5 Treasure Find** (it clouds the water). The compendium also shows what each fish needs,
  as R5.2's own example has it.
- **Bait has no downside but being used up,** so the data test lets it be. The rest must have one: `npm run content`
  now stops on it.
- **The rift shard and the magpie feather** give anyone a little of the wizard's rift fish and the rogue's Greedy fish.
  If those should stay the classes' own, they go.

## The placeholder quest chain (7.4)

- **A message in a bottle,** uncommon junk in the Lake's junk list (weight 1 among the shared list's), unique. Its note
  sends the player to the lower river with three roach; a hooded stranger takes them; on the next cast a package on
  the line holds the horsehair line and 25 XP. All the words are Claude's placeholders, for CR-10 to replace or keep.

## Event words for counters, fish, visitors, holding and trading (7.6–7.10, D108)

- **The words are Claude's:** `add:`, `needs: count`, `{#name}`, `lose: fish`, `lose: rarest fish`, `needs: fish`,
  `again:`, `go:`, `lock:`, `unlock:`, `trade: junk`. They're in `docs/events.md`; rename any you'd write differently.
- **"Any fish" means the least valuable** (lowest rarity, then smallest), so feeding the cat never costs the best
  fish by accident; a species hands in its smallest first.
- **Junk counts as useful** if it starts an event, can be equipped, does something, or has `"useful": true`. Junk
  worth 0 still goes in a trade, adding nothing.
- **The junk collector's rewards are a placeholder** (`content/tables/junk-collector.json`): worms or maggots for
  junk worth under 5, more bait from 5, the straw hat or horsehair line from 15, the willow rod from 30.
- **Being moved by an event doesn't count as arriving,** so a `trigger: arrive` event there waits for the next
  arrival.
- **Locked, the map greys out the other locations** and says "Something keeps you here. You can't leave yet." The
  event that locks should say why (R10.8).

## The fish's dice (6.8)

- **The teal die's shading is Claude's,** four steps around `#31899F` (`#5fb3c4`, `#31899f`, `#256d80`, `#1a4f5e`),
  with pale numbers, since dark ink didn't read on teal. A natural 20 is still red.
- **They come to rest in the upper middle of the play area,** the player's in the lower middle, and the fish's total
  floats over its die in a lighter teal, as the player's does in ivory.
- **The fish's advantage or disadvantage throws every die too,** the one that didn't count greyed. The engine now
  records which, from the same draws (D95), so no outcome changed.

## The number a fish needed (6.4, D107)

- **From level 1 means after the first level-up** (10 XP): a new character is level 0, so the first few casts still
  say "needed ?". Level 0 instead would show it from the start.
- **The log shows only the total,** "needed 9.", not the fish's d20 and its difficulty apart.

## A Tiny fish on the hook (5.8)

- **A Tiny fish becomes a "Small fish" bait item** in the bait slot, so it stacks and is used up like any bait. It
  forgets its species: the log says "You put Tiny Roach on the hook.", but later "… has eaten Small fish". Taken off
  the hook, it goes into the bags, not back into the bucket.
- **Small fish gives +10 Fish Find,** as the placeholder baits do; its real pull is the predators that prefer
  small-fish bait (D101). Its flavour line is Claude's.
- **An "On the hook" button per Tiny fish under the bucket's grid,** rather than dragging it onto the bait slot: the
  bucket and the character pane don't show together on a phone. Other bait in the slot goes back to the bags. WoW
  would right-click it; that can come too.

## Two tracks, and stand-in perk rules (D105)

- **The plan's split** (DEV_PLAN.md): what went to the creative track (`CR-1`–`CR-14`) and what stayed as development
  with placeholders. Spot paintings, fish icon polish, the town's art, events and names are creative; everything with
  an engine behind it stayed in development.

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

## Rift fish (D104)

- **One tier rarer** than their rank alone: the top of a spot's rift table is uncommon, the bottom epic. They come
  through only now and then, so even a common one should feel like a find.
- **Sizes** are Claude's figures for adults, as for the grounded fish; some are huge (Strange shark 200–640 cm,
  Arapaima and Giant freshwater stingray to 300), so their difficulty is the top, 3.
- **The species behind the names:** Snailfish is the sea snail *Liparis liparis*; Icefish the blackfin icefish
  *Chaenocephalus aceratus*; Hillstream loach *Sewellia lineolata*; Snow trout *Schizothorax richardsonii*; Pacu the
  red-bellied pacu *Piaractus brachypomus*; Strange cod the Murray cod.
- **Not in a cast yet:** the rift tables wait for Rift Fishing (6.3), which decides how often the rift opens.
- **Their icons** come from Commons pictures Claude picked (credits in `docs/design/refs_rift/credits.csv`, local
  only), cut out and given eyes by the tools. Odd ones: the Coelacanth is green, from an aquarium's light (the other
  picture brought part of its museum case along); the Strange shark comes from a line drawing, so it's mostly white;
  the Giant freshwater stingray is seen from above, a disc with an eye; the Goonch catfish is small, its long fins
  taking the room.

## 48 fish icons from Wikimedia Commons

- **Picked by Claude from Commons**, the best of up to 12 candidates per fish, mostly old atlas plates and studio
  shots; then cut out, drafted and given eyes as below. Licence, author and source of each are in
  `docs/design/fish_refs_commons/credits.csv` (local only).
- **Redone from better pictures:** the Roach, Perch, Yellow perch and Ferrstad carp, replacing their earlier icons.
- **Turned by hand:** the Barbel (photo already slanted, so turned less) and the Wels catfish (it dives steeply in the
  photo: mirrored and turned 58°, which leaves it thin).
- **Still without an icon:** Mainland eel, Golomyanka, Grasslands silverside, Wildlands pejerrey. They and the weakest
  icons are on the checklist `docs/design/fish-image-hunt.md` (local only).
- The game build grew from 386 kB to 532 kB with the icons.

## 28 more fish icons from Wikipedia photos

- **Which photos:** of the 69 downloaded, only those showing the whole fish side-on: Cassalan pike, Frostfin char, Frostfin
  grayling, Great Sea salmon, Black crappie, Bowfin, Brook trout, Brown bullhead, Brown trout, Central mudminnow,
  Channel catfish, Cisco, Common bream, Mainland whitefish, Golden shiner, Grayling, Lake whitefish, Largemouth bass,
  Ferrstad carp, Rudd, Sauger, Silver carp, Smallmouth bass, Walleye, White sucker, Yellow perch. Cut out with rembg
  (a background remover), then the photo-to-icon tool. Fish facing right were mirrored.
- **Two pairs share an icon,** since each pair shares a photo: Brown trout with Lake brown trout, Great Sea salmon with
  Landlocked Great Sea salmon.
- **The hand pass was a script, not by eye:** an eye on every fish, about a tenth of the length in from the snout. On a
  light head it's dark with a light glint pixel; on a dark head, a light ring round a dark pupil. Speckles added to the
  Black crappie and the Cassalan pike, whose drafts lost them. Colours aren't merged, and their comments ("upper flank",
  "fin colour") come from how dark and how strong each one is, not from looking.
- **Weakest:** the Ferrstad carp's eye is lost in its bright head; the Brown bullhead's is faint; the Black crappie,
  Smallmouth bass and Walleye have lost most of their pattern; the Yellow perch is murky.
- **Left out:** the Asp (the hands holding it survived the cut), the Ide (its photo crops the tail), and the Northern
  pike, Pumpkinseed and Sterlet, whose drafts were muddy. 48 fish still have the default icon.

## Three fish icons from Wikipedia photos (trial)

- **Perch, zander, roach** are first drafts: the photos cut out with rembg (a background remover), then the
  photo-to-icon tool and one hand pass. Drawn at 30 and padded, so nothing touches the edge.
- **Guessed by hand:** every eye; the perch's bars and its red-orange fins (the draft's brown, made brighter); the
  zander's saddles along the back; the roach's red iris.
- **The zander photo faces right**, so it's mirrored: every icon has its head up and left (D98).
- **The roach's tail is ragged** because the photo's is; the perch's photo is dark and underwater, so its icon is murky.

## Schools and big fish per spot (D102)

- **Who is a predator:** a fish that prefers small fish, frog, lure or mouse as bait. So the Perch, Rock bass and
  Smallmouth bass (worm and crayfish) get schools, and the Burbot, second in deep water, is a single big fish instead.
  The Black crappie, fourth in still water, surfaces as often as the third school there.
- **Schools** copy the roach school: 4 casts into one, gone after 24 casts, +40 Fish Find. **Big fish** copy the big
  pike: one cast, gone after 10, +100 Fish Find, at least Gigantic, swims off once if it gets away.
- **How often:** the same 12% chance per cast as before, at most 2 on the water. A spot's schools weigh 5, 4 and 3;
  each predator 1 to 4 by how common it is; the glint 2.

## Fish and spots from your spawn table (D101)

- **How rare down the list:** each rank is three quarters as likely as the one above: rank 1 is 100, rank 5 is 32,
  rank 10 is 8, rank 14 is 2. So a spot's first fish is about 50 times as common as its 14th.
- **How strong a preference is:** each one met doubles the fish's chances (`factor` in
  `content/rules/fish-preferences.json`). A fish whose four preferences are all met is 16 times likelier. So the
  Muskellunge, last at the reedy shore, outweighs a Bluegill (rank 6) at an overcast autumn sunset with a lure on.
  Nothing makes a fish *less* likely out of its conditions.
- **The weather words**, read off the four levels: *sunny* is clouds 0–1 with no rain; *cloudy* clouds 2–3;
  *overcast* clouds 4 or more; *rain* precipitation 2 or more, but not snow; *storm* wind 3+ and precipitation 3+;
  *windy* wind 3 or more. *Fog* and *snow* are marked on the weathers by name: fog on the mists, "Thick fog soup",
  "Rain and fog" and "Cold fog wafts"; snow on the snowfalls, snowy rains and the Blizzard. Sleet and hail count as
  rain. One weather can be several words: a Warm storm is overcast, rain, storm and windy.
- **Sizes** in cm are Claude's figures for what an angler meets, not record sizes: e.g. Roach 10–40, Northern pike
  40–130, Wels catfish 80–270, Lake sturgeon 80–220. All in the overview (`npm run content`, then
  `dist/content-overview.html`).
- **Difficulty** comes from the largest size: up to 20 cm is −2, 45 is −1, 80 is 0, 130 is 1, 200 is 2, above that 3.
- **Rarity** comes from how far down its best spot's list a fish is: the top 30% common, to 60% uncommon, to 85% rare,
  the rest epic. Your order decides it, so the Mainland mudminnow, last in the swamp, is epic, and the Burbot, second
  in deep water, is common.
- **Spot names** are placeholders: "the reedy shore", "the swamp", "still water", "the rocky shore", "open water",
  "deep water", "the upper river", "the lower river", "the river mouth".
- **The River has the lake's junk and treasure,** the same unique treasures (found once in either place), the glint,
  and the frog.
- **Placeholder baits**, dev-only: Maggots, Worms, Flies, Sweetcorn, Live frog, Crayfish, Shrimp, Mouse fly, Spinner
  lure, each +10 Fish Find; Bread crumbs are now bread. They warn "an upside with no downside" (R8.5): is being used
  up enough of a downside for bait?
- **The map pane** lists every spot of both places, and a tap moves there, between casts only. Moving leaves the surface
  features behind, and escaped fish stay in the spot they got away in.

## Dice over the scene (D99, branch `dice-on-the-desk`)

- **Timing**: 0.7 s rolling, 0.55 s at rest, 0.2 s dithering away, so the catch flies about 1.45 s after the strike
  (`ROLL_MS`, `HOLD_MS`, `FADE_MS` in `src/scene/dice.js`). First guesses.
- **The log waits for the dice**, so it doesn't give the result away before they land. The bucket's count and the XP
  bar don't wait; they change at the strike.
- **The die**: dark ink on ivory (the colour is settled), 35 pixels across, numbers in a 3×5 pixel font, upright on the page whichever way
  the face is turned. A natural 20's number is red, and its total floats up gold. The colours are `DICE_COLOURS`.
- **Where**: thrown in from below the scene, a little from the right, to rest side by side in the lower middle of the
  play area, over the shore line. They never cover the bobber's usual spots, but they can cover the reeds' tips on a
  narrow screen.
- **"Starts when a fish bites"**: the dice are thrown at the strike, not the bite, since nothing is rolled if the
  splash is missed.
- **"Show dice"** is under Settings, a checkbox under its own heading, "Dice". Until you set it, it's ticked unless
  the device asks for reduced motion. With it off, the roll shows at once, as before.

## Icons at 32×32 (D98)

- **The carp is the carp's icon now** (`fish/carp`), the tilted 32 from the trial as it was. Its scales come out as
  spots on the upper body; mark it up if they bother you.
- **The other nineteen icons are the old 16s, doubled.** They look as before, just with their pixels in 2×2 blocks.
  Redrawn at 32 whenever you like, from photos where there's something to photograph.
- **The catch flies to the bucket a little bigger:** about 64 device pixels on your phone instead of 48. A 32-pixel
  icon needs a whole number of device pixels per pixel, and 48 isn't one.
- **Sizes on screen:** on your phone the buttons' icons and the weather icon come out as before. On a desktop at
  100% zoom the button icons stay 32 px, but the weather icon grows from 16 to 32 px, since a 32-pixel icon can't go
  below ×1. Where the old size was an odd multiple of 16 (×5, ×7), the button icons are now one step smaller.

## The pond from a photo (art sheet trial, `src/scene/pond.js`)

- **Eye level, or slightly from above?** `docs/art.md` says the view is "from the shore, looking out, slightly from
  above", and the game's scene is drawn that way: water filling most of the view, no sky. You said you always meant
  eye level. If so, that rule changes (a decision), and the game's scene with it. The pond is drawn at eye level.
- **The far shore is further off** (you asked): everything on it is drawn at 0.6 of its first size (`FAR`), with
  smaller trees and more of them, and the water now starts at row 110 of 256, not 122. The sky gets the rows the
  shore gave up.
- **The reflection is toned down** (you asked): what's mirrored is mixed 45/55 with the water's own grey
  (`REFLECTION`), then darkened towards the viewer, as in the photo. The water's colours are now the photo's soft
  mauve-grey instead of the dark blue-grey, the shore's reflection a dull olive band. Glints and rings are lighter
  to stand out on the lighter water.
- **Fifty named colours,** far more than the game's scene uses, to get close to the photo. A real spot would want them
  cut down.
- **Drawn in autumn colours,** against the rule that the art is drawn for a clear spring noon. The seasons' tints then
  go on top of autumn; the drizzle card shows it.
- **A bobber at 150, 172** to show the scale. Casting doesn't work there: the engine's open water (`WATER`) belongs
  to the game's own view.
- **The photo is kept in the repo** (`docs/design/photo-autumn-pond.jpg`, 1.3 MB) as the reference.
- **Reeds in front, from a second photo** (`docs/design/photo-reeds.png`, placed by `sketch-pond-reeds.png`; both
  local only): a clump of common reeds in the bottom-left corner, over the birch's foot and the log's end, and a lone
  lighter reed at the bottom right. Leaves are drawn as curves that arch out and hang at the tip: a dark layer behind,
  then mid, then a few lit ones in front, about one leaf in ten yellowing, a few thin brown plumes. The clump's leaves
  lean right, the lone reed's left. Both sway one pixel per gust step. The colours (`reedLeaf*`, `reedPlume`,
  `reedLime*` in `POND`) are picked by eye from the photo. They aren't mirrored in the water: their reflections would
  fall below the frame.
- **The pond in summer** (`POND_SUMMER`, `POND_SEASONS` in `src/scene/pond.js`; from
  `docs/design/photo-summer-pond.png`, local only): the same painting and the same layout, with summer's own
  colours and a few shape changes. The sky is blue with heaped clouds, greyer to the right. The birch is in full leaf,
  a dense dark crown with lit leaves. The beech sprays reach further along the top and down the right. The hill and
  bushes are fresh green, the reed bed is mostly green, and the water is dark slate blue. Only a few leaves float on
  it, and there are twice as many glints for the wind. Colours are picked by eye from the photo. Left as they were:
  the logs and sticks (the summer photo has a different floating log), the reed clump in front, and the lone reed.
  Not tried: the photo's choppy ripples all over the water, and a weed patch on it.
- **The lone reed sits almost all in the right strip** (x 284–320), as sketched, so a square screen doesn't show it;
  so does about a quarter of the clump.

## Your ideas (`docs/ideas.md`)

- **The story is tidied a little:** grammar and a few words ("observed a hundred years of peace" became "enjoyed"),
  nothing in what happens. Put back anything you liked better.
- **The engine work the ideas need** is Claude's reading of them, now tasks 7.7–7.10 and 8.7–8.9 in the plan:
  counters, taking fish from the bucket, giving up a whole kind of item for a reward by value, visitors with a gap
  between visits, item sets, raid orders and companions.

## Perks and abilities (Phase 6, D96)

- **Every perk's name is Claude's:** Jump In, Heavy Hand, Battle Focus, Overwhelm, Full Force; Summon Fish, Rift
  Fishing, Recall, Ever-Summoning, Bend Reality; Gut, Greedy Fish, Sleight of Hook, Fence, Polish. The descriptions
  too (`content/perks/`).
- **The universal perks are Claude's for now,** standing in until the cheap ideas from the old notes are built:
  Steady Hands (+1 Fishing Skill), Fish Sense (+5 Fish Find), Magpie Eye (+5 Treasure Find), Bigger Bucket (+4 fish)
  and Trouble Magnet (events twice as often, from the notes). The first three can be taken again.
- **Jump In also lights up after a missed splash** with a fish on, not only when a strike fails: the fish got away
  either way.
- **A lit ability that's on cooldown doesn't light up** at all, rather than glowing uselessly.
- **"Next cast" abilities are a buff on the buff bar** that lasts one attempt at a catch: pulling out early or missing
  the splash keeps it for the next cast, as with cooldowns. One used while the line is out waits for the next cast.
- **Gut finds what a cast with no fish would:** the treasure roll with your Treasure Find, else junk.
- **Full Force** adds your Fish Find to your Fishing Skill and the other way round, as they stand when you use it.
- **The log says when an ability lights up** ("Jump In is ready!"), since a glow is easy to miss on a phone.
- **The action bar is centred** under the button row, its buttons the same size. Until there's art, each shows the
  ability's initials, with its key (1, 2, 3) in the corner. An ability that didn't work yet would show greyed out;
  since D106 every one works.
- **Choosing a perk** is two taps: pick a card, then Learn. The choice shows at the top of the character pane.

## Second notes from the phone (D94)

- **The settings pane is centred too,** not only the menu: it opens from the menu, and WoW centres both. The other
  panes stay down the side.
- **A strike still works with the menu open;** only casting a new line is blocked. Blocking strikes too would let
  the menu lose a fish that bit while it was open.
- **The spacer is empty.** Something could live there later (the buff bar, the time of day).

## A wider scene (D93)

- **The widest is 320 pixels** (5:4). It only matters on desktop, where the scene now goes 320 wide too (640×512 at
  1280×800); phones stay under it (286 on an iPhone, 314 on your Pixel).
- **The Pixel 9 Pro in the browser checks** is read off your screenshot: 427×830 CSS pixels at 2.25 (the default
  "High resolution"). If you switch to Full resolution, the scene goes ×4 and 314 wide.

## First notes from the phone (D92)

- **Half as often is a d12 at 1–3.** The new die keeps the weather as rolled dice (D5) instead of a second roll or
  a percentage. The weather now changes on about 19% of casts.
- **2 px beside the scene on a phone,** not 0, so the scene's border doesn't touch the edge of the screen. The
  log's padding went from 4/8 px to 2/4 px.
- **The weather line in the log** is now only the description ("Rain pours down in heavy sheets."). A season change
  still says the season has turned.

## GitHub Pages (3.5, D91)

- **Both `fresh-start` and `master` publish,** whichever was pushed last. Only `fresh-start` is used now; `master`
  is there for when the work moves back to it.
- **The 2023 prototype's site is replaced** at the same address. Its `gh-pages` branch is untouched, so it could be
  put back, and the prototype's code is still at the tag `legacy-prototype`.

## How the art is made (4.6, D90)

- **The style rules in `docs/art.md`** were read off the sketch and the art so far: hard pixels, a small named
  palette, drawn for a clear spring noon, depth by size and paleness, outlines on icons but not in the scene. Worth
  a read, since every later piece of art will follow them.
- **Event pictures are 128×64** (`docs/art.md`, Sizes). The dialog only fixes 2:1; the size is Claude's pick, small
  enough to draw by hand.
- **Magenta for "nothing here"** in drawings, since white is a colour in the palette. A drawing on white works too,
  if you say so.

## Events (7.1–7.3)

- **The event format** (D84, `docs/events.md`): front matter, `## slide` headings, `- choice -> slide` bullets,
  indented `needs:` / `gain:` / `lose:` / `set:` / `clear:` lines. Worth reading the guide and trying a small event
  of your own before writing ten; the words are easy to change now and harder later.
- **The frog happens once per game** (`once: true`). Without it, +2 Luck could be farmed. It's at the Lake with weight
  1, the only event there.
- **A choice the player can't take is hidden**, as the prototype's comments said. WoW does the same with gossip
  options. The alternative is showing it greyed out with what it needs, which tells the player more.
- **The event meter** is the prototype's: a d20 per cast, +5 when the hook comes up empty, fires above 100, so about
  one event every 9–10 casts once there are events to fire. When it fires and nothing can happen, it empties anyway.
  It keeps filling while an event is open.
- **Luck and flags change silently;** items and XP get a log line: "You receive: [Iron key]", "You lose: [Bent
  fork]", "You gain 50 XP.". Starting an event writes nothing to the log.
- **The dialog** uses the same box as the full-bucket and title dialogs: title in gold, then the picture's frame (only
  when the event has `art`, 2:1), the text, and the choices as buttons with gold text. It can't be closed with Escape.
  A click in its first 0.4 s is ignored, so a Space press or tap that ended the cast can't pick a choice by accident.
- **Events are checked after time has moved on,** so `needs: time dawn` means the cast ended at dawn.
- **`trigger: needs` events are checked anywhere,** not per location: the angry deity finds you wherever you are.
