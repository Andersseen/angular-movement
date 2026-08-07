import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SmoothScrollService } from 'movement';
import { CodeBlock } from '../../shared/components/code-block/code-block';

const SERVICE_CODE = `import { Component, inject } from '@angular/core';
import { SmoothScrollService } from 'angular-movement';

@Component({ /* ... */ })
export class App {
  constructor() {
    // Lower lerp = smoother and slower. Range 0–1.
    inject(SmoothScrollService).init({ lerp: 0.1 });
  }
}`;

const CONSUME_CODE = `const scroll = inject(SmoothScrollService);

// Reactive position, updated on every RAF tick.
readonly scrollY = scroll.scrollY;

// Native 'scroll' events do NOT fire while smooth scroll drives the page,
// so read this signal instead of listening to window.scroll.
readonly progress = computed(() => this.scrollY() / 1000);

scroll.scrollTo(0);          // animated
scroll.scrollTo(500, true);  // instant`;

const DIRECTIVE_CODE = `<!-- Scopes smooth scroll to one scrollable container instead of the page -->
<div moveSmoothScroll [moveSmoothScrollLerp]="0.08"
     style="overflow-y: auto; height: 100vh">
  ...content...
</div>`;

@Component({
  selector: 'app-demo-smooth-scroll',
  imports: [CodeBlock],
  template: `
    <div class="space-y-8">
      <header class="space-y-3">
        <h1 class="font-display text-text text-3xl font-bold sm:text-4xl">moveSmoothScroll</h1>
        <p class="text-text-muted max-w-3xl">
          Lenis-style inertial scrolling. Wheel and touch input are intercepted and interpolated
          toward a target position, and the resulting offset is published as the
          <code class="text-accent">scrollY</code> signal.
        </p>
        <p class="text-text-muted max-w-3xl text-sm">
          This documentation site already calls
          <code class="text-accent">init()</code> at the app root, so the readout below is the live
          service driving the page you are scrolling right now.
        </p>
      </header>

      <!-- Live readout -->
      <section
        class="bg-surface border-accent/30 space-y-6 rounded-xl border p-6"
        data-testid="smooth-scroll-readout"
      >
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div class="text-text-muted text-xs tracking-wider uppercase">scrollY()</div>
            <div
              class="font-display text-accent text-4xl font-bold tabular-nums"
              data-testid="smooth-scroll-value"
            >
              {{ scrollYRounded() }}<span class="text-text-muted text-xl">px</span>
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="bg-accent/10 text-accent hover:bg-accent/20 cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              data-testid="smooth-scroll-top"
              (click)="scrollToTop()"
            >
              scrollTo(0)
            </button>
            <button
              type="button"
              class="bg-surface-raised text-text hover:bg-accent/10 cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              data-testid="smooth-scroll-instant"
              (click)="scrollToInstant()"
            >
              scrollTo(400, instant)
            </button>
          </div>
        </div>

        <div class="bg-surface-raised h-2 overflow-hidden rounded-full">
          <div
            class="bg-accent h-full rounded-full transition-[width] duration-100"
            [style.width.%]="pageProgress()"
          ></div>
        </div>

        <p class="text-text-muted text-sm">
          Service active:
          <span class="text-text font-medium" data-testid="smooth-scroll-active">{{
            isActive() ? 'yes' : 'no (reduced motion, SSR, or not initialised)'
          }}</span>
        </p>
      </section>

      <!-- Caveats — these are real constraints, not boilerplate -->
      <section class="border-accent/30 bg-accent/5 space-y-3 rounded-xl border p-6">
        <h2 class="font-display text-text text-lg font-bold">Before you reach for it</h2>
        <ul class="text-text-muted list-disc space-y-2 pl-5 text-sm">
          <li>
            <strong class="text-text">It is a root singleton.</strong>
            <code class="text-accent">SmoothScrollService</code> is
            <code class="text-accent">providedIn: 'root'</code>, and
            <code class="text-accent">init()</code> is a no-op while an instance is already running.
            Using <code class="text-accent">[moveSmoothScroll]</code> on a container after the root
            has initialised does nothing — and destroying that element tears down the global
            instance. Pick one: the service at the root, or the directive on one container.
          </li>
          <li>
            <strong class="text-text">It opts out of reduced motion.</strong>
            <code class="text-accent">init()</code> returns early when
            <code class="text-accent">prefers-reduced-motion</code> is active, since overriding
            native scroll is disorienting. Never assume it is running.
          </li>
          <li>
            <strong class="text-text">Native scroll events stop firing.</strong> Read the
            <code class="text-accent">scrollY</code> signal instead of
            <code class="text-accent">window.scroll</code>.
            <code class="text-accent">moveScroll</code> already does this for you.
          </li>
        </ul>
      </section>

      <div class="grid gap-6 lg:grid-cols-2">
        <app-code-block title="app.ts" [code]="serviceCode" />
        <app-code-block title="consuming.ts" [code]="consumeCode" />
      </div>

      <app-code-block title="scoped-container.html" [code]="directiveCode" />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DemoSmoothScroll {
  readonly #scroll = inject(SmoothScrollService);
  readonly #isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly serviceCode = SERVICE_CODE;
  protected readonly consumeCode = CONSUME_CODE;
  protected readonly directiveCode = DIRECTIVE_CODE;

  protected readonly scrollYRounded = computed(() => Math.round(this.#scroll.scrollY()));

  protected readonly pageProgress = computed(() => {
    if (!this.#isBrowser) return 0;
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    return max > 0 ? Math.min(100, (this.#scroll.scrollY() / max) * 100) : 0;
  });

  protected readonly isActive = signal(this.#isBrowser && this.#scroll.isActive);

  protected scrollToTop(): void {
    this.#scroll.scrollTo(0);
  }

  protected scrollToInstant(): void {
    this.#scroll.scrollTo(400, true);
  }
}
