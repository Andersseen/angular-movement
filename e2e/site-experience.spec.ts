import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { waitForHydration } from './hydration';

async function open(page: Page, path: string, theme?: 'light' | 'dark') {
  if (theme) {
    await page.addInitScript((t) => {
      // Seed once; a reload must keep whatever the user chose afterwards.
      if (!localStorage.getItem('movement-theme')) localStorage.setItem('movement-theme', t);
    }, theme);
  }
  await page.goto(path);
  await waitForHydration(page);
}

test.describe('code block', () => {
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

  test('copies raw source, not highlighted markup, and announces it', async ({ page }) => {
    await open(page, '/docs/get-started');
    const block = page.locator('app-code-block').first();
    const shown = await block.locator('pre code').innerText();

    await block.getByTestId('copy-code').click();
    // The copy is asynchronous: wait for the announcement before reading the clipboard.
    await expect(block.getByTestId('copy-status')).toContainText('copied');

    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toBe(shown.replace(new RegExp(String.fromCharCode(160), 'g'), ' '));
    expect(clipboard).not.toContain('<span');
  });

  test('the code region is keyboard-reachable', async ({ page }) => {
    await open(page, '/docs/get-started');
    const region = page.locator('app-code-block [role="region"]').first();
    await region.focus();
    await expect(region).toBeFocused();
  });
});

test.describe('docs navigation', () => {
  test('marks the current page and links previous/next from one nav model', async ({ page }) => {
    await open(page, '/docs/api-selection');
    await expect(page.locator('#docs-nav a[aria-current="page"]')).toHaveText('Choose an API');

    const pager = page.getByRole('navigation', { name: 'Previous and next pages' });
    await expect(pager.getByRole('link', { name: /API guide/ })).toBeVisible();
    await pager.getByRole('link', { name: /API reference/ }).click();
    await expect(page).toHaveURL(/\/docs\/reference$/);
    await expect(page.locator('#docs-nav a[aria-current="page"]')).toHaveText('API reference');
  });

  test('quick find filters and Enter opens the first match', async ({ page }) => {
    await open(page, '/docs/introduction');
    const search = page.getByLabel('Search the documentation');
    // Hydration publishes `ng` slightly before every listener is attached, so a fill that lands in
    // that window is dropped; retry the whole interaction instead of sleeping.
    await expect(async () => {
      await search.fill('');
      await search.fill('animate.leave');
      await expect(page.getByTestId('docs-search-results').getByRole('link')).toHaveCount(2, {
        timeout: 1000,
      });
    }).toPass({ timeout: 8000 });
    await search.press('Enter');
    await expect(page).toHaveURL(/\/docs\/(choose-a-tool|migration)$/);

    await search.fill('zzzzzz');
    await expect(page.getByRole('status').filter({ hasText: 'No matching pages' })).toBeVisible();
  });

  test('headings get anchors that copy a deep link', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await open(page, '/docs/accessibility');
    const anchor = page.locator('a[data-heading-anchor="reduced-motion"]');
    await anchor.focus();
    await expect(anchor).toBeFocused();
    await anchor.press('Enter');

    await expect(page.getByTestId('anchor-status')).toContainText('Link copied');
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toMatch(/\/docs\/accessibility#reduced-motion$/);
  });

  test('mobile: menu toggles, navigates, and closes on Escape', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await open(page, '/docs/introduction');
    const toggle = page.getByTestId('docs-menu-toggle');
    const nav = page.locator('#docs-nav');

    await expect(nav).toBeHidden();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(nav).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(nav).toBeHidden();

    await toggle.click();
    await nav.getByRole('link', { name: 'Choose the right tool' }).click();
    await expect(page).toHaveURL(/choose-a-tool$/);
    await expect(nav).toBeHidden();
  });
});

test.describe('theme', () => {
  test('persists the chosen theme across reloads', async ({ page }) => {
    await open(page, '/', 'dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.getByRole('button', { name: 'Switch to light theme' }).first().click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });
});

test.describe('homepage showcase', () => {
  test('presence keeps a removed task mounted until it has left', async ({ page }) => {
    await open(page, '/');
    const tasks = page.locator('[data-testid^="showcase-task-"]');
    await expect(tasks).toHaveCount(3);

    await page.getByTestId('showcase-add').click();
    await expect(tasks).toHaveCount(4);

    await page
      .getByRole('button', { name: /^Remove / })
      .first()
      .click();
    await expect(tasks).toHaveCount(3);
  });

  test('reduced motion: state applies without animation work', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, '/');
    await page.getByTestId('showcase-add').click();
    const first = page.locator('[data-testid^="showcase-task-"]').first();
    await expect(first).toBeVisible();
    await expect.poll(async () => first.evaluate((el) => el.getAnimations().length)).toBe(0);
  });

  test('server HTML is readable before the showcase mounts', async ({ request }) => {
    const html = await (await request.get('/')).text();
    expect(html).toContain('Motion for Angular');
    expect(html).toContain('showcase-placeholder');
  });
});

test.describe('layout robustness', () => {
  for (const width of [360, 768, 1280]) {
    for (const path of ['/', '/docs/api-selection', '/docs/migration', '/demos/hover']) {
      test(`no horizontal page scroll at ${width}px on ${path}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 800 });
        await open(page, path);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow).toBeLessThanOrEqual(0);
      });
    }
  }
});

test.describe('accessibility (axe)', () => {
  for (const theme of ['light', 'dark'] as const) {
    for (const path of [
      '/',
      '/docs/introduction',
      '/docs/api-selection',
      '/docs/migration',
      '/docs/accessibility',
      '/demos/hover',
    ]) {
      test(`${path} has no serious violations (${theme})`, async ({ page }) => {
        await open(page, path, theme);
        // Let the deferred showcase mount and entrance animations settle before measuring contrast.
        await page.waitForTimeout(1200);
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze();
        const serious = results.violations.filter((v) =>
          ['serious', 'critical'].includes(v.impact ?? ''),
        );
        expect(
          serious.map(
            (v) =>
              `${v.id}: ${v.nodes
                .slice(0, 3)
                .map((n) => n.target.join(' '))
                .join(' | ')}`,
          ),
        ).toEqual([]);
      });
    }
  }
});
