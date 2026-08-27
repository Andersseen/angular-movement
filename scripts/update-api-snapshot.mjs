#!/usr/bin/env node
/**
 * Overwrites the committed public-API snapshot with the library's freshly built type rollup.
 *
 * ng-packagr already rolls up every exported class/interface/type/function (full signatures, full
 * JSDoc incl. `@stability` tags) into one file: `dist/movement/types/angular-movement.d.ts`. That
 * is a more complete source of truth than any regex-based extractor, so this script just copies
 * it — run `ng build movement` first (see the `api:snapshot` npm script).
 *
 *   pnpm run api:snapshot
 */
import { copyFileSync, existsSync } from 'node:fs';

const SOURCE = 'dist/movement/types/angular-movement.d.ts';
const SNAPSHOT = 'projects/movement/api-report.txt';

if (!existsSync(SOURCE)) {
  console.error(`${SOURCE} does not exist. Run "ng build movement" first.`);
  process.exit(1);
}

copyFileSync(SOURCE, SNAPSHOT);
console.log(`Updated ${SNAPSHOT} from ${SOURCE}.`);
