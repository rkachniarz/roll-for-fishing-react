# Writing events

An event is a pop-up with slides and choices (R10). Each one is a text file in `content/events/`, named after its id:
`content/events/frog.md`. Run `npm run content` after editing; it reports mistakes with their line number. The format
is D45 and D84; the code that reads it is `tools/event-text.mjs`.

## A whole event

```
---
id: frog
title: A froggy encounter
once: true
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
| `once` | `true` / `false` | `true`: it happens only once per game. Default `false`. |
| `trigger` | `meter` / `item` / `needs` | What starts it; see below. Default `meter`. |
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
| `needs: level 3` | the player is at least level 3 |
| `needs: luck 2` | Luck is at least 2 (R6.7) |
| `needs: item iron-key` / `needs: item bent-fork 3` | that many of the item are in the bags (default 1) |
| `needs: flag met-the-frog` | the flag is set |
| `needs: no-flag met-the-frog` | the flag is not set |
| `needs: season winter` | it is that season (`content/weather/`) |
| `needs: time dawn` | night, dawn, morning, noon, afternoon, sunset or evening (the words on the HUD) |
| `needs: caught pike 10` | at least 10 pike caught, ever (the accomplishments book) |

## Effects

| Words | Does |
|---|---|
| `gain: 2 luck` / `lose: 1 luck` | changes Luck, which the player never sees |
| `gain: 50 xp` | XP, with a level-up if it is enough; the log says so |
| `gain: iron-key` / `gain: 3 bread-crumbs` | puts items in the bags; the log says so |
| `lose: bent-fork` / `lose: 2 bent-fork` | takes items out of the bags (equipped ones are safe); the log says so |
| `set: met-the-frog` / `clear: met-the-frog` | sets or clears a flag, for later events and quests |

Flags are free-form names; use them to link events into quests (R10.7).

## What starts an event

- **`trigger: meter`** (the default): the event meter. Every cast adds a d20 to it (+5 when the hook comes up empty),
  and above 100 it empties and picks an event from the location's `events` list, by weight, among those whose
  `needs` are met and that haven't used up their `once`. Add the event to a location:
  `"events": [{ "id": "frog", "weight": 1 }]` in `content/locations/lake.json` (spots can have their own list).
- **`trigger: item`**: fishing up an item that names it, with `"event": "the-event-id"` in the item's file.
- **`trigger: needs`**: as soon as its `needs` are met, checked after every cast, anywhere. For hidden objectives:
  `needs: caught pike 10` and the minor deity who loves pike turns up (D51). Use `once: true` with it, or it starts
  again after every cast.

One event is open at a time, and no cast goes out until it ends. A reload comes back to the same slide.

## Trying one out

The `?dev` bench has an Events section: start any event straight away (its needs aren't checked), fill the meter so
the next cast fires it, forget which events have been seen, and clear flags. The Character section can change the
class, for choices like the rogue's.

## Not there yet

These are code work first (D42): requirements on the weather, a buff as an effect, starting another event as an
effect, money (no currency yet), and moving the player to a location (7.6).
