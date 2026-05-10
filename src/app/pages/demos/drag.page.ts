import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { MOVEMENT_DIRECTIVES } from 'movement';
import { DemoContainer, DemoState } from '../../shared/components/demo-container/demo-container';

@Component({
  selector: 'app-demo-drag',
  imports: [DemoContainer, ...MOVEMENT_DIRECTIVES],
  template: `
    <app-demo-container
      title="moveDrag"
      description="Make elements draggable with smooth physics. Supports constraints, momentum, and snap points."
      directive="moveDrag"
      [availablePresets]="[]"
      [controls]="controlsConfig"
      (stateChange)="onStateChange($event)"
      [showReplay]="false"
      [customCode]="dragCode()"
    >
      <!-- Preview -->
      <div preview class="relative flex h-full w-full items-center justify-center overflow-hidden">
        <div
          moveDrag
          [moveDragConstraints]="
            constrained() ? { left: -100, right: 100, top: -80, bottom: 80 } : undefined
          "
          class="bg-surface border-accent/40 flex cursor-grab flex-col items-center gap-3 rounded-xl border p-6 shadow-[0_0_30px_var(--color-accent-glow)] active:cursor-grabbing"
        >
          <div class="bg-accent/20 flex h-12 w-12 items-center justify-center rounded-full">
            <svg class="text-accent h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
          </div>
          <div class="font-display text-text font-semibold">Drag Me</div>
          <div class="text-text-muted text-xs">
            {{ constrained() ? 'Constrained' : 'Free movement' }}
          </div>
        </div>
      </div>
    </app-demo-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DemoDrag {
  protected readonly controlsConfig = {
    showPreset: false,
    showDuration: false,
    showDelay: false,
    showEasing: false,
    customControls: [
      {
        id: 'constrained',
        type: 'toggle' as const,
        label: 'Constrain to Area',
        value: false,
      },
    ],
  };

  protected constrained = signal(false);

  protected readonly dragCode = computed(() => {
    const c = this.constrained();
    const constraints = c
      ? ' [moveDragConstraints]="{ left: -100, right: 100, top: -80, bottom: 80 }"'
      : '';
    return `&lt;<span class="code-keyword">div</span> <span class="code-attr">moveDrag</span>${constraints}&gt;\n  Drag Me\n&lt;/<span class="code-keyword">div</span>&gt;`;
  });

  protected onStateChange(state: DemoState): void {
    this.constrained.set((state['constrained'] as boolean) ?? false);
  }
}
