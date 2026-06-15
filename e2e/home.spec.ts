import { test, expect } from '@playwright/test';

test('App loads and renders the Hero and Presets correctly', async ({ page }) => {
  await page.goto('/');

  // Expect a heading with some dynamic or core text
  // Let's rely on standard elements that exist in the app
  const heroHeading = page.locator('h1');
  await expect(heroHeading).toBeVisible();

  // Test that our interactive Presets section rendered
  const presetsSection = page.locator('app-presets-showcase');
  await expect(presetsSection).toBeVisible();

  // Test code block integration in Showcase
  const codeBlock = page.locator('app-code-block');
  await expect(codeBlock.first()).toBeVisible();
});

test('Templates page renders the landing example', async ({ page }) => {
  await page.goto('/templates');

  await expect(
    page.getByRole('heading', { name: 'Launch polished Angular pages with motion built in.' }),
  ).toBeVisible();
  await expect(page.getByText('Standard landing blocks, Angular-native motion.')).toBeVisible();
  await expect(page.getByText('Get the starter')).toBeVisible();
});
