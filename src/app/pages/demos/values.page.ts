import { ChangeDetectionStrategy, Component, computed, inject, Injector } from '@angular/core';
import { moveSpringValue, moveTransform, moveValue } from 'movement';
import { CodeBlock } from '../../shared/components/code-block/code-block';

const CODE = `import { Component, inject, Injector } from '@angular/core';
import { moveValue, moveTransform, moveSpringValue } from 'angular-movement';

@Component({ /* ... */ })
export class Demo {
  readonly #injector = inject(Injector);

  // 1. A driver signal — anything that produces a number works.
  readonly progress = moveValue(0);

  // 2. Map that number onto whatever the UI needs.
  readonly x       = moveTransform(this.progress, [0, 100], [0, 260]);
  readonly rotate  = moveTransform(this.progress, [0, 100], ['0deg', '360deg']);
  readonly hue     = moveTransform(this.progress, [0, 50, 100], [0.4, 1, 0.4]);

  // 3. Let a spring smooth the raw value instead of following it rigidly.
  readonly springX = moveSpringValue(this.x, {
    stiffness: 170,
    damping: 18,
    injector: this.#injector, // required: moveSpringValue creates an effect
  });
}`;

@Component({
  selector: 'app-demo-values',
  imports: [CodeBlock],
  template: `
    <div class="space-y-8">
      <header class="space-y-3">
        <h1 class="font-display text-text text-3xl font-bold sm:text-4xl">Signal values</h1>
        <p class="text-text-muted max-w-3xl">
          When motion should come from your own state rather than a lifecycle event, drive it with
          signals. <code class="text-accent">moveValue</code> holds a number,
          <code class="text-accent">moveTransform</code> maps it onto any output range, and
          <code class="text-accent">moveSpringValue</code> smooths it with spring physics — all
          plain signals, so they compose with <code class="text-accent">computed</code> and work
          under zoneless change detection.
        </p>
      </header>

      <section class="bg-surface border-accent/30 space-y-8 rounded-xl border p-6">
        <div class="space-y-2">
          <label
            for="values-driver"
            class="text-text-muted flex items-center justify-between text-xs tracking-wider uppercase"
          >
            <span>progress — moveValue(0)</span>
            <span class="text-accent font-bold tabular-nums" data-testid="values-progress">{{
              progress()
            }}</span>
          </label>
          <input
            id="values-driver"
            type="range"
            min="0"
            max="100"
            step="1"
            class="accent-accent w-full cursor-pointer"
            data-testid="values-slider"
            [value]="progress()"
            (input)="onInput($event)"
          />
          <div class="flex gap-2 pt-1">
            <button
              type="button"
              class="bg-accent/10 text-accent hover:bg-accent/20 cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
              data-testid="values-start"
              (click)="progress.set(0)"
            >
              0
            </button>
            <button
              type="button"
              class="bg-accent/10 text-accent hover:bg-accent/20 cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
              data-testid="values-end"
              (click)="progress.set(100)"
            >
              100
            </button>
          </div>
        </div>

        <!-- Raw vs spring: the whole point of moveSpringValue is visible in the lag -->
        <div class="space-y-6">
          <div class="space-y-2">
            <div class="text-text-muted text-xs tracking-wider uppercase">
              moveTransform — follows the slider exactly
            </div>
            <div class="bg-surface-raised relative h-16 overflow-hidden rounded-lg">
              <div
                class="bg-accent absolute top-1/2 left-2 h-10 w-10 -translate-y-1/2 rounded-lg"
                data-testid="values-linear-box"
                [style.transform]="linearTransform()"
                [style.opacity]="fade()"
              ></div>
            </div>
          </div>

          <div class="space-y-2">
            <div class="text-text-muted text-xs tracking-wider uppercase">
              moveSpringValue — same input, settles with physics
            </div>
            <div class="bg-surface-raised relative h-16 overflow-hidden rounded-lg">
              <div
                class="bg-accent/70 border-accent absolute top-1/2 left-2 h-10 w-10 -translate-y-1/2 rounded-lg border-2"
                data-testid="values-spring-box"
                [style.transform]="springTransform()"
              ></div>
            </div>
          </div>
        </div>

        <dl class="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          @for (readout of readouts(); track readout.label) {
            <div class="bg-surface-raised rounded-lg p-3">
              <dt class="text-text-muted text-xs tracking-wider uppercase">{{ readout.label }}</dt>
              <dd class="text-text font-medium tabular-nums">{{ readout.value }}</dd>
            </div>
          }
        </dl>
      </section>

      <app-code-block title="values.component.ts" [code]="code" />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DemoValues {
  readonly #injector = inject(Injector);

  protected readonly code = CODE;

  protected readonly progress = moveValue(0);

  protected readonly x = moveTransform(this.progress, [0, 100], [0, 260]);
  protected readonly rotate = moveTransform(this.progress, [0, 100], ['0deg', '360deg']);
  protected readonly fade = moveTransform(this.progress, [0, 50, 100], [0.4, 1, 0.4]);

  protected readonly springX = moveSpringValue(this.x, {
    stiffness: 170,
    damping: 18,
    injector: this.#injector,
  });

  protected readonly linearTransform = computed(
    () => `translate(${this.x()}px, -50%) rotate(${this.rotate()})`,
  );

  protected readonly springTransform = computed(
    () => `translate(${this.springX()}px, -50%) rotate(${this.rotate()})`,
  );

  protected readonly readouts = computed(() => [
    { label: 'progress', value: this.progress().toFixed(0) },
    { label: 'x', value: `${this.x().toFixed(1)}px` },
    { label: 'springX', value: `${this.springX().toFixed(1)}px` },
    { label: 'rotate', value: this.rotate() },
  ]);

  protected onInput(event: Event): void {
    this.progress.set(Number((event.target as HTMLInputElement).value));
  }
}
