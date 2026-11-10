// Runs one of the Python tools (tools/cutout.py, tools/commons.py) in its own
// environment, .venv-cutout/, kept out of git. They need rembg (cutting things
// out of photos) and Pillow, which Node can't do on its own.
//
//   npm run cutout setup        creates the environment once (Python 3.10 or newer)
//   npm run cutout <args>       node tools/py.mjs cutout <args>
//   npm run commons <args>      node tools/py.mjs commons <args>

import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const VENV = join(ROOT, '.venv-cutout');
const PY = process.platform === 'win32' ? join(VENV, 'Scripts', 'python.exe') : join(VENV, 'bin', 'python');
const [tool, ...args] = process.argv.slice(2);

/** @param {string} cmd @param {string[]} a */
const run = (cmd, a) => spawnSync(cmd, a, { stdio: 'inherit', cwd: ROOT }).status ?? 1;

if (args[0] === 'setup') {
  const python = process.platform === 'win32' ? 'python' : 'python3';
  if (!existsSync(PY) && run(python, ['-m', 'venv', VENV]) !== 0) process.exit(1);
  // The cut-out model (about 170 MB) downloads on first use, to ~/.u2net.
  process.exit(run(PY, ['-m', 'pip', 'install', '-q', '-r', join(ROOT, 'tools', 'python-requirements.txt')]));
}
if (!existsSync(PY)) {
  console.log(`The Python tools need their environment first: npm run ${tool} setup`);
  process.exit(1);
}
// -I: isolated, so nothing in the working folder (downloaded photos and all) is imported as code.
process.exit(run(PY, ['-I', join(ROOT, 'tools', `${tool}.py`), ...args]));
