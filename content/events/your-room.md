---
id: your-room
title: Your room
trigger: arrive
once: false
needs: location town
needs: spot room
placeholder: true
---

## start
A narrow bed, a chair, a window over the lake. It's yours, apparently.[perk aquarium: The aquarium bubbles away in
the corner.]

- Sleep until morning -> end
  sleep:
- Look at the aquarium -> end
  needs: perk aquarium
  shop: aquarium
- Go back down -> end
  go: town inn
- Leave -> end
