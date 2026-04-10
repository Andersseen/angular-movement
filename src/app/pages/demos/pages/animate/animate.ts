import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MOVEMENT_DIRECTIVES, MovePreset } from 'movement';
import {
  DemoContainer,
  DemoState,
} from '../../../../shared/components/demo-container/demo-container';
import { ALL_PRESETS, getPresetLabel, DEFAULT_CONTROLS } from '../../../../shared/utils/demo.utils';

@Component({
  selector: 'app-demo-animate',
  imports: [DemoContainer, ...MOVEMENT_DIRECTIVES],
  template: `
    <app-demo-container
      title="moveAnimate"
      description="Shorthand directive for both enter and leave animations. Simplifies your templates when you need both."
      directive="moveAnimate"
      [availablePresets]="availablePresets"
      [controls]="controlsConfig"
      (stateChange)="onStateChange($event)"
      (replay)="replay()"
    >
      <!-- Preview -->
      <div preview class="flex h-full w-full flex-col items-center justify-center gap-4">
        <button
          (click)="toggleElement()"
          class="text-accent hover:text-accent-light bg-accent/10 mb-4 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors"
        >
          @if (showDemo()) {
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Hide Element
          } @else {
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Show Element
          }
        </button>

        @if (showDemo()) {
          <div
            [moveAnimate]="preset()"
            [moveDuration]="duration()"
            [moveDelay]="delay()"
            [moveEasing]="easing()"
            class="bg-surface border-accent/40 flex min-w-[240px] flex-col items-center justify-center gap-4 rounded-xl border p-8 shadow-[0_0_30px_var(--color-accent-glow)]"
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
                  stroke-width="2"
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div class="font-display text-text text-xl font-bold">{{ presetLabel() }}</div>
            <div class="text-text-muted text-sm">Same animation for enter & leave</div>
          </div>
        }
      </div>
    </app-demo-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DemoAnimate {
  protected readonly availablePresets = ALL_PRESETS;
  protected readonly controlsConfig = DEFAULT_CONTROLS.full;

  protected preset = signal<MovePreset>('fade-up');
  protected duration = signal(300);
  protected delay = signal(0);
  protected easing = signal('ease');
  protected showDemo = signal(true);

  protected readonly presetLabel = () => getPresetLabel(this.preset());

  protected onStateChange(state: DemoState): void {
    this.preset.set(state.preset);
    this.duration.set(state.duration);
    this.delay.set(state.delay);
    this.easing.set(state.easing);
    this.showDemo.set(true);
  }

  protected toggleElement(): void {
    this.showDemo.update((v) => !v);
  }

  protected replay(): void {
    this.showDemo.set(false);
    setTimeout(() => this.showDemo.set(true), 50);
  }
}
