import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MoveScrollDirective } from 'movement';
import { VoltNativeButton } from '@voltui/components';
import { LmnArrowRightIcon } from 'lumen-icons/arrow-right';
import { InstallCommand } from '../../../../shared/components/install-command/install-command';
import { SITE } from '../../../../shared/site';
import { MOVEMENT_VERSION_LABEL } from '../../../../shared/version';
import { HeroFlow } from './hero-flow';

interface HeroStat {
  readonly value: string;
  readonly label: string;
}

const STATS: readonly HeroStat[] = [
  { value: '0', label: 'runtime deps' },
  { value: 'WAAPI', label: 'native engine' },
  { value: 'SSR', label: 'zoneless ready' },
];

/**
 * Full-viewport hero: centred copy over the depth-of-field particle sphere. The copy fades
 * and lifts as the page scrolls, driven by the library's own `moveScroll` (a stable API).
 */
@Component({
  selector: 'app-hero',
  imports: [
    RouterLink,
    MoveScrollDirective,
    HeroFlow,
    InstallCommand,
    VoltNativeButton,
    LmnArrowRightIcon,
  ],
  template: `
    <section class="home-hero relative isolate flex min-h-[100svh] flex-col overflow-hidden">
      <div class="hero-glow pointer-events-none absolute inset-0 -z-10" aria-hidden="true"></div>
      <div
        class="hero-flow-fallback pointer-events-none absolute inset-0 z-0"
        aria-hidden="true"
      ></div>
      @defer (on idle) {
        <app-hero-flow />
      }

      <div class="relative z-10 flex flex-1 items-center pt-24 pb-24">
        <div
          class="mx-auto flex w-full max-w-5xl flex-col items-center px-4 text-center sm:px-6"
          [moveScroll]="{ opacity: [1, 0], y: [0, -80] }"
          [moveScrollOffset]="['0 0', '1 0']"
        >
          <a class="hero-pill landing-rise mb-6" style="--i: 0" routerLink="/docs/get-started">
            <span class="hero-pill-dot" aria-hidden="true"></span>
            {{ version ? version + ' source · ' : '' }}Angular 21 and 22
            <lmn-arrow-right [size]="12" ariaLabel="" />
          </a>

          <h1
            class="landing-rise font-display text-text mb-6 text-[2.6rem] leading-[1.02] font-extrabold tracking-tight text-balance sm:text-6xl lg:text-[4.6rem]"
            style="--i: 1"
          >
            Motion for Angular that follows your
            <span class="landing-sheen">state</span>.
          </h1>

          <p
            class="landing-rise text-text-muted mb-8 max-w-2xl text-base leading-relaxed sm:text-lg md:text-xl"
            style="--i: 2"
          >
            Start with one attribute. Coordinate enter, exit and state changes when your interface
            needs more. Native browser animations and Angular signals, with zero runtime
            dependencies.
          </p>

          <div
            class="landing-rise mb-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row"
            style="--i: 3"
          >
            <a voltButton size="lg" routerLink="/docs/get-started">
              Get started
              <lmn-arrow-right [size]="16" ariaLabel="" />
            </a>
            <a voltButton variant="outline" size="lg" class="hero-ghost" routerLink="/demos"
              >Explore demos</a
            >
          </div>

          <div class="landing-rise w-full max-w-md text-left" style="--i: 4">
            <app-install-command [interactiveScale]="false" />
          </div>

          <dl class="landing-rise hero-stats mt-10" style="--i: 5">
            @for (stat of stats; track stat.label) {
              <div>
                <dt>{{ stat.label }}</dt>
                <dd>{{ stat.value }}</dd>
              </div>
            }
          </dl>

          <p
            class="landing-rise text-text-muted mt-4 mb-0 flex flex-wrap items-center justify-center gap-x-2 text-sm"
            style="--i: 6"
          >
            <a
              voltButton
              variant="link"
              class="text-accent"
              size="sm"
              [href]="github"
              rel="noopener noreferrer"
              >GitHub</a
            >
            <a
              voltButton
              variant="link"
              class="text-accent"
              size="sm"
              [href]="npm"
              rel="noopener noreferrer"
              >npm</a
            >
            <span>MIT licensed</span>
          </p>
        </div>
      </div>

      <a href="#state-demo" class="hero-scroll-cue" aria-label="Scroll to the live example">
        <span class="hero-scroll-wheel" aria-hidden="true"></span>
      </a>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Hero {
  protected readonly stats = STATS;
  protected readonly github = SITE.github;
  protected readonly npm = SITE.npm;
  protected readonly version = MOVEMENT_VERSION_LABEL;
}
