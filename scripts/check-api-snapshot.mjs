#!/usr/bin/env node
/**
 * Fails when the library's public API surface has drifted from the committed snapshot.
 *
 * `projects/movement/api-report.txt` is a checked-in copy of ng-packagr's rolled-up type
 * declaration file — every exported class/interface/type/function with full signatures and JSDoc
 * (including `@stability` tags). Diffing the fresh build against it is what makes an accidental
 * barrel change (removed export, renamed input, narrowed type) visible in a PR review instead of
 * shipping silently. Run `ng build movement` first (see the `api:check` npm script).
 *
 *   pnpm run api:check
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const CURRENT = 'dist/movement/types/angular-movement.d.ts';
const SNAPSHOT = 'projects/movement/api-report.txt';

if (!existsSync(CURRENT)) {
  console.error(`${CURRENT} does not exist. Run "ng build movement" first.`);
  process.exit(1);
}

if (!existsSync(SNAPSHOT)) {
  console.error(`${SNAPSHOT} does not exist. Run "pnpm run api:snapshot" to create it.`);
  process.exit(1);
}

const current = readFileSync(CURRENT, 'utf8');
const snapshot = readFileSync(SNAPSHOT, 'utf8');

if (current === snapshot) {
  console.log('Public API surface matches the committed snapshot.');
  process.exit(0);
}

console.error('Public API surface has changed:\n');
try {
  execFileSync('diff', ['-u', SNAPSHOT, CURRENT], { stdio: 'inherit' });
} catch {
  // diff exits 1 when files differ — that is expected here, the output already printed.
}
console.error(
  '\nIf this change is intentional, run "pnpm run api:snapshot" and commit the updated ' +
    `${SNAPSHOT}. If it is not, you changed the public API by accident.`,
);
process.exit(1);
