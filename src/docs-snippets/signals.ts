import { Component, computed, ElementRef, inject, viewChild } from '@angular/core';
import { MoveAnimator, moveSpringValue, moveTransform, moveValue } from 'angular-movement';

// #region doqs:signals-values
@Component({
  selector: 'app-meter',
  template: `
    <input type="range" min="0" max="100" aria-label="Progress" (input)="set($event)" />
    <div [style.transform]="transform()">●</div>
  `,
})
export class Meter {
  /** The driver: any `Signal<number>` works; `moveValue` is a writable one. */
  protected readonly progress = moveValue(0);

  /** Map the driver onto whatever the UI needs. */
  protected readonly x = moveTransform(this.progress, [0, 100], [0, 260]);

  /** Let a spring smooth a value instead of following it rigidly. */
  protected readonly springX = moveSpringValue(this.x, { stiffness: 170, damping: 18 });

  protected readonly transform = computed(() => `translateX(${this.springX()}px)`);

  protected set(event: Event): void {
    this.progress.set(Number((event.target as HTMLInputElement).value));
  }
}
// #endregion doqs:signals-values

// #region doqs:signals-animator
@Component({
  selector: 'app-toast-dismiss',
  template: `
    <div #toast>Saved</div>
    <button type="button" (click)="dismiss()">Dismiss</button>
  `,
})
export class ToastDismiss {
  readonly #animator = inject(MoveAnimator);
  protected readonly toast = viewChild.required<ElementRef<HTMLElement>>('toast');

  async dismiss(): Promise<void> {
    // `finished` always resolves: natural finish, cancel(), a second play(), or teardown.
    await this.#animator.animate(
      this.toast(),
      { opacity: [1, 0], y: [0, 12] },
      { duration: '180ms' },
    )?.finished;
    this.toast().nativeElement.remove();
  }
}
// #endregion doqs:signals-animator
