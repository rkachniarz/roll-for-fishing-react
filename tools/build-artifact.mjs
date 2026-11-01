// Bundles the game into ONE self-contained HTML file.
//
// Why this exists: the playable site is index.html + styles.css + src/*.js, and
// that works as-is on GitHub Pages (browsers load ES modules natively). But a
// Claude artifact is a single file, so publishing there needs everything inlined
// into one page. That's all this script does.
//
//   node tools/build-artifact.mjs   ->   dist/artifact.html
//
// The CDN URLs are NOT repeated here - they're read out of the import map in
// index.html, so there is still only one place to change a version.

import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = await readFile(join(root, 'index.html'), 'utf8');

// ---------- Pull the pinned dependency URLs out of the import map ----------
const importMapMatch = html.match(/<script type="importmap">\s*([\s\S]*?)\s*<\/script>/);
if (!importMapMatch) throw new Error('No <script type="importmap"> found in index.html');
const { imports } = JSON.parse(importMapMatch[1]);

// ---------- Bundle the modules ----------
// The two libraries stay external (loaded from their CDN at runtime, exactly as
// the import map does); only our own modules get merged together.
const cdnExternals = {
  name: 'cdn-externals',
  setup(b) {
    for (const [name, url] of Object.entries(imports)) {
      const filter = new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
      b.onResolve({ filter }, () => ({ path: url, external: true }));
    }
  },
};


const bundled = await build({
  entryPoints: [join(root, 'src/main.js')],
  bundle: true,
  format: 'esm',
  target: 'es2022',
  write: false,
  plugins: [cdnExternals],
  legalComments: 'none',
});
const js = bundled.outputFiles[0].text;

const css = await readFile(join(root, 'styles.css'), 'utf8');

// ---------- Rebuild the page as a fragment ----------
// claude.ai supplies the doctype, <html>, <head> and the viewport meta around an
// artifact, so the artifact copy deliberately has none of its own - it is just
// the title, the styles, the markup and the script.
const body = html
  .match(/<body[^>]*>\s*([\s\S]*?)\s*<\/body>/)[1]
  .replace(/<script type="module" src="[^"]*"><\/script>/, '')
  .trim();

const fontLink = html.match(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis[^>]*>/)?.[0] ?? '';

const out = `<title>Roll for Fishing</title>
<style>
${css.trim()}
</style>

${fontLink}

<script>document.body.dataset.phase = 'loading';</script>
${body}

<script type="module">
${js.trim()}
</script>
`;

await mkdir(join(root, 'dist'), { recursive: true });
await writeFile(join(root, 'dist/artifact.html'), out, 'utf8');
console.log(`dist/artifact.html written (${(out.length / 1024).toFixed(1)} kB)`);
