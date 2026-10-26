import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MoveHoverDirective, MoveInViewDirective, MoveStaggerDirective } from 'movement';
import {
  VoltBadge,
  VoltCard,
  VoltCardContent,
  VoltCardDescription,
  VoltCardHeader,
  VoltCardTitle,
  VoltNativeButton,
} from '@voltui/components';

interface UseCase {
  title: string;
  purpose: string;
  api: string;
  demo: string;
  docs: string;
  snippet: string;
}

@Component({
  selector: 'app-use-cases',
  imports: [
    RouterLink,
    MoveHoverDirective,
    MoveInViewDirective,
    MoveStaggerDirective,
    VoltBadge,
    VoltCard,
    VoltCardHeader,
    VoltCardTitle,
    VoltCardDescription,
    VoltCardContent,
    VoltNativeButton,
  ],
  template: `
    <section class="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div class="mb-12 max-w-2xl" moveInView="fade-up">
        <h2 class="font-display text-text mb-4 text-3xl font-bold tracking-tight md:text-4xl">
          What you can build
        </h2>
        <p class="text-text-muted text-lg leading-relaxed">
          A short list of interface problems the library is good at. Each links to a live,
          configurable demo and to the documentation.
        </p>
      </div>

      <div
        moveStagger
        moveStaggerStep="80ms"
        class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        @for (item of cases; track item.title) {
          <!-- Reveal on the wrapper, lift on the card: two directives, two elements, no transform fight. -->
          <div moveInView="fade-up">
            <volt-card class="landing-card flex h-full flex-col" [moveWhileHover]="{ y: [0, -6] }">
              <volt-card-header>
                <div class="flex items-start justify-between gap-3">
                  <volt-card-title>{{ item.title }}</volt-card-title>
                  <volt-badge variant="success">Stable</volt-badge>
                </div>
                <volt-card-description>{{ item.purpose }}</volt-card-description>
              </volt-card-header>
              <volt-card-content class="mt-auto space-y-4">
                <code
                  class="bg-code-bg border-border text-text-muted block rounded-lg border px-3 py-2 font-mono text-xs break-words whitespace-pre-wrap"
                  >{{ item.snippet }}</code
                >
                <div class="flex gap-2">
                  <a voltButton size="sm" variant="outline" [routerLink]="item.demo">Live demo</a>
                  <a voltButton size="sm" variant="ghost" [routerLink]="item.docs">Docs</a>
                </div>
                <span class="sr-only">Uses {{ item.api }}</span>
              </volt-card-content>
            </volt-card>
          </div>
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
      snippet: '<div [moveWhileHover]="{ y: [0, -4] }">',
    },
    {
      title: 'Modals and drawers',
      purpose: 'Keep the panel mounted until its exit animation finishes, then remove it.',
      api: 'movePresence',
      demo: '/demos/presence',
      docs: '/docs/guides/presence',
      snippet: '<aside *movePresence="open" moveLeave="fade-down">',
    },
    {
      title: 'Animated lists',
      purpose: 'Add, remove and reorder keyed rows without losing identity mid-exit.',
      api: 'movePresenceFor',
      demo: '/demos/presence-list',
      docs: '/docs/guides/presence',
      snippet: '<li *movePresenceFor="let r of rows(); trackBy: byId">',
    },
    {
      title: 'Reactive state',
      purpose: 'Animate between named or object states whenever a signal changes.',
      api: 'moveVariants, moveAnimation',
      demo: '/demos/variants',
      docs: '/docs/guides/variants',
      snippet: '<div [moveVariants]="v" [moveVariant]="state()">',
    },
    {
      title: 'Scroll reveal and progress',
      purpose: 'Reveal on entry or scrub a progress animation with scroll position.',
      api: 'moveInView, moveScroll',
      demo: '/demos/scroll',
      docs: '/docs/guides/stagger-and-scroll',
      snippet: '<section moveInView="fade-up">',
    },
    {
      title: 'SVG drawing',
      purpose: 'Draw paths and animate icons with presets that normalise SVG transform origins.',
      api: 'movePathDraw, moveIconPulse',
      demo: '/demos/icons',
      docs: '/docs/presets',
      snippet: '<path moveEnter="icon-draw" d="…" />',
    },
  ];
}
