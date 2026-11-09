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

## Dice over the scene (D99, branch `dice-on-the-desk`)

- **Timing**: 0.7 s rolling, 0.55 s at rest, 0.2 s dithering away, so the catch flies about 1.45 s after the strike
  (`ROLL_MS`, `HOLD_MS`, `FADE_MS` in `src/scene/dice.js`). First guesses.
- **The log waits for the dice**, so it doesn't give the result away before they land. The bucket's count and the XP
  bar don't wait; they change at the strike.
- **The die**: ivory with dark ink, 35 pixels across, numbers in a 3×5 pixel font, upright on the page whichever way
  the face is turned. A natural 20's number is red, and its total floats up gold. The colours are `DICE_COLOURS`.
- **Where**: thrown in from below the scene, a little from the right, to rest side by side in the lower middle of the
  play area, over the shore line. They never cover the bobber's usual spots, but they can cover the reeds' tips on a
  narrow screen.
- **"Starts when a fish bites"**: the dice are thrown at the strike, not the bite, since nothing is rolled if the
  splash is missed.
- **"Reduce motion"** on the device turns the dice off; the roll then shows at once, as before.

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

## The pond from a photo (art sheet trial, `src/scene/pond.js`)

- **Eye level, or slightly from above?** `docs/art.md` says the view is "from the shore, looking out, slightly from
  above", and the game's scene is drawn that way: water filling most of the view, no sky. You said you always meant
  eye level. If so, that rule changes (a decision), and the game's scene with it. The pond is drawn at eye level.
- **The sky is squeezed** compared with the photo (the horizon sits about a quarter of the way down, not 40%), so the
  water gets more of the height. Water starts at row 122 of 256.
- **Fifty named colours,** far more than the game's scene uses, to get close to the photo. A real spot would want them
  cut down.
- **Drawn in autumn colours,** against the rule that the art is drawn for a clear spring noon. The seasons' tints then
  go on top of autumn; the drizzle card shows it.
- **A bobber at 150, 172** to show the scale. Casting doesn't work there: the engine's open water (`WATER`) belongs
  to the game's own view.
- **The photo is kept in the repo** (`docs/design/photo-autumn-pond.jpg`, 1.3 MB) as the reference.

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
  ability's initials, with its key (1, 2, 3) in the corner. Abilities that don't work yet show greyed out:
  Bend Reality, and the passives that need new fish are taken but do nothing yet.
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
