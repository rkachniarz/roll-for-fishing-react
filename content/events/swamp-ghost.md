---
id: swamp-ghost
title: The swamp is haunted
trigger: arrive
once: false
needs: location lake
needs: spot swamp
needs: no-flag ghost-at-rest
placeholder: true
---

## start
The mist thickens and the frogs fall silent. Something pale drifts between the dead trees: a child, or the shape of
one, searching the water. It turns towards you, and the cold goes right through your coat.

"Where is she? Where did you put her?"

- Hold out the old torn doll -> doll
  needs: item old-torn-doll
- Back away, slowly -> end
  go: lake reedy-shore

## doll
The ghost goes very still. A small, see-through hand closes on the doll, and the doll is gone, and so is the child.
The frogs start up again. The swamp is only a swamp.

- Rest well -> end
  lose: old-torn-doll
  set: ghost-at-rest
  gain: 50 xp
