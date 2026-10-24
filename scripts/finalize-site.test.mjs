import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { htmlRoutes, sitemapXml, SITE_ORIGIN } from './finalize-site.mjs';

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'site-'));
  const put = (path) => {
    const full = join(dir, path);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, '<html></html>');
  };
  ['index.html', '404.html', 'docs.html', 'docs/get-started.html', 'demos/enter.html'].forEach(put);
  put('pagefind/fragment/x.html');
  put('assets/ignored.html');
  put('docs/guides/index.html');
  return dir;
}

test('routes come from the HTML the build produced, without the 404 page or tooling folders', () => {
  assert.deepEqual(htmlRoutes(fixture()), [
    '/',
    '/demos/enter',
    '/docs',
    '/docs/get-started',
    '/docs/guides',
  ]);
});

test('the sitemap lists absolute canonical URLs and the root as a slash', () => {
  const xml = sitemapXml(['/', '/docs/get-started']);
  assert.match(xml, new RegExp(`<loc>${SITE_ORIGIN}/</loc>`));
  assert.match(xml, new RegExp(`<loc>${SITE_ORIGIN}/docs/get-started</loc>`));
  assert.ok(xml.startsWith('<?xml'));
});
