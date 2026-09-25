import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { MoveAnimator, MoveTriggerDirective } from 'movement';
import { CodeBlock } from '../../shared/components/code-block/code-block';

const ANIMATOR_CODE = `import { Component, ElementRef, inject, viewChild } from '@angular/core';
import { MoveAnimator } from 'angular-movement';

@Component({ /* ... */ })
export class Checkout {
  readonly #animator = inject(MoveAnimator);
  readonly card = viewChild.required<ElementRef<HTMLElement>>('card');

  async confirm() {
    // ElementRef or Element — no .nativeElement needed.
    await this.#animator.animate(this.card(), { scale: [1, 1.04, 1] }, { duration: '240ms' })
      ?.finished;
    // finished always resolves, also when cancelled: no try/catch.
    this.#animator.set(this.card(), { opacity: 0.6, y: 8 }); // commit a state instantly
  }

  reset() {
    this.#animator.clear(this.card()); // back to the stylesheet
  }
}`;

const VIEW_TRANSITION_CODE = `readonly #animator = inject(MoveAnimator);
readonly #document = inject(DOCUMENT);

reveal(event: MouseEvent, commit: () => void) {
  const doc = this.#document;
  if (!doc.startViewTransition) return commit(); // progressive enhancement

  const transition = doc.startViewTransition(commit);
  transition.ready.then(() => {
    const { clientX: x, clientY: y } = event;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

    this.#animator.animate(
      doc.documentElement,
      { clipPath: [\`circle(0px at \${x}px \${y}px)\`, \`circle(\${radius}px at \${x}px \${y}px)\`] },
      {
        duration: '520ms',
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        pseudoElement: '::view-transition-new(root)',
      },
    );
  });
}

/* global CSS — turn off the default cross-fade while this reveal runs */
::view-transition-old(root),
::view-transition-new(root) { animation: none; mix-blend-mode: normal; }`;

const TRIGGER_CODE = `<!-- A bare moveTrigger is an imperative handle: no dummy inputs. -->
<div #overlay="moveTrigger" moveTrigger></div>

// Two phases, two timings — per-call options, no input mutation.
await overlay.play({ opacity: [0, 1], scale: [0.6, 1] }, { duration: '420ms' });
await overlay.play({ opacity: [1, 0] }, { duration: '160ms', easing: 'ease-in' });`;

type RevealResult = 'idle' | 'animated' | 'skipped' | 'unsupported';

interface ViewTransitionLike {
  ready: Promise<void>;
}

@Component({
  selector: 'app-demo-imperative',
  imports: [CodeBlock, MoveTriggerDirective],
  encapsulation: ViewEncapsulation.None,
  styles: `
    /* Scoped to this demo's own transition, so no other page loses the default cross-fade. */
    :root[data-demo-reveal]::view-transition-old(root),
    :root[data-demo-reveal]::view-transition-new(root) {
      animation: none;
      mix-blend-mode: normal;
    }
  `,
  template: `
    <div class="space-y-10">
      <header class="space-y-3">
        <h1 class="font-display text-text text-3xl font-bold sm:text-4xl">MoveAnimator</h1>
        <p class="text-text-muted max-w-3xl">
          The imperative API: animate from TypeScript with the same keyframes, timing vocabulary and
          reduced-motion handling as the directives. Use it to sequence phases, react to a server
          response, or drive a View Transition. For a declarative relationship between two template
          elements, see <code class="text-accent">moveTarget</code>.
        </p>
      </header>

      <section class="space-y-4">
        <h2 class="font-display text-text text-2xl font-bold">animate / set / clear</h2>
        <div class="bg-surface border-accent/30 flex flex-col gap-6 rounded-xl border p-6">
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="bg-accent/10 text-accent hover:bg-accent/20 cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
              data-testid="animator-animate"
              (click)="pulse()"
            >
              animate()
            </button>
            <button
              type="button"
              class="bg-accent/10 text-accent hover:bg-accent/20 cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
              data-testid="animator-set"
              (click)="dim()"
            >
              set()
            </button>
            <button
              type="button"
              class="bg-accent/10 text-accent hover:bg-accent/20 cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
              data-testid="animator-clear"
              (click)="reset()"
            >
              clear()
            </button>
          </div>
          <div
            #card
            data-testid="animator-card"
            class="bg-accent/10 border-accent/40 text-text mx-auto flex h-28 w-56 items-center justify-center rounded-xl border font-semibold"
          >
            Order confirmed
          </div>
        </div>
        <app-code-block title="checkout.ts" [code]="animatorCode" />
      </section>

      <section class="space-y-4">
        <h2 class="font-display text-text text-2xl font-bold">View Transition reveal</h2>
        <p class="text-text-muted max-w-3xl">
          <code class="text-accent">pseudoElement</code> lets the same API animate
          <code class="text-accent">::view-transition-new(root)</code>, so a theme reveal stays
          inside your motion system instead of dropping to raw WAAPI. Browsers without View
          Transitions simply swap instantly; under reduced motion the pseudo-element animation is
          skipped and the new state appears at once.
        </p>
        <div
          data-testid="reveal-panel"
          class="flex flex-col items-center gap-4 rounded-xl border p-8 transition-none"
          [class]="
            revealed()
              ? 'border-transparent bg-[#1e1b4b] text-white'
              : 'border-accent/30 bg-surface text-text'
          "
        >
          <p class="font-display text-xl font-bold">{{ revealed() ? 'Midnight' : 'Daylight' }}</p>
          <button
            type="button"
            class="bg-accent/10 text-accent hover:bg-accent/20 cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
            data-testid="reveal-toggle"
            (click)="reveal($event)"
          >
            Reveal from here
          </button>
          <p class="text-xs opacity-70">
            last run: <span data-testid="reveal-status">{{ status() }}</span>
          </p>
        </div>
        <app-code-block title="theme-reveal.ts" [code]="viewTransitionCode" />
      </section>

      <section class="space-y-4">
        <h2 class="font-display text-text text-2xl font-bold">moveTrigger as a handle</h2>
        <div
          class="bg-surface border-accent/30 relative flex h-40 items-center justify-center overflow-hidden rounded-xl border"
        >
          <div
            #overlay="moveTrigger"
            moveTrigger
            data-testid="trigger-overlay"
            class="bg-accent/30 pointer-events-none absolute inset-0 opacity-0"
          ></div>
          <button
            type="button"
            class="bg-accent/10 text-accent hover:bg-accent/20 relative cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
            data-testid="trigger-flash"
            (click)="flash(overlay)"
          >
            Flash (420ms in, 160ms out)
          </button>
        </div>
        <app-code-block title="flash.html" [code]="triggerCode" />
      </section>
    </div>
  `,
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DemoImperative {
  readonly #animator = inject(MoveAnimator);
  readonly #document = inject(DOCUMENT);
  readonly #cdr = inject(ChangeDetectorRef);

  protected readonly card = viewChild.required<ElementRef<HTMLElement>>('card');
  protected readonly revealed = signal(false);
  protected readonly status = signal<RevealResult>('idle');

  protected readonly animatorCode = ANIMATOR_CODE;
  protected readonly viewTransitionCode = VIEW_TRANSITION_CODE;
  protected readonly triggerCode = TRIGGER_CODE;

  protected pulse(): void {
    this.#animator.animate(this.card(), { scale: [1, 1.06, 1] }, { duration: '240ms' });
  }

  protected dim(): void {
    this.#animator.set(this.card(), { opacity: 0.6, y: 8 });
  }

  protected reset(): void {
    this.#animator.clear(this.card());
  }

  protected async flash(overlay: MoveTriggerDirective): Promise<void> {
    await overlay.play({ opacity: [0, 1] }, { duration: '420ms' });
    await overlay.play({ opacity: [1, 0] }, { duration: '160ms', easing: 'ease-in' });
  }

  protected reveal(event: MouseEvent): void {
    const doc = this.#document as Document & {
      startViewTransition?: (update: () => void) => ViewTransitionLike;
    };
    // The DOM must be updated synchronously inside the transition callback; a zoneless signal
    // write alone would only schedule change detection.
    const commit = () => {
      this.revealed.update((value) => !value);
      this.#cdr.detectChanges();
    };

    if (typeof doc.startViewTransition !== 'function') {
      commit();
      this.status.set('unsupported');
      return;
    }

    const root = doc.documentElement;
    root.dataset['demoReveal'] = '';
    const transition = doc.startViewTransition(commit);

    transition.ready
      .then(async () => {
        const { clientX: x, clientY: y } = event;
        const view = doc.defaultView ?? window;
        const radius = Math.hypot(
          Math.max(x, view.innerWidth - x),
          Math.max(y, view.innerHeight - y),
        );

        const controls = this.#animator.animate(
          root,
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          {
            duration: '520ms',
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            pseudoElement: '::view-transition-new(root)',
          },
        );
        this.status.set(controls ? 'animated' : 'skipped');
        await controls?.finished;
      })
      // `ready` rejects when the browser skips the transition (e.g. a second click); the new state
      // is already committed, so there is nothing to undo.
      .catch(() => this.status.set('skipped'))
      .finally(() => delete root.dataset['demoReveal']);
  }
}
