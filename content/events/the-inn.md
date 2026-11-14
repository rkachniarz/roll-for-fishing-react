---
id: the-inn
title: The inn
trigger: arrive
once: false
needs: location town
needs: spot inn
needs: flag met-innkeeper
placeholder: true
---

## start
The fire crackles. The innkeeper nods at you from behind the counter.[time night: " Late one, isn't it?"]

- The perpetual stew -> end
  shop: stew
- Anything warm to wear? -> end
  shop: innkeeper
- Go up to my room -> end
  go: town room
- Sleep until morning -> end
  sleep:
- Anything going on in town? -> town
- Leave -> end

## town
"Not much. [flag knows-alchemist: The Alchemist's in from Friday to Sunday, if you can wake them. | There's an
Alchemist on the corner, from Friday to Sunday. Never before one in the afternoon, mind, they sleep like the
dead.]"

- Thanks -> end
  set: knows-alchemist
  learn: spot town alchemist
