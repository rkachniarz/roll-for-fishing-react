// @ts-check
// Options for the owner to choose between, shown side by side at the top of
// the art sheet (art.html, docs/art.md). Each option is a SceneLook
// (src/scene/scene.js): the same seed, so only the knob differs.
//
// When the owner picks one, its value becomes the default in the code, the
// trial is deleted from here, and the knob leaves SceneLook unless another
// trial still uses it. An empty list is the normal state.

/**
 * @typedef {Object} Trial
 * @property {string} id
 * @property {string} question  What the owner is choosing.
 * @property {{ label: string, look: import('./scene/scene.js').SceneLook }[]} options
 * @property {[string, string[]][]} [sprites]  Sprites to show enlarged under the scenes, by name.
 */

/** @type {Trial[]} */
export const TRIALS = [];
