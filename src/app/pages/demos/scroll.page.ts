import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { MOVEMENT_DIRECTIVES } from 'movement';
import { DemoContainer, DemoState } from '../../shared/components/demo-container/demo-container';

@Component({
  selector: 'app-demo-scroll',
  imports: [DemoContainer, ...MOVEMENT_DIRECTIVES],
  template: `
    <app-demo-container
      title="moveScroll"
      description="Link animations to scroll position. Elements animate based on their position in the viewport as you scroll."
      directive="moveScroll"
      [availablePresets]="[]"
      [controls]="controlsConfig"
      (stateChange)="onStateChange($event)"
      [showReplay]="false"
    >
      <!-- Preview -->
      <div preview class="relative h-[500px] w-full overflow-hidden">
        <div class="h-full w-full overflow-y-auto pr-2">
          <!-- Top spacer -->
          <div class="flex h-[350px] items-center justify-center">
            <div class="text-text-subtle text-center">
              <div class="mb-2 text-2xl">↓</div>
              <div>Scroll down</div>
            </div>
          </div>

          <!-- Animation showcase -->
          <div class="relative my-8 flex h-[300px] w-full items-center justify-center">
            <!-- Background element -->
            <div
              [moveScroll]="bgKeyframes()"
              class="bg-accent/20 border-accent/30 absolute flex h-40 w-40 items-center justify-center rounded-2xl border"
            >
              <span class="text-accent/60 font-display text-2xl font-bold">BG</span>
            </div>

            <!-- Middle element -->
            <div
              [moveScroll]="midKeyframes()"
              class="bg-surface border-accent/50 absolute z-10 flex h-28 w-28 items-center justify-center rounded-xl border-2 shadow-xl"
            >
              <span class="text-text-muted font-display text-lg font-bold">MID</span>
            </div>

            <!-- Foreground element -->
            <div
              [moveScroll]="fgKeyframes()"
              class="bg-accent absolute z-20 flex h-16 w-16 items-center justify-center rounded-lg shadow-lg"
            >
              <span class="font-display text-sm font-bold text-white">FG</span>
            </div>
          </div>

          <!-- Description -->
          <div class="text-text-muted mx-auto max-w-xs text-center text-sm">
            {{ effectLabel() }}
          </div>

          <!-- Bottom spacer -->
          <div class="h-[350px]"></div>
        </div>
      </div>
    </app-demo-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DemoScroll {
  protected readonly controlsConfig = {
    showPreset: false,
    showDuration: false,
    showDelay: false,
    showEasing: false,
    customControls: [
      {
        id: 'effect',
        type: 'select' as const,
        label: 'Animation Type',
        value: 'mixed',
        options: [
          { label: 'Translate Y', value: 'translate' },
          { label: 'Scale', value: 'scale' },
          { label: 'Rotate', value: 'rotate' },
          { label: 'Mixed', value: 'mixed' },
        ],
      },
      {
        id: 'intensity',
        type: 'range' as const,
        label: 'Effect Intensity',
        value: 50,
        min: 20,
        max: 100,
        step: 10,
      },
    ],
  };

  protected effect = signal<'translate' | 'scale' | 'rotate' | 'mixed'>('mixed');
  protected intensity = signal(50);

  // Computed keyframes
  protected readonly bgKeyframes = computed(() => {
    const y = this.effect() === 'translate' || this.effect() === 'mixed' ? -this.intensity() : 0;
    return { y: [0, y] };
  });

  protected readonly midKeyframes = computed(() => {
    if (this.effect() === 'scale' || this.effect() === 'mixed') {
      const s = this.intensity() / 200;
      return { scale: [0.8, 1 + s] };
    }
    return { scale: [1, 1] };
  });

  protected readonly fgKeyframes = computed(() => {
    const y = this.effect() === 'translate' || this.effect() === 'mixed' ? this.intensity() : 0;
    const rotate = this.effect() === 'rotate' || this.effect() === 'mixed' ? this.intensity() : 0;
    return { y: [0, y], rotate: [0, rotate] };
  });

  protected readonly effectLabel = computed(() => {
    const labels = {
      translate: 'Elements move vertically at different speeds',
      scale: 'Elements scale as you scroll',
      rotate: 'Elements rotate as you scroll',
      mixed: 'Combined translate, scale and rotate effects',
    };
    return labels[this.effect()];
  });

  protected onStateChange(state: DemoState): void {
    this.effect.set((state['effect'] as 'translate' | 'scale' | 'rotate' | 'mixed') ?? 'mixed');
    this.intensity.set((state['intensity'] as number) ?? 50);
  }
}
