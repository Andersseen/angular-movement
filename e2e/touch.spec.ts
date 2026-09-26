import { expect, test, type Page } from '@playwright/test';
import { settledMotionState } from './motion-state';

/**
 * Touch semantics for the interaction directives (spec 014), on Chromium, Firefox and WebKit.
 *
 * `moveWhileHover` used to bind `touchstart` and call `preventDefault()`, which blocked the
 * synthesized click on links and could block scrolling; the browser's compatibility mouse events
 * after a tap then left elements stuck "hovered". These tests pin the fixed contract with real
 * touch input — unit tests cannot see any of it.
 */
test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });

/**
 * Host listeners only exist after hydration; asserting before it would test the SSR markup.
 * Dev builds publish the `ng` debugging global when the client app bootstraps.
 */
async function waitForHydration(page: Page): Promise<void> {
  await page.waitForFunction(
    () =>
      typeof (window as unknown as { ng?: { getComponent?: unknown } }).ng?.getComponent ===
      'function',
    undefined,
    { timeout: 15_000 },
  );
}

test('a link with moveWhileHover="lift" moveWhileTap="press" navigates on tap', async ({
  page,
}) => {
  await page.goto('/demos/hover');
  const link = page.getByTestId('hover-link');
  await link.scrollIntoViewIfNeeded();
  await waitForHydration(page);

  await link.tap();

  await expect(page).toHaveURL(/\/demos\/tap$/);
});

test('neither hover nor tap default-prevents touchstart', async ({ page }) => {
  await page.goto('/demos/hover');
  const link = page.getByTestId('hover-link');
  await waitForHydration(page);

  // A plain cancelable Event reaches every touchstart listener the same way a real one does, in
  // every engine — including ones without a `Touch` constructor.
  const prevented = await link.evaluate((el) => {
    const event = new Event('touchstart', { bubbles: true, cancelable: true });
    el.dispatchEvent(event);
    return event.defaultPrevented;
  });

  expect(prevented).toBe(false);
});

test('tapping leaves no sticky hover state, and press still plays and releases', async ({
  page,
}) => {
  await page.goto('/demos/hover');
  const card = page.getByTestId('hover-card');
  await card.scrollIntoViewIfNeeded();
  await waitForHydration(page);

  await card.tap();
  await settledMotionState(card);

  const { translate, inlineScale } = await card.evaluate((el) => ({
    translate: getComputedStyle(el).translate,
    inlineScale: (el as HTMLElement).style.scale,
  }));

  // `lift` would leave translate at "0px -4px" if the tap had been treated as hover.
  expect(['none', '0px', '0px 0px']).toContain(translate);
  // moveWhileTap="press" ran (it commits its released state inline) and released fully.
  expect(inlineScale).toBe('1');
});

test('a touch scroll that starts on an animated link still scrolls the page', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'synthesized touch drags need the Chromium CDP');

  await page.goto('/demos/hover');
  const link = page.getByTestId('hover-link');
  await link.scrollIntoViewIfNeeded();
  await waitForHydration(page);

  const box = await link.boundingBox();
  if (!box) throw new Error('hover link did not lay out');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  const before = await page.evaluate(() => window.scrollY);
  // Drag the finger down (content scrolls up) when there is room above, otherwise up.
  const direction = before > 150 ? 1 : -1;

  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let step = 1; step <= 10; step += 1) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x, y: y + direction * step * 12 }],
    });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

  await expect
    .poll(async () => Math.abs((await page.evaluate(() => window.scrollY)) - before))
    .toBeGreaterThan(20);
  // A drag is not a tap: no navigation.
  await expect(page).toHaveURL(/\/demos\/hover$/);
});
