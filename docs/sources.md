# Sources and reasons

Where the game's real-world facts, references and Claude's own numbers came from, and how sure each one is (D182).
Read the section for an area before changing it: it says what was looked up, what was read off a picture, what is
from memory and what is a plain guess. The numbers themselves live in the code and `content/`; this file holds what
those can't: the why and the how sure.

**Not here:** the numbers themselves (the code and `content/`), decisions (`docs/decisions.md`), plans (`DEV_PLAN.md`).

Written when the work is done, never left only on `docs/REVIEW.md`, which asks the owner and is emptied as items
settle. A measurement goes in `docs/history.md`, a gap or a thing never checked in DEV_PLAN.md ("Known gaps").

## The world's place: Gdynia

### The wind rose (D176)

- **Source:** the University of Gdańsk's seasonal wind roses for a point just north of Gdynia and Hel (55.00N
  18.33E, 1951-2010), page 4 of https://klimat.ug.edu.pl/wp-content/uploads/2013/01/geostrof_1951-2010.pdf.
- **How read:** off the chart, by code: 12 sectors of 30°, each sector's length against the chart's own scale.
  Every season came to 100.7-101.1%, so the reading is close; rounded to 100 in `content/rules/wind.json`
  (`seasons`, from N round by 30°). West and WNW lead all year (14-17% each in summer, autumn and winter); spring is
  the flattest, with E to SSE about 9% each.
- **It is the wind above the ground (geostrophic), not the surface wind,** and no turn is applied. Over the sea the
  surface wind turns back (anticlockwise) from it by roughly 10°-20° (a textbook figure, not measured here); turning
  for a sea due east would turn it about 20° clockwise (Gdynia's shore faces about 65°-75°, Claude's estimate from
  coordinates, not a map check). The two about cancel, so the rose's directions are used as they are.
- **The centre cell, a wind with no set direction, 4% in every season,** is Claude's pick: the rose has no such
  category. Its look (a swing of at most half a cross wind, gusts of 40%) is Claude's too (`src/scene/wind.js`).
- **The rule that makes the shares come out:** the 2d6 picks a neighbouring cell even-handedly, and a move towards
  a direction that blows less often is kept only on a d100 at or under 100 × new share / old share. A change of
  season takes over at once. It changes about as often as the weather offers to (roll12 at or under 3 each half
  hour, then 2d6 with 7 staying, then the d100), so somewhat less often than the weather.

### The view, the sun and the moon (D166, D167, D169)

- **One view of 60° for every spot** (`VIEW` in `src/engine/sky.js`): about what a phone camera sees across; wide
  enough that the sun or the moon is in the picture for a good part of its day at a spot facing its way, narrow
  enough that it isn't always there. 90° was weighed and left: the sun and the moon would show more often, but
  their path across the picture would be squeezed.
- **4 px a degree up** (`SKY_SCALE`), about the same as across (256 px over 60° is 4.3), so the sky isn't
  stretched. The top of the picture is then 27° up: a winter-noon sun (12°) sits just over the still water's
  trees, a summer-noon one (58°) is far off the top.
- **What that means at the painted spots:** the still water faces north-east and sees the sun only on summer
  mornings, mostly behind the beech leaves (a sun behind its trees at 04:30 in summer throws no glitter); the reedy
  shore faces east and sees it rise in spring, summer and autumn.
- **The moon's phases:** eight names, each an eighth of the 14-day cycle (about a day and three quarters). The
  blood moon (D174) shows only in the one named full: about a day either side of the full moon.

### The moon and the fish (D168)

- **The moon words:** `full` at 90% of the disc lit or more (about three days of the 14), `new` at 10% or less;
  both count day and night, as the anglers' "fish the days around the full and new moon" has it.
- **The anglers' tables:** printed tables give a major period of two hours round the moon due south or due north,
  and a minor one of one hour round moonrise and moonset; the game takes an hour and half an hour either side, the
  same. About a sixth of the time is major and a twelfth minor.
- **Which fish, and why.** Guesses unless said:
  - _Dark nights or the new moon:_ **eel** (new, dark: the best-grounded one; eels move and feed less under
    moonlight, and the silver eels run on dark nights), **sea lamprey** (dark: it runs at night and shuns light),
    **burbot** (dark), **wels catfish** (dark), **channel catfish** (new), **zander** (dark: it hunts in low light
    with its reflecting eyes).
  - _The full moon:_ **bluegill** (its spawning beds follow the moon, the best-grounded of these), **black
    crappie**, **largemouth bass**, **common carp**, **northern pike** and **muskellunge** (the last four anglers'
    lore, musky anglers' especially), and **walleye** (full and moonlit: walleye anglers swear by full-moon nights;
    the opposite of its cousin the zander, on purpose).
  - _Moonlit nights:_ **brown trout** and **lake brown trout** (they feed at night when there's light to see by).
- **Light through the clouds** (`rules/moon.json`): mostly cloudy lets 0.25 through, lowered from 0.4 when mostly
  cloudy's cover went to 0.75, so the two agree (a test keeps them within 0.15).

## The sky's pictures

### Cloud references (D170, CR-2)

Wikimedia Commons, used for shapes only, never traced or shipped. A contact sheet per type is in
`docs/design/commons/` (local only, git ignores it): `cloud-fewcumulus.jpg`, `cloud-scattered.jpg`,
`cloud-broken.jpg`, `cloud-towering.jpg`, `cloud-stratocumulus.jpg`, `cloud-cirrus.jpg`, `cloud-stratus.jpg`,
`cloud-nimbostratus.jpg`, `cloud-storm.jpg`; the ten fetched at size are in `docs/design/commons/clouds/` with
`credits.csv`.

- **Heaps:** _Cumulus Humilis Clouds - Tennessee, USA - July 7, 2014.jpg_, _Cumulus-humilis.jpg_.
- **Towers:** _Cumulus congestus cloud Finland.jpg_, _2016 Chmura Cumulus congestus 02.jpg_.
- **Layers:** _2020-10-01 17 27 08 Stratocumulus clouds above a field in the Dulles section of Sterling, Loudoun
  County, Virginia.jpg_.
- **Wisps:** _Cirrus at evening 7th Brigade Park Chermside P1080258.jpg_.
- **Sheets:** _2018-05-18 18 27 21 Low stratiform clouds (base near 3,000 feet AGL) with wavy, bumpy base…_.
- **Rain cloud:** _Nimbostratus Forest.jpg_. **Storm:** _Dark clouds above the hilly valley (Unsplash).jpg_.
- **Broken:** _Fishing boy in Laos 2.jpg_.

### The owner's sky photos

- **The rainy overcast** (`sheet-a`, `sheet-b`): drawn from noise to match it: cells about twice as wide as tall,
  up to twice as squashed at the horizon, pale soft streaks through broad blotches, darker low down. Its greys step
  half as far as the other sheets' (the owner wanted subtler differences): the `ceiling` ramp.
- **The dry spring and summer overcast** (`deck-a` from the grey photo, `deck-b` from the white one): every number
  in their `deck(...)` calls is Claude's tuning by eye against the two photos.
- **Mostly cloudy** (`mass-a`, `-b`, `-c`): the big broken mass; `mass-b` the tall grey bank in the photo's lower
  right; `mass-c` the wind-torn streaks in its lower left. Mostly cloudy should hide about 55-75% of the sky, read
  off the photo.
- **Heaped cloud over distant trees**, read at the game's 4 px a degree: a towering heap near 100×85 px, small heaps
  near 30×17. With the still water's old summer clouds (about 120×35 px) against the first library's 23×9 for a mid
  heap, that says the sky was drawn 3 to 5 times too small; `SKY_SIZE` is 3, the low end, so it errs small.
- **The special sky** (D173): isopropyl alcohol drying on a guitar's black finish. Long smears brushed on a slant
  with a grey sheen of hairline streaks; colour only where the film pools, ring on ring. The speckled patch (the
  photo's lower middle) is in `special-b` only, so `special-a`'s broad pools stay calm; the black guitar is the night
  sky. The colours (`FILM`) are the thin-film interference orders: three greys, then first order (straw, orange,
  red, magenta), second (violet, blue, sky blue, green, yellow, orange, rose), a paler third (purple, teal, green,
  pink).

### The blood moon and the green sun (D174, D175)

- **The blood moon's colours:** five reds from a very dark #4e0207 in the middle to a coppery #c4401f at the rim,
  the dark middle a little low and to the left, as the earth's shadow lies in a real eclipse. Its tint (#8a0a12 at
  30%) comes in as the sun goes from 2° to 10° under the horizon and fades as the moon sets (4° up to 2° under);
  by day, with the moon up before sunset, there's no tint. The fish feel a full moon's light, though a real
  eclipsed moon is much dimmer.
- **The green sun:** "strong sun" read as summer with clouds and rain at 0, at any height (the disc is off the top
  of the picture from about 27° up, so a high-sun rule would hide it). Five greens from #0a3a12 to #6abd3a, the
  dark middle a little off-centre like the blood moon's; the tint (#1f8a2a at 28%) comes in as the sun rises from
  2° under the horizon to 4° over.

## Icons and painted spots

### Fish and item icons (D97, D98, D104)

- **The pictures:** the best of up to 12 Commons candidates per fish (mostly old atlas plates and studio shots),
  plus 69 Wikipedia photos of which 28 showed the whole fish side on. Licence, author and source of each are in
  `docs/design/fish_refs_commons/credits.csv` and, for the rift fish, `docs/design/refs_rift/credits.csv`, both
  local only. The icons aren't credited in the repo yet (DEV_PLAN.md, "Known gaps").
- **How a picture became an icon:** cut out with rembg, a draft by the photo-to-icon tool, one hand pass. Fish
  facing right were mirrored (head up and left, D98).
- **The hand pass was a script, not by eye:** an eye on every fish, about a tenth of the length in from the snout;
  speckles added to the black crappie and the Cassalan pike, whose drafts lost them. The colour comments ("upper
  flank", "fin colour") come from how dark and strong each colour is, not from looking.
- **Guessed rather than read off the photo:** every eye; the perch's bars and red-orange fins; the zander's
  saddles; the roach's red iris.
- **Shared and turned by hand:** brown trout and lake brown trout share an icon, as do the Great Sea salmon and its
  landlocked kin (one photo each). The barbel is turned less (its photo is already slanted); the wels dives steeply
  in its photo, so it was mirrored and turned 58°, which leaves it thin.
- **Weakest icons:** the Ferrstad carp's eye is lost in its bright head, the brown bullhead's is faint; the black
  crappie, smallmouth bass and walleye lost most of their pattern; the yellow perch is murky; the carp's scales come
  out as spots. The local checklist is `docs/design/fish-image-hunt.md`.
- **No icon of their own:** the mainland eel, golomyanka, Grasslands silverside and Wildlands pejerrey; their
  swimming colours are Claude's (D131).
- **Odd rift icons:** the coelacanth is green from an aquarium's light; the strange shark comes from a line drawing,
  so it is mostly white; the giant freshwater stingray is seen from above; the goonch is small, its long fins taking
  the room.
- **The eight plants** are drawn as code from Commons pictures (`docs/design/refs/`, local only), not by the tool,
  whose drafts blurred thin plants into blobs. Each is drawn from what the plant is known by (the waterweed's
  whorls of three, the hornwort's forked needles, the lobelia's nodding lilac flowers…). The waterwheel plant's
  photo has tan water, so it is drawn green as in clear water; the lace plant is an old engraving, coloured as live
  leaves are.

### Fish drawn to swim (D131)

- **Shapes are Claude's, from what each fish is known by,** not from its photo: 19 presets for kinds of body, each
  fish with its own depth, fins, tail and pattern. Lengths run 18 to 62 px, the giants (wels, arapaima, sturgeon) at
  the top; the carp is 47.
- **Colours are read off the icon,** so a fish whose icon is dark or pale swims so (the crucian carp dark, the
  brown bullhead pale, the wolffish white).
- **The stingray** (`rayGrid` in `src/scene/fish-art.js`) is from the owner's two photos of other rays, for shape
  only. Guessed: the span (1.1 of the disc's length), the wings' ripple, the camera angles; the whip tail is 0.8 of
  the disc.

### The painted spots (D115-D118, D158, D159)

Which photo gave what is in the comments at the head of `src/scene/pond.js`, `reedy.js`, `swamp-pixels.js`,
`swamp-under.js` and `swamp-roots.js`. What they leave out:

- **The reedy shore's spring has no photo:** it was worked out from summer and the owner's word ("vivid green, last
  year's brown stalks"). Autumn was worked out from the summer photo alone; in a blind test it read more like autumn
  than the painting from the autumn photo, which is why one-photo seasons are allowed (D116).
- **The swamp's hummocks** (`hummocks`, winter only, white with snow like photo 10's humps) are Claude's invention
  to explain them; they lie under the weed the rest of the year. **The mist** along the far bank is in no photo;
  the murky olive mid-water (not photo 8's black) is so the dark fish under the surface still show.
- **Guesses in the swamp:** the autumn leaves' depth, the snow pillows and the blue of their shadows (`snowBlue`),
  the tall-legged tree's legs (5 px at the trunk to 2 at the water) and its knees, and every colour (by eye from
  photos 7 and 8, darkened; the far trees mixed towards the fog in three steps).
- **Under the swamp's water (D159):** the branch is Claude's after photo 12; the far tree joins photo 3's foot to
  photo 5's trunk (`docs/design/swamp/bake-far-tree.py`; the joint, the bark tones and its place are Claude's); the
  mound follows the owner's lines with Claude's points (`MOUND`); the colours, duckweed, shafts and silt are Claude's
  reading of "more green and murky".
- **Where a bobber can land** (`water` in `content/locations/lake.json`): the still water's box (x 40-216, rows
  128-185) is by eye, from just under the reed bed to where the old shore stopped a cast, the logs in front inside
  it so a bobber can land on one; the reedy shore's (118-180) goes down to just above the lowest reed tips; the
  swamp's (128-204) is a little bigger, and nothing drawn over the bobber reaches into it. `farLine` (the pond's
  145, about a quarter down its water; the reedy shore's 136, the swamp's 150) is by eye the same way.
- **The reedy shore's outline** (`SKETCH_TOP`) is read off the owner's sketch column by column, with their red line
  over the painting from x 24 to 123 and 180 to 268; blade tips poke up to 7 px over it so the edge is ragged.

## The map (D161)

- **The marks' places:** at the numbers on the owner's drawing (open and deep water at their O and D). The Mage
  Tower is their (180, 40) on the 256-pixel reference they sent, which is (221, 56) on the 320-pixel map, just under
  the name. The upper river (195, 291) is as low in the channel as a circle fits on the paper; the lower river (189,
  247) is in the channel between the mouth and the old spot 6. The town is moved a little in from the paper's edge.
- **The paper's size:** 320 pixels at whole device pixels, so on a 1280×800 screen it is 640 pixels and the
  margin is bigger than "small".

## The fish

### The species behind the made-up names (D104, D136)

- **Rift fish read as real species:** snailfish is the sea snail _Liparis liparis_; icefish the blackfin icefish
  _Chaenocephalus aceratus_; hillstream loach _Sewellia lineolata_ (its weight uses _Beaufortia kweichowensis_, a
  stand-in); snow trout _Schizothorax richardsonii_; pacu the red-bellied pacu _Piaractus brachypomus_; strange cod
  the Murray cod; strange shark the Greenland shark.
- **Read for where they swim (D136):** wildlands perch is the Patagonian creole perch (_Percichthys trucha_); strange
  perch the Nile perch; strange tilapia the Nile tilapia; strange giant catfish the Mekong giant catfish.
- **The weights don't follow these readings:** each `lengthWeight.from` borrows a kin with data (strange perch
  _Perca fluviatilis_, strange giant catfish _Silurus glanis_, strange cod _Gadus morhua_, strange shark
  _Carcharhinus leucas_), so a fish's kin for behaviour and for weight can differ, on purpose.

### Sizes, difficulty and rarity (D101, D104)

- **Sizes in cm are Claude's figures** for what an angler meets, not record sizes (roach 10-40, northern pike
  40-130, wels catfish 80-270, lake sturgeon 80-220); the rift fish's are for adults, some huge (strange shark
  200-640, arapaima and giant freshwater stingray to 300).
- **Difficulty follows the largest size:** up to 20 cm −2, to 45 −1, to 80 0, to 130 1, to 200 2, above 3. All 122
  fish follow it; nothing in the code enforces it, so a new fish is set by hand. The rift fish are mostly 3.
- **Base rarity follows how far down its best spot's list a fish is:** the top 30% common, to 60% uncommon, to 85%
  rare, the rest epic. The owner's order decides it, so the mainland mudminnow (last in the swamp) is epic and the
  burbot (second in deep water) common. Rift fish are one tier rarer than their rank gives, never below uncommon.
- **The rank curve:** each rank is three quarters as likely as the one above (rank 1 100, rank 5 32, rank 10 8,
  rank 14 2), so a spot's first fish is about 50 times as common as its 14th.
- **Preferences multiply by 2** (`factor` in `rules/fish-preferences.json`) so a fish in its own conditions can
  outweigh a common one: with all four met it is 16 times likelier, and the muskellunge (last at the reedy shore)
  outweighs a bluegill (rank 6) at an overcast autumn sunset with a lure on. Nothing makes a fish less likely out
  of its conditions.

### Where fish swim (D136)

- **Looked up by two research agents** from where the real species spends its time: 12 surface, 30 upper, 39 lower,
  41 bottom.
- **Least sure:** golomyanka (lower; deep open water); icefish (bottom, taken as an Antarctic icefish from its
  size); blackfish (lower, as the Alaska blackfish); black crappie (upper); frostfin char and lake whitefish (lower,
  could be bottom); lenok (upper); muskellunge (upper); red-bellied piranha and peacock bass (lower); walleye and
  zander (lower, could be bottom); polar cod (upper).
- **Surface fish that aren't quite fish of the water:** the mudskipper and the arapaima (an air-breather); the pacu,
  which takes fruit falling on the water.

### Weight from length (D146)

- **FishBase's numbers, from each species' summary page** (the raw pages kept locally). Many are FishBase's own
  estimates from relatives, not measurements of the species; each fish's `lengthWeight.from` says whose.
- **Heavy for the real fish:** the marbled lungfish comes out at 52 kg at 2 m (the real one is nearer 17 kg),
  FishBase's estimate for its body shape. The electric eel did too (118 kg at 2.5 m), so it borrows the European
  eel's numbers and comes out near 20 kg.
- **The goonch** is listed on FishBase as _Bagarius bagarius_, whose page opens as _B. yarrelli_; the numbers are
  that page's. **The giant freshwater stingray** is weighed by total length, tail included: 389 kg at 3 m.
- **The Blackfish is read as the Alaska blackfish** (_Dallia pectoralis_), since it sits among the swamp's other
  air-breathers in the rift.
- **The strange fish weigh as their kin would,** so the 6.4 m Strange shark weighs nearly two tonnes.
- **The spread of ±10%** is a guess.

### How each fish swims (D147)

- **Claude's numbers, from what the fish do, not looked up:** there's no published "swimming speed in pixels".
  Each fish starts from one of seven ways of swimming, then gets its own: the pike rests 75% of the time and lunges
  at 7× its cruise; bleak cruise at 22 px/s and dart; eels and lampreys wind 3 px; trout and grayling hold still
  half the time, as if against the current.

### Fight styles (D141)

- **Each fish's style is Claude's, from what it knows of the real fish, not looked up.** The least obvious: roach,
  chub, ide and the small silver fish as jumpers (they flip at the surface but hardly fight); bluegill and
  pumpkinseed as head-shakers (they circle more than shake); lake trout, char and the whitefish as long runners;
  mangrove jack as a bottom-hugger (it dives for the snags, which is its fame).
- **The famous fighters** (`fighter: true`): the fish anglers know for it, from memory.
- **Guesses:** each style's tilt, the 1.5 s to answer a manoeuvre, its delay of 0.5-1.2 s. "Harder on a light
  line" became "−2 with no line equipped", since lines have no strength yet.

### Spawning (D149)

- **About 2 °C a step of the weather's scale** is Claude's reading of its words (cold 1-3, moderate 4-6, just right
  7-9, warm 10-12, hot 13-14). The water's floor is level 1, so a fish that spawns colder still (burbot, polar cod,
  icefish) spawns at the coldest water there is.
- **Where sources disagreed, one was picked;** each fish's `spawn.from` keeps the °C used: capelin 10-12.5 (out of
  2.8-13.7 by stock), channel catfish 18-27, pumpkinseed 16-18, rainbow trout 4-10, perch FishBase's own narrow
  7-8 (its records run 6-16), Arctic char an autumn record of 5-6.
- **A single threshold got 4 °C added** for the top of the window (roach, rudd, chub, wels, gudgeon, ide,
  weatherfish and others): their `from` shows the widened range.
- **The eel's** 20-24 °C is the Sargasso Sea's, put on the scale at 10-12. Not measured whether the game's water
  reaches it often.
- **Known only by their season** (`from: "season: ..."`, 25 fish, mostly tropical and rift): spring is warming
  water at 3-7, summer warming at 8-12, autumn cooling at 4-8, winter cooling at 1-3, the rains warming at 10-14.
- **No spawning at all** (12): the coelacanth and the stingray (live-bearers), the goliath tigerfish, the yellow lab
  cichlid, frontosa, the four-eyed fish, the mudskipper, the hillstream loach, peacock bass, mangrove jack, silver
  arowana, tiger shovelnose: all year round, by the rains, or no record.
- **Burbot, icefish and polar cod spawn up to 2,** wider than their sources (0.6 to 1.7 °C and colder), because the
  game's winter water averages 3 (D153).
- **Tripled in the tables while spawning** is a guess.

### Plants (D150)

- **From FishBase's own sentences:** every species' page searched for vegetation, weed, macrophytes, water plants,
  then cut by hand to the clear cases.
- **Left out:** the ruffe's `lives` (its page says it prefers water _without_ vegetation; it still spawns on weed),
  the bleak's and chub's spawning ("occasionally", "rarely"), the chub's `lives`, the brown trout, grayling,
  barramundi and archerfish (they keep under _overhanging_ bank plants), the lumpfish (sea-weed), the snow trout (it
  eats plants). **Added:** the stone loach, which "breeds among aquatic vegetation".
- **Which plants doesn't matter,** only whether a spot has any: real fish keep to weed beds, not to one species of
  plant. A marimo counts.
- **Twice as likely** is a guess. Most of the lake's spots have plants, so it mostly shifts the balance between
  weed fish and others there.

### Shoaling (D151, D154)

- **From FishBase:** bream, bleak, silver bream, barbel, nase, dace, minnow, gudgeon, vendace, whitefish, smelt,
  both graylings, yellow perch, black crappie, piranha, discus, frontosa, capelin, four-eyed fish, archerfish,
  peacock bass, silver carp, mangrove jack, pejerrey. **Roach and perch** from the owner's examples, though
  FishBase's pages don't say it in so many words.
- **From common knowledge, not a source** (FishBase says nothing either way): rudd, ruffe, crucian carp, common
  carp, Ferrstad carp, white sucker.
- **Alone:** ide, chub and asp, whose young shoal but adults don't; and, taken as keeping alone, central
  mudminnow, deepwater sculpin, mainland bullhead, stone loach, rock bass.
- **The scatter** (1.5 s, only the middle of a bolting fish counting as a tap) is a guess.

### Who eats whom (D152, D155)

- **Predators from FishBase's diet sentences** ("feed mainly on fishes", "piscivore", "voracious predator"), 44 of
  them, and **eight known fish-eaters whose pages are silent:** muskie and chain pickerel (pike's genus), brown
  trout, Wildlands perch, payara, goliath tigerfish, arapaima, goonch.
- **Left out,** eating a little fish among much else: bluegill, lenok, rainbow trout, capelin. **In,** since
  FishBase says the bigger ones eat mainly fish: perch, yellow perch, ide, chub.
- **The tank's numbers** (`rules/tank.json`: under half its length, 15% a day, up to 7 days, 3 days for a feeding,
  twice the size to hide) are guesses.
- **Big fish kept though the predator rule wouldn't make them today:** channel catfish, landlocked salmon, eel, sea
  lamprey, pejerrey (no predator mark); black crappie and silverside (they shoal). Left out as too small: Cassalan
  sleeper, Wildlands perch.

### Endangered fish (D140)

The status belongs to the species and many fish live at several spots, so the picks had to overlap exactly for every
spot to have two.

- **Confirmed** (web searches, secondary sources citing the Red List; the Red List's own pages didn't come up):
  European eel, critically endangered; lake sturgeon, endangered since 2022; huchen, endangered; Siberian taimen,
  vulnerable (an older source says critically endangered); European mudminnow, vulnerable. Common carp: sources
  disagree (vulnerable in one, least concern in another).
- **Not confirmed, from memory:** Mainland whitefish and Omul (searches found nothing); Golden dorado (threatened in
  parts of its range); the coelacanth (critically endangered).
- **Not threatened in our world, there only to fill a spot's second place:** Muskellunge, Grass carp, Frostfin
  (Arctic) char, Wildlands perch.
- **Really threatened but left out to keep two per spot:** the Sterlet and the Frostfin (Siberian) sturgeon; either
  would give the river mouth three or four.
- **The Mage Tower's first pool has only one** (Golden dorado): any second pick there would give another spot three.
- **Rift fish:** coelacanth, giant freshwater stingray (endangered in the sources found), golden mahseer
  (endangered in one source).

### Taste (D138)

- **The grades are Claude's reading of each fish's reputation at the table,** not a measured thing. Pike is plain
  (good meat, counted down for its bones); carp is plain for the mud.
- **The taste lines for real species are written from memory, not checked against a source.** The ones most worth
  a second look: barbel roe being poisonous, raw eel blood being poisonous, grayling smelling of thyme, smelt
  smelling of cucumber, the coelacanth making people ill, the icefish's colourless blood, a king dying of lampreys,
  chub as "cotton wool stuffed with needles".
- **High parasite risk:** the pikes and perches (pike, Cassalan pike, pickerel, muskellunge, perch, yellow perch,
  walleye, sauger, ruffe), burbot, roach, ide and dace, the snakehead, the weatherfish and the eel (for its blood),
  loosely after the real hosts of fish tapeworm and liver fluke. Every other freshwater fish is low; zander as low
  is a guess.

## People's names (D187)

The owner's lists in `docs/names/` (local only): for each of the dwarves, humans and orcs, 30 male and 30 female
first names and 100–135 surnames. The dwarves' names lean Scandinavian, the humans' Slavic, the orcs' Turkic and
Mongolic. The owner chose them with real people in mind: the surnames are very rare ones, with letters shuffled so
none matches a real one. The orcs are rare guests in town, from the far Wildlands (`docs/ideas.md`).

## Smaller numbers and their reasons

- **The dice's timing** (`ROLL_MS` 700, `HOLD_MS` 550, `FADE_MS` 200 in `src/scene/dice.js`, D99): first guesses,
  so the catch flies about 1.45 s after the strike; never tuned in play. **The fish's die** is four steps round
  `#31899F` with pale numbers, because dark ink didn't read on teal.
- **Slot icons stay 32 px at 1080p** while the text grows by 1.25 (`fit` in `src/main.js`, D119, D121): 40 px would
  smear and 64 would make the bucket very tall; with more device pixels they grow to the nearest sharp size.
- **The time words** follow the scene's light: Dawn (5-7) and Sunset (18-20) are centred on its warm glow at 06:00
  and 19:00; Night 22-5, Morning 7-11, Noon 11-13, Afternoon 13-18, Evening 20-22.
- **The Heavyweight heavy weights are a trinket** (D137), not a slot of their own: weights go on the line, and the
  line slot holds the line.
- **A released fish rejoins the pool with `tries: 0`** (`letGo` in `src/engine/barter.js`): the catch record's
  "most tries" (R3.6) counts escapes, not releases.
- **A Tiny fish forgets its kind on the hook** ("You put Tiny Roach on the hook", later "has eaten Small fish") and,
  taken off, goes to the bags, not the bucket. Its +10 Fish Find is the placeholder bait value; its real pull is
  the predators that like small-fish bait (D101).
