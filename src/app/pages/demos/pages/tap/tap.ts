import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MOVEMENT_DIRECTIVES, MovePreset } from 'movement';
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
      [availablePresets]="availablePresets"
      [controls]="controlsConfig"
      (stateChange)="onStateChange($event)"
      [showReplay]="false"
    >
      <!-- Preview -->
      <div preview class="flex h-full w-full items-center justify-center">
        <button
          [moveWhileTap]="preset()"
          [moveDuration]="duration()"
          [moveEasing]="easing()"
          class="bg-accent hover:bg-accent-light font-display flex items-center gap-2 rounded-xl px-8 py-4 text-lg font-semibold text-white transition-colors"
        >
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
            />
          </svg>
          {{ presetLabel() }}
        </button>
      </div>
    </app-demo-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DemoTap {
  protected readonly availablePresets: MovePreset[] = [
    'zoom-in',
    'zoom-out',
    'fade-up',
    'bounce-in',
  ];

  protected readonly controlsConfig = {
    showPreset: true,
    showDuration: true,
    showDelay: false,
    showEasing: true,
  };

  protected preset = signal<MovePreset>('zoom-out');
  protected duration = signal(100);
  protected easing = signal('ease-out');

  protected readonly presetLabel = () => {
    const p = this.preset();
    return p
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  protected onStateChange(state: DemoState): void {
    this.preset.set(state.preset);
    this.duration.set(state.duration);
    this.easing.set(state.easing);
    // No replay needed for tap - it's interactive
  }
}
