# For the owner's review

Things Claude decided, guessed or wrote that the owner should look at when there's time. None of them block work.

**Not here:** anything that must outlive the item (D182): sources and how sure (`docs/sources.md`), a number's reason
(beside it in the code), measurements (`docs/history.md`), loose ends (DEV_PLAN.md, "Known gaps").

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

## Face templates and shading (2026-11-25)

- **The shading's three strengths** on the art sheet ("Faces: shading (trial)") are Claude's picks: A narrow
  (2 right, 2 up), B wide (4 and 3), C wide with a darker rim (5 and 4, rim 2 and 2), the rim at 70% of the skin.
  The shaded ear is the one on the viewer's left; the neck was already in shade. Which one, if any?
- **The face sizes on trial** ("Faces: size (trial)"): ×1.25, ×1.5 and ×1.75, every part scaled together from a
  point a little below the eyes (row 34), the shoulders left as they are. Claude's picks, spanning today's oval to
  about the reference's 45×50. Which one?
- **The printed template's scale,** 2 mm to a pixel with two templates a page, so the head is about 5 cm wide. Big
  enough to draw on?

## The creator after the first go on a phone (2026-11-25, D189)

- **Escape leaves the creator too,** as the X and Back do; before, Escape did nothing there.
- **Leaving goes to the title screen's first menu** (Continue, New game…), not back to the slot list.
- **The bigger face is the next whole size up from 1.3 times,** so it can be more than 30% bigger: on the phone the
  checks use, 107 to 149 pixels wide (40%). The Character page's face is as it was.
- **A name emptied after touching it** puts "A new fisher" back in the heading.

## Faces and town figures (2026-11-23, D187)

Calls Claude made building 8.13 (docs/history.md; the colours' reasons in docs/sources.md, "Faces"):

- **The peoples' colours:** ten human skins, the orcs' four greens, three greys and seven bricks, ten hair colours
  (orcs without the blonds and ginger), eight eye colours (orcs amber, red, yellow or dark), eleven clothes. The art
  sheet's Palettes section shows them all. Too many, too few, wrong shades?
- **The part lists:** five human heads, four dwarf and four orc (one "heavy" jaw for orcs); three ear shapes each
  (orcs' pointed, long or notched); six eyes, six brows, five noses (orcs a flat nose or a snout), six mouths; six
  beards; four tusks (small, big, one, upturned); ten hairstyles; six hats and hoods besides none. Any to add or
  drop?
- **Most people are bareheaded:** "no hat" weighs as much as all six hats together, so hair shows. **No bald women**
  from a roll (the player can still pick it).
- **Strangers are 8 in 10 human, 1 dwarf, 1 orc.**
- **The two codenamed roles:** the scrap dealer is "the Tinker" and the junk collector "the Ragpicker", both
  placeholders. The scholar is a human man or woman as the roll falls; the innkeeper too.
- **Names under the event's title:** the portrait's person is named under the title ("Bogna the Innkeeper"), in the
  muted colour. WoW names the quest giver in its own frame; fine like this?
- **The creator's pages:** Character (name, gender, people, class, stats) and Appearance (the parts), as tabs; the
  face sits over both and stays in sight while the parts scroll on a phone. The people is on the first page, next to
  gender. Each part's row shows "3 / 10", as WoW numbers its options, rather than a name for each.
- **A pointed hat or a mohawk can poke out of the circle's top:** cut off, as D142 says of the corners.

- **The 3D page lives in this repo,** next to `editor.html`, not in a project of its own, so it can read the game's
  palette and parts. Say if you'd rather it were separate.
- **The player's roll button** rerolls the whole face, and each part has its own small roll as well. The button would
  show a d20.
- **The silhouette first:** the parts are drawn biggest shapes first (hair, hats, beards, head width), on the guess
  that small features hardly tell faces apart at 64×64. The thirty-faces test bed in 8.13 is there to check it.
- **Brick colours** for orc skin, as Claude reads them: brick red, orange-red, ochre and sandy yellow, clay brown,
  dark purple-brown, and the near-black of engineering brick (D188). Say if you meant fewer.
- **The junk collector is a woman,** read from "junk lady" (D188).
- **The peoples' differences in play are a task of their own** (8.15), after the faces, so 8.13 builds only the
  looks and the player's pick.

## Code review fixes, batch D (2026-11-23)

Calls Claude made while fixing the tools and tests (docs/history.md, "The code review fixed"):

- **A new file must be `git add`ed before `npm test` passes,** if it falls in an area or is a test: the area index is
  now built from tracked files only, so a loose file can't change it, and the test names any new file it would have
  missed rather than let the clean checkout on GitHub fail after the push. A stray scratch file in `src/` or `test/`
  fails it too, by design. Fine, or too fussy?
- **`.gitattributes` makes every text file LF** in the working tree, whatever `core.autocrlf` says. Nothing in the
  repo changed (the index was already all LF).

## Code review fixes, batch C (2026-11-23)

Calls Claude made while fixing the UI and the top level (docs/history.md, "The code review fixed"):

- **Two tabs on one slot:** when another tab writes the slot being played, this tab shows a browser alert ("This game
  was played on in another tab. Back to the title screen, to carry on from there.", a placeholder) and reloads to the
  title screen, saving nothing more. The tab that wrote last wins. Is an alert all right, or should it be the game's
  own dialog?
- **Storage blocked or full:** the game plays on, keeping what it can't write for this visit only, and says once:
  "The game can't be saved: this browser's storage is blocked or full. Export it from the menu to keep it." (a
  placeholder). Good enough, or should it say more, or say it each time?
- **A buff on touch is cancelled only by the 1200 ms hold;** Android's own long press (at about 500 ms) does nothing
  on the buff bar now.

## Code review fixes, batch A (2026-11-23)

Calls Claude made while fixing the engine and the save (docs/history.md, "The code review fixed"):

- **Jump In is refused in the pause after a missed splash** ("Not while your line is out."), as Look Underwater is:
  the line goes out again by itself when the pause ends. To dive after a fish that missed the splash, the player
  reels in first (a tap in the pause). Should Jump In reel in by itself instead?
- **A Rogue snatches only the first of a Fence pair;** the other goes back into the water, not found, so a unique one
  can come up again. Before, it took both and gave both back when caught, which beat Fence's choice. The log line for
  two stolen items is gone. Would you rather the Rogue left the second for the player?
- **A twin with no room in the bucket gets away,** with its own line in the log: "It had a twin, another {fish}, but
  with no room in your bucket it slipped away." (a placeholder, `PLACEHOLDER_UI`).

## Broken masses no longer cut off straight (2026-11-21, after D170)

The owner saw clouds in the mostly cloudy sky cut off straight on one side. The broken masses (`mass-a`, `mass-b`,
`mass-c`) are noise in an envelope, and the noise ran thick right up to the edge of their box, where a narrow fade cut
them along the edge. Measured over 200 clouds a pattern: a third of mass-a and half of mass-b had a straight side,
runs up to 51 px. Now about 1 in 100, none longer than 9 px. Calls Claude made:

- **Room round each mass (`ROOM` = 10 units, `src/scene/clouds.js`):** the cloud is painted into a canvas 10 units
  bigger on every side, so its own shape thins it out there; a fade spread over that room catches the rest, gently
  at first so the outline keeps the noise's shape. The masses can now spread a little past the size they were shaped
  in; every shape is new (the noise draws more numbers).
- **The low bank (`mass-b`) stands on the horizon:** its flat base was meant to sit there, but it could float up to
  22 px over it, showing the cut. Its base is now always on the horizon line.
- **mass-c's long flat tops are left alone:** a long thin level streak is flat along its top by its own shape. The
  art sheet's new "Every cloud pattern" section marks them in red with "Mark straight sides"; say if any look cut.
- **A test** (`test/clouds.test.js`) holds the sides to 12 px and mass-a's top and bottom to 20.

  > _Owner_: the effects of all this you've done are really good. I'd remove this section but not sure if you haven't started using this document as a source of information for yourself, because it looks suspiciously so.
  > **Claude:** It had, which is what D182 put right on 2026-11-23: everything here was copied to its own home that
  > day. This section's measurements are in `docs/history.md` ("Alongside the tasks", 2026-11-19 to 2026-11-22), the reasons for `ROOM` and
  > the low bank beside them in `src/scene/clouds.js`, and the limits in `test/clouds.test.js`. Safe to delete. The
  > older items still read as reports rather than questions, but nothing on this page lives only here now.

## The wind on the water (2026-11-22, D177)

Try it in the art sheet's open water: **Wind** from None to Extreme, and **Wind from** for the direction (at Facing
90°, a wind from 270° is at your back, from 90° in your face, from 0° straight across). Calls Claude made, every number
in `WAVE_LEVELS` (`src/scene/waves.js`):

- **The open water and the reedy shore:** the ripple marks are drawn live now, not baked in. At None only an eighth
  of them show, short and with no dark trough, so the water reads glassy (the glints still flick, slower). Each
  level brings more and longer ones, with the dark trough under them starting further out; from Considerable a few
  near ones have a white top, a third of them at Extreme. Moderate looks about as the water always did.
- **Direction:** the ripples drift across by the wind's share across the view (up to 8 px a second near you at
  Extreme, slower far out), and roll in towards the bank with the wind in your face or out towards the horizon with
  it at your back. Crests are longest with the wind straight in or out, shorter across.
- **An offshore wind (at your back) leaves the water by the bank calmer,** the waves growing further out, as they
  have had no water to build on yet; a wind in your face brings them in full. The reeds don't shelter anything.
- **The still water (the pond):** its mirror is broken up by the wind, from perfectly still at None to rows pushed
  2-3 px at Extreme (it was 1-2 px at every wind, about Considerable now). Two thirds of each row's push is a ripple
  that rolls in or out with the wind's share along the view; a cross wind shows nothing extra there.
- **Extreme is busy:** every mark shows. A lake's waves stay small, but if Extreme reads too rough, lower its row.
- **The swamp is left as it was,** sheltered under its trees.

## The wind's direction (2026-11-21, D176)

- **Not changed:** the painted trees and reeds still lean and sway one way (the waves now follow it, D177). Nothing in the fishing reads the direction, and the HUD doesn't name it (the dev bench does).
  > _Owner_: The lean/sway is something we should try to do and keep in mind for future paintings - is that saved somewhere?
  > **Claude:** It wasn't. Now it is: `docs/art.md` ("Painting a spot from photos") says to paint new spots so their
  > lean and sway can follow the wind, and CR-2 in DEV_PLAN.md lists it as not started.

## The special sky, the magic of the land (2026-11-21, D173)

Have a look at the art sheet's new section, **The special sky (D173)**, and the open water's Weather list (Special),
to try it at any hour and facing. Calls Claude made:

- **Read off the photo:** long smears brushed on a slant (a random way, left or right, bending slowly across the
  sky), a grey sheen of hairline streaks along them, and colour only where the film pools: bands ring on ring,
  striped along the smears. The speckled patch (the photo's lower middle) is in `special-b` only, so the broad pools
  of `special-a` stay calm. The black guitar shows through as the night sky.
- **The colours (`FILM` in `src/scene/clouds.js`):** three greys of film, then the colours a thin film shows as it
  thickens, first order (straw, orange, red, magenta), second (violet, blue, sky blue, green, yellow, orange, rose),
  and a paler third (purple, teal, green, pink) that comes round again in the thickest pools. All partly
  see-through: the greys mostly (60-175 of 255), the colours a little (180-215).
- **It gives its own light:** never darkened by the night tint, and drawn over the light of the hour, cut to the sky
  above the land. The still water's mirror of it is tinted like the rest of the mirror.
- **It barely moves** (`drift` 0.25, a quarter of the wind's), lets the moon and the stars through (`veil` 1), and
  leaves most of the water's glints (0.9).
- **Two shapes a session:** like the other sky-wide patterns it is painted once per session and cached, so every
  card shows special-a or special-b in the same shape.
- **By day it isn't tuned:** the same colours over the blue look like an oil slick. Say how the day should look
  (paler, fainter, only at dusk?) when you get to it.
- **How the game would reach it** is open: nothing sets `sky: "special"` yet (DEV_PLAN, "From our talks").

## A dry overcast in spring and summer shows blue (2026-11-21, after D170)

The owner: the overcast photo was of a rainy day; a dry spring or summer overcast (their two new photos) is not all
cloud, blue shows here and there. Calls Claude made:

- **Two new patterns, a new kind, `deck`** (`src/scene/clouds.js`): rows of cells over the whole sky, each lit from
  above and a little from the left, smaller and flatter row by row towards the horizon, running into a pale haze
  over it; where a broad noise thins the deck, the sky shows, mostly in the gaps between cells. `deck-a` (the grey
  photo): big soft grey cells, low contrast, broad paler and darker stretches, a few larger holes. `deck-b` (the
  white photo): small bright white cells, grey between them, more small blue gaps. Their numbers (cell sizes, how
  much opens, contrast) are Claude's tuning by eye against the photos.
- **Which shows when:** spring and summer at clouds 4 list both (before: spring a grey sheet and a layer, summer rain
  cloud). Autumn and winter keep the grey ceiling. **A new rule, `rainy`** in `content/rules/sky.json`: at clouds 4
  with light rain (precipitation 2) any season shows the grey ceiling (`sheet-a`, `sheet-b`); steady rain (3) and
  more is still rain cloud. Moist air (1) counts as dry: say if it should be the ceiling.
- **The sun in the holes:** a deck is drawn over the sun and the moon, which show only through its holes, so they are
  not veiled as well (`open.veil` 1). With the sun off the picture, a cloud is over it 75% of the time
  (`open.sunHides`); the water's glints flick at 45% (`open.glints`, between mostly cloudy's and overcast's).
  The moonlight on the water still goes by the level, as before.

## The overcast redrawn from the owner's photo (2026-11-21, after D170)

The owner: the overcast showed a sine-wave pattern, and too much spray-can scatter. Calls Claude made:

- **Both sheets (`sheet-a`, `sheet-b`) are drawn from noise** that wraps across the 320 pixels, gently warped,
  instead of sine waves, so nothing repeats across the sky. Cells about twice as wide as tall, with a mild
  perspective (up to twice as squashed at the horizon); pale soft streaks run through broad blotches, and it
  darkens low down, as in the photo.
- **The sheets' greys step half as far** (the owner: subtler differences): a ramp of their own, `ceiling` in
  `RAMPS` (`src/scene/clouds.js`), from the season's `shade` down to halfway between `sheet` and `sheetDark`,
  with the halfway colours worked out in code, so no new palette keys.
- **A little dither, only where two tones meet** (`SEAM`, 0.06; it was 0.18 everywhere).
- **Every sky-wide pattern went the same way** (the owner asked for them in line): rain, storm and fog are drawn
  from the overcast's noise (`skyNoise`) with the same little dither, and the sine waves are gone from the sky.
  What each keeps: `rain-a` its dark band and slanting curtains of rain (still streaked every other column), its
  base's edge now uneven by noise; `rain-b` its heavy rolls; `storm-a` long dark rolls, the pale rims now only
  here and there; `storm-b` its pale band at the horizon, its edge by noise; `fog-a` and `fog-b` their pale
  gradient, with faint banks. Their colours are unchanged: the storm ramp still steps far, from pale `sheetDark`
  to `stormDark`, which suits a storm to Claude; say if it should be subtler like the overcast.
- **`sheet-b` is no longer a lumpy, wavy base:** it's the same ceiling in smaller, busier blotches.

## Mostly cloudy, taller clouds, lopsided towers (2026-11-21, after D170)

The owner: mostly cloudy wasn't cloudy enough (their photo of a mostly cloudy sky is the yardstick), its clouds
looked like long caterpillars, and towers were too symmetrical and repeated. Calls Claude made:

- **Mostly cloudy now hides about 55-75% of the sky** (was 14-28%). Each level has its own `fill` in
  `content/rules/sky.json`: how many single clouds are laid out, as their own pixels over the sky's (overlaps
  counted twice). A few and scattered keep what they had (0.042 and 0.105); mostly cloudy is 1.2. Its `cover` went
  0.6 → 0.75, the sun hides 70% of the time off the picture (was 50%), glints left 0.45 (was 0.6).
- **The moon under mostly cloudy:** `rules/moon.json`'s light through went 0.4 → 0.25, to agree with the new cover
  (a test keeps them within 0.15). That makes the moonlit nights a little rarer under mostly cloudy.
- **A new kind of cloud, the broken mass,** drawn from noise instead of round lumps, so no two outlines match and
  holes of sky open inside them. Three patterns, all from the owner's photo: `mass-a` the big broken mass,
  `mass-b` a tall grey bank low over the horizon with a lit, lumpy top (the photo's lower right), `mass-c`
  wind-torn streaks on a slant (its lower left). They're lit by self-shadowing: the more cloud between a pixel and
  the light, the greyer, so tops shine and bellies go grey.
- **Mostly cloudy per season:** spring broken masses, tall heaps, sheared towers and streaks; summer masses,
  towers and a grey bank; autumn and winter masses, banks and grey layers. Summer's scattered sky can now show a
  sheared tower too.
- **The caterpillars are gone:** the long heap (`heap-b`) boils up into uneven bumps, higher on one side; the
  grey layers pile two or three deep in places, and their cells are each a little heap of their own height.
- **Towers grow** lump on lump from an uneven base, up a column off centre that leans, so each one is lopsided.
  A third, `tower-c`, is sheared over by the wind with a low shoulder on the other side.
- **Five shapes of each pattern per session** (was three), so the same cloud comes round less often.
- **More photos would help with towers:** towering cumulus seen side on, whole, from a distance, if you have any.

## The stew's buff stands still in town and asleep (2026-11-19, D172)

The stew's cooking and the inn's morning page (D165) are taken back. Calls Claude made:

- **Only the stew's buff holds.** A potion, Rested and the other buffs that last game minutes still run down in
  town and asleep. If any of those should hold too, it's one word (`holds: true`) where it's given.
- **"In town" is anywhere in town,** the square and the shops as well as the inn and the room.
- **The event `inn-morning` is kept, retired,** since content ids are permanent (D44); events now take
  `retired: true` in their front matter.

## The sky drawn three times bigger (2026-11-21, after D169-D170)

The owner: everything in the sky but the stars looked too small. One factor, `SKY_SIZE` in `src/scene/clouds.js`,
now enlarges the sun, the moon and the clouds; calls Claude made:

- **The factor, 3:** the still water's old summer clouds (before D169) were about 120 px wide and 35 tall over the
  same 110 rows of sky, against 23×9 for a mid heap; the owner's photo of heaped cloud over distant trees, read at the
  game's 4 px a degree, puts its towering heap near 100×85 and its small heaps near 30×17. Those come out at 3 to 5;
  3 is the low end, so it errs small. One number to change if it should go further.
- **The sun and the moon** are 25 px across (were 9), the ring round them and the rim widened in step.
- **Clouds**: all three distances are 3× (1.8, 3 and 4.5 px to the unit). **Towers are never drawn near** any more
  (they would stand 98 px, nearly the whole sky), only far or mid, up to about 64 px tall.
- **The sky-wide patterns** (sheets, rain cloud, storm, fog) have lumps, rolls and rain curtains 3× wider too.
- **How many**: counting clouds no longer meant the same cover, so they go up until their own pixels fill 35% of the
  sky times the cover (±20%), at least one, at most 40. In practice a few now fills about 5% of the sky with 2-4
  clouds, scattered about 9% with 4, broken about 16% with 5-7 (were 1%, 5% and 13% with 5, 12 and 24 small ones).
  Over a backdrop, 1-2 pieces of scud or layer (were 2-5).

## The open water, the default scene (2026-11-19, D171)

Have a look at the art sheet's new section, **The open water (the default scene)**: pick a spot or turn the view by
hand, and move the day, the hour, the moon and the clouds.

- **Its water is the reedy shore's**, season for season, with the reeds left out; nothing else differs.
- **The spots keep their old `tint`, washed over the water only** (not the sky), so deep water reads darker and the
  tower's pool purple. Their old `shapes` (rocks, far shores drawn from above) don't show: they were drawn for the
  top-down view.
- **The open water a cast lands on, at every spot without its own:** x 40-216, rows 118-190, from just under the
  horizon to near the rod. Old saves have their pool fish and features moved into those rows in proportion.
- **The far-band sprites start at row 136,** as on the reedy shore.

## Clouds that follow the weather (2026-11-19, D170, 12.5)

Have a look at the art sheet's new section, **Clouds (12.5)**: every cloud level in every season over the reedy
shore, rain cloud, black, fog and mist, three skies named by a description, and the still water mirroring them. All
of it is Claude's first go (CR-2); calls Claude made:

- **References** (Wikimedia Commons, local only in `docs/design/commons/`, which git ignores; a contact sheet per type,
  `cloud-fewcumulus.jpg`, `cloud-scattered.jpg`, `cloud-broken.jpg`, `cloud-towering.jpg`, `cloud-stratocumulus.jpg`,
  `cloud-cirrus.jpg`, `cloud-stratus.jpg`, `cloud-nimbostratus.jpg`, `cloud-storm.jpg`; the ten fetched at size are in
  `docs/design/commons/clouds/` with `credits.csv`). Used for shapes only, never traced: _Cumulus Humilis Clouds -
  Tennessee, USA - July 7, 2014.jpg_ and _Cumulus-humilis.jpg_ (heaps), _Cumulus congestus cloud Finland.jpg_ and
  _2016 Chmura Cumulus congestus 02.jpg_ (towers), _2020-10-01 17 27 08 Stratocumulus clouds above a field in the
  Dulles section of Sterling, Loudoun County, Virginia.jpg_ (layers), _Cirrus at evening 7th Brigade Park Chermside
  P1080258.jpg_ (wisps), _2018-05-18 18 27 21 Low stratiform clouds (base near 3,000 feet AGL) with wavy, bumpy base…_
  (sheets), _Nimbostratus Forest.jpg_ (rain cloud), _Dark clouds above the hilly valley (Unsplash).jpg_ (storm),
  _Fishing boy in Laos 2.jpg_ (broken). Nothing fell back to a placeholder for want of a reference.
- **The library** (`src/scene/clouds.js`): heaps 3 patterns, towers 2, layers 3, wisps 3, sheets 2, rain cloud 2,
  storm 2, plus 2 of scud and 2 of fog. Three sizes by distance (0.6, 1 and 1.5 pixels to the unit), towers never in
  the far one; up to three shapes of each per session. Lit from above and a little from the left whatever the sun.
- **The table** (`content/rules/sky.json`, marked a placeholder): summer heaps and towers, autumn grey layers and
  sheets, winter wisps on clear-ish days and sheets, spring heaps; overcast is a grey sheet in spring, autumn and
  winter and rain cloud in summer; black is a storm overcast; rain cloud also at overcast with precipitation 3+.
  The palettes start from the reedy shore's old painted clouds, with greys and storm colours added.
- **How many**: a few is about 5 clouds, scattered 12, broken 24 (40 times the cover, ±20%); over a backdrop 2–5
  scud or layer pieces. Cover per level 0, 0.12, 0.3, 0.6, 1, 1 (agrees with moon.json's `cloudCover` within 0.15, a
  test checks).
- **Veil** (what shows of the sun, the moon and the stars): 1, 1, 1, 0.85, 0.1, 0; mist 0.15, thick fog 0.
  **Glints left**: 1, 1, 0.9, 0.6, 0.25, 0.1, and down to 55% more in a cloud's shade.
- **The sun hides**: off the picture, a cloud is over it 15% / 30% / 50% of the time at a few / scattered / broken
  (40% for "Numerous clouds…", 55% for "the sun hides behind the clouds", 50% for "Sunlight breaks through in
  patches"), in spells of 4–12 s, clear spells 6–20 s; it dims the light by 0.12 of the overcast tint.
- **Black's dusk**: 0.38 of the night tint (night is 0.55). **Heavy downpour** (autumn) went to 5 with Downpour,
  since it is one; say if it should stay at 4.
- **Each described sky's patterns** are in `sky.json`'s `descriptions`: "Scattered clouds rush…" fast heaps (3× the
  wind's drift), "Big, still clouds…" towers hardly moving (0.2×), "Low clouds hang heavy" low grey rolls, "A grey
  blanket of cloud" a flat sheet even at level 3, the clear skies none, and so on.
- **Drift**: 0.3 px/s plus 0.55 per level of wind, slower far off (0.45×) and faster for wisps (1.3×) and scud (1.6×);
  backdrops at 0.35×; always left to right. A new weather's sky fades in over 5 s.
- **Clouds at night and dusk** take a tint: warm with a low sun, purple-grey at twilight, dark blue at night, lighter
  under a bright moon. Clouds lit orange from below wait (DEV_PLAN, "From our talks").
- **The still water's mirror** is the live sky laid over the baked one at 40%, only where the water mirrors sky (from
  the painting's skyline): a cheap stand-in, not a true reflection; the reedy shore's open water mirrors nothing.
- **The swamp** gets only the overcast tint it already had, and black's dusk.

## The sky as its own layer (2026-11-19, D169, 12.4)

Have a look at the art sheet's new section, **The sky (12.4)**: the reedy shore and the still water at dawn,
morning, just after sunset, under a full moon, and turned south at a winter and a summer noon. Calls Claude made:

- **The vertical scale: 4 px for each degree above the horizon,** about the same as across (the 60° view over 256
  px is 4.3 px a degree), so the sky isn't stretched. The top of the picture is 27° up: a winter-noon sun (12°)
  sits just over the pond's trees, a summer-noon one (58°) is far off the top, as DEV_PLAN asked.
- **Both horizons are row 110:** the reedy shore's open-lake horizon, and the still water's water line (its far
  shore stands on it). A sun or moon below the top of the land is hidden by it, and throws no glitter (a sun
  behind the pond's trees at 04:30 in summer).
- **The strips either side show sky too, at the same scale:** the painting's 320 px cover 75° of compass, so a sun a
  little outside the 60° view still shows in a strip on a wide screen; on a square phone screen it is cut off at
  the edge. The pond, facing north-east, sees the sun only on summer mornings, and mostly behind the beech leaves;
  the reedy shore, facing east, sees it rise in spring, summer and autumn.
- **The sun and the moon are both 9 px across;** the sun pale with a checkered ring of light high up, golden under
  10°, orange-red under 2°. The moon is drawn in 28 phases, a waxing one lit on the right; by night its dark part
  shows faintly and a moon past half has a faint checkered ring; by day it is a pale shape at 70%.
- **The sky's colours:** the day's four per season are the reedy shore's old skies (`SKY_DAY`); under 8° the
  bands blend towards a golden sky, under the horizon towards a twilight one with a red horizon, and from 6° to
  14° under towards night (`SKY_LOW`, new colours, Claude's). A glow on the horizon round the sun while it is
  within 10° of it. The night tint still darkens it all over, as before.
- **The glitter:** under a sun lower than 20° (more dashes the lower), or a moon lower than 30° at night, weighted
  by its moonlight (12.3), on the open water only. Gathered as far under the horizon as the sun stands above it,
  spreading towards the viewer and wider nearer; the moon's narrower and fainter. Redrawn about six times a second
  from the scenery stream.
- **Stars:** 80, from the sun 7° under the horizon, a few flickering; gone under scattered cloud and more.
- **Until 12.5 brings clouds the sky is clear in every weather.** As a stand-in, the sun, the moon and the stars
  fade with the cloud level (gone at overcast). The pond's water still mirrors its photo's sky (overcast in autumn,
  blue in summer), not the sky shown above it: 12.5 ("the water mirrors the clouds") is the place to change that.
- **The pond's and the reedy shore's own clouds are gone,** with the reedy shore's sky colours (moved into the sky
  layer). The reedy shore's cloud colours are kept for 12.5 (`SKY_CLOUDS`); the pond's summer cloud colours went.
- **Easing:** the sun and the moon glide to each new half hour's place, and the sky's colour fades across in a
  second and a half; a jump of more than an hour and a half (sleep, travel) or a new spot just cuts.

## The moon and the fish (2026-11-18, D168, 12.3)

All four ways you asked for are in. The amounts are in `content/rules/moon.json` (marked placeholder) and the
words in `content/rules/fish-preferences.json`. Calls Claude made:

- **The moon words:** `full` when 90% or more of the disc is lit (about three days of the 14), `new` at 10% or less;
  both count day and night, as the anglers' "fish the days around the full and new moon" has it. `moonlit`: a
  moonlight of 0.4 or more; `dark`: a night with a moonlight of 0.1 or less (a new moon, or the moon down, or thick
  cloud). Each counts as one preference, the same ×2 as the weather's.
- **The moonlight** is the part lit, times the moon's height (whole from 20° up, fading to nothing at the
  horizon), times what the clouds let through: clear 1, a few 0.9, scattered 0.7, mostly cloudy 0.4, overcast 0.1,
  black 0. It counts only once the sun is 6° under the horizon (the end of the twilight). Fog doesn't dim it yet.
- **The anglers' moon tables:** a major period while the moon is within an hour of due south (overhead) or due north
  (underfoot), a minor one while moonrise or moonset is within half an hour, as the printed tables have them
  (two hours and one). A major period wins where they meet. About a sixth of the time is major and a twelfth
  minor. Outdoors each is a buff on the bar, "Moon feeding time" (+10 Fish Find) and "Moon stirring" (+5), both
  names placeholders. Nothing in town.
- **The pools in a period:** the predators eat twice as often in a major period, half again in a minor one, and a
  major period brings one more fish on the move.
- **A bright moon lightens the night:** the shadows seen from the bank at night come back towards the day's number
  as the moonlight grows (at full light, as many as by day). Rain still dims them.
- **Which fish, and why (guesses unless said):**
  - _Dark nights or the new moon:_ **eel** (new, dark: the best-grounded one; eels move and feed less under
    moonlight, and the silver eels run on dark nights), **sea lamprey** (dark: it runs at night and shuns light),
    **burbot** (dark), **wels catfish** (dark), **channel catfish** (new), **zander** (dark: it hunts in low light
    with its reflecting eyes).
  - _The full moon:_ **bluegill** (its spawning beds follow the moon, the best-grounded of these), **black crappie**,
    **largemouth bass**, **common carp**, **northern pike** and **muskellunge** (the last four are anglers' lore,
    musky anglers' especially), and **walleye** (full and moonlit: walleye anglers swear by full-moon nights, the
    opposite of its cousin the zander, on purpose).
  - _Moonlit nights:_ **brown trout** and **lake brown trout** (they feed at night when there's light to see by).
- **The weather's tooltip names the moon's phase** ("The moon: full"), a placeholder line until the sky layer (12.4)
  shows the moon itself.
- **The balance** (`npm run sim`, 20 games of 500 casts per class, before → after): fish brought up 31.2% → 33.2%
  (fish fighter), 29.4% → 30.3% (wizard), 22.4% → 23.4% (rogue); XP per cast 1.63 → 1.75, 0.96 → 0.99,
  0.72 → 0.75. A little more fish, mostly from the periods' Fish Find.

## The sun and the moon (2026-11-18, D167, 12.2)

Nothing shows them yet; the fish (12.3) and the sky layer (12.4) will. Calls Claude made:

- **The first full moon is 1d14 nights from the game's first day**, on the night of the rolled day (full at the
  midnight that ends it). An old save rolls it from the day it is loaded on. The roll comes from its own stream,
  drawn once and not kept (as the start day is), so the other dice are untouched.
- **The sun keeps to `SUN`'s sunrise and sunset exactly.** At Gdynia's latitude the real winter day is about 25
  minutes shorter than `SUN`'s, so the sun's hours are stretched a little to match the light the scene already
  shows; its height at noon is the true one (about 59° at midsummer, 12° at midwinter).
- **A simple moon:** it follows the sun's path, a share of a turn behind it, so the full moon rises at dusk and
  rides high in winter and low in summer, and it rises about 1 h 51 min later each game day (24 hours spread over
  13 rises in a 14-day cycle). The real moon's tilt and wobbles are left out.
- **The eight phase names** (new, waxing crescent, first quarter, waxing gibbous, full, waning gibbous, last
  quarter, waning crescent) each take an eighth of the cycle, so each lasts about a day and three quarters.

## The spots' compass facings (2026-11-18, D166, 12.1)

Nothing shows it yet; the sun, the moon and the sky (12.2, 12.4) will use it. Calls Claude made:

- **One width of view for every spot: 60°** of compass across the play area (`VIEW` in `src/engine/sky.js`).
  About what a phone camera sees across; wide enough that the sun or moon is in the picture for a good part of
  its day at a spot facing its way, narrow enough that it isn't always there. A wider view (90°) would show the
  sun and moon more often but squeeze their path across the picture.
- **The facings are whole degrees,** as you gave them. A facing is the middle of the picture; the side strips
  either side of the play area (D93) count as beyond the view's edges.
- **Which spots must have one:** every painted spot but the swamp, and every spot on the map that isn't the town.
  The placeholder spots (rocky shore, open and deep water, the river, the tower's pool) have theirs already, so
  they are ready when painted.

## A slot's list, as WoW's flyout (2026-11-18, D164, T.3)

On the phone and the desktop: `dist/verify/slot-list-phone.png`, `dist/verify/slot-list.png` after
`npm run verify "slot list"`. Calls Claude made:

- **When nothing fits, the list still opens** and says "Nothing in your bags fits here." in muted italics, so a tap
  never seems to do nothing.
- **The equipped item's tooltip on a phone:** the same tap that opens the list shows it, as before, above the slot
  while the list opens beside it. A second tap on the slot closes both; tapping an item in the list swaps to its
  tooltip.
- **Each item's tooltip ends with how to equip it from the list,** "Tap again to equip" / "Click to equip", like the
  bags' "Long press to equip".
- **Where it sits:** beside the slot, over the stats, between the two columns so the other column stays in sight. A
  phone's row scrolls sideways; on a wide screen (900 px and up) it wraps into more rows instead, since a mouse
  wheel doesn't scroll sideways.
- **It closes** on a pick, on a second tap on its slot, on a press anywhere else (that press still does what it
  does, e.g. a tap on a bag item shows its tooltip), and on Escape. With the line out a pick is refused with
  "busy" and the list stays open.
- **A key press on an item equips at once** (no tooltip step), as a keyboard has no hover.
- **The list is in the tooltip's colours** (`--tip-bg`, `--panel-edge`), each theme its own.

## A long press equips, on a phone (2026-11-18, D163, T.2)

Calls Claude made:

- **With a mouse the hint reads "Right-click to equip"**, and "Long press to equip" on a touch screen, by the pointer
  last used (a press, or a mouse hovering over a slot).
- **A potion says "Long press to use" / "Right-click to use"** the same way, since a long press drinks it; the hint
  is only on items in the bags, so a potion's link in the log no longer says "Right-click to use".
- **Equipped items get no hint** ("to unequip"), as you asked only for items in the bags.
- **The long press is half a second**, a little shorter than the bucket fish menu's 600 ms; a finger moving more than
  10 px first is a scroll and equips nothing. A short buzz on the phones that can.
- **The hint is in the muted text colour** (`--muted`), each theme its own.

## A tap on the scene closes a pane, on a phone (2026-11-18, D162, T.1)

Calls Claude made:

- **One tap closes everything open:** a pane over the scene and the bag over the log go together, not one per tap.
- **The game menu counts too,** with settings and the dev bench opened from it: a tap on the scene outside the menu
  box closes it. Mid-cast that tap is no strike (D94 kept a strike landing with the menu open); you said a second
  tap is the player's job.
- **Space and Enter are unchanged:** with a pane open they still cast and strike, as before (the menu still blocks
  a cast). A phone rarely has a keyboard, and Escape already closes a pane.
- **The barter window keeps its rules:** with it open, a tap on the scene doesn't close the bag beside it either,
  so a trade can be weighed against the bags.

## The map (2026-11-18, D161, 12.1)

On the phone and the desktop: `dist/verify/map.png`, `dist/verify/map-wide.png` after `npm run verify map`; the
picture alone, three times as big, in `art/map.png` after `npm run map`. Calls Claude made:

- **The paper as pixel art at 320 pixels square,** like the scene's 256, drawn at whole device pixels: on a
  1280×800 screen that is 640 pixels, so the margin is bigger than "small" there; on a phone it fills the width.
  The photo's grey white balance is set to cream (`CREAM` in `tools/map.py`), its uneven lighting flattened, the
  creases kept at 1.5 times their strength, the rusty stains from the photo's own warmth, the rim browned, 14
  colours. Every number there is a knob.
- **The ink and the water:** the outline in two sepia tones, specks of the scan dropped; a faint grey-green wash
  on the water, the bay at 3 and the river included. The stream at 4 runs off the top of your drawing, so its
  water ends in a round where your lines end.
- **Where the outline sits:** your drawing's square laid over the whole paper, 3% in from its edges, so the river
  and the east shore run off the torn edge.
- **The marks:** at your numbers' places (open water and deep water at your O and D). The upper river is at
  (195, 291), as low in the channel as a circle fits on the paper; the lower river at (189, 247), in the channel
  between the mouth and your old 6. The Mage Tower: your (180, 40) read on the 256-pixel reference you sent,
  which is (221, 56) on the map, just under the name. The town (1) is moved a little in from the paper's edge. Circles 11 pixels
  across with an ink rim and a glint; a ring round the one named. A press goes to the nearest circle within reach,
  since the town and the reedy shore are close and small on a phone.
- **The name at the top:** the spot's name, capitalised, in bold; under it the location ("The Lake"), or its
  completion when that shows. With nothing under the pointer it names where the player is.
- **On a phone a first tap names the spot and a second goes;** with a mouse, hovering names it and a click goes.
  A close × on the paper's top right; Escape, the map button, or a tap on the dark round it close it too. Going
  somewhere closes the map.
- **Held by an event** (`locked`), the other places' circles fade and a red line says so at the paper's foot.
- **The river opens at nightfall with the town** (`open: river` on each of the event's choices), the upper river
  known then; the lower river and the mouth are still noticed after 20 and 50 casts there, until the unlock order
  is redone.

## The simulation under the surface (2026-11-15, D157, 11.12)

- **Spawners are slow to leave, not certain to stay.** You chose "they arrive in groups and stay". With that, every
  pool sat at its cap for whole seasons, since some kind is spawning at most spots through spring and summer. So:
  a spawning fish is four times less likely to leave, and a spawning crowd tops out at one and a half times the
  pool's number (`spawnCrowd`), not twice.
- **What an unfished pool holds, measured over a year at four spots:** 0.7 to 0.9 of its number out of the spawning
  seasons, 1.2 to 1.5 in them; a little over one fish leaves and one arrives each part of the day. For that the
  chance to leave came down from 50% to 30% (`leave`). You asked for the leaving rate: at 50% a pool held only 0.6.
- **A predator takes only wild fish,** never one that got away from you or that you let go. `eat` is 0.8% per point
  of water temperature, for every predator alike; the deep water has about six predators in its pool, so its
  small fish go fastest.
- **The strike has not been looked at in a browser by Claude:** the predator's shadow swims to where the prey was,
  three rings and a few pixels of foam. Worth a look, and a word if it should be bigger.
- **Bites from the pool: 80% at its number** (`fromPool`), measured 65 to 92% in play; the rest are passers-by.
  A thin pool gives more passers-by, as you chose, so there is no fishing a spot out.
- **Bigger-fish bait and perks** now mostly choose which of the pool's fish bites (the bigger the likelier); only a
  passer-by is rolled a size up. Difficulty and XP values count for every fish.
- **Rift Fishing is rolled before the pool,** so it keeps its full chance.
- **Schools from the list are gone from play.** The school features and D154's lists stay in content, used only by
  the bench; `schools` in `rules/spawning.json` is no longer read. Say if they should be retired outright.
- **A school always shows,** whatever the depth or the hour; its fish keep 6 pixels apart across and 3 up
  (`shoalGap`) and close half the distance with each cast. Each fish alone drifts up to 4 pixels a cast (`drift`).
- **The night counts as one part of the day across midnight,** so there are seven turns a day.

## Fish leave the pool; aiming at a shadow (2026-11-15, D156, 11.14)

- **Class fish are shown under the water but are not in the pool.** You chose "truly in the pool" for schools,
  big fish and class fish. Schools and big fish are. A class fish holds its spot when you travel, isn't caught in
  a dive and carries what it stole, so it stays in its own list and only shows in Look Underwater. Say if it
  should be in the dive too.
- **Every wild fish can leave, not only the unsuited.** With "the unsuited may leave" almost nobody left: nearly
  every fish has its season or hour met. So: 50% to leave with nothing met, halved for each preference met and
  for spawning. Plants don't count, being always there.
- **After a day away, every wild fish is new;** within a day, one turn however many parts of the day went by.
- **What shows:** surface and upper swimmers always; lower 40%, bottom 15%; half at night or in rain (precipitation
  2 and up); 12 at most. At the deep water, where everyone swims low, that is few shadows: worth a look.
- **Landing on a shadow:** 16 pixels across, 6 up and down, the patch the shadow mills about in. With a cast's
  scatter of 20 it takes some luck; a better rod narrows it.
- **A school is 3 to 5 fish and has no Fish Find any more,** as you said; it lasts until its fish are gone or its
  24 casts are up. A fish of it that gets away is still the school's. Its fish are rolled as it comes up, so a
  perk for bigger fish doesn't reach them, nor the big fish (as with the pool, D153).
- **A fish that gets away reappears where the bobber was;** one let go finds a place of its own.
- **Jump In now works after a big fish too:** it used to be "somewhere else"; it is in the pool now.
- **Older saves** lose the schools and big fish that were on the water at the time.

## Review 3: how the lake's rules meet (2026-11-15)

The bugs the review found are fixed and listed in history.md. These are not bugs: places where two of the lake's
rules meet and the result may not be what was meant. The owner has answered most (2026-11-15): the stacking
multipliers, the plants and the seasons' steps are knobs for the balance simulations later (DEV_PLAN, Phase 11);
the adjustable line, Luck (events will roll with it and gate choices by it) and the one water temperature are
fine as they are. What's left:

- **Weight touches nothing but the records (D146), by the owner's call,** with one side effect: twins must share a
  condition, 21 steps, so fish almost never stack in the bucket now.
- **The tank goes by the fish, hiding by the kind (D152).** A meal needs the prey under half the eater's own
  length; hiding compares the species' middle lengths. A trophy roach hides from a small pike that can't eat it.
  In the tank the hiding zone (80 by 36) covers most of the glass (96 by 66): small fish beside a pike are fleeing
  about a third of the time.
- **Smaller things:** a second twin is lost without a word when the bucket is full; a predator can eat an
  endangered fish or a class fish in the tank; a Conservationist can let the same fish go, Recall it and let it go
  again; a pool fish struck at in a dive and missed is still "new" to the player.

Calls made while fixing, for a look:

- **Big fish by the predator mark (D155).** New: big chub, rock bass, brown trout, smallmouth bass, ide (names
  marked placeholders). **Kept, though the rule would not make them today:** the five without the mark (channel
  catfish, landlocked salmon, eel, sea lamprey, pejerrey) and the two that shoal (black crappie, silverside); say
  if any should go. Left out as too small: Cassalan sleeper, Wildlands perch.
- **Schools follow shoaling now (D154).** Marked as shoaling **from common knowledge, not a source** (FishBase says
  nothing either way): rudd, ruffe, crucian carp, common carp, Ferrstad carp, white sucker. Taken as keeping alone,
  their schools retired: central mudminnow, deepwater sculpin, mainland bullhead, stone loach, chub, rock bass.
  New schools: grayling and frostfin grayling (their names, "a school of grayling", are marked placeholders). The
  swamp now has two schools, the deep water one, the rocky shore two: say if a spot should always have three.
- **The three fixes the owner asked for (D153):** the water's trend from its own average of about a week
  (`trendLag` 336 half-hours, a guess that measured well); burbot, icefish and polar cod spawning up to 2 on the
  scale, wider than their sources (0.6 to 1.7 °C and colder), because the game's winter water averages 3; pools
  stocked with no bait and none of the player's values, so a perk for bigger fish doesn't reach the 5 to 15% of
  bites that come from the pool.
- **A fish's manoeuvre runs out after 1.5 s (`fightMs`), as D141 meant.** Until now it never did in the real game,
  so nobody has yet felt that timing in play.
- **A second tap within half a second of the strike is ignored in a fight too,** so a double tap on the splash
  doesn't yank the hook.
- **Set to the bottom, a certain fish (summoned, a class fish cast by) is never turned into something else.**
- **The pot and the tank give a fish back only to a bucket with room;** the pot itself still has no limit.
- **Trades only where the vendor is;** walking off closes the barter window.
- **No saving to a file while the line is out** ("Not while your line is out."): the file would have rolled the
  line anew.
- **A failed dive adds to the fish's "got away" count** instead of setting it back to one.
- **Swimming:** a fish in a small patch (a big fish's shadow, a class fish) now moves; shoal-mates keep their
  places instead of being reshuffled on every redraw, and face the way they swim. Worth a look in the game.

## Who eats whom (2026-11-15, D152, 11.11)

- **Predators from FishBase's diet sentences** ("feed mainly on fishes", "piscivore", "voracious predator"), 44 of them,
  and **eight known fish-eaters whose pages are silent:** muskie and chain pickerel (pike's genus), brown trout,
  Wildlands perch, payara, goliath tigerfish, arapaima, goonch. Fish that eat a little fish among much else (bluegill,
  lenok, rainbow trout, capelin) are left out; perch, yellow perch, ide and chub are in, as FishBase says the bigger ones
  eat mainly fish.
- **The numbers** (half its length, 15% a day, up to 7 days counted, 3 days for a feeding, twice the size to make a fish
  hide) are guesses in `rules/tank.json`.
- **Any bait feeds the tank,** the first bait in the bags. Say if it should be a particular food.
- **Only checked when you come into the room,** so a tank isn't hunting while you watch it. Sleeping in the room counts
  from the next time you come in.
- **Not checked in a browser:** the warning and the Feed button pass every browser check without errors, but none of
  them opens the aquarium with a predator in it. The engine side has unit tests.
- **Hiding** is drawn only: in the tank, the dive and the look. Whether it reads as hiding, or as fish twitching, wants
  your eye.

## Shoaling (2026-11-15, D151, 11.9)

- **Who shoals,** from FishBase: bream, bleak, silver bream, barbel, nase, dace, minnow, gudgeon, vendace, whitefish,
  smelt, both graylings, yellow perch, black crappie, piranha, discus, frontosa, capelin, four-eyed fish, archerfish,
  peacock bass, silver carp, mangrove jack, pejerrey; and **roach and perch**, from your examples, though FishBase's
  pages don't say it in so many words. **Alone:** ide, chub and asp too, whose young shoal but adults don't.
- **A shoal is the fish of one kind in one view.** In a tank of six with two roach, the two roach swim together.
- **The scatter:** 1.5 s, and only the middle of a bolting fish counts as a tap: guesses.
- **Not seen moving by eye:** a screenshot three seconds into a look shows a loose group of the pool's silver fish
  together; the turning together and the scatter can only be seen in the game.

## Plants and fish (2026-11-15, D150, 11.8)

- **Read from FishBase's own sentences,** every species' page fetched and searched for vegetation, weed, macrophytes,
  water plants; then cut by hand to the clear cases. **Left out:** the ruffe's "lives" (its page says it prefers water
  _without_ vegetation; it still spawns on weed), the bleak's and chub's spawning ("occasionally", "rarely"), the chub's
  "lives", the brown trout, grayling, barramundi and archerfish (they keep under _overhanging_ bank plants), the lumpfish
  (sea-weed), the snow trout (it eats plants). **Added:** the stone loach, which "breeds among aquatic vegetation".
- **Which plants doesn't matter,** only whether a spot has any: real fish keep to weed beds, not to one species of
  plant. A marimo counts as a plant.
- **Twice as likely** at a spot with plants is a guess. Most of the lake's spots have plants in their lists, so it
  mostly shifts the balance between weed fish and others there; the open and deep water have fewer.
- **The marimo's Luck counts only for events,** since that's all Luck does yet.

## Spawning (2026-11-15, D149, 11.7)

- **About 2 °C a step of the weather's scale** is my reading of its words (cold 1-3, moderate 4-6, just right 7-9,
  warm 10-12, hot 13-14). The water's floor is level 1, so a fish that spawns colder still (burbot, polar cod, icefish)
  spawns at the coldest water there is.
- **Where sources disagreed, the helpers picked one,** and each fish's `from` keeps the °C used: capelin (10-12.5 °C, out
  of 2.8-13.7 by stock), channel catfish (18-27), pumpkinseed (16-18), rainbow trout (4-10), perch (FishBase's own
  "7-8 °C", narrow; its records run 6-16), Arctic char (an autumn record, 5-6 °C).
- **Single thresholds got 4 °C added** for the top of the window (roach, rudd, chub, wels, gudgeon, ide, weatherfish,
  and others); and **the eel's** 20-24 °C is the Sargasso Sea's, which no lake in this world reaches, so it never spawns
  here. That may be right.
- **Known only by their season (25),** mostly tropical and rift fish: spring is warming water at 3-7, summer warming at
  8-12, autumn cooling at 4-8, winter cooling at 1-3, the rains warming at 10-14. Marked by `from: "season: ..."`.
- **No spawning at all (12):** the coelacanth, the stingray (both live-bearers), the goliath tigerfish, the yellow lab
  cichlid, frontosa, the four-eyed fish, the mudskipper, the hillstream loach, peacock bass, mangrove jack, silver
  arowana, tiger shovelnose: all year round, by the rains, or no record.
- **Tripled** in the tables while spawning, schools too: a guess. With 110 species having a window, a fair few gather at
  once in spring; the sim didn't measure it.
- **Not shown anywhere,** as you asked; a perk or an item to read it is for later.

## The adjustable line (2026-11-15, D148, 11.6)

- **How it's found:** in the common treasure at weight 2, like the other gear. Its name and text are placeholders.
  Say if it should come from a vendor instead.
- **The button sits on the action bar** after the abilities, with the depth's first letter (S, U, L, B; a dash when
  unset). It isn't a perk, so it has no cooldown; it's greyed while the line is out.
- **The window** draws the line as a dashed line with the four depths on it. There's no "unset" choice: once set, a
  depth stays until another is picked. Say if you want a way back to "every depth alike".
- **The numbers** are the plan's (+10, −10) and 5% for the bottom's extra non-fish, guesses.
- **Kept when the line comes off:** the depth is remembered, and counts again when it goes back on.

## How each fish swims (2026-11-15, D147, 11.5)

- **Claude's numbers, from what the fish do,** not looked up: there is no published "swimming speed in pixels".
  Each fish starts from one of seven ways of swimming, then gets its own: the pike rests 75% of the time and lunges at
  7× its cruise; bleak cruise at 22 px/s and dart; eels and lampreys wind 3 px; trout and grayling hold still half
  the time, as if against the current. All in `swim` in each fish file.
- **Not watched by eye:** the browser checks pass with no errors, but a still screenshot can't show motion. Worth a
  look in the aquarium or the dive: whether the pike's lunge reads, and whether the resting fish look alive or stuck
  (they drift a fin's worth while resting).
- **The winding is drawn only:** an eel's body goes up and down on screen, but where it is (and what a tap hits)
  follows its straight path.

## Weight from length (2026-11-15, D146, 11.4)

- **The numbers are FishBase's,** read straight from each species' summary page (the raw pages are kept locally). Many
  are FishBase's own estimates from relatives rather than measurements of the species; each fish's `from` says whose.
- **Two look heavy for the real fish:** the **marbled lungfish** comes out at 52 kg at 2 m (the real one is nearer
  17 kg), FishBase's estimate for its body shape; and the **electric eel** did too (118 kg at 2.5 m), so it borrows the
  European eel's numbers instead and comes out near 20 kg. Say if the lungfish should borrow too.
- **The Blackfish is read as the Alaska blackfish** (_Dallia pectoralis_), since it sits among the swamp's other
  air-breathers in the rift. If you meant another blackfish, say which.
- **The goonch** is listed on FishBase as _Bagarius bagarius_, whose page _B. yarrelli_ opens; its numbers are that page's.
- **The giant freshwater stingray** is weighed by total length, tail included, as FishBase gives it: 389 kg at 3 m.
- **The strange fish weigh as their kin would**, so the 6.4 m Strange shark weighs nearly two tonnes. Marked
  placeholders; the rift's magic may want them lighter or heavier.
- **The spread, ±10%,** is a guess. A class fish is always at 1.
- **Weights read** "850 g", "4.3 kg", "17 kg": grams under a kilo, one decimal under ten kilos.

## Obsidian and the background setting (2026-11-14, D144, D145)

- **Pattern is the default** for both themes; Plain is the page's colour alone, as on the loading screen.
- **The obsidian is drawn, not photographed:** the photo, shrunk and blended into a repeating tile, lost the glass and
  became dark blotches. The drawn one keeps what reads as obsidian at this size, the ripple lines of its fractures.
  The four shells, their ripple spacing and the facet lines come from a fixed seed in `tools/obsidian.py`; change
  `SEED` for another arrangement. It repeats every 480 CSS pixels, and the shells mark the repeat if you look.
- **An art trial, ripples against banded:** `npm run obsidian banded` makes the other, from a photo of flow-banded
  golden-sheen obsidian: horizontal bands with a speckled sheen, busier and a little brighter, its light patches near
  the panels' colour. The ripples stay in until you choose; `npm run obsidian` puts them back.
- **Its brightness:** the ripples peak at about the dark theme's panel edge colour. Say if it should be fainter or
  bolder, or the swells darker.

## The first load and the pine tabletop (2026-11-14, D143)

- **Pine, not oak:** both were made; at 32 pixels a board the oak photo's coarse grain turned blotchy. `npm run planks oak`
  puts it in, if you want to compare in the game.
- **Three boards, 96 CSS pixels each,** three CSS pixels to one of the tile's. The tile repeats every 768 CSS pixels
  across; a light patch in the top board marks the repeat if you look for it.
- **The grain is softened** to read behind text, and a smoothing pass removed specks the photo left.
- **Licence:** the pine photo is CC BY-SA 3.0, so the tile in `styles.css` is shared under it. Its author isn't
  given on the file's record that the tool fetched; `assets/CREDITS.md` points at the file page.
- **A gap found on the way:** the fish and item icons drawn from Commons photos (D97) aren't credited anywhere in
  the repo; their sources were only in the local, untracked `docs/design/refs/credits.csv`. Many of those photos are
  CC BY or CC BY-SA. Worth adding them to `assets/CREDITS.md` before the game is shared more widely.
- **Loading:** if the game's scripts never arrive (no network for the graphics library), the page now stays a blank
  background, where before it showed empty frames. Neither tells the player anything; a line of text could.

## Event pictures as portraits (2026-11-14, D142)

- **The default scroll** is from a public-domain photo of a medieval rotulus (Bern, Burgerbibliothek Cod. 803), found
  after five rounds of Commons searches: most "scrolls" there are Japanese hanging scrolls or flat papyri. The draft
  tool lost the rolled top and the writing, so the shapes were drawn as code from the photo, in the draft's colours.
  It's a first draft for your markup: `npm run sprite export icon-event-scroll`.
- **The frame:** a round portrait left of the title, in the legendary orange (`--rarity-legendary`) with a thin
  dark inner ring. WoW's quest portraits have a gold ring; say if it should be gold, or bigger, or sit over the
  dialog's top edge instead of inside it.
- **Size:** the 64 pixels at about one and a half times a bag slot's scale, whole device pixels (`--portrait`).
- **Every event shows a portrait now,** the scroll when it has no picture of its own, so the dialog is never bare.

## How fish fight (2026-11-14, D141, 11.3)

- **Which style each fish has** is Claude's, from what it knows of the real fish, not looked up. The ones most
  worth a look: roach, chub, ide and the small silver fish as **jumpers** (they flip at the surface, but hardly fight);
  bluegill and pumpkinseed as **head-shakers** (they circle more than shake); lake trout, char and the whitefish as
  **long runners**; mangrove jack as a **bottom-hugger** (it dives for the snags, which is its fame). The made-up
  strange fish are placeholders. The whole list is in the fish files (`fights`).
- **The famous fighters (35% manoeuvre):** pike, Cassalan pike, muskellunge, huchen, taimen, asp, the salmon,
  smallmouth and largemouth bass, golden dorado, silver carp, common carp, grass carp, wels, both big sturgeons; and in
  the rift arapaima, barramundi, payara, peacock bass, goliath tigerfish, bull shark, golden mahseer, mangrove jack,
  giant freshwater stingray. Everyone else 5%.
- **The numbers are guesses:** each style's tilt (±1, −2, natural 1–2), the 1.5 s to answer a manoeuvre, its delay of
  0.5–1.2 s after the strike, the Rogue's +2.
- **Long runner without a line:** "harder on a light line" became "−2 with no line equipped", since lines have no
  strength yet. A line's strength could come later.
- **Striking before the fish moves throws the hook.** That makes a nervous double tap costly. Say if a tap before it
  moves should just be ignored instead.
- **The manoeuvre only happens when the roll would have landed the fish;** if the roll failed, the fish simply got
  away, as before. So it can only ever cost a catch, and the Rogue's +2 is what pays them back.
- **The roll's line shows the tilt as "its fight",** not the style's name, so the log doesn't give the style away
  before the journal does. The text over the bobber during a manoeuvre ("It leaps!", "It dives for the weed!") does
  hint at it.
- **The calming items:** Calming draught at the Alchemist for a waterweed, a pebble and a vial, 10 casts; the
  Paralysing rod in the common treasure at weight 1, its downside +6 scatter (every item with an upside has one,
  R8.5). Names and texts are placeholders.
- **Balance:** the sim's catch rates didn't move, but it strikes in 250–900 ms, mostly fast; slow strikers will feel
  the bottom-huggers and rollers more.
- **Not checked in a browser:** the manoeuvre's splash and its text over the bobber. The engine's side has unit tests,
  but no browser check reaches a manoeuvre, since one can't be forced from the dev bench yet.

## Endangered fish and the Conservationist (2026-11-14, D140, 11.2)

- **Which fish, two per spot.** The status belongs to the species, and many fish live at several spots, so the picks
  had to overlap exactly for every spot to have two:
  reedy shore: Common carp, Muskellunge · swamp: Mainland eel, Mainland mudminnow · still water: Common carp, Grass
  carp · rocky shore: Frostfin char, Wildlands perch · open water: Mainland whitefish, Omul · deep water: Lake
  sturgeon, Frostfin char · upper river: Huchen, Taimen · lower river: Lake sturgeon, Golden dorado · river mouth:
  Mainland eel, Lake sturgeon. **The Mage Tower's first pool has only one** (Golden dorado): any second pick there
  would have given another spot three.
- **What the lookup confirmed** (web searches, secondary sources citing the Red List; the Red List's own pages didn't
  come up): European eel, critically endangered; lake sturgeon, endangered since 2022; huchen, endangered; Siberian
  taimen, vulnerable (an older source says critically endangered); European mudminnow, vulnerable. Common carp:
  sources disagree (vulnerable in one, least concern in another).
- **Not confirmed, picked from memory or to make up the two:** Mainland whitefish and Omul (searches found nothing);
  Golden dorado (nothing found; threatened in parts of its range, as far as I know); and four that are, as far as I
  know, **not** threatened in our world and are there only to fill a spot's second place: Muskellunge, Grass carp,
  Frostfin (Arctic) char, Wildlands perch.
- **Really threatened, but left out to keep to two per spot:** the Sterlet and the Frostfin (Siberian) sturgeon, both
  on the Red List; flagging either would give the river mouth three or four.
- **Rift fish, three:** Coelacanth, Giant freshwater stingray (endangered in the sources found), Golden mahseer
  (endangered in one source). The coelacanth's status didn't come up in the searches; critically endangered from memory.
- **Both ways of letting go count:** from a fish's options, and when a full bucket makes you choose. Not in town.
- **The first 20 releases show almost nothing:** Luck is hidden, so the 10th and 20th only log a hint ("The water
  seems to think better of you."), a placeholder; the other 18 log nothing beyond the release.
- **A fish let go can be caught and let go again,** and counts again. The pool makes that easier than before
  (Recall, the dive).
- **The tooltip line is red** ("Endangered"), the tone used for bad effects. The perk's description is a placeholder.

## The fish under the surface, and Look Underwater (2026-11-14, D139)

- **Every spot now starts with 5 to 15 fish in its pool, for every class,** as you chose. A pool fish comes back on
  the line with a chance equal to the pool's size in percent (the old rule for fish that got away), so roughly one
  bite in ten is now a pool fish. Those fish were rolled when the pool was stocked, so they follow that moment's
  time and weather, not the cast's. Not measured with the balance sim yet.
- **"Tops up with time":** one fish per game day, up to the number first rolled. The rate is a guess
  (`content/rules/pool.json`).
- **"Reroll new season" keeps the fish you've met:** only the stocked fish nobody has hooked are replaced; one that
  got away or was let go stays, with its tries. Otherwise a season would wipe the "seen before" fish.
- **"Roll anew under 2":** a fresh 2d6+3 is added on top of the one fish left.
- **A stocked fish isn't "seen before"** when it bites, unless the wizard has looked at it. Once it gets away it is
  an ordinary fish that got away.
- **Recall** ("one that got away here before") picks from the fish you've met, if there are any, and only otherwise
  from the stocked ones.
- **The dive's other fish are the pool's own now,** back in the pool if not caught; it only rolls new ones if the
  pool is too small.
- **Shadows on the water:** up to 12 of the pool's fish, each milling in its own small patch. They are the small
  swimming sprites, the same as a school's, so a sharp eye can tell a pike from a roach from the bank.
- **The look's "shadow" is the fish's darkened bank view, not a flat black shape,** because that is what the drawn
  fish have for a shadow. It hides the colours, but the outline still gives the kind away. Say if it should be a
  flat silhouette.
- **Each fish keeps its own look count,** as you suggested. A fish that joins the pool later starts at none.
  On the third look the species goes in the journal as "known to be here" and the log names it; fish in the view
  can't be tapped for a tooltip.
- **The cooldown is 10 casts** (Summon Fish's), and the look can't be started while a line is out. A reload during
  a look is back on the bank; the look still counted.
- **The eye** is four green rings darkening to the corners, a placeholder (CR-8). **The plants** in the view are the
  ones in the spot's and location's `stuff` lists; a spot with none has bare sand.
- **The perk's name, "Look Underwater", is from your words;** its description is a placeholder.

## Taste (2026-11-14, D138, 11.1)

- **The grades are Claude's reading of each fish's reputation at the table,** not a measured thing: 18 delicacies
  (burbot, eel, the sturgeons, zander, walleye, whitefish, char, salmon, vendace, sea lamprey among them), poor for the
  bony or muddy (roach, rudd, chub, dace, nase, the mudminnows, bowfin). Pike is **plain**: good meat, counted down for
  its bones, as the plan's "bony pike" asked; carp is plain too, for the mud. Each is one word in the fish's file.
- **The taste lines for real species are written as facts, from memory, not checked against a source.** The ones
  most worth a second look: barbel roe being poisonous, raw eel blood being poisonous, grayling smelling of thyme,
  smelt smelling of cucumber, the coelacanth making people ill, the icefish's colourless blood, a king dying of
  lampreys, chub as "cotton wool stuffed with needles".
- **Six lines are placeholders, marked:** the five strange fish, and the **Blackfish**, since Claude doesn't know
  which real fish it is. Tell Claude and it gets a real line.
- **The numbers:** a bowl's minutes and a raw fish's casts times 0.5 (poor), 1, 1.25, 1.5 (delicacy), so a raw
  fish's buff lasts 3, 5, 6 or 8 casts. Parasites: 5% for a low risk, 20% for a high one. **Queasy** (a placeholder
  name): −2 Fishing Skill for 8 casts.
- **Which fish are a high risk:** the pikes and perches (pike, Cassalan pike, pickerel, muskellunge, perch, yellow
  perch, walleye, sauger, ruffe), burbot, roach, ide and dace, the snakehead, the weatherfish and the eel (for its
  blood). Loosely after the real hosts of fish tapeworm and liver fluke; every other freshwater fish is low. Zander
  is low, which is a guess.
- **Rift fish carry no risk at all,** as you chose, though many are real freshwater fish (arapaima, pacu, piranha).
- **A bowl teaches the taste of one fish it didn't know before, if there is one,** rather than any fish at random:
  otherwise a pot of ten roach and one sturgeon would nearly always say "roach" again. Only that one fish's taste
  becomes known.
- **The parasite risk is never shown,** before or after: only the Queasy debuff and its log line tell. The eel's
  line gives its own away.
- **The raw fish's log line lost "Not bad."** (Claude's placeholder), since the taste line now follows it.
- **The tooltip and the journal show the grade as well as the line:** "Taste: Poor", then the sentence.

## The title screen under the water (2026-11-14, D134)

> _Owner_: Are all fish behaviors implemented later than the title screen present on the screen?

## The night, the town and the stew (2026-11-14, D123–D129)

Built overnight from your brainstorm (`docs/brainstorm-2026-11-14.md`). Everything Claude made up is marked as a
placeholder (D124): `docs/placeholders.md` lists them all, and `?ph` in the address puts a ° after placeholder text in
the game.

> _Owner_: All these neat parameters you've introduced are listed somewhere, right?

### Calls Claude made

- **The dive** (D128): the fish's dice are the player's d20 over it (ivory) and the fish's under it (teal), for 1.6
  s; caught fish swim off when their dice go. A full bucket holds one back for the usual choice; more get away.

  > _Owner_: Player's under, fish over - like above water

- **The date** on the button row is "Fri, Spring 5"; the first day of the first spring is a Monday.
  > _Owner_: The first day of the first spring should be rolled (as a DM I would do 1d8, reroll on 8). And the player doesn't know the day of the week by default, hide the value. We will use it in places, but these are Earth-English names and useless most of the time in the UI.

## Class fish (2026-11-11, D114)

- **Log lines** (`src/strings.js`, `log.champion-*`): "A Witch Gigantic Northern pike rises to the surface. It won't
  leave until it's caught.", "The Knight … comes to the rescue: advantage on the fish's roll.", "The Rogue … snatches
  {item} before you can reach it.", "It had stolen {item}. Yours again." The Rogue's moving isn't logged; the scene
  shows it.
  > _Owner_: When a fish has a class, skip the size in logs because it's a mouthful.

## Sets and the old lorebook (8.7, D111)

- **The old lorebook is a placeholder,** three "sodden pages" (stuff, white, unique, weight 1 in their spot's junk): deep
  water at the Lake, the river mouth, the Mage Tower's first pool. Their text is your story from `docs/ideas.md`, cut
  down to three sentences by Claude: rewrite freely (CR-10).
- **The scholar** turns up whenever the player holds a page, at most every 100 casts, and takes all three for 100 XP and
  ten worms. Placeholder words and reward.
- **A page reads in its tooltip,** under a line, rather than in a dialog of its own. A longer text may want a reading
  window.
  > _Owner_: Add reading windows to the plan. Right click to read.

## Event words for counters, fish, visitors, holding and trading (7.6–7.10, D108)

- **Junk worth 0 still goes in a trade,** adding nothing. (What counts as junk is settled: D112.)
  > _Owner_: Which trades specifically?
- **The junk collector's rewards are a placeholder** (`content/tables/junk-collector.json`): worms or maggots for
  junk worth under 5, more bait from 5, the straw hat or horsehair line from 15, the willow rod from 30.
  > _Owner_: Now that we have white items, she can trade junk for white items, specifically the ones other vendors want: pebbles, fish scales etc.
- **Being moved by an event doesn't count as arriving,** so a `trigger: arrive` event there waits for the next
  arrival.
- **Locked, the map greys out the other locations** and says "Something keeps you here. You can't leave yet." The
  event that locks should say why (R10.8).

## The last level 3 and 5 perks (6.3, D106)

- **The chances are Claude's:** a rift fish one fish in ten with Rift Fishing (one in five with Bend Reality too), and
  a Greedy fish one in ten. A Greedy fish's catch is rolled like a cast with no fish, so it can be the empty hook, and
  then the fish isn't Greedy after all.
  > _Owner_: All these numbers are knob that we will eventually start turning during balancing, do you keep a list of knobs somewhere?
- **The marks in the names are placeholders (CR-12):** "Greedy" before the fish's name in the log line that catches it
  (the fish in the bucket is a plain one), and "Bent" for good, in the bucket too. A bent fish never stacks with a plain twin.

  > _Owner_: There is no need to make bent fish any different. Reality was bent, but the fish is like all others.

- **A rift fish's log line,** "For a moment the water was somewhere else: this fish is not from here.", is Claude's.
  > _Owner_: Just "this fish is not from here." straight after the catch line in the log.

## Dice over the scene (D99)

(`ROLL_MS`, `HOLD_MS`, `FADE_MS` in `src/scene/dice.js`). First guesses.

- **The log waits for the dice**, so it doesn't give the result away before they land. The bucket's count and the XP
  bar don't wait; they change at the strike.
  > _Owner_: can we have all of them wait?
- **The die**: dark ink on ivory (the colour is settled), 35 pixels across, numbers in a 3×5 pixel font, upright on the page whichever way
  the face is turned. A natural 20's number is red, and its total floats up gold. The colours are `DICE_COLOURS`.
  > _Owner_: 20 should be gold for the player (like splash screen), red for opposing die.

## The pond from a photo (art sheet trial, `src/scene/pond.js`)

- **Fifty named colours,** far more than the game's scene uses, to get close to the photo. A real spot would want them
  cut down.
  > _Owner_: Is the number of colors we use in general a potential issue? I don't believe so, not for scenes anyway, but we should keep a style guide for ui - correct?

## Perks and abilities (Phase 6, D96)

- **Gut finds what a cast with no fish would:** the treasure roll with your Treasure Find, else junk.
  > _Owner_: is gut working correctly now? We've tinkered with the basics recently

## How the art is made (4.6, D90)

- **The style rules in `docs/art.md`** were read off the sketch and the art so far: hard pixels, a small named
  palette, drawn for a clear spring noon, depth by size and paleness, outlines on icons but not in the scene. Worth
  a read, since every later piece of art will follow them.
  > _Owner_: Out of curiosity, what are hard pixels?

## Events (7.1–7.3)

- **The event meter** is the prototype's: a d20 per cast, +5 when the hook comes up empty, fires above 100, so about
  one event every 9–10 casts once there are events to fire. When it fires and nothing can happen, it empties anyway.
  It keeps filling while an event is open.
  > _Owner_: This is going to be way too often. Let's cut that sharply: d4 per cast, +1 when hook empty. Do the maths for me, feels right after seeing myself and others play (turns out the main loop is fun enough)
- **Luck and flags change silently;** items and XP get a log line: "You receive: [Iron key]", "You lose: [Bent
  fork]", "You gain 50 XP.". Starting an event writes nothing to the log.
  > _Owner_: I would like all event text that actually happen to go into log, baldur's gate style: Everything the player has read + the dialogue choices they've made. All so the player can review it when they're done.
