import { expect, test, type Locator } from '@playwright/test';
import { settledMotionState } from './motion-state';

/**
 * Regression coverage modelled on how real apps use the library (spec 014's consumer audit):
 * `lift`/`press` on the same element, `MoveAnimator` as the imperative API, a View Transition
 * reveal, and `moveTrigger` as a bare imperative handle. Chromium only — see playwright.config.ts.
 */

async function channels(locator: Locator) {
  return locator.evaluate((el) => {
    const style = getComputedStyle(el);
    return { translate: style.translate, scale: style.scale, opacity: style.opacity };
  });
}

test.describe('lift + press composition (mouse)', () => {
  test('hover lifts, press scales without dropping the lift, and both reverse cleanly', async ({
    page,
  }) => {
    await page.goto('/demos/hover');
    const card = page.getByTestId('hover-card');
    await expect(card).toBeVisible();

    await card.hover();
    await expect.poll(async () => (await channels(card)).translate).toBe('0px -4px');

    const box = await card.boundingBox();
    if (!box) throw new Error('hover card did not lay out');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await settledMotionState(card);
    // press owns `scale`, lift owns `translate`: both hold at once.
    expect(await channels(card)).toEqual(
      expect.objectContaining({ translate: '0px -4px', scale: '0.97' }),
    );

    await page.mouse.up();
    await settledMotionState(card);
    expect(await channels(card)).toEqual(
      expect.objectContaining({ translate: '0px -4px', scale: '1' }),
    );

    await page.mouse.move(0, 0);
    await settledMotionState(card);
    expect(['none', '0px', '0px 0px']).toContain((await channels(card)).translate);
  });
});

test.describe('MoveAnimator demo', () => {
  test('set() commits a state instantly and clear() returns to the stylesheet', async ({
    page,
  }) => {
    await page.goto('/demos/imperative');
    const card = page.getByTestId('animator-card');
    await expect(card).toBeVisible();

    await page.getByTestId('animator-set').click();
    await expect
      .poll(async () => channels(card))
      .toEqual(expect.objectContaining({ opacity: '0.6', translate: '0px 8px' }));

    await page.getByTestId('animator-clear').click();
    await expect.poll(async () => (await channels(card)).opacity).toBe('1');
    expect(['none', '0px', '0px 0px']).toContain((await channels(card)).translate);
  });

  test('animate() accepts the viewChild ElementRef and runs a WAAPI animation', async ({
    page,
  }) => {
    await page.goto('/demos/imperative');
    const card = page.getByTestId('animator-card');
    await expect(card).toBeVisible();

    await page.getByTestId('animator-animate').click();

    await expect
      .poll(async () => card.evaluate((el) => el.getAnimations().length))
      .toBeGreaterThan(0);
  });

  test('a bare moveTrigger plays two phases with per-call durations and ends hidden', async ({
    page,
  }) => {
    await page.goto('/demos/imperative');
    const overlay = page.getByTestId('trigger-overlay');

    await expect(overlay).toBeAttached();
    // Record every animate() call on the overlay: the 160ms phase is shorter than a poll interval.
    await overlay.evaluate((el) => {
      const durations: unknown[] = [];
      (window as unknown as { __overlayDurations: unknown[] }).__overlayDurations = durations;
      const original = el.animate.bind(el);
      el.animate = (keyframes, options) => {
        durations.push(typeof options === 'object' ? options?.duration : options);
        return original(keyframes, options);
      };
    });

    await page.getByTestId('trigger-flash').click();

    await expect
      .poll(() =>
        page.evaluate(
          () => (window as unknown as { __overlayDurations: unknown[] }).__overlayDurations,
        ),
      )
      .toEqual([420, 160]);
    await expect.poll(async () => (await channels(overlay)).opacity).toBe('0');
  });

  test('View Transition reveal animates ::view-transition-new(root) through MoveAnimator', async ({
    page,
  }) => {
    await page.goto('/demos/imperative');
    const toggle = page.getByTestId('reveal-toggle');
    await expect(toggle).toBeVisible();

    const supported = await page.evaluate(
      () =>
        typeof (document as { startViewTransition?: unknown }).startViewTransition === 'function',
    );
    test.skip(!supported, 'this browser build has no View Transitions');

    // Capture the pseudo-element animation the moment MoveAnimator creates it.
    await page.evaluate(() => {
      const w = window as unknown as { __revealAnimation?: unknown };
      const original = Element.prototype.animate;
      Element.prototype.animate = function (this: Element, keyframes, options) {
        const animation = original.call(this, keyframes, options);
        if (typeof options === 'object' && options?.pseudoElement) {
          w.__revealAnimation = {
            pseudoElement: options.pseudoElement,
            duration: options.duration,
            fill: options.fill,
            keyframes: (animation.effect as KeyframeEffect)
              .getKeyframes()
              .map((k) => k['clipPath']),
          };
        }
        return animation;
      };
    });

    await toggle.click();

    await expect(page.getByTestId('reveal-status')).toHaveText('animated');
    const captured = await page.evaluate(
      () => (window as unknown as { __revealAnimation?: unknown }).__revealAnimation,
    );
    expect(captured).toEqual(
      expect.objectContaining({
        pseudoElement: '::view-transition-new(root)',
        duration: 520,
        fill: 'backwards',
      }),
    );
    expect((captured as { keyframes: string[] }).keyframes[0]).toMatch(/^circle\(0px at /);

    // The underlying DOM change committed, and nothing was written inline on <html>.
    await expect(page.getByTestId('reveal-panel')).toContainText('Midnight');
    expect(await page.evaluate(() => document.documentElement.style.clipPath)).toBe('');
  });

  test('under reduced motion the reveal skips the pseudo-element animation but still commits', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/demos/imperative');
    const supported = await page.evaluate(
      () =>
        typeof (document as { startViewTransition?: unknown }).startViewTransition === 'function',
    );
    test.skip(!supported, 'this browser build has no View Transitions');

    await page.getByTestId('reveal-toggle').click();

    await expect(page.getByTestId('reveal-status')).toHaveText('skipped');
    await expect(page.getByTestId('reveal-panel')).toContainText('Midnight');
  });
});
