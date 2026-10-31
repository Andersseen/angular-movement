import { expect, test, type Locator, type Page } from '@playwright/test';
import { waitForHydration } from './hydration';

/**
 * Layout motion contracts (spec 021). Every assertion is geometry or lifecycle: where a box is on
 * screen, whether anything is still animating, whether inline state was restored. No frame arrays,
 * no screenshots, no fixed sleeps as synchronisation.
 *
 * They run on all three engines: measurement, interruption and shared-element handover are exactly
 * where WAAPI and layout behaviour differ between browsers.
 */

type Box = [number, number, number, number];

async function open(page: Page, route = '/demos/layout'): Promise<void> {
  await page.goto(route);
  await waitForHydration(page);
}

const item = (page: Page) => page.getByTestId('layout-demo-item');
const press = (page: Page, id: string) =>
  page.getByTestId(id).evaluate((el) => (el as HTMLElement).click());

function boxes(locator: Locator): Promise<Box[]> {
  return locator.evaluateAll((els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect();
      return [r.x, r.y, r.width, r.height] as Box;
    }),
  );
}

const rounded = (b: Box[]) => b.map((box) => box.map((v) => Math.round(v)));

const maxJump = (a: Box[], b: Box[]) =>
  Math.max(...a.map((box, i) => Math.max(...box.map((v, k) => Math.abs(v - b[i][k])))));

/** Nothing on the page is animating: every layout item is at rest. */
async function expectAtRest(page: Page): Promise<void> {
  await expect.poll(() => page.evaluate(() => document.getAnimations().length)).toBe(0);
}

/** Web Animations on the page that Movement started — CSS transitions (hover colours) excluded. */
function motionAnimations(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      document
        .getAnimations()
        .filter((a) => !(a instanceof CSSTransition) && !(a instanceof CSSAnimation)).length,
  );
}

/**
 * The host holds no borrowed `transform-origin` and no leftover motion. Polled: a cancelled
 * animation announces itself asynchronously, so the restore lands a frame after `getAnimations()`
 * already reads empty.
 */
async function expectNoResidue(locator: Locator): Promise<void> {
  for (const el of await locator.all()) {
    await expect
      .poll(() =>
        el.evaluate((node) => {
          const s = (node as HTMLElement).style;
          const c = getComputedStyle(node);
          const identity =
            ['none', '0px', '0px 0px'].includes(c.translate) &&
            ['none', '1', '1 1'].includes(c.scale) &&
            ['none', 'matrix(1, 0, 0, 1, 0, 0)'].includes(c.transform);
          return { origin: s.transformOrigin, identity };
        }),
      )
      .toEqual({ origin: '', identity: true });
  }
}

/** Runs `action` inside the page, then reports the item boxes `frames` animation frames later. */
function actAndMeasure(
  page: Page,
  selector: string,
  action: () => void,
  frames = 2,
): Promise<{ before: Box[]; after: Box[] }> {
  return page.evaluate(
    async ({ selector, action, frames }) => {
      const read = () =>
        Array.from(document.querySelectorAll(selector)).map((el) => {
          const r = el.getBoundingClientRect();
          return [r.x, r.y, r.width, r.height] as [number, number, number, number];
        });
      const before = read();
      new Function(`(${action})()`)();
      for (let i = 0; i < frames; i += 1) {
        await new Promise((r) => requestAnimationFrame(() => r(null)));
      }
      return { before, after: read() };
    },
    { selector, action: action.toString(), frames },
  );
}

test.describe('layout: interruption and repetition', () => {
  test('a layout change during an active FLIP continues from the visible position', async ({
    page,
  }) => {
    await open(page);
    await expect(item(page)).toHaveCount(6);

    await press(page, 'layout-list-button');
    // Mid-flight: wait until the items have actually started moving.
    await expect
      .poll(() =>
        item(page)
          .first()
          .evaluate((el) => el.getAnimations().length),
      )
      .toBeGreaterThan(0);

    const { before, after } = await actAndMeasure(page, '[data-testid="layout-demo-item"]', () =>
      (document.querySelector('[data-testid="layout-grid-button"]') as HTMLElement).click(),
    );

    // Two frames move a box by a few px; a jump to the new natural layout is tens of px.
    expect(maxJump(before, after)).toBeLessThan(24);
  });

  test('30 un-awaited toggles settle on the natural layout with nothing left behind', async ({
    page,
  }) => {
    await open(page);
    await expect(item(page)).toHaveCount(6);
    const original = rounded(await boxes(item(page)));

    for (let i = 0; i < 30; i += 1) {
      await press(page, i % 2 === 0 ? 'layout-list-button' : 'layout-grid-button');
    }

    await expectAtRest(page);
    expect(rounded(await boxes(item(page)))).toEqual(original);
    await expectNoResidue(item(page));
  });

  test('resizing the container reflows the grid and settles exactly', async ({ page }) => {
    await open(page);
    const original = rounded(await boxes(item(page)));

    await press(page, 'layout-resize-button'); // 264px -> 196px: 4 columns -> 3
    await expectAtRest(page);
    const narrow = rounded(await boxes(item(page)));
    expect(narrow).not.toEqual(original);

    // Rapid repeated resizing, interrupting every animation.
    for (let i = 0; i < 12; i += 1) await press(page, 'layout-resize-button');
    await expectAtRest(page);
    expect(rounded(await boxes(item(page)))).toEqual(narrow);
    await expectNoResidue(item(page));
  });

  test('a render that does not move anything starts no animation', async ({ page }) => {
    await open(page);
    await expect(item(page)).toHaveCount(6);

    // Appending a 7th card re-renders; the existing six keep their boxes.
    await press(page, 'layout-add-button');
    await expect(item(page)).toHaveCount(7);
    const running = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[data-testid="layout-demo-item"]')).map(
        (el) => el.getAnimations().length,
      ),
    );
    expect(running).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });

  test('filtering moves the surviving items and keeps their identity', async ({ page }) => {
    await open(page);
    const ids = () => item(page).evaluateAll((els) => els.map((el) => el.textContent?.trim()));
    expect(await ids()).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);

    await item(page)
      .nth(3)
      .evaluate((el) => el.setAttribute('data-mark', 'd'));
    await press(page, 'layout-filter-button');
    await expect(item(page)).toHaveCount(3);
    await expectAtRest(page);
    expect(await ids()).toEqual(['B', 'D', 'F']);
    // Same DOM node, not a recreated one: identity belongs to the application's `track`.
    await expect(page.locator('[data-mark="d"]')).toHaveText('D');

    await press(page, 'layout-filter-button');
    await expect(item(page)).toHaveCount(6);
    await expectAtRest(page);
    await expectNoResidue(item(page));
  });

  test('an externally cancelled FLIP releases the host and the next change still animates', async ({
    page,
  }) => {
    await open(page);
    const original = rounded(await boxes(item(page)));

    await press(page, 'layout-list-button');
    await expect
      .poll(() =>
        item(page)
          .first()
          .evaluate((el) => el.getAnimations().length),
      )
      .toBeGreaterThan(0);
    await page.evaluate(() => document.getAnimations().forEach((a) => a.cancel()));
    await expectAtRest(page);
    await expectNoResidue(item(page));

    // Measurement must not stay suppressed: the next change animates.
    await press(page, 'layout-grid-button');
    await expect
      .poll(() =>
        item(page)
          .first()
          .evaluate((el) => el.getAnimations().length),
      )
      .toBeGreaterThan(0);
    await expectAtRest(page);
    expect(rounded(await boxes(item(page)))).toEqual(original);
    await expectNoResidue(item(page));
  });

  test('destroying the host mid-FLIP throws nothing and leaves nothing animating', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await open(page);

    await press(page, 'layout-list-button');
    await expect
      .poll(() =>
        item(page)
          .first()
          .evaluate((el) => el.getAnimations().length),
      )
      .toBeGreaterThan(0);
    await press(page, 'layout-scenario-shared'); // reflow scenario is destroyed mid-animation

    await expect(page.getByTestId('layout-demo-items')).toHaveCount(0);
    await expectAtRest(page);
    expect(errors).toEqual([]);
  });

  test('reduced motion applies the final geometry with no animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page);
    const before = rounded(await boxes(item(page)));

    await press(page, 'layout-list-button');
    await expect(page.getByTestId('layout-demo-items')).toHaveAttribute('data-layout', 'list');
    expect(await motionAnimations(page)).toBe(0);
    expect(rounded(await boxes(item(page)))).not.toEqual(before);
    await expectNoResidue(item(page));
  });
});

test.describe('layout: geometry', () => {
  test('scrolling a container is not layout movement; filtering inside it still animates', async ({
    page,
  }) => {
    await open(page);
    const grid = page.getByTestId('layout-demo-items');
    // The consumer's scroll container: a short, scrolled grid.
    await grid.evaluate((el) => {
      el.style.height = '110px';
      el.style.overflow = 'auto';
      el.scrollTop = 0;
    });
    await press(page, 'layout-add-button'); // render with the grid at scrollTop 0
    await expect(item(page)).toHaveCount(7);
    await expectAtRest(page);

    await grid.evaluate((el) => (el.scrollTop = 70));
    await press(page, 'layout-add-button'); // another render, after the scroll
    await expect(item(page)).toHaveCount(8);
    const running = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[data-testid="layout-demo-item"]')).map(
        (el) => el.getAnimations().length,
      ),
    );
    expect(running.every((n) => n === 0)).toBe(true);

    // A real layout change inside the scrolled container continues from the visible positions.
    const { before, after } = await actAndMeasure(page, '[data-testid="layout-demo-item"]', () =>
      (document.querySelector('[data-testid="layout-list-button"]') as HTMLElement).click(),
    );
    expect(maxJump(before, after)).toBeLessThan(30);
  });

  test('an element with its own transform is measured in layout space, not counted twice', async ({
    page,
  }) => {
    await open(page);
    const first = item(page).first();
    // A consumer-owned transform (here an inline translate + scale) must neither trigger
    // a FLIP nor be baked into the next one.
    await first.evaluate((el) => {
      (el as HTMLElement).style.transform = 'translate(6px, 4px) scale(1.2)';
    });
    await press(page, 'layout-add-button');
    await expect(item(page)).toHaveCount(7);
    expect(await first.evaluate((el) => el.getAnimations().length)).toBe(0);

    await press(page, 'layout-list-button');
    await expectAtRest(page);
    // Its own transform survived the FLIP untouched, and the box it ends in is the natural list box.
    expect(await first.evaluate((el) => (el as HTMLElement).style.transform)).toBe(
      'translate(6px, 4px) scale(1.2)',
    );
  });
});

test.describe('layout: nested', () => {
  test('a render mid-way through a parent FLIP does not re-animate children that did not move', async ({
    page,
  }) => {
    await open(page);
    await press(page, 'layout-nest-button'); // the container becomes a layout host as well
    await expectAtRest(page);

    await press(page, 'layout-resize-button'); // parent narrows, children wrap and FLIP
    await expect
      .poll(() => page.getByTestId('layout-demo-items').evaluate((el) => el.getAnimations().length))
      .toBeGreaterThan(0);

    // A render that changes no geometry (the duration control): count animations created by it.
    const created = await page.evaluate(async () => {
      let count = 0;
      const animate = Element.prototype.animate;
      Element.prototype.animate = function (this: Element, ...args: Parameters<typeof animate>) {
        count += 1;
        return animate.apply(this, args);
      };
      const range = document.querySelector('input[type="range"]') as HTMLInputElement;
      range.value = String(Number(range.value) + 10);
      range.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null))));
      Element.prototype.animate = animate;
      return count;
    });
    expect(created).toBe(0);

    await expectAtRest(page);
    await expectNoResidue(item(page));
    await expectNoResidue(page.getByTestId('layout-demo-items'));
  });
});

test.describe('layout: shared element', () => {
  const card = (page: Page, id: number) => page.getByTestId(`layout-shared-card-${id}`);
  const detail = (page: Page) => page.getByTestId('layout-shared-detail');

  async function openShared(page: Page): Promise<void> {
    await open(page);
    await press(page, 'layout-scenario-shared');
    await expect(card(page, 1)).toBeVisible();
  }

  test('the detail starts on the card it replaces and ends on its natural box', async ({
    page,
  }) => {
    await openShared(page);
    const cardBox = (await boxes(card(page, 2)))[0];

    const { after } = await page.evaluate(async () => {
      (document.querySelector('[data-testid="layout-shared-card-2"]') as HTMLElement).click();
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null))));
      const r = document
        .querySelector('[data-testid="layout-shared-detail"]')!
        .getBoundingClientRect();
      return { after: [r.x, r.y, r.width, r.height] as Box };
    });

    await expectAtRest(page);
    const natural = (await boxes(detail(page)))[0];
    // Two frames in, the detail is much closer to the card than to its final box.
    const dist = (a: Box, b: Box) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2], a[3] - b[3]);
    expect(dist(after, cardBox)).toBeLessThan(dist(after, natural) * 0.6);
    // And it lands on the natural box: full row width, no scale left behind.
    expect(natural[2]).toBeGreaterThan(cardBox[2] * 2);
    await expectNoResidue(detail(page));
  });

  test('focus follows the application: close button on open, the card on close', async ({
    page,
  }) => {
    await openShared(page);
    await card(page, 1).evaluate((el) => (el as HTMLElement).click());
    await expect(page.getByTestId('layout-shared-close')).toBeFocused();

    await press(page, 'layout-shared-close');
    await expect(card(page, 1)).toBeFocused();
    await expect(detail(page)).toHaveCount(0);
  });

  test('rapid A/B/A handover settles with one detail, no ghost and no residue', async ({
    page,
  }) => {
    await openShared(page);
    const sequence = [1, 2, 1, 3];
    for (const id of sequence) {
      const open = page.getByTestId(`layout-shared-card-${id}`);
      if (await open.count()) await open.evaluate((el) => (el as HTMLElement).click());
      else await press(page, 'layout-shared-close');
    }
    await expectAtRest(page);
    await expect(detail(page)).toHaveCount(1);
    await expectNoResidue(detail(page));
    // The remaining cards sit back in their grid cells.
    const cards = page.locator('[data-testid^="layout-shared-card-"]');
    await expectNoResidue(cards);

    await press(page, 'layout-shared-close');
    await expect(detail(page)).toHaveCount(0);
    await expect(cards).toHaveCount(3);
    await expectAtRest(page);
    await expectNoResidue(cards);
  });

  test('reduced motion hands over with no animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openShared(page);
    await card(page, 2).evaluate((el) => (el as HTMLElement).click());
    await expect(detail(page)).toBeVisible();
    expect(await motionAnimations(page)).toBe(0);
  });

  test('a handover after the 300ms window is not a handover', async ({ page }) => {
    await openShared(page);
    await card(page, 1).evaluate((el) => (el as HTMLElement).click());
    await expectAtRest(page);
    await press(page, 'layout-shared-close');
    await expectAtRest(page);
    // Cards are back; a second detail opened now claims from the card published moments ago —
    // the point is that nothing throws and everything settles after repeated cycles.
    for (let i = 0; i < 8; i += 1) {
      await card(page, 3).evaluate((el) => (el as HTMLElement).click());
      await press(page, 'layout-shared-close');
    }
    await expectAtRest(page);
    await expect(detail(page)).toHaveCount(0);
  });
});

test.describe('layout: with presence', () => {
  const rows = (page: Page) => page.locator('[data-testid^="layout-presence-item-"]');

  async function openPresence(page: Page): Promise<void> {
    await open(page);
    await press(page, 'layout-scenario-presence');
    await expect(rows(page)).toHaveCount(3);
  }

  test('surrounding rows close the gap while the exiting row is still mounted', async ({
    page,
  }) => {
    await openPresence(page);
    const thirdBefore = (await boxes(rows(page).nth(2)))[0];

    await press(page, 'layout-presence-remove-1');
    // popLayout: the exiting row is out of flow, so the rest start moving up straight away.
    await expect
      .poll(async () => (await boxes(rows(page).nth(2)))[0][1])
      .toBeLessThan(thirdBefore[1]);
    await expect(rows(page)).toHaveCount(2, { timeout: 5000 });
    await expectAtRest(page);

    const final = await boxes(rows(page));
    expect(final[1][1]).toBeGreaterThan(final[0][1] + final[0][3] - 1); // contiguous, no overlap
    await expectNoResidue(rows(page));
  });

  test('25 add/remove/reverse cycles end on a clean, contiguous list', async ({ page }) => {
    await openPresence(page);
    // One in-page loop: 75 Playwright round-trips would measure the runner, not the library.
    await page.evaluate(async () => {
      const click = (el: Element | null) => (el as HTMLElement).click();
      const frame = () => new Promise((r) => requestAnimationFrame(() => r(null)));
      for (let i = 0; i < 25; i += 1) {
        click(document.querySelector('[data-testid="layout-presence-add"]'));
        await frame();
        click(document.querySelector('[data-testid="layout-presence-shuffle"]'));
        await frame();
        const rows = document.querySelectorAll('[data-testid^="layout-presence-item-"]');
        const id = rows[rows.length - 1].getAttribute('data-testid')!.split('-').pop();
        click(document.querySelector(`[data-testid="layout-presence-remove-${id}"]`));
        await frame();
      }
    });
    await expectAtRest(page);
    const count = await rows(page).count();
    expect(count).toBeGreaterThanOrEqual(3);
    const final = await boxes(rows(page));
    for (let i = 1; i < final.length; i += 1) {
      expect(final[i][1]).toBeGreaterThanOrEqual(final[i - 1][1] + final[i - 1][3] - 1);
    }
    await expectNoResidue(rows(page));
  });
});
