import { Component, signal } from '@angular/core';
import {
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
