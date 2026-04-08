import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, NgZone, OnDestroy, PLATFORM_ID } from '@angular/core';

/**
 * SmoothScrollService — Lenis-inspired smooth scroll for Angular.
 *
 * Desktop: intercepts wheel events → lerp interpolation → synthetic scrollTop.
 * Mobile:  listens to native touch scroll → lerp interpolation → synthetic scrollTop.
 *          Native scroll is prevented during touch to avoid the vibration conflict.
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

  // Touch tracking
  #touchStartY = 0;
  #lastTouchY = 0;
  #touchVelocity = 0;
  #isTouching = false;
  #lastTouchTimestamp = 0;

  // ─── Event handlers ────────────────────────────────────────────────────────

  readonly #onWheel = (e: WheelEvent): void => {
    if (this.#isInsideScrollable(e.target as HTMLElement)) return;
    e.preventDefault();
    this.#targetY = this.#clamp(this.#targetY + e.deltaY);
  };

  readonly #onTouchStart = (e: TouchEvent): void => {
    if (this.#isInsideScrollable(e.target as HTMLElement)) return;
    this.#isTouching = true;
    this.#touchVelocity = 0;
    this.#touchStartY = e.touches[0].clientY;
    this.#lastTouchY = this.#touchStartY;
    this.#lastTouchTimestamp = e.timeStamp;
  };

  readonly #onTouchMove = (e: TouchEvent): void => {
    if (!this.#isTouching) return;
    if (this.#isInsideScrollable(e.target as HTMLElement)) return;

    // Prevent native scroll on the root element — we handle it ourselves
    e.preventDefault();

    const currentY = e.touches[0].clientY;
    const deltaTime = Math.max(e.timeStamp - this.#lastTouchTimestamp, 1);
    const deltaY = this.#lastTouchY - currentY; // inverted: swipe up → scroll down

    // Track velocity (px/ms) for momentum after lift
    this.#touchVelocity = deltaY / deltaTime;

    this.#targetY = this.#clamp(this.#targetY + deltaY);

    this.#lastTouchY = currentY;
    this.#lastTouchTimestamp = e.timeStamp;
  };

  readonly #onTouchEnd = (): void => {
    this.#isTouching = false;
    // Apply momentum: fling the targetY by velocity × decay frames
    this.#applyMomentum();
  };

  // ─── Public API ────────────────────────────────────────────────────────────

  init(options: { lerp?: number; element?: HTMLElement } = {}): void {
    if (!isPlatformBrowser(this.#platformId)) return;
    if (this.#isRunning) return;

    this.#lerp = options.lerp ?? 0.1;
    this.#scrollElement = options.element ?? this.#document.documentElement;
    this.#currentY = this.#scrollElement.scrollTop;
    this.#targetY = this.#currentY;

    // Run entirely outside Angular zone to avoid change detection on every RAF
    this.#zone.runOutsideAngular(() => {
      const el = this.#scrollElement!;

      el.addEventListener('wheel', this.#onWheel, { passive: false });

      // Touch events must also be non-passive to call preventDefault()
      el.addEventListener('touchstart', this.#onTouchStart, { passive: true });
      el.addEventListener('touchmove', this.#onTouchMove, { passive: false });
      el.addEventListener('touchend', this.#onTouchEnd, { passive: true });

      this.#isRunning = true;
      this.#tick();
    });
  }

  destroy(): void {
    this.#isRunning = false;
    cancelAnimationFrame(this.#rafId);

    const el = this.#scrollElement;
    if (el) {
      el.removeEventListener('wheel', this.#onWheel);
      el.removeEventListener('touchstart', this.#onTouchStart);
      el.removeEventListener('touchmove', this.#onTouchMove);
      el.removeEventListener('touchend', this.#onTouchEnd);
    }

    this.#scrollElement = null;
  }

  /** Scroll programmatically to a Y position */
  scrollTo(y: number, instant = false): void {
    this.#targetY = this.#clamp(y);
    if (instant) {
      this.#currentY = this.#targetY;
      this.#applyScroll(this.#currentY);
    }
  }

  ngOnDestroy(): void {
    this.destroy();
  }

  // ─── Internal ──────────────────────────────────────────────────────────────

  #tick(): void {
    if (!this.#isRunning) return;

    this.#currentY += (this.#targetY - this.#currentY) * this.#lerp;

    if (Math.abs(this.#targetY - this.#currentY) < 0.1) {
      this.#currentY = this.#targetY;
    }

    this.#applyScroll(this.#currentY);
    this.#rafId = requestAnimationFrame(() => this.#tick());
  }

  /**
   * After finger lift, simulate Lenis-style momentum decay.
   * Velocity decays by a friction factor each frame until negligible.
   */
  #applyMomentum(): void {
    const FRICTION = 0.92; // higher = more glide; lower = stops faster
    const MIN_VELOCITY = 0.05; // px/ms threshold to stop

    let v = this.#touchVelocity * 16; // convert px/ms → px/frame (~16ms)

    const step = (): void => {
      if (!this.#isRunning || Math.abs(v) < MIN_VELOCITY) return;
      v *= FRICTION;
      this.#targetY = this.#clamp(this.#targetY + v);
      requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }

  #applyScroll(y: number): void {
    if (!this.#scrollElement) return;
    this.#scrollElement.scrollTop = y;
  }

  #getMaxScroll(): number {
    if (!this.#scrollElement) return 0;
    return this.#scrollElement.scrollHeight - this.#scrollElement.clientHeight;
  }

  #clamp(y: number): number {
    return Math.max(0, Math.min(y, this.#getMaxScroll()));
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
