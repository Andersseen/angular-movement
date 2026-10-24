import { Component, signal } from '@angular/core';
import {
  MoveAnimateDirective,
  MoveEnterDirective,
  MoveLeaveDirective,
  MovePresenceDirective,
} from 'angular-movement';

// #region doqs:enter-basic
@Component({
  selector: 'app-card',
  imports: [MoveEnterDirective],
  template: `<article moveEnter="fade-up">Billing summary</article>`,
})
export class Card {}
// #endregion doqs:enter-basic

// #region doqs:enter-timing
@Component({
  selector: 'app-toast',
  imports: [MoveEnterDirective],
  template: `
    <div moveEnter="slide-up" moveDuration="300ms" moveDelay="100ms" moveEasing="ease-out">
      Saved
    </div>
  `,
})
export class Toast {}
// #endregion doqs:enter-timing

// #region doqs:enter-keyframes
@Component({
  selector: 'app-wipe',
  imports: [MoveEnterDirective],
  template: `
    <!-- Any CSS property the Web Animations API can animate, not just presets. -->
    <div [moveEnter]="{ clipPath: ['inset(0 100% 0 0)', 'inset(0 0% 0 0)'] }">Wipe</div>
    <div [moveEnter]="{ opacity: [0, 1], y: [16, 0] }" moveDuration="400ms">Rise</div>
  `,
})
export class Wipe {}
// #endregion doqs:enter-keyframes

// #region doqs:enter-presence
@Component({
  selector: 'app-details',
  imports: [MovePresenceDirective, MoveEnterDirective, MoveLeaveDirective],
  template: `
    <button type="button" (click)="open.set(!open())">Toggle</button>

    <ng-container *movePresence="open()">
      <aside moveEnter="fade-up" moveLeave="fade-down">Details</aside>
    </ng-container>
  `,
})
export class Details {
  protected readonly open = signal(false);
}
// #endregion doqs:enter-presence

// #region doqs:enter-animate
@Component({
  selector: 'app-hero-title',
  imports: [MoveAnimateDirective],
  template: `<h1 [moveInitial]="{ opacity: 0, y: 24 }" [moveAnimate]="{ opacity: 1, y: 0 }">
    Hi
  </h1>`,
})
export class HeroTitle {}
// #endregion doqs:enter-animate
