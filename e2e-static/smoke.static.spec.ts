import { expect, test } from '@playwright/test';

// Runs in Chromium, Firefox and WebKit: the production build renders, hydrates and navigates everywhere.
test('docs render, search opens and the playground works in the production build', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/docs/guides/enter');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('h1')).toHaveText('Animate on enter and leave');
  await expect(page.locator('main')).toHaveCount(1);

  await page.locator('.doq-playground').first().getByRole('button', { name: 'Replay' }).click();
  await expect(page.getByTestId('enter-target')).toContainText(/entered [2-9]×/);

  await page.getByRole('button', { name: /^Search/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');

  await page.goto('/demos/hover');
  await page.waitForLoadState('networkidle');
  await expect(page.getByTestId('demo-links')).toBeVisible();
  expect(errors).toEqual([]);
});
