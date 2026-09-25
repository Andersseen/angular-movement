import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CodeBlock } from '../../shared/components/code-block/code-block';

const PRODUCT_CARD = `import { MoveHoverDirective, MoveInViewDirective } from 'angular-movement';

@Component({
  imports: [MoveInViewDirective, MoveHoverDirective],
  template: \`
    <article moveInView="fade-up" moveWhileHover="lift">
      …
    </article>
  \`,
})
export class ProductCard {}`;

const BUTTON = `<!-- lift = 4px rise (translate), press = 3% scale-down (scale).
     Separate channels, so they compose on one element. -->
<button moveWhileHover="lift" moveWhileTap="press">Buy now</button>

<!-- Links too: touch taps and scrolls behave natively. -->
<a routerLink="/pricing" moveWhileHover="lift" moveWhileTap="press">Pricing</a>`;

const STAGGERED_GRID = `<ul moveStagger moveStaggerStep="80ms">
  @for (item of items(); track item.id) {
    <li moveInView="fade-up">{{ item.label }}</li>
  }
</ul>`;

const IMPERATIVE = `import { Component, ElementRef, inject, viewChild } from '@angular/core';
import { MoveAnimator } from 'angular-movement';

export class Toast {
  readonly #animator = inject(MoveAnimator);
  readonly toast = viewChild.required<ElementRef<HTMLElement>>('toast');

  async dismiss() {
    await this.#animator.animate(this.toast(), { opacity: [1, 0], y: [0, 12] }, { duration: '180ms' })
      ?.finished; // always resolves — also when cancelled
    this.remove();
  }
}`;

const VIEW_TRANSITION = `const transition = document.startViewTransition(() => commitTheme());
await transition.ready;

animator.animate(
  document.documentElement,
  { clipPath: ['circle(0px at 40px 40px)', 'circle(1500px at 40px 40px)'] },
  { duration: '520ms', pseudoElement: '::view-transition-new(root)' },
);`;

const TIMING = `<!-- Numbers are always milliseconds. Strings say their unit. -->
<ul moveStagger moveStaggerStep="80ms">…</ul>   <!-- 80ms -->
<ul moveStagger moveStaggerStep="0.08s">…</ul>  <!-- 80ms -->
<ul moveStagger [moveStaggerStep]="80">…</ul>   <!-- 80ms -->

<!-- ✗ 0.08 milliseconds — almost certainly meant seconds. Dev mode warns:
     'moveStaggerStep received 0.08 … Did you mean "80ms" or "0.08s"?' -->
<ul moveStagger [moveStaggerStep]="0.08">…</ul>

// Same vocabulary in TypeScript:
provideMovement({ duration: '320ms' });
animator.animate(el, frames, { duration: '0.18s', delay: 40 });`;

const REDUCED_LAYERS = `// ✓ Nothing to do for reduced motion — this already honours the OS setting.
provideMovement({ duration: '320ms', easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });

// ✗ Not needed: it duplicates what the library does, and freezes the value at startup.
provideMovement({ disabled: matchMedia('(prefers-reduced-motion: reduce)').matches });

// ✗ Not needed either: every directive is already a no-op on the server.
provideMovement({ disabled: true }); // in app.config.server.ts

// ✓ disabled is an app-level kill switch — a user setting, a screenshot test run.
provideMovement({ disabled: settings.animationsOff });`;

const REDUCED_ELEMENT = `<!-- Per element: moveDisabled turns one animation into an instant jump. -->
<div moveEnter="fade-up" [moveDisabled]="isFirstRender()">…</div>`;

const CSS_FIRST_PAINT = `/* Above-the-fold entrance that must exist before hydration → CSS. */
.hero { animation: hero-in 600ms cubic-bezier(0.16, 1, 0.3, 1) both; }
@keyframes hero-in { from { opacity: 0; translate: 0 16px; } }
@media (prefers-reduced-motion: reduce) { .hero { animation: none; } }`;

const ARBITRARY_CSS = `<!-- Any property WAAPI can animate works — no allow-list. -->
<div [moveEnter]="{ clipPath: ['inset(0 100% 0 0)', 'inset(0 0% 0 0)'] }">Wipe</div>
<img [moveWhileHover]="{ filter: ['saturate(0.6)', 'saturate(1)'] }" />
<div [moveTarget]="open()" [moveFrames]="{ borderRadius: ['24px', '8px'] }">…</div>`;

const CANCELLATION = `// finished always resolves — natural finish, cancel(), a second play() replacing the
// first, the owner being destroyed, a skipped View Transition. It never rejects.
await animator.animate(panel, expand, { duration: '420ms' })?.finished;
commit(); // runs in every case — no try/catch needed

// It does not say *how* the animation ended. When that matters, track it yourself:
const run = ++this.#run;
await animator.animate(panel, expand)?.finished;
if (run !== this.#run) return; // a newer run took over`;

const IF_WRONG = `<!-- ✗ @if removes the node immediately — there is nothing left to animate -->
@if (isOpen()) {
  <div [moveLeave]="{ opacity: [1, 0] }">Panel</div>
}`;

const IF_RIGHT = `<!-- ✓ *movePresence keeps the view alive until the leave animation finishes -->
<ng-container *movePresence="isOpen()">
  <div [moveEnter]="{ opacity: [0, 1] }" [moveLeave]="{ opacity: [1, 0] }">Panel</div>
</ng-container>`;

const FOR_CODE = `<!-- moveStagger computes each child's delay from its DOM order -->
<ul moveStagger moveStaggerStep="60ms" moveStaggerDirection="first">
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

const STANDALONE_NARROW = `import { MoveHoverDirective, MoveTapDirective } from 'angular-movement';

@Component({
  imports: [MoveHoverDirective, MoveTapDirective], // exactly what the template uses
  template: \`<button moveWhileHover="lift" moveWhileTap="press">Save</button>\`,
})
export class SaveButton {}`;

const STANDALONE_ALL = `import { MOVEMENT_DIRECTIVES } from 'angular-movement';

@Component({
  // All 21 directives, experimental ones included — fine in a playground,
  // but it hides what the component depends on.
  imports: [...MOVEMENT_DIRECTIVES],
})
export class Playground {}`;

@Component({
  selector: 'app-docs-patterns',
  imports: [CodeBlock, RouterLink],
  template: `
    <article class="max-w-4xl">
      <header class="mb-10 space-y-3">
        <h1 class="font-display text-text text-3xl font-bold sm:text-4xl">Angular patterns</h1>
        <p class="text-text-muted">
          The patterns real apps reach for most — hover and press feedback, reveal-on-scroll,
          staggered lists, imperative animation — followed by how the library behaves alongside the
          Angular features you already use. Where there is a common mistake, it is stated first.
        </p>
      </header>

      <section class="mb-12 space-y-6">
        <h2 class="font-display text-text text-2xl font-bold">Common patterns</h2>

        <div class="space-y-3">
          <h3 class="font-display text-text text-lg font-bold">Product card</h3>
          <p class="text-text-muted">
            Reveal once when scrolled into view, lift on hover. Import the two directives the
            component uses.
          </p>
          <app-code-block title="product-card.ts" [code]="productCard" />
        </div>

        <div class="space-y-3">
          <h3 class="font-display text-text text-lg font-bold">Button interaction</h3>
          <p class="text-text-muted">
            <code class="text-accent">lift</code> and <code class="text-accent">press</code> are the
            two interaction presets. Hover only responds to a mouse or pen — a finger has no hover
            state — so pair it with <code class="text-accent">moveWhileTap</code> for touch
            feedback. Neither directive calls <code class="text-accent">preventDefault()</code>.
          </p>
          <app-code-block title="buttons.html" [code]="button" />
        </div>

        <div class="space-y-3">
          <h3 class="font-display text-text text-lg font-bold">Staggered grid</h3>
          <app-code-block title="grid.html" [code]="staggeredGrid" />
        </div>

        <div class="space-y-3">
          <h3 class="font-display text-text text-lg font-bold">Imperative animation</h3>
          <p class="text-text-muted">
            <code class="text-accent">MoveAnimator</code> is the TypeScript API. It takes an
            <code class="text-accent">Element</code> or the
            <code class="text-accent">ElementRef</code> from
            <code class="text-accent">viewChild()</code>, and adds
            <code class="text-accent">set()</code> / <code class="text-accent">clear()</code> for
            committing or removing a state without hand-writing styles.
          </p>
          <app-code-block title="toast.ts" [code]="imperative" />
        </div>

        <div class="space-y-3">
          <h3 class="font-display text-text text-lg font-bold">View Transition</h3>
          <p class="text-text-muted">
            <code class="text-accent">pseudoElement</code> animates
            <code class="text-accent">::view-transition-new(root)</code> (or any pseudo-element)
            through the same API. Unsupported browsers get a no-op, and under reduced motion the
            pseudo-element animation is skipped while your DOM change still applies.
            <a routerLink="/demos/imperative" class="text-accent underline">Live demo</a>.
          </p>
          <app-code-block title="theme-reveal.ts" [code]="viewTransition" />
        </div>
      </section>

      <section class="mb-12 space-y-4">
        <h2 class="font-display text-text text-2xl font-bold">Timing units</h2>
        <p class="text-text-muted">
          Every duration, delay and stagger accepts a <code class="text-accent">MoveTime</code>: a
          number is milliseconds, and a string can say <code class="text-accent">"80ms"</code> or
          <code class="text-accent">"0.08s"</code>. On static attributes, write the unit — it reads
          unambiguously.
        </p>
        <app-code-block title="timing.html" [code]="timing" />
      </section>

      <section class="mb-12 space-y-4">
        <h2 class="font-display text-text text-2xl font-bold">Reduced motion</h2>
        <p class="text-text-muted">
          Three layers, strongest first. The OS preference always wins; you only configure the other
          two when your app has its own reason to.
        </p>
        <ol class="text-text-muted list-decimal space-y-2 pl-6">
          <li>
            <strong class="text-text">OS <code>prefers-reduced-motion</code> — automatic.</strong>
            Every directive and <code class="text-accent">MoveAnimator</code> jump straight to the
            end state, including scroll-linked and parallax motion.
          </li>
          <li>
            <strong class="text-text"
              ><code>provideMovement(&#123; disabled &#125;)</code> — app kill switch.</strong
            >
            For app-owned reasons: a user setting, visual regression tests.
          </li>
          <li>
            <strong class="text-text"
              ><code>moveDisabled</code> / <code>disabled</code> — one animation.</strong
            >
            Per element or per <code class="text-accent">animate()</code> call.
          </li>
        </ol>
        <app-code-block title="app.config.ts" [code]="reducedLayers" />
        <app-code-block title="element.html" [code]="reducedElement" />
        <p class="text-text-muted text-sm">
          Avoid a starting style that only an animation undoes (<code
            >.card &#123; opacity: 0 &#125;</code
          >): users with reduced motion would never see the element.
        </p>
      </section>

      <section class="mb-12 space-y-4">
        <h2 class="font-display text-text text-2xl font-bold">When CSS is the better tool</h2>
        <p class="text-text-muted">
          Angular Movement runs after hydration, so it cannot animate the first paint. For an
          above-the-fold entrance that must be in motion before the app boots, use a CSS animation.
          Use the library for everything that happens once the app is running: interaction,
          reveal-on-scroll, presence, state changes, imperative sequences.
        </p>
        <app-code-block title="hero.css" [code]="cssFirstPaint" />
      </section>

      <section class="mb-12 space-y-4">
        <h2 class="font-display text-text text-2xl font-bold">Any CSS property</h2>
        <p class="text-text-muted">
          Keyframes are typed for the common shorthands (<code class="text-accent">x</code>,
          <code class="text-accent">y</code>, <code class="text-accent">scale</code>,
          <code class="text-accent">blur</code>, …), and any other property passes straight through
          to the Web Animations API.
        </p>
        <app-code-block title="passthrough.html" [code]="arbitraryCss" />
      </section>

      <section class="mb-12 space-y-4">
        <h2 class="font-display text-text text-2xl font-bold">Awaiting and cancellation</h2>
        <p class="text-text-muted">
          Unlike raw WAAPI, whose <code class="text-accent">finished</code> rejects on cancel,
          Angular Movement's <code class="text-accent">finished</code> (and
          <code class="text-accent">moveTrigger.play()</code>) always resolve.
        </p>
        <app-code-block title="sequence.ts" [code]="cancellation" />
      </section>

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

      <section class="space-y-4">
        <h2 class="font-display text-text text-2xl font-bold">Standalone imports</h2>
        <p class="text-text-muted">
          There is no NgModule. Import the directives a component uses — usually one to three.
          <code class="text-accent">MOVEMENT_DIRECTIVES</code> still works, but it pulls in all 21
          (experimental ones included) and hides the component's real dependencies.
        </p>
        <div class="grid gap-4 lg:grid-cols-2">
          <app-code-block title="save-button.ts" [code]="standaloneNarrow" />
          <app-code-block title="playground.ts" [code]="standaloneAll" />
        </div>
      </section>
    </article>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DocsPatterns {
  protected readonly productCard = PRODUCT_CARD;
  protected readonly button = BUTTON;
  protected readonly staggeredGrid = STAGGERED_GRID;
  protected readonly imperative = IMPERATIVE;
  protected readonly viewTransition = VIEW_TRANSITION;
  protected readonly timing = TIMING;
  protected readonly reducedLayers = REDUCED_LAYERS;
  protected readonly reducedElement = REDUCED_ELEMENT;
  protected readonly cssFirstPaint = CSS_FIRST_PAINT;
  protected readonly arbitraryCss = ARBITRARY_CSS;
  protected readonly cancellation = CANCELLATION;
  protected readonly ifWrong = IF_WRONG;
  protected readonly ifRight = IF_RIGHT;
  protected readonly forCode = FOR_CODE;
  protected readonly forTrack = FOR_TRACK;
  protected readonly ssrCode = SSR_CODE;
  protected readonly ssrLayout = SSR_LAYOUT;
  protected readonly standaloneNarrow = STANDALONE_NARROW;
  protected readonly standaloneAll = STANDALONE_ALL;
}
