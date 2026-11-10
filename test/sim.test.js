// @ts-check
// The balance simulation (DEV_PLAN 9.1) runs on the real engine, and a seed
// gives the same games every time.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { report, simulate } from '../tools/sim.mjs';

test('the simulation plays every class, the same way twice', () => {
  const options = { games: 2, casts: 60 };
  const a = simulate(options);
  assert.deepEqual(Object.keys(a).sort(), ['fish-fighter', 'fishing-wizard', 'rogue-fisher']);
  for (const t of Object.values(a)) {
    assert.equal(t.casts, 120, 'no game stops early');
    assert.ok((t.found.fish ?? 0) > 0 && t.xp > 0);
  }
  assert.deepEqual(simulate(options), a);
  assert.match(report(a, { games: 2, casts: 60, classes: Object.keys(a), strike: [250, 900], perks: 'first' }), /## rogue-fisher/);
});
