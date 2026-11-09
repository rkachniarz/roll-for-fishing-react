// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FACES, NORMALS, NUMBERS, VERTS, apply, restPose } from '../src/scene/d20.js';

test('a d20 has every number once, opposite faces adding up to 21', () => {
  assert.deepEqual([...NUMBERS].sort((a, b) => a - b), Array.from({ length: 20 }, (_, i) => i + 1));
  NORMALS.forEach((n, i) => {
    const opposite = NORMALS.findIndex((m) => Math.abs(n[0] + m[0]) + Math.abs(n[1] + m[1]) + Math.abs(n[2] + m[2]) < 1e-9);
    assert.equal(NUMBERS[i] + NUMBERS[opposite], 21);
  });
});

test('at rest, the number rolled faces the viewer, its triangle pointing up (D99)', () => {
  for (let number = 1; number <= 20; number++) {
    const pose = restPose(number);
    const face = NUMBERS.indexOf(number);
    const n = apply(pose, NORMALS[face]);
    assert.ok(n[2] > 0.999999, `${number} faces the viewer`);
    // No other face is turned as far towards the viewer.
    NORMALS.forEach((m, i) => i !== face && assert.ok(apply(pose, m)[2] < 0.8));
    const corner = apply(pose, VERTS[FACES[face][0]]);
    assert.ok(Math.abs(corner[0]) < 1e-9 && corner[1] > 0, `${number}'s first corner is straight up`);
  }
});
