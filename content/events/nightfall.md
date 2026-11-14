---
id: nightfall
title: Nightfall
trigger: needs
again: 1 days
needs: time night
placeholder: true
---

## start
The light is gone and the cold comes up off the water. Somewhere behind you, the lights of the town are on, and
the inn's chimney is smoking.

- Head into town -> end
  open: town
  go: town square
- Go straight to the inn -> end
  open: town
  go: town inn
- Stay out here and fish -> end
  open: town
