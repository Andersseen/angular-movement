import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-how-it-works',
  template: `
    <section class="border-border mx-auto max-w-7xl border-t px-4 py-24 sm:px-6 lg:px-8">
      <div class="mb-16 text-center">
        <h2 class="font-display text-text mb-4 text-3xl font-bold tracking-tight md:text-5xl">
          How it works
        </h2>
        <p class="text-text-muted text-lg">
          Angular directives in your template, WAAPI timelines in the browser, final styles
          committed for you.
        </p>
      </div>

      <div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <!-- Step 1 -->
        <div
          class="bg-surface border-border relative overflow-hidden rounded-2xl border p-6 md:p-8"
        >
          <div
            class="text-accent/5 absolute -top-6 -right-4 z-0 text-[120px] leading-none font-bold select-none"
          >
            1
          </div>
          <div class="relative z-10">
            <h3 class="font-display text-text mb-2 text-xl font-bold">Declare</h3>
            <p class="text-text-muted mb-6 text-sm">
              Add motion directly to Angular templates with directives and signals.
            </p>
            <div class="bg-code-bg border-border overflow-x-auto rounded-xl border p-4">
              <pre
                class="text-sm"
              ><code class="font-mono text-text">&lt;<span class="code-keyword">article</span>
  <span class="code-attr">moveEnter</span>=<span class="code-string">"fade-up"</span>
  [<span class="code-attr">moveWhileHover</span>]=<span class="code-string">"{{ '{' }} scale: [1, 1.03] {{ '}' }}"</span>
&gt;
  Product card
&lt;/<span class="code-keyword">article</span>&gt;</code></pre>
            </div>
          </div>
        </div>

        <!-- Step 2 -->
        <div
          class="bg-surface border-border relative overflow-hidden rounded-2xl border p-6 md:p-8"
        >
          <div
            class="text-accent/5 absolute -top-6 -right-4 z-0 text-[120px] leading-none font-bold select-none"
          >
            2
          </div>
          <div class="relative z-10">
            <h3 class="font-display text-text mb-2 text-xl font-bold">Compose</h3>
            <p class="text-text-muted mb-6 text-sm">
              Movement resolves presets, variants, transforms, SVG paths, and timing.
            </p>
            <div class="bg-code-bg border-border overflow-x-auto rounded-xl border p-4">
              <pre
                class="text-sm"
              ><code class="font-mono text-text"><span class="code-keyword">const</span> variants = {{ '{' }}
  idle: {{ '{' }} opacity: 0.7, y: 0 {{ '}' }},
  active: {{ '{' }} opacity: 1, y: -8 {{ '}' }},
  exit: {{ '{' }} opacity: 0, scale: 0.96 {{ '}' }}
{{ '}' }};</code></pre>
            </div>
          </div>
        </div>

        <!-- Step 3 -->
        <div
          class="bg-surface border-border relative overflow-hidden rounded-2xl border p-6 md:p-8"
        >
          <div
            class="text-accent/5 absolute -top-6 -right-4 z-0 text-[120px] leading-none font-bold select-none"
          >
            3
          </div>
          <div class="relative z-10">
            <h3 class="font-display text-text mb-2 text-xl font-bold">Commit</h3>
            <p class="text-text-muted mb-6 text-sm">
              WAAPI plays the timeline and the engine writes final styles safely.
            </p>
            <div class="bg-code-bg border-border overflow-x-auto rounded-xl border p-4">
              <pre
                class="text-sm"
              ><code class="font-mono text-text"><span class="code-comment">// Angular-native API</span>
<span class="code-comment">// Web Animations API runtime</span>
<span class="code-comment">// Final transform, opacity, and SVG styles preserved</span></code></pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HowItWorks {}
