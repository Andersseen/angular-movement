// Build-time route inventory (Node only — imported by vite.config.ts, never by the app).
// Paths are relative to the project root, which is where every build and test command runs.
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const pagesDir = resolve(process.cwd(), 'src/app/pages');

/** `/demos/<name>` for every `pages/demos/<name>.page.ts` — derived, so a new demo is never forgotten. */
export function demoRoutes(): string[] {
  return readdirSync(resolve(pagesDir, 'demos'))
    .filter((file) => file.endsWith('.page.ts') && !file.endsWith('.spec.ts'))
    .map((file) => file.replace(/\.page\.ts$/, ''))
    .filter((name) => name !== 'index')
    .sort()
    .map((name) => `/demos/${name}`);
}

/** The application's own routes. The caller adds the Doqs documentation routes (`doqPrerenderRoutes`). */
export function hostPrerenderRoutes() {
  return ['/', '/demos', ...demoRoutes(), '/templates', '/404.html'];
}
