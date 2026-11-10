---
id: quest-bottle-reward
title: A package on the line
trigger: needs
needs: flag bottle-paid
---

## start
Something is tangled on your line: a small package, with your name on it.

- Open it -> end
  clear: bottle-paid
  set: bottle-done
  gain: horsehair-line
  gain: 25 xp
