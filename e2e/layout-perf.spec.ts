import { expect, test, type Page } from '@playwright/test';
import { waitForHydration } from './hydration';

/**
 * Layout cost budget (spec 021). Asserts the deterministic counts (layout reads, animation setups,
 * idle activity) and *reports* the timings: a wall-clock bound that fits every CI runner would be
 * too loose to catch a regression and one tight enough to catch it would flake. The reported
 * numbers are what `docs/v2/evidence/1.6/` records, compared before and after.
 */

interface Sample {
  items: number;
  /** Time from the click to the frame after the FLIP animations were created. */
  prepareMs: number;
  rectReads: number;
  styleReads: number;
  animations: number;
}

async function instrument(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = window as unknown as { __perf: Record<string, number> };
    w.__perf = { rect: 0, style: 0, animate: 0 };
    const rect = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function (this: Element) {
      w.__perf['rect']++;
      return rect.call(this);
    };
    const style = window.getComputedStyle;
    window.getComputedStyle = function (...args: Parameters<typeof style>) {
      w.__perf['style']++;
      return style.apply(window, args);
    } as typeof style;
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (this: Element, ...args: Parameters<typeof animate>) {
      w.__perf['animate']++;
      return animate.apply(this, args);
    };
  });
}

async function measure(page: Page, items: number, button: string): Promise<Sample> {
  return page.evaluate(
    async ({ items, button }) => {
      const w = window as unknown as { __perf: Record<string, number> };
      w.__perf = { rect: 0, style: 0, animate: 0 };
      const t0 = performance.now();
      (document.querySelector(`[data-testid="${button}"]`) as HTMLElement).click();
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null))));
      return {
        items,
        prepareMs: Math.round((performance.now() - t0) * 10) / 10,
        rectReads: w.__perf['rect'],
        styleReads: w.__perf['style'],
        animations: w.__perf['animate'],
      };
    },
    { items, button },
  );
}

test.describe('layout cost', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'counts are engine-independent');

  for (const count of [10, 50, 100]) {
    test(`reflow of ${count} items: bounded reads, one animation each, silent at rest`, async ({
      page,
    }) => {
      await page.goto('/demos/layout');
      await waitForHydration(page);
      const items = page.getByTestId('layout-demo-item');
      for (let i = 6; i < count; i += 1) {
        await page.getByTestId('layout-add-button').evaluate((el) => (el as HTMLElement).click());
      }
      await expect(items).toHaveCount(count);
      await expect.poll(() => page.evaluate(() => document.getAnimations().length)).toBe(0);

      await instrument(page);
      // Alternate list/grid so every pass is a full reflow; report the median of 7 passes.
      const samples: Sample[] = [];
      for (let i = 0; i < 7; i += 1) {
        samples.push(
          await measure(page, count, i % 2 === 0 ? 'layout-list-button' : 'layout-grid-button'),
        );
        await expect.poll(() => page.evaluate(() => document.getAnimations().length)).toBe(0);
      }
      const times = samples.map((s) => s.prepareMs).sort((a, b) => a - b);
      const sample = { ...samples[1], prepareMs: times[3], runs: times };
      console.log(`PERF ${JSON.stringify(sample)}`);

      // One FLIP per element that moved; every item moves between the grid and the list.
      expect(sample.animations).toBeLessThanOrEqual(count + 1);
      // One measurement per element per render pass (a rect + a computed-style read), not a storm.
      expect(sample.rectReads).toBeLessThanOrEqual(count * 4);
      expect(sample.prepareMs).toBeLessThan(2000);

      // Idle: with nothing changing there is no polling, no observer, no RAF loop.
      await expect.poll(() => page.evaluate(() => document.getAnimations().length)).toBe(0);
      const idle = await page.evaluate(async () => {
        const w = window as unknown as { __perf: Record<string, number> };
        w.__perf = { rect: 0, style: 0, animate: 0 };
        await new Promise((r) => setTimeout(r, 1000));
        return { ...w.__perf };
      });
      expect(idle).toEqual({ rect: 0, style: 0, animate: 0 });
    });
  }
});
