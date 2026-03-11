import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-how-it-works',
  template: `
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-border">
      <div class="text-center mb-16">
        <h2 class="font-display text-3xl md:text-5xl font-bold tracking-tight text-text mb-4">
          How it works
        </h2>
        <p class="text-lg text-text-muted">Three simple steps to animate any element.</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Step 1 -->
        <div class="relative bg-surface border border-border rounded-2xl p-6 md:p-8 overflow-hidden">
          <div class="absolute -right-4 -top-6 text-[120px] font-bold text-accent/5 select-none leading-none z-0">1</div>
          <div class="relative z-10">
            <h3 class="text-xl font-display font-bold text-text mb-2">Install</h3>
            <p class="text-sm text-text-muted mb-6">Add the package via NPM or PNPM</p>
            <div class="bg-code-bg rounded-xl border border-border p-4 overflow-x-auto">
              <pre class="text-sm"><code class="font-mono text-text"><span class="code-keyword">npm</span> install @angular-movement/core</code></pre>
            </div>
          </div>
        </div>

        <!-- Step 2 -->
        <div class="relative bg-surface border border-border rounded-2xl p-6 md:p-8 overflow-hidden">
          <div class="absolute -right-4 -top-6 text-[120px] font-bold text-accent/5 select-none leading-none z-0">2</div>
          <div class="relative z-10">
            <h3 class="text-xl font-display font-bold text-text mb-2">Register</h3>
            <p class="text-sm text-text-muted mb-6">Provide it in your application config</p>
            <div class="bg-code-bg rounded-xl border border-border p-4 overflow-x-auto">
              <pre class="text-sm"><code class="font-mono text-text"><span class="code-comment">// app.config.ts</span>
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
        <div class="relative bg-surface border border-border rounded-2xl p-6 md:p-8 overflow-hidden">
          <div class="absolute -right-4 -top-6 text-[120px] font-bold text-accent/5 select-none leading-none z-0">3</div>
          <div class="relative z-10">
            <h3 class="text-xl font-display font-bold text-text mb-2">Animate</h3>
            <p class="text-sm text-text-muted mb-6">Add directives to your HTML templates</p>
            <div class="bg-code-bg rounded-xl border border-border p-4 overflow-x-auto">
              <pre class="text-sm"><code class="font-mono text-text">&lt;<span class="code-keyword">div</span> <span class="code-attr">moveEnter</span>=<span class="code-string">"fade-up"</span>&gt;
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
