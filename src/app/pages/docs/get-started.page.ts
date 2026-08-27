import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlock } from '../../shared/components/code-block/code-block';
import { InstallCommand } from '../../shared/components/install-command/install-command';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { DocsFooterNav } from '../../shared/components/docs-footer-nav/docs-footer-nav';

@Component({
  selector: 'app-docs-get-started',
  imports: [CodeBlock, InstallCommand, PageHeader, DocsFooterNav],
  template: `
    <article class="max-w-3xl">
      <app-page-header
        title="Get Started"
        description="Install the library and set up your application configuration."
      />

      <div
        class="prose prose-invert prose-p:text-text-muted prose-headings:text-text prose-headings:font-display prose-a:text-accent prose-code:text-accent-light prose-code:bg-surface-raised max-w-none"
      >
        <h2>1. Installation</h2>
        <p>Install the Angular Movement library using your preferred package manager.</p>

        <div class="not-prose my-6 max-w-xl">
          <app-install-command [interactiveScale]="false" />
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

      <app-docs-footer-nav
        prevHref="/docs/introduction"
        prevLabel="Introduction"
        nextHref="/docs/api"
        nextLabel="API Guide"
      />
    </article>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class GetStarted {
  protected readonly configCode = `<span class="code-comment">// app.config.ts</span>
<span class="code-keyword">import</span> { ApplicationConfig } <span class="code-keyword">from</span> <span class="code-string">'@angular/core'</span>;
<span class="code-keyword">import</span> { provideMovement } <span class="code-keyword">from</span> <span class="code-string">'angular-movement'</span>;

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
<span class="code-keyword">import</span> { MOVEMENT_DIRECTIVES } <span class="code-keyword">from</span> <span class="code-string">'angular-movement'</span>;

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
