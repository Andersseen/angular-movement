import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, NgZone, OnDestroy, PLATFORM_ID } from '@angular/core';

/**
 * SmoothScrollService — Lenis-inspired smooth scroll for Angular.
 *
 * Usage (in app root or a layout service):
 *
 *   constructor() {
 *     inject(SmoothScrollService).init();
 *   }
 */
@Injectable({ providedIn: 'root' })
export class SmoothScrollService implements OnDestroy {
  readonly #document = inject(DOCUMENT);
  readonly #platformId = inject(PLATFORM_ID);
  readonly #zone = inject(NgZone);

  /** Lerp factor — lower = smoother/slower, higher = snappier. Range 0–1. */
  #lerp = 0.1;

  #targetY = 0;
  #currentY = 0;
  #rafId = 0;
  #isRunning = false;
  #scrollElement: HTMLElement | null = null;

  /** Wheel event handler — captured to be removable */
  readonly #onWheel = (e: WheelEvent): void => {
    // Let native scroll handle inner scrollable containers (like overflow-y-auto divs)
    if (this.#isInsideScrollable(e.target as HTMLElement)) return;
    e.preventDefault();
    this.#targetY = Math.max(0, Math.min(this.#targetY + e.deltaY, this.#getMaxScroll()));
  };

  init(options: { lerp?: number; element?: HTMLElement } = {}): void {
    if (!isPlatformBrowser(this.#platformId)) return;
    if (this.#isRunning) return;

    this.#lerp = options.lerp ?? 0.1;
    this.#scrollElement = options.element ?? this.#document.documentElement;
    this.#currentY = this.#scrollElement.scrollTop;
    this.#targetY = this.#currentY;

    // Run entirely outside Angular zone to avoid triggering change detection on every RAF
    this.#zone.runOutsideAngular(() => {
      this.#scrollElement?.addEventListener('wheel', this.#onWheel, {
        passive: false,
      });

      this.#isRunning = true;
      this.#tick();
    });
  }

  destroy(): void {
    if (!isPlatformBrowser(this.#platformId)) return;
    this.#isRunning = false;
    cancelAnimationFrame(this.#rafId);
    this.#scrollElement?.removeEventListener('wheel', this.#onWheel);
    this.#scrollElement = null;
  }

  /** Scroll programmatically to a Y position */
  scrollTo(y: number, instant = false): void {
    this.#targetY = Math.max(0, Math.min(y, this.#getMaxScroll()));
    if (instant) {
      this.#currentY = this.#targetY;
      this.#applyScroll(this.#currentY);
    }
  }

  ngOnDestroy(): void {
    this.destroy();
  }

  #tick(): void {
    if (!this.#isRunning) return;

    // Lerp interpolation: current = current + (target - current) * factor
    this.#currentY += (this.#targetY - this.#currentY) * this.#lerp;

    // Snap to target when close enough to avoid infinite tiny float updates
    if (Math.abs(this.#targetY - this.#currentY) < 0.1) {
      this.#currentY = this.#targetY;
    }

    this.#applyScroll(this.#currentY);

    this.#rafId = requestAnimationFrame(() => this.#tick());
  }

  #applyScroll(y: number): void {
    if (!this.#scrollElement) return;
    this.#scrollElement.scrollTop = y;
  }

  #getMaxScroll(): number {
    if (!this.#scrollElement) return 0;
    return this.#scrollElement.scrollHeight - this.#scrollElement.clientHeight;
  }

  /**
   * Checks if the element is inside a scrollable container OTHER than the root scroll element.
   * Used to let native scroll handle inner overflow-y:auto containers (like Lenis does).
   */
  #isInsideScrollable(el: HTMLElement): boolean {
    let current: HTMLElement | null = el.parentElement;
    while (current && current !== this.#scrollElement) {
      const { overflowY } = getComputedStyle(current);
      if (
        (overflowY === 'auto' || overflowY === 'scroll') &&
        current.scrollHeight > current.clientHeight
      ) {
        return true;
      }
      current = current.parentElement;
    }
    return false;
  }
}
