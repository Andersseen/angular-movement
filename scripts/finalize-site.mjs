#!/usr/bin/env node
/**
 * Post-build step for the static Cloudflare Pages output (`dist/analog/public`).
 *
 *  1. Writes `sitemap.xml` from the HTML the build actually produced — the sitemap can never list a
 *     page that does not exist, and a prerendered page can never be missing from it.
 *  2. Checks the invariants the deployment relies on: a real `404.html` (Cloudflare Pages serves it
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

  if (problems.length) {
    for (const problem of problems) console.error(`finalize-site: ${problem}`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
