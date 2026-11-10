// @ts-check
// The content editor (DEV_PLAN 7.5, D47): forms made from the schemas, saving
// straight into content/. A page for `npm run dev` (http://localhost:8001/editor.html),
// not part of the game: GitHub Pages doesn't publish it.
//
// The browser opens the content folder itself (the File System Access API, in
// Chrome and Edge), so no server is needed to save. Each file's form follows
// its schema: text, numbers, ticks, choices from a list, lists of things, and
// a raw JSON box for anything the form can't show. Events are text (D45) and
// get a plain text box. Saving keeps the file's own key order. After saving,
// `npm run content` checks everything and rebuilds what the game loads.

/** Each content folder and its schema (tools/content.mjs keeps the same list). */
const KINDS = {
  fish: 'fish',
  items: 'item',
  locations: 'location',
  tables: 'table',
  weather: 'season',
  classes: 'class',
  features: 'feature',
  perks: 'perk',
  sets: 'set',
  rules: null, // each rule file has its own schema, named after its id
  events: 'text',
};

const $ = (/** @type {string} */ id) => /** @type {HTMLElement} */ (document.getElementById(id));

/**
 * @param {string} tag
 * @param {Record<string, any>} [props]
 * @param {(Node | string)[]} [kids]
 */
function el(tag, props = {}, kids = []) {
  const e = Object.assign(document.createElement(tag), props);
  e.append(...kids);
  return e;
}

/** @type {FileSystemDirectoryHandle | null} */
let root = null;
/** @type {Record<string, any>} Schema files by name. */
const schemas = {};
/** @type {Set<string>} Every content id, for suggestions. */
const ids = new Set();
/** The open file. */
let open = /** @type {{ kind: string, name: string, data: any, text?: string, schema: any, base: string, dirty: boolean } | null} */ (null);

/** @param {string} name */
async function schema(name) {
  if (!schemas[name]) schemas[name] = await (await fetch(`schemas/${name}`)).json();
  return schemas[name];
}

/**
 * Follows a $ref, from the schema file `base`.
 * @param {any} s
 * @param {string} base
 * @returns {Promise<{ s: any, base: string }>}
 */
async function resolve(s, base) {
  while (s && s.$ref) {
    const [file, pointer] = s.$ref.split('#');
    const doc = await schema(file || base);
    base = file || base;
    s = pointer.split('/').filter(Boolean).reduce((o, k) => o?.[k], doc);
  }
  return { s, base };
}

/**
 * A new value for a schema: what it must have, and nothing else.
 * @param {any} s
 * @param {string} base
 * @returns {Promise<any>}
 */
async function blank(s, base) {
  ({ s, base } = await resolve(s, base));
  if (!s) return null;
  if (s.oneOf) return blank(s.oneOf[0], base);
  if (s.enum) return s.enum[0];
  if (s.const !== undefined) return s.const;
  switch (s.type) {
    case 'string':
      return '';
    case 'integer':
    case 'number':
      return s.minimum ?? 0;
    case 'boolean':
      return true;
    case 'array':
      return [];
    case 'object': {
      /** @type {Record<string, any>} */
      const o = {};
      for (const key of s.required ?? []) o[key] = await blank(s.properties?.[key] ?? {}, base);
      return o;
    }
    default:
      return null;
  }
}

/**
 * Which of a oneOf's variants a value is: the first whose required keys it has
 * (for objects) or whose type it matches.
 * @param {any[]} variants
 * @param {any} value
 * @param {string} base
 */
async function variantOf(variants, value, base) {
  for (let i = 0; i < variants.length; i++) {
    const { s } = await resolve(variants[i], base);
    if (s.type === 'object' && value && typeof value === 'object' && (s.required ?? []).every((/** @type {string} */ k) => k in value)) return i;
    if (s.type === 'integer' && Number.isInteger(value)) return i;
    if ((s.type === 'string' || s.enum) && typeof value === 'string') return i;
  }
  return 0;
}

/**
 * A control for a value, from its schema. `set` stores a new value; the form
 * redraws itself after anything that changes its shape.
 * @param {any} s0
 * @param {string} base
 * @param {any} value
 * @param {(v: any) => void} set
 * @param {string} label
 * @returns {Promise<HTMLElement>}
 */
async function control(s0, base, value, set, label) {
  const { s, base: b } = await resolve(s0, base);
  const hint = s?.description ?? s0?.description ?? '';
  if (!s) return raw(value, set);
  if (s.oneOf) {
    const i = await variantOf(s.oneOf, value, b);
    const pickVariant = el('select', { title: 'What kind of thing this is' });
    for (let j = 0; j < s.oneOf.length; j++) {
      const { s: v } = await resolve(s.oneOf[j], b);
      pickVariant.append(el('option', { value: String(j), textContent: v.description ?? (v.type === 'object' ? Object.keys(v.properties ?? {}).join(' + ') : v.type ?? 'one of a list'), selected: j === i }));
    }
    pickVariant.addEventListener('change', async () => {
      set(await blank(s.oneOf[Number(pickVariant.value)], b));
      redraw();
    });
    return el('div', { className: 'variant' }, [pickVariant, await control(s.oneOf[i], b, value, set, label)]);
  }
  if (s.enum) {
    const select = el('select', { title: hint });
    for (const v of s.enum) select.append(el('option', { value: JSON.stringify(v), textContent: String(v), selected: v === value }));
    select.addEventListener('change', () => set(JSON.parse(select.value)));
    return select;
  }
  if (s.const !== undefined) return el('code', { textContent: JSON.stringify(s.const) });
  switch (s.type) {
    case 'string': {
      if (s.pattern === '^#[0-9a-fA-F]{6}$') {
        const colour = el('input', { type: 'color', value: /^#[0-9a-f]{6}$/i.test(value) ? value : '#000000' });
        const text = el('input', { type: 'text', value: value ?? '', size: 8, title: hint });
        colour.addEventListener('input', () => ((text.value = colour.value), set(colour.value)));
        text.addEventListener('change', () => ((colour.value = text.value), set(text.value)));
        return el('span', {}, [colour, text]);
      }
      const long = typeof value === 'string' && value.length > 50;
      const input = el(long ? 'textarea' : 'input', { value: value ?? '', title: hint, rows: 3 });
      if (!long) input.setAttribute('list', 'all-ids');
      if (s.pattern) input.setAttribute('pattern', s.pattern);
      input.addEventListener('change', () => set(/** @type {HTMLInputElement} */ (input).value));
      return input;
    }
    case 'integer':
    case 'number': {
      const input = el('input', { type: 'number', value: String(value ?? ''), title: hint, step: s.type === 'integer' ? '1' : 'any' });
      if (s.minimum !== undefined) input.min = String(s.minimum);
      if (s.maximum !== undefined) input.max = String(s.maximum);
      input.addEventListener('change', () => set(Number(input.value)));
      return input;
    }
    case 'boolean': {
      const box = el('input', { type: 'checkbox', checked: Boolean(value), title: hint });
      box.addEventListener('change', () => set(box.checked));
      return box;
    }
    case 'array': {
      const list = Array.isArray(value) ? value : [];
      const rows = await Promise.all(
        list.map(async (item, i) =>
          el('div', { className: 'item' }, [
            await control(s.items ?? {}, b, item, (v) => (list[i] = v), `${label} ${i + 1}`),
            button('↑', () => i > 0 && list.splice(i - 1, 2, list[i], list[i - 1])),
            button('×', () => list.splice(i, 1)),
          ]),
        ),
      );
      const add = button(`+ ${label}`, async () => list.push(await blank(s.items ?? {}, b)));
      if (!Array.isArray(value)) set(list);
      return el('div', { className: 'list' }, [...rows, add]);
    }
    case 'object': {
      const obj = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
      if (obj !== value) set(obj);
      const props = s.properties ?? {};
      const required = new Set(s.required ?? []);
      /** @type {HTMLElement[]} */
      const rows = [];
      // The file's own keys first, in their order; then what can be added.
      for (const key of Object.keys(obj)) {
        if (key === '$schema') continue;
        const sub = props[key] ?? (typeof s.additionalProperties === 'object' ? s.additionalProperties : null);
        const ctl = sub ? await control(sub, b, obj[key], (v) => (obj[key] = v), key) : raw(obj[key], (v) => (obj[key] = v));
        rows.push(el('div', { className: 'field' }, [el('label', { textContent: key, title: props[key]?.description ?? '' }), ctl, required.has(key) ? '' : button('×', () => delete obj[key])]));
      }
      const missing = Object.keys(props).filter((k) => !(k in obj) && k !== '$schema');
      const adds = missing.map((k) => button(`+ ${k}`, async () => (obj[k] = await blank(props[k], b))));
      if (typeof s.additionalProperties === 'object') {
        const key = el('input', { placeholder: 'new key' });
        adds.push(el('span', {}, [key, button('+', async () => key.value && (obj[key.value] = await blank(s.additionalProperties, b)))]));
      }
      return el('div', { className: 'object' }, [...rows, el('div', { className: 'adds' }, adds)]);
    }
    default:
      return raw(value, set);
  }
}

/**
 * A raw JSON box, for what the form can't show.
 * @param {any} value
 * @param {(v: any) => void} set
 */
function raw(value, set) {
  const box = el('textarea', { value: JSON.stringify(value, null, 2), rows: 4, className: 'raw', title: 'Raw JSON' });
  box.addEventListener('change', () => {
    try {
      set(JSON.parse(box.value));
      box.classList.remove('bad');
    } catch {
      box.classList.add('bad');
    }
  });
  return box;
}

/**
 * A button that changes the file's shape: it marks the file changed and redraws.
 * @param {string} text
 * @param {() => any} act
 */
function button(text, act) {
  return el('button', {
    type: 'button',
    textContent: text,
    onclick: async () => {
      await act();
      redraw();
    },
  });
}

/** Draws the open file's form again, keeping the scroll. */
async function redraw() {
  if (!open) return;
  open.dirty = true;
  const form = $('form');
  const top = form.scrollTop;
  form.replaceChildren(await (open.text !== undefined ? eventBox() : control(open.schema, open.base, open.data, (v) => open && (open.data = v), open.name)));
  form.scrollTop = top;
  $('status').textContent = `${open.kind}/${open.name}: changed, not saved`;
}

function eventBox() {
  const box = el('textarea', { value: open?.text ?? '', className: 'event', spellcheck: true });
  box.addEventListener('input', () => {
    if (!open) return;
    open.text = box.value;
    open.dirty = true;
    $('status').textContent = `${open.kind}/${open.name}: changed, not saved`;
  });
  return box;
}

/** Lists a kind's files. @param {string} kind */
async function listKind(kind) {
  if (!root) return;
  const dir = await root.getDirectoryHandle(kind);
  /** @type {string[]} */
  const names = [];
  for await (const [name] of /** @type {any} */ (dir).entries()) if (/\.(json|md)$/.test(name)) names.push(name);
  names.sort();
  $('files').replaceChildren(
    ...names.map((name) => el('button', { type: 'button', textContent: name.replace(/\.(json|md)$/, ''), onclick: () => openFile(kind, name) })),
    el('button', { type: 'button', textContent: `+ new`, className: 'new', onclick: () => newFile(kind) }),
  );
  $('kind').textContent = kind;
}

/** @param {string} kind @param {string} name */
async function openFile(kind, name) {
  if (open?.dirty && !confirm(`${open.kind}/${open.name} has changes that aren't saved. Leave them?`)) return;
  if (!root) return;
  const file = await (await (await root.getDirectoryHandle(kind)).getFileHandle(name)).getFile();
  const text = await file.text();
  if (name.endsWith('.md')) open = { kind, name, data: null, text, schema: null, base: '', dirty: false };
  else {
    const data = JSON.parse(text);
    const base = `${KINDS[/** @type {keyof typeof KINDS} */ (kind)] ?? data.id}.schema.json`;
    open = { kind, name, data, schema: await schema(base), base, dirty: false };
  }
  await redraw();
  open.dirty = false;
  $('status').textContent = `${kind}/${name}`;
}

/** @param {string} kind */
async function newFile(kind) {
  const id = prompt(`The new ${kind} file's id (lowercase-with-dashes; permanent, D44):`);
  if (!id || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id) || !root) return;
  if (kind === 'events') {
    open = { kind, name: `${id}.md`, data: null, text: `---\nid: ${id}\ntitle: \n---\n\n## start\n\n\n- Leave -> end\n`, schema: null, base: '', dirty: true };
  } else {
    const base = `${KINDS[/** @type {keyof typeof KINDS} */ (kind)] ?? id}.schema.json`;
    const s = await schema(base);
    const data = { $schema: `../../schemas/${base}`, ...(await blank(s, base)), id };
    open = { kind, name: `${id}.json`, data, schema: s, base, dirty: true };
  }
  await redraw();
}

async function saveFile() {
  if (!open || !root) return;
  const dir = await root.getDirectoryHandle(open.kind);
  const handle = await dir.getFileHandle(open.name, { create: true });
  const writable = await /** @type {any} */ (handle).createWritable();
  await writable.write(open.text !== undefined ? open.text : JSON.stringify(open.data, null, 2) + '\n');
  await writable.close();
  open.dirty = false;
  $('status').textContent = `${open.kind}/${open.name}: saved. Run npm run content to check it and rebuild the game's content.`;
  await listKind(open.kind);
}

async function openFolder() {
  if (!('showDirectoryPicker' in window)) {
    $('status').textContent = "This browser can't open a folder: use Chrome or Edge.";
    return;
  }
  root = await /** @type {any} */ (window).showDirectoryPicker({ mode: 'readwrite' });
  if (!root) return;
  if (root.name !== 'content') {
    try {
      root = await root.getDirectoryHandle('content');
    } catch {
      $('status').textContent = 'Pick the content folder (or the folder holding it).';
      root = null;
      return;
    }
  }
  // Every id, for the suggestions in id fields.
  ids.clear();
  for (const kind of Object.keys(KINDS)) {
    try {
      for await (const [name] of /** @type {any} */ (await root.getDirectoryHandle(kind)).entries()) ids.add(name.replace(/\.(json|md)$/, ''));
    } catch {
      // A kind with no folder yet.
    }
  }
  $('all-ids').replaceChildren(...[...ids].sort().map((id) => el('option', { value: id })));
  $('kinds').replaceChildren(...Object.keys(KINDS).map((kind) => el('button', { type: 'button', textContent: kind, onclick: () => listKind(kind) })));
  $('status').textContent = 'Pick a kind, then a file.';
}

$('openFolder').addEventListener('click', openFolder);
$('save').addEventListener('click', saveFile);
window.addEventListener('beforeunload', (e) => {
  if (open?.dirty) e.preventDefault();
});
