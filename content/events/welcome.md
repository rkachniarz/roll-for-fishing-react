---
id: welcome
title: A familiar shore
trigger: arrive
needs: location lake
placeholder: true
---

## start
Morning mist lies on the water. You know this shore, though you couldn't say from when. Your rod is in your hand
and your boots are wet. Who were you, before you came here?

- A fisher's [gender f: daughter | son] from the coast -> coast
- A squire who failed [gender f: her | his] knighthood -> squire
- A hedge-witch's apprentice -> witch
- I don't remember -> forgotten

## coast
Salt in your blood and a knot for every occasion. The lake is just bigger, quieter water.

- Off to fish -> end
  set: background-coast
  gain: 5 worms

## squire
You still stand like someone is about to inspect your armour. Nobody is. It's a relief.

- Off to fish -> end
  set: background-squire
  gain: 2 luck

## witch
You know which weeds are good for what, and which ones bite. Your old mistress made you carry her vials.

- Off to fish -> end
  set: background-witch
  gain: 2 alchemists-vial

## forgotten
There's a gap where your past should be. Something about a town nearby, and an inn, and all your money.

- Off to fish -> end
  set: background-forgotten
  gain: 1 shiny-pebble
