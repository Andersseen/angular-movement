import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { MoveFocusDirective, MoveKeyframes } from 'movement';
import { DemoContainer, DemoState } from '../../shared/components/demo-container/demo-container';
import { keyframesToString } from '../../shared/utils/demo.utils';

@Component({
  selector: 'app-demo-focus',
  imports: [DemoContainer, MoveFocusDirective],
  template: `
    <app-demo-container
      title="moveWhileFocus"
      description="Add focus animations to inputs, buttons, or cards. The animation plays forward on focus and reverses on blur."
      directive="moveWhileFocus"
      [availablePresets]="[]"
      [controls]="controlsConfig"
      [showReplay]="false"
      [directiveBinding]="focusCode()"
      (stateChange)="onStateChange($event)"
    >
      <!-- Preview -->
      <div preview class="flex h-full w-full items-center justify-center">
        <button
          [moveWhileFocus]="focusKeyframes()"
          [moveDuration]="duration()"
          [moveEasing]="easing()"
          [moveReverseDuration]="reverseDuration()"
          [moveReverseEasing]="reverseEasing()"
          class="bg-surface border-accent/40 group flex min-w-[240px] cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border p-8 shadow-[0_0_30px_var(--color-accent-glow)] transition-shadow focus:shadow-[0_0_50px_var(--color-accent-glow)]"
        >
          <div
            class="bg-accent/20 group-focus:bg-accent/30 flex h-16 w-16 items-center justify-center rounded-full transition-colors"
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
          <div class="font-display text-text text-xl font-bold">Focus me</div>
          <div class="text-text-muted text-sm">Tab or click to focus</div>
        </button>
      </div>
    </app-demo-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DemoFocus {
  protected readonly controlsConfig = {
    showPreset: false,
    showDuration: true,
    showDelay: false,
    showEasing: true,
    includeCustomControlsInCode: true,
    customControls: [
      {
        id: 'reverseDuration',
        type: 'range' as const,
        label: 'Reverse Duration',
        value: 200,
        min: 0,
        max: 1000,
        step: 50,
      },
      {
        id: 'reverseEasing',
        type: 'select' as const,
        label: 'Reverse Easing',
        value: 'ease-out',
        options: [
          { label: 'Ease', value: 'ease' },
          { label: 'Ease In', value: 'ease-in' },
          { label: 'Ease Out', value: 'ease-out' },
          { label: 'Ease In Out', value: 'ease-in-out' },
        ],
      },
    ],
  };

  protected readonly focusKeyframes = signal<MoveKeyframes>({
    scale: [1, 1.05],
    y: [0, -4],
  });
  protected readonly duration = signal(300);
  protected readonly easing = signal('ease-out');
  protected readonly reverseDuration = signal(200);
  protected readonly reverseEasing = signal('ease-out');

  protected readonly focusCode = computed(() => keyframesToString(this.focusKeyframes()));

  protected onStateChange(state: DemoState): void {
    this.duration.set(state.duration);
    this.easing.set(state.easing);
    this.reverseDuration.set((state['reverseDuration'] as number) ?? 200);
    this.reverseEasing.set((state['reverseEasing'] as string) ?? 'ease-out');
  }
}
