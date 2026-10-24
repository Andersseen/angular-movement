import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface UseCase {
  title: string;
  purpose: string;
  api: string;
  demo: string;
  docs: string;
  status: 'Stable' | 'Experimental';
  snippet: string;
}

@Component({
  selector: 'app-use-cases',
  imports: [RouterLink],
  template: `
    <section class="border-border mx-auto max-w-7xl border-t px-4 py-20 sm:px-6 lg:px-8">
      <div class="mb-12 max-w-2xl">
        <h2 class="font-display text-text mb-4 text-3xl font-bold tracking-tight md:text-4xl">
          What you can build
        </h2>
        <p class="text-text-muted text-lg leading-relaxed">
          A short list of interface problems the library is good at. Each links to a live,
          configurable demo and to the documentation.
        </p>
      </div>

      <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        @for (item of cases; track item.title) {
          <article class="bg-surface border-border flex flex-col rounded-2xl border p-6">
            <div class="mb-3 flex items-start justify-between gap-3">
              <h3 class="font-display text-text m-0 text-lg font-bold">{{ item.title }}</h3>
              <span
                class="shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium"
                [class]="
                  item.status === 'Stable'
                    ? 'border-emerald-600/40 text-emerald-700 dark:text-emerald-400'
                    : 'border-amber-600/40 text-amber-700 dark:text-amber-400'
                "
                >{{ item.status }}</span
              >
            </div>
            <p class="text-text-muted mb-4 text-sm leading-relaxed">{{ item.purpose }}</p>
            <code
              class="bg-code-bg border-border text-text-muted mb-5 block rounded-lg border px-3 py-2 font-mono text-xs break-words whitespace-pre-wrap"
              >{{ item.snippet }}</code
            >
            <div class="mt-auto flex gap-4 text-sm font-semibold">
              <a [routerLink]="item.demo" class="text-accent underline">Live demo</a>
              <a [routerLink]="item.docs" class="text-accent underline">Docs</a>
            </div>
            <span class="sr-only">Uses {{ item.api }}</span>
          </article>
        }
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UseCases {
  protected readonly cases: UseCase[] = [
    {
      title: 'Interactive cards',
      purpose: 'Lift on hover, press on tap, ring on focus — one attribute each, composable.',
      api: 'moveWhileHover, moveWhileTap, moveWhileFocus',
      demo: '/demos/hover',
      docs: '/docs/guides/interactions',
      status: 'Stable',
      snippet: '<div [moveWhileHover]="{ y: [0, -4] }">',
    },
    {
      title: 'Modals and drawers',
      purpose: 'Keep the panel mounted until its exit animation finishes, then remove it.',
      api: 'movePresence',
      demo: '/demos/presence',
      docs: '/docs/guides/presence',
      status: 'Stable',
      snippet: '<aside *movePresence="open" moveLeave="fade-down">',
    },
    {
      title: 'Animated lists',
      purpose: 'Add, remove and reorder keyed rows without losing identity mid-exit.',
      api: 'movePresenceFor',
      demo: '/demos/presence-list',
      docs: '/docs/guides/presence',
      status: 'Stable',
      snippet: '<li *movePresenceFor="let r of rows(); trackBy: byId">',
    },
    {
      title: 'Reactive state',
      purpose: 'Animate between named or object states whenever a signal changes.',
      api: 'moveVariants, moveAnimation',
      demo: '/demos/variants',
      docs: '/docs/guides/variants',
      status: 'Stable',
      snippet: '<div [moveVariants]="v" [moveVariant]="state()">',
    },
    {
      title: 'Scroll reveal and progress',
      purpose: 'Reveal on entry or scrub a progress animation with scroll position.',
      api: 'moveInView, moveScroll',
      demo: '/demos/scroll',
      docs: '/docs/guides/stagger-and-scroll',
      status: 'Stable',
      snippet: '<section moveInView="fade-up">',
    },
    {
      title: 'SVG drawing',
      purpose: 'Draw paths and animate icons with presets that normalise SVG transform origins.',
      api: 'movePathDraw, moveIconPulse',
      demo: '/demos/icons',
      docs: '/docs/presets',
      status: 'Stable',
      snippet: '<path [moveAnimate]="draw" />',
    },
  ];
}
