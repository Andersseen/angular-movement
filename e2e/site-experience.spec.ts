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
    await open(page, '/demos/enter');
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
    await open(page, '/demos/enter');
    const region = page.locator('app-code-block [role="region"]').first();
    await region.focus();
    await expect(region).toBeFocused();
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
    expect(html).toContain('rel="canonical" href="https://angular-movement.andersseen.dev/"');
  });
});

test.describe('layout robustness', () => {
  for (const width of [320, 375, 768, 1024, 1440]) {
    for (const path of [
      '/',
      '/docs/api-selection',
      '/docs/reference/move-enter-directive',
      '/docs/guides/presence',
      '/docs/presets',
      '/demos/hover',
      '/templates',
    ]) {
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
      '/docs/guides/enter',
      '/docs/reference',
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
