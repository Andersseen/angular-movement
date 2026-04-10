import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MOVEMENT_DIRECTIVES } from 'movement';
import { DemoContainer, DemoState } from '../../shared/components/demo-container/demo-container';

@Component({
  selector: 'app-demo-layout',
  imports: [DemoContainer, ...MOVEMENT_DIRECTIVES],
  template: `
    <app-demo-container
      title="moveLayout"
      description="Animate layout changes smoothly. Elements automatically animate to their new positions when the layout changes."
      directive="moveLayout"
      [availablePresets]="[]"
      [controls]="controlsConfig"
      (stateChange)="onStateChange($event)"
      [showReplay]="false"
    >
      <!-- Preview -->
      <div preview class="flex h-full w-full flex-col items-center justify-center gap-6">
        <div class="flex gap-2">
          <button
            (click)="setLayout('grid')"
            class="text-accent hover:text-accent-light rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            [class.bg-accent]="layout() === 'grid'"
            [class.text-white]="layout() === 'grid'"
            [class.bg-accent/10]="layout() !== 'grid'"
          >
            Grid
          </button>
          <button
            (click)="setLayout('list')"
            class="text-accent hover:text-accent-light rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            [class.bg-accent]="layout() === 'list'"
            [class.text-white]="layout() === 'list'"
            [class.bg-accent/10]="layout() !== 'list'"
          >
            List
          </button>
          <button
            (click)="shuffle()"
            class="text-accent hover:text-accent-light bg-accent/10 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            Shuffle
          </button>
        </div>

        <div
          moveLayout
          [moveDuration]="duration()"
          [moveEasing]="easing()"
          class="transition-all"
          [class.grid]="layout() === 'grid'"
          [class.flex]="layout() === 'list'"
          [class.grid-cols-3]="layout() === 'grid'"
          [class.flex-col]="layout() === 'list'"
          [class.gap-3]="true"
        >
          @for (item of items(); track item.id) {
            <div
              class="bg-surface border-accent/40 font-display text-text flex items-center justify-center rounded-xl border p-4 font-bold"
              [class.h-20]="layout() === 'grid'"
              [class.w-20]="layout() === 'grid'"
              [class.w-full]="layout() === 'list'"
            >
              {{ item.label }}
            </div>
          }
        </div>

        <div class="text-text-muted max-w-xs text-center text-sm">
          Toggle between grid/list or shuffle items to see layout animations
        </div>
      </div>
    </app-demo-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DemoLayout {
  protected readonly controlsConfig = {
    showPreset: false,
    showDuration: true,
    showDelay: false,
    showEasing: true,
  };

  protected layout = signal<'grid' | 'list'>('grid');
  protected duration = signal(400);
  protected easing = signal('ease-out');
  protected items = signal([
    { id: 1, label: 'A' },
    { id: 2, label: 'B' },
    { id: 3, label: 'C' },
    { id: 4, label: 'D' },
    { id: 5, label: 'E' },
    { id: 6, label: 'F' },
  ]);

  protected onStateChange(state: DemoState): void {
    this.duration.set(state.duration);
    this.easing.set(state.easing);
  }

  protected setLayout(layout: 'grid' | 'list'): void {
    this.layout.set(layout);
  }

  protected shuffle(): void {
    const current = this.items();
    const shuffled = [...current].sort(() => Math.random() - 0.5);
    this.items.set(shuffled);
  }
}
