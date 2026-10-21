import type { RouteMeta } from '@analogjs/router';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlock } from '../../shared/components/code-block/code-block';
import { InstallCommand } from '../../shared/components/install-command/install-command';
import { PageHeader } from '../../shared/components/page-header/page-header';

export const routeMeta: RouteMeta = { title: 'Get started — Angular Movement' };

@Component({
  selector: 'app-docs-get-started',
  imports: [CodeBlock, InstallCommand, PageHeader],
  template: `
    <article class="max-w-3xl">
      <app-page-header
        title="Get Started"
        description="Install the library and set up your application configuration."
      />

      <div class="docs-prose max-w-none">
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
          Import the directives each component uses — usually one to three. Every directive is
          standalone, so there is nothing else to register.
        </p>

        <div class="my-6 h-80">
          <app-code-block title="my.component.ts" [code]="componentCode"></app-code-block>
        </div>

        <p class="bg-accent/5 border-accent/20 mt-8 rounded-xl border p-4">
          <strong>That's it!</strong> No triggers to set up, no state variables to manage. The
          element will animate automatically when initialized by Angular.
        </p>
      </div>
    </article>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class GetStarted {
  protected readonly configCode = `// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideMovement } from 'angular-movement';

export const appConfig: ApplicationConfig = {
  providers: [
    provideMovement({
      duration: '300ms', // or 300 — numbers are milliseconds
      easing: 'ease-out',
    }),
    // prefers-reduced-motion is honoured automatically — no config needed.
  ]
};`;

  protected readonly componentCode = `// my.component.ts
import { Component } from '@angular/core';
import { MoveEnterDirective } from 'angular-movement';

@Component({
  selector: 'my-component',
  imports: [MoveEnterDirective],
  template: \`
    <div moveEnter="fade-up">
      I animate on enter!
    </div>
  \`
})
export class MyComponent {}`;
}
