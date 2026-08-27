import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlock } from '../../shared/components/code-block/code-block';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { DocsFooterNav } from '../../shared/components/docs-footer-nav/docs-footer-nav';
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

@Component({
  selector: 'app-docs-reference',
  imports: [CodeBlock, PageHeader, DocsFooterNav, ApiStabilityTable],
  template: `
    <article class="max-w-5xl">
      <app-page-header
        title="API Reference"
        description="A compact map of the directives and helpers you are expected to reach for in product UI."
      />

      <div
        class="prose prose-invert prose-p:text-text-muted prose-headings:text-text prose-headings:font-display prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-code:text-accent-light prose-code:bg-surface-raised prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none max-w-none"
      >
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

      <app-docs-footer-nav
        prevHref="/docs/api"
        prevLabel="API Guide"
        nextHref="/docs/presets"
        nextLabel="Presets"
      />
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
          demo: `&lt;<span class="code-keyword">article</span> <span class="code-attr">moveEnter</span>=<span class="code-string">"fade-up"</span>&gt;
  New notification
&lt;/<span class="code-keyword">article</span>&gt;`,
        },
        {
          name: 'moveInitial / moveAnimate / moveExit',
          use: 'Declare initial, target, and exit states for panels, cards, dialogs, and lists.',
          inputs: 'moveInitial, moveAnimate, moveExit, moveTransition',
          demo: `&lt;<span class="code-keyword">aside</span>
  [<span class="code-attr">moveInitial</span>]=<span class="code-string">"{ opacity: 0, x: -24 }"</span>
  [<span class="code-attr">moveAnimate</span>]=<span class="code-string">"{ opacity: 1, x: 0 }"</span>
  [<span class="code-attr">moveExit</span>]=<span class="code-string">"{ opacity: 0, x: 24 }"</span>
&gt;
  Details
&lt;/<span class="code-keyword">aside</span>&gt;`,
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
          demo: `&lt;<span class="code-keyword">button</span>
  [<span class="code-attr">moveVariants</span>]=<span class="code-string">"cardVariants"</span>
  [<span class="code-attr">moveVariant</span>]=<span class="code-string">"selected() ? 'selected' : 'idle'"</span>
&gt;
  Plan
&lt;/<span class="code-keyword">button</span>&gt;`,
        },
        {
          name: 'movePresence',
          use: 'Wait for exit animations before Angular removes a view.',
          inputs: '*movePresence, moveExit, moveExitVariant',
          demo: `&lt;<span class="code-keyword">ng-container</span> *<span class="code-attr">movePresence</span>=<span class="code-string">"isOpen()"</span>&gt;
  &lt;<span class="code-keyword">dialog</span> [<span class="code-attr">moveExit</span>]=<span class="code-string">"{ opacity: 0, scale: 0.96 }"</span>&gt;
    Checkout
  &lt;/<span class="code-keyword">dialog</span>&gt;
&lt;/<span class="code-keyword">ng-container</span>&gt;`,
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
          demo: `&lt;<span class="code-keyword">button</span>
  [<span class="code-attr">moveWhileHover</span>]=<span class="code-string">"{ scale: [1, 1.03] }"</span>
  [<span class="code-attr">moveWhileTap</span>]=<span class="code-string">"{ scale: [1, 0.97] }"</span>
&gt;
  Save
&lt;/<span class="code-keyword">button</span>&gt;`,
        },
        {
          name: 'moveDrag',
          use: 'Pointer-driven position with constraints, elasticity, momentum, and snap targets.',
          inputs: 'moveDrag, moveDragConstraints, moveDragMomentum, moveDragSnapPoints',
          demo: `&lt;<span class="code-keyword">div</span>
  <span class="code-attr">moveDrag</span>=<span class="code-string">"x"</span>
  [<span class="code-attr">moveDragConstraints</span>]=<span class="code-string">"{ left: -120, right: 120 }"</span>
  [<span class="code-attr">moveDragSnapPoints</span>]=<span class="code-string">"snapPoints"</span>
&gt;
  Drag card
&lt;/<span class="code-keyword">div</span>&gt;`,
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
          demo: `&lt;<span class="code-keyword">section</span>
  #scroll=<span class="code-string">"moveScroll"</span>
  [<span class="code-attr">moveScroll</span>]=<span class="code-string">"{ opacity: [0, 1], y: [48, 0] }"</span>
&gt;
  {{ '{' }}{{ '{' }} scroll.progress() {{ '}' }}{{ '}' }}
&lt;/<span class="code-keyword">section</span>&gt;`,
        },
        {
          name: 'SVG path drawing',
          use: 'Draw realistic product icons, checkmarks, progress strokes, and route lines.',
          inputs: 'pathLength, pathOffset, pathSpacing, moveTransition',
          demo: `&lt;<span class="code-keyword">path</span>
  [<span class="code-attr">moveTarget</span>]=<span class="code-string">"draw()"</span>
  [<span class="code-attr">moveFrames</span>]=<span class="code-string">"{ pathLength: [0, 1], opacity: [0, 1] }"</span>
  stroke=<span class="code-string">"currentColor"</span>
/&gt;`,
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
