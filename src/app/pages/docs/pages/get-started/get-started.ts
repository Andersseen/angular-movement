import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CodeBlock } from '../../../../shared/components/code-block/code-block';

@Component({
  selector: 'app-docs-get-started',
  imports: [RouterLink, CodeBlock],
  template: `
    <article class="max-w-3xl">
      <div class="border-border mb-10 border-b pb-10">
        <h1
          class="font-display text-text relative mb-4 inline-block text-4xl font-bold tracking-tight md:text-5xl"
        >
          Get Started
          <div class="bg-accent absolute -bottom-2 left-0 h-1 w-1/3 rounded-full"></div>
        </h1>
        <p class="text-text-muted mt-6 text-xl">
          Install the library and set up your application configuration.
        </p>
      </div>

      <div
        class="prose prose-invert prose-p:text-text-muted prose-headings:text-text prose-headings:font-display prose-a:text-accent prose-code:text-accent-light prose-code:bg-surface-raised max-w-none"
      >
        <h2>1. Installation</h2>
        <p>Install the Angular Movement library using your preferred package manager.</p>

        <div class="my-6 h-32">
          <app-code-block title="Terminal" [code]="installCode">
            <div class="absolute top-2 right-2 z-30 flex gap-2">
              <button class="bg-surface text-text-muted hover:text-text rounded px-2 py-1 text-xs">
                npm
              </button>
              <button class="text-text-subtle hover:text-text rounded px-2 py-1 text-xs">
                pnpm
              </button>
              <button class="text-text-subtle hover:text-text rounded px-2 py-1 text-xs">
                yarn
              </button>
            </div>
          </app-code-block>
        </div>

        <h2>2. Register the Provider</h2>
        <p>
          In your <code>app.config.ts</code>, provide the Movement configuration. You can optionally
          pass a global config object to override default durations or easings.
        </p>

        <div class="my-6 h-64">
          <app-code-block title="app.config.ts" [code]="configCode"></app-code-block>
        </div>

        <h2>3. Import Directives</h2>
        <p>
          Import <code>MOVEMENT_DIRECTIVES</code> into the components where you want to use the
          animations.
        </p>

        <div class="my-6 h-80">
          <app-code-block title="my.component.ts" [code]="componentCode"></app-code-block>
        </div>

        <p class="bg-accent/5 border-accent/20 mt-8 rounded-xl border p-4">
          <strong>That's it!</strong> No triggers to set up, no state variables to manage. The
          element will animate automatically when initialized by Angular.
        </p>
      </div>

      <div class="border-border mt-16 flex items-center justify-between border-t pt-8">
        <a
          routerLink="/docs/introduction"
          class="group hover:text-accent flex flex-col items-start gap-1 transition-colors"
        >
          <span class="text-text-subtle text-sm font-medium">Previous</span>
          <span class="font-display flex items-center gap-2 text-lg font-semibold">
            <span class="transition-transform group-hover:-translate-x-1">&larr;</span> Introduction
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
export default class GetStarted {
  protected readonly installCode = `<span class="code-keyword">npm</span> install @angular-movement/core`;

  protected readonly configCode = `<span class="code-comment">// app.config.ts</span>
<span class="code-keyword">import</span> { ApplicationConfig } <span class="code-keyword">from</span> <span class="code-string">'@angular/core'</span>;
<span class="code-keyword">import</span> { provideMovement } <span class="code-keyword">from</span> <span class="code-string">'@angular-movement/core'</span>;

<span class="code-keyword">export const</span> appConfig: ApplicationConfig = {
  providers: [
    <span class="code-keyword">provideMovement</span>({
      duration: <span class="code-attr">300</span>, <span class="code-comment">// Global default 300ms</span>
      easing: <span class="code-string">'ease-out'</span> <span class="code-comment">// Global default ease-out</span>
    })
  ]
};`;

  protected readonly componentCode = `<span class="code-comment">// my.component.ts</span>
<span class="code-keyword">import</span> { Component } <span class="code-keyword">from</span> <span class="code-string">'@angular/core'</span>;
<span class="code-keyword">import</span> { MOVEMENT_DIRECTIVES } <span class="code-keyword">from</span> <span class="code-string">'@angular-movement/core'</span>;

<span class="code-attr">@Component</span>({
  selector: <span class="code-string">'my-component'</span>,
  imports: [...MOVEMENT_DIRECTIVES],
  template: <span class="code-string">\`
    &lt;div moveEnter="fade-up"&gt;
      I animate on enter!
    &lt;/div&gt;
  \`</span>
})
<span class="code-keyword">export class</span> MyComponent {}`;
}
