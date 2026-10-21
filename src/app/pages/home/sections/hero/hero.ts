import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { InstallCommand } from '../../../../shared/components/install-command/install-command';
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

@Component({
  selector: 'app-hero',
  imports: [RouterLink, InstallCommand, CodeBlock, Showcase],
  template: `
    <section class="relative overflow-hidden pt-28 pb-20 lg:pt-36">
      <div
        class="pointer-events-none absolute inset-0 z-0 opacity-20"
        style="background: radial-gradient(ellipse at 20% 0%, var(--color-accent) 0%, transparent 55%);"
        aria-hidden="true"
      ></div>

      <div
        class="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:px-8"
      >
        <div class="min-w-0">
          <p class="text-accent mb-4 font-mono text-sm font-semibold tracking-wide">
            Angular Movement · v1.x
          </p>
          <h1
            class="font-display text-text mb-6 text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-5xl lg:text-6xl"
          >
            Motion for Angular that follows your
            <span class="text-accent">state</span>.
          </h1>
          <p class="text-text-muted mb-8 max-w-xl text-lg leading-relaxed">
            Declarative directives on top of the Web Animations API. Start with one attribute; reach
            for presence, variants, scroll, springs and signals when the interface needs coordinated
            motion. Built for standalone, zoneless and SSR Angular.
          </p>

          <div class="mb-8 flex flex-col gap-3 sm:flex-row">
            <a
              routerLink="/docs/get-started"
              class="bg-accent-solid focus-visible:outline-accent inline-flex min-h-12 items-center justify-center rounded-xl px-7 text-base font-semibold text-white transition-colors hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Get started
            </a>
            <a
              routerLink="/demos"
              class="text-text border-border bg-surface hover:bg-surface-raised focus-visible:outline-accent inline-flex min-h-12 items-center justify-center rounded-xl border px-7 text-base font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Explore demos
            </a>
          </div>

          <div class="max-w-md">
            <app-install-command [interactiveScale]="false" />
          </div>
        </div>

        <!-- Interactive showcase: mounted after idle so the initial render/hydration stays cheap -->
        <div class="min-w-0">
          <div
            class="bg-surface border-border rounded-2xl border p-5 shadow-lg sm:p-6"
            role="group"
            aria-label="Interactive example"
          >
            @defer (on idle) {
              <app-showcase />
            } @placeholder {
              <div class="min-h-[22rem]" data-testid="showcase-placeholder">
                <h3 class="font-display text-text m-0 text-base font-semibold">Today</h3>
                <p class="text-text-muted mt-3 text-sm">
                  An interactive task list: add, complete, expand and remove tasks.
                </p>
              </div>
            }
            <p class="text-text-subtle mt-4 mb-0 text-xs">
              Built only from stable APIs:
              <code>*movePresenceFor</code>, <code>*movePresence</code>,
              <code>[moveAnimation]</code>, <code>moveWhileHover</code>, <code>moveWhileTap</code>.
              Honours <code>prefers-reduced-motion</code>.
            </p>
          </div>

          <details class="mt-4">
            <summary
              class="text-accent focus-visible:outline-accent cursor-pointer rounded text-sm font-semibold focus-visible:outline-2"
            >
              Show the code
            </summary>
            <div class="mt-3 max-h-96">
              <app-code-block title="tasks.component.ts" [code]="source" />
            </div>
          </details>
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Hero {
  protected readonly source = SHOWCASE_SOURCE;
}
