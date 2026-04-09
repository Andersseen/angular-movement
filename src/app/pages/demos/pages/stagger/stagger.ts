import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MOVEMENT_DIRECTIVES, MovePreset } from 'movement';
import { DemoContainer } from '../../../../shared/components/demo-container/demo-container';

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
                class="bg-surface border-border flex h-16 w-16 items-center justify-center rounded-lg border"
              >
                <span class="text-text-muted font-mono text-sm">{{ i + 1 }}</span>
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
  protected readonly availablePresets: MovePreset[] = [
    'fade-up',
    'zoom-in',
    'slide-up',
    'bounce-in',
  ];

  protected readonly controlsConfig = {
    showPreset: true,
    showDuration: true,
    showDelay: false,
    showEasing: true,
    customControls: [
      {
        id: 'staggerDelay',
        type: 'range' as const,
        label: 'Stagger Delay',
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

  protected replay(): void {
    this.showDemo.set(false);
    setTimeout(() => this.showDemo.set(true), 0);
  }
}
