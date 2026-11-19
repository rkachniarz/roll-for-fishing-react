# Ideas: events, people, story

The owner's loose ideas for events, characters and the story, kept so they aren't lost. None of this is a requirement
yet: an idea becomes one when it's built or decided (`docs/decisions.md`). The engine work they would need is in
`DEV_PLAN.md`; each idea below names its tasks. Most are built: of those, only 8.8 and 8.9 are still to do.

Item ideas, a hundred cut to twenty, are in [ideas/items.md](ideas/items.md).

Newest first.

## The town and the lands around it (2026-11-19)

The town stands at a crossroads older than anyone's memory. This is where the road into the elven valley began (see
the story, below). The inn has no cellar for that reason: it is built on the old road itself, which runs on, overgrown
and forgotten, until it vanishes into the river.

**The kingdom.** These days the human kingdom of Kolradia (a placeholder name), a city state, lies to the north. The
road from town runs straight north; the City itself lies to the north-east, on the shore of the Great Sea. The town
belongs to the kingdom's Territories, though most days you would be hard pressed to find any sign of it.

**The lake and the forest.** The lake lies east of the town. A dense and dangerous forest begins on its northern
shore; the Swamp is part of it.

**Ferrstad.** South of the lake stands Ferrstad, the dwarven city state, carved wholly inside a mountain the dwarves
call Eisernberg; to humans it is the tallest peak of the Iron Mountains. The Cassalan springs underground, and long
before it sees daylight it is the dwarves' water. They are miners and crafters: they trade refined ore, glass, tools
and instruments to the Kolradians for timber and food. Not long ago the two kingdoms were at war, a war that began
with a grudge over tariffs. Soon enough everyone saw that living side by side made more sense than endless squabbling.
Still, a dwarven grudge does not simply fade, and that is a conversation best left unstarted.

**The Breadbasket.** To the west lies the Breadbasket, where the kingdom's grain and livestock come from. Where it ends
and the Wildlands begin is no easy question, but there is a clear line of forts and outposts, and beyond it only the
bold and the desperate try to settle. Rumour has it that some of them find it easier to make peace with the nomads, and
some even join them, becoming the Wild Folk.

**The Wildlands.** Far to the west lie the Wildlands, so named by humans and dwarves, where the orc nomads roam. Long
judged not worth the trouble by the civilisations of the coast, they remain a mystery to the common citizen.

**Who passes through the town:**

- **Settlers.** Those living nearby come often; those from further west come with the seasons: to bring their harvest
  to the mills and markets, to buy supplies, to find help for their sick.
- **The villagers round about** come to put food by and to trade among themselves, so that every pantry stays full and
  varied.
- **The dwarven caravan,** twice a year, before winter and after it, on its way to the City.
- **Soldiers** on their way to and from the forts and outposts, penal units among them.
- **Tax collectors.**
- **Now and then, travellers from the Wildlands:** traders, adventurers and scholars; orcs, goblins and the Wild Folk.

**What goes into the stew.** The innkeeper always has onions and potatoes in good supply: the stew's foundation.
The rest comes with whoever is passing:

- **The dwarves** bring goat's milk and goat meat, mushrooms of every kind, and fish from the river; mead and distilled
  spirits too. They love human beer and wine.
- **The villagers** bring eggs, chicken and other fowl.
- **A few shepherds** bring lamb and mutton.
- **Fruit and vegetables** of every kind are traded, and go into the pot when they are in season.

**The well.** Every drop of water in town comes from the well, and the well is fed by the lake. So the lake's magic
works on anyone who lives here long enough.

**What it gives the game:** a cast of visitors for the town's events, some tied to the seasons (the harvest, the
settlers' trips, the caravan before and after winter), some passing once; a reason for the inn to stand on the old
elven road, and so a way into the story. The stew's pot can change with who is in town and with the season (see
"Other guests at the stew", below), and the well gives the lake's magic a way to touch the townsfolk, and perhaps the
player who stays long enough. It fits the names the fish already use: the Great Sea, the Wildlands, the Grasslands,
Cassalan, Ferrstad. Nothing the engine needs yet; the visitors would be events, as the junk collector is.

## Other guests at the stew (2026-11-18)

The stew never spoils: it is perpetual (D165). What a player leaves in the pot runs out another way: other guests at
the inn add their own catch and eat from it too, so a pot left for days isn't all the player's when they come back.

**Needs:** guests at the inn, and a pot that changes while the player is away (likely with each part of the day, as
the pools do in `stepTime`); not in the plan yet.

## The junk collector

A seemingly crazy person approaches the player and offers to take their junk. If the player accepts, they lose all
useless items and gain bait or treasure of appropriate value. This person appears periodically and seems to know a
lot about the lake and the area. They welcome the player with:

> "Only a fool would fish in these waters! But if you're already doing it..."

They are also the one person who knows the story (below).

**Needs:** giving up every item of a kind at once, adding up their hidden value and picking the reward from a table
(7.9); "useless" junk told apart from junk that has a use (an event, the Alchemist); a visitor who comes back from
time to time, not every few casts (7.10). The rest is today's events.

## The old cat

In town, an old, ragged cat approaches the player carefully. You can build a relationship with it by feeding it fish,
eventually earning its trust to the point it joins you at your fishing spot. You can also shoo it away, and if you
repeatedly make it your enemy it eventually starts bothering you in town: stealing your highest-rarity fish from the
bucket, or scratching you for a debuff to your fishing.

**Needs:** a count kept across events, not just a flag (trust up, trust down, 7.7); an event that takes a fish from
the bucket, including "the rarest one" (7.8); a debuff as an event effect (`buff:`, built);
the town (8.3); a companion at the fishing spot (8.9).

## Raid supplies

A wink at WoW: the town has quests where a raid needs 10, 25 or 40 of a specific fish ("Raid team looking for
supplies"). Completing one rewards consumables and gear. Progress carries over several hand-ins; a hand-in works like
bartering with the Alchemist.

**Needs:** progress kept across hand-ins and shown to the player (7.7, 8.8); handing in fish from the bucket (7.8);
the barter screen (8.3, 8.6).

## Strange people and their collections

Different strange people come to town, each looking for something. One turns up once you've fished up something they
need. One collects a chess set; another wants a lorebook, completed by fishing up its pages. So there are sets of
specific, unique items scattered across the spots.

**Needs:** item sets (a set id on each piece, progress per set, a reward for the whole set); unique pieces spread over
the spot tables (unique items exist already, R8.10); a visitor who appears when the player holds a piece; a page that
can be read (8.7).

## The story

Only the crazy junk collector seems to know it, but hints are scattered across the game (the lorebook's pages are an
obvious place).

Long ago, in the age before humans, a great valley lay where the lake is now. A land of plenty, it was home to an
entire self-sustaining elven civilisation, with a capital city and many towns. The elves were proud, arrogant people,
and makers of great treasures. That eventually attracted dragons, who terrorised the valley with their dragonfire.

The age of terror lasted a long time, and it made the elves very angry. Their mages and engineers worked tirelessly
on a solution, and found it. So the greatest achievement of the elven race was created: soon dragonfire had no effect
on anything in the valley. Any water in the valley neutralised it and gave immunity! The elves started to shoot down
the dragons, who, confused, left the valley for a long time.

There was no end to the pride of the elves. The greatest threat they had ever faced was defeated, the unbeatable enemy
humiliated. Little did they know, the dragons had a plan of their own. While the elves enjoyed a hundred years of peace,
the dragons were preparing. And then the day came. The horizon was once again dark with monstrous wings. Scouts
announced it with excitement: a dragon hunt! Little did they know, these were different dragons, wielding different
powers. With them came the greatest storm the world has ever seen. The earth trembled and mountains fell, sealing off
the valley on the side of the great sea. No fire came, but plenty of water. For these dragons breathed water, ice and
steam! So great were their numbers and so wounded their pride that when they were finished the valley was no more. A
great lake now took its place.

Ages later, the lake is thought to be bottomless, magical and dangerous.

**What it gives the game:** elven treasure and ruins under the water (the capital, the towns); dragon things, both
fire and water; water that once stopped dragonfire. Room for items, spots and events, nothing the engine needs yet.
