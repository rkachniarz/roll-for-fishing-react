// @ts-check
// The shape of a twenty-sided die, which number is on which face, and how to
// turn it so a given number faces the viewer. Pure geometry: no canvas, no
// PixiJS, so a test can check it on its own. dice.js draws it.
//
// The vertices, faces and numbering are ported from SuperRollies (src/d20.js,
// src/polyhedra.js), where a physics engine rolls it; here a die only has to
// look as if it rolled and come to rest on the number the engine already
// rolled (D63).

/** @typedef {[number, number, number]} Vec */
/** A rotation as a 3×3 matrix, row by row. */
/** @typedef {[Vec, Vec, Vec]} Mat */

/** @param {Vec} a @param {Vec} b */
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
/** @param {Vec} a @param {Vec} b @returns {Vec} */
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
/** @param {Vec} a @param {Vec} b @returns {Vec} */
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
/** @param {Vec} a @returns {Vec} */
const normalize = (a) => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};

// ---------- 12 vertices, 20 triangular faces (SuperRollies) ----------
const PHI = (1 + Math.sqrt(5)) / 2;
/** @type {Vec[]} */
const RAW_VERTS = [
  [-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0],
  [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI],
  [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1],
];

/** Each face's three vertices, counter-clockwise seen from outside. */
export const FACES = /** @type {[number, number, number][]} */ ([
  [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
  [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
  [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
  [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
]);

/** On the unit sphere, so the radius is whatever dice.js scales it to. */
export const VERTS = RAW_VERTS.map((v) => normalize(v));

/** Each face's outward normal. */
export const NORMALS = FACES.map(([a, b, c]) => normalize(cross(sub(VERTS[b], VERTS[a]), sub(VERTS[c], VERTS[a]))));

/**
 * Standard numbering (SuperRollies' numberOpposites): opposite faces add up
 * to 21, and of each pair's two ways round, the one that puts fewer
 * consecutive numbers on faces that touch.
 * @returns {number[]} The number on each face.
 */
function numberOpposites() {
  const n = FACES.length;
  const oppositeOf = new Array(n).fill(-1);
  for (let i = 0; i < n; i++) {
    if (oppositeOf[i] !== -1) continue;
    let best = -1;
    let bestDot = Infinity;
    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      const d = dot(NORMALS[i], NORMALS[j]);
      if (d < bestDot) {
        bestDot = d;
        best = j;
      }
    }
    oppositeOf[i] = best;
    oppositeOf[best] = i;
  }
  const neighboursOf = FACES.map((face, i) =>
    FACES.flatMap((other, j) => (j !== i && other.filter((v) => face.includes(v)).length === 2 ? [j] : [])),
  );
  const numbers = new Array(n).fill(0);
  /** @param {number} face @param {number} value */
  const badness = (face, value) => neighboursOf[face].filter((nb) => numbers[nb] && Math.abs(numbers[nb] - value) === 1).length;
  const seen = new Array(n).fill(false);
  let k = 0;
  for (let a = 0; a < n; a++) {
    if (seen[a]) continue;
    const b = oppositeOf[a];
    seen[a] = seen[b] = true;
    const low = k + 1;
    const high = n - k;
    k++;
    if (badness(a, low) + badness(b, high) <= badness(a, high) + badness(b, low)) {
      numbers[a] = low;
      numbers[b] = high;
    } else {
      numbers[a] = high;
      numbers[b] = low;
    }
  }
  return numbers;
}

/** The number on each face. */
export const NUMBERS = numberOpposites();

// ---------- Rotations ----------

/** @param {Mat} m @param {Vec} v @returns {Vec} */
export const apply = (m, v) => [dot(m[0], v), dot(m[1], v), dot(m[2], v)];

/** @param {Mat} a @param {Mat} b @returns {Mat} a·b: b first, then a. */
export function multiply(a, b) {
  /** @type {Vec[]} */
  const rows = [];
  for (let i = 0; i < 3; i++) rows.push([0, 1, 2].map((j) => a[i][0] * b[0][j] + a[i][1] * b[1][j] + a[i][2] * b[2][j]));
  return /** @type {Mat} */ (rows);
}

/**
 * A turn of `angle` radians about `axis` (Rodrigues).
 * @param {Vec} axis @param {number} angle @returns {Mat}
 */
export function rotation(axis, angle) {
  const [x, y, z] = normalize(axis);
  const c = Math.cos(angle), s = Math.sin(angle), t = 1 - c;
  return [
    [t * x * x + c, t * x * y - s * z, t * x * z + s * y],
    [t * x * y + s * z, t * y * y + c, t * y * z - s * x],
    [t * x * z - s * y, t * y * z + s * x, t * z * z + c],
  ];
}

/**
 * The die at rest with `number` facing the viewer (+z), its face a triangle
 * pointing up (+y): a d20's familiar face-on look, a hexagon with a triangle
 * in the middle.
 * @param {number} number  1-20.
 * @returns {Mat}
 */
export function restPose(number) {
  const face = NUMBERS.indexOf(number);
  if (face < 0) throw new Error(`a d20 has no ${number}`);
  const n = NORMALS[face];
  // Turn the face's normal onto +z…
  const z = /** @type {Vec} */ ([0, 0, 1]);
  const axis = cross(n, z);
  const turn = Math.hypot(...axis) < 1e-9 ? (dot(n, z) > 0 ? rotation([1, 0, 0], 0) : rotation([1, 0, 0], Math.PI)) : rotation(axis, Math.acos(Math.max(-1, Math.min(1, dot(n, z)))));
  // …then spin it about z until its first corner is straight up.
  const corner = apply(turn, VERTS[FACES[face][0]]);
  const spin = rotation(z, Math.PI / 2 - Math.atan2(corner[1], corner[0]));
  return multiply(spin, turn);
}
