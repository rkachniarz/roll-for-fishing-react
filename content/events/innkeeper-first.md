---
id: innkeeper-first
title: The innkeeper
trigger: arrive
needs: location town
needs: spot inn
needs: no-flag met-innkeeper
placeholder: true
---

## start
The inn is warm and smells of smoke and stew. You ask the innkeeper for a room for the night.

The innkeeper gives you an odd look. "In case it slipped your mind, friend, you already gave me every coin you had,
for a room here that's yours for good. Go on up whenever you like. And if you'd eat first, mind the rule of this
house: give something to take something."

- Give something to take something? -> stew
- I gave you all my money? -> money
- Thank you. I'll go up. -> end
  set: met-innkeeper
  learn: spot town room
  go: town room

## money
"Every coin. Walked in soaking wet, put a purse on the counter and said you'd be staying. Then you went fishing."
The innkeeper shrugs. "Not my business what you remember."

- Give something to take something? -> stew
- I'll go up to my room -> end
  set: met-innkeeper
  learn: spot town room
  go: town room

## stew
The innkeeper nods at the great pot over the fire. "The stew. It's been going since my grandmother's time. Put
your fish in, take a bowl out. It'll keep the cold off your bones longer than any coat."

- Let me see the pot -> end
  set: met-innkeeper
  learn: spot town room
  shop: stew
- Maybe later -> end
  set: met-innkeeper
  learn: spot town room
