import { expect, test } from '@playwright/test';
import { waitForHydration } from './hydration';
import { motionState, settledMotionState } from './motion-state';

/**
 * Cross-browser contract/smoke suite (Chromium, Firefox, WebKit — see playwright.config.ts).
 *
 * The comprehensive suite (demos.spec.ts, docs.spec.ts, home.spec.ts, composition.spec.ts) stays
 * Chromium-only — it is too expensive to run three times over. This file is deliberately small:
 * one high-value assertion per primitive, chosen to catch real browser-engine differences in
 * WAAPI, pointer events, IntersectionObserver, and layout measurement — not to duplicate the
 * detailed behavioral coverage the comprehensive suite already has on Chromium.
 */

test('basic [move] plays an entrance preset', async ({ page }) => {
  await page.goto('/demos/enter');
  await waitForHydration(page);

  await expect(page.locator('.font-display', { hasText: /^Fade Up$/i })).toBeVisible();
});

test('enter/leave: moveLeave plays before *movePresence removes the view', async ({ page }) => {
  await page.goto('/demos/leave');
  await waitForHydration(page);

  const card = page.getByTestId('leave-demo-card');
  await expect(card).toBeVisible();
  // A click on the SSR-rendered button before hydration has no handler to toggle the view.
  await waitForHydration(page);

  await page
    .getByTestId('leave-toggle-button')
    .evaluate((element) => (element as HTMLButtonElement).click());

  await expect(card).toBeAttached();
  await expect(card).toBeHidden({ timeout: 2000 });
});

test('presence: the outgoing panel stays mounted until its leave animation resolves', async ({
  page,
}) => {
  await page.goto('/demos/presence');
  await waitForHydration(page);

  const first = page.getByTestId('presence-panel-1');
  await expect(first).toBeVisible();

  await page.getByTestId('presence-tab-2').click();

  await expect(first).toBeAttached();
  await expect(page.getByTestId('presence-panel-2')).toBeVisible();
  await expect(first).toBeHidden({ timeout: 3000 });
});

test('variants: switching the active variant changes the animated state', async ({ page }) => {
  await page.goto('/demos/variants');
  await waitForHydration(page);

  const target = page.getByTestId('variants-target');
  await expect(target).toBeVisible();

  const before = await motionState(target);
  await page.locator('[data-testid^="variant-button-"]').nth(1).click();

  await expect.poll(async () => motionState(target), { timeout: 3000 }).not.toBe(before);
});

test('hover: moveWhileHover holds the lifted state and reverses on leave', async ({ page }) => {
  await page.goto('/demos/hover');
  await waitForHydration(page);

  const card = page.locator('.cursor-pointer', { hasText: 'Hover over this card' });
  await expect(card).toBeVisible();

  await card.hover();

  await expect.poll(() => card.evaluate((el) => getComputedStyle(el).translate)).toBe('0px -4px');
  await page.mouse.move(0, 0);
  await expect
    .poll(() =>
      card.evaluate((el) => ['none', '0px', '0px 0px'].includes(getComputedStyle(el).translate)),
    )
    .toBe(true);
});

test('focus: moveWhileFocus keeps the element visible and focused', async ({ page }) => {
  await page.goto('/demos/focus');
  await waitForHydration(page);

  const button = page.locator('button', { hasText: 'Focus me' });
  await expect(button).toBeVisible();

  await button.focus();

  await expect(button).toBeFocused();
  await expect(button).toBeVisible();
});

test('tap: moveWhileTap holds the pressed state and reverses on release', async ({ page }) => {
  await page.goto('/demos/tap');
  await waitForHydration(page);

  const button = page.locator('button', { hasText: /Press|Shrink/ });
  await expect(button).toBeVisible();

  const box = await button.boundingBox();
  if (!box) throw new Error('tap demo did not lay out');

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();

  await expect.poll(() => button.evaluate((el) => getComputedStyle(el).scale)).toBe('0.97');

  await page.mouse.up();
  await expect.poll(() => button.evaluate((el) => getComputedStyle(el).scale)).toBe('1');
});

test('drag: a pointer gesture moves the element and settles cleanly on release', async ({
  page,
}) => {
  await page.goto('/demos/drag');
  await waitForHydration(page);

  const card = page.getByTestId('drag-card');
  await expect(card).toBeVisible();

  const start = await card.boundingBox();
  if (!start) throw new Error('drag demo did not lay out');

  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(start.x + start.width / 2 + 80, start.y + start.height / 2 + 40, {
    steps: 12,
  });

  const dragged = await card.boundingBox();
  expect(dragged!.x).toBeGreaterThan(start.x + 20);

  await page.mouse.up();
  await expect(card).toBeVisible();
});

test('layout: switching layout mode re-flows the tracked items', async ({ page }) => {
  await page.goto('/demos/layout');
  await waitForHydration(page);

  const layoutContainer = page.getByTestId('layout-demo-items');
  await expect(page.getByTestId('layout-demo-item').first()).toBeVisible();

  await page
    .getByTestId('layout-list-button')
    .evaluate((element) => (element as HTMLButtonElement).click());

  await expect(layoutContainer).toHaveAttribute('data-layout', 'list');
});

test('scroll: container scroll updates the mapped element state', async ({ page }) => {
  await page.goto('/demos/scroll');
  await waitForHydration(page);

  const container = page.getByTestId('scroll-container');
  const foreground = page.getByTestId('scroll-foreground');
  await foreground.scrollIntoViewIfNeeded();
  await expect(foreground).toBeVisible();

  const before = await settledMotionState(foreground);

  await container.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
    el.dispatchEvent(new Event('scroll'));
  });

  await expect.poll(async () => motionState(foreground), { timeout: 3000 }).not.toBe(before);
});

test('SVG: an icon helper animates path drawing when toggled', async ({ page }) => {
  await page.goto('/demos/icons');
  await waitForHydration(page);

  const path = page.getByTestId('icons-paperclip');
  await expect(path).toBeVisible();

  const before = await settledMotionState(path);
  await page
    .getByTestId('demo-stage')
    .getByRole('button', { name: /Animate|Reset/ })
    .click();

  await expect.poll(async () => motionState(path), { timeout: 3000 }).not.toBe(before);
});

test('Motion Values: moveTransform updates synchronously and moveSpringValue settles asynchronously', async ({
  page,
}) => {
  await page.goto('/demos/values');
  await waitForHydration(page);

  const linear = page.getByTestId('values-linear-box');
  await expect(page.getByTestId('values-slider')).toBeVisible();

  const initial = await linear.evaluate((el) => getComputedStyle(el).transform);

  await page.getByTestId('values-end').click();
  await expect(page.getByTestId('values-progress')).toHaveText('100');

  await expect
    .poll(async () => linear.evaluate((el) => getComputedStyle(el).transform), { timeout: 3000 })
    .not.toBe(initial);

  await expect
    .poll(
      async () =>
        page
          .getByTestId('values-spring-box')
          .evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41),
      { timeout: 4000 },
    )
    .toBeGreaterThan(200);
});

test('reduced motion: content that animates in is still readable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/demos/stagger');
  await waitForHydration(page);

  const items = page.getByTestId('stagger-item');
  await expect(items.first()).toBeVisible();

  await expect
    .poll(
      async () =>
        items.evaluateAll((els) => els.every((el) => Number(getComputedStyle(el).opacity) > 0.9)),
      { timeout: 3000 },
    )
    .toBe(true);
});

test('smooth scroll: keyboard and programmatic container scrolls are not snapped back', async ({
  page,
}) => {
  await page.goto('/demos/smooth-scroll');
  await waitForHydration(page);
  const region = page.getByTestId('smooth-scroll-container');
  await page.waitForFunction(
    () =>
      typeof (window as unknown as { ng?: { getComponent?: unknown } }).ng?.getComponent ===
      'function',
  );
  await region.evaluate((el) => {
    el.scrollTop = 600;
  });
  await expect.poll(() => region.evaluate((el) => el.scrollTop)).toBeGreaterThan(500);
  await region.evaluate((el) => {
    el.scrollTop = 0;
  });
  await region.focus();
  await region.press('End');
  await expect.poll(() => region.evaluate((el) => el.scrollTop)).toBeGreaterThan(500);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});
