import { expect, test, type Locator } from '@playwright/test';

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

/**
 * The engine writes motion into the atomic CSS properties (`translate` / `scale` / `rotate`) and
 * only falls back to a composed `transform` when the element already has one. Asserting on
 * `transform` alone therefore misses most animations — read every channel.
 */
async function motionState(locator: Locator): Promise<string> {
  return locator.evaluate((el) => {
    const style = getComputedStyle(el);
    return [style.transform, style.translate, style.scale, style.rotate, style.opacity].join(' | ');
  });
}

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

  test('drag demo moves the card with the pointer and keeps it in bounds', async ({ page }) => {
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

    // The release animation must settle without detaching the card or throwing it off-screen.
    await expect(card).toBeVisible();
    await expect
      .poll(
        async () => {
          const box = await card.boundingBox();
          const viewport = page.viewportSize()!;
          return !!box && box.x > -box.width && box.x < viewport.width;
        },
        { timeout: 3000 },
      )
      .toBe(true);
  });

  test('presence demo waits for the exit animation before swapping panels', async ({ page }) => {
    await page.goto('/demos/presence');

    const first = page.getByTestId('presence-panel-1');
    await expect(first).toBeVisible();

    await page.getByTestId('presence-tab-2').click();

    // The outgoing panel must stay in the DOM while its leave animation plays — that is the whole
    // point of *movePresence.
    await expect(first).toBeAttached();
    await expect(page.getByTestId('presence-panel-2')).toBeVisible();
    await expect(first).toBeHidden({ timeout: 2000 });
  });

  test('variants demo animates between named states', async ({ page }) => {
    await page.goto('/demos/variants');

    const target = page.getByTestId('variants-target');
    await expect(target).toBeVisible();

    const buttons = page.locator('[data-testid^="variant-button-"]');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(1);

    const before = await motionState(target);
    await buttons.nth(1).click();

    await expect.poll(async () => motionState(target), { timeout: 3000 }).not.toBe(before);

    // Switching back must settle again rather than leave the element mid-transform.
    await buttons.nth(0).click();
    await expect(target).toBeVisible();
  });

  test('stagger demo reveals every child', async ({ page }) => {
    await page.goto('/demos/stagger');

    const items = page.getByTestId('stagger-item');
    await expect(items.first()).toBeVisible();
    const count = await items.count();
    expect(count).toBeGreaterThan(2);

    // Staggered children start hidden; all of them must end up visible, or the stagger delay is
    // being applied without a matching play.
    await expect
      .poll(
        async () =>
          items.evaluateAll((els) => els.every((el) => Number(getComputedStyle(el).opacity) > 0.9)),
        { timeout: 3000 },
      )
      .toBe(true);
  });

  test('in-view demo animates the target once it is scrolled into view', async ({ page }) => {
    await page.goto('/demos/in-view');

    const target = page.getByTestId('in-view-target');
    await target.scrollIntoViewIfNeeded();

    await expect(target).toBeVisible();
    await expect
      .poll(async () => Number(await target.evaluate((el) => getComputedStyle(el).opacity)), {
        timeout: 3000,
      })
      .toBeGreaterThan(0.9);
  });

  test('scroll demo maps container scroll onto the element transform', async ({ page }) => {
    await page.goto('/demos/scroll');

    const container = page.getByTestId('scroll-container');
    const foreground = page.getByTestId('scroll-foreground');

    // The directive only creates its player once the element intersects its scroll container.
    await foreground.scrollIntoViewIfNeeded();
    await expect(foreground).toBeVisible();
    await expect.poll(async () => foreground.evaluate((el) => el.getAnimations().length)).toBe(1);

    const before = await motionState(foreground);

    await container.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
      el.dispatchEvent(new Event('scroll'));
    });

    // moveScroll lerps toward the target, so poll rather than asserting on the next frame.
    await expect.poll(async () => motionState(foreground), { timeout: 3000 }).not.toBe(before);
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
