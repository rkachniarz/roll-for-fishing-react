---
id: frog
title: A froggy encounter
---

## start
You see a frog in the shallow water, just outside your reach.

- Observe it closely -> observe
- Ignore it -> end
- Attempt to catch the frog -> lunge
  needs: class rogue-fisher

## observe
After a moment, a wave of calm washes over you. Everything is going to be alright.

- Thank you, frog -> end
  gain: 2 luck

## lunge
You lunge forward and get wet, and it's like it was never there.

- Well, shit. -> end
  lose: 1 luck
