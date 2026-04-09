import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MOVEMENT_DIRECTIVES, MovePreset } from 'movement';
import { DemoContainer } from '../../../../shared/components/demo-container/demo-container';

@Component({
  selector: 'app-demo-hover',
  imports: [DemoContainer, ...MOVEMENT_DIRECTIVES],
  template: `
    <app-demo-container
      title="moveWhileHover"
      description="Add hover animations to elements. The animation plays forward on mouse enter and reverses on mouse leave."
      directive="moveWhileHover"
      [availablePresets]="availablePresets"
      [controls]="controlsConfig"
      [showReplay]="false"
    >
      <!-- Preview -->
      <div preview class="flex h-full w-full items-center justify-center">
        <div
          [moveWhileHover]="preset()"
          [moveDuration]="duration()"
          [moveEasing]="easing()"
          class="bg-surface border-accent/40 group flex min-w-[200px] cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border p-8 shadow-[0_0_30px_var(--color-accent-glow)] transition-shadow hover:shadow-[0_0_50px_var(--color-accent-glow)]"
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
          <div class="font-display text-text text-xl font-bold">Hover Me</div>
          <div class="text-text-muted text-sm">Move your mouse over this card</div>
        </div>
      </div>
    </app-demo-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DemoHover {
  // Hover works better with subtle presets
  protected readonly availablePresets: MovePreset[] = [
    'fade-up',
    'zoom-in',
    'zoom-out',
    'slide-up',
    'bounce-in',
  ];

  protected readonly controlsConfig = {
    showPreset: true,
    showDuration: true,
    showDelay: false,
    showEasing: true,
  };

  protected preset = signal<MovePreset>('zoom-in');
  protected duration = signal(200);
  protected easing = signal('ease-out');
}
