---
id: quest-bottle-river
title: Someone waiting
trigger: arrive
once: false
needs: spot lower-river
needs: flag bottle-quest
placeholder: true
---

## start
A hooded stranger waits on the bank. "Three roach, as the note said?"

- Hand over three roach -> thanks
  needs: fish roach 3
  lose: 3 fish roach
  clear: bottle-quest
  set: bottle-paid
- Not yet -> end

## thanks
The stranger nods and walks off. "Look on your line next time you fish."

- Wait and see -> end
