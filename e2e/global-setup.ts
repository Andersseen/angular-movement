import { chromium } from '@playwright/test';
import { ALL_ROUTES } from './routes';

/**
 * Warms every route in a real browser before the suite runs.
 *
 * The e2e web server is Vite's dev server, which compiles modules the first time they are
 * requested. With `fullyParallel`, several workers hit different cold routes at once and the
 * resulting delay makes timing-sensitive assertions (presence swaps, spring settling, drag release)
 * intermittently fail — reproducibly on the first run after an install or a build.
 *
 * A plain `fetch` is not enough: it returns the SSR HTML without asking for the client module graph,
 * so the expensive compilation still happens during the tests. Loading each route in a browser
 * compiles what the page actually imports, which is the part that was slow.
 */
export default async function globalSetup(): Promise<void> {
  const port = Number(process.env['E2E_PORT'] ?? 5173);
  const baseURL = `http://127.0.0.1:${port}`;

  const started = Date.now();
  const browser = await chromium.launch();

  // A few pages in parallel: serial warming took ~20s, most of it waiting on the server rather
  // than saturating it.
  const LANES = 4;

  try {
    const queue = [...ALL_ROUTES];
    await Promise.all(
      Array.from({ length: LANES }, async () => {
        const page = await browser.newPage();
        try {
          for (let route = queue.shift(); route; route = queue.shift()) {
            try {
              await page.goto(`${baseURL}${route}`, { waitUntil: 'networkidle', timeout: 60_000 });
            } catch {
              // Best-effort: a route that genuinely cannot load fails loudly in its own test.
            }
          }
        } finally {
          await page.close();
        }
      }),
    );
  } finally {
    await browser.close();
  }

  console.log(`[e2e] warmed ${ALL_ROUTES.length} routes in ${Date.now() - started}ms`);
}
