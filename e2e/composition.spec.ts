import { expect, test } from '@playwright/test';
import { settledMotionState } from './motion-state';

/**
 * Adversarial composition scenarios — several primitives active on the same element(s) at once.
 * Chromium only: these need real WAAPI timing to exercise the actual races, which is exactly what
 * the mocked-engine unit tests cannot see. Assertions target lifecycle correctness (stuck
 * transforms, leaked players, final-state corruption, race conditions, teardown), not
 * pixel-perfect animation — see "Transform ownership and composition" in
 * docs/ai/ARCHITECTURE.md.
 */

test.describe('composition scenarios', () => {
  test('draggable card: hovering mid-transition then dragging does not lose the drag delta', async ({
    page,
  }) => {
    await page.goto('/demos/drag');

    const card = page.getByTestId('drag-card');
    await expect(card).toBeVisible();
    const start = await card.boundingBox();
    if (!start) throw new Error('drag demo did not lay out');

    // Start the hover animation (moveWhileHover="opacity") and, without waiting for it to settle,
    // immediately start dragging on the same element — the exact race spec 013 found and fixed:
    // MoveDragDirective.onPointerDown() must preempt the in-flight hover player before snapshotting
    // its base transform, or the hover animation's later commitStyles() would discard drag's delta.
    await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
    await page.mouse.down();
    await page.mouse.move(start.x + start.width / 2 + 90, start.y + start.height / 2 + 50, {
      steps: 10,
    });

    const dragged = await card.boundingBox();
    expect(dragged!.x).toBeGreaterThan(start.x + 30);
    expect(dragged!.y).toBeGreaterThan(start.y + 15);

    await page.mouse.up();

    // The release (snap-back / momentum) animation must settle without leaving the card detached,
    // stuck off-screen, or opacity stuck at hover's dimmed value.
    await expect(card).toBeVisible();
    await expect
      .poll(
        async () => {
          const box = await card.boundingBox();
          const opacity = await card.evaluate((el) => Number(getComputedStyle(el).opacity));
          const viewport = page.viewportSize()!;
          return !!box && box.x > -box.width && box.x < viewport.width && opacity > 0.9;
        },
        { timeout: 3000 },
      )
      .toBe(true);

    // No leaked WAAPI animation once everything has settled.
    await expect
      .poll(async () => card.evaluate((el) => el.getAnimations().length), { timeout: 3000 })
      .toBe(0);
  });

  test('draggable card: pressing (moveWhileTap) then dragging settles with no leaked player', async ({
    page,
  }) => {
    await page.goto('/demos/drag');

    const card = page.getByTestId('drag-card');
    await expect(card).toBeVisible();
    const start = await card.boundingBox();
    if (!start) throw new Error('drag demo did not lay out');

    // pointerdown fires both MoveTapDirective's press animation and MoveDragDirective's own
    // gesture handling on the same element and the same event.
    await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
    await page.mouse.down();
    await page.mouse.move(start.x + start.width / 2 + 60, start.y + start.height / 2, {
      steps: 8,
    });
    await page.mouse.up();

    await expect(card).toBeVisible();
    await expect
      .poll(async () => card.evaluate((el) => el.getAnimations().length), { timeout: 3000 })
      .toBe(0);
  });

  test('presence-for list: rapid remove + add + shuffle in immediate succession stays consistent', async ({
    page,
  }) => {
    await page.goto('/demos/presence-list');

    await expect(page.getByTestId('presence-list-item-1')).toBeVisible();

    // Fire all three mutations back-to-back, inside one page.evaluate, with no settling in
    // between — the adversarial case: a removed item's leave animation is still in-flight while
    // the list is also asked to add and reorder.
    await page.evaluate(() => {
      const doc = document;
      (doc.querySelector('[data-testid="presence-list-remove-1"]') as HTMLElement).click();
      (doc.querySelector('[data-testid="presence-list-add"]') as HTMLElement).click();
      (doc.querySelector('[data-testid="presence-list-shuffle"]') as HTMLElement).click();
    });

    // The removed item eventually leaves the DOM once its leave animation resolves, and no
    // duplicate/stray nodes accumulate from the overlapping mutations.
    await expect(page.getByTestId('presence-list-item-1')).toHaveCount(0, { timeout: 5000 });

    const testIds = await page
      .getByTestId('presence-list')
      .evaluate((list) =>
        Array.from(list.querySelectorAll('[data-testid^="presence-list-item-"]')).map((el) =>
          el.getAttribute('data-testid'),
        ),
      );
    expect(new Set(testIds).size).toBe(testIds.length);

    // No leaked WAAPI animations across the whole overlapping sequence once it settles.
    await expect
      .poll(async () => page.evaluate(() => document.getAnimations().length), { timeout: 3000 })
      .toBe(0);
  });

  test('modal-style presence: destroying the page mid-transition throws no console errors', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/demos/presence');
    await expect(page.getByTestId('presence-panel-1')).toBeVisible();

    // Switch tabs twice in immediate succession (the second switch starts while the first exit is
    // still mid-transition), then navigate away entirely while a transition is still in flight —
    // this exercises Angular destroying the component (and every active player on it) mid-exit.
    await page.getByTestId('presence-tab-2').click();
    await page.getByTestId('presence-tab-1').click();
    await page.goto('about:blank');

    expect(errors).toEqual([]);
  });

  test('modal-style presence: reduced motion still resolves the exit instead of hanging', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/demos/presence');

    const first = page.getByTestId('presence-panel-1');
    await expect(first).toBeVisible();

    await page.getByTestId('presence-tab-2').click();

    // Under reduced motion the leave still has to resolve (just without the transition), or the
    // outgoing panel would stay mounted forever.
    await expect(first).toBeHidden({ timeout: 2000 });
    await expect(page.getByTestId('presence-panel-2')).toBeVisible();
  });

  test('scroll-linked value: moveScroll composes with moveTransform and moveSpringValue', async ({
    page,
  }) => {
    await page.goto('/demos/scroll');

    const foreground = page.getByTestId('scroll-foreground');
    const linked = page.getByTestId('scroll-linked-value');
    await foreground.scrollIntoViewIfNeeded();
    await expect(foreground).toBeVisible();
    await expect(linked).toBeVisible();

    const before = await settledMotionState(linked);

    await page.getByTestId('scroll-container').evaluate((el) => {
      el.scrollTop = el.scrollHeight;
      el.dispatchEvent(new Event('scroll'));
    });

    // moveTransform (opacity) updates synchronously with scroll progress; moveSpringValue
    // (translate) then settles asynchronously toward the same progress — both must actually move.
    await expect.poll(async () => settledMotionState(linked), { timeout: 3000 }).not.toBe(before);
  });

  test('SVG icons: rapid toggling of an icon helper + moveVariants leaves no stuck or duplicate players', async ({
    page,
  }) => {
    await page.goto('/demos/icons');

    const toggle = page.getByRole('button', { name: /Animate|Reset/ });
    await expect(toggle).toBeVisible();

    // Flip the toggle four times with no settling in between.
    for (let i = 0; i < 4; i++) {
      await toggle.click();
    }

    // Whichever state it lands on, the icon paths must end up in a stable, consistent state with
    // no leaked animations from the rapid toggling.
    await expect(toggle).toBeVisible();
    await expect
      .poll(async () => page.evaluate(() => document.getAnimations().length), { timeout: 3000 })
      .toBe(0);
  });
});
