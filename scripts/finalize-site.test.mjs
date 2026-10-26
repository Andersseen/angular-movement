import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import {
  htmlRoutes,
  llmsTxt,
  pageHead,
  routeFile,
  sitemapXml,
  SITE_ORIGIN,
} from './finalize-site.mjs';

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

test('a route maps back to the file it was built from', () => {
  const dir = fixture();
  assert.equal(routeFile(dir, '/'), join(dir, 'index.html'));
  assert.equal(routeFile(dir, '/docs/get-started'), join(dir, 'docs/get-started.html'));
  assert.equal(routeFile(dir, '/docs/guides'), join(dir, 'docs/guides/index.html'));
});

test('the page head is read from the raw HTML, entities decoded', () => {
  const head = pageHead(
    '<html><head><title>Presence &amp; exit · Angular Movement</title>' +
      '<meta name="description" content="Keep a view &quot;mounted&quot;."></head>' +
      '<body><title>not this</title></body></html>',
  );
  assert.deepEqual(head, {
    title: 'Presence & exit · Angular Movement',
    description: 'Keep a view "mounted".',
  });
});

test('llms.txt groups pages by section, with the API reference under Optional', () => {
  const text = llmsTxt([
    { route: '/', title: 'Angular Movement', description: 'Motion for Angular.' },
    {
      route: '/docs/get-started',
      title: 'Get started · Angular Movement',
      description: 'Install.',
    },
    { route: '/demos/enter', title: 'moveEnter demo — Angular Movement', description: '' },
    { route: '/docs/reference/move', title: 'move · Angular Movement', description: 'Directive.' },
  ]);
  assert.ok(text.startsWith('# Angular Movement\n\n> Motion for Angular.\n'));
  assert.match(
    text,
    new RegExp(`- \\[Get started\\]\\(${SITE_ORIGIN}/docs/get-started\\): Install\\.`),
  );
  assert.match(text, new RegExp(`- \\[moveEnter demo\\]\\(${SITE_ORIGIN}/demos/enter\\)\n`));
  assert.ok(text.indexOf('## Optional') > text.indexOf('## Interactive demos'));
  assert.match(text.slice(text.indexOf('## Optional')), /docs\/reference\/move/);
});
