import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  MoveAnimateDirective,
  MovePresenceForDirective,
  MovePresenceForMode,
  MovePreset,
} from 'movement';
import { DemoContainer, DemoState } from '../../shared/components/demo-container/demo-container';
import { ALL_PRESETS, DEFAULT_CONTROLS, getPresetLabel } from '../../shared/utils/demo.utils';

interface ListItem {
  id: number;
  label: string;
}

@Component({
  selector: 'app-demo-presence-list',
  imports: [DemoContainer, MovePresenceForDirective, MoveAnimateDirective],
  template: `
    <app-demo-container
      title="movePresenceFor"
      description="AnimatePresence for keyed lists. Renders the list itself so a removed item stays mounted until its leave animation finishes — something @for cannot do, because it destroys the view immediately."
      directive="movePresenceFor"
      [availablePresets]="availablePresets"
      [controls]="controlsConfig"
      (stateChange)="onStateChange($event)"
      [showReplay]="false"
    >
      <!-- Preview -->
      <div preview class="flex h-full w-full flex-col items-center justify-center gap-4">
        <div class="flex flex-wrap justify-center gap-2">
          <button
            data-testid="presence-list-add"
            (click)="add()"
            class="bg-accent rounded-lg px-4 py-2 text-sm font-medium text-white"
          >
            Add item
          </button>
          <button
            data-testid="presence-list-shuffle"
            (click)="shuffle()"
            class="bg-surface text-text-muted rounded-lg px-4 py-2 text-sm font-medium"
          >
            Shuffle
          </button>
          <button
            data-testid="presence-list-mode"
            (click)="toggleMode()"
            class="bg-surface text-text-muted rounded-lg px-4 py-2 text-sm font-medium"
          >
            mode: {{ mode() }}
          </button>
        </div>

        <div data-testid="presence-list" class="flex w-full max-w-[280px] flex-col gap-2">
          <div
            *movePresenceFor="let item of items(); trackBy: trackById; mode: mode()"
            [move]="preset()"
            [moveDuration]="duration()"
            [moveEasing]="easing()"
            [attr.data-testid]="'presence-list-item-' + item.id"
            class="bg-surface border-accent/40 flex items-center justify-between rounded-xl border px-4 py-3"
          >
            <span class="text-text text-sm font-medium">{{ item.label }}</span>
            <button
              [attr.data-testid]="'presence-list-remove-' + item.id"
              (click)="remove(item.id)"
              class="text-text-muted hover:text-accent text-xs"
            >
              Remove
            </button>
          </div>
        </div>

        <div class="text-text-muted max-w-xs text-center text-sm">
          {{ presetLabel() }} — removing an item plays its leave animation before the row is
          dropped.
        </div>
      </div>
    </app-demo-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DemoPresenceList {
  protected readonly availablePresets = ALL_PRESETS;
  protected readonly controlsConfig = DEFAULT_CONTROLS.standard;

  protected readonly items = signal<ListItem[]>([
    { id: 1, label: 'First item' },
    { id: 2, label: 'Second item' },
    { id: 3, label: 'Third item' },
  ]);
  protected readonly mode = signal<MovePresenceForMode>('sync');

  protected preset = signal<MovePreset>('fade-up');
  protected duration = signal(300);
  protected easing = signal('ease');

  #nextId = 4;

  protected readonly presetLabel = () => getPresetLabel(this.preset());

  protected readonly trackById = (_index: number, item: ListItem) => item.id;

  protected add(): void {
    const id = this.#nextId++;
    this.items.update((items) => [...items, { id, label: `Item ${id}` }]);
  }

  protected remove(id: number): void {
    this.items.update((items) => items.filter((item) => item.id !== id));
  }

  protected shuffle(): void {
    this.items.update((items) => [...items].reverse());
  }

  protected toggleMode(): void {
    this.mode.update((mode) => (mode === 'sync' ? 'wait' : 'sync'));
  }

  protected onStateChange(state: DemoState): void {
    this.preset.set(state.preset);
    this.duration.set(state.duration);
    this.easing.set(state.easing);
  }
}
