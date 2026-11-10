---
id: the-scholar
title: A scholar on the shore
trigger: needs
again: 100 casts
needs: set old-lorebook 1
---

## start
A thin figure in ink-stained robes is waiting by your things. "You've found pages of the old lorebook. I'd give a
great deal for the whole of it."

- Hand over all three pages -> thanks
  needs: set old-lorebook all
  lose: set old-lorebook
  gain: 100 xp
  gain: 10 worms
  set: lorebook-given
- Not yet -> end

## thanks
"At last. The valley, the dragons, the flood: it's all here." The scholar presses a purse of bait into your hands
and hurries off.

- Farewell -> end
