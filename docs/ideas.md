# Ideas: events, people, story

The owner's loose ideas for events, characters and the story, kept so they aren't lost. None of this is a requirement
yet: an idea becomes one when it's built or decided (`docs/decisions.md`). The engine work they would need is in
`DEV_PLAN.md` (7.7–7.10, 8.7–8.9); each idea below names its tasks.

Newest first.

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
the bucket, including "the rarest one" (7.8); a debuff as an event effect (in `docs/events.md`, "Not there yet");
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
