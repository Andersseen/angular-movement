import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { DEMO_ROUTES } from './routes';
import { waitForHydration } from './hydration';

for (const slug of DEMO_ROUTES) {
  test(`workbench structure and layout /${slug}`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 768 });
    await page.goto(`/demos/${slug}`);
    await expect(page.getByTestId('demo-workbench')).toHaveCount(1);
    await expect(page.getByTestId('demo-stage')).toBeVisible();
    await expect(page.getByTestId('demo-controls')).toBeVisible();
    await expect(page.getByTestId('demo-code')).toBeVisible();
    await expect(page.locator('.demo-nav-active')).toHaveAttribute('href', `/demos/${slug}`);
    const metrics = await page.evaluate(() => ({
      height: document.documentElement.scrollHeight,
      width: document.documentElement.scrollWidth,
    }));
    expect(metrics.height).toBeLessThanOrEqual(768);
    expect(metrics.width).toBeLessThanOrEqual(1280);
  });
}

for (const width of [320, 375, 390, 768, 1024, 1280, 1440, 1920]) {
  test(`workbench fits ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/demos/enter');
    await expect(page.getByTestId('demo-stage')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    if (width < 1024) {
      await expect(page.getByLabel('Explore demos', { exact: true })).toBeVisible();
      await waitForHydration(page);
      await page.getByLabel('Explore demos', { exact: true }).selectOption('hover');
      await expect(page).toHaveURL(/\/demos\/hover$/);
      await page.goBack();
      await expect(page).toHaveURL(/\/demos\/enter$/);
    }
  });
}

test('controls scroll without moving the preview; replay preserves and reset restores settings', async ({
  page,
}) => {
  await page.goto('/demos/enter');
  await waitForHydration(page);
  const stage = page.getByTestId('demo-stage');
  const before = await stage.boundingBox();
  const controls = page.getByTestId('demo-controls');
  await controls.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  expect(await stage.boundingBox()).toEqual(before);
  await page.locator('#duration-range').fill('800');
  await expect(page.locator('app-code-block code')).toContainText('800ms');
  await page.getByRole('button', { name: 'Replay', exact: false }).click();
  await expect(page.locator('#duration-range')).toHaveValue('800');
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page.locator('#duration-range')).toHaveValue('300');
  await expect(page.getByRole('status').filter({ hasText: 'Defaults restored' })).toBeAttached();
  await page.locator('.demo-sidebar a[href="/demos/hover"]').click();
  await expect(page.locator('#duration-range')).toHaveValue('200');
});

test('code scrolls independently and has keyboard focus', async ({ page }) => {
  await page.goto('/demos/values');
  const stage = await page.getByTestId('demo-stage').boundingBox();
  const source = page.getByRole('region', { name: 'values.component.ts source code' });
  await source.focus();
  await source.press('End');
  await expect.poll(() => source.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  expect(await page.getByTestId('demo-stage').boundingBox()).toEqual(stage);
});

for (const theme of ['light', 'dark']) {
  test(`workbench accessibility ${theme}`, async ({ page }) => {
    await page.goto('/demos/enter');
    await page.evaluate((value) => {
      document.documentElement.dataset['theme'] = value;
    }, theme);
    await waitForHydration(page);
    const audit = await new AxeBuilder({ page })
      .include('.demo-shell')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(audit.violations).toEqual([]);
  });
}

test('reduced motion keeps enter target usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/demos/enter');
  await waitForHydration(page);
  await page.getByRole('button', { name: /Replay/ }).click();
  await expect(page.getByText('Fade Up', { exact: true })).toBeVisible();
});

test('leaving smooth scroll destroys its animation-frame loop', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.addInitScript(() => {
    const pending = new Set<number>();
    const request = window.requestAnimationFrame.bind(window);
    const cancel = window.cancelAnimationFrame.bind(window);
    Object.defineProperty(window, '__pendingMotionLabFrames', { value: pending });
    window.requestAnimationFrame = (callback) => {
      const id = request((time) => {
        pending.delete(id);
        callback(time);
      });
      pending.add(id);
      return id;
    };
    window.cancelAnimationFrame = (id) => {
      pending.delete(id);
      cancel(id);
    };
  });
  const pendingFrames = () =>
    page.evaluate(
      () =>
        (window as unknown as { __pendingMotionLabFrames: Set<number> }).__pendingMotionLabFrames
          .size,
    );
  await page.goto('/demos/smooth-scroll');
  await waitForHydration(page);
  await expect.poll(pendingFrames).toBeGreaterThan(0);
  await page.locator('.demo-sidebar a[href="/demos/enter"]').click();
  await expect(page.locator('h1')).toHaveText('moveEnter');
  await expect.poll(pendingFrames).toBe(0);
  await expect.poll(() => page.evaluate(() => document.getAnimations().length)).toBe(0);
});
