import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MOVEMENT_DIRECTIVES, MovePreset } from 'movement';
import {
  DemoContainer,
  DemoState,
} from '../../../../shared/components/demo-container/demo-container';

@Component({
  selector: 'app-demo-leave',
  imports: [DemoContainer, ...MOVEMENT_DIRECTIVES],
  template: `
    <app-demo-container
      title="moveLeave"
      description="Animate elements when they leave the DOM. Use with *ngIf or @if to trigger exit animations."
      directive="moveLeave"
      [availablePresets]="availablePresets"
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
            [moveLeave]="preset()"
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
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </div>
            <div class="font-display text-text text-xl font-bold">{{ presetLabel() }}</div>
            <div class="text-text-muted text-sm">Click hide to see exit animation</div>
          </div>
        } @else {
          <div class="text-text-muted text-sm italic">
            Element hidden. Click Show to see enter animation.
          </div>
        }
      </div>
    </app-demo-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DemoLeave {
  protected readonly availablePresets: MovePreset[] = [
    'none',
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

  protected onStateChange(state: DemoState): void {
    this.preset.set(state.preset);
    this.duration.set(state.duration);
    this.delay.set(state.delay);
    this.easing.set(state.easing);
    // Show element when changing settings
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
