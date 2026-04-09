import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MOVEMENT_DIRECTIVES, MovePreset } from 'movement';
import { DemoContainer } from '../../../../shared/components/demo-container/demo-container';

@Component({
  selector: 'app-demo-enter',
  imports: [DemoContainer, ...MOVEMENT_DIRECTIVES],
  template: `
    <app-demo-container
      title="moveEnter"
      description="Animate elements when they enter the DOM. Perfect for initial page loads and dynamically added content."
      directive="moveEnter"
      [availablePresets]="availablePresets"
      (replay)="replay()"
    >
      <!-- Preview -->
      <div preview class="flex h-full w-full items-center justify-center">
        @if (showDemo()) {
          <div
            [moveEnter]="preset()"
            [moveDuration]="duration()"
            [moveDelay]="delay()"
            [moveEasing]="easing()"
            class="bg-surface border-accent/40 flex min-w-[240px] flex-col items-center justify-center gap-4 rounded-xl border p-8 shadow-[0_0_30px_var(--color-accent-glow)]"
          >
            <div class="bg-accent/20 flex h-16 w-16 items-center justify-center rounded-full">
              <svg class="text-accent h-8 w-8" viewBox="0 0 100 100" fill="none">
                <path
                  d="M 25 20 L 50 50 L 25 80 L 45 80 L 70 50 L 45 20 Z"
                  fill="currentColor"
                  fill-opacity="0.8"
                />
                <path d="M 45 20 L 70 50 L 45 80 L 65 80 L 90 50 L 65 20 Z" fill="currentColor" />
              </svg>
            </div>
            <div class="font-display text-text text-xl font-bold">Enter Animation</div>
            <div class="bg-surface-raised h-2 w-24 rounded-full"></div>
          </div>
        }
      </div>
    </app-demo-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DemoEnter {
  protected readonly availablePresets: MovePreset[] = [
    'fade-up',
    'fade-down',
    'fade-left',
    'fade-right',
    'slide-up',
    'slide-down',
    'slide-left',
    'slide-right',
    'zoom-in',
    'zoom-out',
    'flip-x',
    'flip-y',
    'bounce-in',
  ];

  protected preset = signal<MovePreset>('fade-up');
  protected duration = signal(300);
  protected delay = signal(0);
  protected easing = signal('ease');
  protected showDemo = signal(true);

  protected onStateChange(state: {
    preset: MovePreset;
    duration: number;
    delay: number;
    easing: string;
  }): void {
    this.preset.set(state.preset);
    this.duration.set(state.duration);
    this.delay.set(state.delay);
    this.easing.set(state.easing);
  }

  protected replay(): void {
    this.showDemo.set(false);
    setTimeout(() => this.showDemo.set(true), 0);
  }
}
