import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './layout/navbar/navbar';
import { Footer } from './layout/footer/footer';
import { SeoService } from './shared/seo.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer],
  template: `
    <a
      href="#main"
      (click)="skipToContent($event)"
      class="bg-accent-solid focus-visible:outline-accent sr-only z-[60] rounded-lg px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >Skip to content</a
    >
    <app-navbar />
    <main id="main" class="min-h-screen pt-16">
      <router-outlet />
    </main>
    <app-footer />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  constructor() {
    inject(SeoService).start();
  }

  /** `<base href="/">` turns a bare `#main` into a navigation to `/`, so focus the landmark directly. */
  protected skipToContent(event: Event): void {
    event.preventDefault();
    const main = document.getElementById('main');
    main?.setAttribute('tabindex', '-1');
    main?.focus();
  }
}
