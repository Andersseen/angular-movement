import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { MoveTapDirective, MoveKeyframes, MovePreset } from 'movement';
import { DemoContainer, DemoState } from '../../shared/components/demo-container/demo-container';
import { keyframesToString } from '../../shared/utils/demo.utils';

type TapEffect = 'press' | 'press-down' | 'shrink';

@Component({
  selector: 'app-demo-tap',
  imports: [DemoContainer, MoveTapDirective],
  template: `
    <app-demo-container
      title="moveWhileTap"
      description="Add press/tap animations for buttons and interactive elements. Provides tactile feedback on click."
      directive="moveWhileTap"
      [availablePresets]="[]"
      [controls]="controlsConfig"
      [initialDuration]="100"
      initialEasing="ease-out"
      (stateChange)="onStateChange($event)"
      [showReplay]="false"
      [directiveBinding]="tapCode()"
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
          { label: 'Press (preset)', value: 'press' },
          { label: 'Press Down', value: 'press-down' },
          { label: 'Shrink', value: 'shrink' },
        ],
      },
    ],
  };

  protected effect = signal<TapEffect>('press');
  protected duration = signal(100);
  protected easing = signal('ease-out');

  protected readonly tapCode = computed(() => {
    const tap = this.tapKeyframes();
    return typeof tap === 'string' ? `'${tap}'` : keyframesToString(tap);
  });

  /**
   * Two keyframes only: a tap animation plays forward while held and reverses on release, so a
   * three-keyframe "bounce" (\`[1, 0.97, 1]\`) would replay the bounce on release instead of
   * holding the pressed state.
   */
  protected readonly tapKeyframes = (): MovePreset | MoveKeyframes => {
    switch (this.effect()) {
      case 'press-down':
        return { y: [0, 2], scale: [1, 0.98] };
      case 'shrink':
        return { scale: [1, 0.9] };
      default:
        return 'press';
    }
  };

  protected readonly effectLabel = () => {
    const labels: Record<TapEffect, string> = {
      press: 'Press',
      'press-down': 'Press Down',
      shrink: 'Shrink',
    };
    return labels[this.effect()] ?? 'Tap Effect';
  };

  protected onStateChange(state: DemoState): void {
    this.effect.set((state['effect'] as TapEffect) ?? 'press');
    this.duration.set(state.duration);
    this.easing.set(state.easing);
  }
}
