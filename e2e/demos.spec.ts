import { expect, test } from '@playwright/test';

const demoRoutes = [
  'animate',
  'animation',
  'drag',
  'enter',
  'focus',
  'hover',
  'icons',
  'in-view',
  'layout',
  'leave',
  'loop',
  'parallax',
  'presence',
  'scroll',
  'smooth-scroll',
  'stagger',
  'tap',
  'target',
  'text',
  'values',
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

  test('animation demo plays enter and exit through movePresence', async ({ page }) => {
    await page.goto('/demos/animation');

    const card = page.locator('.font-display', { hasText: 'Object Animation' }).locator('..');
    const toggle = page.locator('button', { hasText: /Hide|Show/ });

    await expect(card).toBeVisible();

    await toggle.click();

    await expect(card).toBeAttached();
    await expect(card).toBeHidden({ timeout: 1000 });

    await toggle.click();
    await expect(card).toBeVisible({ timeout: 1000 });
  });

  test('focus demo keeps the focusable element visible after focus', async ({ page }) => {
    await page.goto('/demos/focus');

    const button = page.locator('button', { hasText: 'Focus me' });
    await expect(button).toBeVisible();

    await button.focus();
    await expect(button).toBeVisible();
    await expect(button).toBeFocused();
  });

  test('values demo maps the driver signal onto transform outputs', async ({ page }) => {
    await page.goto('/demos/values');

    const slider = page.getByTestId('values-slider');
    const linear = page.getByTestId('values-linear-box');
    await expect(slider).toBeVisible();

    const initial = await linear.evaluate((el) => getComputedStyle(el).transform);

    await page.getByTestId('values-end').click();
    await expect(page.getByTestId('values-progress')).toHaveText('100');

    // moveTransform is synchronous, so the linear box has already moved.
    await expect
      .poll(async () => linear.evaluate((el) => getComputedStyle(el).transform))
      .not.toBe(initial);

    // moveSpringValue settles asynchronously toward the same target.
    await expect
      .poll(
        async () =>
          page
            .getByTestId('values-spring-box')
            .evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41),
        { timeout: 3000 },
      )
      .toBeGreaterThan(200);
  });

  test('smooth scroll demo exposes the live service readout', async ({ page }) => {
    await page.goto('/demos/smooth-scroll');

    await expect(page.getByTestId('smooth-scroll-readout')).toBeVisible();
    await expect(page.getByTestId('smooth-scroll-value')).toBeVisible();

    const active = await page.getByTestId('smooth-scroll-active').textContent();
    await page.getByTestId('smooth-scroll-instant').click();

    // scrollTo(400, instant) writes scrollTop synchronously and publishes it on the scrollY signal.
    // Under reduced motion the service never starts, so the readout legitimately stays at 0.
    await expect
      .poll(async () => {
        const text = (await page.getByTestId('smooth-scroll-value').textContent()) ?? '';
        return Number.parseInt(text.trim(), 10);
      })
      .toBe(active?.trim() === 'yes' ? 400 : 0);
  });
});
