#!/usr/bin/env node
/**
 * Post-build step for the static Cloudflare Pages output (`dist/analog/public`).
 *
 *  1. Writes `sitemap.xml` from the HTML the build actually produced — the sitemap can never list a
 *     page that does not exist, and a prerendered page can never be missing from it.
 *  2. Writes `llms.txt` (https://llmstxt.org) from the same pages: each page's own title and
 *     description, grouped by section. It is a convenience index for tools and coding agents, not a
 *     ranking signal; what keeps the site discoverable is that `robots.txt` lets crawlers in.
 *  3. Checks the invariants the deployment relies on: a real `404.html` (Cloudflare Pages serves it
 *     with status 404 and stops using its single-page-app fallback), the Pagefind bundle, robots.txt.
 *
 *   node scripts/finalize-site.mjs [publicDir]
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

export const SITE_ORIGIN = 'https://angular-movement.andersseen.dev';

/** Pages that must never be indexed or listed. */
const EXCLUDED = new Set(['/404']);

export function htmlRoutes(publicDir) {
  const routes = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        if (entry === 'pagefind' || entry === 'assets') continue;
        walk(full);
      } else if (entry.endsWith('.html')) {
        let route = '/' + relative(publicDir, full).replace(/\\/g, '/');
        route = route.replace(/\/index\.html$/, '').replace(/\.html$/, '');
        routes.push(route === '' ? '/' : route);
      }
    }
  };
  walk(publicDir);
  return [...new Set(routes)].filter((route) => !EXCLUDED.has(route)).sort();
}

export function sitemapXml(routes, origin = SITE_ORIGIN) {
  const urls = routes
    .map((route) => `  <url><loc>${origin}${route === '/' ? '/' : route}</loc></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/** The HTML file a route was built from: `docs/get-started.html` or `docs/guides/index.html`. */
export function routeFile(publicDir, route) {
  if (route === '/') return join(publicDir, 'index.html');
  const flat = join(publicDir, `${route.slice(1)}.html`);
  return existsSync(flat) ? flat : join(publicDir, route.slice(1), 'index.html');
}

const decode = (text) =>
  text
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

/** The title and description a crawler reads in the page's raw `<head>`. */
export function pageHead(html) {
  const head = html.slice(0, Math.max(0, html.indexOf('</head>')) || undefined);
  const title = head.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
  const description = head.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
  return { title: decode(title).trim(), description: decode(description).trim() };
}

const LLMS_SECTIONS = [
  {
    title: 'Documentation',
    match: (route) => route === '/docs' || /^\/docs\/(?!reference)/.test(route),
  },
  { title: 'Interactive demos', match: (route) => route.startsWith('/demos') },
  { title: 'Site', match: (route) => !route.startsWith('/docs') && !route.startsWith('/demos') },
  // The llms.txt convention: links under "Optional" can be skipped when context is short.
  { title: 'Optional', match: (route) => route.startsWith('/docs/reference') },
];

/** `pages`: `{ route, title, description }[]`, in sitemap order. */
export function llmsTxt(pages, origin = SITE_ORIGIN) {
  const home = pages.find((page) => page.route === '/');
  const strip = (title) => title.replace(/\s*[·—|]\s*Angular Movement\s*$/, '').trim() || title;
  const lines = [
    '# Angular Movement',
    '',
    `> ${home?.description || 'Declarative, signals-native motion for Angular.'}`,
    '',
    'Angular Movement is an MIT-licensed animation library for Angular 21 and 22, published on npm as',
    '`angular-movement`. Directives such as `[move]`, `moveWhileHover`, `movePresence`, `moveVariants`',
    'and `moveScroll` run on the Web Animations API (with an optional spring engine), are SSR-safe and',
    'work without Zone.js or `@angular/animations`.',
    '',
    '- Source: https://github.com/Andersseen/angular-movement',
    '- Package: https://www.npmjs.com/package/angular-movement',
    '- Install: `npm install angular-movement`',
  ];
  for (const section of LLMS_SECTIONS) {
    const entries = pages.filter((page) => page.route !== '/' && section.match(page.route));
    if (!entries.length) continue;
    lines.push('', `## ${section.title}`, '');
    for (const page of entries) {
      const url = `${origin}${page.route}`;
      const note = page.description ? `: ${page.description}` : '';
      lines.push(`- [${strip(page.title) || page.route}](${url})${note}`);
    }
  }
  return `${lines.join('\n')}\n`;
}

function main() {
  const publicDir = resolve(process.argv[2] ?? 'dist/analog/public');
  const problems = [];
  if (!existsSync(join(publicDir, '404.html'))) {
    problems.push(
      '404.html is missing: unknown URLs would be answered with the SPA fallback (200).',
    );
  }
  if (!existsSync(join(publicDir, 'pagefind', 'pagefind.js'))) {
    problems.push('pagefind/pagefind.js is missing: documentation search would be unavailable.');
  }
  const robots = existsSync(join(publicDir, 'robots.txt'))
    ? readFileSync(join(publicDir, 'robots.txt'), 'utf8')
    : '';
  if (!robots.includes(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`)) {
    problems.push('robots.txt does not point at the sitemap.');
  }

  const routes = htmlRoutes(publicDir);
  writeFileSync(join(publicDir, 'sitemap.xml'), sitemapXml(routes));
  console.log(`finalize-site: sitemap.xml lists ${routes.length} pages`);

  const pages = routes.map((route) => ({
    route,
    ...pageHead(readFileSync(routeFile(publicDir, route), 'utf8')),
  }));
  for (const page of pages) {
    if (!page.title) problems.push(`${page.route} has no <title>.`);
  }
  writeFileSync(join(publicDir, 'llms.txt'), llmsTxt(pages));
  console.log(`finalize-site: llms.txt indexes ${pages.length} pages`);

  if (problems.length) {
    for (const problem of problems) console.error(`finalize-site: ${problem}`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
