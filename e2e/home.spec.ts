import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { waitForHydration } from './hydration';

const libraryVersion = JSON.parse(readFileSync('projects/movement/package.json', 'utf8'))
  .version as string;

test('the home page presents the product: one h1, CTAs, install command and real version', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('h1')).toContainText('Motion for Angular');
  await expect(page.locator('main')).toHaveCount(1);

  const hero = page.locator('app-hero');
  await expect(hero.getByText(`v${libraryVersion}`)).toBeVisible();
  await expect(hero.getByText('npm install angular-movement').first()).toBeVisible();
  await expect(hero.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
    'href',
    'https://github.com/Andersseen/angular-movement',
  );

  // The hero showcase's source sits behind a disclosure and opens on demand.
  await hero.locator('summary').click();
  await expect(hero.locator('app-code-block')).toBeVisible();
});

test('the call-to-action links go where they say', async ({ page }) => {
  await page.goto('/');
  await waitForHydration(page);
  await page.getByRole('link', { name: 'Get started' }).first().click();
  await expect(page).toHaveURL(/\/docs\/get-started$/);

  await page.goto('/');
  await waitForHydration(page);
  await page.getByRole('link', { name: 'Explore demos' }).first().click();
  await expect(page).toHaveURL(/\/demos$/);

  await page.goto('/');
  await waitForHydration(page);
  await page.getByRole('link', { name: 'Open the API reference' }).click();
  await expect(page).toHaveURL(/\/docs\/reference$/);
});

test('code-to-result: the controls drive the real directive and the code beside it', async ({
  page,
}) => {
  await page.goto('/');
  await waitForHydration(page);
  const section = page.locator('app-live-code');
  await section.scrollIntoViewIfNeeded();

  // Hydration publishes `ng` slightly before every listener is attached: retry the interaction.
  await expect(async () => {
    await section.getByLabel('Preset').selectOption('zoom-in');
    await expect(section.locator('app-code-block')).toContainText('moveEnter="zoom-in"', {
      timeout: 1000,
    });
  }).toPass({ timeout: 10_000 });
  await expect(section.getByTestId('enter-target')).toContainText('zoom-in');

  await section.getByLabel(/Duration/).fill('900');
  await expect(section.locator('app-code-block')).toContainText('moveDuration="900ms"');

  await section.getByRole('button', { name: 'Replay' }).click();
  await expect(section.getByTestId('enter-target')).toContainText('entered');
});

test('the honest-positioning section is present and links the decision guide', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Use the simplest tool that works' }),
  ).toBeVisible();
  await expect(page.locator('a[href="/docs/choose-a-tool"]').first()).toBeVisible();
});

test('Templates page renders the landing example', async ({ page }) => {
  await page.goto('/templates');

  await expect(
    page.getByRole('heading', { name: 'Launch polished Angular pages with motion built in.' }),
  ).toBeVisible();
  await expect(page.getByText('Standard landing blocks, Angular-native motion.')).toBeVisible();
  await expect(page.getByText('Get the starter')).toBeVisible();
  await expect(page.locator('main')).toHaveCount(1);
});
