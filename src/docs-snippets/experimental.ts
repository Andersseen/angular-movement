import { Component } from '@angular/core';
import { MoveDragDirective, MoveLayoutDirective } from 'angular-movement';

// #region doqs:experimental-drag
@Component({
  selector: 'app-draggable',
  imports: [MoveDragDirective],
  template: `
    <div moveDrag="x" [moveDragSnapToOrigin]="true" [moveWhileDrag]="{ scale: [1, 1.05] }">
      Drag
    </div>
  `,
})
export class Draggable {}
// #endregion doqs:experimental-drag

// #region doqs:experimental-layout
@Component({
  selector: 'app-reorder',
  imports: [MoveLayoutDirective],
  template: `
    @for (item of items; track item) {
      <div moveLayout>{{ item }}</div>
    }
  `,
})
export class Reorder {
  protected readonly items = ['a', 'b', 'c'];
}
// #endregion doqs:experimental-layout
