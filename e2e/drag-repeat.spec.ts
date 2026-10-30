import { expect, test, type Locator, type Page } from '@playwright/test';
import { waitForHydration } from './hydration';

/**
 * Repeated-drag contract (spec 020). The first drag always looked right; the defect only showed
 * from the second drag on, growing every cycle. So every scenario here performs many cycles and
 * asserts the invariant that makes drift impossible to hide:
 *
 *   while the button is held, the element's centre moves by exactly the pointer's movement.
 *
 * Centre-based on purpose: `whileDrag` scales and rotates about the centre, so the centre is the
 * one point those gesture channels cannot move. Geometry only — no screenshots.
 */

const TOLERANCE = 1.5; // px: sub-pixel layout rounding, not a drift budget
const CYCLES = 20;

async function centre(locator: Locator): Promise<{ x: number; y: number }> {
  // Changing a demo control unmounts the card for ~50 ms before it comes back; wait for it.
  await locator.waitFor({ state: 'visible' });
  const box = await locator.boundingBox();
  if (!box) throw new Error('element has no layout box');
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/** Waits until the element stopped moving (release animations settle without fixed sleeps). */
async function settle(locator: Locator): Promise<{ x: number; y: number }> {
  let previous = await centre(locator);
  let stable = 0;
  for (let i = 0; i < 200 && stable < 4; i += 1) {
    await locator.page().waitForTimeout(40);
    const current = await centre(locator);
    stable =
      Math.abs(current.x - previous.x) < 0.05 && Math.abs(current.y - previous.y) < 0.05
        ? stable + 1
        : 0;
    previous = current;
  }
  return previous;
}

interface CycleRecord {
  cycle: number;
  pressJump: number;
  pointerDeltaX: number;
  elementDeltaX: number;
  followError: number;
  releaseJump: number;
}

async function runCycles(
  page: Page,
  card: Locator,
  options: { dx: number; dy: number; cycles?: number; grab?: { x: number; y: number } },
): Promise<CycleRecord[]> {
  const records: CycleRecord[] = [];
  const cycles = options.cycles ?? CYCLES;
  const grab = options.grab ?? { x: 12, y: -8 };

  for (let cycle = 0; cycle < cycles; cycle += 1) {
    const before = await settle(card);
    // Pairs of same-direction drags so displacement accumulates; the run still stays on stage.
    const sign = Math.floor(cycle / 2) % 2 === 0 ? 1 : -1;
    const pointer = { x: before.x + grab.x, y: before.y + grab.y };

    await page.mouse.move(pointer.x, pointer.y);
    await page.mouse.down();
    const pressed = await settle(card);

    await page.mouse.move(pointer.x + sign * options.dx, pointer.y + sign * options.dy, {
      steps: 8,
    });
    const held = await centre(card);

    const pointerDeltaX = sign * options.dx;
    const elementDeltaX = held.x - pressed.x;
    const pointerDeltaY = sign * options.dy;
    const elementDeltaY = held.y - pressed.y;

    await page.mouse.up();
    const released = await settle(card);

    records.push({
      cycle,
      pressJump: Math.hypot(pressed.x - before.x, pressed.y - before.y),
      pointerDeltaX,
      elementDeltaX,
      followError: Math.hypot(elementDeltaX - pointerDeltaX, elementDeltaY - pointerDeltaY),
      releaseJump: Math.hypot(released.x - held.x, released.y - held.y),
    });
  }
  return records;
}

test.describe('moveDrag — repeated drags do not drift', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demos/drag');
    await waitForHydration(page);
    await expect(page.getByTestId('drag-card')).toBeVisible();
  });

  test('free drag: the element tracks the pointer on every one of 20 cycles', async ({
    page,
  }, testInfo) => {
    const records = await runCycles(page, page.getByTestId('drag-card'), { dx: 40, dy: 24 });
    await testInfo.attach('free-drag-cycles.json', {
      body: JSON.stringify(records, null, 2),
      contentType: 'application/json',
    });

    for (const record of records) {
      expect(record.pressJump, `press jump, cycle ${record.cycle}`).toBeLessThan(TOLERANCE);
      expect(record.followError, `follow error, cycle ${record.cycle}`).toBeLessThan(TOLERANCE);
      expect(record.releaseJump, `release jump, cycle ${record.cycle}`).toBeLessThan(TOLERANCE);
    }
  });
});

interface Point {
  x: number;
  y: number;
}

/**
 * KNOWN LIMITATION (test environment, not the library): on Linux WebKit in CI, Playwright delivers
 * only the first `pointermove` of a path issued right after `mouse.down()` from the second drag on
 * — a capturing document-level listener sees one event too, and the pre-fix code behaves
 * identically, so the page never receives the input. These scenarios still run on Chromium,
 * Firefox and macOS WebKit. Recorded in docs/v2/evidence/1.5/README.md; not verified on real Safari.
 */
function skipOnCiWebkit(browserName: string): void {
  test.skip(
    browserName === 'webkit' && !!process.env['CI'],
    'Playwright Linux WebKit drops pointermove after a 2nd press (see KNOWN LIMITATION above)',
  );
}

async function configure(
  page: Page,
  options: {
    axis?: 'free' | 'x' | 'y';
    constrained?: boolean;
    momentum?: boolean;
    snapToOrigin?: boolean;
    snapPoints?: boolean;
  },
): Promise<void> {
  if (options.axis) await page.locator('#axis').selectOption(options.axis);
  for (const id of ['constrained', 'momentum', 'snapToOrigin', 'snapPoints'] as const) {
    if (options[id]) await page.locator(`#${id}`).click();
  }
  // Each control change re-creates the demo element after a short unmount.
  await page
    .getByTestId('drag-card')
    .waitFor({ state: 'hidden', timeout: 1000 })
    .catch(() => undefined); // the unmount can end before the first poll
  await page.getByTestId('drag-card').waitFor({ state: 'visible' });
}

async function dragOnce(page: Page, card: Locator, dx: number, dy: number): Promise<Point> {
  const from = await settle(card);
  await page.mouse.move(from.x + 10, from.y + 6);
  await page.mouse.down();
  await page.mouse.move(from.x + 10 + dx, from.y + 6 + dy, { steps: 8 });
  await page.mouse.up();
  return settle(card);
}

test.describe('moveDrag — scenario matrix, repeated', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demos/drag');
    await waitForHydration(page);
    await expect(page.getByTestId('drag-card')).toBeVisible();
  });

  test('X-only: follows horizontally, never leaves its row, no drift over 12 cycles', async ({
    page,
    browserName,
  }) => {
    // KNOWN LIMITATION (test environment, not the library): Playwright's WebKit delivers a single
    // pointermove of a diagonal, axis-locked path from the second drag on — a capturing
    // document-level listener sees one event too, and the old code behaves identically. Horizontal
    // movement is unaffected, so WebKit uses it. See docs/v2/evidence/1.5/README.md.
    const dy = browserName === 'webkit' ? 0 : 30;
    await configure(page, { axis: 'x' });
    const card = page.getByTestId('drag-card');
    const origin = await settle(card);

    const records = await runCycles(page, card, { dx: 36, dy, cycles: 12 });
    for (const record of records) {
      expect(record.pressJump, `press jump ${record.cycle}`).toBeLessThan(TOLERANCE);
      expect(record.releaseJump, `release jump ${record.cycle}`).toBeLessThan(TOLERANCE);
      // dy is ignored on the locked axis, so the error is exactly the unfollowed vertical part.
      expect(record.elementDeltaX, `x follow ${record.cycle}`).toBeCloseTo(record.pointerDeltaX, 0);
    }
    expect((await settle(card)).y).toBeCloseTo(origin.y, 0);
  });

  test('Y-only: follows vertically, never leaves its column', async ({ page, browserName }) => {
    skipOnCiWebkit(browserName);
    await configure(page, { axis: 'y' });
    const card = page.getByTestId('drag-card');
    const origin = await settle(card);
    for (let i = 0; i < 8; i += 1) {
      const sign = Math.floor(i / 2) % 2 === 0 ? 1 : -1;
      const before = await settle(card);
      const after = await dragOnce(page, card, 30 * sign, 28 * sign);
      expect(after.x).toBeCloseTo(origin.x, 0);
      expect(after.y - before.y, `cycle ${i}`).toBeCloseTo(28 * sign, 0);
    }
  });

  test('numeric constraints: always settles inside the area, no press jump, 10 cycles', async ({
    page,
  }) => {
    await configure(page, { constrained: true });
    const card = page.getByTestId('drag-card');
    const origin = await settle(card);

    for (let i = 0; i < 10; i += 1) {
      // Alternate overshooting each edge so elastic + clamp is exercised repeatedly.
      const dx = i % 2 === 0 ? 260 : -260;
      const dy = i % 3 === 0 ? 200 : -200;
      const before = await settle(card);
      await page.mouse.move(before.x + 8, before.y + 4);
      await page.mouse.down();
      const pressed = await settle(card);
      expect(Math.hypot(pressed.x - before.x, pressed.y - before.y), `press ${i}`).toBeLessThan(
        TOLERANCE,
      );
      await page.mouse.move(before.x + 8 + dx, before.y + 4 + dy, { steps: 10 });
      await page.mouse.up();
      const rest = await settle(card);
      expect(Math.abs(rest.x - origin.x), `x ${i}`).toBeLessThanOrEqual(100 + TOLERANCE);
      expect(Math.abs(rest.y - origin.y), `y ${i}`).toBeLessThanOrEqual(80 + TOLERANCE);
    }
  });

  test('snap to origin: returns to exactly the same place after each of 10 drags', async ({
    page,
  }) => {
    await configure(page, { snapToOrigin: true });
    const card = page.getByTestId('drag-card');
    const origin = await settle(card);
    for (let i = 0; i < 10; i += 1) {
      const rest = await dragOnce(page, card, 70 + i * 3, -45);
      expect(Math.hypot(rest.x - origin.x, rest.y - origin.y), `cycle ${i}`).toBeLessThan(
        TOLERANCE,
      );
    }
  });

  test('snap points: rests on a snap point every time, and never accumulates', async ({
    page,
    browserName,
  }) => {
    skipOnCiWebkit(browserName);
    await configure(page, { snapPoints: true });
    const card = page.getByTestId('drag-card');
    const origin = await settle(card);
    const points: Point[] = [
      { x: -80, y: -56 },
      { x: 0, y: 0 },
      { x: 80, y: 56 },
    ];
    for (let i = 0; i < 12; i += 1) {
      const dx = i % 2 === 0 ? 90 : -90;
      const dy = i % 2 === 0 ? 60 : -60;
      const rest = await dragOnce(page, card, dx, dy);
      const nearest = Math.min(
        ...points.map((p) => Math.hypot(rest.x - origin.x - p.x, rest.y - origin.y - p.y)),
      );
      expect(nearest, `cycle ${i}`).toBeLessThan(TOLERANCE);
    }
  });

  test('momentum: no press jump on any of 10 cycles', async ({ page }) => {
    await configure(page, { momentum: true });
    const card = page.getByTestId('drag-card');
    for (let i = 0; i < 10; i += 1) {
      const sign = i % 2 === 0 ? 1 : -1;
      const before = await settle(card);
      await page.mouse.move(before.x + 6, before.y + 6);
      await page.mouse.down();
      const pressed = await settle(card);
      expect(Math.hypot(pressed.x - before.x, pressed.y - before.y), `press ${i}`).toBeLessThan(
        TOLERANCE,
      );
      await page.mouse.move(before.x + 6 + sign * 40, before.y + 6, { steps: 6 });
      await page.mouse.up();
      await settle(card);
    }
  });

  test('pressing during a release animation continues from where it is — no jump', async ({
    page,
    browserName,
  }) => {
    skipOnCiWebkit(browserName);
    await configure(page, { snapToOrigin: true });
    const card = page.getByTestId('drag-card');
    const origin = await settle(card);

    for (let i = 0; i < 6; i += 1) {
      const from = await settle(card);
      await page.mouse.move(from.x + 5, from.y + 5);
      await page.mouse.down();
      await page.mouse.move(from.x + 5 + 120, from.y + 5 + 60, { steps: 8 });
      await page.mouse.up();

      // Freeze the release mid-flight so the position is deterministic, not timing-dependent.
      await card.evaluate((el) => {
        for (const animation of el.getAnimations()) {
          animation.pause();
          animation.currentTime = Number(animation.effect?.getComputedTiming().endTime ?? 0) / 4;
        }
      });
      const frozen = await centre(card);
      expect(Math.hypot(frozen.x - origin.x, frozen.y - origin.y)).toBeGreaterThan(5);

      await page.mouse.move(frozen.x, frozen.y);
      await page.mouse.down();
      const pressed = await centre(card);
      expect(Math.hypot(pressed.x - frozen.x, pressed.y - frozen.y), `jump ${i}`).toBeLessThan(
        TOLERANCE,
      );

      // The new drag then tracks the pointer from that point and returns home on release.
      await page.mouse.move(frozen.x + 25, frozen.y + 15, { steps: 5 });
      const held = await centre(card);
      expect(Math.hypot(held.x - pressed.x - 25, held.y - pressed.y - 15)).toBeLessThan(TOLERANCE);
      await page.mouse.up();
      const rest = await settle(card);
      expect(Math.hypot(rest.x - origin.x, rest.y - origin.y), `rest ${i}`).toBeLessThan(TOLERANCE);
    }
  });

  test('hover and tap before a drag do not leave a stale transform behind (10 cycles)', async ({
    page,
  }) => {
    const card = page.getByTestId('drag-card');
    for (let i = 0; i < 10; i += 1) {
      const before = await settle(card);
      // A bare click is hover + tap with no drag; it must not move the card either.
      await page.mouse.move(before.x, before.y);
      await page.mouse.down();
      await page.mouse.up();
      const clicked = await settle(card);
      expect(Math.hypot(clicked.x - before.x, clicked.y - before.y), `click ${i}`).toBeLessThan(
        TOLERANCE,
      );
      const rest = await dragOnce(page, card, i % 2 === 0 ? 20 : -20, 10);
      expect(Math.hypot(rest.x - clicked.x, rest.y - clicked.y) - Math.hypot(20, 10)).toBeLessThan(
        TOLERANCE,
      );
    }
  });

  test('pointercancel ends the drag cleanly and the next drag does not drift', async ({
    page,
    browserName,
  }) => {
    skipOnCiWebkit(browserName);
    const card = page.getByTestId('drag-card');
    await card.evaluate((el) => {
      el.addEventListener('pointerdown', (e) => {
        (window as unknown as { __lastPointerId?: number }).__lastPointerId = e.pointerId;
      });
    });
    for (let i = 0; i < 5; i += 1) {
      const before = await settle(card);
      await page.mouse.move(before.x, before.y);
      await page.mouse.down();
      await page.mouse.move(before.x + 30, before.y + 18, { steps: 4 });
      // The mouse's pointerId differs per engine (Chromium 1, Firefox 0): use the real one.
      await card.evaluate((el) => {
        const id = (window as unknown as { __lastPointerId?: number }).__lastPointerId ?? 1;
        el.dispatchEvent(new PointerEvent('pointercancel', { pointerId: id, bubbles: true }));
      });
      // Further movement with the button still down must no longer move the card.
      const cancelled = await settle(card);
      await page.mouse.move(before.x + 90, before.y + 54, { steps: 4 });
      const after = await settle(card);
      expect(Math.hypot(after.x - cancelled.x, after.y - cancelled.y), `cancel ${i}`).toBeLessThan(
        TOLERANCE,
      );
      await page.mouse.up();
      const next = await dragOnce(page, card, -30, -18);
      expect(Math.hypot(next.x - after.x + 30, next.y - after.y + 18), `next ${i}`).toBeLessThan(
        TOLERANCE,
      );
    }
  });
});
