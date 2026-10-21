import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { DOCS_NAV, docsNeighbours, searchDocs } from '../shared/docs-nav';
import { HeadingAnchors } from '../shared/directives/heading-anchors';
import { DocsFooterNav } from '../shared/components/docs-footer-nav/docs-footer-nav';

@Component({
  selector: 'app-docs-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, HeadingAnchors, DocsFooterNav],
  template: `
    <div class="mx-auto min-h-[calc(100vh-4rem)] max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <div class="flex flex-col gap-8 lg:flex-row lg:gap-12">
        <!-- Mobile toggle -->
        <button
          type="button"
          class="border-border bg-surface text-text focus-visible:outline-accent flex min-h-11 items-center justify-between rounded-xl border px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 lg:hidden"
          [attr.aria-expanded]="menuOpen()"
          aria-controls="docs-nav"
          data-testid="docs-menu-toggle"
          (click)="menuOpen.set(!menuOpen())"
        >
          <span>{{ currentTitle() }}</span>
          <span class="text-text-muted">{{ menuOpen() ? 'Close menu' : 'Docs menu' }}</span>
        </button>

        <aside
          id="docs-nav"
          class="w-full shrink-0 lg:sticky lg:top-24 lg:block lg:max-h-[calc(100vh-7rem)] lg:w-64 lg:self-start lg:overflow-y-auto"
          [class.hidden]="!menuOpen()"
        >
          <div class="mb-6">
            <label for="docs-search" class="sr-only">Search the documentation</label>
            <input
              id="docs-search"
              type="search"
              autocomplete="off"
              placeholder="Quick find…"
              class="bg-surface border-border text-text placeholder:text-text-subtle focus:border-accent focus-visible:outline-accent min-h-11 w-full rounded-xl border px-4 text-sm focus-visible:outline-2"
              [value]="query()"
              (input)="query.set($any($event.target).value)"
              (keydown.enter)="goToFirst()"
            />
          </div>

          @if (query().trim()) {
            <nav aria-label="Search results" data-testid="docs-search-results">
              @if (results().length === 0) {
                <p class="text-text-muted px-3 text-sm" role="status">No matching pages.</p>
              } @else {
                <ul class="m-0 list-none space-y-1 p-0">
                  @for (item of results(); track item.path) {
                    <li>
                      <a
                        [routerLink]="item.path"
                        class="text-text-muted hover:text-text hover:bg-surface-raised block rounded-lg px-3 py-2 text-sm"
                        (click)="afterNavigate()"
                        >{{ item.title }}</a
                      >
                    </li>
                  }
                </ul>
              }
            </nav>
          } @else {
            <nav aria-label="Documentation" class="space-y-7">
              @for (group of groups; track group.label) {
                <div>
                  <h2
                    class="font-display text-text-muted mb-2 px-3 text-xs font-bold tracking-wider uppercase"
                  >
                    {{ group.label }}
                  </h2>
                  <ul class="m-0 list-none space-y-0.5 p-0">
                    @for (item of group.items; track item.path) {
                      <li>
                        <a
                          [routerLink]="item.path"
                          routerLinkActive="bg-accent/10 text-accent font-semibold"
                          ariaCurrentWhenActive="page"
                          class="text-text-muted hover:text-text hover:bg-surface-raised focus-visible:outline-accent block min-h-9 rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-2"
                          (click)="afterNavigate()"
                          >{{ item.title }}</a
                        >
                      </li>
                    }
                  </ul>
                </div>
              }
            </nav>
          }
        </aside>

        <!-- Content -->
        <div class="min-w-0 flex-1" data-testid="docs-content">
          <div appHeadingAnchors #anchors="headingAnchors" data-docs-page>
            <router-outlet />
            <span class="sr-only" role="status" data-testid="anchor-status">{{
              anchors.message()
            }}</span>
          </div>

          @if (neighbours().next || neighbours().prev) {
            <app-docs-footer-nav
              [prevHref]="neighbours().prev?.path"
              [prevLabel]="neighbours().prev?.title ?? ''"
              [nextHref]="neighbours().next?.path"
              [nextLabel]="neighbours().next?.title ?? ''"
            />
          }
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(keydown.escape)': 'menuOpen.set(false)' },
})
export default class DocsLayout {
  readonly #router = inject(Router);

  protected readonly groups = DOCS_NAV;
  protected readonly menuOpen = signal(false);
  protected readonly query = signal('');
  protected readonly results = computed(() => searchDocs(this.query()));

  readonly #url = toSignal(
    this.#router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.#router.url },
  );

  protected readonly neighbours = computed(() => docsNeighbours(this.#url()));
  protected readonly currentTitle = computed(() => {
    const path = this.#url().split(/[?#]/)[0].replace(/\/$/, '');
    return DOCS_NAV.flatMap((g) => g.items).find((i) => i.path === path)?.title ?? 'Documentation';
  });

  protected goToFirst(): void {
    const first = this.results()[0];
    if (first) {
      void this.#router.navigateByUrl(first.path);
      this.afterNavigate();
    }
  }

  protected afterNavigate(): void {
    this.menuOpen.set(false);
    this.query.set('');
  }
}
