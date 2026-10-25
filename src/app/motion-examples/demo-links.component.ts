import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs';
import { DEMO_LINKS } from './demo-links';

/**
 * "Learn more" strip above every full demo: the conceptual guide, the generated API reference and
 * neighbouring demos. Driven by the URL, so individual demo pages stay unaware of the docs.
 */
@Component({
  selector: 'app-demo-links',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (links(); as links) {
      <nav
        aria-label="Documentation for this demo"
        class="border-border bg-surface mb-8 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border px-4 py-3 text-sm"
        data-testid="demo-links"
      >
        @if (links.docs; as docs) {
          <span class="flex flex-wrap items-center gap-2">
            <span class="text-text-subtle">Guide</span>
            <a
              class="text-accent font-medium underline underline-offset-4"
              [routerLink]="docs.path"
              >{{ docs.label }}</a
            >
          </span>
        }
        <span class="flex flex-wrap items-center gap-2">
          <span class="text-text-subtle">API</span>
          @for (api of links.api; track api.path) {
            <a
              class="text-accent font-mono text-xs font-medium underline underline-offset-4"
              [routerLink]="api.path"
              >{{ api.label }}</a
            >
          }
        </span>
        <span class="flex flex-wrap items-center gap-2">
          <span class="text-text-subtle">Related</span>
          @for (slug of links.related; track slug) {
            <a
              class="text-accent font-medium underline underline-offset-4"
              [routerLink]="['/demos', slug]"
              >{{ slug }}</a
            >
          }
        </span>
      </nav>
    }
  `,
})
export class DemoLinksStrip {
  readonly #router = inject(Router);
  readonly #url = toSignal(
    this.#router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.#router.url },
  );

  protected readonly links = computed(() => {
    const slug = this.#url().split(/[?#]/)[0].replace(/\/$/, '').split('/').pop() ?? '';
    return DEMO_LINKS[slug === 'demos' ? 'enter' : slug];
  });
}
