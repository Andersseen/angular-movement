import { expect, test } from '@playwright/test';
import { DOCS_ROUTES } from './routes';

test.describe('docs pages', () => {
  for (const route of DOCS_ROUTES) {
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
