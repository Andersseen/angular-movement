import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MOVEMENT_DIRECTIVES } from 'movement';
import {
  DemoContainer,
  DemoState,
} from '../../../../shared/components/demo-container/demo-container';

@Component({
  selector: 'app-demo-parallax',
  imports: [DemoContainer, ...MOVEMENT_DIRECTIVES],
  template: `
    <app-demo-container
      title="Parallax Effect"
      description="Create depth with multiple layers moving at different speeds. A common use case of scroll-linked animations."
      directive="moveScroll"
      [availablePresets]="[]"
      [controls]="controlsConfig"
      (stateChange)="onStateChange($event)"
      [showReplay]="false"
    >
      <!-- Preview -->
      <div preview class="relative h-full w-full overflow-hidden">
        <div class="h-full w-full overflow-y-auto">
          <div class="flex min-h-[700px] flex-col items-center py-8">
            <div class="text-text-subtle mb-4 text-sm">Scroll down for parallax effect ↓</div>

            <!-- Parallax container -->
            <div
              class="from-accent/5 to-accent/20 relative flex h-[450px] w-full max-w-sm items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b"
            >
              <!-- Far background (slowest) -->
              <div
                [moveScroll]="{ y: [0, bgSpeed()] }"
                class="absolute inset-0 flex items-center justify-center"
              >
                <div class="bg-accent/10 h-64 w-64 rounded-full blur-3xl"></div>
              </div>

              <!-- Middle layer (medium speed) -->
              <div
                [moveScroll]="{ y: [0, midSpeed()], scale: [0.9, 1.1] }"
                class="absolute flex items-center justify-center"
              >
                <div class="bg-accent/20 h-40 w-40 rounded-full blur-2xl"></div>
              </div>

              <!-- Content layer (foreground) -->
              <div
                [moveScroll]="{ y: [0, fgSpeed()], scale: [0.9, 1.1] }"
                class="bg-surface border-accent/40 relative z-10 flex flex-col items-center gap-3 rounded-xl border p-6 shadow-xl"
              >
                <div class="bg-accent/20 flex h-14 w-14 items-center justify-center rounded-full">
                  <svg
                    class="text-accent h-7 w-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                    />
                  </svg>
                </div>
                <div class="font-display text-text text-lg font-bold">Parallax</div>
                <div class="text-text-muted text-xs">{{ intensityLabel() }}</div>
              </div>

              <!-- Floating elements -->
              @if (showFloating()) {
                <div
                  [moveScroll]="{ y: [0, 30], x: [0, 20] }"
                  class="bg-accent/30 absolute top-4 left-4 h-8 w-8 rounded-lg"
                ></div>
                <div
                  [moveScroll]="{ y: [0, 40], x: [0, -15] }"
                  class="bg-accent/40 absolute right-6 bottom-8 h-6 w-6 rounded-full"
                ></div>
                <div
                  [moveScroll]="{ y: [0, -30] }"
                  class="bg-accent/25 absolute top-1/3 right-4 h-4 w-4 rounded"
                ></div>
              }
            </div>

            <div class="text-text-muted mt-4 max-w-xs text-center text-sm">
              {{ intensityLabel() }} - Background layers move slower than foreground
            </div>

            <!-- Extra scroll space -->
            <div class="h-40"></div>
          </div>
        </div>
      </div>
    </app-demo-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DemoParallax {
  protected readonly controlsConfig = {
    showPreset: false,
    showDuration: false,
    showDelay: false,
    showEasing: false,
    customControls: [
      {
        id: 'intensity',
        type: 'select' as const,
        label: 'Parallax Intensity',
        value: 'medium',
        options: [
          { label: 'Subtle', value: 'subtle' },
          { label: 'Medium', value: 'medium' },
          { label: 'Strong', value: 'strong' },
          { label: 'Extreme', value: 'extreme' },
        ],
      },
      {
        id: 'showFloating',
        type: 'toggle' as const,
        label: 'Show Floating Elements',
        value: true,
      },
    ],
  };

  protected intensity = signal<'subtle' | 'medium' | 'strong' | 'extreme'>('medium');
  protected showFloating = signal(true);

  protected readonly bgSpeed = () => {
    const speeds = { subtle: -10, medium: -20, strong: -40, extreme: -80 };
    return speeds[this.intensity()];
  };

  protected readonly midSpeed = () => {
    const speeds = { subtle: -25, medium: -50, strong: -100, extreme: -160 };
    return speeds[this.intensity()];
  };

  protected readonly fgSpeed = () => {
    const speeds = { subtle: -40, medium: -80, strong: -140, extreme: -200 };
    return speeds[this.intensity()];
  };

  protected readonly intensityLabel = () => {
    const labels = {
      subtle: 'Subtle parallax',
      medium: 'Medium parallax',
      strong: 'Strong parallax',
      extreme: 'Extreme parallax',
    };
    return labels[this.intensity()];
  };

  protected onStateChange(state: DemoState): void {
    this.intensity.set(
      (state['intensity'] as 'subtle' | 'medium' | 'strong' | 'extreme') ?? 'medium',
    );
    this.showFloating.set((state['showFloating'] as boolean) ?? true);
  }
}
