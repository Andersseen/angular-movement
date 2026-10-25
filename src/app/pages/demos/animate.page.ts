import type { RouteMeta } from '@analogjs/router';
import {
  DestroyRef,
  inject,
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { MoveAnimateDirective, MoveKeyframeState } from 'movement';
import { DemoWorkbench } from '../../shared/components/demo-workbench/demo-workbench';
import { DemoCodeTabs } from '../../shared/components/demo-workbench/demo-code-tabs';
import { RangeSlider } from '../../shared/components/range-slider/range-slider';

const NATURAL: Record<string, number> = {
  opacity: 1,
  x: 0,
  y: 0,
  scale: 1,
  rotate: 0,
  blur: 0,
};

export const routeMeta: RouteMeta = { title: 'moveAnimate demo — Angular Movement' };

@Component({
  selector: 'app-demo-animate',
  imports: [MoveAnimateDirective, RangeSlider, DemoCodeTabs, DemoWorkbench],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-demo-workbench
      title="moveAnimate"
      description="Compose initial and animate states with individual bindings."
      [canReset]="true"
      (resetRequested)="resetDefaults()"
      [canReplay]="true"
      (replay)="replay()"
    >
      <div controls>
        <div class="space-y-8">
          <!-- Initial State -->
          <div>
            <h4 class="text-text-muted mb-5 text-xs font-semibold tracking-widest uppercase">
              Initial State — starts as
            </h4>
            <div class="space-y-6">
              <app-range-slider
                controlId="opacity"
                label="Opacity"
                [value]="opacity()"
                [min]="0"
                [max]="1"
                [step]="0.05"
                (valueChange)="opacity.set($event)"
              />
              <app-range-slider
                controlId="y-offset"
                label="Y offset"
                unit="px"
                [value]="y()"
                [min]="-100"
                [max]="100"
                [step]="5"
                (valueChange)="y.set($event)"
              />
              <app-range-slider
                controlId="x-offset"
                label="X offset"
                unit="px"
                [value]="x()"
                [min]="-100"
                [max]="100"
                [step]="5"
                (valueChange)="x.set($event)"
              />
              <app-range-slider
                controlId="scale"
                label="Scale"
                [value]="scale()"
                [min]="0"
                [max]="2"
                [step]="0.05"
                (valueChange)="scale.set($event)"
              />
              <app-range-slider
                controlId="rotate"
                label="Rotate"
                unit="°"
                [value]="rotate()"
                [min]="-180"
                [max]="180"
                [step]="15"
                (valueChange)="rotate.set($event)"
              />
              <app-range-slider
                controlId="blur"
                label="Blur"
                unit="px"
                [value]="blur()"
                [min]="0"
                [max]="20"
                [step]="1"
                (valueChange)="blur.set($event)"
              />
            </div>
          </div>

          <!-- Timing -->
          <div class="border-border border-t pt-8">
            <h4 class="text-text-muted mb-5 text-xs font-semibold tracking-widest uppercase">
              Timing
            </h4>
            <div class="space-y-6">
              <app-range-slider
                controlId="duration"
                label="Duration"
                unit="ms"
                [value]="duration()"
                [min]="100"
                [max]="2000"
                [step]="50"
                (valueChange)="duration.set($event)"
              />
              <app-range-slider
                controlId="delay"
                label="Delay"
                unit="ms"
                [value]="delay()"
                [min]="0"
                [max]="1000"
                [step]="50"
                (valueChange)="delay.set($event)"
              />

              <div>
                <div class="mb-3 flex items-end justify-between">
                  <span class="text-text-muted text-sm font-medium">Easing</span>
                  <span class="text-text-subtle font-mono text-xs">{{ easing() }}</span>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  @for (e of easings; track e) {
                    <button
                      (click)="easing.set(e)"
                      [class]="
                        easing() === e
                          ? 'bg-accent-solid border-accent-solid text-white'
                          : 'bg-bg text-text-muted border-border hover:border-accent/50'
                      "
                      class="rounded-lg border py-2 text-center text-sm transition-all"
                    >
                      {{ e }}
                    </button>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div stage class="workbench-preview-content">
        @if (showElement()) {
          <div
            [moveInitial]="initialState()"
            [moveAnimate]="animateState()"
            [moveDuration]="duration()"
            [moveDelay]="delay()"
            [moveEasing]="easing()"
            class="bg-surface border-accent/40 flex w-full max-w-[280px] flex-col items-center justify-center gap-4 rounded-xl border p-6 shadow-[0_0_30px_var(--color-accent-glow)] sm:p-8"
          >
            <div class="bg-accent/20 flex h-16 w-16 items-center justify-center rounded-full">
              <svg
                class="text-accent h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z"
                />
              </svg>
            </div>
            <div class="font-display text-text text-xl font-bold">Custom Animation</div>
            <div class="text-text-muted text-sm">initial → animate</div>
          </div>
        }
      </div>
      <app-demo-code-tabs code [files]="sourceFiles()" />
    </app-demo-workbench>
  `,
})
export default class DemoAnimate {
  #replayTimer: ReturnType<typeof setTimeout> | undefined;
  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.#replayTimer));
  }

  protected readonly opacity = signal(0);
  protected readonly y = signal(30);
  protected readonly x = signal(0);
  protected readonly scale = signal(0.85);
  protected readonly rotate = signal(0);
  protected readonly blur = signal(0);
  protected resetDefaults(): void {
    this.opacity.set(0);
    this.y.set(30);
    this.x.set(0);
    this.scale.set(0.85);
    this.rotate.set(0);
    this.blur.set(0);
    this.duration.set(400);
    this.delay.set(0);
    this.easing.set('ease');
    this.replay();
  }

  protected readonly duration = signal(400);
  protected readonly delay = signal(0);
  protected readonly easing = signal('ease');
  protected readonly showElement = signal(true);
  protected readonly easings = ['ease', 'ease-in', 'ease-out', 'ease-in-out'];

  protected readonly initialState = computed((): MoveKeyframeState => {
    const initial: MoveKeyframeState = {};

    const add = (key: keyof MoveKeyframeState, val: number) => {
      if (val !== NATURAL[key]) {
        initial[key] = val;
      }
    };

    add('opacity', this.opacity());
    add('y', this.y());
    add('x', this.x());
    add('scale', this.scale());
    add('rotate', this.rotate());
    add('blur', this.blur());

    return initial;
  });

  protected readonly animateState = computed((): MoveKeyframeState => {
    const animate: MoveKeyframeState = {};

    for (const key of Object.keys(this.initialState()) as (keyof MoveKeyframeState)[]) {
      animate[key] = NATURAL[key];
    }

    return animate;
  });

  protected readonly sourceFiles = computed(() => [
    { title: 'demo.html', code: this.highlightedCode() },
    {
      title: 'demo.component.ts',
      code: `import { Component } from '@angular/core';
import { MoveAnimateDirective } from 'angular-movement';
@Component({ selector: 'app-demo', imports: [MoveAnimateDirective], templateUrl: './demo.html' })
export class Demo {}`,
    },
  ]);
  protected readonly highlightedCode = computed(() => {
    const init = this.initialState() as Record<string, number>;
    const keys = Object.keys(init);

    if (keys.length === 0) {
      return `// move sliders away from their natural value to compose an animation`;
    }

    const anim = this.animateState() as Record<string, number>;
    const fmtState = (obj: Record<string, number>) =>
      Object.entries(obj)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');

    let code = `<div\n`;
    code += `  [moveInitial]="{ ${fmtState(init)} }"\n`;
    code += `  [moveAnimate]="{ ${fmtState(anim)} }"`;

    if (this.duration() !== 300) {
      code += `\n  moveDuration="${this.duration()}ms"`;
    }
    if (this.delay()) {
      code += `\n  moveDelay="${this.delay()}ms"`;
    }
    if (this.easing() !== 'ease') {
      code += `\n  moveEasing="${this.easing()}"`;
    }

    code += `>\n  Target Element\n</div>`;
    return code;
  });

  protected replay(): void {
    this.showElement.set(false);
    clearTimeout(this.#replayTimer);
    this.#replayTimer = setTimeout(() => this.showElement.set(true), 50);
  }
}
