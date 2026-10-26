import type { RouteMeta } from '@analogjs/router';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MoveAnimationDirective, MoveAnimationConfig, MovePresenceDirective } from 'movement';
import { DemoWorkbench } from '../../shared/components/demo-workbench/demo-workbench';
import { DemoCodeTabs } from '../../shared/components/demo-workbench/demo-code-tabs';

export const routeMeta: RouteMeta = { title: 'moveAnimation demo — Angular Movement' };

@Component({
  selector: 'app-demo-animation',
  imports: [
    FormsModule,
    MoveAnimationDirective,
    MovePresenceDirective,
    DemoCodeTabs,
    DemoWorkbench,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-demo-workbench
      title="moveAnimation"
      description="Define initial, animate and exit states. Only properties shared by initial and animate are interpolated."
      [canReset]="true"
      (resetRequested)="resetDefaults()"
    >
      <div controls>
        <button
          type="button"
          class="bg-accent/10 text-accent rounded-lg px-4 py-2"
          (click)="toggleShow()"
        >
          {{ show() ? 'Hide' : 'Show' }}
        </button>

        <div class="space-y-8">
          <div>
            <h4 class="text-text-muted mb-5 text-xs font-semibold tracking-widest uppercase">
              Timing
            </h4>
            <div class="space-y-6">
              <div>
                <div class="mb-2 flex items-end justify-between">
                  <label for="duration" class="text-text-muted text-sm font-medium">Duration</label>
                  <span class="text-text-subtle font-mono text-xs">{{ duration() }}ms</span>
                </div>
                <input
                  id="duration"
                  type="range"
                  min="100"
                  max="2000"
                  step="50"
                  [ngModel]="duration()"
                  (ngModelChange)="duration.set(+$event)"
                  class="bg-surface-raised accent-accent h-2 w-full cursor-pointer appearance-none rounded-lg"
                />
                <div class="text-text-subtle mt-1 flex justify-between px-1 text-xs">
                  <span>100ms</span><span>2000ms</span>
                </div>
              </div>

              <div>
                <div class="mb-2 flex items-end justify-between">
                  <label for="delay" class="text-text-muted text-sm font-medium">Delay</label>
                  <span class="text-text-subtle font-mono text-xs">{{ delay() }}ms</span>
                </div>
                <input
                  id="delay"
                  type="range"
                  min="0"
                  max="1000"
                  step="50"
                  [ngModel]="delay()"
                  (ngModelChange)="delay.set(+$event)"
                  class="bg-surface-raised accent-accent h-2 w-full cursor-pointer appearance-none rounded-lg"
                />
                <div class="text-text-subtle mt-1 flex justify-between px-1 text-xs">
                  <span>0ms</span><span>1000ms</span>
                </div>
              </div>

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
        <ng-container *movePresence="show()">
          <div
            [moveAnimation]="animationConfig()"
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
            <div class="font-display text-text text-xl font-bold">Object Animation</div>
            <div class="text-text-muted text-sm">initial → animate → exit</div>
          </div>
        </ng-container>
      </div>
      <app-demo-code-tabs code [files]="sourceFiles()" />
    </app-demo-workbench>
  `,
})
export default class DemoAnimation {
  protected resetDefaults(): void {
    this.duration.set(400);
    this.delay.set(0);
    this.easing.set('ease');
    this.show.set(true);
  }

  protected readonly duration = signal(400);
  protected readonly delay = signal(0);
  protected readonly easing = signal('ease');
  protected readonly show = signal(true);
  protected readonly easings = ['ease', 'ease-in', 'ease-out', 'ease-in-out'];

  protected readonly animationConfig = computed((): MoveAnimationConfig => ({
    initial: { opacity: 0, y: 24, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -16, scale: 0.95 },
    duration: this.duration(),
    delay: this.delay(),
    easing: this.easing(),
  }));

  protected readonly sourceFiles = computed(() => [
    { title: 'demo.html', code: this.highlightedCode() },
    {
      title: 'demo.component.ts',
      code: `import { Component } from '@angular/core';
import { MoveAnimationDirective, MovePresenceDirective } from 'angular-movement';
@Component({ selector: 'app-demo', imports: [MoveAnimationDirective, MovePresenceDirective], templateUrl: './demo.html' })
export class Demo {}`,
    },
  ]);
  protected readonly highlightedCode = computed(
    () => `<ng-container *movePresence="true">
  <div [moveAnimation]="{
    initial: { opacity: 0, y: 24, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -16, scale: 0.95 },
    duration: ${this.duration()}, delay: ${this.delay()}, easing: '${this.easing()}'
  }">Card</div>
</ng-container>`,
  );

  protected toggleShow(): void {
    this.show.update((v) => !v);
  }
}
