import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MOVEMENT_DIRECTIVES, MovePreset } from 'movement';
import { DemoContainer, DemoState } from '../../shared/components/demo-container/demo-container';
import { ALL_PRESETS, getPresetLabel, DEFAULT_CONTROLS } from '../../shared/utils/demo.utils';

@Component({
  selector: 'app-demo-presence',
  imports: [DemoContainer, ...MOVEMENT_DIRECTIVES],
  template: `
    <app-demo-container
      title="movePresence"
      description="AnimatePresence pattern for coordinating enter/leave animations. Wraps content and animates it in/out based on condition."
      directive="movePresence"
      [availablePresets]="availablePresets"
      [controls]="controlsConfig"
      (stateChange)="onStateChange($event)"
      [showReplay]="false"
    >
      <!-- Preview -->
      <div preview class="flex h-full w-full flex-col items-center justify-center gap-4">
        <div class="flex gap-2">
          @for (tab of tabs; track tab.id) {
            <button
              (click)="activeTab.set(tab.id)"
              class="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              [class.bg-accent]="activeTab() === tab.id"
              [class.text-white]="activeTab() === tab.id"
              [class.bg-surface]="activeTab() !== tab.id"
              [class.text-text-muted]="activeTab() !== tab.id"
            >
              {{ tab.label }}
            </button>
          }
        </div>

        <div class="relative h-40 w-full max-w-[256px]">
          @for (tab of tabs; track tab.id) {
            <div *movePresence="activeTab() === tab.id" class="absolute inset-0">
              <div
                [moveLeave]="preset()"
                [moveDuration]="duration()"
                [moveEasing]="easing()"
                class="bg-surface border-accent/40 flex h-full w-full items-center justify-center rounded-xl border p-6 shadow-[0_0_30px_var(--color-accent-glow)]"
              >
                <div class="text-center">
                  <div class="font-display text-text mb-2 text-xl font-bold">{{ tab.label }}</div>
                  <div class="text-text-muted text-sm">{{ presetLabel() }}</div>
                </div>
              </div>
            </div>
          }
        </div>

        <div class="text-text-muted max-w-xs text-center text-sm">
          *movePresence coordinates enter/leave animations when condition changes.
        </div>
      </div>
    </app-demo-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DemoPresence {
  protected readonly availablePresets = ALL_PRESETS;
  protected readonly controlsConfig = DEFAULT_CONTROLS.standard;

  protected readonly tabs = [
    { id: 1, label: 'Tab 1' },
    { id: 2, label: 'Tab 2' },
    { id: 3, label: 'Tab 3' },
  ];

  protected preset = signal<MovePreset>('fade-up');
  protected duration = signal(300);
  protected easing = signal('ease');
  protected activeTab = signal(1);

  protected readonly presetLabel = () => getPresetLabel(this.preset());

  protected onStateChange(state: DemoState): void {
    this.preset.set(state.preset);
    this.duration.set(state.duration);
    this.easing.set(state.easing);
  }
}
