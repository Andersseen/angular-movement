import { defineConfig, devices } from '@playwright/test';

const e2ePort = Number(process.env['E2E_PORT'] ?? 5173);
const baseURL = `http://127.0.0.1:${e2ePort}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // Compiles every route once before the suite, so Vite's on-demand compilation does not eat into
  // timing-sensitive assertions. See e2e/global-setup.ts.
  globalSetup: './e2e/global-setup.ts',
  // The warm-up removes the known cause of flakiness; one retry absorbs ordinary scheduling noise
  // without hiding a reproducible failure.
  retries: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `pnpm exec vite --host 127.0.0.1 --port ${e2ePort}`,
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
