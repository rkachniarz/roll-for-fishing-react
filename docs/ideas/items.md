# Item ideas

A hundred items Claude drafted on 2026-11-15, then cut to twenty. None of this is a requirement. An item becomes one
when it's built or decided (`docs/decisions.md`). Numbers in brackets point to the full list below.

**Not here:** items decided or built (`content/items/`, `docs/decisions.md`).

## The twenty

1. **Lucky d20 bobber** (23): painted with one die face; a natural roll of that number counts as a 20.
2. **Fish-scale compass** (50): a trinket that points to the spot with the fullest pool today.
3. **Groundbait ball** (38): thrown onto the water, it raises Fish Find there for the next 10 casts.
4. **Polarised spectacles** (45): the shadows under the surface show bigger and named on hover.
5. **Trophy plaque** (87): mount your heaviest fish on the room's wall.
6. **Smoking rack** (90): smoked fish keep, and go into the stew later.
7. **Willow switch with a living bud** (1): a rod that gains +1 skill each season you keep it, to a cap.
8. **Dowser's fork** (3): the bobber drifts towards the spot's best surface feature.
9. **Bone rod of the Old Pike** (4): advantage on pike, disadvantage on everything else.
10. **Glow-worms** (29): night bait for night fish.
11. **Mayflies** (31): early-summer bait; trout and grayling go wild for them.
12. **Live frog** (33): a reward from the frog event, and bait for pike and muskie.
13. **Spider-silk line** (13): rare fish find it harder to see, but it snaps on Humongous runners.
14. **Lucky rabbit's foot** (52): one reroll of the fishing d20 a day.
15. **Hag stone** (53): look through it to tell rift fish before they bite.
16. **Stopped pocket watch** (54): once a day, five casts take no time.
17. **A drowned journal, page by page** (80): a set of lore pages.
18. **Ice auger rod** (11): winter-only, for fish that only come up through ice.
19. **Bucket of holding** (99): a bigger bucket that sometimes returns a fish you never caught.
20. **The Last Bobber** (100): a legendary bobber, the key to a legendary fish biting at all.

## All hundred

### Rods (1-12)
1. Willow switch with a living bud: grows +1 skill each season you keep it equipped, to a cap.
2. Fiddler's rod: a fiddle bow strung as a rod; fast strikes play a note, a run of three fast strikes gives a buff.
3. Dowser's fork: a forked hazel rod; the bobber drifts towards the spot's best feature after landing.
4. Bone rod of the Old Pike: from a legendary pike; +advantage on pike, disadvantage on everything else.
5. Two-piece travel rod: no penalty, no bonus, but travelling costs no time.
6. The Wizard's Unspooling Staff: the cast lands exactly where aimed, but the line goes out slower (longer wait).
7. Rusted harpoon on a rope: only catches big fish (Large+), never junk; can't catch small ones at all.
8. Child's stick rod with a bent nail: everything is easier and worth half XP; Tiny fish never get away.
9. Rod that hums before a bite: the bite delay is shown as a faint vibration on the button row.
10. Driftwood rod found after a storm: better in rain and wind, worse in still weather.
11. Ice auger rod: only in winter; fishes through ice for winter-only fish.
12. The Dwarf-forged rod's lesser cousin, "Ferrstad seconds": cheaper, with a random flaw rolled when found.

### Lines (13-20)
13. Spider-silk line: invisible to wary fish (+fish find for rare fish), snaps on Humongous fish.
14. Gut line from the stew's fish: made at the inn from 5 fish; ok all-rounder.
15. Braided line of three colours: shows the bobber's colour as the line's.
16. Singing wire line: fish on it make a sound; reaction window +100 ms.
17. Line of a mermaid's hair: rift fish come more often, and sometimes a strange event.
18. Kite line: casts twice as far (to the far water band only), wild casts more likely.
19. Fishing line with knots counted in: the journal shows how many casts this line has made; at 1000 it becomes "Veteran line".
20. A line soaked in moonwater: night fishing bonus, day penalty.

### Bobbers (21-27)
21. Cork carved like a duck: ducks come and float near it (scenery), and a duck event.
22. Glass float from a fishing net: glints at sunset; +treasure find at sunset only.
23. Painted lucky bobber with a number on it: the number is a d20 face; a natural roll equal to it counts as 20.
24. Bobber with a tiny bell: the splash is louder; the reaction grade for "ok" widens.
25. Feather of a heron: the scene's heron (new) stops stealing fish.
26. Bobber that glows in the dark: visible at night (the scene gets darker at night otherwise).
27. A floating rubber duck (junk you can equip): no effect, it just squeaks on the bite.

### Bait (28-38)
28. Fermented stew dregs: from the perpetual stew's pot; catfish and carp love it.
29. Glow-worms: night bait, draws night fish.
30. Cheese rind from the inn: chub and barbel.
31. Mayflies, only in early summer: trout and grayling go mad for them.
32. Dough with honey: roach and bream, and bees in the scene.
33. Live frog (from the frog event): pike and muskie.
34. A dwarf's lost sandwich: mysterious, any fish, once.
35. Breadcrumbs of a rift loaf: rift fish only.
36. Spinner lure that never runs out: lures as a new kind of bait that isn't used up but has lower bite chance.
37. Fly the player ties themselves from feathers found as stuff: crafting-lite.
38. Groundbait ball: thrown onto a spot, raises fish find there for the next 10 casts (a placeable bait).

### Hats and clothes (39-48)

The player starts bareheaded (D189): a hat on their portrait would come from one worn, if hats become visible
equipment, drawn with the face parts' hats (`src/scene/faces.js`).

39. Wide-brimmed straw hat with a fishhook in it: +1 skill in sun.
40. Oilskin sou'wester: no cold penalty from rain.
41. Wizard's pointy hat with a tiny aquarium in it: shows one fish from your tank swimming on the portrait.
42. Hat of a drowned fisherman: +luck, and the ghost event comes now and then.
43. Earmuffs of rabbit fur: warmth +1.
44. Fishing waders (a new boots slot?): reach the "near water" spots without cold.
45. Polarised spectacles: see the shadows under the surface more clearly (bigger, named on hover).
46. Bee-keeper's veil: no midge debuff at dusk in summer (adds a midge debuff to the world).
47. Rogue's hood: stealing class fish's loot back is easier.
48. A crown of water lilies: the Swamp's spirits are friendly (event outcomes shift).

### Trinkets (49-62)
49. Marimo in a jar: luck while carried (already planned as stuff).
50. Fish scale compass: always points to the spot with the most fish in its pool today.
51. Tide-table almanac page: shows tomorrow's weather in the HUD.
52. Lucky rabbit's foot: one reroll of the fish's roll per day.
53. A pebble with a hole (hag stone): look through it to see rift fish as rift fish before they bite.
54. Old pocket watch, stopped: time doesn't pass for 5 casts once a day.
55. Snail shell whistle: calls schools to the surface (features appear more).
56. Eel-skin purse: the barter window shows one extra offer.
57. Fishing licence from a distant town: the warden event lets you off.
58. Jar of fireflies: light at night, small night bonus, they escape after 50 casts.
59. A sturgeon's ganoid scute: endangered fish show in the tooltip without the perk.
60. Tiny anchor charm: the bobber doesn't drift with the wind.
61. A carved d20 of bone: the dice on screen are bone-coloured; once a day a 1 becomes a 2.
62. Lantern of the Lighthouse Keeper: the far water band counts as near for difficulty at night.

### Consumables (63-74)
63. Hot tea flask: warmth for 2 hours.
64. Pickled herring (from the inn): fish find +5 for an hour, and the cat follows you.
65. Smelling salts: clears the Queasy debuff.
66. Rift-wine: next cast is a rift fish, certainly; a debuff after.
67. Bottle of patience: the bite delay is shorter for 10 casts.
68. Shaman's rain charm: makes it rain for an hour.
69. Wizard's quick-scroll: Look Underwater once without the perk.
70. Pan of fried smelt: a quick snack buff, +1 skill for 5 casts.
71. Tin of sardines: bait or food, either.
72. Spare hooks: when a fish gets away by thrown hook, the bait isn't lost.
73. Map-ink: marks a found fish on the map for the location.
74. Witch's antidote to a class fish's curse.

### Stuff and junk with a use (75-86)
75. Message in a bottle (exists?): a quest starter with a map fragment.
76. Old boot that still fits (junk): equippable, -cold, silly.
77. Cracked fishing reel: three of them barter for a new reel slot item.
78. Shiny fish scales (exists): currency-like stuff for the Alchemist.
79. Rusted key: opens a locked chest found later in the swamp.
80. A drowned journal, page by page: lore pages, a set.
81. Pearl from a mussel: rare treasure; gifted to the innkeeper, a room upgrade.
82. Frog's crown (the frog event): reward for kindness.
83. Waterlogged playing cards: a set; complete it for a card game at the inn.
84. Lost dentures: junk, but the old man in town pays well for them.
85. Duck feather: tie flies with it (see 37).
86. Wooden fish decoy: a hand-carved carving the player can place in the aquarium.

### Room and town things (87-94)
87. Taxidermy plaque: mount your record fish on the room's wall (a trophy wall).
88. Rug made of an old net: the room gets cosier (+rest quality).
89. A cat bed: the cat visits the room (8.9's cat).
90. Smoking rack: turns fish into smoked fish, a stew ingredient that keeps.
91. A bigger tank (aquarium upgrade): room for 10.
92. Ice house key: keep fish fresh: bucket fish don't count against the bucket size? or a second bucket at home.
93. Weather vane for the inn's roof: shows the wind on the map.
94. Notice board pin: lets the player post "wanted" fish for the town to pay for (raid orders, 8.8).

### Strange and rift (95-100)
95. A shard of the rift: a trinket that hums near rift fish.
96. The coelacanth's fin: proof of an impossible fish; the Wizard tower takes it for a spell.
97. An upside-down umbrella: catches rain into a little private pond in the room, with its own fish.
98. A fishbone that writes: the journal writes itself (shows hidden numbers like Luck).
99. Bucket of holding: a bigger bucket that sometimes returns a fish you didn't catch.
100. The Last Bobber: a legendary bobber; with it, a legendary fish can finally bite.
