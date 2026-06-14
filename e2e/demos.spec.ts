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

  test('layout demo animates grid/list and reorder changes', async ({ page }) => {
    await page.goto('/demos/layout');

    const items = page.getByTestId('layout-demo-item');
    const layoutContainer = page.getByTestId('layout-demo-items');
    await expect(items).toHaveCount(6);

    await page
      .getByTestId('layout-list-button')
      .evaluate((element) => (element as HTMLButtonElement).click());
    await expect(layoutContainer).toHaveAttribute('data-layout', 'list');
    await expect
      .poll(async () => {
        const first = await items.nth(0).boundingBox();
        const second = await items.nth(1).boundingBox();
        return Math.round((second?.y ?? 0) - (first?.y ?? 0));
      })
      .toBeGreaterThan(50);

    await page
      .getByTestId('layout-grid-button')
      .evaluate((element) => (element as HTMLButtonElement).click());
    await expect(layoutContainer).toHaveAttribute('data-layout', 'grid');
    await expect
      .poll(async () => {
        const first = await items.nth(0).boundingBox();
        const second = await items.nth(1).boundingBox();
        return Math.round((second?.x ?? 0) - (first?.x ?? 0));
      })
      .toBeGreaterThan(50);

    const firstLabelBefore = await items.nth(0).innerText();
    await page
      .getByTestId('layout-shuffle-button')
      .evaluate((element) => (element as HTMLButtonElement).click());
    await expect(items.nth(5)).toHaveText(firstLabelBefore);
  });

  test('leave demo keeps the element mounted until the exit animation finishes', async ({
    page,
  }) => {
    await page.goto('/demos/leave');

    const card = page.getByTestId('leave-demo-card');
    await expect(card).toBeVisible();

    await page
      .getByTestId('leave-toggle-button')
      .evaluate((element) => (element as HTMLButtonElement).click());

    await expect(card).toBeAttached();
    await expect(page.getByTestId('leave-hidden-message')).toBeVisible();
    await expect(card).toBeHidden({ timeout: 1000 });
  });
});
