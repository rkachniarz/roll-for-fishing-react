# The night, the town and the stew: the owner's brainstorm (2026-11-14)

The owner's list from a creative session, numbered as the owner wrote it (two items were both "10", so the second is
10b here), with what the engine could already do for each, and what it needed. The requirements that came out of it
are R17–R21 in `docs/spec.md`; the decision is D123; the work is Phase 10 in `DEV_PLAN.md`.

Several items answer the town questions (`docs/town-questions.md`); the answers are noted there.

## The list, and what the engine needed

| # | The owner's idea | Could the engine do it? | What was missing |
|---|---|---|---|
| 1 | The game starts in the morning at the default spot; a welcome event asks for the character's background. | Yes: `trigger: arrive` (D89), choices, flags, items. A new game already starts mid-morning (D85). | Only the event. A background that changes stats would need a stat effect; the placeholder backgrounds give items, Luck and a flag. |
| 2 | At night an event points the player to town: go to town, straight to the inn, or ignore it. | Mostly: `trigger: needs` with `needs: time night` and `again: 1 days`; `go:` moves the player. | A town to go to. `go:` didn't count as arriving, so the inn's greeting wouldn't start: now the arrival happens when the event closes. |
| 3 | The innkeeper's first dialogue: "you've already given me all your money for a permanent room… give something to take something": a story hook and the stew's introduction. | Yes, as an `arrive` event at the inn. | The town and the inn. |
| 4 | The inn skips the night to the next morning. | No: only casts moved time. | `wait:` and `sleep:` effects: time jumps forward, the weather steps once per half hour, buffs counted in game time run down. |
| 5 | Time doesn't pass in the inn (or in town) unless something says so ("I'll wait here"). | Yes, by accident: only casts move time, and there is no casting in town. | The rule written down, and `wait: 2 hours` for the craftsman's wait. |
| 6 | The room holds decorations, perks and features: the aquarium. | No. | A room (a spot in town), the aquarium perk, fish moving into and out of it, a view of it with fish swimming. |
| 7 | Vendors keep hours: the Alchemist Friday to Sunday, asleep 5 AM to 1 PM, sometimes "off to get ingredients". | No: the clock had no weekday. | A weekday, vendor schedules as data, away days drawn per day from a stream, `needs: vendor alchemist open` in events. |
| 8 | Every vendor but the innkeeper wants things fished up: the Alchemist's potions want ingredients and a Shiny pebble; after enough brews you can ask about the pebbles, and never get a straight answer. | Partly: `needs: item`, `lose:`, counters for "enough brews". | Barter: a vendor's offers, costs in items and fish, a barter window, a count of trades for events to read. |
| 9 | White items are something the Rogue is good at finding. The treasure roll needs a slight rework: non-fish are poor to legendary, so white is the common non-fish. | No: a non-fish was treasure or junk. | A third tier between them: junk (gray), stuff (white), treasure. `stuffFind` as a game value; the Rogue starts with some. |
| 10 | White items are collectibles, pseudo-currencies, crafting ingredients and quest items, always findable, so you fish up things you don't know the use of yet. | Yes, it is D112's stuff. | Their own lists per spot, so they come up as the white tier. |
| 10b | The first white items: Shiny pebble, Alchemist's vial, the seven plants, Shiny fish scales, Mysterious resin. | Yes, as content. | The items, and where they are found. |
| 11 | The plants are real (the CSV); they're the Alchemist's ingredients; placeholder recipes using all of them, stronger the rarer. | Yes, as content, once barter exists. | Potions as consumables that give a buff when used: using an item from the bags was missing. |
| 12 | Cold: three levels of discomfort and debuffs; at first the inn is the only way through a night; preparing for winter is part of autumn. | No. | Cold worked out from the temperature, the time of day and warmth; three debuffs; `warmth` as a game value. |
| 13 | That makes night fishing more rewarding. | No. | Night's own effects on the cast (bigger fish, more XP). |
| 14 | The stew's buff resists cold for some hours, on top of other buffs; enough until winter's nights. | No. | Buffs that last game hours; the stew's warmth below winter night's cold. |
| 15 | Its length depends on the fish put in, by rarity: 12 epic fish give 24 hours. | No. | Minutes per fish by rarity: epic is 2 hours. |
| 16 | Its other buffs come from the fish themselves; the Wizard gets odd buffs from strange fish; new stats and knobs welcome. | No. | A stew effect on every fish, new game values for them to change. |
| 17–19 | Animate the sprites: fish swimming pleasantly, as fish do; in the aquarium, just under the surface, and when the Fighter dives. | No. | Swimming sprites made from the icons, a swimming motion, and the three places to show them. |
| 20–21 | The Fighter's dive: a few fish swim by, each clicked for its own roll, your die above the fish and its die below; no clicking it again while the dice show; a time limit in seconds. | No. | The dive: a view under the water, rolls per fish, a timer. |
| 22–23 | A fish-hook pointer over water you can fish, and over a fish under the water in the dive. | No. | The pointer. |
| 24 | The swamp is haunted: an event every time you go there, and you must leave unless you have the Old torn doll, found within about 200 casts at still water with no Treasure Find. | Mostly: `trigger: arrive` with `once: false`, `needs: item`, `go:`. | The doll, its odds, and a way to stop the haunting (a flag). |
| 25–28 | A fish's options on right-click or long-press: a menu with Release fish always, Hook as bait (Tiny fish), and Sushi enjoyer's Eat, a fish's stew buff for 5 casts. | Partly: a Tiny fish could go on the hook from the bucket. | A menu, releasing a fish at will, the perk, eating. |

## Calls Claude made overnight

The owner was asleep; every call is on `docs/REVIEW.md`, and the questions for the morning are at its top.
