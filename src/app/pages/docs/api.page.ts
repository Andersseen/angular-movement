import type { RouteMeta } from '@analogjs/router';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlock } from '../../shared/components/code-block/code-block';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { ApiStabilityTable } from '../../shared/components/api-stability-table/api-stability-table';

export const routeMeta: RouteMeta = { title: 'API guide — Angular Movement' };

@Component({
  selector: 'app-docs-api',
  imports: [CodeBlock, PageHeader, ApiStabilityTable],
  template: `
    <article class="max-w-4xl">
      <app-page-header
        title="API Guide"
        description="Start with the motion-style state API, then reach for focused directives when the interaction needs presence, scroll, SVG, drag, or orchestration."
      />

      <div class="docs-prose max-w-none">
        <h2>Recommended path</h2>
        <p>
          The library has a broad surface area, but most teams should learn it in this order: basic
          motion, interaction motion, state variants, orchestration, then advanced runtime features.
        </p>

        <div class="not-prose my-8 grid gap-4 md:grid-cols-2">
          @for (group of apiGroups; track group.title) {
            <section class="border-border bg-surface rounded-lg border p-5">
              <p class="text-accent mb-2 text-xs font-bold tracking-wider uppercase">
                {{ group.stage }}
              </p>
              <h3 class="font-display text-text mb-2 text-lg font-bold">{{ group.title }}</h3>
              <p class="text-text-muted mb-4 text-sm leading-6">{{ group.description }}</p>
              <ul class="flex flex-wrap gap-2">
                @for (item of group.items; track item) {
                  <li
                    class="bg-surface-raised text-text-muted border-border rounded-md border px-2.5 py-1 font-mono text-xs"
                  >
                    {{ item }}
                  </li>
                }
              </ul>
            </section>
          }
        </div>

        <h2>How it works</h2>
        <p>
          Angular Movement is Angular-native at the template API level and powered by the browser
          Web Animations API at runtime. Directives read Angular inputs and signals, compose
          keyframes, run them through WAAPI, then commit final styles when the animation finishes.
        </p>

        <div class="not-prose my-8 grid gap-4 md:grid-cols-3">
          @for (step of runtimeSteps; track step.title) {
            <section class="border-border bg-surface rounded-lg border p-5">
              <p class="text-accent mb-2 text-xs font-bold tracking-wider uppercase">
                {{ step.stage }}
              </p>
              <h3 class="font-display text-text mb-2 text-lg font-bold">{{ step.title }}</h3>
              <p class="text-text-muted text-sm leading-6">{{ step.description }}</p>
            </section>
          }
        </div>

        <h2>First API to reach for</h2>
        <p>
          For app UI, prefer <code>moveInitial</code>, <code>moveAnimate</code>, and
          <code>moveExit</code>. It maps directly to the mental model of initial state, target
          state, and exit state.
        </p>

        <div class="my-6 h-72">
          <app-code-block title="motion-style.html" [code]="motionStyleCode"></app-code-block>
        </div>

        <h2>Use presets for common entrance motion</h2>
        <p>
          Use <code>[move]</code>, <code>moveEnter</code>, and <code>moveLeave</code> when a named
          preset is enough and you do not need stateful variants.
        </p>
        <p>
          For exits, wrap conditional content in <code>movePresence</code>. A direct
          <code>&#64;if</code> or <code>*ngIf</code> removes the element before
          <code>moveLeave</code> can run.
        </p>

        <div class="my-6 h-64">
          <app-code-block title="preset.html" [code]="presetCode"></app-code-block>
        </div>

        <h2>Use variants for reusable states</h2>
        <p>
          Use <code>moveVariants</code> when components move between named states such as idle,
          selected, expanded, collapsed, loading, or complete.
        </p>
        <p>
          Use <code>moveTransition</code> for shared variant timing and
          <code>moveExitVariant</code> when a named variant should play inside
          <code>movePresence</code> before Angular removes the view.
        </p>

        <div class="my-6 h-80">
          <app-code-block title="variants.html" [code]="variantsCode"></app-code-block>
        </div>

        <h2>Derive motion values from signals</h2>
        <p>
          Use <code>moveValue</code>, <code>moveTransform</code>, and
          <code>moveSpringValue</code> when motion should come from Angular signal state, scroll
          progress, or a computed value instead of a fixed keyframe object.
        </p>

        <div class="my-6 h-72">
          <app-code-block title="motion-values.ts" [code]="motionValuesCode"></app-code-block>
        </div>

        <h2>API stability</h2>
        <p>
          Not every API is frozen yet. Use this table when deciding whether an API is safe for
          production UI or still subject to breaking changes.
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
            <code>moveParallax</code>, <code>moveDrag</code>, <code>moveLoop</code>,
            <code>moveText</code>, and <code>[moveAnimation]</code>'s <code>animate</code> state.
          </li>
          <li>
            <strong>Init-only</strong>: <code>moveAnimate</code> / <code>[move]</code>,
            <code>moveEnter</code>, <code>moveLeave</code>, <code>moveInView</code>,
            <code>moveSmoothScroll</code>. Wrap the element in <code>*movePresence</code> or
            re-create the view to replay.
          </li>
        </ul>

        <h2>Advanced features</h2>
        <p>
          Reach for SVG path drawing, per-property transitions, spring physics, drag, scroll,
          parallax, and layout directives when the motion is part of the product behavior rather
          than a simple reveal effect.
        </p>
        <p>
          Per-property transitions support different <code>duration</code>, <code>delay</code> and
          <code>easing</code> values. Independent properties such as <code>opacity</code> run as
          separate animations with their own easing; only the transform channels (<code>x</code>,
          <code>y</code>, <code>scale</code>, <code>rotate</code>, …) share one easing, because they
          compose into a single <code>transform</code>.
        </p>
        <p>
          Use <code>moveWhileTap</code> for temporary press feedback that returns on release. Use
          <code>moveDrag</code> when the element should follow the pointer and settle into a real
          position with constraints, momentum, snap-to-origin, or snap points.
        </p>

        <div class="my-6 h-80">
          <app-code-block title="svg-draw.html" [code]="svgCode"></app-code-block>
        </div>
      </div>
    </article>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ApiGuide {
  protected readonly apiGroups = [
    {
      stage: 'Basic',
      title: 'Entrance and exit',
      description: 'The shortest path for product UI reveals, panels, cards, and simple exits.',
      items: ['[move]', 'moveEnter', 'moveLeave', 'moveInitial', 'moveAnimate', 'moveExit'],
    },
    {
      stage: 'Interaction',
      title: 'Pointer and focus states',
      description: 'Micro-interactions without component-local animation code.',
      items: ['moveWhileHover', 'moveWhileTap', 'moveWhileFocus', 'moveInView'],
    },
    {
      stage: 'State',
      title: 'Targets and variants',
      description: 'Reusable states driven by Angular signals, inputs, or boolean conditions.',
      items: ['moveVariants', 'moveVariant', 'moveTarget', 'moveTrigger'],
    },
    {
      stage: 'Orchestration',
      title: 'Presence and stagger',
      description: 'Coordinate children, list reveals, and exit animations before DOM removal.',
      items: ['movePresence', 'moveStagger', 'moveStaggerStep', 'moveStaggerDirection'],
    },
    {
      stage: 'Scroll and layout',
      title: 'Motion linked to viewport changes',
      description: 'Map scroll progress to keyframes and animate layout changes.',
      items: ['moveScroll', 'moveParallax', 'moveLayout', 'moveSmoothScroll'],
    },
    {
      stage: 'Advanced',
      title: 'Runtime-level motion',
      description:
        'Use WAAPI-powered SVG drawing, springs, and drag for distinctive product motion.',
      items: ['pathLength', 'pathOffset', 'transition', 'spring', 'moveDrag'],
    },
  ];

  protected readonly runtimeSteps = [
    {
      stage: '1',
      title: 'Declare',
      description: 'Use directives and signal-driven inputs directly in Angular templates.',
    },
    {
      stage: '2',
      title: 'Compose',
      description: 'Movement resolves presets, variants, transforms, SVG paths, and transitions.',
    },
    {
      stage: '3',
      title: 'Commit',
      description: 'WAAPI plays the timeline and the engine writes the final styles back safely.',
    },
  ];

  protected readonly motionStyleCode = `<ng-container *movePresence="isOpen()">
  <article
    [moveInitial]="{ opacity: 0, y: 24 }"
    [moveAnimate]="{ opacity: 1, y: 0 }"
    [moveExit]="{ opacity: 0, y: -16 }"
  >
    Panel
  </article>
</ng-container>`;

  protected readonly presetCode = `<section moveEnter="fade-up">
  Content
</section>

<ng-container *movePresence="isOpen()">
  <aside moveLeave="fade-down">
    Leaving panel
  </aside>
</ng-container>`;

  protected readonly variantsCode = `<div
  [moveVariants]="{
    idle: { scale: 1, rotate: 0 },
    active: { scale: 1.08, rotate: 4 }
  }"
  [moveVariant]="selected() ? 'active' : 'idle'"
>
  Card
</div>`;

  protected readonly motionValuesCode = `const progress = moveValue(0);
const x = moveTransform(progress, [0, 1], [0, 120]);
const scale = moveSpringValue(
  moveTransform(progress, [0, 1], [0.9, 1]),
  { injector: inject(Injector) }
);

const transform = computed(
  () => \`translateX(\${x()}px) scale(\${scale()})\`
);`;

  protected readonly svgCode = `<path
  [moveTarget]="draw()"
  [moveFrames]="{ pathLength: [0, 1], opacity: [0, 1] }"
  [moveTransition]="{ duration: 700, opacity: { duration: 200 } }"
  fill="none"
  stroke="currentColor"
/>`;
}
