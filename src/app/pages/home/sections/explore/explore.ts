import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  PLATFORM_ID,
  signal,
  viewChildren,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  MoveAnimationDirective,
  MoveEnterDirective,
  MoveInViewDirective,
  MoveScrollDirective,
  MoveTextDirective,
} from 'movement';
import {
  VoltBadge,
  VoltCard,
  VoltCardContent,
  VoltNativeButton,
  VoltTabs,
  VoltToggleGroup,
  VoltToggleGroupItem,
  VoltTabsContent,
  VoltTabsList,
  VoltTabsTrigger,
} from '@voltui/components';
import { CodeBlock } from '../../../../shared/components/code-block/code-block';
import { InteractionExample } from '../../../../motion-examples/interaction/interaction-example';
import { PresenceExample } from '../../../../motion-examples/presence/presence-example';
import { StaggerExample } from '../../../../motion-examples/stagger/stagger-example';
import { VariantsExample } from '../../../../motion-examples/variants/variants-example';

interface Tab {
  readonly id: string;
  readonly label: string;
  readonly title: string;
  readonly blurb: string;
  readonly code: string;
  readonly guide: string;
  readonly demo: string;
}

const TABS: readonly Tab[] = [
  {
    id: 'interaction',
    title: 'Feel it under the pointer',
    label: 'Hover & press',
    blurb:
      'Feedback while something is true: the pointer is over it, it is pressed. Touch gets press feedback, not a sticky hover.',
    code: `<button moveWhileHover="lift" moveWhileTap="press">Save</button>`,
    guide: '/docs/guides/interactions',
    demo: '/demos/hover',
  },
  {
    id: 'variants',
    title: 'Animate to a state, not through code',
    label: 'State',
    blurb:
      'Bind a state name and the element animates to it whenever a signal changes. Nothing is recreated.',
    code: `<div
  [moveVariants]="{
    idle: { scale: 1 },
    active: { scale: 1.1, rotate: 4 }
  }"
  [moveVariant]="selected() ? 'active' : 'idle'"
></div>`,
    guide: '/docs/guides/variants',
    demo: '/demos/variants',
  },
  {
    id: 'presence',
    title: 'Leave animations that actually finish',
    label: 'Presence',
    blurb:
      'A leave animation needs an element that still exists. Presence keeps the view mounted until it has finished leaving.',
    code: `<ng-container *movePresence="open()">
  <aside moveEnter="fade-up" moveLeave="fade-down">Panel</aside>
</ng-container>`,
    guide: '/docs/guides/presence',
    demo: '/demos/presence',
  },
  {
    id: 'stagger',
    title: 'Choreography from DOM order',
    label: 'Stagger',
    blurb: 'Sibling delays come from DOM order, so it works with @for without index bookkeeping.',
    code: `<ul moveStagger moveStaggerStep="80ms">
  @for (item of items(); track item.id) {
    <li moveEnter="fade-up">{{ item.label }}</li>
  }
</ul>`,
    guide: '/docs/guides/stagger-and-scroll',
    demo: '/demos/stagger',
  },
];

/**
 * "See it move", told as a scroll story: each step's copy scrolls past a sticky window that swaps
 * to the matching live example. The window keeps Volt tabs, so it is just as usable without
 * scrolling (and is the whole section below `lg`, where the story column is hidden).
 */
@Component({
  selector: 'app-explore',
  imports: [
    RouterLink,
    MoveAnimationDirective,
    MoveEnterDirective,
    MoveInViewDirective,
    MoveScrollDirective,
    MoveTextDirective,
    CodeBlock,
    InteractionExample,
    VariantsExample,
    PresenceExample,
    StaggerExample,
    VoltBadge,
    VoltCard,
    VoltCardContent,
    VoltNativeButton,
    VoltTabs,
    VoltTabsList,
    VoltTabsTrigger,
    VoltTabsContent,
    VoltToggleGroup,
    VoltToggleGroupItem,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div class="mb-12 max-w-2xl lg:mb-4">
        <p class="home-kicker" moveInView="fade-up">SEE IT MOVE <span>/</span> SCROLL THE STORY</p>
        <h2
          class="font-display text-text mb-4 text-3xl font-bold tracking-tight md:text-5xl"
          moveText="fade-up"
          moveTextSplit="words"
          [moveTextStagger]="45"
        >
          Four things CSS alone makes awkward.
        </h2>
        <p class="text-text-muted text-lg leading-relaxed" moveInView="fade-up">
          Each one is a stable API, running live.<span class="hidden lg:inline">
            Scroll, or pick a tab.</span
          >
        </p>
      </div>

      <div class="grid grid-cols-1 gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <!-- The story: one tall step per example. Desktop only; the window carries mobile. -->
        <!-- moveScroll measures the list (which never transforms) and exposes its progress; the
             rail reads it, so the measured element and the drawn one are never the same. -->
        <ol
          class="story-steps relative m-0 hidden list-none p-0 lg:block"
          #story="moveScroll"
          [moveScroll]="{ opacity: [1, 1] }"
          [moveScrollOffset]="['0 0.5', '1 0.5']"
        >
          <span class="story-rail" aria-hidden="true">
            <span
              class="story-rail-fill"
              [style.transform]="'scaleY(' + story.progress() + ')'"
            ></span>
          </span>
          @for (tab of tabs; track tab.id; let i = $index) {
            <li
              #step
              class="story-step"
              [class.is-active]="active() === tab.id"
              [attr.data-step]="tab.id"
            >
              <!-- The active step slides in a little; text keeps full contrast either way. -->
              <div
                [moveAnimation]="{
                  initial: { x: 0 },
                  animate: { x: active() === tab.id ? 12 : 0 },
                  duration: 350,
                }"
              >
                <p class="text-accent m-0 mb-3 font-mono text-sm">0{{ i + 1 }} · {{ tab.label }}</p>
                <h3 class="font-display text-text m-0 mb-4 text-2xl font-bold tracking-tight">
                  {{ tab.title }}
                </h3>
                <p class="text-text-muted m-0 mb-6 text-lg leading-relaxed">{{ tab.blurb }}</p>
                <div class="flex flex-wrap gap-2">
                  <a voltButton size="sm" variant="outline" [routerLink]="tab.guide"
                    >Read the guide</a
                  >
                  <a voltButton size="sm" variant="ghost" [routerLink]="tab.demo"
                    >Open playground</a
                  >
                </div>
              </div>
            </li>
          }
        </ol>

        <!-- The window: sticky beside the story, the whole section on smaller screens. -->
        <div class="min-w-0">
          <volt-card class="story-window landing-card lg:sticky lg:top-24" moveInView="fade-up">
            <volt-card-content class="p-0">
              <volt-tabs [value]="active()" (valueChange)="select($event)">
                <div class="story-window-bar">
                  <span class="story-dots" aria-hidden="true"><i></i><i></i><i></i></span>
                  <volt-tabs-list class="flex-wrap">
                    @for (tab of tabs; track tab.id) {
                      <volt-tabs-trigger [value]="tab.id">{{ tab.label }}</volt-tabs-trigger>
                    }
                  </volt-tabs-list>
                </div>

                @for (tab of tabs; track tab.id) {
                  <volt-tabs-content [value]="tab.id" class="p-4 sm:p-6">
                    <div class="story-stage">
                      <!-- Only the active tab's example is created: Volt keeps inactive panels in the
                           DOM, hidden, and an animation cannot commit its styles on a hidden element. -->
                      @if (active() === tab.id) {
                        <div moveEnter="fade-up" moveDuration="350ms" class="w-full">
                          @switch (tab.id) {
                            @case ('interaction') {
                              <app-interaction-example />
                            }
                            @case ('variants') {
                              <volt-toggle-group
                                type="single"
                                class="mb-4 justify-center"
                                aria-label="Active variant"
                                [value]="[variant()]"
                                (valueChange)="setVariant($event)"
                              >
                                @for (v of variants; track v) {
                                  <volt-toggle-group-item [value]="v">{{
                                    v
                                  }}</volt-toggle-group-item>
                                }
                              </volt-toggle-group>
                              <app-variants-example [variant]="variant()" />
                            }
                            @case ('presence') {
                              <app-presence-example />
                            }
                            @default {
                              <app-stagger-example />
                            }
                          }
                        </div>
                      }
                    </div>
                    <div class="mt-5 min-w-0 space-y-4">
                      <div class="flex items-center gap-2 lg:hidden">
                        <volt-badge variant="success">Stable</volt-badge>
                      </div>
                      <p class="text-text-muted m-0 leading-relaxed lg:hidden">{{ tab.blurb }}</p>
                      <app-code-block
                        [title]="tab.id + '.html'"
                        language="html"
                        [code]="tab.code"
                      />
                      <div class="flex flex-wrap gap-2 lg:hidden">
                        <a voltButton size="sm" variant="outline" [routerLink]="tab.guide"
                          >Read the guide</a
                        >
                        <a voltButton size="sm" variant="ghost" [routerLink]="tab.demo"
                          >Open playground</a
                        >
                      </div>
                    </div>
                  </volt-tabs-content>
                }
              </volt-tabs>
            </volt-card-content>
          </volt-card>
        </div>
      </div>
    </section>
  `,
})
export class Explore {
  protected readonly tabs = TABS;
  protected readonly active = signal(TABS[0].id);
  protected readonly variants = ['idle', 'active', 'error'] as const;
  protected readonly variant = signal<(typeof this.variants)[number]>('active');
  protected readonly steps = viewChildren<ElementRef<HTMLElement>>('step');
  // A tab click scrolls its step into view; the steps it passes must not steal the selection.
  #pinnedUntil = 0;

  constructor() {
    const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (!isBrowser || typeof IntersectionObserver === 'undefined') return;
      // The step crossing the middle band of the viewport is the active one.
      const observer = new IntersectionObserver(
        (entries) => {
          if (performance.now() < this.#pinnedUntil) return;
          const hit = entries.find((entry) => entry.isIntersecting);
          const id = hit?.target.getAttribute('data-step');
          if (id) this.active.set(id);
        },
        { rootMargin: '-45% 0px -45% 0px' },
      );
      for (const step of this.steps()) observer.observe(step.nativeElement);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  protected select(id: string | undefined): void {
    if (!id || id === this.active()) return;
    this.active.set(id);
    const step = this.steps().find((ref) => ref.nativeElement.dataset['step'] === id);
    // Hidden below lg: the window is the whole section there, so there is nothing to scroll to.
    if (step && step.nativeElement.offsetParent !== null) {
      this.#pinnedUntil = performance.now() + 900;
      step.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  protected setVariant(value: string[]): void {
    const next = this.variants.find((v) => v === value[0]);
    if (next) this.variant.set(next);
  }
}
