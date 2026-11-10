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

- The owner puts it in `docs/design/` (gitignored, local only). A plain background works best: a studio shot, an
  old atlas plate, the thing on a table.
- **No photo?** Search Wikimedia Commons and pick from a contact sheet: `npm run commons search <slug> "Category:<Latin
  name>" shape=wide` for a fish (its category by scientific name), or free words for an item (`"brass doorknob"`).
  Look at `docs/design/commons/<slug>.jpg`, or put several searches on one sheet (`npm run commons sheet <out.jpg>
  <slug>...`) to look at fewer images. Take the whole thing side-on, fins spread, on a plain background; skip a
  plate with several fish unless they're well apart. Then `npm run commons fetch <slug> <n> name=<Name>`: the
  picture at 1280 px in `docs/design/refs/`, its licence and author in `credits.csv` there.
- **A busy background** (weeds, gravel, a hand): cut it out first, `npm run cutout <photo> [flip=<Name>]`, onto
  magenta in `docs/design/cutouts/`. `flip` mirrors a fish that faces right, by file name (D98). It keeps only the
  biggest piece, so a matchbox or a second fish beside it goes; `all=1` keeps everything. The first time, `npm run
  cutout setup` (a Python environment, `.venv-cutout/`; the cut-out model downloads on first use). Check the facing on
  the cut-out, not the small preview: it's easy to misread there.
- Look at the photo **once**, to know what matters (for a fish: the eye, mouth, fins and their colours, the scale
  pattern, how the back shades to the belly). Note it in a line or two; don't open it again.

## 2. The first draft: one command

```bash
npm run photo-icon docs/design/photo-<thing>.jpg name=icon-fish-<id>
npm run photo-icon docs/design/cutouts/<Name>.png name=icon-fish-<id> bg=ff00ff eye=1   # a cut-out fish
```

Options, only when the draft needs them:

- `eye=1`: a fish's eye, placed for you (a 2×2 a tenth of the length in from the snout; dark with a glint on a light
  head, a light ring on a dark one). Check it: some come out comic, too far back on a long snout, or on the back's
  edge (9.7). Its colours are `x` and `e`.
- `margin=1`: empty pixels kept round the edge, so nothing touches the square's edge (the default).
- `bg=ff00ff` for a cut-out: magenta is the background, so silver scales aren't mistaken for it.

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

- **The eye**: `eye=1` places it; move it by hand if it looks off. 2–3 pixels: a dark pupil (`#141414`-ish) with a
  light ring pixel or two above or behind. It is what makes a fish read as a fish at ×3.
- **Fins**: rays as alternating light and dark pixels along the fin; red, orange or dark fins in their own colour,
  the edge a shade stronger.
- **Body shading**: dark back, lighter flanks, pale belly, as bands. Smooth out speckle the draft left.
- **Pattern** (scales, spots, stripes): a regular pattern in a shade darker, on the upper body only at 32: every
  other row, every second or third pixel, rows offset. A full net reads as noise at this size.
- **Mouth, lips, barbels, gill line**: a pixel or two each, only where they show in the photo.
- **Palette**: merge near-duplicates; every colour gets a short comment saying what it's for. The tool prints a
  first guess from how dark and strong each colour is; correct the ones that are wrong.
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
