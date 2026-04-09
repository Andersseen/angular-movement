import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MOVEMENT_DIRECTIVES, MovePreset } from 'movement';
import {
  DemoContainer,
  DemoState,
} from '../../../../shared/components/demo-container/demo-container';

@Component({
  selector: 'app-demo-enter',
  imports: [DemoContainer, ...MOVEMENT_DIRECTIVES],
  template: `
    <app-demo-container
      title="moveEnter"
      description="Animate elements when they enter the DOM. Perfect for initial page loads and dynamically added content."
      directive="moveEnter"
      [availablePresets]="availablePresets"
      (stateChange)="onStateChange($event)"
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
            <div class="font-display text-text text-xl font-bold">{{ presetLabel() }}</div>
            <div class="text-text-muted text-sm">{{ presetDescription() }}</div>
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

  protected readonly presetLabel = () => {
    const p = this.preset();
    return p
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  protected readonly presetDescription = () => {
    const desc: Record<string, string> = {
      'fade-up': 'Fades in while moving up',
      'fade-down': 'Fades in while moving down',
      'fade-left': 'Fades in while moving left',
      'fade-right': 'Fades in while moving right',
      'slide-up': 'Slides in from below',
      'slide-down': 'Slides in from above',
      'slide-left': 'Slides in from right',
      'slide-right': 'Slides in from left',
      'zoom-in': 'Scales up from small',
      'zoom-out': 'Scales down from large',
      'flip-x': 'Flips in horizontally',
      'flip-y': 'Flips in vertically',
      'bounce-in': 'Bounces in with scale',
    };
    return desc[this.preset()] || 'Enter animation';
  };

  protected onStateChange(state: DemoState): void {
    this.preset.set(state.preset);
    this.duration.set(state.duration);
    this.delay.set(state.delay);
    this.easing.set(state.easing);
    // Auto-replay on state change
    this.replay();
  }

  protected replay(): void {
    this.showDemo.set(false);
    setTimeout(() => this.showDemo.set(true), 50);
  }
}
