import { describe, expect, it } from 'vitest';
import { jsonLdFor, pageName, serializeJsonLd } from './json-ld';
import { SITE } from './site';

describe('jsonLdFor', () => {
  it('describes the site and the library on the home page', () => {
    const data = jsonLdFor('/', 'Angular Movement', 'Motion for Angular.');
    expect(data.map((item) => item['@type'])).toEqual(['WebSite', 'SoftwareSourceCode']);
    expect(data[1]['codeRepository']).toBe(SITE.github);
  });

  it('gives a page inside a section a three-step breadcrumb trail', () => {
    const [crumbs] = jsonLdFor('/docs/guides/presence', 'Presence · Angular Movement', '');
    expect(crumbs['itemListElement']).toEqual([
      { '@type': 'ListItem', position: 1, name: SITE.name, item: `${SITE.origin}/` },
      { '@type': 'ListItem', position: 2, name: 'Documentation', item: `${SITE.origin}/docs` },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Presence',
        item: `${SITE.origin}/docs/guides/presence`,
      },
    ]);
  });

  it('stops at the section itself on a section index', () => {
    const [crumbs] = jsonLdFor('/demos', 'Demos — Angular Movement', '');
    expect(crumbs['itemListElement']).toHaveLength(2);
  });

  it('describes nothing outside the known sections', () => {
    expect(jsonLdFor('/templates', 'Templates', '')).toEqual([]);
  });
});

describe('pageName', () => {
  it('drops the site suffix whatever the separator', () => {
    expect(pageName('moveWhileHover demo — Angular Movement')).toBe('moveWhileHover demo');
    expect(pageName('Fade-up · Angular Movement')).toBe('Fade-up');
    expect(pageName('Angular Movement')).toBe('Angular Movement');
  });
});

describe('serializeJsonLd', () => {
  it('cannot close its own script element', () => {
    const json = serializeJsonLd([{ name: '</script><script>alert(1)</script>' }]);
    expect(json).not.toContain('<');
    expect(JSON.parse(json).name).toContain('</script>');
  });
});
