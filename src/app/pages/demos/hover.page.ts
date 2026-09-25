import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MoveHoverDirective, MoveKeyframes, MovePreset, MoveTapDirective } from 'movement';
import { DemoContainer, DemoState } from '../../shared/components/demo-container/demo-container';
import { keyframesToString } from '../../shared/utils/demo.utils';

@Component({
  selector: 'app-demo-hover',
  imports: [DemoContainer, MoveHoverDirective, MoveTapDirective, RouterLink],
  template: `
    <app-demo-container
      title="moveWhileHover"
      description="Hover animations for mouse and pen. Plays forward on pointer enter and reverses on leave. Touch has no hover state, so pair it with moveWhileTap for press feedback — the card below uses the lift and press presets together."
      directive="moveWhileHover"
      [availablePresets]="[]"
      [controls]="controlsConfig"
      [initialDuration]="200"
      initialEasing="ease-out"
      (stateChange)="onStateChange($event)"
      [showReplay]="false"
      [customCode]="hoverCode()"
    >
      <!-- Preview -->
      <div preview class="flex h-full w-full flex-col items-center justify-center gap-6">
        <div
          data-testid="hover-card"
          [moveWhileHover]="hoverKeyframes()"
          [moveDuration]="duration()"
          [moveEasing]="easing()"
          moveWhileTap="press"
          class="bg-surface border-accent/40 group flex min-w-[240px] cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border p-8 shadow-[0_0_30px_var(--color-accent-glow)] transition-shadow hover:shadow-[0_0_50px_var(--color-accent-glow)]"
        >
          <div
            class="bg-accent/20 group-hover:bg-accent/30 flex h-16 w-16 items-center justify-center rounded-full transition-colors"
          >
            <svg class="text-accent h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
              />
            </svg>
          </div>
          <div class="font-display text-text text-xl font-bold">{{ effectLabel() }}</div>
          <div class="text-text-muted text-sm">
            <span class="hidden sm:inline">Hover over this card</span>
            <span class="sm:hidden">Press this card — touch uses moveWhileTap</span>
          </div>
        </div>

        <!-- The pattern real apps use on links: must stay tappable and scrollable on touch. -->
        <a
          data-testid="hover-link"
          routerLink="/demos/tap"
          moveWhileHover="lift"
          moveWhileTap="press"
          class="text-accent border-accent/30 bg-surface rounded-lg border px-4 py-2 text-sm font-semibold"
        >
          Next: moveWhileTap →
        </a>
      </div>
    </app-demo-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DemoHover {
  protected readonly controlsConfig = {
    showPreset: false,
    showDuration: true,
    showDelay: false,
    showEasing: true,
    customControls: [
      {
        id: 'effect',
        type: 'select' as const,
        label: 'Hover Effect',
        value: 'lift',
        options: [
          { label: 'Lift (preset)', value: 'lift' },
          { label: 'Scale Up', value: 'scale' },
          { label: 'Pulse', value: 'pulse' },
          { label: 'Glow', value: 'glow' },
        ],
      },
    ],
  };

  protected effect = signal<'scale' | 'lift' | 'pulse' | 'glow'>('lift');
  protected duration = signal(200);
  protected easing = signal('ease-out');

  protected readonly hoverCode = computed(() => {
    const hover = this.hoverKeyframes();
    const binding =
      typeof hover === 'string'
        ? `moveWhileHover="${hover}"`
        : `[moveWhileHover]="${keyframesToString(hover)}"`;
    return `<article
  ${binding}
  moveWhileTap="press"
  moveDuration="${this.duration()}ms"
  moveEasing="${this.easing()}">
  …
</article>`;
  });

  protected readonly hoverKeyframes = (): MovePreset | MoveKeyframes => {
    switch (this.effect()) {
      case 'scale':
        return { scale: [1, 1.1] };
      case 'lift':
        return 'lift';
      case 'pulse':
        return { scale: [1, 1.05, 1] };
      case 'glow':
        return { scale: [1, 1.05] };
      default:
        return { scale: [1, 1.1] };
    }
  };

  protected readonly effectLabel = () => {
    const labels: Record<string, string> = {
      scale: 'Scale Up',
      lift: 'Lift',
      pulse: 'Pulse',
      glow: 'Glow',
    };
    return labels[this.effect()] || 'Hover Effect';
  };

  protected onStateChange(state: DemoState): void {
    this.effect.set((state['effect'] as 'scale' | 'lift' | 'pulse' | 'glow') ?? 'lift');
    this.duration.set(state.duration);
    this.easing.set(state.easing);
  }
}
