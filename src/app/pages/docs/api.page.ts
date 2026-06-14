import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CodeBlock } from '../../shared/components/code-block/code-block';

@Component({
  selector: 'app-docs-api',
  imports: [RouterLink, CodeBlock],
  template: `
    <article class="max-w-4xl">
      <div class="border-border mb-10 border-b pb-10">
        <h1
          class="font-display text-text relative mb-4 inline-block text-4xl font-bold tracking-tight md:text-5xl"
        >
          API Guide
          <div class="bg-accent absolute -bottom-2 left-0 h-1 w-1/3 rounded-full"></div>
        </h1>
        <p class="text-text-muted mt-6 text-xl">
          Start with the motion-style state API, then reach for focused directives when the
          interaction needs presence, scroll, SVG, drag, or orchestration.
        </p>
      </div>

      <div
        class="prose prose-invert prose-p:text-text-muted prose-headings:text-text prose-headings:font-display prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-code:text-accent-light prose-code:bg-surface-raised prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none max-w-none"
      >
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

        <div class="my-6 h-40">
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

        <h2>Advanced features</h2>
        <p>
          Reach for SVG path drawing, per-property transitions, spring physics, drag, scroll,
          parallax, and layout directives when the motion is part of the product behavior rather
          than a simple reveal effect.
        </p>
        <p>
          Per-property transitions support different <code>duration</code> and
          <code>delay</code> values. Different per-property <code>easing</code> values currently
          fall back to the global easing so WAAPI receives one composed timeline.
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

      <div class="border-border mt-16 flex items-center justify-between border-t pt-8">
        <a
          routerLink="/docs/get-started"
          class="group hover:text-accent flex flex-col items-start gap-1 transition-colors"
        >
          <span class="text-text-subtle text-sm font-medium">Previous</span>
          <span class="font-display flex items-center gap-2 text-lg font-semibold">
            <span class="transition-transform group-hover:-translate-x-1">&larr;</span> Get Started
          </span>
        </a>

        <a
          routerLink="/demos"
          class="group hover:text-accent flex flex-col items-end gap-1 transition-colors"
        >
          <span class="text-text-subtle text-sm font-medium">Next</span>
          <span class="font-display flex items-center gap-2 text-lg font-semibold">
            Try Demos <span class="transition-transform group-hover:translate-x-1">&rarr;</span>
          </span>
        </a>
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
      items: ['moveWhileHover', 'moveWhileTap', 'moveFocus', 'moveInView'],
    },
    {
      stage: 'State',
      title: 'Targets and variants',
      description: 'Reusable states driven by Angular signals, inputs, or boolean conditions.',
      items: ['moveVariants', 'moveAnimate', 'moveTarget', 'moveTrigger'],
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

  protected readonly motionStyleCode = `&lt;<span class="code-keyword">ng-container</span> *<span class="code-attr">movePresence</span>=<span class="code-string">"isOpen()"</span>&gt;
  &lt;<span class="code-keyword">article</span>
    [<span class="code-attr">moveInitial</span>]=<span class="code-string">"{ opacity: 0, y: 24 }"</span>
    [<span class="code-attr">moveAnimate</span>]=<span class="code-string">"{ opacity: 1, y: 0 }"</span>
    [<span class="code-attr">moveExit</span>]=<span class="code-string">"{ opacity: 0, y: -16 }"</span>
  &gt;
    Panel
  &lt;/<span class="code-keyword">article</span>&gt;
&lt;/<span class="code-keyword">ng-container</span>&gt;`;

  protected readonly presetCode = `&lt;<span class="code-keyword">section</span> [<span class="code-attr">move</span>]=<span class="code-string">"'fade-up'"</span>&gt;
  Content
&lt;/<span class="code-keyword">section</span>&gt;`;

  protected readonly variantsCode = `&lt;<span class="code-keyword">div</span>
  [<span class="code-attr">moveVariants</span>]=<span class="code-string">"{
    idle: { scale: 1, rotate: 0 },
    active: { scale: 1.08, rotate: 4 }
  }"</span>
  [<span class="code-attr">moveAnimate</span>]=<span class="code-string">"selected() ? 'active' : 'idle'"</span>
&gt;
  Card
&lt;/<span class="code-keyword">div</span>&gt;`;

  protected readonly svgCode = `&lt;<span class="code-keyword">path</span>
  [<span class="code-attr">moveTarget</span>]=<span class="code-string">"draw()"</span>
  [<span class="code-attr">moveFrames</span>]=<span class="code-string">"{ pathLength: [0, 1], opacity: [0, 1] }"</span>
  [<span class="code-attr">moveTransition</span>]=<span class="code-string">"{ duration: 700, opacity: { duration: 200 } }"</span>
  fill=<span class="code-string">"none"</span>
  stroke=<span class="code-string">"currentColor"</span>
/&gt;`;
}
