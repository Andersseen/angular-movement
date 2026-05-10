import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { MOVEMENT_DIRECTIVES, MoveKeyframes } from 'movement';
import { DemoContainer, DemoState } from '../../shared/components/demo-container/demo-container';
import { keyframesToString } from '../../shared/utils/demo.utils';

@Component({
  selector: 'app-demo-loop',
  imports: [DemoContainer, ...MOVEMENT_DIRECTIVES],
  template: `
    <app-demo-container
      title="moveLoop"
      description="Create infinite looping animations for icons, loaders, and decorative elements. Supports custom keyframes including SVG properties like stroke-dashoffset."
      directive="moveLoop"
      [availablePresets]="[]"
      [controls]="controlsConfig"
      (stateChange)="onStateChange($event)"
      (replay)="replay()"
      [directiveBinding]="loopCode()"
    >
      <!-- Preview -->
      <div preview class="flex h-full w-full items-center justify-center">
        @if (showDemo()) {
          @switch (loopType()) {
            @case ('spin') {
              <div
                [moveLoop]="'spin'"
                [moveDuration]="duration()"
                [moveEasing]="easing()"
                class="bg-surface border-accent/40 flex h-32 w-32 items-center justify-center rounded-xl border shadow-[0_0_30px_var(--color-accent-glow)]"
              >
                <svg
                  class="text-accent h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>
            }
            @case ('pulse') {
              <div
                [moveLoop]="'pulse'"
                [moveDuration]="duration()"
                [moveEasing]="easing()"
                class="bg-surface border-accent/40 flex h-32 w-32 items-center justify-center rounded-xl border shadow-[0_0_30px_var(--color-accent-glow)]"
              >
                <svg
                  class="text-accent h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
            }
            @case ('draw') {
              <div
                [moveLoop]="drawKeyframes()"
                [moveDuration]="duration()"
                [moveEasing]="easing()"
                class="bg-surface border-accent/40 flex h-32 w-32 items-center justify-center rounded-xl border shadow-[0_0_30px_var(--color-accent-glow)]"
              >
                <svg
                  class="text-accent h-16 w-16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    d="M5 13l4 4L19 7"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    [attr.stroke-dasharray]="24"
                  />
                </svg>
              </div>
            }
          }
        }
      </div>
    </app-demo-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DemoLoop {
  protected readonly controlsConfig = {
    showPreset: false,
    showDuration: true,
    showDelay: false,
    showEasing: true,
    customControls: [
      {
        id: 'loopType',
        type: 'select' as const,
        label: 'Loop Type',
        value: 'spin',
        options: [
          { label: 'Spin', value: 'spin' },
          { label: 'Pulse', value: 'pulse' },
          { label: 'SVG Draw', value: 'draw' },
        ],
      },
    ],
  };

  protected loopType = signal<'spin' | 'pulse' | 'draw'>('spin');
  protected duration = signal(1000);
  protected easing = signal('linear');
  protected showDemo = signal(true);

  protected readonly loopCode = computed(() => {
    const type = this.loopType();
    if (type === 'spin') return "'spin'";
    if (type === 'pulse') return "'pulse'";
    return keyframesToString(this.drawKeyframes());
  });

  protected readonly drawKeyframes = (): MoveKeyframes => ({
    strokeDashoffset: [24, 0],
  });

  protected onStateChange(state: DemoState): void {
    this.loopType.set((state['loopType'] as 'spin' | 'pulse' | 'draw') ?? 'spin');
    this.duration.set(state.duration);
    this.easing.set(state.easing);
  }

  protected replay(): void {
    this.showDemo.set(false);
    setTimeout(() => this.showDemo.set(true), 50);
  }
}
