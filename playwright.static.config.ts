import { defineConfig, devices } from '@playwright/test';

/**
 * Tests the *built* site exactly as Cloudflare Pages serves it: `wrangler pages dev` over
 * `dist/analog/public`. The dev-server suite (playwright.config.ts) cannot see what only exists in a
 * production build — prerendered Markdown, the Pagefind index, 404 status codes, the sitemap.
 *
 *   pnpm build:prod && pnpm e2e:static
 */
const port = Number(process.env['E2E_STATIC_PORT'] ?? 8788);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './e2e-static',
  fullyParallel: true,
  retries: process.env['CI'] ? 1 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: [['list']],
  use: { baseURL, trace: 'on-first-retry' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'firefox',
      testMatch: /smoke\.static\.spec\.ts/,
      use: { ...devices['Desktop Firefox'] },
    },
    { name: 'webkit', testMatch: /smoke\.static\.spec\.ts/, use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: `pnpm exec wrangler pages dev dist/analog/public --port ${port} --ip 127.0.0.1`,
    url: baseURL,
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
