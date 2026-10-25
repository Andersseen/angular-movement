import { type Page } from '@playwright/test';

/** Wait for the host's first completed client render, rather than the early ng debug global. */
export async function waitForHydration(page: Page): Promise<void> {
  await page.locator('app-root[data-hydrated="true"]').waitFor({ timeout: 15_000 });
}
