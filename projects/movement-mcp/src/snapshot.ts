import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ApiSnapshot } from './types.js';

let cached: ApiSnapshot | undefined;

/** Reads the committed api-snapshot.json (regenerated via `pnpm run snapshot`), cached in-process. */
export function loadSnapshot(): ApiSnapshot {
  if (!cached) {
    const here = dirname(fileURLToPath(import.meta.url));
    const path = join(here, 'data', 'api-snapshot.json');
    cached = JSON.parse(readFileSync(path, 'utf8')) as ApiSnapshot;
  }
  return cached;
}
