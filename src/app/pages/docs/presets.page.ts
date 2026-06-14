import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MOVEMENT_DIRECTIVES, MovePreset } from 'movement';
import { CodeBlock } from '../../shared/components/code-block/code-block';

interface PresetGroup {
  title: string;
  description: string;
  examples: PresetExample[];
}

interface PresetExample {
  name: string;
  preset: MovePreset;
  use: string;
  demo: string;
}

@Component({
  selector: 'app-docs-presets',
  imports: [RouterLink, CodeBlock, ...MOVEMENT_DIRECTIVES],
  template: `
    <article class="max-w-5xl">
      <div class="border-border mb-10 border-b pb-10">
        <h1
          class="font-display text-text relative mb-4 inline-block text-4xl font-bold tracking-tight md:text-5xl"
        >
          Presets
          <div class="bg-accent absolute -bottom-2 left-0 h-1 w-1/3 rounded-full"></div>
        </h1>
        <p class="text-text-muted mt-6 text-xl">
          Named animations for common product UI moments. Use them when the desired motion is
          already known and you do not need custom state logic.
        </p>
      </div>

      <div
        class="prose prose-invert prose-p:text-text-muted prose-headings:text-text prose-headings:font-display prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-code:text-accent-light prose-code:bg-surface-raised prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none max-w-none"
      >
        <h2>Where presets fit</h2>
        <p>
          Presets work with <code>moveEnter</code>, <code>moveLeave</code>, <code>[move]</code>,
          <code>moveInView</code>, and staggered children. They are the fastest way to add
          consistent motion to empty states, cards, menus, alerts, SVG icons, and list reveals.
        </p>

        <div class="not-prose my-8 grid gap-4 md:grid-cols-3">
          @for (rule of presetRules; track rule.title) {
            <section class="border-border bg-surface rounded-lg border p-5">
              <h3 class="font-display text-text mb-2 text-lg font-bold">{{ rule.title }}</h3>
              <p class="text-text-muted text-sm leading-6">{{ rule.description }}</p>
            </section>
          }
        </div>

        <div class="not-prose my-10 space-y-10">
          @for (group of groups; track group.title) {
            <section>
              <div class="mb-4">
                <h2 class="font-display text-text text-2xl font-bold">{{ group.title }}</h2>
                <p class="text-text-muted mt-1 text-sm">{{ group.description }}</p>
              </div>

              <div class="grid gap-4 lg:grid-cols-3">
                @for (example of group.examples; track example.name) {
                  <article class="border-border bg-surface rounded-lg border p-5">
                    <div class="mb-5 flex h-24 items-center justify-center">
                      @if (example.preset.startsWith('icon-')) {
                        @if (example.preset === 'icon-draw') {
                          <svg class="text-accent h-14 w-14" viewBox="0 0 48 48" fill="none">
                            <path
                              [moveEnter]="example.preset"
                              [moveDuration]="700"
                              d="M14 25.5 21 32l14-17"
                              stroke="currentColor"
                              stroke-width="4"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                          </svg>
                        } @else {
                          <svg
                            [moveEnter]="example.preset"
                            [moveDuration]="700"
                            class="text-accent h-14 w-14"
                            viewBox="0 0 48 48"
                            fill="none"
                          >
                            <path
                              d="M14 25.5 21 32l14-17"
                              stroke="currentColor"
                              stroke-width="4"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                          </svg>
                        }
                      } @else {
                        <div
                          [moveEnter]="example.preset"
                          [moveDuration]="550"
                          class="bg-accent text-text flex h-16 w-16 items-center justify-center rounded-lg font-mono text-sm font-bold shadow-[0_0_24px_var(--color-accent-glow)]"
                        >
                          UI
                        </div>
                      }
                    </div>

                    <h3 class="font-display text-text mb-2 text-lg font-bold">
                      {{ example.name }}
                    </h3>
                    <p class="text-text-muted mb-4 text-sm leading-6">{{ example.use }}</p>
                    <div class="h-44">
                      <app-code-block [title]="example.preset + '.html'" [code]="example.demo" />
                    </div>
                  </article>
                }
              </div>
            </section>
          }
        </div>

        <h2>When to avoid a preset</h2>
        <p>
          If the element has named states, use <code>moveVariants</code>. If Angular should keep a
          removed view alive while it exits, wrap it in <code>movePresence</code>. If the pointer,
          layout, or scroll position drives the behavior, use <code>moveDrag</code>,
          <code>moveLayout</code>, <code>moveScroll</code>, or <code>moveParallax</code>.
        </p>
      </div>

      <div class="border-border mt-16 flex items-center justify-between border-t pt-8">
        <a
          routerLink="/docs/reference"
          class="group hover:text-accent flex flex-col items-start gap-1 transition-colors"
        >
          <span class="text-text-subtle text-sm font-medium">Previous</span>
          <span class="font-display flex items-center gap-2 text-lg font-semibold">
            <span class="transition-transform group-hover:-translate-x-1">&larr;</span> API
            Reference
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
export default class PresetsPage {
  protected readonly presetRules = [
    {
      title: 'Use for simple moments',
      description: 'Choose a preset when the element only needs an entrance, exit, or reveal.',
    },
    {
      title: 'Keep timing local',
      description: 'Tune duration, delay, easing, or spring inputs without changing the preset.',
    },
    {
      title: 'Graduate when state matters',
      description: 'Move to variants, presence, drag, scroll, or layout when behavior gets richer.',
    },
  ];

  protected readonly groups: PresetGroup[] = [
    {
      title: 'Product UI reveals',
      description: 'Use these for cards, panels, empty states, menus, and list items.',
      examples: [
        {
          name: 'Fade up card',
          preset: 'fade-up',
          use: 'A calm default for cards, settings sections, and page content.',
          demo: `&lt;<span class="code-keyword">article</span> <span class="code-attr">moveEnter</span>=<span class="code-string">"fade-up"</span>&gt;
  Billing summary
&lt;/<span class="code-keyword">article</span>&gt;`,
        },
        {
          name: 'Slide up panel',
          preset: 'slide-up',
          use: 'Useful for drawers, bottom sheets, and contextual panels.',
          demo: `&lt;<span class="code-keyword">aside</span>
  <span class="code-attr">moveEnter</span>=<span class="code-string">"slide-up"</span>
  <span class="code-attr">moveLeave</span>=<span class="code-string">"slide-down"</span>
&gt;
  Filters
&lt;/<span class="code-keyword">aside</span>&gt;`,
        },
        {
          name: 'Zoom in status',
          preset: 'zoom-in',
          use: 'Good for badges, confirmation UI, and small attention moments.',
          demo: `&lt;<span class="code-keyword">span</span>
  <span class="code-attr">moveEnter</span>=<span class="code-string">"zoom-in"</span>
  [<span class="code-attr">moveDuration</span>]=<span class="code-string">"300"</span>
&gt;
  Saved
&lt;/<span class="code-keyword">span</span>&gt;`,
        },
      ],
    },
    {
      title: 'Feedback and attention',
      description: 'Use these sparingly for validation, loading, and meaningful emphasis.',
      examples: [
        {
          name: 'Pulse loading state',
          preset: 'pulse',
          use: 'Signals live activity without moving layout around.',
          demo: `&lt;<span class="code-keyword">div</span>
  <span class="code-attr">moveEnter</span>=<span class="code-string">"pulse"</span>
  [<span class="code-attr">moveDuration</span>]=<span class="code-string">"900"</span>
&gt;
  Syncing
&lt;/<span class="code-keyword">div</span>&gt;`,
        },
        {
          name: 'Shake validation',
          preset: 'shake',
          use: 'Draws attention to a failed field after explicit user action.',
          demo: `&lt;<span class="code-keyword">input</span>
  <span class="code-attr">moveEnter</span>=<span class="code-string">"shake"</span>
  <span class="code-attr">aria-invalid</span>=<span class="code-string">"true"</span>
/&gt;`,
        },
        {
          name: 'Tada success',
          preset: 'tada',
          use: 'A celebratory moment for complete setup or milestone progress.',
          demo: `&lt;<span class="code-keyword">strong</span> <span class="code-attr">moveEnter</span>=<span class="code-string">"tada"</span>&gt;
  Workspace ready
&lt;/<span class="code-keyword">strong</span>&gt;`,
        },
      ],
    },
    {
      title: 'SVG icons',
      description: 'Use these for checkmarks, route lines, progress strokes, and product icons.',
      examples: [
        {
          name: 'Draw checkmark',
          preset: 'icon-draw',
          use: 'Reveals the actual SVG stroke instead of faking it with opacity.',
          demo: `&lt;<span class="code-keyword">path</span>
  <span class="code-attr">moveEnter</span>=<span class="code-string">"icon-draw"</span>
  <span class="code-attr">d</span>=<span class="code-string">"M14 25.5 21 32l14-17"</span>
  <span class="code-attr">stroke</span>=<span class="code-string">"currentColor"</span>
/&gt;`,
        },
        {
          name: 'Icon pulse',
          preset: 'icon-pulse',
          use: 'Adds emphasis to a selected tool or active navigation icon.',
          demo: `&lt;<span class="code-keyword">svg</span> <span class="code-attr">moveEnter</span>=<span class="code-string">"icon-pulse"</span>&gt;
  &lt;<span class="code-keyword">path</span> <span class="code-attr">d</span>=<span class="code-string">"..."</span> /&gt;
&lt;/<span class="code-keyword">svg</span>&gt;`,
        },
        {
          name: 'Icon bounce',
          preset: 'icon-bounce',
          use: 'Gives small icons a friendly confirmation motion.',
          demo: `&lt;<span class="code-keyword">svg</span> <span class="code-attr">moveEnter</span>=<span class="code-string">"icon-bounce"</span>&gt;
  &lt;<span class="code-keyword">path</span> <span class="code-attr">d</span>=<span class="code-string">"..."</span> /&gt;
&lt;/<span class="code-keyword">svg</span>&gt;`,
        },
      ],
    },
  ];
}
