---
id: inn-morning
title: The inn
trigger: arrive
once: false
needs: location town
needs: spot inn
needs: flag inn-morning
# After a night's sleep, at the inn or in the room (D165): the sleep sets the flag and goes down to the inn.
placeholder: true
---

## start
Morning light falls through the shutters. The innkeeper is stirring the great pot over the fire.

"Mornin'! Don't you go setting off on an empty stomach, now."

- The perpetual stew -> end
  clear: inn-morning
  shop: stew
- Leave -> end
  clear: inn-morning
