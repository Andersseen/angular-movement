import type { RouteMeta } from '@analogjs/router';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlock } from '../../shared/components/code-block/code-block';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { ApiStabilityTable } from '../../shared/components/api-stability-table/api-stability-table';

interface ReferenceGroup {
  title: string;
  description: string;
  items: ReferenceItem[];
}

interface ReferenceItem {
  name: string;
  use: string;
  inputs: string;
  demo: string;
}

export const routeMeta: RouteMeta = { title: 'API reference — Angular Movement' };

@Component({
  selector: 'app-docs-reference',
  imports: [CodeBlock, PageHeader, ApiStabilityTable],
  template: `
    <article class="max-w-5xl">
      <app-page-header
        title="API Reference"
        description="A compact map of the directives and helpers you are expected to reach for in product UI."
      />

      <div class="docs-prose max-w-none">
        <h2>Choose by job</h2>
        <p>
          Start with motion-style states for most UI. Reach for interaction, presence, scroll,
          layout, SVG, and drag APIs when the behavior needs that specific runtime capability.
        </p>

        <div class="not-prose my-8 space-y-8">
          @for (group of groups; track group.title) {
            <section>
              <div class="mb-4">
                <h2 class="font-display text-text text-2xl font-bold">{{ group.title }}</h2>
                <p class="text-text-muted mt-1 text-sm">{{ group.description }}</p>
              </div>

              <div class="grid gap-4 md:grid-cols-2">
                @for (item of group.items; track item.name) {
                  <article class="border-border bg-surface rounded-lg border p-5">
                    <h3 class="font-display text-text mb-2 text-lg font-bold">{{ item.name }}</h3>
                    <p class="text-text-muted mb-4 text-sm leading-6">{{ item.use }}</p>
                    <p class="text-text-subtle mb-4 font-mono text-xs">{{ item.inputs }}</p>
                    <div class="h-40">
                      <app-code-block [title]="item.name + '.html'" [code]="item.demo" />
                    </div>
                  </article>
                }
              </div>
            </section>
          }
        </div>

        <h2>API stability</h2>
        <p>
          Stable APIs follow semantic-versioning expectations. Candidate APIs are feature-complete
          but may receive small adjustments. Experimental APIs can change significantly.
        </p>

        <app-api-stability-table />

        <h2>Input reactivity</h2>
        <p>
          Most interaction directives react to input changes while they are active. The following
          directives read their configuration once at initialization by design:
        </p>

        <ul>
          <li>
            <strong>Reactive after init</strong>: <code>moveWhileHover</code>,
            <code>moveWhileTap</code>, <code>moveWhileFocus</code>, <code>moveVariants</code>,
            <code>moveTarget</code>, <code>moveTrigger</code>, <code>moveScroll</code>,
            <code>moveParallax</code>, <code>moveDrag</code>.
          </li>
          <li>
            <strong>Init-only</strong>: <code>moveAnimate</code> / <code>[move]</code>,
            <code>[moveAnimation]</code>, <code>moveEnter</code>, <code>moveLeave</code>,
            <code>moveInView</code>, <code>moveLoop</code>, <code>moveText</code>,
            <code>moveSmoothScroll</code>. Wrap the element in <code>*movePresence</code> or
            re-create the view to replay.
          </li>
        </ul>

        <h2>Helpers</h2>
        <p>
          Use helpers when you want reusable state rather than a directive attached to one element.
        </p>

        <div class="not-prose my-6 grid gap-4 md:grid-cols-3">
          @for (helper of helpers; track helper.name) {
            <article class="border-border bg-surface rounded-lg border p-5">
              <h3 class="font-display text-text mb-2 text-lg font-bold">{{ helper.name }}</h3>
              <p class="text-text-muted text-sm leading-6">{{ helper.use }}</p>
            </article>
          }
        </div>
      </div>
    </article>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ReferencePage {
  protected readonly groups: ReferenceGroup[] = [
    {
      title: 'Basic motion',
      description: 'Use these first for enter, leave, and simple stateful UI.',
      items: [
        {
          name: 'moveEnter',
          use: 'Run a preset or keyframe animation when Angular creates the element.',
          inputs: 'moveEnter, moveDuration, moveEasing, moveDelay',
          demo: `<article moveEnter="fade-up">
  New notification
</article>`,
        },
        {
          name: 'moveInitial / moveAnimate / moveExit',
          use: 'Declare initial, target, and exit states for panels, cards, dialogs, and lists.',
          inputs: 'moveInitial, moveAnimate, moveExit, moveTransition',
          demo: `<aside
  [moveInitial]="{ opacity: 0, x: -24 }"
  [moveAnimate]="{ opacity: 1, x: 0 }"
  [moveExit]="{ opacity: 0, x: 24 }"
>
  Details
</aside>`,
        },
      ],
    },
    {
      title: 'State and orchestration',
      description: 'Coordinate reusable states and children without imperative animation code.',
      items: [
        {
          name: 'moveVariants',
          use: 'Map named product states such as collapsed, expanded, selected, or complete.',
          inputs: 'moveVariants, moveVariant, moveTransition, moveExitVariant',
          demo: `<button
  [moveVariants]="cardVariants"
  [moveVariant]="selected() ? 'selected' : 'idle'"
>
  Plan
</button>`,
        },
        {
          name: 'movePresence',
          use: 'Wait for exit animations before Angular removes a view.',
          inputs: '*movePresence, moveExit, moveExitVariant',
          demo: `<ng-container *movePresence="isOpen()">
  <dialog [moveExit]="{ opacity: 0, scale: 0.96 }">
    Checkout
  </dialog>
</ng-container>`,
        },
      ],
    },
    {
      title: 'Interaction and gestures',
      description: 'Use these when the pointer, focus, or viewport should drive the motion.',
      items: [
        {
          name: 'moveWhileHover / moveWhileTap / moveWhileFocus',
          use: 'Temporary interaction feedback for buttons, cards, and controls.',
          inputs: 'moveWhileHover, moveWhileTap, moveWhileFocus',
          demo: `<button
  [moveWhileHover]="{ scale: [1, 1.03] }"
  [moveWhileTap]="{ scale: [1, 0.97] }"
>
  Save
</button>`,
        },
        {
          name: 'moveDrag',
          use: 'Pointer-driven position with constraints, elasticity, momentum, and snap targets.',
          inputs: 'moveDrag, moveDragConstraints, moveDragMomentum, moveDragSnapPoints',
          demo: `<div
  moveDrag="x"
  [moveDragConstraints]="{ left: -120, right: 120 }"
  [moveDragSnapPoints]="snapPoints"
>
  Drag card
</div>`,
        },
      ],
    },
    {
      title: 'Scroll, layout, and SVG',
      description: 'Reach for these when motion is tied to the page, geometry, or vector drawing.',
      items: [
        {
          name: 'moveScroll / moveParallax',
          use: 'Map scroll progress to keyframes and expose progress as a signal.',
          inputs: 'moveScroll, moveScrollOffset, moveScrollContainer, moveParallax',
          demo: `<section
  #scroll="moveScroll"
  [moveScroll]="{ opacity: [0, 1], y: [48, 0] }"
>
  {{ '{' }}{{ '{' }} scroll.progress() {{ '}' }}{{ '}' }}
</section>`,
        },
        {
          name: 'SVG path drawing',
          use: 'Draw realistic product icons, checkmarks, progress strokes, and route lines.',
          inputs: 'pathLength, pathOffset, pathSpacing, moveTransition',
          demo: `<path
  [moveTarget]="draw()"
  [moveFrames]="{ pathLength: [0, 1], opacity: [0, 1] }"
  stroke="currentColor"
/>`,
        },
      ],
    },
  ];

  protected readonly helpers = [
    {
      name: 'provideMovement()',
      use: 'Register global duration, easing, delay, and disabled defaults once in app config.',
    },
    {
      name: 'moveValue() / moveTransform()',
      use: 'Create signal-native values and derive ranges from scroll, drag, or component state.',
    },
    {
      name: 'moveSpringValue()',
      use: 'Smooth a numeric signal with spring physics while staying inside Angular reactivity.',
    },
  ];
}
