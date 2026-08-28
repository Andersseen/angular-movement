import { type Locator } from '@playwright/test';

/**
 * The engine writes motion into the atomic CSS properties (`translate` / `scale` / `rotate`) and
 * only falls back to a composed `transform` when the element already has one. Asserting on
 * `transform` alone therefore misses most animations — read every channel.
 */
export async function motionState(locator: Locator): Promise<string> {
  return locator.evaluate((el) => {
    const style = getComputedStyle(el);
    return [style.transform, style.translate, style.scale, style.rotate, style.opacity].join(' | ');
  });
}

/**
 * Samples until the motion state stops changing, then returns it.
 *
 * Scroll-linked motion lerps toward its target. Sampling a baseline mid-lerp makes a later
 * "it changed" assertion pass on its own — which is exactly how this suite once reported a green
 * scroll test while `moveScroll` was ignoring container scrolls entirely.
 */
export async function settledMotionState(locator: Locator, timeout = 3000): Promise<string> {
  const deadline = Date.now() + timeout;
  let previous = await motionState(locator);

  while (Date.now() < deadline) {
    await locator.page().waitForTimeout(120);
    const current = await motionState(locator);
    if (current === previous) return current;
    previous = current;
  }

  return previous;
}
