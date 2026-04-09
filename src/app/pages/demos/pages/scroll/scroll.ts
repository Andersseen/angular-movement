import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MOVEMENT_DIRECTIVES } from 'movement';
import {
  DemoContainer,
  DemoState,
} from '../../../../shared/components/demo-container/demo-container';

@Component({
  selector: 'app-demo-scroll',
  imports: [DemoContainer, ...MOVEMENT_DIRECTIVES],
  template: `
    <app-demo-container
      title="moveScroll"
      description="Link animations to scroll position. Create parallax effects and scroll-linked transformations."
      directive="moveScroll"
      [availablePresets]="[]"
      [controls]="controlsConfig"
      (stateChange)="onStateChange($event)"
      [showReplay]="false"
    >
      <!-- Preview -->
      <div preview class="relative h-full w-full overflow-hidden">
        <div class="h-full w-full overflow-y-auto">
          <div class="flex min-h-[650px] flex-col items-center py-8">
            <div class="text-text-subtle mb-8 text-sm">Scroll this area ↓</div>

            <div class="relative flex h-[350px] w-full items-center justify-center">
              <!-- Background layer -->
              <div
                [moveScroll]="{ y: [0, bgMove()] }"
                class="bg-accent/10 border-accent/20 absolute flex h-48 w-48 items-center justify-center rounded-2xl border"
              >
                <span class="text-accent/50 font-display text-4xl font-bold">BG</span>
              </div>

              <!-- Middle layer -->
              <div
                [moveScroll]="{ scale: scaleKeyframes() }"
                class="bg-surface/90 border-accent/40 absolute z-10 flex h-32 w-32 items-center justify-center rounded-xl border backdrop-blur"
              >
                <span class="text-text-muted font-display text-2xl font-bold">MID</span>
              </div>

              <!-- Foreground layer -->
              <div
                [moveScroll]="{ y: [0, fgMove()], rotate: rotationKeyframes() }"
                class="bg-accent border-accent absolute z-20 flex h-20 w-20 items-center justify-center rounded-lg shadow-lg"
              >
                <span class="font-display text-lg font-bold text-white">FG</span>
              </div>
            </div>

            <div class="text-text-muted mt-4 max-w-xs text-center text-sm">
              {{ effectLabel() }} - The layers animate as you scroll
            </div>

            <!-- Extra space for scrolling -->
            <div class="h-32"></div>
          </div>
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
        value: 30,
        min: 10,
        max: 60,
        step: 5,
      },
    ],
  };

  protected effect = signal<'translate' | 'scale' | 'rotate' | 'mixed'>('mixed');
  protected intensity = signal(30);

  protected readonly bgMove = () => {
    return this.effect() === 'translate' || this.effect() === 'mixed' ? -this.intensity() : 0;
  };

  protected readonly fgMove = () => {
    return this.effect() === 'translate' || this.effect() === 'mixed' ? this.intensity() : 0;
  };

  protected readonly scaleKeyframes = () => {
    if (this.effect() === 'scale' || this.effect() === 'mixed') {
      const s = this.intensity() / 100;
      return [0.9, 1 + s];
    }
    return [1, 1];
  };

  protected readonly rotationKeyframes = () => {
    if (this.effect() === 'rotate' || this.effect() === 'mixed') {
      return [0, this.intensity() * 0.5];
    }
    return [0, 0];
  };

  protected readonly effectLabel = () => {
    const labels = {
      translate: 'Vertical movement',
      scale: 'Scale transformation',
      rotate: 'Rotation effect',
      mixed: 'Combined effects',
    };
    return labels[this.effect()];
  };

  protected onStateChange(state: DemoState): void {
    this.effect.set((state['effect'] as 'translate' | 'scale' | 'rotate' | 'mixed') ?? 'mixed');
    this.intensity.set((state['intensity'] as number) ?? 30);
  }
}
