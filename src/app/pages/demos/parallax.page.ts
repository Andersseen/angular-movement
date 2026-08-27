import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { MoveParallaxDirective } from 'movement';
import { DemoContainer, DemoState } from '../../shared/components/demo-container/demo-container';

@Component({
  selector: 'app-demo-parallax',
  imports: [DemoContainer, MoveParallaxDirective],
  template: `
    <app-demo-container
      title="Parallax Effect"
      description="Create depth with multiple layers moving at different speeds. Scroll down to see the effect."
      directive="moveParallax"
      [availablePresets]="[]"
      [controls]="controlsConfig"
      (stateChange)="onStateChange($event)"
      [showReplay]="false"
      [customCode]="parallaxCode()"
    >
      <!-- Preview - Full height for scroll -->
      <div preview class="relative h-full w-full overflow-hidden">
        <div id="parallax-demo-container" class="h-full w-full overflow-y-auto pr-2">
          <!-- Top spacer — must be taller than the container to push content below the fold -->
          <div class="flex h-[400px] items-center justify-center">
            <div class="text-text-subtle text-center">
              <div class="mb-2 text-2xl">↓</div>
              <div>Scroll down</div>
            </div>
          </div>

          <!-- Parallax scene -->
          <div class="relative my-8 flex h-[280px] w-full items-center justify-center">
            <!-- Sky/Background layer (slowest - barely moves) -->
            <div
              data-testid="parallax-bg-layer"
              [moveParallax]="bgSpeed()"
              moveParallaxContainer="#parallax-demo-container"
              class="absolute inset-x-0 top-0 flex h-full items-center justify-center"
            >
              <div
                class="from-accent/20 to-accent/5 h-[280px] w-[280px] rounded-full bg-gradient-to-br blur-3xl"
              ></div>
            </div>

            <!-- Mountains/Middle layer (medium speed) -->
            <div
              [moveParallax]="midSpeed()"
              moveParallaxContainer="#parallax-demo-container"
              class="absolute bottom-0 flex items-end justify-center"
            >
              <svg
                class="text-accent/30 h-[130px] w-[220px]"
                viewBox="0 0 250 150"
                fill="currentColor"
              >
                <polygon points="0,150 50,50 100,150 150,80 200,150 250,100 300,150" />
              </svg>
            </div>

            <!-- Foreground/Content (fastest - moves most) -->
            <div
              data-testid="parallax-fg-layer"
              [moveParallax]="fgSpeed()"
              moveParallaxContainer="#parallax-demo-container"
              class="bg-surface border-accent/50 relative z-10 flex flex-col items-center gap-3 rounded-2xl border-2 p-6 shadow-2xl"
            >
              <div class="bg-accent/20 flex h-12 w-12 items-center justify-center rounded-full">
                <svg
                  class="text-accent h-6 w-6"
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
              <div class="font-display text-text text-lg font-bold">{{ intensityLabel() }}</div>
              <div class="text-text-muted max-w-[130px] text-center text-xs">
                Background moves slower than foreground
              </div>
            </div>

            <!-- Floating particles (varied speeds, opposite direction) -->
            @if (showFloating()) {
              <div
                [moveParallax]="-0.15"
                moveParallaxContainer="#parallax-demo-container"
                class="bg-accent/60 absolute top-10 left-10 h-3 w-3 rounded-full"
              ></div>
              <div
                [moveParallax]="-0.1"
                moveParallaxContainer="#parallax-demo-container"
                class="bg-accent/40 absolute top-20 right-16 h-2 w-2 rounded-full"
              ></div>
              <div
                [moveParallax]="-0.2"
                moveParallaxContainer="#parallax-demo-container"
                class="bg-accent/50 absolute bottom-20 left-20 h-4 w-4 rounded-full"
              ></div>
            }
          </div>

          <!-- Bottom spacer -->
          <div class="h-[320px]"></div>
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
        label: 'Show Floating Particles',
        value: true,
      },
    ],
  };

  protected intensity = signal<'subtle' | 'medium' | 'strong' | 'extreme'>('medium');
  protected showFloating = signal(true);

  protected readonly parallaxCode = computed(() => {
    const speed = this.fgSpeed();
    return `<div
  [moveParallax]="${speed}"
  moveParallaxContainer="'#parallax-demo-container'">
  Parallax Element
</div>`;
  });

  // Computed speeds based on intensity
  protected readonly bgSpeed = computed(() => {
    const speeds = { subtle: 0.05, medium: 0.1, strong: 0.15, extreme: 0.25 };
    return speeds[this.intensity()];
  });

  protected readonly midSpeed = computed(() => {
    const speeds = { subtle: 0.1, medium: 0.2, strong: 0.35, extreme: 0.55 };
    return speeds[this.intensity()];
  });

  protected readonly fgSpeed = computed(() => {
    const speeds = { subtle: 0.2, medium: 0.35, strong: 0.55, extreme: 0.85 };
    return speeds[this.intensity()];
  });

  protected readonly intensityLabel = computed(() => {
    const labels = {
      subtle: 'Subtle',
      medium: 'Medium',
      strong: 'Strong',
      extreme: 'Extreme',
    };
    return labels[this.intensity()];
  });

  protected onStateChange(state: DemoState): void {
    this.intensity.set(
      (state['intensity'] as 'subtle' | 'medium' | 'strong' | 'extreme') ?? 'medium',
    );
    this.showFloating.set((state['showFloating'] as boolean) ?? true);
  }
}
