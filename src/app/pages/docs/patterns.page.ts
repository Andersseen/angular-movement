import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlock } from '../../shared/components/code-block/code-block';

const IF_WRONG = `<!-- ✗ @if removes the node immediately — there is nothing left to animate -->
@if (isOpen()) {
  <div [moveLeave]="{ opacity: [1, 0] }">Panel</div>
}`;

const IF_RIGHT = `<!-- ✓ *movePresence keeps the view alive until the leave animation finishes -->
<ng-container *movePresence="isOpen()">
  <div [moveEnter]="{ opacity: [0, 1] }" [moveLeave]="{ opacity: [1, 0] }">Panel</div>
</ng-container>`;

const FOR_CODE = `<!-- moveStagger computes each child's delay from its DOM order -->
<ul [moveStagger]="60" moveStaggerDirection="first">
  @for (item of items(); track item.id) {
    <li [moveEnter]="{ opacity: [0, 1], y: [16, 0] }">{{ item.label }}</li>
  }
</ul>`;

const FOR_TRACK = `// ✗ track by index: Angular reuses DOM nodes, so reordering does not re-run
//   enter animations and moveLayout sees no position change.
@for (item of items(); track $index) { … }

// ✓ track by a stable identity
@for (item of items(); track item.id) { … }`;

const SSR_CODE = `// Nothing to configure: every directive no-ops on the server and plays after hydration.
// If you write your own motion around the library, guard it the same way.
import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';

const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));`;

const SSR_LAYOUT = `<!-- Avoid hiding content in CSS and relying on an animation to reveal it: the
     server renders that state, and users with reduced motion never see it change. -->
<div [moveEnter]="{ opacity: [0, 1] }">Visible in the SSR payload</div>`;

const STANDALONE_ALL = `import { MOVEMENT_DIRECTIVES } from 'angular-movement';

@Component({
  imports: [...MOVEMENT_DIRECTIVES], // convenient while exploring
  template: \`<h2 [move]="'fade-up'">Hello</h2>\`,
})
export class ExploringComponent {}`;

const STANDALONE_NARROW = `import { MoveAnimateDirective, MoveHoverDirective } from 'angular-movement';

@Component({
  imports: [MoveAnimateDirective, MoveHoverDirective], // ship only what you use
  template: \`
    <h2 [move]="'fade-up'">Hello</h2>
    <button [moveWhileHover]="{ scale: [1, 1.05] }">Hover</button>
  \`,
})
export class ProductionComponent {}`;

const REDUCED_CODE = `// Motion is suppressed automatically when the OS setting is on — you do not
// need to check it yourself. Directives skip animating and leave the element in
// its resting state.
//
// The one thing to avoid is a starting style that only an animation undoes:
//   .card { opacity: 0 }  ✗  stays invisible for those users`;

@Component({
  selector: 'app-docs-patterns',
  imports: [CodeBlock],
  template: `
    <article class="max-w-4xl">
      <header class="mb-10 space-y-3">
        <h1 class="font-display text-text text-3xl font-bold sm:text-4xl">Angular patterns</h1>
        <p class="text-text-muted">
          How the library behaves alongside the Angular features you already use — control flow,
          server rendering, standalone imports and motion preferences. Each section states the
          failure mode first, because that is what people hit.
        </p>
      </header>

      <section class="mb-12 space-y-4">
        <h2 class="font-display text-text text-2xl font-bold">&#64;if and leave animations</h2>
        <p class="text-text-muted">
          This is the single most common surprise.
          <code class="text-accent">&#64;if</code> destroys the view synchronously, so by the time a
          leave animation could run, the element is already gone. The directive is not broken —
          there is simply no node left.
        </p>
        <div class="grid gap-4 lg:grid-cols-2">
          <app-code-block title="does not animate.html" [code]="ifWrong" />
          <app-code-block title="works.html" [code]="ifRight" />
        </div>
        <p class="text-text-muted text-sm">
          <code class="text-accent">*movePresence</code> holds the view in the DOM, waits for every
          registered child's leave animation, and only then removes it.
        </p>
      </section>

      <section class="mb-12 space-y-4">
        <h2 class="font-display text-text text-2xl font-bold">&#64;for and stagger</h2>
        <p class="text-text-muted">
          <code class="text-accent">moveStagger</code> derives each child's delay from its position
          in the DOM, so it works with <code class="text-accent">&#64;for</code> without any manual
          index bookkeeping.
        </p>
        <app-code-block title="list.html" [code]="forCode" />
        <p class="text-text-muted">
          Your <code class="text-accent">track</code> expression matters more than it looks:
        </p>
        <app-code-block title="track.ts" [code]="forTrack" />
      </section>

      <section class="mb-12 space-y-4">
        <h2 class="font-display text-text text-2xl font-bold">Server-side rendering</h2>
        <p class="text-text-muted">
          Every directive is a no-op on the server and starts after hydration. There is no
          configuration and no <code class="text-accent">&#64;defer</code> needed — the content is
          in the SSR payload, which is what you want for SEO.
        </p>
        <app-code-block title="ssr.ts" [code]="ssrCode" />
        <app-code-block title="layout.html" [code]="ssrLayout" />
      </section>

      <section class="mb-12 space-y-4">
        <h2 class="font-display text-text text-2xl font-bold">Standalone imports</h2>
        <p class="text-text-muted">
          There is no NgModule. Import the directives a component actually uses —
          <code class="text-accent">MOVEMENT_DIRECTIVES</code> is handy while exploring, but naming
          the two or three you need keeps route-level tree-shaking effective.
        </p>
        <div class="grid gap-4 lg:grid-cols-2">
          <app-code-block title="exploring.ts" [code]="standaloneAll" />
          <app-code-block title="production.ts" [code]="standaloneNarrow" />
        </div>
      </section>

      <section class="space-y-4">
        <h2 class="font-display text-text text-2xl font-bold">Reduced motion</h2>
        <p class="text-text-muted">
          The library respects <code class="text-accent">prefers-reduced-motion</code> everywhere,
          including scroll-linked and parallax motion.
        </p>
        <app-code-block title="reduced-motion.ts" [code]="reducedCode" />
      </section>
    </article>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DocsPatterns {
  protected readonly ifWrong = IF_WRONG;
  protected readonly ifRight = IF_RIGHT;
  protected readonly forCode = FOR_CODE;
  protected readonly forTrack = FOR_TRACK;
  protected readonly ssrCode = SSR_CODE;
  protected readonly ssrLayout = SSR_LAYOUT;
  protected readonly standaloneAll = STANDALONE_ALL;
  protected readonly standaloneNarrow = STANDALONE_NARROW;
  protected readonly reducedCode = REDUCED_CODE;
}
