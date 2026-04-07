import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-docs-get-started',
  template: `
    <article class="max-w-3xl">
      <div class="mb-10 pb-10 border-b border-border">
        <h1
          class="font-display text-4xl md:text-5xl font-bold tracking-tight text-text mb-4 relative inline-block"
        >
          Get Started
          <div class="absolute -bottom-2 left-0 w-1/3 h-1 bg-accent rounded-full"></div>
        </h1>
        <p class="text-xl text-text-muted mt-6">
          Install the library and set up your application configuration.
        </p>
      </div>

      <div
        class="prose prose-invert prose-p:text-text-muted prose-headings:text-text prose-headings:font-display prose-a:text-accent prose-code:text-accent-light prose-code:bg-surface-raised max-w-none"
      >
        <h2>1. Installation</h2>
        <p>Install the Angular Movement library using your preferred package manager.</p>

        <div
          class="my-6 bg-code-bg rounded-xl border border-border p-4 overflow-x-auto not-prose relative group"
        >
          <div class="absolute top-2 right-2 flex gap-2">
            <button class="text-xs px-2 py-1 bg-surface rounded text-text-muted hover:text-text">
              npm
            </button>
            <button class="text-xs px-2 py-1 rounded text-text-subtle hover:text-text">pnpm</button>
            <button class="text-xs px-2 py-1 rounded text-text-subtle hover:text-text">yarn</button>
          </div>
          <pre
            class="text-sm font-mono mt-8"
          ><code class="text-text"><span class="code-keyword">npm</span> install @angular-movement/core</code></pre>
        </div>

        <h2>2. Register the Provider</h2>
        <p>
          In your <code>app.config.ts</code>, provide the Movement configuration. You can optionally
          pass a global config object to override default durations or easings.
        </p>

        <div class="my-6 bg-code-bg rounded-xl border border-border p-4 overflow-x-auto not-prose">
          <pre
            class="text-sm font-mono"
          ><code class="text-text"><span class="code-comment">// app.config.ts</span>
<span class="code-keyword">import</span> {{ '{' }} ApplicationConfig {{ '}' }} <span class="code-keyword">from</span> <span class="code-string">'@angular/core'</span>;
<span class="code-keyword">import</span> {{ '{' }} provideMovement {{ '}' }} <span class="code-keyword">from</span> <span class="code-string">'@angular-movement/core'</span>;

<span class="code-keyword">export const</span> appConfig: ApplicationConfig = {{ '{' }}
  providers: [
    <span class="code-keyword">provideMovement</span>({{ '{' }}
      duration: <span class="code-attr">300</span>, <span class="code-comment">// Global default 300ms</span>
      easing: <span class="code-string">'ease-out'</span> <span class="code-comment">// Global default ease-out</span>
    {{ '}' }})
  ]
{{ '}' }};</code></pre>
        </div>

        <h2>3. Import Directives</h2>
        <p>
          Import <code>MOVEMENT_DIRECTIVES</code> into the components where you want to use the
          animations.
        </p>

        <div class="my-6 bg-code-bg rounded-xl border border-border p-4 overflow-x-auto not-prose">
          <pre
            class="text-sm font-mono"
          ><code class="text-text"><span class="code-comment">// my.component.ts</span>
<span class="code-keyword">import</span> {{ '{' }} Component {{ '}' }} <span class="code-keyword">from</span> <span class="code-string">'@angular/core'</span>;
<span class="code-keyword">import</span> {{ '{' }} MOVEMENT_DIRECTIVES {{ '}' }} <span class="code-keyword">from</span> <span class="code-string">'@angular-movement/core'</span>;

<span class="code-attr">@Component</span>({{ '{' }}
  selector: <span class="code-string">'my-component'</span>,
  imports: [...MOVEMENT_DIRECTIVES],
  template: <span class="code-string">\`
    &lt;div moveEnter="fade-up"&gt;
      I animate on enter!
    &lt;/div&gt;
  \`</span>
{{ '}' }})
<span class="code-keyword">export class</span> MyComponent {{ '{' }}{{ '}' }}</code></pre>
        </div>

        <p class="mt-8 p-4 bg-accent/5 border border-accent/20 rounded-xl">
          <strong>That's it!</strong> No triggers to set up, no state variables to manage. The
          element will animate automatically when initialized by Angular.
        </p>
      </div>

      <div class="mt-16 pt-8 border-t border-border flex justify-between items-center">
        <a
          href="/docs/introduction"
          class="group flex flex-col items-start gap-1 hover:text-accent transition-colors"
        >
          <span class="text-sm font-medium text-text-subtle">Previous</span>
          <span class="text-lg font-display font-semibold flex items-center gap-2">
            <span class="group-hover:-translate-x-1 transition-transform">&larr;</span> Introduction
          </span>
        </a>

        <a
          href="/demos"
          class="group flex flex-col items-end gap-1 hover:text-accent transition-colors"
        >
          <span class="text-sm font-medium text-text-subtle">Next</span>
          <span class="text-lg font-display font-semibold flex items-center gap-2">
            Try Demos <span class="group-hover:translate-x-1 transition-transform">&rarr;</span>
          </span>
        </a>
      </div>
    </article>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class GetStarted {}
