import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MOVEMENT_DIRECTIVES, MovePreset } from 'movement';
import { DemoContainer, DemoState } from '../../shared/components/demo-container/demo-container';
import { ALL_PRESETS, DEFAULT_CONTROLS } from '../../shared/utils/demo.utils';

@Component({
  selector: 'app-demo-stagger',
  imports: [DemoContainer, ...MOVEMENT_DIRECTIVES],
  template: `
    <app-demo-container
      title="moveStagger"
      description="Animate multiple children with a staggered delay. Perfect for lists, grids, and card layouts."
      directive="moveStagger"
      [availablePresets]="availablePresets"
      [controls]="controlsConfig"
      (stateChange)="onStateChange($event)"
      (replay)="replay()"
    >
      <!-- Preview -->
      <div preview class="flex h-full w-full items-center justify-center">
        @if (showDemo()) {
          <div [moveStagger]="staggerDelay()" class="grid grid-cols-3 gap-3">
            @for (i of items; track i) {
              <div
                [moveEnter]="preset()"
                [moveDuration]="duration()"
                [moveEasing]="easing()"
                class="bg-surface border-accent/40 flex h-20 w-20 items-center justify-center rounded-lg border"
              >
                <span class="text-text font-mono text-lg font-bold">{{ i + 1 }}</span>
              </div>
            }
          </div>
        }
      </div>
    </app-demo-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DemoStagger {
  protected readonly availablePresets = ALL_PRESETS;
  protected readonly controlsConfig = {
    ...DEFAULT_CONTROLS.standard,
    customControls: [
      {
        id: 'staggerDelay',
        type: 'range' as const,
        label: 'Stagger Delay (ms)',
        value: 50,
        min: 20,
        max: 200,
        step: 10,
      },
    ],
  };

  protected readonly items = Array.from({ length: 9 }, (_, i) => i);

  protected preset = signal<MovePreset>('fade-up');
  protected duration = signal(400);
  protected easing = signal('ease-out');
  protected staggerDelay = signal(50);
  protected showDemo = signal(true);

  protected onStateChange(state: DemoState): void {
    this.preset.set(state.preset);
    this.duration.set(state.duration);
    this.easing.set(state.easing);
    this.staggerDelay.set((state['staggerDelay'] as number) ?? 50);
    this.replay();
  }

  protected replay(): void {
    this.showDemo.set(false);
    setTimeout(() => this.showDemo.set(true), 50);
  }
}
