import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { format, resolveConfig } from 'prettier';

/** Use only trusted formatting configuration; never load code/config from the Release PR. */
export async function normalizeManifest(path) {
  const before = await readFile(path, 'utf8');
  const config = await resolveConfig(fileURLToPath(new URL('../../.prettierrc', import.meta.url)));
  // Tailwind's plugin is irrelevant to JSON; no plugins from the target branch may execute.
  // Multiline JSON gives Release Please a detectable indent on subsequent updates.
  const canonical = JSON.stringify(JSON.parse(before), null, 2) + '\n';
  const after = await format(canonical, {
    ...config,
    plugins: [],
    parser: 'json',
    objectWrap: 'preserve',
  });
  if (before !== after) await writeFile(path, after);
  return before !== after;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const path = process.argv[2];
  if (!path) throw new Error('Usage: normalize-manifest.mjs <manifest path>');
  await normalizeManifest(path);
}
