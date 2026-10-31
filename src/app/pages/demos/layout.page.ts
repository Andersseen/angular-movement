import type { RouteMeta } from '@analogjs/router';
import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MoveLayoutDirective, MovePresenceForDirective, MoveAnimateDirective } from 'movement';
import { DemoContainer, DemoState } from '../../shared/components/demo-container/demo-container';

export const routeMeta: RouteMeta = { title: 'moveLayout demo — Angular Movement' };

type Scenario = 'reflow' | 'shared' | 'presence';

interface Card {
  id: number;
  label: string;
}

const SCENARIOS: readonly { id: Scenario; label: string }[] = [
  { id: 'reflow', label: 'Reflow' },
  { id: 'shared', label: 'Shared element' },
  { id: 'presence', label: 'With presence' },
];

const button =
  'text-accent hover:text-accent-light bg-accent/10 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors';

@Component({
  selector: 'app-demo-layout',
  imports: [DemoContainer, MoveLayoutDirective, MovePresenceForDirective, MoveAnimateDirective],
  template: `
    <app-demo-container
      [experimental]="true"
      title="moveLayout"
      description="Animate layout changes smoothly. Elements animate from where they were painted to where application state now puts them — also when another change interrupts the animation, and across two different elements that share a moveLayoutId."
      directive="moveLayout"
      [availablePresets]="[]"
      [controls]="controlsConfig"
      [initialDuration]="400"
      initialEasing="ease-out"
      (stateChange)="onStateChange($event)"
      [showReplay]="false"
      [customCode]="layoutCode()"
      [supportCode]="layoutSupport()"
      (resetDemo)="reset()"
      [directiveBinding]="''"
      [sourceImports]="sourceImports()"
    >
      <!-- Preview -->
      <div preview class="relative flex h-full w-full flex-col items-center gap-3 p-4">
        <div class="flex flex-wrap items-center justify-center gap-2" role="tablist">
          @for (s of scenarios; track s.id) {
            <button
              role="tab"
              type="button"
              [attr.data-testid]="'layout-scenario-' + s.id"
              [attr.aria-selected]="scenario() === s.id"
              (click)="scenario.set(s.id)"
              class="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              [class.bg-accent-solid]="scenario() === s.id"
              [class.text-white]="scenario() === s.id"
              [class.bg-accent/10]="scenario() !== s.id"
              [class.text-accent]="scenario() !== s.id"
            >
              {{ s.label }}
            </button>
          }
        </div>

        @switch (scenario()) {
          @case ('reflow') {
            <div class="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                (click)="layout.set('grid')"
                data-testid="layout-grid-button"
                [attr.aria-pressed]="layout() === 'grid'"
                class="${button}"
              >
                Grid
              </button>
              <button
                type="button"
                (click)="layout.set('list')"
                data-testid="layout-list-button"
                [attr.aria-pressed]="layout() === 'list'"
                class="${button}"
              >
                List
              </button>
              <button
                type="button"
                (click)="shuffle()"
                data-testid="layout-shuffle-button"
                class="${button}"
              >
                Shuffle
              </button>
              <button
                type="button"
                (click)="filtered.set(!filtered())"
                data-testid="layout-filter-button"
                [attr.aria-pressed]="filtered()"
                class="${button}"
              >
                Filter
              </button>
              <button
                type="button"
                (click)="add()"
                data-testid="layout-add-button"
                class="${button}"
              >
                Add
              </button>
              <button
                type="button"
                (click)="nested.set(!nested())"
                data-testid="layout-nest-button"
                [attr.aria-pressed]="nested()"
                class="${button}"
              >
                Nest
              </button>
              <button
                type="button"
                (click)="wide.set(!wide())"
                data-testid="layout-resize-button"
                [attr.aria-pressed]="wide()"
                class="${button}"
              >
                Resize
              </button>
            </div>

            <div
              [moveLayout]="nested()"
              [moveDuration]="duration()"
              [moveEasing]="easing()"
              data-testid="layout-demo-items"
              [attr.data-layout]="layout()"
              class="gap-2"
              [class.grid]="layout() === 'grid'"
              [class.flex]="layout() === 'list'"
              [class.flex-col]="layout() === 'list'"
              [style.width.px]="wide() ? 264 : 196"
              [style.grid-template-columns]="layout() === 'grid' ? 'repeat(auto-fill, 64px)' : null"
            >
              @for (item of visible(); track item.id) {
                <div
                  moveLayout
                  [moveDuration]="duration()"
                  [moveEasing]="easing()"
                  data-testid="layout-demo-item"
                  class="bg-surface border-accent/40 font-display text-text flex items-center justify-center rounded-xl border font-bold shadow-[0_0_18px_rgba(80,120,255,0.12)]"
                  [class.h-16]="layout() === 'grid'"
                  [class.w-16]="layout() === 'grid'"
                  [class.h-11]="layout() === 'list'"
                  [class.w-full]="layout() === 'list'"
                >
                  {{ item.label }}
                </div>
              }
            </div>
          }

          @case ('shared') {
            <p class="text-text-muted text-xs">
              Open a card: the detail takes over the card's <code>moveLayoutId</code>.
            </p>
            <div
              data-testid="layout-shared-grid"
              class="grid w-full max-w-[420px] grid-cols-3 gap-2"
              role="group"
              aria-label="Cards"
            >
              @for (card of cards; track card.id) {
                @if (openId() === card.id) {
                  <section
                    moveLayout
                    [moveLayoutId]="'card-' + card.id"
                    moveLayoutScope="shared-demo"
                    [moveDuration]="duration()"
                    [moveEasing]="easing()"
                    data-testid="layout-shared-detail"
                    class="bg-accent-solid col-span-3 flex min-h-[132px] flex-col gap-2 rounded-xl p-3 text-white"
                    [attr.aria-label]="card.label + ' detail'"
                  >
                    <span class="font-display text-lg font-bold">{{ card.label }}</span>
                    <span class="text-xs">Detail surface — state lives in the component.</span>
                    <button
                      type="button"
                      data-testid="layout-shared-close"
                      (click)="close()"
                      class="mt-auto self-start rounded-md bg-white/20 px-2 py-1 text-xs"
                    >
                      Close
                    </button>
                  </section>
                } @else {
                  <button
                    moveLayout
                    type="button"
                    [moveLayoutId]="'card-' + card.id"
                    moveLayoutScope="shared-demo"
                    [moveDuration]="duration()"
                    [moveEasing]="easing()"
                    [attr.data-testid]="'layout-shared-card-' + card.id"
                    [attr.data-card]="card.id"
                    (click)="open(card.id)"
                    class="bg-surface border-accent/40 font-display text-text h-16 rounded-xl border font-bold"
                  >
                    {{ card.label }}
                  </button>
                }
              }
            </div>
          }

          @case ('presence') {
            <div class="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                (click)="addPresence()"
                data-testid="layout-presence-add"
                class="${button}"
              >
                Add
              </button>
              <button
                type="button"
                (click)="shufflePresence()"
                data-testid="layout-presence-shuffle"
                class="${button}"
              >
                Reverse
              </button>
            </div>
            <div
              data-testid="layout-presence-list"
              class="relative flex w-full max-w-[260px] flex-col gap-2"
            >
              <div
                *movePresenceFor="
                  let item of presenceItems();
                  trackBy: trackById;
                  mode: 'popLayout'
                "
                moveLayout
                move="fade-up"
                [moveDuration]="duration()"
                [moveEasing]="easing()"
                [attr.data-testid]="'layout-presence-item-' + item.id"
                class="bg-surface border-accent/40 flex items-center justify-between rounded-xl border px-4 py-3"
              >
                <span class="text-text text-sm font-medium">{{ item.label }}</span>
                <button
                  type="button"
                  [attr.data-testid]="'layout-presence-remove-' + item.id"
                  (click)="removePresence(item.id)"
                  class="text-text-muted hover:text-accent text-xs"
                >
                  Remove
                </button>
              </div>
            </div>
          }
        }
      </div>
    </app-demo-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DemoLayout {
  readonly #injector = inject(Injector);

  protected readonly controlsConfig = {
    showPreset: false,
    showDuration: true,
    showDelay: false,
    showEasing: true,
  };
  protected readonly scenarios = SCENARIOS;
  protected readonly cards: readonly Card[] = [
    { id: 1, label: 'A' },
    { id: 2, label: 'B' },
    { id: 3, label: 'C' },
  ];

  protected readonly scenario = signal<Scenario>('reflow');
  protected readonly layout = signal<'grid' | 'list'>('grid');
  protected readonly filtered = signal(false);
  protected readonly wide = signal(true);
  protected readonly nested = signal(false);
  protected readonly duration = signal(400);
  protected readonly easing = signal('ease-out');
  protected readonly openId = signal<number | null>(null);
  protected readonly items = signal<Card[]>(initialItems());
  protected readonly presenceItems = signal<Card[]>(initialItems().slice(0, 3));
  protected readonly visible = computed(() =>
    this.filtered() ? this.items().filter((item) => item.id % 2 === 0) : this.items(),
  );
  protected readonly trackById = (_: number, item: Card) => item.id;

  #nextId = 7;
  #nextPresenceId = 4;

  protected readonly sourceImports = computed(() =>
    this.scenario() === 'presence'
      ? ['MoveLayoutDirective', 'MovePresenceForDirective']
      : ['MoveLayoutDirective'],
  );

  protected readonly layoutSupport = computed(() => {
    switch (this.scenario()) {
      case 'shared':
        return `readonly openId = signal<number | null>(null);
readonly cards = [{ id: 1, label: 'A' }, { id: 2, label: 'B' }, { id: 3, label: 'C' }];`;
      case 'presence':
        return `readonly items = signal([{ id: 1, label: 'One' }, { id: 2, label: 'Two' }]);
readonly byId = (_: number, item: { id: number }) => item.id;`;
      default:
        return `readonly list = signal(false);
readonly items = signal([{ id: 1, label: 'A' }, { id: 2, label: 'B' }, { id: 3, label: 'C' }]);`;
    }
  });

  protected readonly layoutCode = computed(() => {
    const timing = `moveDuration="${this.duration()}ms" moveEasing="${this.easing()}"`;
    switch (this.scenario()) {
      case 'shared':
        return `@for (card of cards; track card.id) {
  @if (openId() === card.id) {
    <section moveLayout moveLayoutScope="cards" [moveLayoutId]="'card-' + card.id" ${timing}>
      <button (click)="openId.set(null)">Close</button>
    </section>
  } @else {
    <button moveLayout moveLayoutScope="cards" [moveLayoutId]="'card-' + card.id" ${timing}
      (click)="openId.set(card.id)">{{ card.label }}</button>
  }
}`;
      case 'presence':
        return `<div *movePresenceFor="let item of items(); trackBy: byId; mode: 'popLayout'"
  moveLayout move="fade-up" ${timing}>{{ item.label }}</div>`;
      default:
        return `<button (click)="list.set(!list())">Grid / list</button>
<div [style.display]="list() ? 'flex' : 'grid'" style="gap: 8px; flex-direction: column">
  @for (item of items(); track item.id) {
    <div moveLayout ${timing}>{{ item.label }}</div>
  }
</div>`;
    }
  });

  protected reset(): void {
    this.layout.set('grid');
    this.filtered.set(false);
    this.wide.set(true);
    this.nested.set(false);
    this.openId.set(null);
    this.items.set(initialItems());
    this.presenceItems.set(initialItems().slice(0, 3));
    this.#nextId = 7;
    this.#nextPresenceId = 4;
  }

  protected onStateChange(state: DemoState): void {
    this.duration.set(state.duration);
    this.easing.set(state.easing);
  }

  protected shuffle(): void {
    const [first, ...rest] = this.items();
    this.items.set(first ? [...rest, first] : []);
  }

  protected add(): void {
    const id = this.#nextId++;
    this.items.update((items) => [...items, { id, label: String.fromCharCode(64 + id) }]);
  }

  protected open(id: number): void {
    this.openId.set(id);
    this.#focus('[data-testid="layout-shared-close"]');
  }

  protected close(): void {
    const id = this.openId();
    this.openId.set(null);
    this.#focus(`[data-card="${id}"]`);
  }

  protected addPresence(): void {
    const id = this.#nextPresenceId++;
    this.presenceItems.update((items) => [...items, { id, label: `Item ${id}` }]);
  }

  protected removePresence(id: number): void {
    this.presenceItems.update((items) => items.filter((item) => item.id !== id));
  }

  protected shufflePresence(): void {
    this.presenceItems.update((items) => [...items].reverse());
  }

  /** Application-owned focus: the element that now holds the user's place gets it after render. */
  #focus(selector: string): void {
    afterNextRender(
      () =>
        document
          .querySelector<HTMLElement>(`[data-testid="layout-shared-grid"] ${selector}`)
          ?.focus(),
      { injector: this.#injector },
    );
  }
}

function initialItems(): Card[] {
  return ['A', 'B', 'C', 'D', 'E', 'F'].map((label, i) => ({ id: i + 1, label }));
}
