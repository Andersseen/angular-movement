import { expect, test } from '@playwright/test';

const docsRoutes = [
  { path: '/docs/api', heading: 'API Guide', text: 'How it works' },
  { path: '/docs/reference', heading: 'API Reference', text: 'Choose by job' },
  { path: '/docs/presets', heading: 'Presets', text: 'Where presets fit' },
  { path: '/docs/patterns', heading: 'Angular patterns', text: '@if and leave animations' },
] as const;

test.describe('docs pages', () => {
  for (const route of docsRoutes) {
    test(`renders ${route.path}`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));

      await page.goto(route.path);

      await expect(page.getByRole('heading', { name: route.heading }).first()).toBeVisible();
      await expect(page.getByText(route.text).first()).toBeVisible();
      await expect(page.locator('app-docs-layout main')).toBeVisible();
      expect(errors).toEqual([]);
    });
  }

  test('install command selector switches package managers', async ({ page }) => {
    await page.goto('/docs/get-started');

    await expect(page.getByText('npm install angular-movement').first()).toBeVisible();

    await page.getByRole('button', { name: 'pnpm' }).first().click();
    await expect(page.getByText('pnpm add angular-movement').first()).toBeVisible();

    await page.getByRole('button', { name: 'yarn' }).first().click();
    await expect(page.getByText('yarn add angular-movement').first()).toBeVisible();
  });
});
