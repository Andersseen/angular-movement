import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  VoltAccordion,
  VoltAccordionContent,
  VoltAccordionItem,
  VoltAccordionTrigger,
  VoltBadge,
  VoltCard,
  VoltCardContent,
  VoltNativeButton,
} from '@voltui/components';
import { LmnArrowRightIcon } from 'lumen-icons/arrow-right';
import { LmnSparklesIcon } from 'lumen-icons/sparkles';
import { InstallCommand } from '../../../../shared/components/install-command/install-command';
import { CodeBlock } from '../../../../shared/components/code-block/code-block';
import { SITE } from '../../../../shared/site';
import { MOVEMENT_VERSION_LABEL } from '../../../../shared/version';
import { HeroFlow } from './hero-flow';
import { Showcase } from '../showcase/showcase';

const SHOWCASE_SOURCE = `import { Component, signal } from '@angular/core';
import {
  MoveAnimationDirective,
  MoveEnterDirective,
  MoveLeaveDirective,
  MoveHoverDirective,
  MovePresenceDirective,
  MovePresenceForDirective,
} from 'angular-movement';

@Component({
  selector: 'app-tasks',
  imports: [
    MovePresenceForDirective,
    MovePresenceDirective,
    MoveAnimationDirective,
    MoveEnterDirective,
    MoveLeaveDirective,
    MoveHoverDirective,
  ],
  template: \`
    <ul>
      <li
        *movePresenceFor="let task of tasks(); trackBy: byId"
        [moveWhileHover]="{ y: [0, -2] }"
      >
        <div
          [moveAnimation]="{
            initial: { scale: 1 },
            animate: { scale: task.done ? 0.985 : 1 },
            duration: 200
          }"
        >
          {{ task.title }}
        </div>

        <ng-container *movePresence="task.open">
          <p moveEnter="fade-down" moveLeave="fade-up">Details</p>
        </ng-container>
      </li>
    </ul>
  \`,
})
export class Tasks {
  tasks = signal([{ id: 1, title: 'Review PR', done: false, open: false }]);
  byId = (_: number, task: { id: number }) => task.id;
}`;

@Component({
  selector: 'app-hero',
  imports: [
    RouterLink,
    HeroFlow,
    InstallCommand,
    CodeBlock,
    Showcase,
    VoltBadge,
    VoltCard,
    VoltCardContent,
    VoltNativeButton,
    VoltAccordion,
    VoltAccordionItem,
    VoltAccordionTrigger,
    VoltAccordionContent,
    LmnArrowRightIcon,
    LmnSparklesIcon,
  ],
  template: `
    <section class="home-hero relative overflow-hidden pt-16 pb-16 lg:pt-24 lg:pb-20">
      <div
        class="hero-flow-fallback pointer-events-none absolute inset-0 z-0"
        aria-hidden="true"
      ></div>
      @defer (on idle) {
        <app-hero-flow />
      }

      <div
        class="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:px-8"
      >
        <div class="min-w-0">
          <p class="home-kicker">ANGULAR NATIVE <span>/</span> BROWSER POWERED</p>
          <volt-badge variant="secondary" class="landing-rise mb-6 gap-2" style="--i: 0">
            <lmn-sparkles [size]="14" [animate]="false" ariaLabel="New" />
            {{ version ? version + ' source · ' : '' }}Angular 21 and 22
          </volt-badge>
          <h1
            class="landing-rise font-display text-text mb-6 text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl"
            style="--i: 1"
          >
            Motion for Angular that follows your
            <span class="landing-sheen">state</span>.
          </h1>
          <p
            class="landing-rise text-text-muted mb-8 max-w-xl text-lg leading-relaxed"
            style="--i: 2"
          >
            Start with one attribute. Coordinate enter, exit and state changes when your interface
            needs more. Native browser animations, Angular signals, with zero runtime dependencies.
            Built for standalone, zoneless and server-rendered Angular.
          </p>

          <div class="landing-rise mb-8 flex flex-col gap-3 sm:flex-row" style="--i: 3">
            <a voltButton size="lg" routerLink="/docs/get-started">
              Get started
              <lmn-arrow-right [size]="16" ariaLabel="" />
            </a>
            <a voltButton variant="outline" size="lg" routerLink="/demos">Explore demos</a>
          </div>

          <div class="landing-rise max-w-md" style="--i: 4">
            <app-install-command [interactiveScale]="false" />
          </div>

          <p
            class="landing-rise text-text-muted mt-5 mb-0 flex flex-wrap items-center gap-x-2 text-sm"
            style="--i: 5"
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

        <!-- Interactive showcase: mounted after idle so the initial render/hydration stays cheap -->
        <div class="landing-rise min-w-0" style="--i: 3">
          <volt-card class="landing-card home-showcase">
            <volt-card-content class="p-5 sm:p-6" role="group" aria-label="Interactive example">
              <div class="home-showcase-heading">
                <span>STATE → MOTION</span
                ><a routerLink="/demos/presence-list">Open in the motion lab ↗</a>
              </div>
              @defer (on idle) {
                <app-showcase />
              } @placeholder {
                <div class="min-h-[22rem]" data-testid="showcase-placeholder">
                  <p class="font-display text-text m-0 text-base font-semibold">Today</p>
                  <p class="text-text-muted mt-3 text-sm">
                    An interactive task list: add, complete, expand and remove tasks.
                  </p>
                </div>
              }
              <p class="text-text-subtle mt-4 mb-0 text-xs">
                Built only from stable APIs: <code>*movePresenceFor</code>,
                <code>*movePresence</code>, <code>[moveAnimation]</code>,
                <code>moveWhileHover</code>. Honours <code>prefers-reduced-motion</code>.
              </p>
            </volt-card-content>
          </volt-card>

          <volt-accordion type="single" [collapsible]="true" class="mt-3">
            <volt-accordion-item value="code">
              <volt-accordion-trigger>Show the code</volt-accordion-trigger>
              <volt-accordion-content class="grid">
                <div class="max-h-96">
                  <app-code-block title="tasks.component.ts" [code]="source" />
                </div>
              </volt-accordion-content>
            </volt-accordion-item>
          </volt-accordion>
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Hero {
  protected readonly source = SHOWCASE_SOURCE;
  protected readonly github = SITE.github;
  protected readonly npm = SITE.npm;
  protected readonly version = MOVEMENT_VERSION_LABEL;
}
