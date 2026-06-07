import { expect, test } from '@playwright/test';

const demoRoutes = [
  'animate',
  'drag',
  'enter',
  'hover',
  'icons',
  'in-view',
  'layout',
  'leave',
  'loop',
  'parallax',
  'presence',
  'scroll',
  'stagger',
  'tap',
  'target',
  'text',
  'variants',
] as const;

test.describe('demo pages', () => {
  for (const route of demoRoutes) {
    test(`renders /demos/${route}`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));

      await page.goto(`/demos/${route}`);

      await expect(page.locator('h1').first()).toBeVisible();
      await expect(page.locator('app-demos-layout main')).toBeVisible();
      expect(errors).toEqual([]);
    });
  }
});
