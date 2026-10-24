import { Component, signal } from '@angular/core';
import { MoveAnimationDirective, MoveVariantsDirective } from 'angular-movement';

// #region doqs:variants-animation
@Component({
  selector: 'app-card-state',
  imports: [MoveAnimationDirective],
  template: `
    <button type="button" (click)="open.set(!open())">Toggle</button>

    <div
      [moveAnimation]="{
        initial: { opacity: 0.6, scale: 0.98 },
        animate: open() ? { opacity: 1, scale: 1 } : { opacity: 0.6, scale: 0.98 },
      }"
    >
      Card
    </div>
  `,
})
export class CardState {
  protected readonly open = signal(false);
}
// #endregion doqs:variants-animation

// #region doqs:variants-named
@Component({
  selector: 'app-selectable',
  imports: [MoveVariantsDirective],
  template: `
    <div
      [moveVariants]="{
        idle: { scale: 1, rotate: 0 },
        active: { scale: 1.08, rotate: 4 },
      }"
      [moveVariant]="selected() ? 'active' : 'idle'"
      moveDuration="200ms"
    >
      Card
    </div>
  `,
})
export class Selectable {
  protected readonly selected = signal(false);
}
// #endregion doqs:variants-named
