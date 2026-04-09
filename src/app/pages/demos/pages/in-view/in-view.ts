import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MOVEMENT_DIRECTIVES, MovePreset } from 'movement';
import {
  DemoContainer,
  DemoState,
} from '../../../../shared/components/demo-container/demo-container';

@Component({
  selector: 'app-demo-in-view',
  imports: [DemoContainer, ...MOVEMENT_DIRECTIVES],
  template: `
    <app-demo-container
      title="moveInView"
      description="Trigger animations when elements enter the viewport. Perfect for scroll-triggered reveals."
      directive="moveInView"
      [availablePresets]="availablePresets"
      [controls]="controlsConfig"
      (stateChange)="onStateChange($event)"
      [showReplay]="false"
    >
      <!-- Preview -->
      <div preview class="relative h-full w-full overflow-hidden">
        <div #scrollContainer class="h-full w-full overflow-y-auto scroll-smooth px-4 py-8">
          <div class="flex flex-col items-center gap-32 py-16">
            <div class="text-text-subtle text-center italic">
              Scroll down to trigger animations...
            </div>

            <div class="h-32"></div>

            @if (showDemo()) {
              <div
                [moveInView]="preset()"
                [moveInViewOnce]="once()"
                [moveDuration]="duration()"
                [moveDelay]="delay()"
                [moveEasing]="easing()"
                class="bg-accent/10 border-accent/20 flex flex-col items-center gap-4 rounded-3xl border p-8 text-center"
              >
                <div
                  class="bg-accent shadow-accent/50 flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg"
                >
                  <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </div>
                <h4 class="text-text text-xl font-bold">{{ presetLabel() }}</h4>
                <p class="text-text-muted max-w-xs text-sm">
                  {{ once() ? 'Triggers once when visible' : 'Re-triggers every time' }}
                </p>
              </div>
            }

            <div class="h-32"></div>
          </div>
        </div>
      </div>
    </app-demo-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DemoInView {
  protected readonly availablePresets: MovePreset[] = [
    'fade-up',
    'fade-down',
    'fade-left',
    'fade-right',
    'slide-up',
    'slide-down',
    'zoom-in',
    'zoom-out',
    'bounce-in',
  ];

  protected readonly controlsConfig = {
    showPreset: true,
    showDuration: true,
    showDelay: true,
    showEasing: true,
    customControls: [
      {
        id: 'once',
        type: 'toggle' as const,
        label: 'Trigger Once',
        value: true,
      },
    ],
  };

  protected preset = signal<MovePreset>('fade-up');
  protected duration = signal(800);
  protected delay = signal(0);
  protected easing = signal('ease-out');
  protected once = signal(true);
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
    this.once.set((state['once'] as boolean) ?? true);
    // Re-show element to reset in-view trigger
    this.showDemo.set(false);
    setTimeout(() => this.showDemo.set(true), 50);
  }
}
