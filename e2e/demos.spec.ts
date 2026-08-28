import { expect, test } from '@playwright/test';
import { DEMO_ROUTES } from './routes';
import { motionState, settledMotionState } from './motion-state';

test.describe('demo pages', () => {
  for (const route of DEMO_ROUTES) {
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

  test('presence-list demo animates a removed row out before dropping it', async ({ page }) => {
    await page.goto('/demos/presence-list');

    const row = page.getByTestId('presence-list-item-1');
    await expect(row).toBeVisible();

    // Let the entrance settle, so what follows can only be the leave.
    await settledMotionState(row);

    // The leave lasts ~300ms. Sampling it across the Playwright boundary cannot reliably land
    // inside that window, so the whole observation happens in one in-page evaluate. It samples
    // until the row actually detaches rather than for a fixed number of frames — a fixed window
    // is a bet on how fast the machine is, and this suite runs four workers in parallel.
    const observed = await page.evaluate(async () => {
      const list = document.querySelector('[data-testid="presence-list"]')!;
      const target = list.querySelector('[data-testid="presence-list-item-1"]')!;
      const readings: number[] = [];

      (
        list.ownerDocument.querySelector('[data-testid="presence-list-remove-1"]') as HTMLElement
      ).click();

      const deadline = Date.now() + 5000;
      while (target.isConnected && Date.now() < deadline) {
        readings.push(Number(getComputedStyle(target).opacity));
        await new Promise((resolve) => setTimeout(resolve, 40));
      }

      return { readings, detached: !target.isConnected };
    });

    // It stayed in the DOM and faded, rather than vanishing the instant the array changed —
    // which is all `@for` can do, and the reason this directive exists.
    expect(observed.readings.length).toBeGreaterThan(1);
    expect(observed.readings[observed.readings.length - 1]).toBeLessThan(observed.readings[0]);

    // ...and it is gone once the leave resolves.
    expect(observed.detached).toBe(true);
    await expect(row).toHaveCount(0);
    await expect(page.getByTestId('presence-list-item-2')).toBeVisible();
  });

  test('presence-list demo reuses row nodes when the list reorders', async ({ page }) => {
    await page.goto('/demos/presence-list');

    const row = page.getByTestId('presence-list-item-2');
    await expect(row).toBeVisible();

    // Tag the node so a recreated view is distinguishable from a moved one.
    await row.evaluate((el) => el.setAttribute('data-e2e-tag', 'original'));

    await page.getByTestId('presence-list-shuffle').click();
    await expect(page.getByTestId('presence-list-item-3')).toBeVisible();

    await expect(page.getByTestId('presence-list-item-2')).toHaveAttribute(
      'data-e2e-tag',
      'original',
    );
  });

  test('presence-list demo in wait mode holds a new row until the leave finishes', async ({
    page,
  }) => {
    await page.goto('/demos/presence-list');

    await page.getByTestId('presence-list-mode').click();
    await expect(page.getByTestId('presence-list-mode')).toContainText('mode: wait');

    // `wait` is a statement about *ordering*, so record the order the rows actually enter and
    // leave the DOM instead of trying to catch a transient state from outside the page. Polling
    // for "the new row is not there yet" is a race against a 300ms leave, and it flaked.
    const order = await page.evaluate(async () => {
      const list = document.querySelector('[data-testid="presence-list"]')!;
      const events: string[] = [];

      const observer = new MutationObserver((records) => {
        for (const record of records) {
          for (const node of Array.from(record.removedNodes)) {
            if (node.nodeType === Node.ELEMENT_NODE) events.push('removed');
          }
          for (const node of Array.from(record.addedNodes)) {
            if (node.nodeType === Node.ELEMENT_NODE) events.push('added');
          }
        }
      });
      observer.observe(list, { childList: true });

      const doc = list.ownerDocument;
      (doc.querySelector('[data-testid="presence-list-remove-1"]') as HTMLElement).click();
      (doc.querySelector('[data-testid="presence-list-add"]') as HTMLElement).click();

      const deadline = Date.now() + 5000;
      while (!(events.includes('removed') && events.includes('added')) && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 30));
      }
      observer.disconnect();

      return events;
    });

    // In `sync` the added row would appear first, while the old one was still leaving. Compared by
    // index rather than exact array equality: `ViewContainerRef.move()` also detaches and
    // re-inserts nodes, so a reorder can legitimately add entries here.
    expect(order).toContain('removed');
    expect(order).toContain('added');
    expect(order.indexOf('added')).toBeGreaterThan(order.indexOf('removed'));
    await expect(page.getByTestId('presence-list-item-1')).toHaveCount(0);
    await expect(page.getByTestId('presence-list-item-4')).toBeVisible();
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

    // Let the initial sync settle first, so the change asserted below can only come from the
    // scroll we perform.
    const before = await settledMotionState(foreground);

    const moved = await container.evaluate((el) => {
      const start = el.scrollTop;
      el.scrollTop = el.scrollHeight;
      el.dispatchEvent(new Event('scroll'));
      return el.scrollTop !== start;
    });
    expect(moved).toBe(true);

    // moveScroll lerps toward the target, so poll rather than asserting on the next frame.
    await expect.poll(async () => motionState(foreground), { timeout: 3000 }).not.toBe(before);
  });

  test('smooth scroll demo exposes the live service readout', async ({ page }) => {
    await page.goto('/demos/smooth-scroll');

    await expect(page.getByTestId('smooth-scroll-readout')).toBeVisible();
    await expect(page.getByTestId('smooth-scroll-value')).toBeVisible();

    const active = (await page.getByTestId('smooth-scroll-active').textContent())?.trim() === 'yes';

    // `scrollTo` clamps to the document's scrollable range, which depends on the rendered page
    // height — asserting a bare 400 made this test fail whenever the page was shorter than that.
    const expected = await page.evaluate(() => {
      const doc = document.documentElement;
      return Math.min(400, Math.max(0, doc.scrollHeight - doc.clientHeight));
    });

    await page.getByTestId('smooth-scroll-instant').click();

    // scrollTo(_, instant) writes scrollTop synchronously and publishes it on the scrollY signal.
    // Under reduced motion the service never starts, so the readout legitimately stays at 0.
    await expect
      .poll(async () => {
        const text = (await page.getByTestId('smooth-scroll-value').textContent()) ?? '';
        return Number.parseInt(text.trim(), 10);
      })
      .toBe(active ? expected : 0);
  });

  test('animate demo reflects slider changes in the preview and generated code', async ({
    page,
  }) => {
    await page.goto('/demos/animate');

    // vertex-editor-lite initializes its editor view asynchronously (dynamic import of the
    // language mode); a [value] change that lands before it's ready is silently dropped. Wait
    // for the default code to actually render before driving the slider, so the assertion isn't
    // racing that init.
    const editor = page.locator('vertex-editor-lite');
    await expect
      .poll(async () => editor.evaluate((el) => (el as { value?: string }).value ?? ''), {
        timeout: 3000,
      })
      .toContain('scale: 0.85');

    await page.locator('#scale').fill('1.5');

    await expect
      .poll(async () => editor.evaluate((el) => (el as { value?: string }).value ?? ''), {
        timeout: 3000,
      })
      .toContain('scale: 1.5');
  });

  test('enter demo replays with the newly selected preset', async ({ page }) => {
    await page.goto('/demos/enter');

    const label = page.locator('.font-display', { hasText: /^Fade Up$/i });
    await expect(label).toBeVisible();

    await page.selectOption('#preset-select', 'zoom-in');

    await expect(page.locator('.font-display', { hasText: /^Zoom In$/i })).toBeVisible();
  });

  test('hover demo plays a WAAPI animation on mouse enter', async ({ page }) => {
    await page.goto('/demos/hover');

    const card = page.locator('.cursor-pointer', { hasText: 'Hover over this card' });
    await expect(card).toBeVisible();

    await card.hover();

    await expect
      .poll(async () => card.evaluate((el) => el.getAnimations().length))
      .toBeGreaterThan(0);
  });

  test('tap demo plays a WAAPI animation on press', async ({ page }) => {
    await page.goto('/demos/tap');

    const button = page.locator('button', { hasText: /Press Down|Shrink|Ripple|Bounce/ });
    await expect(button).toBeVisible();

    const box = await button.boundingBox();
    if (!box) throw new Error('tap demo did not lay out');

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();

    await expect
      .poll(async () => button.evaluate((el) => el.getAnimations().length))
      .toBeGreaterThan(0);

    await page.mouse.up();
  });

  test('target demo toggles the SVG draw state on click', async ({ page }) => {
    await page.goto('/demos/target');

    const toggle = page.getByRole('button', { name: /Draw icon|Reset icon/ });
    const path = page.locator('path[stroke-width="7"]');
    await expect(toggle).toHaveText('Reset icon');

    const before = await settledMotionState(path);

    await toggle.click();
    await expect(toggle).toHaveText('Draw icon');
    await expect.poll(async () => motionState(path), { timeout: 3000 }).not.toBe(before);

    await toggle.click();
    await expect(toggle).toHaveText('Reset icon');
  });

  test('loop demo keeps a WAAPI animation running and repeat controls update it', async ({
    page,
  }) => {
    await page.goto('/demos/loop');

    const spinner = page.locator('[preview] svg').first();
    await expect(spinner).toBeVisible();
    await expect
      .poll(async () => spinner.evaluate((el) => el.getAnimations().length))
      .toBeGreaterThan(0);

    await page.selectOption('#loopType', 'pulse');

    const pulse = page.getByTestId('loop-pulse');
    await expect(pulse).toBeVisible();
    await expect
      .poll(async () => pulse.evaluate((el) => el.getAnimations().length))
      .toBeGreaterThan(0);

    await expect(page.getByTestId('loop-repeat-type')).toContainText('repeatType: loop');
    await page.getByTestId('loop-repeat-type').click();
    await expect(page.getByTestId('loop-repeat-type')).toContainText('repeatType: reverse');
  });

  test('text demo splits text into animated character spans', async ({ page }) => {
    await page.goto('/demos/text');

    const heading = page.locator('h2', { hasText: 'Animate Text' });
    await expect(heading).toBeVisible();

    // moveText splits into spans on a microtask after render — count is 0 for one tick.
    await expect
      .poll(async () => heading.locator('span').count(), { timeout: 3000 })
      .toBeGreaterThan(5);
  });

  test('icons demo animates SVG path drawing when toggled', async ({ page }) => {
    await page.goto('/demos/icons');

    const path = page.getByTestId('icons-paperclip');
    await expect(path).toBeVisible();

    const before = await settledMotionState(path);

    await page.getByRole('button', { name: /Animate|Reset/ }).click();

    await expect.poll(async () => motionState(path), { timeout: 3000 }).not.toBe(before);
  });

  test('parallax demo moves layers by different amounts on scroll', async ({ page }) => {
    await page.goto('/demos/parallax');

    const fg = page.getByTestId('parallax-fg-layer');
    await expect(fg).toBeVisible();

    const fgBefore = await settledMotionState(fg);

    // Matches the mechanism the reduced-motion variant of this test already relies on — a real
    // wheel gesture over the container, not a synthetic `scroll` event dispatch.
    const box = await page.locator('#parallax-demo-container').boundingBox();
    if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, 600);

    await expect.poll(async () => motionState(fg), { timeout: 3000 }).not.toBe(fgBefore);
  });
});

/**
 * The accessibility contract, verified in a real browser rather than a jsdom mock.
 *
 * Scroll-linked and parallax motion is precisely what WCAG 2.3.3 asks to suppress, and it used to
 * run regardless of the user's preference because both directives hardcoded `disabled: false`.
 */
/** Window allowed for observers to fire and players to be created before asserting an absence. */
const SETTLE_MS = 800;

test.describe('prefers-reduced-motion', () => {
  // Emulated explicitly per page rather than through the `reducedMotion` fixture: the fixture did
  // not reach `matchMedia` here, which silently turned these into no-op assertions.
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('about:blank');
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(
      true,
    );
  });

  test('scroll-linked motion does not run', async ({ page }) => {
    await page.goto('/demos/scroll');

    const foreground = page.getByTestId('scroll-foreground');
    await foreground.scrollIntoViewIfNeeded();
    await expect(foreground).toBeVisible();

    const container = page.getByTestId('scroll-container');
    await container.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
      el.dispatchEvent(new Event('scroll'));
    });

    // Asserting an absence needs a settle window, not `expect.poll`: the count starts at 0 before
    // the observer fires, so a poll would match its first sample and never test anything.
    await page.waitForTimeout(SETTLE_MS);

    // With motion allowed this element carries exactly one scroll-driven animation.
    expect(await foreground.evaluate((el) => el.getAnimations().length)).toBe(0);
  });

  test('parallax does not run', async ({ page }) => {
    await page.goto('/demos/parallax');
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(SETTLE_MS);

    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  });

  test('content that animates in is still readable', async ({ page }) => {
    await page.goto('/demos/stagger');

    // Suppressing motion must never leave content stuck at an invisible initial keyframe.
    const items = page.getByTestId('stagger-item');
    await expect(items.first()).toBeVisible();
    await expect
      .poll(async () =>
        items.evaluateAll((els) => els.every((el) => Number(getComputedStyle(el).opacity) > 0.9)),
      )
      .toBe(true);
  });
});
