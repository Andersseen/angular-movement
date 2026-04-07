import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-how-it-works',
  template: `
    <section class="border-border mx-auto max-w-7xl border-t px-4 py-24 sm:px-6 lg:px-8">
      <div class="mb-16 text-center">
        <h2 class="font-display text-text mb-4 text-3xl font-bold tracking-tight md:text-5xl">
          How it works
        </h2>
        <p class="text-text-muted text-lg">Three simple steps to animate any element.</p>
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
            <h3 class="font-display text-text mb-2 text-xl font-bold">Install</h3>
            <p class="text-text-muted mb-6 text-sm">Add the package via NPM or PNPM</p>
            <div class="bg-code-bg border-border overflow-x-auto rounded-xl border p-4">
              <pre
                class="text-sm"
              ><code class="font-mono text-text"><span class="code-keyword">npm</span> install @angular-movement/core</code></pre>
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
            <h3 class="font-display text-text mb-2 text-xl font-bold">Register</h3>
            <p class="text-text-muted mb-6 text-sm">Provide it in your application config</p>
            <div class="bg-code-bg border-border overflow-x-auto rounded-xl border p-4">
              <pre
                class="text-sm"
              ><code class="font-mono text-text"><span class="code-comment">// app.config.ts</span>
<span class="code-keyword">import</span> {{ '{' }} provideMovement {{ '}' }} <span class="code-keyword">from</span> <span class="code-string">'@angular-movement/core'</span>;

<span class="code-keyword">export</span> <span class="code-keyword">const</span> appConfig: ApplicationConfig = {{ '{' }}
  providers: [
    <span class="code-keyword">provideMovement()</span>
  ]
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
            <h3 class="font-display text-text mb-2 text-xl font-bold">Animate</h3>
            <p class="text-text-muted mb-6 text-sm">Add directives to your HTML templates</p>
            <div class="bg-code-bg border-border overflow-x-auto rounded-xl border p-4">
              <pre
                class="text-sm"
              ><code class="font-mono text-text">&lt;<span class="code-keyword">div</span> <span class="code-attr">moveEnter</span>=<span class="code-string">"fade-up"</span>&gt;
  Hello, Angular Movement!
&lt;/<span class="code-keyword">div</span>&gt;</code></pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HowItWorks {}
