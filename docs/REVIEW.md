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

## The title's logo (2026-11-14, D135)

- **The colours:** ROLL in the page's gold (`--accent`, #ffd36b) with its lower third a darker gold (#d99a2b, new),
  outlined and shadowed in the dice's ink; "for fishing" in the dice's cream. The die's 20 is that gold, outlined, since
  gold alone hardly shows on the die's pale face. Its digits are the dice's own 3×5, so the 20 is small.
- **The die is the in-game size** (17 pixels to a corner), and ROLL's letters are a little shorter than it.
- **It rolls in every time the title opens,** from below, as in a cast; a window resize puts it straight back at rest.
- **"for fishing" is spread** letter by letter to ROLL's width, the space a little wider than the rest.
- **The logo's place:** the middle of the water above the lake bottom, behind the fish and the near weed but over
  the far weed and the shafts of light.
- **The dialog's "Roll for Fishing" heading is gone** from view (screen readers still have it): the logo names the game.

## The title screen under the water (2026-11-14, D134)

- **The plants are their icons, upright on the sand,** with the black outline turned to the water's darkest band
  (scene sprites have no outline). Some sit oddly on the bottom: the floating water-plantain's leaf and flower float
  in real life, and the lace plant's two leaves look cut. They'd read better as their own drawings for the scene.
- **Which plants:** all eight that can be found (`PLANTS` in `src/scene/views.js`), one about every 20 pixels across,
  picked at random, not only the ones the player has found.
- **The lake bottom's depth:** 44 pixels of floor in three bands, far to near (`FLOOR` in `src/scene/deep.js`): the
  back two are the sand mixed with the water's darkest band, new colours. Each plant gets a random depth: the far
  third hazed 45% towards the water, the middle 20%, the near third full colour and in front of the fish. Plants
  aren't spaced apart, so two can overlap. The fish swim down to the middle of the floor, among the weed.
- **The fish:** "seen" is taken as caught (the book), from every slot, not only the last game played; the reedy
  shore's own list, without its rift fish. Two of a kind only when 2d6+3 is more than the pool (15 against the reedy
  shore's 14 in a new install). They swim above the sand, down among the weed's tops.
- **The light:** one shaft about every 50 pixels, 6 to 10 pixels wide, fading out towards the sand; each flicks
  between dither frames every quarter to nearly a second and drifts two pixels either way over several seconds.
- **The dialog at the bottom of the screen** (WoW's login), over a 15% shade instead of the other dialogs' 60%. On a
  phone it covers the log, which is empty there.

## Every fish drawn to swim (2026-11-14, D131, CR-17)

After the carp trial, all 122 fish are drawn the same way (`src/scene/fish-art.js`, shapes in
`src/scene/fish-shapes.js`). The art sheet's "Fish that swim" shows two tanks, class fish on the scene's water, and
every fish side on and below the surface. The calls:

- **Outlined, like the icon (the trial's A).** You loved the carps without picking; A is what the game's swimmers
  had already. `outline: false` in `fishFrames` gives B.
- **Shapes are Claude's, from what each fish is known by:** 19 presets for kinds of body (carp, minnow, bream, pike,
  perch, sunfish, cichlid, trout, whitefish, catfish, American catfish, eel, sturgeon, shark, loach, sculpin, cod,
  characin, snakehead), each fish its own depth, fins, tail and pattern. Not from each fish's photo one by one.
- **Colours come from the icons,** read automatically: five bands from the back down and the tail's colour for the
  fins; an icon drawn the other way up has its bands turned over. Some fish come out darker or paler than you'd
  expect because their icons are (the crucian carp dark, the brown bullhead pale, the wolffish white). Red and orange
  fins (carp, roach, rudd, perch, redtail catfish…) are one shared red and orange, new colours.
- **Sizes from the fish's own size:** 18 pixels long for the smallest up to 62 for the giants (wels, arapaima,
  sturgeon), the carp 47 (the trial's was 50).
- **Under the surface:** big fish, schools and class fish all show their view from the bank now, darkened towards
  the water, in place of flat shadows; the class's ring stays round a class fish.
- **The stingray** has its own model (`rayGrid`), from the owner's two photos of other rays (shape only): a sheet
  shaped like a soft-cornered diamond, widest at the wing tips 0.4 of the way back, with pelvic lobes, a dome down the
  middle, eyes and spiracles on top, and a whip tail as long as 0.8 of the disc. The wings ripple nose to tail rather
  than flap. In the tank the camera is nearly level, so the far wing lifts into a brown sail over the cream underside;
  from the bank it's seen from above. Guessed: the span (1.1 of the disc's length), the ripple's height, the camera
  angles.
- **The four fish with no icon of their own** (golomyanka, mainland eel, both silversides) have Claude's colours.

## Icons for the eight plants (2026-11-14)

Drawn from pictures on Wikimedia Commons (`docs/design/refs/<Name>.jpg`, licences and authors in `credits.csv` there,
local only), as the fish icons were. Export one to mark up: `npm run sprite export icon-item-hornwort`.

- **Drawn as code, not by the photo tool.** The tool's drafts blurred the thin plants into blobs (hornwort, lace plant)
  or lost them (quillwort, lobelia), so each is drawn from what the plant is known by: the waterweed's whorls of three
  leaves, the hornwort's forked needles bushier at the tip, the quillwort's quills from a pale corm with roots, the
  lobelia's low rosette and nodding lilac flowers, the marimo's three velvet balls, the water-plantain's white
  three-petalled flower on its floating leaf, the lace plant's two leaves of netted veins, the waterwheel plant's
  shoot of whorled traps.
- **The pictures:** the waterweed is a sprig on a hand (the hand cut away by drawing it by hand); the lobelia a
  flowering stem in the water; the waterwheel plant a live shoot (tan in its photo's yellow water, drawn green as it
  is in clear water); the lace plant an old engraving, coloured as live leaves are.
- **The busiest at 32:** the waterweed, the hornwort and the waterwheel plant are fine, bristly things and read as a
  bit of a tangle; they'd gain most from your markup.

## The night, the town and the stew (2026-11-14, D123–D129)

Built overnight from your brainstorm (`docs/brainstorm-2026-11-14.md`). Everything Claude made up is marked as a
placeholder (D124): `docs/placeholders.md` lists them all, and `?ph` in the address puts a ° after placeholder text in
the game.

### From the owner's answers (D130)

- **The Warm woolen hat** (placeholder): +1 warmth and −50 ms on the fast strike (the ear flaps; every item needs a
  downside, R8.5). The innkeeper trades it for 2 rare fish and 3 Shiny fish scales ("Anything warm to wear?" at the
  inn). With the stew's 2 warmth it brings a winter night from Freezing down to Cold.
- **The cold starts at dark:** the evening's cold point is gone, so on a mild evening nothing is felt until night.
  Dawn still gives 1, the tail end of the night. A cold day (6 degrees or under) still makes it Chilly in daylight.
- **The town is opened by every nightfall choice,** "Stay out here and fish" too: the lights are seen either way.
  A save from before this, made after the town was visited, loses the town from the map until the next nightfall.

### Calls Claude made

- **The innkeeper's first words are yours, edited** as you asked for your writing: "In case it slipped your mind,
  friend, you already gave me every coin you had, for a room here that's yours for good. Go on up whenever you like.
  And if you'd eat first, mind the rule of this house: give something to take something." Same meaning; "give
  something to take something" kept as the hook. The event is otherwise Claude's.
- **Placeholders everywhere** (D124): the town (one location, `content/locations/town.json`: the square, the inn,
  your room, the Alchemist's shop), its seven events, the vendors, the potions, the buffs, the cold's numbers, the
  stew's numbers, every fish's stew buff, the item flavour texts. The buildings are squares and triangles (CR-5).
- **The plants** (D125) come from your CSV with their real traits as flavour. **Floating water-plantain** was in the
  CSV but not your list; it's in. Their rarity stays white: a very rare plant is seldom found, not purple.
  **Mysterios Resin** is spelled "Mysterious resin".
- **White items** (D125): when no fish bites and it's not treasure, a second d100 minus Stuff Find at or under 20 is
  stuff. The Rogue has +10 Stuff Find from the class. In the sim, white things are about 7% of casts for a fighter
  and 15% for a rogue.
- **The Old torn doll** is at still water, weight 12 in its stuff: with no Treasure Find, 83% of 400 simulated games
  found it within 200 casts (median 73), counting every non-fish as landed.
- **The Alchemist** (`content/vendors/alchemist.json`): Friday to Sunday, asleep 5 to 13, away 20% of working days
  (drawn per day). Nine potions, one per plant (two plants each for the common ones, one for the rare) plus a Shiny
  pebble and an Alchemist's vial each; the very rare plants also want Mysterious resin; Shiny fish scales make a
  Glimmer draught (more surface features). Stronger the rarer the plant: +5 Fish Find for 10 casts from waterweed up
  to a −3 natural catch from the waterwheel plant. He also gives 2 vials for any rare fish, and after 5 trades sells
  "The Alchemist's secret" for 5 pebbles. The pebble question also shows after 5 trades; he never answers.
- **Asleep, "I'll wait here"** waits 2 hours. Sleeping wakes you the first half hour of morning, with **Well rested**
  (+1 warmth, +1 Fishing Skill, 6 hours).
- **The cold** (D126, `content/rules/cold.json`): temperature 0 or below 3 points, 1–3 2, 4–6 1; night 2, evening and
  dawn 1; minus warmth. Chilly −1 Fishing Skill; Cold −2 and a shorter fast strike; Freezing −4, −10 Fish Find and
  shorter strikes. **Night fishing**: +1 size band and +2 XP per fish. No warm clothes exist yet; the Hornwort tonic
  gives +1 warmth for 6 hours.
- **The stew** (D127, `content/rules/stew.json`): 15/30/45/60/120/240 minutes per poor to legendary fish, at least 30;
  +2 warmth; the stew buffs of the three rarest kinds put in. Eating takes everything in the pot. A new bowl replaces
  the old one.
- **Every fish's stew buff** is by rule: predators Fishing Skill, winter fish warmth, night fish quicker strikes,
  bottom feeders Fish Find, rain fish keep bait, the rest Treasure Find; strength by rarity. Rift fish get the strange
  ones: a chance that a cast takes no time, a twin with the catch, more surface features, rift fish, Greedy fish,
  events, a lower natural catch, the fish's roll shown. New game values: `stuffFind`, `warmth`, `twinChance`,
  `timeSlip`, `featureChance`, `diveSeconds`, `diveFish`.
- **Sushi enjoyer** and **Aquarium** are universal perks (offered on even levels). The aquarium holds 6 fish.
- **The dive** (D128): the fish's dice are the player's d20 over it (ivory) and the fish's under it (teal), for 1.6
  s; caught fish swim off when their dice go. A full bucket holds one back for the usual choice; more get away.
- **Fish that swim** (D129): made from the icons by turning them level in code. Some icons may come out odd; the
  aquarium shows them best. The tail's beat is a pixel at most.
- **Schools and big fish** under the surface are now swimming shadows of their species (small ones for a school).
- **The date** on the button row is "Fri, Spring 5"; the first day of the first spring is a Monday.
- **The swamp's ghost** greets every arrival there until the doll is given; "Back away" takes you to the reedy shore.
- **A game from before** skips the welcome. A save mid-dive comes back out of the water.
- **Nothing was committed or pushed.**

## Notes from playing on a PC (2026-11-13, D119–D122, D132)

- **Only fish show their icon in a tooltip,** as asked. Items could too, the same way (`icon` in `tipFor`).
- **At 1080p, slot icons stay 32 px** while the text grows by 1.25: 40 px would smear, and 64 would make the bucket
  very tall. On a screen with more device pixels (125% Windows scaling, a phone) they grow to the nearest sharp size.
- **The action bar's tooltip and its buttons** are the button row's size; the initials on them didn't grow.
- **Alegreya Sans is set at 1.05 times** Pixelify Sans's size (D132), by eye, so the two read about the same.
- **The fallback font is still monospace** if Google Fonts doesn't load; with Alegreya Sans as the default, a plain
  sans-serif might be the better stand-in.

## Class fish (2026-11-11, D114)

Numbers and words Claude picked for the class fish; all in `content/rules/champions.json` unless said otherwise.

- **How often:** when a surface feature would appear (12% of casts at every location), a class fish comes instead 10%
  of the time: about one in 80 casts, until two are on the spot. With two features already on the water, neither comes.
- **Large or bigger**, and **twice the XP**, as you said. A cast within 10 pixels of it hooks it for certain (the big
  pike's feature works the same way).
- **The Rogue adds 3 to its own roll**, the same as the Cleric's +3. It steals treasure, stuff and consumables, never
  junk; with Fence's two treasures, it takes both.
- **The Shaman's weathers**, from any season: summer's Hot and dry, Torrential rain, Fierce wind, Dry heat surges;
  winter's Icy and cloudy, Windy and snowy, Blizzard; autumn's Rainy windstorm; spring's Hail and Heavy snowfall. It
  calls one up when it comes, then every 8-12 casts. Caught, the weather drifts back to the season's own from there.
- **Gravitational Chaos** makes 50% of casts fly way off (normally 1%). **Slow** doubles a cooldown when the ability
  is used under it, not cooldowns already running.
- **The witch's spells and the class fish's effects show as debuffs** on the buff bar, with no count (they last until
  it's caught), except the witch's spell, which shows its casts left. Tapping one says what it does.
- **Placeholder look:** a big fish's shadow in a ring of dots of its class's colour: Witch purple, Knight silver,
  Shaman sky blue, Rogue dark grey, Cleric yellow (CR-15).
- **Log lines** (`src/strings.js`, `log.champion-*`): "A Witch Gigantic Northern pike rises to the surface. It won't
  leave until it's caught.", "The Knight … comes to the rescue: advantage on the fish's roll.", "The Rogue … snatches
  {item} before you can reach it.", "It had stolen {item}. Yours again." The Rogue's moving isn't logged; the scene
  shows it.
- **The journal** lists "Champions caught: Witch, Knight ×2" under the casts and catches.
- **The balance sim** never aims, so it never hooks one; they come up in its games and their debuffs count, but it
  can't measure catching them yet.

## Review 2 (2026-11-10)

- **No ability while a choice waits.** While a full bucket or two treasures wait (D59, D106), the action bar is dark
  and says "Make your choice first."; travel waits too, with the same words. A choice is normally a dialog, so this
  shows only when an ability key or the map is used just before it opens.
- **Travelling puts out lit abilities**, as the next cast does: Jump In, Gut and Bend Reality act on a fish at the
  spot that lit them.
- **Bend Reality's record**: when the bent fish is the species' largest, the book shows it caught where it was bent;
  when it's the only one of its kind, it's the smallest too. An earlier smallest that was this same fish, among
  others caught, isn't revisited.

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

- **The old lorebook is a placeholder,** three "sodden pages" (stuff, white, unique, weight 1 in their spot's junk): deep
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

## The collection (9.4)

- **It's in the journal,** in place of the list of records: a grid of every species caught, the records on a tap,
  then the treasure found. WoW keeps collections in their own window; one more button didn't seem worth it yet.
- **A silhouette means a fish that got away** before one of its kind was caught: the only way to know of a fish so far.
  The tooltip says "An unknown fish". Knowledge from books and tips comes with 8.5.
  > **Claude:** Overtaken: the collection moved into per-place sections (see "The collection moved into per-place
  > sections" above), and since 8.5 a fish can also be known of from an event's `learn:` (D109). Delete when settled.

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

- **A message in a bottle,** stuff (white) in the Lake's junk list (weight 1 among the shared list's), unique. Its note
  sends the player to the lower river with three roach; a hooded stranger takes them; on the next cast a package on
  the line holds the horsehair line and 25 XP. All the words are Claude's placeholders, for CR-10 to replace or keep.

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
  > **Claude:** Overtaken: Rift Fishing is in, so the rift tables are used now (D106). Delete when settled.
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
  > **Claude:** Overtaken: only four fish still have the default icon (see "Still without an icon" above). Delete when
  > settled.

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
  > **Claude:** Overtaken: the data check now lets bait be, and stops on any other item with no downside (5.3; see
  > "Bait has no downside but being used up" above). Delete when settled.
- **The map pane** lists every spot of both places, and a tap moves there, between casts only. Moving leaves the surface
  features behind, and escaped fish stay in the spot they got away in.
  > **Claude:** Overtaken: the map lists only the spots the player knows of (D109), and the hidden Mage Tower opens
  > from map fragments (D110). Delete when settled.

## Dice over the scene (D99)

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

## The reedy shore (D117, `src/scene/reedy.js`)

- **The reeds' outline is your sketch's,** read off it column by column (`SKETCH_TOP`), with your red line over the
  painting in place of it from x 24 to 123 and 180 to 268. Blade tips poke up to 7 pixels above it, so the edge is
  ragged rather than a line.
- **The mix of reeds:** about two in five are broad cattail leaves standing up, most of the rest fine sedge arching
  over, pale where a sweep catches the sun, and one in 25 a dead brown stalk. Near the channel the sedge arches back
  into its own bank, so the channel stays clear. There's a half-sunk log at the right bank's foot, as in the photo.
- **Colours picked by eye from the photo** (`REEDY`), a little bluer and darker than a plain green. The water is
  pale where it meets the sky and deep blue near you, dark green right beside the reeds where it mirrors them.
- **Summer has heaped clouds sitting on the horizon;** autumn has a grey-blue overcast sky, greyer water, and reeds
  turned tan and gold with three in ten still green (`REEDY_AUTUMN`, worked out from summer).
- **Winter (D118), from your November photo, lightened:** dark brown cattails, a quarter of the stalks at the edge
  with a brown head (one in five of those gone to fluff), one blade in ten dark green, big heavy clouds well up into
  the sky, water silvery grey. The dry pale grass shows as sweeps through the lower reeds; it may be too much of
  it next to the photo's dark mass.
- **Spring (D118):** a vivid, yellower green than summer, a clear lighter sky, smaller clouds, and one blade in
  eight a brown stalk left from last year. Worked out from summer and your word, no photo.
- **The open water is x 40–216, y 118–180,** down to just above the lowest reed tips at its corners (the banks are
  lowest towards the channel, so the middle has room to spare). The channel below isn't part of it. Casts above row 136 use the far sprites.
- **The line comes up through the channel** and the reeds are drawn in front of it.
- **Four cards on the art sheet,** one per season, in a mild day's light for each.

## The pond as still water's scene (D115, D116)

- **Still water's water is x 40–216, y 128–185** in the play area, chosen by eye: from just under the reed bed
  (the water starts at row 110, the reeds hide the first rows) down to where the old shore's clamp stops a cast
  (`aimAt` keeps casts 30 above the old sand line). The logs and the stick tangle in the front are inside it, so a
  bobber can land on a log.
- **Far sprites above row 145** (`POND_FAR_LINE` in `src/scene/scene.js`), about a quarter of the way down the
  pond's water; the old view's line is 95.
- **Spring looks like summer and winter like autumn** (`pondSeason` in `src/scene/pond.js`) until those seasons
  are painted.
- **Surface features are hard to see on the pond:** their shadows are the old scene's colour, drawn for pale blue
  water. A school on the dark water barely shows. They need their own look for the painted spots (CR-1).
- **Saves from before keep their features where they were,** some of them up in the pond's sky, until they drift
  off or are fished out.
- **No sand, no rod's shore:** the line still comes from below the bottom edge, as before.

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
  > **Claude:** Overtaken on the reedy shore: the game now fishes there, with its own water (D115). Delete when settled.
- **The photo is kept in the repo** (`docs/design/photo-autumn-pond.jpg`, 1.3 MB) as the reference.
  > **Claude:** Overtaken: `docs/design/` is local only (D97), so the photo isn't in the repo. Delete when settled.
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

- **Only `master` publishes** (D133). The old `master`, the 2023 prototype, is the branch `legacy`.
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
  > **Claude:** Overtaken: `once` is now the default, so `frog.md` no longer says it (D87), and the River lists the
  > frog too. Delete when settled.
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
