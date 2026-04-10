import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MOVEMENT_DIRECTIVES, MoveKeyframes } from 'movement';
import {
  DemoContainer,
  DemoState,
} from '../../../../shared/components/demo-container/demo-container';

@Component({
  selector: 'app-demo-tap',
  imports: [DemoContainer, ...MOVEMENT_DIRECTIVES],
  template: `
    <app-demo-container
      title="moveWhileTap"
      description="Add press/tap animations for buttons and interactive elements. Provides tactile feedback on click."
      directive="moveWhileTap"
      [availablePresets]="[]"
      [controls]="controlsConfig"
      (stateChange)="onStateChange($event)"
      [showReplay]="false"
    >
      <!-- Preview -->
      <div preview class="flex h-full w-full items-center justify-center">
        <button
          [moveWhileTap]="tapKeyframes()"
          [moveDuration]="duration()"
          [moveEasing]="easing()"
          class="bg-accent hover:bg-accent-light active:bg-accent/80 font-display flex items-center gap-2 rounded-xl px-8 py-4 text-lg font-semibold text-white transition-colors"
        >
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
            />
          </svg>
          {{ effectLabel() }}
        </button>
      </div>
    </app-demo-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DemoTap {
  protected readonly controlsConfig = {
    showPreset: false,
    showDuration: true,
    showDelay: false,
    showEasing: true,
    customControls: [
      {
        id: 'effect',
        type: 'select' as const,
        label: 'Tap Effect',
        value: 'press',
        options: [
          { label: 'Press Down', value: 'press' },
          { label: 'Shrink', value: 'shrink' },
          { label: 'Ripple', value: 'ripple' },
          { label: 'Bounce', value: 'bounce' },
        ],
      },
    ],
  };

  protected effect = signal<'press' | 'shrink' | 'ripple' | 'bounce'>('press');
  protected duration = signal(100);
  protected easing = signal('ease-out');

  protected readonly tapKeyframes = (): MoveKeyframes => {
    switch (this.effect()) {
      case 'press':
        return { y: [0, 2], scale: [1, 0.98] };
      case 'shrink':
        return { scale: [1, 0.9] };
      case 'ripple':
        return { scale: [1, 0.95, 1] };
      case 'bounce':
        return { scale: [1, 0.9, 1.02, 1] };
      default:
        return { scale: [1, 0.95] };
    }
  };

  protected readonly effectLabel = () => {
    const labels: Record<string, string> = {
      press: 'Press Down',
      shrink: 'Shrink',
      ripple: 'Ripple',
      bounce: 'Bounce',
    };
    return labels[this.effect()] || 'Tap Effect';
  };

  protected onStateChange(state: DemoState): void {
    this.effect.set((state['effect'] as 'press' | 'shrink' | 'ripple' | 'bounce') ?? 'press');
    this.duration.set(state.duration);
    this.easing.set(state.easing);
  }
}
