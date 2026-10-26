import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const ORIGIN = 'https://angular-movement.andersseen.dev';
const library = JSON.parse(readFileSync('projects/movement/package.json', 'utf8')) as {
  version: string;
};

/** URLs the previous (hand-written) site published. They must keep answering 200 on the static host. */
const LEGACY_URLS = [
  '/',
  '/demos',
  '/demos/enter',
  '/demos/hover',
  '/demos/drag',
  '/demos/layout',
  '/demos/presence',
  '/demos/variants',
  '/demos/scroll',
  '/templates',
  '/docs',
  '/docs/introduction',
  '/docs/get-started',
  '/docs/api',
  '/docs/api-selection',
  '/docs/reference',
  '/docs/patterns',
  '/docs/presets',
  '/docs/migration',
  '/docs/accessibility',
  '/docs/mcp',
  '/docs/choose-a-tool',
];

async function sitemapRoutes(page: Page): Promise<string[]> {
  const xml = await (await page.request.get('/sitemap.xml')).text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(ORIGIN, '') || '/');
}

test.describe('routing as Cloudflare Pages serves it', () => {
  for (const url of LEGACY_URLS) {
    test(`${url} answers 200`, async ({ request }) => {
      const response = await request.get(url, { maxRedirects: 0 });
      expect(response.status()).toBe(200);
    });
  }

  for (const url of [
    '/nope',
    '/docs/nope',
    '/docs/guides/nope',
    '/demos/nope',
    '/docs/reference/Nope',
  ]) {
    test(`${url} answers a real 404 with the not-found page`, async ({ request }) => {
      const response = await request.get(url);
      expect(response.status()).toBe(404);
      const html = await response.text();
      expect(html).toContain('Page not found');
      expect(html).toContain('noindex');
    });
  }

  test('a trailing slash redirects to the canonical slash-less URL', async ({ request }) => {
    const response = await request.get('/docs/get-started/', { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers()['location']).toMatch(/\/docs\/get-started$/);
  });
});

test.describe('prerendered HTML', () => {
  test('Markdown content, headings and metadata are in the initial HTML', async ({ request }) => {
    const html = await (await request.get('/docs/guides/presence')).text();
    expect(html).toContain('<h1');
    expect(html).toContain('Presence: animate things leaving');
    expect(html).toContain('Track by a <strong>stable identity</strong>');
    expect(html).toContain(`<link rel="canonical" href="${ORIGIN}/docs/guides/presence">`);
    expect(html).toContain('<meta name="description"');
    expect(html).toContain('og:title');
  });

  test('every page in the sitemap has one h1, one main, a canonical URL and real content', async ({
    page,
  }) => {
    const routes = await sitemapRoutes(page);
    expect(routes.length).toBeGreaterThan(100);
    const problems: string[] = [];
    for (const route of routes) {
      const response = await page.request.get(route);
      const html = await response.text();
      if (response.status() !== 200) problems.push(`${route}: status ${response.status()}`);
      const h1 = (html.match(/<h1[\s>]/g) ?? []).length;
      const main = (html.match(/<main[\s>]/g) ?? []).length;
      if (h1 !== 1) problems.push(`${route}: ${h1} h1`);
      if (main !== 1) problems.push(`${route}: ${main} main`);
      if (!html.includes(`<link rel="canonical" href="${ORIGIN}${route === '/' ? '/' : route}">`))
        problems.push(`${route}: wrong or missing canonical`);
      if (!/<meta name="description" content="[^"]{20,}"/.test(html))
        problems.push(`${route}: missing description`);
    }
    expect(problems).toEqual([]);
  });

  // The social card is what a link preview shows. Doqs writes the title and description after the
  // Markdown loads, so these must be derived at serialization time, not at navigation time.
  test('every page in the sitemap has its own title and a social card that matches it', async ({
    page,
  }) => {
    const routes = await sitemapRoutes(page);
    const problems: string[] = [];
    const titles = new Map<string, string>();
    for (const route of routes) {
      const html = await (await page.request.get(route)).text();
      const head = html.slice(0, html.indexOf('</head>'));
      const all = (key: string) =>
        [
          ...head.matchAll(new RegExp(`<meta (?:name|property)="${key}" content="([^"]*)"`, 'g')),
        ].map((match) => match[1]);
      const one = (key: string) => {
        const values = all(key);
        if (values.length !== 1) problems.push(`${route}: ${values.length} × ${key}`);
        return values[0];
      };
      const title = head.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
      const description = one('description');
      if (titles.has(title)) problems.push(`${route}: title duplicates ${titles.get(title)}`);
      titles.set(title, route);
      if (one('og:title') !== title) problems.push(`${route}: og:title differs from <title>`);
      if (one('twitter:title') !== title) problems.push(`${route}: twitter:title differs`);
      if (one('og:description') !== description) problems.push(`${route}: og:description differs`);
      if (one('twitter:description') !== description)
        problems.push(`${route}: twitter:description differs`);
      if (one('og:url') !== `${ORIGIN}${route}`) problems.push(`${route}: og:url differs`);
      if (one('og:image') !== `${ORIGIN}/og-image.png`) problems.push(`${route}: og:image`);
      one('og:image:alt');
      one('twitter:card');
      if ((head.match(/rel="canonical"/g) ?? []).length !== 1)
        problems.push(`${route}: canonical is not unique`);
      if (/<meta name="robots"/.test(head)) problems.push(`${route}: indexable page has robots`);
    }
    expect(problems).toEqual([]);
  });

  test('structured data: the site and library on home, breadcrumbs inside sections', async ({
    request,
  }) => {
    const jsonLd = async (route: string) => {
      const html = await (await request.get(route)).text();
      const scripts = [
        ...html.matchAll(/<script type="application\/ld\+json"[^>]*>([^<]*)<\/script>/g),
      ];
      expect(scripts, route).toHaveLength(1);
      const data = JSON.parse(scripts[0][1]);
      return (Array.isArray(data) ? data : [data]) as Record<string, unknown>[];
    };

    const home = await jsonLd('/');
    expect(home.map((item) => item['@type'])).toEqual(['WebSite', 'SoftwareSourceCode']);
    expect(home[1]['codeRepository']).toBe('https://github.com/Andersseen/angular-movement');

    const [crumbs] = await jsonLd('/docs/guides/presence');
    expect(crumbs['@type']).toBe('BreadcrumbList');
    const items = crumbs['itemListElement'] as { name: string; item: string }[];
    expect(items.map((item) => item.item)).toEqual([
      `${ORIGIN}/`,
      `${ORIGIN}/docs`,
      `${ORIGIN}/docs/guides/presence`,
    ]);
    expect(items[2].name).toBe('Presence: animate things leaving');

    const [demo] = await jsonLd('/demos/hover');
    expect((demo['itemListElement'] as unknown[]).length).toBe(3);
  });

  test('llms.txt indexes the docs, demos and reference for agents', async ({ request }) => {
    const response = await request.get('/llms.txt');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/plain');
    const text = await response.text();
    expect(text.startsWith('# Angular Movement\n')).toBe(true);
    for (const wanted of [
      'https://github.com/Andersseen/angular-movement',
      `${ORIGIN}/docs/get-started`,
      `${ORIGIN}/demos/hover`,
      '## Optional',
    ])
      expect(text).toContain(wanted);
  });

  test('responses carry the security headers; hashed assets are cached for good', async ({
    request,
  }) => {
    const home = await request.get('/');
    expect(home.headers()['x-content-type-options']).toBe('nosniff');
    expect(home.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(home.headers()['x-frame-options']).toBe('SAMEORIGIN');
    expect(home.headers()['permissions-policy']).toContain('camera=()');
    const asset = (await home.text()).match(/\/assets\/[^"']+\.js/)?.[0];
    expect(asset).toBeTruthy();
    const cached = await request.get(asset!);
    expect(cached.headers()['cache-control']).toContain('immutable');
  });

  test('sitemap lists docs, demos and the reference; robots points at it; 404 is excluded', async ({
    page,
  }) => {
    const routes = await sitemapRoutes(page);
    for (const route of ['/', '/docs/get-started', '/docs/reference', '/demos/enter', '/templates'])
      expect(routes).toContain(route);
    expect(routes.some((route) => route.includes('404'))).toBe(false);
    const robots = await (await page.request.get('/robots.txt')).text();
    expect(robots).toContain(`Sitemap: ${ORIGIN}/sitemap.xml`);
  });

  test('the social image exists and is a PNG', async ({ request }) => {
    const response = await request.get('/og-image.png');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('image/png');
  });

  test('the home page advertises the version in package.json, never a literal', async ({
    request,
  }) => {
    const html = await (await request.get('/')).text();
    expect(html).toContain(`v${library.version}`);
  });
});

test.describe('search (Pagefind)', () => {
  test('the bundle resolves and finds body text and API symbols', async ({ page }) => {
    await page.goto('/docs/get-started');
    // Doqs does not replay a click that lands before it hydrates (docs/integrations/doqs-feedback.md).
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /^Search/ }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('searchbox').fill('prefers-reduced-motion');
    await expect(dialog.getByRole('link').first()).toBeVisible({ timeout: 10_000 });

    await dialog.getByRole('searchbox').fill('MoveEnterDirective');
    await expect(
      dialog.locator('a[href^="/docs/reference/move-enter-directive"]').first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Ctrl+K opens search and Escape closes it', async ({ page }) => {
    await page.goto('/docs/introduction');
    await page.waitForLoadState('networkidle');
    await page.keyboard.press('Control+k');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });
});

test.describe('hydration and navigation in the production build', () => {
  test('a deep link refreshes in place and hydrates without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    await page.goto('/docs/guides/enter#shape-the-timing');
    await page.waitForLoadState('networkidle');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toHaveText('Animate on enter and leave');
    expect(errors).toEqual([]);
  });

  test('host components replay a click that lands before hydration (event replay)', async ({
    page,
  }) => {
    // Delay the scripts so the click reliably arrives while the page is still server-rendered HTML.
    await page.route('**/assets/*.js', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      await route.continue();
    });
    await page.goto('/', { waitUntil: 'commit' });
    await page.getByRole('button', { name: 'Switch to light theme' }).first().click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light', { timeout: 10_000 });
  });

  test('docs → demo → docs keeps the shell and the active navigation state', async ({ page }) => {
    await page.goto('/docs/guides/enter');
    await page.waitForLoadState('networkidle');
    await page.locator('article a[href="/demos/enter"]').first().click();
    await expect(page).toHaveURL(/\/demos\/enter$/);
    await page.getByText('Learn more', { exact: true }).click();
    await expect(page.getByTestId('demo-links')).toBeVisible();
    await page.getByTestId('demo-links').locator('a[href="/docs/guides/enter"]').click();
    await expect(page).toHaveURL(/\/docs\/guides\/enter$/);
    await expect(page.locator('a.doq-nav-link.is-active')).toHaveText('Animate on enter and leave');
    await expect(page.getByRole('link', { name: 'Docs', exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('the navbar anchor offset: a #fragment lands below the fixed navbar', async ({ page }) => {
    await page.goto('/docs/guides/enter#shape-the-timing');
    await page.waitForLoadState('networkidle');
    const top = await page
      .locator('#shape-the-timing')
      .evaluate((el) => el.getBoundingClientRect().top);
    expect(top).toBeGreaterThanOrEqual(64);
    expect(top).toBeLessThan(300);
  });

  test('reduced motion: the playground applies state without animation work', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/docs/guides/enter');
    await page.waitForLoadState('networkidle');
    await page.locator('.doq-playground').first().getByRole('button', { name: 'Replay' }).click();
    const target = page.getByTestId('enter-target');
    await expect(target).toContainText('entered');
    await expect.poll(() => target.evaluate((el) => el.getAnimations().length)).toBe(0);
  });
});

test.describe('layout at the supported widths', () => {
  for (const width of [320, 375, 768, 1024, 1440]) {
    for (const url of [
      '/',
      '/docs/get-started',
      '/docs/reference/move-enter-directive',
      '/demos/enter',
      '/docs/guides/presence',
    ]) {
      test(`no horizontal overflow at ${width}px on ${url}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow).toBeLessThanOrEqual(0);
      });
    }
  }
});
