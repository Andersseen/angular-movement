import { Component } from '@angular/core';
import {
  MoveEnterDirective,
  MoveInViewDirective,
  MoveLoopDirective,
  MoveScrollDirective,
  MoveStaggerDirective,
} from 'angular-movement';

// #region doqs:stagger-list
@Component({
  selector: 'app-features',
  imports: [MoveStaggerDirective, MoveEnterDirective],
  template: `
    <ul moveStagger moveStaggerStep="80ms">
      @for (item of items; track item) {
        <li moveEnter="fade-up">{{ item }}</li>
      }
    </ul>
  `,
})
export class Features {
  protected readonly items = ['Fast', 'Accessible', 'Typed'];
}
// #endregion doqs:stagger-list

// #region doqs:stagger-reveal
@Component({
  selector: 'app-sections',
  imports: [MoveStaggerDirective, MoveInViewDirective],
  template: `
    <section moveStagger moveStaggerStep="100ms">
      <article moveInView="fade-up">One</article>
      <article moveInView="fade-up">Two</article>
      <article moveInView="fade-up">Three</article>
    </section>
  `,
})
export class Sections {}
// #endregion doqs:stagger-reveal

// #region doqs:scroll-linked
@Component({
  selector: 'app-scroll-hero',
  imports: [MoveScrollDirective],
  template: `
    <!-- Duration is always 1000ms linear internally: scroll progress maps 1:1 onto the timeline. -->
    <div [moveScroll]="{ y: [0, 120], opacity: [1, 0.2] }" #hero="moveScroll">
      Progress: {{ hero.progress() }}
    </div>
  `,
})
export class ScrollHero {}
// #endregion doqs:scroll-linked

// #region doqs:loop
@Component({
  selector: 'app-spinner',
  imports: [MoveLoopDirective],
  template: `<span moveLoop="spin" moveDuration="1s" aria-hidden="true">◐</span>`,
})
export class Spinner {}
// #endregion doqs:loop
