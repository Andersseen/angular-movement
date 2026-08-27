import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { MoveTargetDirective } from 'movement';
import { DemoContainer, DemoState } from '../../shared/components/demo-container/demo-container';

@Component({
  selector: 'app-demo-target',
  imports: [DemoContainer, MoveTargetDirective],
  template: `
    <app-demo-container
      title="moveTarget"
      description="Animate individual child elements with a boolean trigger. Useful for SVG icons, staged micro-interactions, and stroke draw effects without CSS keyframes."
      directive="moveTarget"
      [availablePresets]="[]"
      [controls]="controlsConfig"
      [initialDuration]="500"
      initialEasing="ease-out"
      [showReplay]="false"
      [customCode]="targetCode()"
      (stateChange)="onStateChange($event)"
    >
      <div preview class="flex h-full w-full flex-col items-center justify-center gap-6">
        <button
          type="button"
          class="bg-accent hover:bg-accent-light rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors"
          (click)="animated.update((value) => !value)"
        >
          {{ animated() ? 'Reset icon' : 'Draw icon' }}
        </button>

        <svg
          viewBox="0 0 96 96"
          class="text-accent h-40 w-40 overflow-visible"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle
            [moveTarget]="animated()"
            [moveFrames]="{ pathLength: [0, 1], opacity: [0.18, 0.42] }"
            [moveDuration]="duration()"
            [moveReverseDuration]="reverseDuration()"
            [moveEasing]="easing()"
            cx="48"
            cy="48"
            r="30"
            stroke-width="4"
          />

          <path
            [moveTarget]="animated()"
            [moveFrames]="{ pathLength: [0, 1], opacity: [0, 1] }"
            [moveDuration]="duration()"
            [moveReverseDuration]="reverseDuration()"
            [moveEasing]="easing()"
            moveDelay="90"
            d="M28 51l13 13 28-32"
            stroke-width="7"
          />
        </svg>

        <p class="text-text-muted max-w-xs text-center text-sm">
          Each SVG child owns its own frames and timing while sharing the same boolean trigger.
        </p>
      </div>
    </app-demo-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DemoTarget {
  protected readonly controlsConfig = {
    showPreset: false,
    showDuration: true,
    showDelay: false,
    showEasing: true,
    customControls: [
      {
        id: 'reverseDuration',
        type: 'range' as const,
        label: 'Reverse duration',
        value: 200,
        min: 100,
        max: 800,
        step: 50,
      },
    ],
  };

  protected readonly animated = signal(true);
  protected readonly duration = signal(500);
  protected readonly easing = signal('ease-out');
  protected readonly reverseDuration = signal(200);

  protected readonly targetCode = computed(() => {
    return `<svg viewBox="0 0 96 96">
  <circle
    [moveTarget]="animated()"
    [moveFrames]="{ pathLength: [0, 1], opacity: [0.18, 0.42] }"
    moveDuration="${this.duration()}"
    moveReverseDuration="${this.reverseDuration()}" />

  <path
    [moveTarget]="animated()"
    [moveFrames]="{ pathLength: [0, 1], opacity: [0, 1] }"
    moveDuration="${this.duration()}"
    moveDelay="90"
    d="M28 51l13 13 28-32" />
</svg>`;
  });

  protected onStateChange(state: DemoState): void {
    this.duration.set(state.duration);
    this.easing.set(state.easing);
    this.reverseDuration.set(Number(state['reverseDuration'] ?? 200));
  }
}
