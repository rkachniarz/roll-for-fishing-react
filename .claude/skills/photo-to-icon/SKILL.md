---
name: photo-to-icon
description: Turn the owner's photo of a fish or item into a 32×32 game icon (D97, D98) - a tool run for the first draft, one hand pass, then the owner's markup. Use when the owner gives a photo and asks for an icon, or asks to redraw one of the old 16×16 icons from a photo.
---

# A photo to a 32×32 icon

The cheap, repeatable route from a photo to an icon in `src/scene/icons.js`. The tool does the mechanical half; you do
one hand pass; the owner marks it up. Keep to that order: most of the cost is in looking at images and in rounds of
fixes, so look at as few images as possible and leave the fine judgement to the owner's markup.

Scenes (spots) are not this skill: they are few, and each is drawn as code from its photo like `src/scene/pond.js`.

## 1. Get the photo

- The owner puts it in `docs/design/` (gitignored, local only). A plain background works best: a cut-out, a studio
  shot, the thing on a table. If the background is busy, ask for a cut-out rather than fighting it.
- Look at the photo **once**, to know what matters (for a fish: the eye, mouth, fins and their colours, the scale
  pattern, how the back shades to the belly). Note it in a line or two; don't open it again.

## 2. The first draft: one command

```bash
npm run photo-icon docs/design/photo-<thing>.jpg name=icon-fish-<id>
```

Options, only when the draft needs them:

- `angle=30`: how far it's turned; positive lifts the left end. Fish lie tilted ~30° (D98), head up and left if the
  photo faces left. Items usually `angle=0`, or whatever fills the square best.
- `colours=12`: its own palette size. 10–14 for a detailed fish, fewer for plain things.
- `detail=90`: how readily a pixel hiding something much darker is darkened a shade (0 for off). Lower picks up more
  texture and more noise.
- `bg=rrggbb` / `cut=36`: if the background isn't the corners' colour, or the cut-out eats the edges or keeps a halo.

It writes `art/<name>.png` (real size, magenta background) and `art/<name>-big.png` (enlarged ×12), and prints the
palette and the grid as code. Look at `-big.png` only, never the real-size one.

## 3. One hand pass

Fix what averaging can't carry, in **one** edit (a short script over the grid, or Edit on the pasted rows), then look
at the result once. What the carp needed (`fish/carp`), and most fish will:

- **The eye**: always by hand. 2–3 pixels: a dark pupil (`#141414`-ish) with a light ring pixel or two above or
  behind. It is what makes a fish read as a fish at ×3.
- **Fins**: rays as alternating light and dark pixels along the fin; red, orange or dark fins in their own colour,
  the edge a shade stronger.
- **Body shading**: dark back, lighter flanks, pale belly, as bands. Smooth out speckle the draft left.
- **Pattern** (scales, spots, stripes): a regular pattern in a shade darker, on the upper body only at 32: every
  other row, every second or third pixel, rows offset. A full net reads as noise at this size.
- **Mouth, lips, barbels, gill line**: a pixel or two each, only where they show in the photo.
- **Palette**: merge near-duplicates; every colour gets a short comment saying what it's for.
- **Outline**: `k` all round, one pixel, no gaps; nothing touches the square's edge.

Stop after that pass. Don't chase perfection: the owner's markup is the next step, and it's cheaper than guessing.

## 4. Into the game

1. Paste the grid into `src/scene/icons.js` in the `Object.assign(ICONS, { … })` **after** `DRAWN_AT_16` (so it isn't
   doubled), named `fish/<id>` or `item/<id>`, and its colours into `OWN_KEYS` under the same name. Comment where it
   came from (`from a photo (docs/design/photo-<thing>.jpg, D97)`).
2. Set `"icon": "fish/<id>"` in the content file (`content/fish/<id>.json`), then `npm run content`.
3. `npm test` (checks the size, the keys and that the icon exists), then `node tools/verify.mjs "art sheet"` and look
   at the icon on `dist/verify/art.png`.
4. Delete the files in `art/` that the tool wrote; `npm run sprite export icon-fish-<id>` makes a fresh one when the
   owner wants to mark it up.
5. Add a line to `docs/REVIEW.md` for anything you guessed (colours merged, a fin invented where the photo hid it).

## 5. The owner's markup

The owner runs `npm run sprite export icon-fish-<id>`, draws on `art/icon-fish-<id>.png` in Paint, and says so.
`npm run sprite import art/icon-fish-<id>.png` prints the grid against the icon's own palette (the file name picks
it); new colours are listed with their nearest. Read the markup by eye from the import's grid rather than opening the
image where you can, apply it, snap near-misses, and ask about colours that are really new.

## Stranger fish

The lake's magic changes fish as the game goes on (D98). For a changed fish, start from the ordinary fish's icon, not
a new photo: copy its grid and palette under the new name, then change what the magic changed (a glow colour, extra
eyes, odd fins). Ask the owner what the change is before drawing it.
