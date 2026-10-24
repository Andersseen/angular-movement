import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MoveInViewDirective, MoveStaggerDirective } from 'movement';
import {
  VoltCard,
  VoltCardContent,
  VoltCardDescription,
  VoltCardHeader,
  VoltCardTitle,
  VoltNativeButton,
} from '@voltui/components';
import { LmnBoltIcon } from 'lumen-icons/bolt';
import { LmnCubeIcon } from 'lumen-icons/cube';
import { LmnCursorArrowRaysIcon } from 'lumen-icons/cursor-arrow-rays';

@Component({
  selector: 'app-features',
  imports: [
    RouterLink,
    MoveInViewDirective,
    MoveStaggerDirective,
    VoltCard,
    VoltCardHeader,
    VoltCardTitle,
    VoltCardDescription,
    VoltCardContent,
    VoltNativeButton,
    LmnBoltIcon,
    LmnCubeIcon,
    LmnCursorArrowRaysIcon,
  ],
  template: `
    <section class="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div class="mb-12 max-w-2xl" moveInView="fade-up">
        <h2 class="font-display text-text mb-4 text-3xl font-bold tracking-tight md:text-4xl">
          Why Angular Movement
        </h2>
        <p class="text-text-muted text-lg leading-relaxed">
          Angular already animates simple enter and leave. Movement exists for the part that is hard
          to coordinate by hand: motion that is driven by application state.
        </p>
      </div>

      <div moveStagger moveStaggerStep="100ms" class="grid grid-cols-1 gap-6 md:grid-cols-3">
        @for (item of pillars; track item.title) {
          <volt-card moveInView="fade-up" class="landing-card h-full">
            <volt-card-header>
              <span
                class="bg-accent/10 text-accent mb-3 flex h-11 w-11 items-center justify-center rounded-xl"
              >
                @switch (item.icon) {
                  @case ('bolt') {
                    <lmn-bolt [size]="24" ariaLabel="" />
                  }
                  @case ('cube') {
                    <lmn-cube [size]="24" ariaLabel="" />
                  }
                  @default {
                    <lmn-cursor-arrow-rays [size]="24" ariaLabel="" />
                  }
                }
              </span>
              <volt-card-title>{{ item.title }}</volt-card-title>
              <volt-card-description>{{ item.body }}</volt-card-description>
            </volt-card-header>
            <volt-card-content>
              <a voltButton variant="link" class="text-accent" size="sm" [routerLink]="item.href"
                >{{ item.cta }} →</a
              >
            </volt-card-content>
          </volt-card>
        }
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
  protected readonly pillars = [
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
      body: 'Playback runs on the Web Animations API, so transforms and opacity stay on the compositor where the browser allows it. Final styles are committed, not left in a fill. No animation runtime to ship.',
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
  ];
}
