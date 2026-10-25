import type { RouteMeta } from '@analogjs/router';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MoveSmoothScrollDirective, SmoothScrollService } from 'movement';
import { DemoWorkbench } from '../../shared/components/demo-workbench/demo-workbench';
import { DemoCodeTabs } from '../../shared/components/demo-workbench/demo-code-tabs';

export const routeMeta: RouteMeta = { title: 'moveSmoothScroll demo — Angular Movement' };

@Component({
  selector: 'app-demo-smooth-scroll',
  imports: [DemoWorkbench, DemoCodeTabs, MoveSmoothScrollDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-demo-workbench
      title="moveSmoothScroll"
      [experimental]="true"
      description="Inertial scrolling scoped to this preview. Wheel, touch and native keyboard input stay inside the test region. The root singleton owns one container at a time and opts out under reduced motion."
      [canReset]="true"
      (resetRequested)="scrollToTop()"
    >
      <div stage class="h-full w-full">
        <div
          moveSmoothScroll
          [moveSmoothScrollLerp]="0.1"
          id="smooth-demo-container"
          data-testid="smooth-scroll-container"
          class="border-border bg-surface h-full overflow-y-auto rounded-xl border"
          tabindex="0"
          role="region"
          aria-label="Smooth scroll test region"
        >
          <div class="smooth-scroll-journey">
            @for (
              label of [
                'Scroll to explore',
                'Native keyboard input works',
                'Motion follows your scroll',
                'You have reached the end',
              ];
              track label;
              let i = $index
            ) {
              <div class="smooth-scroll-stop">
                <span>0{{ i + 1 }}</span>
                <h2>{{ label }}</h2>
                <p>Wheel, swipe, or use Page Down inside this canvas.</p>
              </div>
            }
          </div>
        </div>
      </div>
      <div controls data-testid="smooth-scroll-readout">
        <p class="text-text-muted text-xs">scrollY()</p>
        <p class="text-accent mb-4 font-mono text-3xl" data-testid="smooth-scroll-value">
          {{ scrollYRounded() }}px
        </p>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="border-border rounded-lg border px-3 py-2 text-sm"
            data-testid="smooth-scroll-top"
            (click)="scrollToTop()"
          >
            scrollTo(0)
          </button>
          <button
            type="button"
            class="border-border rounded-lg border px-3 py-2 text-sm"
            data-testid="smooth-scroll-instant"
            (click)="scrollToInstant()"
          >
            scrollTo(400, instant)
          </button>
        </div>
        <p class="text-text-muted mt-4 text-xs">
          Reduced motion uses native scrolling. One container owns the service; leaving this route
          destroys it.
        </p>
      </div>
      <app-demo-code-tabs code [files]="files" />
    </app-demo-workbench>
  `,
})
export default class DemoSmoothScroll {
  readonly #scroll = inject(SmoothScrollService);
  protected readonly scrollYRounded = computed(() => Math.round(this.#scroll.scrollY()));
  protected readonly files = [
    {
      title: 'scoped-container.html',
      code: `<div moveSmoothScroll [moveSmoothScrollLerp]="0.1"
     style="height: 360px; overflow-y: auto"
     tabindex="0" role="region" aria-label="Scroll preview">
  <div style="height: 1400px">Your scrollable content</div>
</div>`,
    },
    {
      title: 'scroll.component.ts',
      code: `import { Component, inject } from '@angular/core';
import { MoveSmoothScrollDirective, SmoothScrollService } from 'angular-movement';

@Component({
  selector: 'app-scroll',
  imports: [MoveSmoothScrollDirective],
  templateUrl: './scoped-container.html',
})
export class ScrollDemo {
  readonly scroll = inject(SmoothScrollService);
  readonly position = this.scroll.scrollY;
  toStart() { this.scroll.scrollTo(0); }
}
// The directive initializes and destroys its container. Do not also call init() globally.`,
    },
  ];
  protected scrollToTop(): void {
    this.#scroll.scrollTo(0);
  }
  protected scrollToInstant(): void {
    this.#scroll.scrollTo(400, true);
  }
}
