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

## A wider scene (D93)

- **The widest is 320 pixels** (5:4). It only matters on desktop, where the scene now goes 320 wide too (640×512 at
  1280×800); phones stay under it (286 on an iPhone, 314 on your Pixel).
- **The bobber sizes on the art sheet** (B 11×18, C 13×23, with far versions) are Claude's drawings, scaled up from
  the current one. Pick one, or draw your own over `node tools/sprite-png.mjs export bobber-b`.
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
- **The first trial, reed density** (`art.html`): A is today's 9 blades a side, B 18, C 36. Pick one, or say what's
  wrong with all three. With one-pixel blades the difference is small, which suggests the reeds need a different
  shape (clumps, thicker stems) more than more blades.
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
