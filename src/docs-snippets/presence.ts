import { Component, signal } from '@angular/core';
import {
  MoveAnimateDirective,
  MoveEnterDirective,
  MoveLeaveDirective,
  MovePresenceDirective,
  MovePresenceForDirective,
} from 'angular-movement';

// #region doqs:presence-view
@Component({
  selector: 'app-panel',
  imports: [MovePresenceDirective, MoveEnterDirective, MoveLeaveDirective],
  template: `
    <ng-container *movePresence="open()">
      <aside moveEnter="fade-left" moveLeave="fade-right">Settings</aside>
    </ng-container>
  `,
})
export class Panel {
  protected readonly open = signal(true);
}
// #endregion doqs:presence-view

interface Row {
  readonly id: number;
  readonly name: string;
}

// #region doqs:presence-list
@Component({
  selector: 'app-rows',
  imports: [MovePresenceForDirective, MoveEnterDirective, MoveLeaveDirective],
  template: `
    <ul>
      <li
        *movePresenceFor="let row of rows(); trackBy: byId"
        moveEnter="fade-up"
        moveLeave="fade-down"
      >
        {{ row.name }}
      </li>
    </ul>
  `,
})
export class Rows {
  protected readonly rows = signal<readonly Row[]>([{ id: 1, name: 'First' }]);
  protected readonly byId = (_: number, row: Row) => row.id;
}
// #endregion doqs:presence-list

// #region doqs:presence-hydration
@Component({
  selector: 'app-carousel',
  imports: [MovePresenceForDirective, MoveAnimateDirective],
  template: `
    <div class="relative aspect-video">
      <img
        *movePresenceFor="let src of slide(); trackBy: bySrc"
        class="absolute inset-0"
        move="fade-up"
        [moveDisabled]="!changed()"
        [src]="src"
        alt=""
      />
    </div>
    <button type="button" (click)="next()">Next</button>
  `,
})
export class Carousel {
  readonly #photos = ['/a.jpg', '/b.jpg', '/c.jpg'];
  #index = 0;
  protected readonly slide = signal([this.#photos[0]]);
  /** False until the user navigates: the server-rendered photo must not fade in again. */
  protected readonly changed = signal(false);
  protected readonly bySrc = (_: number, src: string) => src;

  protected next(): void {
    this.#index = (this.#index + 1) % this.#photos.length;
    this.changed.set(true);
    this.slide.set([this.#photos[this.#index]]);
  }
}
// #endregion doqs:presence-hydration
