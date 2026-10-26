import type { RouteMeta } from '@analogjs/router';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  PLATFORM_ID,
  ElementRef,
  inject,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { AnimationControls, MoveAnimator, MoveTriggerDirective } from 'movement';
import { DemoWorkbench } from '../../shared/components/demo-workbench/demo-workbench';
import { DemoCodeTabs } from '../../shared/components/demo-workbench/demo-code-tabs';

const ANIMATOR_CODE = `import { Component, DestroyRef, ElementRef, inject, viewChild } from '@angular/core';
import { AnimationControls, MoveAnimator } from 'angular-movement';

@Component({
  selector: 'app-checkout',
  template: \`
    <button (click)="pulse()">animate()</button>
    <button (click)="dim()">set()</button>
    <button (click)="reset()">clear()</button>
    <div #card>Order confirmed</div>
  \`,
})
export class Checkout {
  readonly #animator = inject(MoveAnimator);
  readonly card = viewChild.required<ElementRef<HTMLElement>>('card');
  #player: AnimationControls | null = null;
  constructor() { inject(DestroyRef).onDestroy(() => this.#player?.cancel()); }
  pulse() {
    this.#player?.cancel();
    this.#player = this.#animator.animate(this.card(), { scale: [1, 1.06, 1] }, { duration: '240ms' });
  }
  dim() { this.#animator.set(this.card(), { opacity: 0.6, y: 8 }); }
  reset() { this.#animator.clear(this.card()); }
}`;

const VIEW_TRANSITION_CODE = `import { Component, ChangeDetectorRef, DestroyRef, inject, signal, ViewEncapsulation } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { AnimationControls, MoveAnimator } from 'angular-movement';

@Component({
  selector: 'app-reveal',
  encapsulation: ViewEncapsulation.None,
  styles: [':root[data-demo-reveal]::view-transition-old(root), :root[data-demo-reveal]::view-transition-new(root) { animation: none; mix-blend-mode: normal; }'],
  template: \`
    <section [style.background]="revealed() ? '#1e1b4b' : '#fff'">
      <button (click)="reveal($event)">Reveal from here</button>
    </section>
  \`,
})
export class RevealDemo {
  readonly #animator = inject(MoveAnimator);
  readonly #document = inject(DOCUMENT);
  readonly #cdr = inject(ChangeDetectorRef);
  readonly revealed = signal(false);
  #player: AnimationControls | null = null;
  #destroyed = false;
  constructor() {
    inject(DestroyRef).onDestroy(() => { this.#destroyed = true; this.#player?.cancel(); });
  }
  reveal(event: MouseEvent) {
    const doc = this.#document;
    const commit = () => {
      if (this.#destroyed) return;
      this.revealed.update(value => !value);
      this.#cdr.detectChanges();
    };
    if (!doc.startViewTransition) return commit();
    const root = doc.documentElement;
    root.setAttribute('data-demo-reveal', '');
    const transition = doc.startViewTransition(commit);
    transition.ready.then(async () => {
      if (this.#destroyed) return;
      const { clientX: x, clientY: y } = event;
      const view = doc.defaultView;
      const radius = Math.hypot(Math.max(x, (view?.innerWidth ?? 0) - x), Math.max(y, (view?.innerHeight ?? 0) - y));
      this.#player = this.#animator.animate(root, {
        clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + radius + 'px at ' + x + 'px ' + y + 'px)'],
      }, { duration: '520ms', easing: 'cubic-bezier(0.22, 1, 0.36, 1)', pseudoElement: '::view-transition-new(root)' });
      await this.#player?.finished;
    }).catch(() => {}).finally(() => root.removeAttribute('data-demo-reveal'));
  }
}`;

const TRIGGER_CODE = `import { Component, DestroyRef, inject } from '@angular/core';
import { MoveTriggerDirective } from 'angular-movement';

@Component({
  selector: 'app-flash',
  imports: [MoveTriggerDirective],
  template: \`
    <div #overlay="moveTrigger" moveTrigger style="opacity: 0; width: 120px; height: 80px; background: indigo"></div>
    <button (click)="flash(overlay)">Flash</button>
  \`,
})
export class FlashDemo {
  #destroyed = false;
  constructor() { inject(DestroyRef).onDestroy(() => { this.#destroyed = true; }); }
  async flash(overlay: MoveTriggerDirective) {
    await overlay.play({ opacity: [0, 1] }, { duration: '420ms' });
    if (this.#destroyed) return;
    await overlay.play({ opacity: [1, 0] }, { duration: '160ms', easing: 'ease-in' });
  }
}`;

type RevealResult = 'idle' | 'animated' | 'skipped' | 'unsupported';

interface ViewTransitionLike {
  ready: Promise<void>;
}

export const routeMeta: RouteMeta = { title: 'MoveAnimator demo — Angular Movement' };

@Component({
  selector: 'app-demo-imperative',
  imports: [DemoWorkbench, DemoCodeTabs, MoveTriggerDirective],
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
    <app-demo-workbench
      title="MoveAnimator"
      description="Animate, set and clear from TypeScript. Try a View Transition reveal or sequence a declarative trigger handle."
      [canReset]="true"
      (resetRequested)="resetAll()"
      [scrollStage]="true"
    >
      <div controls>
        <p class="text-text-muted mb-4 text-sm">
          Animate the order card, commit a state instantly, or clear it.
        </p>
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
        <p class="text-text-muted mt-5 text-sm">
          Reveal and flash actions live beside their targets. Each source tab shows its
          corresponding API.
        </p>
      </div>
      <div stage class="imperative-stage">
        <section>
          <h2>animate / set / clear</h2>
          <div
            #card
            data-testid="animator-card"
            class="bg-accent/10 border-accent/40 text-text mx-auto flex h-28 w-56 items-center justify-center rounded-xl border font-semibold"
          >
            Order confirmed
          </div>
        </section>
        <section>
          <h2>View Transition reveal</h2>
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
        </section>
        <section>
          <h2>moveTrigger · experimental</h2>
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
        </section>
      </div>
      <app-demo-code-tabs
        code
        [files]="[
          { title: 'checkout.ts', code: animatorCode },
          { title: 'theme-reveal.component.ts', code: viewTransitionCode },
          { title: 'flash.component.ts', code: triggerCode },
        ]"
      />
    </app-demo-workbench>
  `,
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DemoImperative {
  readonly #animator = inject(MoveAnimator);
  readonly #document = inject(DOCUMENT);
  readonly #cdr = inject(ChangeDetectorRef);
  #cardPlayer: AnimationControls | null = null;
  #revealPlayer: AnimationControls | null = null;
  #destroyed = false;
  readonly #isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.#destroyed = true;
      this.#cardPlayer?.cancel();
      this.#revealPlayer?.cancel();
      if (this.#isBrowser) this.#document.documentElement.removeAttribute('data-demo-reveal');
    });
  }

  protected readonly card = viewChild.required<ElementRef<HTMLElement>>('card');
  protected readonly revealed = signal(false);
  protected readonly status = signal<RevealResult>('idle');

  protected readonly animatorCode = ANIMATOR_CODE;
  protected readonly viewTransitionCode = VIEW_TRANSITION_CODE;
  protected readonly triggerCode = TRIGGER_CODE;

  protected pulse(): void {
    this.#cardPlayer?.cancel();
    this.#cardPlayer = this.#animator.animate(
      this.card(),
      { scale: [1, 1.06, 1] },
      { duration: '240ms' },
    );
  }

  protected dim(): void {
    this.#animator.set(this.card(), { opacity: 0.6, y: 8 });
  }

  protected resetAll(): void {
    this.reset();
    this.revealed.set(false);
    this.status.set('idle');
  }

  protected reset(): void {
    this.#animator.clear(this.card());
  }

  protected async flash(overlay: MoveTriggerDirective): Promise<void> {
    await overlay.play({ opacity: [0, 1] }, { duration: '420ms' });
    if (this.#destroyed) return;
    await overlay.play({ opacity: [1, 0] }, { duration: '160ms', easing: 'ease-in' });
  }

  protected reveal(event: MouseEvent): void {
    const doc = this.#document as Document & {
      startViewTransition?: (update: () => void) => ViewTransitionLike;
    };
    // The DOM must be updated synchronously inside the transition callback; a zoneless signal
    // write alone would only schedule change detection.
    const commit = () => {
      if (this.#destroyed) return;
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
        if (this.#destroyed) return;
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
        this.#revealPlayer = controls;
        this.status.set(controls ? 'animated' : 'skipped');
        await controls?.finished;
      })
      // `ready` rejects when the browser skips the transition (e.g. a second click); the new state
      // is already committed, so there is nothing to undo.
      .catch(() => this.status.set('skipped'))
      .finally(() => delete root.dataset['demoReveal']);
  }
}
