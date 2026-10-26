import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MoveAnimationDirective, MoveInViewDirective, MoveTextDirective } from 'movement';
import { VoltBadge, VoltNativeButton } from '@voltui/components';
import { SpotlightDirective } from '../../../../shared/spotlight/spotlight.directive';

type UseCaseId = 'cards' | 'drawer' | 'list' | 'state' | 'scroll' | 'svg';

interface UseCase {
  id: UseCaseId;
  title: string;
  purpose: string;
  api: string;
  demo: string;
  docs: string;
  snippet: string;
}

/**
 * "What you can build" as a bento grid. Each tile carries a miniature of its use case, and
 * hovering or focusing the tile flips one signal that every miniature animates from with
 * `[moveAnimation]` — the library describing itself: state in, motion out.
 */
@Component({
  selector: 'app-use-cases',
  imports: [
    RouterLink,
    MoveAnimationDirective,
    MoveInViewDirective,
    MoveTextDirective,
    VoltBadge,
    VoltNativeButton,
    SpotlightDirective,
  ],
  template: `
    <section class="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div class="mb-12 max-w-2xl">
        <h2
          class="font-display text-text mb-4 text-3xl font-bold tracking-tight md:text-5xl"
          moveText="fade-up"
          moveTextSplit="words"
          [moveTextStagger]="45"
        >
          What you can build
        </h2>
        <p class="text-text-muted text-lg leading-relaxed" moveInView="fade-up">
          A short list of interface problems the library is good at. Hover a tile to see it, then
          open its live demo or the documentation.
        </p>
      </div>

      <div class="bento grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        @for (item of cases; track item.id) {
          <article
            appSpotlight
            class="bento-tile"
            [class]="'bento-' + item.id"
            [class.is-on]="active() === item.id"
            moveInView="fade-up"
            (pointerenter)="active.set(item.id)"
            (pointerleave)="active.set(null)"
            (focusin)="active.set(item.id)"
            (focusout)="active.set(null)"
          >
            <div class="bento-stage" aria-hidden="true">
              @switch (item.id) {
                @case ('cards') {
                  @for (card of fan; track card.id) {
                    <span
                      class="mini-card"
                      [moveAnimation]="{
                        initial: { x: 0, y: card.rest, rotate: 0 },
                        animate: {
                          x: on(item.id) ? card.x : 0,
                          y: on(item.id) ? card.y : card.rest,
                          rotate: on(item.id) ? card.rotate : 0,
                        },
                        duration: 450,
                        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                      }"
                      ><i></i><i></i
                    ></span>
                  }
                }
                @case ('drawer') {
                  <span class="mini-window">
                    <i></i><i></i><i></i>
                    <span
                      class="mini-backdrop"
                      [moveAnimation]="{
                        initial: { opacity: 0 },
                        animate: { opacity: on(item.id) ? 1 : 0 },
                        duration: 300,
                      }"
                    ></span>
                    <span
                      class="mini-drawer"
                      [moveAnimation]="{
                        initial: { x: 260 },
                        animate: { x: on(item.id) ? 0 : 260 },
                        duration: 450,
                        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                      }"
                      ><i></i><i></i><i></i
                    ></span>
                  </span>
                }
                @case ('list') {
                  <span class="mini-list">
                    <span
                      class="mini-row is-new"
                      [moveAnimation]="{
                        initial: { opacity: 0, scale: 0.9 },
                        animate: { opacity: on(item.id) ? 1 : 0, scale: on(item.id) ? 1 : 0.9 },
                        duration: 350,
                        delay: on(item.id) ? 150 : 0,
                      }"
                    ></span>
                    @for (row of rows; track row) {
                      <span
                        class="mini-row"
                        [moveAnimation]="{
                          initial: { y: row * 34 },
                          animate: { y: (row + (on(item.id) ? 1 : 0)) * 34 },
                          duration: 400,
                          delay: row * 40,
                          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                        }"
                      ></span>
                    }
                  </span>
                }
                @case ('state') {
                  <span class="mini-state">
                    <span class="mini-toggle" [class.is-on]="on(item.id)">
                      <span
                        class="mini-knob"
                        [moveAnimation]="{
                          initial: { x: 0 },
                          animate: { x: on(item.id) ? 26 : 0 },
                          duration: 350,
                          easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                        }"
                      ></span>
                    </span>
                    <span
                      class="mini-badge"
                      [moveAnimation]="{
                        initial: { scale: 1, rotate: 0 },
                        animate: { scale: on(item.id) ? 1.12 : 1, rotate: on(item.id) ? 4 : 0 },
                        duration: 400,
                      }"
                      >{{ on(item.id) ? 'active' : 'idle' }}</span
                    >
                  </span>
                }
                @case ('scroll') {
                  <span class="mini-scroll">
                    <span
                      class="mini-progress"
                      [moveAnimation]="{
                        initial: { scaleX: 0.15 },
                        animate: { scaleX: on(item.id) ? 1 : 0.15 },
                        duration: 900,
                      }"
                    ></span>
                    @for (block of blocks; track block) {
                      <span
                        class="mini-block"
                        [moveAnimation]="{
                          initial: { opacity: 0.25, y: 12 },
                          animate: { opacity: on(item.id) ? 1 : 0.25, y: on(item.id) ? 0 : 12 },
                          duration: 450,
                          delay: on(item.id) ? block * 120 : 0,
                        }"
                      ></span>
                    }
                  </span>
                }
                @default {
                  <svg class="mini-svg" viewBox="0 0 320 120" fill="none">
                    <path
                      d="M10 90 C 60 10, 110 10, 150 60 S 240 120, 310 30"
                      [moveAnimation]="{
                        initial: { pathLength: 0.12 },
                        animate: { pathLength: on(item.id) ? 1 : 0.12 },
                        duration: 1100,
                        easing: 'cubic-bezier(0.65, 0, 0.35, 1)',
                      }"
                    />
                    <circle
                      cx="310"
                      cy="30"
                      r="6"
                      [moveAnimation]="{
                        initial: { opacity: 0, scale: 0.4 },
                        animate: { opacity: on(item.id) ? 1 : 0, scale: on(item.id) ? 1 : 0.4 },
                        duration: 300,
                        delay: on(item.id) ? 900 : 0,
                      }"
                    />
                  </svg>
                }
              }
            </div>

            <div class="bento-body">
              <div class="flex items-start justify-between gap-3">
                <h3 class="font-display text-text m-0 text-lg font-semibold">{{ item.title }}</h3>
                <volt-badge variant="success">Stable</volt-badge>
              </div>
              <p class="text-text-muted m-0 text-sm leading-relaxed">{{ item.purpose }}</p>
              <code class="bento-code">{{ item.snippet }}</code>
              <div class="flex gap-2">
                <a voltButton size="sm" variant="outline" [routerLink]="item.demo">Live demo</a>
                <a voltButton size="sm" variant="ghost" [routerLink]="item.docs">Docs</a>
              </div>
              <span class="sr-only">Uses {{ item.api }}</span>
            </div>
          </article>
        }
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UseCases {
  protected readonly active = signal<UseCaseId | null>(null);
  protected readonly fan = [
    { id: 0, rest: 8, x: -86, y: 6, rotate: -9 },
    { id: 1, rest: 0, x: 0, y: -10, rotate: 0 },
    { id: 2, rest: -8, x: 86, y: 6, rotate: 9 },
  ] as const;
  protected readonly rows = [0, 1, 2] as const;
  protected readonly blocks = [0, 1, 2] as const;

  protected on(id: UseCaseId): boolean {
    return this.active() === id;
  }

  protected readonly cases: readonly UseCase[] = [
    {
      id: 'cards',
      title: 'Interactive cards',
      purpose: 'Lift on hover, press on tap, ring on focus — one attribute each, composable.',
      api: 'moveWhileHover, moveWhileTap, moveWhileFocus',
      demo: '/demos/hover',
      docs: '/docs/guides/interactions',
      snippet: '<div [moveWhileHover]="{ y: [0, -4] }">',
    },
    {
      id: 'drawer',
      title: 'Modals and drawers',
      purpose: 'Keep the panel mounted until its exit animation finishes, then remove it.',
      api: 'movePresence',
      demo: '/demos/presence',
      docs: '/docs/guides/presence',
      snippet: '<aside *movePresence="open" moveLeave="fade-down">',
    },
    {
      id: 'list',
      title: 'Animated lists',
      purpose: 'Add, remove and reorder keyed rows without losing identity mid-exit.',
      api: 'movePresenceFor',
      demo: '/demos/presence-list',
      docs: '/docs/guides/presence',
      snippet: '<li *movePresenceFor="let r of rows(); trackBy: byId">',
    },
    {
      id: 'state',
      title: 'Reactive state',
      purpose: 'Animate between named or object states whenever a signal changes.',
      api: 'moveVariants, moveAnimation',
      demo: '/demos/variants',
      docs: '/docs/guides/variants',
      snippet: '<div [moveVariants]="v" [moveVariant]="state()">',
    },
    {
      id: 'scroll',
      title: 'Scroll reveal and progress',
      purpose: 'Reveal on entry or scrub a progress animation with scroll position.',
      api: 'moveInView, moveScroll',
      demo: '/demos/scroll',
      docs: '/docs/guides/stagger-and-scroll',
      snippet: '<section moveInView="fade-up">',
    },
    {
      id: 'svg',
      title: 'SVG drawing',
      purpose: 'Draw paths and animate icons with presets that normalise SVG transform origins.',
      api: 'movePathDraw, moveIconPulse',
      demo: '/demos/icons',
      docs: '/docs/presets',
      snippet: '<path moveEnter="icon-draw" d="…" />',
    },
  ];
}
