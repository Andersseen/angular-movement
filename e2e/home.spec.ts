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
