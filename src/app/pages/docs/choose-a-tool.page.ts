import type { RouteMeta } from '@analogjs/router';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CodeBlock } from '../../shared/components/code-block/code-block';
import { PageHeader } from '../../shared/components/page-header/page-header';

export const routeMeta: RouteMeta = { title: 'Choose the right tool — Angular Movement' };

@Component({
  selector: 'app-docs-choose-a-tool',
  imports: [CodeBlock, PageHeader, RouterLink],
  template: `
    <article class="max-w-3xl">
      <app-page-header
        title="Choose the right tool"
        description="CSS, Angular's native animate.enter / animate.leave, Angular Movement and raw WAAPI all have a place. Use the simplest one that does the job."
      />

      <div class="docs-prose max-w-none">
        <h2>Quick decision guide</h2>
        <div class="not-prose my-6 overflow-x-auto rounded-lg border">
          <table class="w-full min-w-[34rem] text-left text-sm">
            <caption class="sr-only">
              Which tool fits which kind of animation
            </caption>
            <thead class="bg-surface-raised text-text font-display">
              <tr>
                <th scope="col" class="px-4 py-3 font-semibold">You need…</th>
                <th scope="col" class="px-4 py-3 font-semibold">Reach for</th>
              </tr>
            </thead>
            <tbody class="divide-border text-text-muted divide-y">
              @for (row of rows; track row.need) {
                <tr>
                  <th scope="row" class="text-text px-4 py-3 font-medium">{{ row.need }}</th>
                  <td class="px-4 py-3">{{ row.tool }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <h2>CSS transitions and keyframes</h2>
        <p>
          If the motion is a function of a class or pseudo-class — a hover colour, a focus ring, a
          loading spinner, a menu that slides when a class is toggled — write CSS. It costs no
          JavaScript, works before hydration and is the easiest thing to maintain. Movement does not
          try to replace this, and you can mix both freely.
        </p>
        <app-code-block title="button.css" [code]="cssCode" />

        <h2>Angular's native animate.enter and animate.leave</h2>
        <p>
          Since Angular 20.2 the framework can apply CSS classes while a node enters and leaves the
          DOM, and <code>&#64;angular/animations</code> is deprecated in favour of it. For many apps
          this covers the common case: each element has its own self-contained enter or leave effect
          described in CSS. It needs no extra dependency, and you should prefer it when that is all
          you need.
        </p>
        <app-code-block title="panel.html" [code]="nativeCode" />
        <p>
          What it does not give you is coordination: no built-in way to hold a parent until all
          children have finished leaving, to reverse a keyed list item that is re-added while it is
          exiting, to stagger by DOM order or to animate between two states of one element when a
          signal changes.
        </p>

        <h2>Angular Movement</h2>
        <p>Movement earns its place when motion is driven by state and must be coordinated:</p>
        <ul>
          <li>
            <strong>State to state</strong> — <code>moveVariants</code>,
            <code>[moveAnimation]</code> animate to a new target whenever a signal changes.
          </li>
          <li>
            <strong>Presence</strong> — <code>*movePresence</code> and
            <code>*movePresenceFor</code> keep a view (or each keyed row) mounted until every leave
            animation finishes, including nested children and revival mid-exit.
          </li>
          <li>
            <strong>Orchestration</strong> — <code>moveStagger</code> and variant
            <code>staggerChildren</code> for DOM-order delays.
          </li>
          <li>
            <strong>Interaction feedback</strong> — <code>moveWhileHover</code>,
            <code>moveWhileTap</code>, <code>moveWhileFocus</code> with proper touch semantics.
          </li>
          <li>
            <strong>Scroll, springs, SVG and signals</strong> — <code>moveScroll</code>,
            <code>moveSpringValue</code>, <code>movePathDraw</code>, <code>moveTransform</code>.
          </li>
          <li>
            <strong>Imperative sequences</strong> — <code>MoveAnimator</code> with automatic
            reduced-motion handling and SSR no-ops.
          </li>
        </ul>
        <app-code-block title="card.html" [code]="movementCode" />

        <h2>Raw WAAPI</h2>
        <p>
          <code>element.animate()</code> is fine for one isolated effect. You then own reduced
          motion, cancellation, committing final styles, and server-side no-ops. Movement's engines
          and <code>MoveAnimator</code> are thin wrappers that do these things consistently.
        </p>

        <h2>Honest trade-offs</h2>
        <ul>
          <li>
            Movement plays on the Web Animations API, which is hydration-dependent: anything it
            animates in from a hidden state needs the app to have started. For above-the-fold
            entrances that must paint immediately, prefer CSS. See
            <a routerLink="/docs/accessibility">Accessibility &amp; troubleshooting</a>.
          </li>
          <li>
            It is an additional dependency (a small, tree-shakeable one). If CSS or native enter and
            leave cover your needs, you do not need it.
          </li>
          <li>
            Layout, drag and smooth-scroll APIs are still <strong>experimental</strong>. Prefer
            native scrolling.
          </li>
        </ul>

        <p>
          Next: <a routerLink="/docs/api-selection">choose an API</a> inside Movement, or
          <a routerLink="/docs/migration">migrate from &#64;angular/animations</a>.
        </p>
      </div>
    </article>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ChooseATool {
  protected readonly rows = [
    { need: 'Hover colour, focus ring, spinner', tool: 'CSS transitions / keyframes' },
    {
      need: 'One element fades or slides when it enters or leaves',
      tool: 'animate.enter / animate.leave (or moveEnter / moveLeave)',
    },
    {
      need: 'A panel that must finish leaving before its parent is removed',
      tool: 'Movement: *movePresence',
    },
    {
      need: 'A list where rows are added, removed and reordered',
      tool: 'Movement: *movePresenceFor',
    },
    {
      need: 'A card that changes between idle / selected / error states',
      tool: 'Movement: moveVariants or moveAnimation',
    },
    { need: 'Staggered reveal of siblings', tool: 'Movement: moveStagger' },
    {
      need: 'Progress bound to scroll position',
      tool: 'Movement: moveScroll (or CSS scroll-timeline where supported)',
    },
    { need: 'A single custom effect, nothing reused', tool: 'Raw WAAPI' },
  ];

  protected readonly cssCode = `.button {
  transition: background-color 150ms ease, transform 150ms ease;
}
.button:hover {
  background-color: var(--accent-strong);
}
@media (prefers-reduced-motion: reduce) {
  .button { transition: none; }
}`;

  protected readonly nativeCode = `<!-- Angular 20.2+: Angular adds the class on enter and waits for the
     animation to finish before removing the node on leave. -->
@if (open()) {
  <section animate.enter="panel-enter" animate.leave="panel-leave">
    Details
  </section>
}`;

  protected readonly movementCode = `<ul>
  <li
    *movePresenceFor="let item of items(); trackBy: byId"
    move="fade-up"
    [moveWhileHover]="{ y: [0, -2] }"
  >
    {{ item.label }}
  </li>
</ul>`;
}
