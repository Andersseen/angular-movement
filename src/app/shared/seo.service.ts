import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { DEMO_LINKS } from '../motion-examples/demo-links';
import { SITE } from './site';

/**
 * Keeps the social and canonical metadata consistent for every route — host pages and Doqs pages
 * alike. Titles and descriptions come from whoever owns the page (Analog `routeMeta`, Doqs
 * frontmatter); this service only derives what follows from them:
 * `<link rel="canonical">`, `og:url`, `og:title`, `og:description`, `og:type` and the Twitter card.
 * Nothing here invents content: a route without a description keeps the site default.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  readonly #router = inject(Router);
  readonly #document = inject(DOCUMENT);

  start(): void {
    this.#router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        // Titles and descriptions are set while the routed component initialises, after this event.
        queueMicrotask(() => this.update(event.urlAfterRedirects));
        setTimeout(() => this.update(event.urlAfterRedirects), 0);
      });
  }

  update(url: string): void {
    const path = url.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
    const canonical = `${SITE.origin}${path === '/' ? '/' : path}`;
    const doc = this.#document;
    const title = doc.title || SITE.name;

    // A page that opts out of indexing (the 404) has no canonical URL to declare.
    if (doc.querySelector('meta[name="robots"][content*="noindex"]')) {
      doc.querySelector('link[rel="canonical"]')?.remove();
      return;
    }

    let description =
      doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
      SITE.defaultDescription;
    const demo = path.startsWith('/demos/') ? DEMO_LINKS[path.slice('/demos/'.length)] : undefined;
    if (demo && description === SITE.defaultDescription) {
      const api = demo.api.map((link) => link.label).join(', ');
      description = `Interactive playground for ${api}: tune the settings, replay the motion and copy valid Angular code.`;
      this.#meta('name', 'description', description);
    }

    this.#link('canonical', canonical);
    this.#meta('property', 'og:url', canonical);
    this.#meta('property', 'og:title', title);
    this.#meta('property', 'og:description', description);
    this.#meta('property', 'og:type', path === '/' ? 'website' : 'article');
    this.#meta('property', 'og:site_name', SITE.name);
    this.#meta('property', 'og:image', `${SITE.origin}${SITE.ogImage}`);
    this.#meta('name', 'twitter:card', 'summary_large_image');
    this.#meta('name', 'twitter:title', title);
    this.#meta('name', 'twitter:description', description);
    this.#meta('name', 'twitter:image', `${SITE.origin}${SITE.ogImage}`);
  }

  #meta(attr: 'name' | 'property', key: string, content: string): void {
    const doc = this.#document;
    let element = doc.querySelector(`meta[${attr}="${key}"]`);
    if (!element) {
      element = doc.createElement('meta');
      element.setAttribute(attr, key);
      doc.head.appendChild(element);
    }
    element.setAttribute('content', content);
  }

  #link(rel: string, href: string): void {
    const doc = this.#document;
    let element = doc.querySelector(`link[rel="${rel}"]`);
    if (!element) {
      element = doc.createElement('link');
      element.setAttribute('rel', rel);
      doc.head.appendChild(element);
    }
    element.setAttribute('href', href);
  }
}
