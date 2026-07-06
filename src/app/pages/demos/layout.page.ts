import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MoveLayoutDirective } from 'movement';
import { DemoContainer, DemoState } from '../../shared/components/demo-container/demo-container';

@Component({
  selector: 'app-demo-layout',
  imports: [DemoContainer, MoveLayoutDirective],
  template: `
    <app-demo-container
      title="moveLayout"
      description="Animate layout changes smoothly. Elements automatically animate to their new positions when the layout changes."
      directive="moveLayout"
      [availablePresets]="[]"
      [controls]="controlsConfig"
      [initialDuration]="400"
      initialEasing="ease-out"
      (stateChange)="onStateChange($event)"
      [showReplay]="false"
      [directiveBinding]="''"
    >
      <!-- Preview -->
      <div preview class="relative flex h-full w-full items-center justify-center">
        <div class="absolute top-4 left-4 z-10 flex gap-2">
          <button
            (click)="setLayout('grid')"
            data-testid="layout-grid-button"
            [attr.aria-pressed]="layout() === 'grid'"
            class="text-accent hover:text-accent-light rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            [class.bg-accent]="layout() === 'grid'"
            [class.text-white]="layout() === 'grid'"
            [class.bg-accent/10]="layout() !== 'grid'"
          >
            Grid
          </button>
          <button
            (click)="setLayout('list')"
            data-testid="layout-list-button"
            [attr.aria-pressed]="layout() === 'list'"
            class="text-accent hover:text-accent-light rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            [class.bg-accent]="layout() === 'list'"
            [class.text-white]="layout() === 'list'"
            [class.bg-accent/10]="layout() !== 'list'"
          >
            List
          </button>
          <button
            (click)="shuffle()"
            data-testid="layout-shuffle-button"
            class="text-accent hover:text-accent-light bg-accent/10 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            Shuffle
          </button>
        </div>

        <div
          moveLayout
          data-testid="layout-demo-items"
          [attr.data-layout]="layout()"
          [moveDuration]="duration()"
          [moveEasing]="easing()"
          class="mx-auto transition-all"
          [class.grid]="layout() === 'grid'"
          [class.flex]="layout() === 'list'"
          [class.grid-cols-3]="layout() === 'grid'"
          [class.flex-col]="layout() === 'list'"
          [class.gap-2]="true"
        >
          @for (item of items(); track item.id) {
            <div
              data-testid="layout-demo-item"
              class="bg-surface border-accent/40 font-display text-text flex items-center justify-center rounded-xl border font-bold shadow-[0_0_18px_rgba(80,120,255,0.12)]"
              [class.h-16]="layout() === 'grid'"
              [class.w-16]="layout() === 'grid'"
              [class.h-11]="layout() === 'list'"
              [class.w-40]="layout() === 'list'"
            >
              {{ item.label }}
            </div>
          }
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
    const [first, ...rest] = current;
    const shuffled = first ? [...rest, first] : current;
    this.items.set(shuffled);
  }
}
