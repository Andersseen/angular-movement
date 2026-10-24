import { Component } from '@angular/core';
import {
  MoveFocusDirective,
  MoveHoverDirective,
  MoveInViewDirective,
  MoveTapDirective,
} from 'angular-movement';

// #region doqs:interactions-button
@Component({
  selector: 'app-buy-button',
  imports: [MoveHoverDirective, MoveTapDirective],
  template: `
    <!-- lift = a 4px rise (translate), press = a 3% scale-down. Separate channels, so they compose. -->
    <button type="button" moveWhileHover="lift" moveWhileTap="press">Buy now</button>
  `,
})
export class BuyButton {}
// #endregion doqs:interactions-button

// #region doqs:interactions-focus
@Component({
  selector: 'app-field',
  imports: [MoveFocusDirective],
  template: `<input [moveWhileFocus]="{ scale: [1, 1.02] }" aria-label="Email" />`,
})
export class Field {}
// #endregion doqs:interactions-focus

// #region doqs:interactions-in-view
@Component({
  selector: 'app-product-card',
  imports: [MoveInViewDirective, MoveHoverDirective],
  template: `<article moveInView="fade-up" moveWhileHover="lift">Product</article>`,
})
export class ProductCard {}
// #endregion doqs:interactions-in-view
