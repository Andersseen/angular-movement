import { afterNextRender, ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  MoveAnimationDirective,
  MoveDragDirective,
  MoveEnterDirective,
  MoveHoverDirective,
  MoveLeaveDirective,
  MoveLoopDirective,
  MovePresenceDirective,
  MovePresenceForDirective,
} from 'angular-movement';
import { Composed, Dashboard, SharedDetail } from './layout';

/** A child that owns an endless loop and a hover handler — used to prove teardown cleans up. */
@Component({
  selector: 'app-spinner',
  imports: [MoveLoopDirective, MoveHoverDirective],
  template: `
    <div data-testid="spinner" [moveLoop]="'pulse'" [moveWhileHover]="{ scale: [1, 1.1] }">
      loop
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Spinner {}

interface Row {
  id: number;
  label: string;
}

/**
 * Packed-package runtime fixture. Uses *narrow* imports only (no aggregate), so the production
 * bundle also proves tree-shaking works from the published tarball.
 *
 * Everything the validation script asserts is reachable through a `data-testid`.
 */
@Component({
  selector: 'app-root',
  imports: [
    MoveAnimationDirective,
    MoveDragDirective,
    MoveEnterDirective,
    MoveHoverDirective,
    MoveLeaveDirective,
    MovePresenceDirective,
    MovePresenceForDirective,
    Spinner,
    Dashboard,
    SharedDetail,
    Composed,
  ],
  template: `
    <h1 data-testid="title">Packed runtime</h1>
    <p data-testid="hydrated">{{ hydrated() }}</p>

    <button data-testid="toggle" (click)="open.set(!open())">toggle panel</button>
    <ng-container *movePresence="open()">
      <p data-testid="panel" moveEnter="fade-up" moveLeave="fade-down" moveDuration="200ms">
        panel
      </p>
    </ng-container>

    <div data-testid="card" [moveWhileHover]="{ scale: [1, 1.2] }" moveDuration="150ms">card</div>

    <div
      data-testid="drag"
      moveDrag
      [moveWhileDrag]="{ scale: [1, 1.05] }"
      [moveWhileHover]="{ opacity: [1, 0.9] }"
      style="width: 80px; height: 80px; margin: 24px; background: #888"
    >
      drag
    </div>

    <button data-testid="flip" (click)="on.set(!on())">flip state</button>
    <div
      data-testid="state"
      [moveAnimation]="{
        initial: { opacity: 0.4 },
        animate: { opacity: on() ? 1 : 0.4 },
        duration: 150,
      }"
    >
      state
    </div>

    <button data-testid="add" (click)="add()">add row</button>
    <ul>
      <li
        *movePresenceFor="let row of rows(); trackBy: byId"
        moveEnter="fade-up"
        moveLeave="fade-down"
        moveDuration="150ms"
        [attr.data-testid]="'row-' + row.id"
      >
        {{ row.label }}
        <button [attr.data-testid]="'remove-' + row.id" (click)="remove(row.id)">x</button>
      </li>
    </ul>

    <button data-testid="mount" (click)="mounted.set(!mounted())">mount spinner</button>
    @if (mounted()) {
      <app-spinner />
    }
    <app-dashboard />
    <app-shared-detail />
    <app-composed />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly hydrated = signal('server');
  protected readonly open = signal(false);
  protected readonly on = signal(false);
  protected readonly mounted = signal(false);
  protected readonly rows = signal<Row[]>([{ id: 1, label: 'first' }]);
  protected readonly byId = (_: number, row: Row) => row.id;
  #next = 2;

  constructor() {
    afterNextRender(() => this.hydrated.set('client'));
  }

  protected add(): void {
    const id = this.#next++;
    this.rows.update((rows) => [...rows, { id, label: `row ${id}` }]);
  }

  protected remove(id: number): void {
    this.rows.update((rows) => rows.filter((r) => r.id !== id));
  }
}
