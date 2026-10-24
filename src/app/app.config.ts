import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideFileRouter, withExtraRoutes } from '@analogjs/router';
import type { Route, UrlSegment } from '@angular/router';

/**
 * Doqs (and Analog's Markdown renderer) only matter below `/docs`, so they are scoped to a lazy route:
 * the home page and the demo gallery never download the documentation UI, search or Markdown stack
 * (measured: the entry chunk was 20 kB gzipped before Doqs, 133 kB with Doqs wired globally).
 *
 * The matcher consumes no URL segments, so the routes Doqs creates keep their full `/docs/...` paths;
 * it sits before the file routes and, with Doqs's default `unmatched: 'not-found'`, owns everything below
 * `/docs`.
 */
const docsRoute: Route = {
  matcher: (segments: UrlSegment[]) => (segments[0]?.path === 'docs' ? { consumed: [] } : null),
  loadChildren: async () => {
    const [{ doqRoutes, provideDoq }, { provideContent, withMarkdownRenderer }, { doqConfig }] =
      await Promise.all([
        import('@doqs/analog'),
        import('@analogjs/content'),
        import('./doq/doq.config'),
      ]);
    return [
      {
        path: '',
        providers: [provideDoq(doqConfig), provideContent(withMarkdownRenderer())],
        children: doqRoutes(doqConfig),
      },
    ];
  },
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideFileRouter(withExtraRoutes([docsRoute])),
    provideClientHydration(withEventReplay()),
  ],
};
