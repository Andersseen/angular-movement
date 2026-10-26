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

  // The showcase below the hero keeps its source behind a Volt accordion, opened on demand.
  await waitForHydration(page);
  const demo = page.locator('app-state-demo');
  await demo.getByRole('button', { name: 'Show the code' }).click();
  await expect(demo.locator('app-code-block')).toBeVisible();
});

test('the navbar lists only the project essentials; templates live on the home page', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Main' });
  for (const [name, href] of [
    ['Docs', '/docs'],
    ['API', '/docs/reference'],
    ['Demos', '/demos'],
  ]) {
    await expect(nav.getByRole('link', { name, exact: true })).toHaveAttribute('href', href);
  }
  await expect(nav.locator('a[href="/templates"]')).toHaveCount(0);

  // Exactly one link reads as current, even where the API section nests inside the docs.
  for (const [path, current] of [
    ['/docs/get-started', 'Docs'],
    ['/docs/reference', 'API'],
    ['/demos/hover', 'Demos'],
  ]) {
    await page.goto(path);
    await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
    await expect(nav.locator('[aria-current="page"]')).toHaveText(current);
  }
  await page.goto('/');
  await expect(nav.locator('[aria-current="page"]')).toHaveCount(0);

  const templates = page.locator('app-home-templates');
  await expect(templates.getByRole('heading', { name: 'Start from a template' })).toBeVisible();
  await waitForHydration(page);
  await templates.getByRole('link', { name: 'Preview template' }).click();
  await expect(page).toHaveURL(/\/templates$/);
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

  await section.getByText('linear', { exact: true }).click();
  await expect(section.locator('app-code-block')).toContainText('moveEasing="linear"');

  // The Volt slider is keyboard-operable: End jumps to the maximum.
  await section.getByRole('slider', { name: 'Duration' }).press('End');
  await expect(section.locator('app-code-block')).toContainText('moveDuration="1500ms"');

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

test('the explore tabs run real directives and switch with the keyboard', async ({ page }) => {
  await page.goto('/');
  await waitForHydration(page);
  const section = page.locator('app-explore');
  await section.scrollIntoViewIfNeeded();
  await expect(section.getByTestId('interaction-target')).toBeVisible();

  await expect(async () => {
    await section.getByRole('tab', { name: 'Presence' }).click();
    await expect(section.getByTestId('presence-target')).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 10_000 });
  await section.getByRole('button', { name: 'Hide panel' }).click();
  await expect(section.getByTestId('presence-target')).toBeHidden();

  await section.getByRole('tab', { name: 'Stagger' }).click();
  await expect(section.getByTestId('stagger-list').locator('li')).toHaveCount(6);
  await expect(section.getByRole('link', { name: 'Read the guide' })).toHaveAttribute(
    'href',
    '/docs/guides/stagger-and-scroll',
  );
});

test('the FAQ is a Volt accordion with answers that link to the docs', async ({ page }) => {
  await page.goto('/');
  await waitForHydration(page);
  await page.waitForLoadState('networkidle');
  const trigger = page.getByRole('button', { name: 'Does it work with SSR and zoneless apps?' });
  await trigger.scrollIntoViewIfNeeded();
  await expect(async () => {
    if ((await trigger.getAttribute('aria-expanded')) !== 'true') await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true', { timeout: 1000 });
  }).toPass({ timeout: 10_000 });
  await expect(
    page
      .locator('volt-accordion-item', { hasText: 'SSR and zoneless' })
      .locator('a[href="/docs/accessibility"]'),
  ).toBeVisible();
});

test('every landing control is a Volt UI atom (no hand-rolled buttons)', async ({ page }) => {
  await page.goto('/');
  await waitForHydration(page);
  await page.waitForLoadState('networkidle');
  // Every button is either Volt's own element (voltButton) or lives inside a Volt component.
  const rogue = await page.evaluate(() =>
    [...document.querySelectorAll('main button, nav button, footer button')]
      .filter((el) => !el.hasAttribute('voltbutton'))
      .filter(
        (el) =>
          !el.closest(
            'volt-button, volt-tabs, volt-accordion, volt-toggle-group, volt-checkbox, volt-slider, app-code-block',
          ),
      )
      .map((el) => el.outerHTML.slice(0, 120)),
  );
  expect(rogue).toEqual([]);
});
