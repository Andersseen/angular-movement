import { expect, test, type Locator, type Page } from '@playwright/test';
import { waitForHydration } from './hydration';
import { motionState, settledMotionState } from './motion-state';

/**
 * Repeated-interaction contracts (spec 020). "Works the first time" is not evidence: each test
 * drives one stateful primitive through many cycles and asserts measurable invariants afterwards —
 * the element is back where it started, nothing is still animating, nothing leaked into the DOM.
 * No frame sequences, no fixed sleeps as synchronisation.
 */

/** Running animations on an element (committed ones are cancelled by the engine, so this is 0). */
async function runningAnimations(locator: Locator): Promise<number> {
  return locator.evaluate((el) => el.getAnimations().length);
}

async function expectIdle(locator: Locator): Promise<void> {
  await expect.poll(() => runningAnimations(locator), { timeout: 5000 }).toBe(0);
}

/**
 * Identity can serialise several ways depending on whether an animation has run (`translate: none`
 * vs `0px`, `scale: none` vs `1`). Those are the same rest state; anything else is a stuck value.
 */
function canonical(state: string): string {
  const identity = new Set([
    'none',
    '0px',
    '0px 0px',
    '1',
    '1 1',
    '0deg',
    'matrix(1, 0, 0, 1, 0, 0)',
  ]);
  return state
    .split(' | ')
    .map((value) => (identity.has(value) ? 'identity' : value))
    .join(' | ');
}

/** The workbench header is sticky and can sit over a control; click through the DOM, as the demos spec does. */
function domClick(locator: Locator): Promise<void> {
  return locator.evaluate((el) => (el as HTMLElement).click());
}

async function open(page: Page, route: string): Promise<void> {
  await page.goto(route);
  await waitForHydration(page);
}

test.describe('repeated interaction contracts', () => {
  test('moveWhileHover: 30 rapid enter/leave cycles leave no stuck state', async ({ page }) => {
    await open(page, '/demos/hover');
    const card = page.locator('.cursor-pointer', { hasText: 'Hover over this card' });
    await expect(card).toBeVisible();
    const baseline = canonical(await settledMotionState(card));
    const box = (await card.boundingBox())!;
    const inside = { x: box.x + box.width / 2, y: box.y + box.height / 2 };

    for (let i = 0; i < 30; i += 1) {
      await page.mouse.move(inside.x, inside.y);
      await page.mouse.move(2, 2);
    }

    await expectIdle(card);
    expect(canonical(await settledMotionState(card))).toBe(baseline);
  });

  test('moveWhileTap: 20 press/release cycles end back at rest', async ({ page }) => {
    await open(page, '/demos/tap');
    const button = page.locator('button', { hasText: /Press|Shrink/ });
    await expect(button).toBeVisible();
    const baseline = canonical(await settledMotionState(button));
    const box = (await button.boundingBox())!;

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    for (let i = 0; i < 20; i += 1) {
      await page.mouse.down();
      await page.mouse.up();
    }
    await page.mouse.move(2, 2);

    await expectIdle(button);
    expect(canonical(await settledMotionState(button))).toBe(baseline);
  });

  test('moveVariants: 24 rapid state switches settle on exactly the last state', async ({
    page,
  }) => {
    await open(page, '/demos/variants');
    const target = page.getByTestId('variants-target');
    const pick = (name: string) => domClick(page.getByTestId(`variant-button-${name}`));

    // The reference for each state is the first time it settles, from a calm switch.
    const reference: Record<string, string> = {};
    for (const name of ['idle', 'hover', 'active']) {
      await pick(name);
      reference[name] = await settledMotionState(target);
    }

    const order = ['idle', 'hover', 'active'];
    let last = 'idle';
    for (let i = 0; i < 24; i += 1) {
      last = order[(i * 2 + (i % 3)) % 3];
      await pick(last); // no waiting: each click interrupts the previous transition
    }

    await expectIdle(target);
    expect(await settledMotionState(target)).toBe(reference[last]);
  });

  test('movePresence: 20 tab switches never leave a ghost panel in the DOM', async ({ page }) => {
    await open(page, '/demos/presence');
    const tabs = page.locator('[data-testid^="presence-tab-"]');
    const panels = page.locator('[data-testid^="presence-panel-"]');
    const count = await tabs.count();
    expect(count).toBeGreaterThan(1);
    await expect(panels).toHaveCount(1);

    for (let i = 0; i < 20; i += 1) {
      await domClick(tabs.nth(i % count)); // immediately, while the previous exit still runs
    }

    // Exits finish and every outgoing view is removed: exactly the active panel remains.
    await expect(panels).toHaveCount(1, { timeout: 5000 });
    await expect(panels.first()).toHaveAttribute(
      'data-testid',
      (await tabs.nth(19 % count).getAttribute('data-testid'))!.replace('tab', 'panel'),
    );
  });

  test('movePresenceFor: add/remove churn keeps the DOM equal to the model', async ({ page }) => {
    await open(page, '/demos/presence-list');
    const list = page.getByTestId('presence-list');
    const rows = list.locator('[data-testid^="presence-list-item-"]');
    await expect(rows.first()).toBeVisible();
    const initial = await rows.count();

    for (let i = 0; i < 8; i += 1) {
      await domClick(page.getByTestId('presence-list-add'));
    }
    await expect(rows).toHaveCount(initial + 8, { timeout: 5000 });

    // Remove the 8 added rows by identity, back to back, while earlier exits are still running.
    // (Always taking `.first()` would hit the same exiting row again.)
    const added = (
      await rows.evaluateAll((els) => els.map((el) => el.getAttribute('data-testid')))
    ).slice(initial);
    expect(added).toHaveLength(8);
    for (const id of added) {
      await domClick(list.locator(`[data-testid="presence-list-remove-${id!.split('-').pop()}"]`));
    }
    await expect(rows).toHaveCount(initial, { timeout: 8000 });
  });

  test('moveLayout: 20 grid/list toggles return every item to its original box', async ({
    page,
  }) => {
    await open(page, '/demos/layout');
    const items = page.getByTestId('layout-demo-item');
    await expect(items).toHaveCount(6);

    const boxes = async () =>
      items.evaluateAll((els) =>
        els.map((el) => {
          const r = el.getBoundingClientRect();
          return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)];
        }),
      );
    const click = (id: string) => domClick(page.getByTestId(id));

    const original = await boxes();
    for (let i = 0; i < 20; i += 1) {
      await click(i % 2 === 0 ? 'layout-list-button' : 'layout-grid-button');
    }
    // Even number of toggles: back in grid. FLIP must not leave scale/offset drift behind.
    await expect.poll(boxes, { timeout: 5000 }).toEqual(original);
    for (const item of await items.all()) {
      await expectIdle(item);
      expect(await item.evaluate((el) => getComputedStyle(el).transform)).toMatch(
        /^(none|matrix\(1, 0, 0, 1, 0, 0\))$/,
      );
    }
  });

  test('MoveAnimator: animate/set/clear sequences always restore the element', async ({ page }) => {
    await open(page, '/demos/imperative');
    const card = page.getByTestId('animator-card');
    const press = (id: string) => domClick(page.getByTestId(id));
    await expect(card).toBeVisible();
    const pristine = await card.evaluate((el) => el.getAttribute('style') ?? '');
    const pristineMotion = await settledMotionState(card);

    for (let i = 0; i < 10; i += 1) {
      await press('animator-animate');
      await press('animator-animate'); // before the previous one completes
      await press('animator-set');
      await press('animator-clear');
      await press('animator-set');
      await press('animator-clear');
    }
    await press('animator-animate');
    await press('animator-clear'); // clear while animating

    await expectIdle(card);
    expect(await settledMotionState(card)).toBe(pristineMotion);
    expect(await card.evaluate((el) => el.getAttribute('style') ?? '')).toBe(pristine);
    expect(await motionState(card)).toBe(pristineMotion);
  });
});
