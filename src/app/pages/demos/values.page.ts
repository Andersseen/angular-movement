import type { RouteMeta } from '@analogjs/router';
import { ChangeDetectionStrategy, Component, computed, inject, Injector } from '@angular/core';
import { moveSpringValue, moveTransform, moveValue } from 'movement';
import { DemoWorkbench } from '../../shared/components/demo-workbench/demo-workbench';
import { CodeBlock } from '../../shared/components/code-block/code-block';

const CODE = `import { Component, computed, inject, Injector } from '@angular/core';
import { moveValue, moveTransform, moveSpringValue } from 'angular-movement';

@Component({
  selector: 'app-values',
  template: \`
    <label>Progress
      <input type="range" min="0" max="100" [value]="progress()"
        (input)="progress.set(+$any($event.target).value)" />
    </label>
    <div style="height: 64px; position: relative">
      <div [style.transform]="linearTransform()" [style.opacity]="fade()"
        style="width: 40px; height: 40px; background: indigo"></div>
    </div>
    <div [style.transform]="springTransform()"
      style="width: 40px; height: 40px; background: slateblue"></div>
  \`,
})
export class Demo {
  readonly progress = moveValue(0);
  readonly x = moveTransform(this.progress, [0, 100], [0, 200]);
  readonly rotate = moveTransform(this.progress, [0, 100], ['0deg', '360deg']);
  readonly fade = moveTransform(this.progress, [0, 50, 100], [0.4, 1, 0.4]);
  readonly springX = moveSpringValue(this.x, {
    stiffness: 170, damping: 18, injector: inject(Injector),
  });
  readonly linearTransform = computed(() =>
    'translate(' + this.x() + 'px, -50%) rotate(' + this.rotate() + ')');
  readonly springTransform = computed(() =>
    'translate(' + this.springX() + 'px, -50%) rotate(' + this.rotate() + ')');
}`;

export const routeMeta: RouteMeta = {
  title: 'moveValue and moveTransform demo — Angular Movement',
};

@Component({
  selector: 'app-demo-values',
  imports: [CodeBlock, DemoWorkbench],
  template: `
    <app-demo-workbench
      title="Signal values"
      description="Drive motion with moveValue, map it with moveTransform, and smooth it with moveSpringValue. Compare direct state with spring response."
      [canReset]="true"
      (resetRequested)="progress.set(0)"
    >
      <div controls>
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
      <div stage class="w-full max-w-2xl">
        <!-- Raw vs spring: the whole point of moveSpringValue is visible in the lag -->
        <div class="space-y-6">
          <div class="space-y-2">
            <div class="text-text-muted text-xs tracking-wider uppercase">
              moveTransform — follows the slider exactly
            </div>
            <div class="bg-surface-raised relative h-16 overflow-hidden rounded-lg">
              <div
                class="bg-accent absolute top-1/2 left-2 h-10 w-10 rounded-lg"
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
                class="bg-accent/70 border-accent absolute top-1/2 left-2 h-10 w-10 rounded-lg border-2"
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
      </div>
      <app-code-block code title="values.component.ts" [code]="code" />
    </app-demo-workbench>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DemoValues {
  readonly #injector = inject(Injector);

  protected readonly code = CODE;

  protected readonly progress = moveValue(0);

  protected readonly x = moveTransform(this.progress, [0, 100], [0, 200]);
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
