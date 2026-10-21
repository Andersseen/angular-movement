import type { RouteMeta } from '@analogjs/router';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CodeBlock } from '../../shared/components/code-block/code-block';
import { PageHeader } from '../../shared/components/page-header/page-header';

interface ApiRow {
  api: string;
  behaviour: 'One-shot' | 'Context' | 'Reactive' | 'Imperative' | 'Value';
  jobs: string;
  stability: 'Stable' | 'Experimental';
  instead: string;
}

export const routeMeta: RouteMeta = { title: 'Choose an API — Angular Movement' };

@Component({
  selector: 'app-docs-api-selection',
  imports: [CodeBlock, PageHeader, RouterLink],
  template: `
    <article class="max-w-3xl">
      <app-page-header
        title="Choose an API"
        description="Several Movement APIs overlap on purpose. This page says which to pick, and which ones play once versus follow state."
      />

      <div class="docs-prose max-w-none">
        <h2>The one rule that prevents most bugs</h2>
        <p>
          <strong>One-shot</strong> directives describe a single entrance or exit. They play once
          and ignore later input changes. <strong>Reactive</strong> directives follow their inputs:
          change the bound value and the element animates. If an animation "does nothing" after a
          signal changes, you are probably using a one-shot API for a state change.
        </p>

        <div class="not-prose my-6 overflow-x-auto rounded-lg border">
          <table class="w-full min-w-[46rem] text-left text-sm">
            <caption class="sr-only">
              Movement APIs compared by behaviour, job and stability
            </caption>
            <thead class="bg-surface-raised text-text font-display">
              <tr>
                <th scope="col" class="px-4 py-3 font-semibold">API</th>
                <th scope="col" class="px-4 py-3 font-semibold">Behaviour</th>
                <th scope="col" class="px-4 py-3 font-semibold">Use it for</th>
                <th scope="col" class="px-4 py-3 font-semibold">Status</th>
                <th scope="col" class="px-4 py-3 font-semibold">Prefer it over</th>
              </tr>
            </thead>
            <tbody class="divide-border text-text-muted divide-y">
              @for (row of rows; track row.api) {
                <tr>
                  <th
                    scope="row"
                    class="text-text px-4 py-3 align-top font-mono text-xs font-medium"
                  >
                    {{ row.api }}
                  </th>
                  <td class="px-4 py-3 align-top">{{ row.behaviour }}</td>
                  <td class="px-4 py-3 align-top">{{ row.jobs }}</td>
                  <td class="px-4 py-3 align-top">{{ row.stability }}</td>
                  <td class="px-4 py-3 align-top">{{ row.instead }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <h2>Where the overlaps are</h2>
        <h3>move / moveAnimate vs moveAnimation</h3>
        <p>
          <code>[move]</code> / <code>moveAnimate</code> take a preset name or keyframe pairs and
          play <em>once</em>. <code>[moveAnimation]</code> takes single-value <code>initial</code>,
          <code>animate</code> and <code>exit</code> states and <em>follows</em>
          <code>animate</code> as it changes — it compares the state by value, so an object literal
          in the template does not replay on every change detection pass. Only properties present in
          both <code>initial</code> and <code>animate</code> are animated.
        </p>
        <app-code-block title="one-shot-vs-reactive.html" [code]="stateCode" />

        <h3>moveVariants vs moveAnimation</h3>
        <p>
          Use <code>moveVariants</code> when states have names, a subtree shares the active variant,
          or you want <code>staggerChildren</code> / <code>delayChildren</code>. Use
          <code>moveAnimation</code> for a single element with a computed target. On the same host,
          <code>moveVariants</code> takes over: set the state with <code>moveVariant</code> (or the
          permanent alias <code>moveActiveVariant</code>), not <code>moveAnimate</code>.
        </p>

        <h3>moveEnter / moveLeave vs presence</h3>
        <p>
          <code>moveLeave</code> alone cannot delay removal of an element that
          <code>&#64;if</code> destroys — the node is gone before the directive can run. Pair it
          with <code>*movePresence</code> (a view) or use <code>*movePresenceFor</code> (a keyed
          list, which also owns reorders and revival).
        </p>
        <app-code-block title="presence.html" [code]="presenceCode" />

        <h3>moveTarget / moveTrigger vs the rest</h3>
        <p>
          Both are <strong>experimental</strong>. <code>moveTarget</code> plays forward when a
          boolean is true and reverses when it becomes false. <code>moveTrigger</code> resets or
          exposes an imperative handle. For stable code prefer <code>moveVariants</code> (shared
          ancestor) or <code>MoveAnimator</code> (any element).
        </p>

        <h3>MoveAnimator vs moveValue / moveTransform / moveSpringValue</h3>
        <p>
          <code>MoveAnimator</code> runs finite animations on elements you hold references to (click
          handlers, services). <code>moveValue</code>, <code>moveTransform</code> and
          <code>moveSpringValue</code> are signals: the value is the source of truth and you bind it
          in the template, which suits continuous inputs like pointer position.
        </p>
        <app-code-block title="values.ts" [code]="valuesCode" />

        <h2>Rule of thumb</h2>
        <ol>
          <li>Plays once when created? <code>moveEnter</code> or <code>[move]</code>.</li>
          <li>Follows a signal on one element? <code>[moveAnimation]</code>.</li>
          <li>Named states shared by a subtree? <code>moveVariants</code>.</li>
          <li>
            Needs to stay mounted while leaving? <code>*movePresence</code> /
            <code>*movePresenceFor</code>.
          </li>
          <li>Driven by an event handler? <code>MoveAnimator</code>.</li>
          <li>Driven by a continuous number? <code>moveValue</code> and friends.</li>
        </ol>
        <p>
          Full inputs are in the <a routerLink="/docs/reference">API reference</a>; stability
          guarantees are summarised in the <a routerLink="/docs/api">API guide</a>.
        </p>
      </div>
    </article>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ApiSelection {
  protected readonly rows: ApiRow[] = [
    {
      api: 'move / moveAnimate',
      behaviour: 'One-shot',
      jobs: 'Preset or keyframe entrance',
      stability: 'Stable',
      instead: 'CSS when you need no coordination',
    },
    {
      api: 'moveAnimation',
      behaviour: 'Reactive',
      jobs: 'initial / animate / exit state objects; animate follows signals',
      stability: 'Stable',
      instead: 'moveAnimate for state changes',
    },
    {
      api: 'moveEnter / moveLeave',
      behaviour: 'One-shot',
      jobs: 'Explicit enter or exit effect',
      stability: 'Stable',
      instead: 'moveAnimate when only enter is needed',
    },
    {
      api: 'moveVariants',
      behaviour: 'Reactive',
      jobs: 'Named states, shared by a subtree, stagger children',
      stability: 'Stable',
      instead: 'moveAnimation for many named states',
    },
    {
      api: 'moveStagger',
      behaviour: 'Context',
      jobs: 'DOM-order delays for siblings',
      stability: 'Stable',
      instead: 'Hand-written delays',
    },
    {
      api: 'movePresence / movePresenceFor',
      behaviour: 'Reactive',
      jobs: 'Keep views mounted until leave animations finish',
      stability: 'Stable',
      instead: 'Plain @if / @for for animated removal',
    },
    {
      api: 'moveTarget / moveTrigger',
      behaviour: 'Reactive',
      jobs: 'Boolean forward/reverse; imperative handle',
      stability: 'Experimental',
      instead: 'moveVariants or MoveAnimator',
    },
    {
      api: 'MoveAnimator',
      behaviour: 'Imperative',
      jobs: 'Animate by element reference from code',
      stability: 'Stable',
      instead: 'Raw element.animate()',
    },
    {
      api: 'moveValue / moveTransform / moveSpringValue',
      behaviour: 'Value',
      jobs: 'Signals that derive continuous motion',
      stability: 'Stable',
      instead: 'Manual requestAnimationFrame loops',
    },
  ];

  protected readonly stateCode = `<!-- One-shot: plays when the element is created, ignores 'open' afterwards -->
<div moveAnimate="fade-up">Card</div>

<!-- Reactive: animates to the new target whenever 'open()' changes -->
<div
  [moveAnimation]="{
    initial: { opacity: 0.6, scale: 0.98 },
    animate: open() ? { opacity: 1, scale: 1 } : { opacity: 0.6, scale: 0.98 }
  }"
>
  Card
</div>`;

  protected readonly presenceCode = `<!-- Wrong: the node is removed before moveLeave can run -->
@if (open()) {
  <aside moveLeave="fade-down">Panel</aside>
}

<!-- Right: presence keeps the view until the leave animation finishes -->
<ng-container *movePresence="open()">
  <aside moveEnter="fade-up" moveLeave="fade-down">Panel</aside>
</ng-container>`;

  protected readonly valuesCode = `import { moveValue, moveTransform } from 'angular-movement';

const progress = moveValue(0); // WritableSignal<number>
const opacity = moveTransform(progress, [0, 1], [0.4, 1]); // Signal<number>`;
}
