---
id: alchemist
title: The Alchemist's shop
trigger: arrive
once: false
needs: location town
needs: spot alchemist
placeholder: true
---

## start
[vendor alchemist open: Jars of murky things line the walls. The Alchemist peers at you over their spectacles. "Brought me something?"]
[vendor alchemist asleep: The door is locked. Through the window you can see the Alchemist asleep in a chair, snoring.]
[vendor alchemist away: A note is nailed to the door: "Off to get ingredients. Back when I'm back."]
[vendor alchemist closed: The shutters are down. A sign says: "Friday to Sunday. Not before one."]

- Let's trade -> end
  needs: vendor alchemist open
  shop: alchemist
- What do you want with all these shiny pebbles? -> pebbles
  needs: vendor alchemist open
  needs: count trades-alchemist 5+
- I'll wait here -> start
  needs: vendor alchemist asleep
  wait: 2 hours
- Leave -> end

## pebbles
The Alchemist turns a pebble over in their fingers. "Wouldn't you like to know." They put it in a drawer with a lot
of others, and lock it.

- Fair enough -> end
