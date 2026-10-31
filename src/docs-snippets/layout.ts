import { Component, signal } from '@angular/core';
import { MoveLayoutDirective, MovePresenceForDirective } from 'angular-movement';

// #region doqs:layout-basic
@Component({
  selector: 'app-dashboard',
  imports: [MoveLayoutDirective],
  template: `
    <button (click)="compact.set(!compact())">Toggle density</button>
    <div class="grid" [class.compact]="compact()">
      @for (card of cards(); track card.id) {
        <article moveLayout moveDuration="300ms">{{ card.title }}</article>
      }
    </div>
  `,
})
export class Dashboard {
  protected readonly compact = signal(false);
  protected readonly cards = signal([
    { id: 1, title: 'Revenue' },
    { id: 2, title: 'Signups' },
    { id: 3, title: 'Churn' },
  ]);
}
// #endregion doqs:layout-basic

// #region doqs:layout-shared
@Component({
  selector: 'app-card-detail',
  imports: [MoveLayoutDirective],
  template: `
    @for (card of cards; track card.id) {
      @if (openId() === card.id) {
        <section moveLayout moveLayoutScope="gallery" [moveLayoutId]="'card-' + card.id">
          {{ card.title }}
          <button (click)="openId.set(null)">Close</button>
        </section>
      } @else {
        <button
          moveLayout
          moveLayoutScope="gallery"
          [moveLayoutId]="'card-' + card.id"
          (click)="openId.set(card.id)"
        >
          {{ card.title }}
        </button>
      }
    }
  `,
})
export class CardDetail {
  protected readonly openId = signal<number | null>(null);
  protected readonly cards = [
    { id: 1, title: 'A' },
    { id: 2, title: 'B' },
  ];
}
// #endregion doqs:layout-shared

// #region doqs:layout-presence
@Component({
  selector: 'app-todo-list',
  imports: [MoveLayoutDirective, MovePresenceForDirective],
  template: `
    <ul style="position: relative">
      <li
        *movePresenceFor="let todo of todos(); trackBy: byId; mode: 'popLayout'"
        moveLayout
        move="fade-up"
      >
        {{ todo.text }}
      </li>
    </ul>
  `,
})
export class TodoList {
  protected readonly todos = signal([{ id: 1, text: 'Write the spec' }]);
  protected readonly byId = (_: number, todo: { id: number }) => todo.id;
}
// #endregion doqs:layout-presence
