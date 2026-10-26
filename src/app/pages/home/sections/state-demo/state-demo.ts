import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MoveInViewDirective } from 'movement';
import {
  VoltAccordion,
  VoltAccordionContent,
  VoltAccordionItem,
  VoltAccordionTrigger,
  VoltCard,
  VoltCardContent,
  VoltNativeButton,
} from '@voltui/components';
import { LmnArrowRightIcon } from 'lumen-icons/arrow-right';
import { CodeBlock } from '../../../../shared/components/code-block/code-block';
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

const POINTS: readonly string[] = [
  'Rows enter, leave and reorder without index bookkeeping.',
  'Completing a task animates to a new state; nothing is recreated.',
  'Details stay mounted until their leave animation has finished.',
];

/** The first thing below the hero: a real, interactive list built only from stable APIs. */
@Component({
  selector: 'app-state-demo',
  imports: [
    RouterLink,
    MoveInViewDirective,
    CodeBlock,
    Showcase,
    VoltCard,
    VoltCardContent,
    VoltNativeButton,
    VoltAccordion,
    VoltAccordionItem,
    VoltAccordionTrigger,
    VoltAccordionContent,
    LmnArrowRightIcon,
  ],
  template: `
    <section id="state-demo" class="scroll-mt-20">
      <div
        class="mx-auto grid max-w-7xl items-center gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:px-8"
      >
        <div class="min-w-0" moveInView="fade-up">
          <p class="home-kicker">STATE <span>→</span> MOTION</p>
          <h2 class="font-display text-text mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            Change the data. The interface follows.
          </h2>
          <p class="text-text-muted mb-6 text-lg leading-relaxed">
            Add, complete, expand and remove tasks. Every transition comes from a signal changing,
            not from imperative animation code.
          </p>
          <ul class="text-text-muted m-0 mb-8 list-none space-y-3 p-0">
            @for (point of points; track point) {
              <li class="flex gap-3">
                <span class="bg-accent mt-2 h-1.5 w-1.5 shrink-0 rounded-full"></span>
                <span>{{ point }}</span>
              </li>
            }
          </ul>
          <a voltButton variant="outline" routerLink="/demos/presence-list">
            Open in the motion lab
            <lmn-arrow-right [size]="14" ariaLabel="" />
          </a>
        </div>

        <!-- Interactive showcase: mounted after idle so the initial render/hydration stays cheap -->
        <div class="min-w-0" moveInView="fade-up">
          <volt-card class="landing-card home-showcase">
            <volt-card-content class="p-5 sm:p-6" role="group" aria-label="Interactive example">
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
export class StateDemo {
  protected readonly source = SHOWCASE_SOURCE;
  protected readonly points = POINTS;
}
