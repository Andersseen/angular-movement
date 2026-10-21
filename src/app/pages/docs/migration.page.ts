import type { RouteMeta } from '@analogjs/router';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CodeBlock } from '../../shared/components/code-block/code-block';
import { PageHeader } from '../../shared/components/page-header/page-header';

export const routeMeta: RouteMeta = { title: 'Migrate from legacy animations — Angular Movement' };

@Component({
  selector: 'app-docs-migration',
  imports: [CodeBlock, PageHeader, RouterLink],
  template: `
    <article class="max-w-3xl">
      <app-page-header
        title="Migrate from legacy animations"
        description="Assess an existing app, then migrate trigger by trigger. Some triggers convert cleanly, some need design decisions, and some should stay in CSS."
      />

      <div class="docs-prose max-w-none">
        <p>
          <code>&#64;angular/animations</code> is deprecated in favour of native CSS with
          <code>animate.enter</code> / <code>animate.leave</code>. Migrating does not have to mean
          moving to Movement: for many triggers the right answer is plain CSS. This page helps you
          decide per trigger, and shows reviewed recipes for the ones that benefit from Movement.
        </p>

        <h2>1. Assess first (read-only)</h2>
        <p>
          The repository includes an assessment tool, <code>movement-migrate</code>. It parses your
          TypeScript with the compiler API and your templates with Angular's template parser — no
          regular expressions over source — and classifies every trigger. It
          <strong>never writes files</strong>. In 1.3 it ships in the
          <a
            href="https://github.com/Andersseen/angular-movement/tree/main/projects/movement-migrate"
            >repository</a
          >
          and is not published to npm yet.
        </p>
        <app-code-block title="terminal.sh" [code]="assessCode" />

        <div class="not-prose my-6 overflow-x-auto rounded-lg border">
          <table class="w-full min-w-[34rem] text-left text-sm">
            <caption class="sr-only">
              What each classification means
            </caption>
            <thead class="bg-surface-raised text-text font-display">
              <tr>
                <th scope="col" class="px-4 py-3 font-semibold">Class</th>
                <th scope="col" class="px-4 py-3 font-semibold">Meaning</th>
              </tr>
            </thead>
            <tbody class="divide-border text-text-muted divide-y">
              @for (row of classes; track row.name) {
                <tr>
                  <th scope="row" class="text-text px-4 py-3 align-top font-medium">
                    {{ row.name }}
                  </th>
                  <td class="px-4 py-3">{{ row.meaning }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <p>
          <strong>Automatic candidate</strong> means "eligible for a mechanical conversion", not
          "converted": the tool only prints a suggested template. A trigger is a candidate only when
          it is a static <code>:enter</code> tween on <code>opacity</code>/<code>transform</code>
          with literal timing, no parameters, no callbacks, and the same properties on both sides.
          Anything else is reported with the reason it was not. Providers
          (<code>provideAnimations</code>…) are always reported as manual: keep them until no
          trigger binding remains.
        </p>

        <h2>2. Recipes</h2>

        <h3>Simple enter</h3>
        <app-code-block title="before.ts" [code]="enterBefore" />
        <app-code-block title="after.html" [code]="enterAfter" />
        <p>
          Native alternative: a CSS class with <code>&#64;starting-style</code> or
          <code>animate.enter</code>. Pick Movement if you also want the shared timing config,
          automatic reduced-motion handling or later state changes on the same element.
        </p>

        <h3>Leave animations and &#64;if ownership</h3>
        <p>
          The legacy <code>:leave</code> worked because Angular delayed removal. A directive cannot
          do that: <code>&#64;if</code> destroys the view first. Use presence to own the lifetime.
        </p>
        <app-code-block title="leave.html" [code]="leaveAfter" />

        <h3>Keyed lists and &#64;for track identity</h3>
        <p>
          Exit animations on lists depend on stable identity. Track by a stable id (never by index)
          and use <code>*movePresenceFor</code> when removed rows must finish leaving, or when a row
          can come back while it is leaving.
        </p>
        <app-code-block title="list.html" [code]="listAfter" />

        <h3>State-driven transitions</h3>
        <p>
          <code>state()</code> plus <code>transition('a &lt;=&gt; b')</code> maps to named variants.
          Map each state by hand and bind <code>moveVariant</code>.
        </p>
        <app-code-block title="state.html" [code]="stateAfter" />

        <h3>Interaction feedback</h3>
        <p>
          Hover/press effects implemented with triggers and <code>(mouseenter)</code> handlers
          become <code>moveWhileHover</code> / <code>moveWhileTap</code>; if it is only a colour or
          shadow change, CSS <code>:hover</code> is simpler.
        </p>

        <h3>Reduced motion</h3>
        <p>
          Movement honours <code>prefers-reduced-motion</code> automatically and resolves final
          styles immediately. Legacy triggers did not, so migrating usually
          <em>improves</em> accessibility; verify the end state is still correct with motion off.
        </p>

        <h3>SSR and first paint</h3>
        <p>
          Server-rendered HTML is shown before any animation starts. Do not hide above-the-fold
          content until hydration. For critical first-paint effects use CSS; use Movement for
          animations that begin after the app is interactive.
        </p>

        <h3>Keep these in CSS or native Angular</h3>
        <ul>
          <li>
            Height/width/colour tweens (use CSS transitions, <code>interpolate-size</code> or
            grid-row tricks).
          </li>
          <li>
            Route transitions with <code>query()</code>: consider the Router's View Transitions
            support first.
          </li>
          <li>
            Any trigger relying on <code>params</code>, <code>animateChild</code> or callbacks you
            cannot drop.
          </li>
        </ul>

        <h2>What cannot be converted safely</h2>
        <ul>
          <li>
            <code>(&#64;trigger.done)</code> / <code>.start</code> callbacks: moveEnter has no
            equivalent output.
          </li>
          <li>
            <code>query()</code> / <code>stagger()</code> / <code>group()</code> /
            <code>sequence()</code> timelines.
          </li>
          <li>Parameterised triggers and values computed at runtime.</li>
          <li><code>AnimationBuilder</code> code (port to <code>MoveAnimator</code> manually).</li>
        </ul>

        <p>
          Not sure which API to use afterwards? See
          <a routerLink="/docs/api-selection">Choose an API</a>.
        </p>
      </div>
    </article>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Migration {
  protected readonly classes = [
    {
      name: 'Automatic candidate',
      meaning:
        'Matches a strict literal shape; a suggested replacement is printed. Review before applying.',
    },
    {
      name: 'Partial',
      meaning:
        'Part of the trigger maps cleanly; the rest (leave ownership, callbacks, states) needs a decision.',
    },
    { name: 'Manual', meaning: 'Dynamic, parameterised, query-based or unresolved. Port by hand.' },
    {
      name: 'Keep native / CSS',
      meaning:
        'Animates layout or paint properties that CSS or animate.enter / animate.leave handle better.',
    },
  ];

  protected readonly assessCode = `# from a clone of the angular-movement repository
pnpm install
pnpm migrate:build
pnpm migrate:assess ../my-app/src          # human-readable report
pnpm migrate:assess ../my-app/src --json   # machine-readable`;

  protected readonly enterBefore = `// legacy
@Component({
  template: '<li @fadeUp>…</li>',
  animations: [
    trigger('fadeUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class Row {}`;

  protected readonly enterAfter = `<!-- Movement: import MoveEnterDirective in the component -->
<li moveEnter="fade-up" moveDuration="300ms" moveEasing="ease-out">…</li>

<!-- or, to match the legacy values exactly -->
<li [moveEnter]="{ opacity: [0, 1], y: [20, 0] }" moveDuration="300ms" moveEasing="ease-out">…</li>`;

  protected readonly leaveAfter = `<ng-container *movePresence="open()">
  <aside moveEnter="fade-left" moveLeave="fade-right">Settings</aside>
</ng-container>`;

  protected readonly listAfter = `<ul>
  <li
    *movePresenceFor="let row of rows(); trackBy: byId"
    moveEnter="fade-up"
    moveLeave="fade-down"
  >
    {{ row.name }}
  </li>
</ul>

<!-- Plain @for is still right when rows never need an exit animation: -->
@for (row of rows(); track row.id) { <li>{{ row.name }}</li> }`;

  protected readonly stateAfter = `<div
  [moveVariants]="{
    closed: { opacity: 0, y: 8 },
    open: { opacity: 1, y: 0 }
  }"
  [moveVariant]="isOpen() ? 'open' : 'closed'"
  moveDuration="200ms"
>
  Panel
</div>`;
}
