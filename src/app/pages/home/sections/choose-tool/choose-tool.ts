import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-choose-tool',
  imports: [RouterLink],
  template: `
    <section class="border-border mx-auto max-w-7xl border-t px-4 py-20 sm:px-6 lg:px-8">
      <div class="mb-12 max-w-2xl">
        <h2 class="font-display text-text mb-4 text-3xl font-bold tracking-tight md:text-4xl">
          Use the simplest tool that works
        </h2>
        <p class="text-text-muted text-lg leading-relaxed">
          Movement is not a replacement for CSS or for Angular's own
          <code>animate.enter</code> / <code>animate.leave</code>. It adds value when motion has to
          react to state and be coordinated.
        </p>
      </div>

      <div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        @for (tool of tools; track tool.name) {
          <article
            class="border-border flex flex-col rounded-2xl border p-6"
            [class.bg-accent/5]="tool.highlight"
            [class.border-accent/40]="tool.highlight"
            [class.bg-surface]="!tool.highlight"
          >
            <h3 class="font-display text-text mb-1 text-lg font-bold">{{ tool.name }}</h3>
            <p class="text-text-subtle mb-4 text-sm">{{ tool.when }}</p>
            <ul class="text-text-muted m-0 list-disc space-y-2 pl-5 text-sm">
              @for (point of tool.points; track point) {
                <li>{{ point }}</li>
              }
            </ul>
          </article>
        }
      </div>

      <p class="mt-8">
        <a routerLink="/docs/choose-a-tool" class="text-accent font-semibold underline"
          >Full comparison and decision guide →</a
        >
      </p>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChooseTool {
  protected readonly tools = [
    {
      name: 'CSS',
      when: 'Hover colours, simple transitions, loaders',
      points: [
        'Zero JavaScript, runs before hydration',
        'Best for state that already lives in a class or pseudo-class',
        'No coordination with element lifetime',
      ],
      highlight: false,
    },
    {
      name: 'animate.enter / animate.leave',
      when: 'Enter and leave of elements, Angular 20.2+',
      points: [
        'Built into Angular, nothing to install',
        'Applies CSS classes while a node enters or leaves',
        'Ideal when each element has its own self-contained enter/leave',
      ],
      highlight: false,
    },
    {
      name: 'Angular Movement',
      when: 'Motion driven by state and coordinated across elements',
      points: [
        'Reactive state-to-state transitions, variants and stagger',
        'Keyed-list presence, springs, scroll-linked and SVG motion',
        'Signals-based values, imperative MoveAnimator, SSR-safe',
      ],
      highlight: true,
    },
    {
      name: 'Raw WAAPI',
      when: 'One-off, fully custom effects',
      points: [
        'element.animate() directly, maximal control',
        'You own cancellation, reduced motion and cleanup',
        'Fine for a single isolated effect',
      ],
      highlight: false,
    },
  ];
}
