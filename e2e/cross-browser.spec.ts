import { expect, test } from '@playwright/test';
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

  await expect(page.locator('.font-display', { hasText: /^Fade Up$/i })).toBeVisible();
});

test('enter/leave: moveLeave plays before *movePresence removes the view', async ({ page }) => {
  await page.goto('/demos/leave');

  const card = page.getByTestId('leave-demo-card');
  await expect(card).toBeVisible();

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

  const first = page.getByTestId('presence-panel-1');
  await expect(first).toBeVisible();

  await page.getByTestId('presence-tab-2').click();

  await expect(first).toBeAttached();
  await expect(page.getByTestId('presence-panel-2')).toBeVisible();
  await expect(first).toBeHidden({ timeout: 3000 });
});

test('variants: switching the active variant changes the animated state', async ({ page }) => {
  await page.goto('/demos/variants');

  const target = page.getByTestId('variants-target');
  await expect(target).toBeVisible();

  const before = await motionState(target);
  await page.locator('[data-testid^="variant-button-"]').nth(1).click();

  await expect.poll(async () => motionState(target), { timeout: 3000 }).not.toBe(before);
});

test('hover: moveWhileHover starts a WAAPI animation on pointer enter', async ({ page }) => {
  await page.goto('/demos/hover');

  const card = page.locator('.cursor-pointer', { hasText: 'Hover over this card' });
  await expect(card).toBeVisible();

  await card.hover();

  await expect
    .poll(async () => card.evaluate((el) => el.getAnimations().length), { timeout: 3000 })
    .toBeGreaterThan(0);
});

test('focus: moveWhileFocus keeps the element visible and focused', async ({ page }) => {
  await page.goto('/demos/focus');

  const button = page.locator('button', { hasText: 'Focus me' });
  await expect(button).toBeVisible();

  await button.focus();

  await expect(button).toBeFocused();
  await expect(button).toBeVisible();
});

test('tap: moveWhileTap starts a WAAPI animation on press', async ({ page }) => {
  await page.goto('/demos/tap');

  const button = page.locator('button', { hasText: /Press Down|Shrink|Ripple|Bounce/ });
  await expect(button).toBeVisible();

  const box = await button.boundingBox();
  if (!box) throw new Error('tap demo did not lay out');

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();

  await expect
    .poll(async () => button.evaluate((el) => el.getAnimations().length), { timeout: 3000 })
    .toBeGreaterThan(0);

  await page.mouse.up();
});

test('drag: a pointer gesture moves the element and settles cleanly on release', async ({
  page,
}) => {
  await page.goto('/demos/drag');

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

  const layoutContainer = page.getByTestId('layout-demo-items');
  await expect(page.getByTestId('layout-demo-item').first()).toBeVisible();

  await page
    .getByTestId('layout-list-button')
    .evaluate((element) => (element as HTMLButtonElement).click());

  await expect(layoutContainer).toHaveAttribute('data-layout', 'list');
});

test('scroll: container scroll updates the mapped element state', async ({ page }) => {
  await page.goto('/demos/scroll');

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

  const path = page.getByTestId('icons-paperclip');
  await expect(path).toBeVisible();

  const before = await settledMotionState(path);
  await page.getByRole('button', { name: /Animate|Reset/ }).click();

  await expect.poll(async () => motionState(path), { timeout: 3000 }).not.toBe(before);
});

test('Motion Values: moveTransform updates synchronously and moveSpringValue settles asynchronously', async ({
  page,
}) => {
  await page.goto('/demos/values');

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
