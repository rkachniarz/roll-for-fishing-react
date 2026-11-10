# Writing events

An event is a pop-up with slides and choices (R10). Each one is a text file in `content/events/`, named after its id:
`content/events/frog.md`. Run `npm run content` after editing; it reports mistakes with their line number. The format
is D45 and D84; the code that reads it is `tools/event-text.mjs`.

## A whole event

```
---
id: frog
title: A froggy encounter
---

## start
You see a frog in the shallow water, just outside your reach.

- Observe it closely -> observe
- Ignore it -> end
- Attempt to catch the frog -> lunge
  needs: class rogue-fisher

## observe
After a moment, a wave of calm washes over you. Everything is going to be alright.

- Thank you, frog -> end
  gain: 2 luck

## lunge
You lunge forward and get wet, and it's like it was never there.

- Well, shit. -> end
  lose: 1 luck
```

## The parts

**Front matter**, between the `---` lines:

| Key | | |
|---|---|---|
| `id` | required | lowercase-with-dashes, the same as the file name. Permanent once released (D44). |
| `title` | required | Shown at the top of the dialog. |
| `once` | `true` / `false` | Default `true`: it happens only once per game. `false` lets it happen again. |
| `again` | `50 casts` / `3 days` | A visitor who comes back: it can happen again, but not until that many casts or game days have passed since it last started. Leave `once` out. |
| `trigger` | `meter` / `item` / `needs` / `arrive` | What starts it; one per event, see below. Default `meter`. |
| `needs` | any number of lines | Requirements for it to start at all, in the words below. |
| `art` | a file name | A picture for the top of the dialog, from `assets/events/<art>.png`. Optional. |

**Slides** start with `## slide-id`. The first slide is where the event begins. The text under the heading is what
the player reads; a blank line starts a new paragraph. `end` is reserved.

**Choices** are bullets after a slide's text: `- What the player says -> next-slide`, or `-> end` to close the
event. The lines indented under a choice are its requirements and effects, one per line, in the order they apply.

A choice whose requirements aren't met is **hidden**, so give every slide at least one choice without requirements,
or a player could be stuck (`npm run content` warns about that).

## Requirements: `needs:`

| Words | Met when |
|---|---|
| `needs: class rogue-fisher` | the player is of that class (`content/classes/`) |
| `needs: gender f` / `needs: gender m` | the player is female or male |
| `needs: location lake` | the player is at that location (`content/locations/`) |
| `needs: spot crossroads` | the player is at that spot of a location |
| `needs: level 3` | the player is at least level 3 |
| `needs: luck 2` | Luck is at least 2 (R6.7) |
| `needs: item iron-key` / `needs: item bent-fork 3` | that many of the item are in the bags (default 1) |
| `needs: flag met-the-frog` | the flag is set |
| `needs: no-flag met-the-frog` | the flag is not set |
| `needs: season winter` | it is that season (`content/weather/`) |
| `needs: time dawn` | night, dawn, morning, noon, afternoon, sunset or evening (the words on the HUD) |
| `needs: caught northern-pike 10` | at least 10 northern pike caught, ever (the accomplishments book) |
| `needs: fish` / `needs: fish 3` / `needs: fish roach 3` | that many fish in the bucket (default 1), of that species if named |
| `needs: set old-lorebook 2` / `needs: set old-lorebook all` | that many different pieces of the set are in the bags, or every one |
| `needs: count cat-trust 5+` | a counter (see `add:`) is at that amount: `5` exactly, `5+`, `5-`, `3..8`, as the weather |
| `needs: wind 3+` | the weather now: `temperature`, `wind`, `clouds` or `precipitation`, with an amount |

**Weather amounts:** `3` exactly, `3+` at least, `3-` at most, `2..4` between (both included). Wind, clouds and
precipitation go from 0 to 5, as the bench shows them; precipitation is rain or snow, by the temperature. Temperature
is a number, and can go below 0. The words: wind None, Light, Moderate, Considerable, Strong, Extreme; clouds Clear, A
few, Scattered, Mostly cloudy, Overcast, Black; precipitation None, Moist air, Light, Constant, Intense, Extreme;
temperature up to 0 Extremely cold, 1–3 Cold, 4–6 Moderate, 7–9 Just right, 10–12 Warm, 13–14 Hot, then Extremely
hot (`content/rules/weather-scales.json`).

## The words in the text: placeholders

Slide text, choices and the title can use these; they're filled in when the slide opens.

| Write | Becomes |
|---|---|
| `{name}` | the player's name |
| `{class}` | the player's class, as it reads for their gender: Rogue Fisherwoman |
| `{level}` | the player's level |
| `{location}` / `{Location}` | where the player is: the Lake / The Lake |
| `{season}` / `{Season}` | the season: spring / Spring |
| `{time}` / `{Time}` | the time of day, as on the HUD: dawn / Dawn |
| `{weather}` / `{Weather}` | the weather's name: clear and nippy / Clear and nippy |

The capitalised ones are for the start of a sentence. `npm run content` reports any other `{word}`, so a typo can't
slip through. More can be added (code work, D42); say which.

## Text that depends on something: `[ ]`

Square brackets hold text that shows only when its requirements are met, in the same words as `needs:`:

```
You stand on the sandy shore. [precipitation 3+: Your clothes are getting wet, but you don't care.]
```

- After a `|`, what shows otherwise: `[time night: The moon is out. | The sun is high.]`
- Several requirements, separated by commas, must all be met: `[time night, wind 3+: The wind howls in the dark.]`
- Mid-sentence works: `The water is [temperature 0-: frozen solid | cold and dark].`
- Gendered words: `Good day, [gender f: madam | sir].`
- They work in choices too: `- [gender f: Curtsy | Bow] -> greet`
- Brackets can't go inside each other. For a bracket or a `|` as a character, write `\[`, `\]` or `\|`.

They are checked when the slide opens. If a condition shows nothing, the spaces around it are tidied, so
`Hello. [wind 9+: It howls.] Bye.` reads "Hello. Bye." in calm weather.

## Effects

| Words | Does |
|---|---|
| `gain: 2 luck` / `lose: 1 luck` | changes Luck, which the player never sees |
| `gain: 50 xp` | XP, with a level-up if it is enough; the log says so |
| `gain: iron-key` / `gain: 3 bread-crumbs` | puts items in the bags; the log says so |
| `lose: bent-fork` / `lose: 2 bent-fork` | takes items out of the bags (equipped ones are safe); the log says so |
| `set: met-the-frog` / `clear: met-the-frog` | sets or clears a flag, for later events and quests |
| `add: cat-trust 1` / `add: cat-trust -2` | a counter goes up or down; it starts at 0, and `clear:` sets it back |
| `lose: fish` / `lose: 3 fish` | takes fish from the bucket, the least valuable first (lowest rarity, then smallest); the log says so |
| `lose: 10 fish roach` | that many of a species, the smallest first |
| `lose: set old-lorebook` | every piece of the set in the bags, handed in; the log says so |
| `lose: rarest fish` | the rarest fish in the bucket, the biggest if there's a tie (the cat's theft) |
| `go: river` / `go: river upper-river` | moves the player there, to the first spot if none is named; the log says so |
| `lock:` / `unlock:` | the player can't leave the location they're at (other spots there are fine) until an event says `unlock:`. The event should say why (R10.8) |
| `learn: spot river lower-river` / `learn: fish lake wels-catfish` / `learn: item lake iron-key` | the player learns it's there: a spot shows on the map (the log says so), a fish or item in the journal as not yet found |
| `open: mage-tower` / `close: mage-tower` | a hidden location shows on the map, or a quest's location is gone from it (a player there goes back to where a new game starts); the log says so |
| `trade: junk junk-collector` | every useless junk item in the bags goes, and their values, added up, pick the reward from the table (below) |

Flags and counters are free-form names; use them to link events into quests (R10.7). Taking fish or items takes as
many as there are, up to the amount, so give the choice a `needs:` if it should only show when there are enough.

**Showing a counter:** write `{#cat-trust}` in the text, and it becomes the number: `The raid has {#raid-perch} of 25
perch.`

**Trading junk:** junk counts as useless unless it starts an event, can be equipped, does something, or has
`"useful": true` in its file (for the Alchemist's ingredients, quest pieces). The reward table is a
`content/tables/` file of kind `rewards`: each reward has a `min`, the total value its tier needs, a `weight` and a
`count`. The trade picks among the richest tier the total reaches, by weight. See
`content/tables/junk-collector.json`, a placeholder.

## What starts an event

- **`trigger: meter`** (the default): the event meter. Every cast adds a d20 to it (+5 when the hook comes up empty),
  and above 100 it empties and picks an event from the location's `events` list, by weight, among those whose
  `needs` are met and that haven't used up their `once`. So `needs` is how an event joins the draw only when
  something is true: `needs: season winter`, `needs: flag met-the-frog`, `needs: wind 4+`. Add the event to a location:
  `"events": [{ "id": "frog", "weight": 1 }]` in `content/locations/lake.json` (spots can have their own list).
- **`trigger: item`**: fishing up an item that names it, with `"event": "the-event-id"` in the item's file. Its
  `needs` are checked too, after the item is in the bags. A doodad in two halves, starting when the second half
  comes up, whichever it is:

  ```
  ---
  id: doodad
  title: The doodad, whole
  trigger: item
  needs: item left-half-of-doodad
  needs: item right-half-of-doodad
  ---
  ```

  with `"event": "doodad"` in both halves' item files.
- **`trigger: needs`**: as soon as its `needs` are met, checked after every cast, anywhere. For hidden objectives:
  `needs: caught northern-pike 10` and the minor deity who loves pike turns up (D51). Leave `once` at its default: with
  `once: false` it starts again after every cast.

One event is open at a time, and no cast goes out until it ends. A reload comes back to the same slide.

- **`trigger: arrive`**: the player arriving somewhere, checked with its `needs`. A new game counts as arriving at
  the start, so a welcome is:

  ```
  ---
  id: welcome
  title: A familiar shore
  trigger: arrive
  needs: location lake
  ---
  ```

  With `once` at its default it happens on the first arrival only; `once: false` makes it every time (a greeting
  on each visit to town). A new game and going somewhere on the map count as arriving, and so do the bench's
  location and spot pickers. Being moved by an event's `go:` doesn't, since an event is already open.

## Trying one out

The `?dev` bench has an Events section: start any event straight away (its needs aren't checked), fill the meter so
the next cast fires it, forget which events have been seen, and clear flags. The Character section can change the
class, for choices like the rogue's.

## Not there yet

These are code work first (D42): a buff as an effect, starting another event as an
effect, and barter (it comes with the town, D86).
