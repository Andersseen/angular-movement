import { type Page } from '@playwright/test';

/**
 * Host listeners only exist after hydration; interacting before it drives the SSR markup, so a
 * click or `selectOption` is silently dropped. Dev builds publish the `ng` debugging global when
 * the client app bootstraps.
 *
 * Compare with `=== 'function'` — a bare `typeof` is a non-empty string and always truthy.
 */
export async function waitForHydration(page: Page): Promise<void> {
  await page.waitForFunction(
    () =>
      typeof (window as unknown as { ng?: { getComponent?: unknown } }).ng?.getComponent ===
      'function',
    undefined,
    { timeout: 15_000 },
  );
}
