# The town: questions before the requirements

Everything the docs already say about the town (8.3, 8.6, 8.8, 8.9), turned into questions, as a starting point for
the town's requirements. Each cites where it comes from.

**How to answer:** write under a question, indented as a quote, as in REVIEW.md. Skip any you don't care about yet;
Claude will pick a placeholder for those and list it on REVIEW.md (D76, D105).

```markdown
1. Is the town a location on the map…
   > **Owner:** A location, one spot: the inn's porch.
```

## Answered by the brainstorm of 2026-11-14

The owner's brainstorm (`docs/brainstorm-2026-11-14.md`, D123) settled several of these, and Claude built the rest of
what it needed with placeholders (REVIEW.md):

- **1–2, 4:** a location of places (the inn, the room, the Alchemist's shop), a scene of buildings to tap; open from
  the start, and at night an event points the way (R17.1, R17.3).
- **5:** time doesn't pass in town unless a choice says so: sleeping, waiting (R17.2).
- **6–9:** Claude's call: fixed costs per offer, the counts shown, no hidden values to judge, no haggling (R18).
- **12, 15–18:** the inn gives the stew and the room; fish go in, a bowl comes out, longer for more and rarer fish,
  its buffs from the fish themselves (R19.4).
- **22–25:** the Alchemist keeps hours (Friday to Sunday, asleep 5 to 13, sometimes away), brews potions from plants
  fished up plus a Shiny pebble (R17.6).
- **34:** the aquarium in the room (R17.5), and Release in a fish's options (R21.1).

## The town itself

1. Is the town a location on the map like the Lake and the River, or a screen of its own? Does it have spots? R11.2
   says the player starts "at the Lake behind the inn", and one of the prototype's Lake spots was "back of the inn".
2. What does it look like within the phone layout (D79: scene on top, button row, log)? A scene with buildings to tap,
   a list of places, panes like the bucket and bags?
3. Does going to town cost anything (time, casts, the surface features on the water)? Travel is free today, and the
   features stay behind.
4. Is the town open from the start, or unlocked? A full bucket "sends the player to town" (D57).
5. Does game time pass in town, and does the weather move? Today only casts move them (R11.4).

## Barter (D86, R11.5)

6. How does a trade work on screen: put items up and see what you'd get, or pick what you want and pay with what you
   have?
7. Values stay hidden (D86). How does the player judge a trade: vague words ("a fair offer", "he scoffs"), or nothing?
8. Does each trader value things differently? D30 says the scrap dealer undervalues the Alchemist's ingredients.
9. Haggling or luck: a roll, a d20, Luck (R6.7)?
10. A universal perk lets you "see the barter value of everything" (§C.2). Still wanted?
11. The same perk mentions "the elusive vendor fish". What is it? Nothing else mentions it.

## The inn (R11.5, R10.4)

12. "Trades for fish; upgrades raise demand." What does the inn give for fish besides stew: items, bait, food?
13. How is the inn upgraded: events (R10.4), what has been traded, a quest? What changes with each level?
14. Is the inn where knowledge is bought, "a tip at the inn" (R4.5, 8.5)? What does a tip cost, and what does it
    reveal: a fish at a place, an item, a spot?

## The perpetual stew (R12.6, D28, D37)

15. Is putting a fish in the stew how you get the buff, or is the stew one of the inn's trades?
16. What does the stew buff do (Fish Find, Skill, everything)? How substantial is "substantial early on"?
17. "Rarer is stronger, judged against the location's table": the location where the fish was caught, or the one
    where you'll fish next?
18. Several fish at once: each adds time, but is the strength taken from the best fish or the average? Does a new
    bowl replace a running buff or add to it?
19. Does the stew fade into the mid game (D28 says it's for the early game), or does something take its place?

## The scrap dealer (R11.5)

20. Is the scrap dealer the junk collector of ideas.md ("Only a fool would fish in these waters!"), who comes to you at
    the lake? Or two people, one in a shop and one who wanders? The collector's event works already (`trade: junk`).
21. Junk only, or stuff and treasure too?

## The Alchemist (8.6, R11.7, D30)

22. How often do they visit, and for how long? Events can come back after a gap of casts or days (`again:`).
23. Which potions: which buffs, timed or counted in casts?
24. Which ingredients, from which places? D30: "from vials up to rare magical goo".
25. Are potions paid for with ingredients only, or with anything?

## Raid supply orders (8.8, ideas.md)

26. Where do orders come from (a notice board, a person)? How many at once, and how often does a new one come?
27. Which fish can be asked for: any size, or a minimum size or rarity?
28. Rewards: consumables and gear, says ideas.md. Fixed per order, or rolled?
29. "A hand-in works like bartering with the Alchemist": the same screen?

## The old cat (8.9, ideas.md)

30. Is the cat always in town, or does it turn up now and then? How many fish to win its trust, and does rarity
    matter?
31. What does the cat do once it joins you at the spot: a buff, finding things, just company?
32. As an enemy: how often does it steal or scratch, what is the debuff, and can it be won back?

## Strange people (8.7, ideas.md)

33. Do the collectors (the scholar, the chess-set person) live in town once it exists, or keep coming to the lake as
    they do now?

## The full bucket (D57, D59, D68)

34. Besides the stew and trading, what else empties the bucket in town: a place to let fish go, an aquarium (a
    universal perk, §C.2)? The bench's "empty bucket" button stands in until then.

## Later vendors (R11.5, R10.4)

35. "Later more vendors, unlocked by events." Any in mind already? Names alone help leave room for them.
