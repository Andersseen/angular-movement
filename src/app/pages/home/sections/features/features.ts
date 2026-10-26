import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  MoveAnimationDirective,
  MoveHoverDirective,
  MoveInViewDirective,
  MoveTextDirective,
} from 'movement';
import { VoltNativeButton } from '@voltui/components';
import { LmnArrowLeftIcon } from 'lumen-icons/arrow-left';
import { LmnArrowRightIcon } from 'lumen-icons/arrow-right';
import { LmnBoltIcon } from 'lumen-icons/bolt';
import { LmnCubeIcon } from 'lumen-icons/cube';
import { LmnCursorArrowRaysIcon } from 'lumen-icons/cursor-arrow-rays';
import { LmnEyeIcon } from 'lumen-icons/eye';
import { LmnServerIcon } from 'lumen-icons/server';
import { LmnSparklesIcon } from 'lumen-icons/sparkles';

type PillarIcon = 'bolt' | 'cube' | 'cursor' | 'server' | 'eye' | 'sparkles';

interface Pillar {
  readonly icon: PillarIcon;
  readonly title: string;
  readonly body: string;
  readonly href: string;
  readonly cta: string;
}

const PILLARS: readonly Pillar[] = [
  {
    icon: 'bolt',
    title: 'Signals in, motion out',
    body: 'Bind an object or a signal and the element animates to the new state. moveValue, moveTransform and moveSpringValue derive motion from signals without a change-detection detour.',
    href: '/docs/guides/variants',
    cta: 'Reactive animation',
  },
  {
    icon: 'cube',
    title: 'Native browser animation',
    body: 'Playback runs on the Web Animations API, so transforms and opacity stay on the compositor. Final styles are committed, not left in a fill. No animation runtime to ship.',
    href: '/docs/api',
    cta: 'How it works',
  },
  {
    icon: 'cursor',
    title: 'Presence that owns lifetime',
    body: 'movePresence and movePresenceFor keep an element mounted until every leave animation has finished, including keyed lists that are reordered or revived mid-exit.',
    href: '/docs/guides/presence',
    cta: 'Presence guide',
  },
  {
    icon: 'server',
    title: 'Server-rendered first',
    body: 'Every directive is a no-op on the server and waits for the browser. Standalone, zoneless and hydration-friendly by default, from Angular 21 onwards.',
    href: '/docs/get-started',
    cta: 'Get started',
  },
  {
    icon: 'eye',
    title: 'Reduced motion, honoured',
    body: 'When the reader asks for less motion, state still changes and final styles still land — without the animation work. You do not have to wire it up.',
    href: '/docs/accessibility',
    cta: 'Accessibility',
  },
  {
    icon: 'sparkles',
    title: 'Springs and presets',
    body: 'A preset library for the common cases, physical springs for the rest, and plain keyframe objects whenever you need exact control.',
    href: '/docs/presets',
    cta: 'Browse presets',
  },
];

/**
 * "Why" as a card carousel: the track slides with `[moveAnimation]` and the active card is the
 * highlighted one. Focus moving into a card brings it into view, so the keyboard never gets lost
 * in the clipped overflow.
 */
@Component({
  selector: 'app-features',
  imports: [
    RouterLink,
    MoveAnimationDirective,
    MoveHoverDirective,
    MoveInViewDirective,
    MoveTextDirective,
    VoltNativeButton,
    LmnArrowLeftIcon,
    LmnArrowRightIcon,
    LmnBoltIcon,
    LmnCubeIcon,
    LmnCursorArrowRaysIcon,
    LmnEyeIcon,
    LmnServerIcon,
    LmnSparklesIcon,
  ],
  template: `
    <section class="mx-auto max-w-7xl overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
      <div class="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div class="max-w-2xl">
          <h2
            class="font-display text-text m-0 mb-4 text-3xl font-bold tracking-tight md:text-5xl"
            moveText="fade-up"
            moveTextSplit="words"
            [moveTextStagger]="45"
          >
            Built for state. Here's why.
          </h2>
          <p class="text-text-muted m-0 text-lg leading-relaxed" moveInView="fade-up">
            Angular already animates simple enter and leave. Movement exists for the part that is
            hard to coordinate by hand: motion that is driven by application state.
          </p>
        </div>
        <div class="flex gap-2" moveInView="fade-up">
          <button
            voltButton
            variant="outline"
            size="icon"
            type="button"
            aria-label="Previous reason"
            [disabled]="index() === 0"
            (click)="go(index() - 1)"
          >
            <lmn-arrow-left [size]="20" ariaLabel="" />
          </button>
          <button
            voltButton
            variant="outline"
            size="icon"
            type="button"
            aria-label="Next reason"
            [disabled]="index() === pillars.length - 1"
            (click)="go(index() + 1)"
          >
            <lmn-arrow-right [size]="20" ariaLabel="" />
          </button>
        </div>
      </div>

      <div class="feature-viewport" moveInView="fade-up">
        <ul
          #track
          class="feature-track m-0 list-none p-0"
          [moveAnimation]="{
            initial: { x: 0 },
            animate: { x: offset() },
            duration: 600,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          }"
        >
          @for (pillar of pillars; track pillar.title; let i = $index) {
            <li
              class="feature-card"
              [class.is-active]="i === index()"
              [moveWhileHover]="{ y: [0, -6] }"
              (focusin)="go(i)"
            >
              <div class="flex items-start justify-between gap-4">
                <h3 class="font-display m-0 text-2xl font-bold tracking-tight">
                  {{ pillar.title }}
                </h3>
                <span class="feature-icon" aria-hidden="true">
                  @switch (pillar.icon) {
                    @case ('bolt') {
                      <lmn-bolt [size]="32" ariaLabel="" />
                    }
                    @case ('cube') {
                      <lmn-cube [size]="32" ariaLabel="" />
                    }
                    @case ('cursor') {
                      <lmn-cursor-arrow-rays [size]="32" ariaLabel="" />
                    }
                    @case ('server') {
                      <lmn-server [size]="32" ariaLabel="" />
                    }
                    @case ('eye') {
                      <lmn-eye [size]="32" ariaLabel="" />
                    }
                    @default {
                      <lmn-sparkles [size]="32" [animate]="false" ariaLabel="" />
                    }
                  }
                </span>
              </div>
              <p class="feature-body m-0 leading-relaxed">{{ pillar.body }}</p>
              <a class="feature-link" [routerLink]="pillar.href">{{ pillar.cta }} →</a>
            </li>
          }
        </ul>
      </div>

      <p class="text-text-muted mt-8 text-sm" moveInView="fade-up">
        Not sure whether you need it?
        <a
          voltButton
          variant="link"
          class="text-accent h-auto text-left whitespace-normal"
          size="sm"
          routerLink="/docs/choose-a-tool"
          >Read when CSS or Angular's native animations are enough.</a
        >
      </p>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Features {
  readonly #isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  protected readonly pillars = PILLARS;
  protected readonly index = signal(0);
  protected readonly track = viewChild.required<ElementRef<HTMLElement>>('track');
  protected readonly offset = signal(0);

  protected go(next: number): void {
    const clamped = Math.max(0, Math.min(this.pillars.length - 1, next));
    this.index.set(clamped);
    if (!this.#isBrowser) return;
    // One card plus the gap, measured because the card width is responsive; never slide past the
    // point where the last card sits flush with the right edge.
    const track = this.track().nativeElement;
    const card = track.firstElementChild as HTMLElement | null;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const max = Math.max(0, track.scrollWidth - (track.parentElement?.clientWidth ?? 0));
    this.offset.set(-Math.min(clamped * ((card?.offsetWidth ?? 0) + gap), max));
  }
}
