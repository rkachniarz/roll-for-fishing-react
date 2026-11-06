# Art: how we make it

How the owner and Claude make the game's art together (D90). The owner sketches and chooses; Claude turns sketches
into pixel art, offers options and keeps the look consistent. This guide is for both: the owner's part first, then
the rules the art follows, then Claude's checklist.

## The loop

1. **The owner sketches** what something should be (see "Drawing for this game" below).
2. **Claude draws it** as code, keeping to the sketch and to the style rules below.
3. **Both look at the art sheet**, `http://localhost:8001/art.html` (with `npm run dev` running). It shows every
   sprite enlarged, the scene in five different lights, and any open **trials**: two or three options side by side.
   Any scene on it can be saved as a PNG, to draw over.
4. **The owner says what's wrong or picks an option.** Claude changes it and the sheet shows the new version.
5. **Once settled**, the chosen version becomes the game's and the trial is deleted. Numbers Claude picked go on
   `docs/REVIEW.md`, as everything else Claude decides does (D76).

## Asking for changes

Any plain request works: "make the reeds more dense" is fine. Some kinds of request get there faster:

- **Ask for options.** "Reeds: give me three densities" puts A, B and C on the sheet, and picking is easier than
  describing how much. Options cost Claude nothing.
- **Point at it.** "The left reeds look like a fence; the right ones are fine." A comparison says more than an
  adjective.
- **Say how it should feel**, not how to do it: "lush and overgrown, like nobody cuts the bank" rather than
  "add 12 blades". Claude works out the pixels.
- **Name a reference:** your sketch ("like the top left of my drawing"), or a screenshot of a game whose look you
  like. Claude takes the feel from it, never copies it.
- **Draw on it.** Export the sprite, scribble on it in Paint, and hand it back (below). A rough edit is clearer than
  any description.

## Drawing for this game

There are two kinds of drawing, and both help.

**A sketch** is any size, in any tool, as rough as you like. It says what's there, where it goes and what colour it
is. Write notes on it ("this is a lily pad", "darker here"). Sketches go in `docs/design/` and Claude reads them by
eye. The scene's layout came from `docs/design/sketch-fishing-spot.png`.

**A real-size drawing** is drawn at the size the game uses, pixel for pixel, so it *is* the sprite rather than a
picture of it. This is the most useful thing the owner can draw. In MS Paint:

1. **Image → Resize**, untick "Maintain aspect ratio", choose **Pixels**, and set the size from the table below.
2. **Zoom in** to 800% (View → Zoom), and turn on **View → Gridlines**.
3. Draw with the **Pencil**. It sets one pixel at a time. The brushes blur their edges into in-between colours, and
   so does resizing a finished drawing, so avoid both.
4. Paint the **background magenta** (`#FF00FF`, Edit colours → Red 255, Green 0, Blue 255): that's "nothing here".
   White counts as a colour, since foam and highlights are white. If you've already drawn on white, say so.
5. **Save as PNG** or as **24-bit Bitmap** (.bmp). Never JPEG: it changes colours to save space. Avoid Paint's
   "256 Color", "16 Color" and "Monochrome" bitmaps for the same reason.
6. Put it in `art/` and tell Claude its name.

**Drawing over the scene** is how a whole spot gets worked on. Press **Save as PNG** under any scene on the art sheet
to get that frame at its real 256×256, open it in Paint, and mark it up: paint what you want where you want it, or
scribble and write notes ("lily pads here", "too bright"). Save it in `art/` and tell Claude. Your marks land on real
pixels, so "here" means exactly there. A spot goes round this loop as often as it needs: your sketch first, Claude's
scene from it, then your marks on that scene, then the next version.

Colours don't need to match the palette exactly. Claude snaps near misses to the palette and asks about colours
that are really new.

**To change an existing sprite**, start from the game's own copy:

```bash
npm run sprite list            # every sprite, with its size
npm run sprite export bobber   # -> art/bobber.png, at real size on magenta
npm run sprite export all      # every sprite
```

Type these in a terminal at the root of the repo. Open the PNG in Paint, zoom in, change it, save, and tell Claude.
Claude reads it back with `npm run sprite import art/bobber.png`, which prints the sprite as the code writes it and
lists any colour not in the palette with its nearest match.

## Sizes

The scene is **256×256** and is only ever enlarged by whole steps (×2, ×3…), so a pixel drawn is a pixel shown,
just bigger. On a screen with room to spare, strips either side widen it to fill the width, up to 320 (D93): the water,
the shore line, the waves and the weather carry on into them, and the reeds stand at the outer edges. Nothing the game
places goes in the strips.

| What | Size (pixels) | Notes |
|---|---|---|
| The scene | 256×256, up to 320 wide | Water about the top 86%, the sand below it. The strips either side are scenery only. |
| Bobber | 11×18 near, 9×13 far | The float's waterline is row 14 near, row 10 far. A bite shows only the top 12 / 9 rows (D94). |
| Splash | 15×5, 3 frames | |
| Waves | 5×2 far, 8×2 mid, 12×3 near; 2 frames each | |
| Reeds | 26×110 a side, 2 frames | Drawn by code today: a real-size drawing would replace it. |
| Icons | 16×16 | Items, fish, the button row, the weather. |
| Event pictures | 128×64 (2:1) | Shown in the event dialog, enlarged to fit. PNGs in `assets/events/`. |

Anything at two distances needs **one drawing per distance**. Nothing is shrunk in the game, because shrinking pixel
art smears it (R7.3). The far bobber is its own little drawing, not the near one made smaller.

## Style rules

The look so far, from the owner's sketches. A change to a rule is a decision (`docs/decisions.md`).

- **Hard pixels.** No blur, no soft edges, no half-transparent edges on sprites. Edges are stepped.
- **A small palette.** Every colour has a name (the art sheet lists them). Reuse a colour before adding a new one; a
  colour almost like an existing one *is* that one. A small palette is most of what makes pixel art look like pixel
  art.
- **Drawn for a clear spring noon.** Night, dusk, the seasons, cloud, rain and snow are tints and overlays the code
  lays over the whole scene. Don't draw a night version; check the art sheet's five lights instead.
- **Depth by size, paleness and count** (R7.4). Far things are smaller and paler and there are more of them; near
  things are bigger, stronger in colour and fewer. Water bands blend through a dithered row (a checkerboard of the two
  colours), never a hard line.
- **Outlines: icons yes, scene no.** Icons have a dark outline (`k`) so they read on the page. Weather icons don't,
  because they sit on the dark page as they are. Scene sprites have no outline; the bobber's rim is part of its
  design.
- **The view is from the shore,** looking out, slightly from above. Things on the water lie flat: ripples are
  squashed ovals, flatter further out.
- **Little animation.** Two or three frames, flipped now and then: waves shimmer, reeds sway, the bobber bobs one
  pixel. Movement is in whole pixels.
- **Random but repeatable.** Scattered things (waves, sand streaks, reed blades) are placed by the `scenery` stream
  (D4), so the same seed draws the same scene and screenshots can be compared.

## For Claude: changing art

- Read the owner's sketch or drawing first, and keep to it. Where it's silent, follow the style rules above, and put
  each guess on `docs/REVIEW.md`.
- When the owner's request leaves "how much" open, **offer a trial** rather than one guess: add the knob to
  `SceneLook` (`src/scene/scene.js`), with the game's current value as its default, and add the options to
  `src/art-trials.js`. When the owner picks one, make it the default, delete the trial, and remove the knob unless
  something else uses it.
- A real-size drawing becomes a grid via `npm run sprite import` (`keys=icons` for an icon, `bg=ffffff` for a
  drawing on white). Snap near-miss colours to the palette; ask about genuinely new ones, and name any that stay.
- A marked-up scene from the art sheet's **Save as PNG** is read by eye: compare it with the same scene (its file name
  says which caption and seed) and change the code to match the marks.
- Look before saying it's done: `node tools/verify.mjs "art sheet"` writes `dist/verify/art.png`, the whole sheet.
  Read it, and the scene screenshots in `dist/verify/` when the scene changed.
- A sprite named in `tools/sprite-png.mjs` (`sprites()`) should also be on the art sheet (`src/art.js`), under the
  same name.
- Large pictures, such as event pictures and future backdrops per spot, are the hardest to draw well as code. For
  those, prefer the owner's real-size drawing or a CC0 pack (credited in `assets/CREDITS.md`, D9), fitted to the
  palette.
