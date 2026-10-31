import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  Injector,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MoveDragDirective, MoveHoverDirective, MoveLayoutDirective } from 'angular-movement';

interface Card {
  id: number;
  label: string;
}

/**
 * Scenario A — dashboard. Every layout change is application state: filter, column count, an
 * expanded card, inserted cards and a reordered list. The library only animates the consequence.
 */
@Component({
  selector: 'app-dashboard',
  imports: [MoveLayoutDirective],
  template: `
    <section aria-label="Dashboard">
      <button data-testid="dash-cols" (click)="cols.set(cols() === 3 ? 2 : 3)">columns</button>
      <button data-testid="dash-filter" (click)="filtered.set(!filtered())">filter</button>
      <button data-testid="dash-expand" (click)="expanded.set(!expanded())">expand</button>
      <button data-testid="dash-add" (click)="add()">add</button>
      <button data-testid="dash-remove" (click)="remove()">remove</button>
      <button data-testid="dash-shuffle" (click)="shuffle()">shuffle</button>
      <div
        data-testid="dash-grid"
        style="display: grid; gap: 8px; width: 360px"
        [style.grid-template-columns]="'repeat(' + cols() + ', 1fr)'"
      >
        @for (card of visible(); track card.id) {
          <div
            moveLayout
            moveDuration="400ms"
            moveEasing="linear"
            data-testid="dash-card"
            [attr.data-id]="card.id"
            [style.grid-column]="expanded() && card.id === 1 ? 'span 2' : null"
            style="height: 56px; background: #345; color: #fff"
          >
            {{ card.label }}
          </div>
        }
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  protected readonly cols = signal(3);
  protected readonly filtered = signal(false);
  protected readonly expanded = signal(false);
  protected readonly cards = signal<Card[]>(
    [1, 2, 3, 4, 5, 6].map((id) => ({ id, label: `Card ${id}` })),
  );
  protected readonly visible = computed(() =>
    this.filtered() ? this.cards().filter((c) => c.id % 2 === 1) : this.cards(),
  );
  #next = 7;

  protected add(): void {
    const id = this.#next++;
    this.cards.update((cards) => [...cards, { id, label: `Card ${id}` }]);
  }

  protected remove(): void {
    this.cards.update((cards) => cards.slice(0, -1));
  }

  protected shuffle(): void {
    this.cards.update(([first, ...rest]) => (first ? [...rest, first] : []));
  }
}

/** Scenario B — a card hands over to a detail surface that shares its `moveLayoutId`. */
@Component({
  selector: 'app-shared-detail',
  imports: [MoveLayoutDirective],
  template: `
    <div
      data-testid="shared-grid"
      style="display: grid; grid-template-columns: repeat(3, 100px); gap: 8px"
    >
      @for (card of cards; track card.id) {
        @if (open() === card.id) {
          <section
            moveLayout
            moveLayoutScope="packed"
            [moveLayoutId]="'card-' + card.id"
            moveDuration="300ms"
            data-testid="shared-detail"
            style="grid-column: 1 / -1; height: 120px; background: #536"
          >
            {{ card.label }} detail
            <button data-testid="shared-close" (click)="close()">close</button>
          </section>
        } @else {
          <button
            moveLayout
            moveLayoutScope="packed"
            [moveLayoutId]="'card-' + card.id"
            moveDuration="300ms"
            [attr.data-testid]="'shared-card-' + card.id"
            style="height: 60px"
            (click)="show(card.id)"
          >
            {{ card.label }}
          </button>
        }
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SharedDetail {
  readonly #injector = inject(Injector);
  protected readonly cards: Card[] = [
    { id: 1, label: 'A' },
    { id: 2, label: 'B' },
    { id: 3, label: 'C' },
  ];
  protected readonly open = signal<number | null>(null);

  protected show(id: number): void {
    this.open.set(id);
    this.#focus('[data-testid="shared-close"]');
  }

  protected close(): void {
    const id = this.open();
    this.open.set(null);
    this.#focus(`[data-testid="shared-card-${id}"]`);
  }

  #focus(selector: string): void {
    afterNextRender(() => document.querySelector<HTMLElement>(selector)?.focus(), {
      injector: this.#injector,
    });
  }
}

/**
 * Scenario C — composition. One element owns three writers: layout (FLIP), hover (scale) and drag
 * (direct transform). They must share the element without drift or a stale writer.
 */
@Component({
  selector: 'app-composed',
  imports: [MoveLayoutDirective, MoveDragDirective, MoveHoverDirective],
  template: `
    <button data-testid="composed-cols" (click)="cols.set(cols() === 3 ? 2 : 3)">columns</button>
    <button data-testid="composed-add" (click)="extra.set(extra() + 1)">add</button>
    <div
      data-testid="composed-grid"
      style="position: relative; display: grid; gap: 8px; width: 330px"
      [style.grid-template-columns]="'repeat(' + cols() + ', 100px)'"
    >
      <div style="height: 40px">1</div>
      <div style="height: 40px">2</div>
      <div
        moveLayout
        moveDrag
        moveDuration="300ms"
        [moveWhileHover]="{ scale: [1, 1.1] }"
        data-testid="composed-item"
        style="height: 40px; background: #355; touch-action: none"
      >
        drag me
      </div>
      <div style="height: 40px">4</div>
      @for (n of extraRows(); track n) {
        <div style="height: 40px">extra {{ n }}</div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Composed {
  protected readonly cols = signal(3);
  protected readonly extra = signal(0);
  protected readonly extraRows = computed(() => Array.from({ length: this.extra() }, (_, i) => i));
}
