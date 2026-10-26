import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { SeoService } from './seo.service';
import { SITE } from './site';

describe('SeoService', () => {
  let doc: Document;
  let service: SeoService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    doc = TestBed.inject(DOCUMENT);
    doc.head.innerHTML = '';
    doc.title = 'Presence · Angular Movement';
    service = TestBed.inject(SeoService);
  });

  const content = (selector: string) => doc.querySelector(selector)?.getAttribute('content');

  it('derives canonical and social tags from the page title and description', () => {
    const meta = doc.createElement('meta');
    meta.setAttribute('name', 'description');
    meta.setAttribute('content', 'Keep a view mounted while it leaves.');
    doc.head.appendChild(meta);

    service.update('/docs/guides/presence/?x=1#top');

    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      `${SITE.origin}/docs/guides/presence`,
    );
    expect(content('meta[property="og:url"]')).toBe(`${SITE.origin}/docs/guides/presence`);
    expect(content('meta[property="og:title"]')).toBe('Presence · Angular Movement');
    expect(content('meta[property="og:description"]')).toBe('Keep a view mounted while it leaves.');
    expect(content('meta[name="twitter:card"]')).toBe('summary_large_image');
    expect(content('meta[property="og:image"]')).toBe(`${SITE.origin}/og-image.png`);
    expect(content('meta[property="og:image:width"]')).toBe('1200');
    expect(content('meta[property="og:image:alt"]')).toBe(SITE.ogImageAlt);
    expect(content('meta[property="og:locale"]')).toBe('en_US');
    expect(content('meta[name="twitter:image:alt"]')).toBe(SITE.ogImageAlt);
  });

  it('follows a title and description written after the first update', () => {
    service.update('/docs/guides/presence');
    doc.title = 'Presence: animate things leaving · Angular Movement';
    service.update('/docs/guides/presence');
    expect(content('meta[property="og:title"]')).toBe(doc.title);
    expect(content('meta[name="twitter:title"]')).toBe(doc.title);
  });

  it('writes one JSON-LD script and replaces it on the next page', () => {
    const jsonLd = () => doc.querySelectorAll('script[type="application/ld+json"]');
    service.update('/');
    expect(JSON.parse(jsonLd()[0].textContent ?? '')).toHaveLength(2);
    service.update('/docs/guides/presence');
    expect(jsonLd()).toHaveLength(1);
    expect(JSON.parse(jsonLd()[0].textContent ?? '')['@type']).toBe('BreadcrumbList');
    service.update('/templates');
    expect(jsonLd()).toHaveLength(0);
  });

  it('uses the root URL for the home page and the site default description', () => {
    service.update('/');
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      `${SITE.origin}/`,
    );
    expect(content('meta[property="og:description"]')).toBe(SITE.defaultDescription);
    expect(content('meta[property="og:type"]')).toBe('website');
  });

  it('describes a demo that has no description of its own', () => {
    service.update('/demos/enter');
    expect(content('meta[name="description"]')).toContain('MoveEnterDirective');
  });

  it('declares no canonical URL for a page that opts out of indexing', () => {
    const robots = doc.createElement('meta');
    robots.setAttribute('name', 'robots');
    robots.setAttribute('content', 'noindex');
    doc.head.appendChild(robots);
    service.update('/nope');
    expect(doc.querySelector('link[rel="canonical"]')).toBeNull();
    expect(doc.querySelector('script[type="application/ld+json"]')).toBeNull();
  });

  it('is idempotent: updating twice does not duplicate tags', () => {
    service.update('/docs');
    service.update('/docs');
    expect(doc.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    expect(doc.querySelectorAll('meta[property="og:url"]')).toHaveLength(1);
  });
});
