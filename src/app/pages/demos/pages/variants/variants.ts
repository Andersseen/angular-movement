import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MOVEMENT_DIRECTIVES, MoveVariant } from 'movement';
import {
  DemoContainer,
  DemoState,
} from '../../../../shared/components/demo-container/demo-container';

@Component({
  selector: 'app-demo-variants',
  imports: [DemoContainer, ...MOVEMENT_DIRECTIVES],
  template: `
    <app-demo-container
      title="moveVariants"
      description="Define multiple animation states and transition between them. Perfect for interactive components with multiple states."
      directive="moveAnimate"
      [availablePresets]="[]"
      [controls]="controlsConfig"
      (stateChange)="onStateChange($event)"
      [showReplay]="false"
    >
      <!-- Preview -->
      <div preview class="flex h-full w-full flex-col items-center justify-center gap-6">
        <div class="flex gap-2">
          @for (variant of variantNames; track variant) {
            <button
              (click)="currentVariant.set(variant)"
              class="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              [class.bg-accent]="currentVariant() === variant"
              [class.text-white]="currentVariant() === variant"
              [class.bg-surface]="currentVariant() !== variant"
              [class.text-text-muted]="currentVariant() !== variant"
            >
              {{ variant }}
            </button>
          }
        </div>

        <div
          [moveVariants]="variantsConfig"
          [moveAnimate]="$any(currentVariant())"
          [moveDuration]="duration()"
          [moveEasing]="easing()"
          class="bg-surface border-accent/40 flex h-32 w-32 items-center justify-center rounded-xl border shadow-[0_0_30px_var(--color-accent-glow)]"
        >
          <span class="font-display text-text text-lg font-bold">{{ currentVariant() }}</span>
        </div>

        <div class="text-text-muted max-w-xs text-center text-sm">
          Click buttons to transition between animation states
        </div>
      </div>
    </app-demo-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DemoVariants {
  protected readonly controlsConfig = {
    showPreset: false,
    showDuration: true,
    showDelay: false,
    showEasing: true,
  };

  protected readonly variantNames = ['idle', 'hover', 'active'];

  protected duration = signal(300);
  protected easing = signal('spring');
  protected currentVariant = signal('idle');

  protected readonly variantsConfig: Record<string, MoveVariant> = {
    idle: { scale: [1, 1], rotate: [0, 0] },
    hover: { scale: [1, 1.1], rotate: [0, 5] },
    active: { scale: [1, 0.95], rotate: [0, -5] },
  };

  protected onStateChange(state: DemoState): void {
    this.duration.set(state.duration);
    this.easing.set(state.easing);
  }
}
