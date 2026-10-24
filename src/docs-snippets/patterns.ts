import { Component, signal } from '@angular/core';
import {
  MoveAnimator,
  MoveEnterDirective,
  MoveHoverDirective,
  MoveInViewDirective,
  MoveStaggerDirective,
  MoveTapDirective,
  provideMovement,
} from 'angular-movement';
import { ApplicationConfig, ElementRef, inject, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';

// #region doqs:patterns-product-card
@Component({
  selector: 'app-product-card',
  imports: [MoveInViewDirective, MoveHoverDirective],
  template: `<article moveInView="fade-up" moveWhileHover="lift">…</article>`,
})
export class ProductCard {}
// #endregion doqs:patterns-product-card

// #region doqs:patterns-buttons
@Component({
  selector: 'app-buttons',
  imports: [MoveHoverDirective, MoveTapDirective, RouterLink],
  template: `
    <button type="button" moveWhileHover="lift" moveWhileTap="press">Buy now</button>

    <!-- Links too: touch taps and scrolls behave natively. -->
    <a routerLink="/pricing" moveWhileHover="lift" moveWhileTap="press">Pricing</a>
  `,
})
export class Buttons {}
// #endregion doqs:patterns-buttons

// #region doqs:patterns-grid
@Component({
  selector: 'app-grid',
  imports: [MoveStaggerDirective, MoveInViewDirective],
  template: `
    <ul moveStagger moveStaggerStep="80ms">
      @for (item of items(); track item.id) {
        <li moveInView="fade-up">{{ item.label }}</li>
      }
    </ul>
  `,
})
export class Grid {
  protected readonly items = signal([{ id: 1, label: 'One' }]);
}
// #endregion doqs:patterns-grid

// #region doqs:patterns-timing
@Component({
  selector: 'app-timing',
  imports: [MoveStaggerDirective],
  template: `
    <!-- Numbers are always milliseconds. Strings say their unit. -->
    <ul moveStagger moveStaggerStep="80ms"></ul>
    <ul moveStagger moveStaggerStep="0.08s"></ul>
    <ul moveStagger [moveStaggerStep]="80"></ul>
  `,
})
export class Timing {}

export const timingConfig: ApplicationConfig = {
  providers: [provideMovement({ duration: '320ms' })],
};
// #endregion doqs:patterns-timing

// #region doqs:patterns-reduced-config
export const reducedConfig: ApplicationConfig = {
  providers: [
    // Nothing to do for reduced motion: this already honours the OS setting.
    provideMovement({ duration: '320ms', easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }),
  ],
};

declare const settings: { animationsOff: boolean };

// `disabled` is an app-level kill switch: a user setting, a screenshot test run.
export const killSwitchConfig: ApplicationConfig = {
  providers: [provideMovement({ disabled: settings.animationsOff })],
};
// #endregion doqs:patterns-reduced-config

// #region doqs:patterns-reduced-element
@Component({
  selector: 'app-first-render',
  imports: [MoveEnterDirective],
  template: `<div moveEnter="fade-up" [moveDisabled]="isFirstRender()">…</div>`,
})
export class FirstRender {
  protected readonly isFirstRender = signal(true);
}
// #endregion doqs:patterns-reduced-element

// #region doqs:patterns-passthrough
@Component({
  selector: 'app-passthrough',
  imports: [MoveEnterDirective, MoveHoverDirective],
  template: `
    <div [moveEnter]="{ clipPath: ['inset(0 100% 0 0)', 'inset(0 0% 0 0)'] }">Wipe</div>
    <img alt="" src="/photo.jpg" [moveWhileHover]="{ filter: ['saturate(0.6)', 'saturate(1)'] }" />
  `,
})
export class Passthrough {}
// #endregion doqs:patterns-passthrough

// #region doqs:patterns-stagger-for
@Component({
  selector: 'app-stagger-for',
  imports: [MoveStaggerDirective, MoveEnterDirective],
  template: `
    <ul moveStagger moveStaggerStep="60ms" moveStaggerDirection="first">
      @for (item of items(); track item.id) {
        <li [moveEnter]="{ opacity: [0, 1], y: [16, 0] }">{{ item.label }}</li>
      }
    </ul>
  `,
})
export class StaggerFor {
  protected readonly items = signal([{ id: 1, label: 'One' }]);
}
// #endregion doqs:patterns-stagger-for

// #region doqs:patterns-cancellation
@Component({
  selector: 'app-sequence',
  template: `<div #panel>Panel</div>`,
})
export class Sequence {
  readonly #animator = inject(MoveAnimator);
  protected readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');
  #run = 0;

  async expand(): Promise<void> {
    // `finished` always resolves: natural finish, cancel(), a second play() replacing the first.
    const run = ++this.#run;
    await this.#animator.animate(this.panel(), { height: ['0px', '120px'] }, { duration: '420ms' })
      ?.finished;
    if (run !== this.#run) return; // a newer run took over
  }
}
// #endregion doqs:patterns-cancellation

// #region doqs:patterns-narrow-imports
@Component({
  selector: 'app-save-button',
  imports: [MoveHoverDirective, MoveTapDirective], // exactly what the template uses
  template: `<button type="button" moveWhileHover="lift" moveWhileTap="press">Save</button>`,
})
export class SaveButton {}
// #endregion doqs:patterns-narrow-imports
