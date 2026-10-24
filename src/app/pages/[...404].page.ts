import type { RouteMeta } from '@analogjs/router';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

export const routeMeta: RouteMeta = {
  title: 'Page not found — Angular Movement',
  // The static host serves this page with HTTP 404 for unknown URLs; keep it out of search indexes.
  meta: [{ name: 'robots', content: 'noindex' }],
};

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <div class="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p class="text-accent mb-2 font-mono text-6xl font-black tracking-tighter md:text-8xl">404</p>
      <h1 class="font-display text-text mb-4 text-2xl font-bold md:text-3xl">Page not found</h1>
      <p class="text-text-muted mx-auto mb-8 max-w-md text-lg">
        The page you are looking for does not exist or has moved.
      </p>
      <nav aria-label="Where to go instead" class="flex flex-wrap justify-center gap-3">
        @for (link of links; track link.href) {
          <a
            [routerLink]="link.href"
            class="border-border bg-surface text-text hover:bg-surface-raised focus-visible:outline-accent inline-flex min-h-11 items-center rounded-full border px-6 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
            >{{ link.label }}</a
          >
        }
      </nav>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class NotFound {
  protected readonly links = [
    { href: '/', label: 'Home' },
    { href: '/docs', label: 'Documentation' },
    { href: '/demos', label: 'Demos' },
  ];
}
