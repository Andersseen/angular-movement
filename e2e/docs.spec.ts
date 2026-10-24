import { expect, test, type Page } from '@playwright/test';
import { waitForHydration } from './hydration';
import { DOCS_ROUTES, GUIDE_ROUTES } from './routes';

async function open(page: Page, path: string) {
  await page.goto(path);
  await waitForHydration(page);
  // The documentation UI is a lazy route and Doqs does not replay clicks that arrive before it is
  // interactive (docs/integrations/doqs-feedback.md #2): wait for the network to settle.
  await page.waitForLoadState('networkidle');
}

const playground = (page: Page) => page.locator('.doq-playground').first();

test.describe('documentation (Doqs)', () => {
  for (const route of [...DOCS_ROUTES, ...GUIDE_ROUTES]) {
    test(`renders ${route.path}`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));

      await page.goto(route.path);

      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1')).toHaveText(route.heading);
      if ('text' in route) await expect(page.getByText(route.text).first()).toBeVisible();
      // The shell owns the only landmark; Doqs must not add a second one.
      await expect(page.locator('main')).toHaveCount(1);
      expect(errors).toEqual([]);
    });
  }

  test('the sidebar is the Markdown tree and marks the current page', async ({ page }) => {
    await open(page, '/docs/api-selection');
    const nav = page.getByRole('navigation', { name: 'Documentation' }).first();
    await expect(nav.locator('a.is-active')).toHaveText('Choose an API');
    // Groups other than the current one are collapsed, so look links up by URL, not by role.
    await expect(nav.locator('a[href="/docs/get-started"]')).toHaveCount(1);
    await expect(nav.locator('a[href="/docs/reference/move-enter-directive"]')).toHaveCount(1);
    // One navigation, one search: the old hand-written docs layout is gone.
    await expect(page.locator('#docs-nav')).toHaveCount(0);
    await expect(page.locator('#docs-search')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Search/ })).toHaveCount(1);
  });

  test('table of contents links jump to their heading', async ({ page }) => {
    await open(page, '/docs/guides/enter');
    const toc = page.locator('[aria-label="On this page"]');
    await toc.getByRole('link', { name: 'Shape the timing' }).click();
    await expect(page).toHaveURL(/#shape-the-timing$/);
    const heading = page.locator('#shape-the-timing');
    await expect(heading).toBeInViewport();
    // The fixed 4rem navbar must not cover the heading it scrolled to.
    const top = await heading.evaluate((el) => el.getBoundingClientRect().top);
    expect(top).toBeGreaterThanOrEqual(64);
  });

  test('copy button copies the code shown', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await open(page, '/docs/get-started');
    const block = page.locator('figure.doq-code').first();
    const shown = await block.locator('pre code').innerText();
    await block.getByRole('button', { name: /copy/i }).click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(shown);
  });

  test('the install tabs switch package managers', async ({ page }) => {
    await open(page, '/docs/get-started');
    await page.getByRole('tab', { name: 'yarn' }).click();
    await expect(page.getByText('yarn add angular-movement')).toBeVisible();
    await page.getByRole('tab', { name: 'npm', exact: true }).click();
    await expect(page.getByText('npm install angular-movement')).toBeVisible();
  });

  test('mobile: the drawer opens, navigates and the page does not scroll sideways', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await open(page, '/docs/introduction');
    await page.locator('.doq-mobile-trigger').click();
    await page
      .getByRole('navigation', { name: 'Documentation' })
      .getByRole('link', { name: 'Choose the right tool' })
      .click();
    await expect(page).toHaveURL(/choose-a-tool$/);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('browser history works across docs pages and into the demos', async ({ page }) => {
    await open(page, '/docs/introduction');
    await page.getByRole('link', { name: 'Get started' }).first().click();
    await expect(page).toHaveURL(/\/docs\/get-started$/);
    await page.getByRole('link', { name: 'full `moveEnter` playground'.replace(/`/g, '') }).click();
    await expect(page).toHaveURL(/\/demos\/enter$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/docs\/get-started$/);
    await expect(page.locator('h1')).toHaveText('Get started');
    await page.goBack();
    await expect(page).toHaveURL(/\/docs\/introduction$/);
  });
});

test.describe('cross-linking', () => {
  for (const guide of GUIDE_ROUTES) {
    test(`${guide.path} links its full demo, and the demo links back`, async ({ page }) => {
      await open(page, guide.path);
      await expect(page.locator(`article a[href="${guide.demo}"]`).first()).toBeVisible();

      await open(page, guide.demo);
      const strip = page.getByTestId('demo-links');
      await expect(strip).toBeVisible();
      await expect(strip.locator(`a[href="${guide.path}"]`)).toBeVisible();
      await expect(strip.locator('a[href^="/docs/reference/"]').first()).toBeVisible();
    });
  }
});

test.describe('API reference', () => {
  test('is generated from the library: inputs, stability and deprecations', async ({ page }) => {
    await open(page, '/docs/reference/move-enter-directive');
    await expect(page.locator('h1')).toHaveText('MoveEnterDirective');
    await expect(page.getByText('stable', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('cell', { name: 'moveDuration', exact: true })).toBeVisible();

    await open(page, '/docs/reference/move-drag-directive');
    await expect(page.getByText('experimental', { exact: true }).first()).toBeVisible();

    await open(page, '/docs/reference/move-variants-directive');
    await expect(page.getByText('Deprecated.').first()).toBeVisible();
  });
});

test.describe('embedded playgrounds', () => {
  test('moveEnter: replay and controls recreate the element and update the code', async ({
    page,
  }) => {
    await open(page, '/docs/guides/enter');
    const pg = playground(page);
    const target = pg.getByTestId('enter-target');
    await expect(target).toContainText('entered 1×');

    await pg.getByRole('button', { name: 'Replay' }).click();
    await expect(target).toContainText('entered 2×');

    await pg.getByLabel('Preset').selectOption({ label: 'zoom-in' });
    await expect(target).toContainText('zoom-in');
    await expect(target).toContainText('entered 3×');
    await expect(pg.locator('.doq-pg-panel code')).toContainText('moveEnter="zoom-in"');
    // The wrapper's own output is observable.
    await expect(pg.locator('.doq-pg-events')).toContainText(/played/i);

    await pg.getByLabel('Duration (ms)').fill('1200');
    await expect(pg.locator('.doq-pg-panel code')).toContainText('[moveDuration]="1200"');

    await pg.getByRole('button', { name: 'Reset' }).click();
    await expect(pg.locator('.doq-pg-panel code')).toContainText('moveEnter="fade-up"');
  });

  test('moveEnter: animates for real, and not at all when disabled', async ({ page }) => {
    await open(page, '/docs/guides/enter');
    const pg = playground(page);
    await pg.getByLabel('Duration (ms)').fill('2000');
    const target = pg.getByTestId('enter-target');
    await expect
      .poll(() => target.evaluate((el) => el.getAnimations().length), { timeout: 3000 })
      .toBeGreaterThan(0);

    await pg.getByLabel('Disabled').check();
    await expect
      .poll(() => pg.getByTestId('enter-target').evaluate((el) => el.getAnimations().length))
      .toBe(0);
  });

  test('hover/tap: the directives follow their controls without recreating the element', async ({
    page,
  }) => {
    await open(page, '/docs/guides/interactions');
    const pg = playground(page);
    const button = pg.getByTestId('interaction-target');
    await button.click();
    await expect(pg).toContainText('Pressed 1×');
    await pg.getByLabel('Hover preset').selectOption({ label: 'zoom-in' });
    await expect(pg.locator('.doq-pg-panel code')).toContainText('moveWhileHover="zoom-in"');
    // Same element: the press counter survived the change.
    await expect(pg).toContainText('Pressed 1×');
  });

  test('variants: changing the active variant animates the card to that state', async ({
    page,
  }) => {
    await open(page, '/docs/guides/variants');
    const pg = playground(page);
    const card = pg.getByTestId('variants-target');
    await pg.getByLabel('Duration (ms)').fill('50');
    await pg.getByLabel('Active variant').selectOption({ label: 'active' });
    await expect(card).toContainText('active');
    // The library animates the independent `scale` / `rotate` properties, not `transform`.
    await expect
      .poll(() => card.evaluate((el) => getComputedStyle(el).scale), { timeout: 3000 })
      .toBe('1.1');
  });

  test('presence: the panel stays mounted until its leave animation finishes', async ({ page }) => {
    await open(page, '/docs/guides/presence');
    const pg = playground(page);
    await pg.getByLabel('Duration (ms)').fill('400');
    const panel = pg.getByTestId('presence-target');
    await expect(panel).toBeVisible();
    await pg.getByRole('button', { name: 'Hide panel' }).click();
    await expect(panel).toBeHidden();
    await pg.getByRole('button', { name: 'Show panel' }).click();
    await expect(panel).toBeVisible();
  });

  test('stagger: the list is recreated with the chosen item count', async ({ page }) => {
    await open(page, '/docs/guides/stagger-and-scroll');
    const pg = playground(page);
    const items = pg.getByTestId('stagger-list').locator('li');
    await expect(items).toHaveCount(6);
    await pg.getByLabel('Items').fill('4');
    await expect(items).toHaveCount(4);
  });

  test('signals: the progress input drives the derived position', async ({ page }) => {
    await open(page, '/docs/guides/signals');
    const pg = playground(page);
    await pg.getByLabel('Progress (0–1)').fill('1');
    await expect(pg.getByTestId('signals-readout')).toContainText('x 220px');
  });

  test('presets: the gallery mounts when scrolled into view and replays on demand', async ({
    page,
  }) => {
    await open(page, '/docs/presets');
    // Nothing is mounted (or animating) until the gallery is on screen.
    await expect(page.getByTestId('presets-gallery')).toHaveCount(0);
    await page.locator('app-presets-gallery').scrollIntoViewIfNeeded();
    await expect(page.getByTestId('presets-gallery')).toBeVisible();
    await page.getByRole('button', { name: 'Replay fade-up' }).click();
  });
});

test.describe('unknown documentation URLs', () => {
  test("render Doqs's not-found view inside the shell (the static host answers 404, see static suite)", async ({
    page,
  }) => {
    await page.goto('/docs/definitely-not-a-page');
    await expect(page.locator('h1')).toHaveText('Documentation page not found');
    await expect(page.locator('main')).toHaveCount(1);
  });
});
