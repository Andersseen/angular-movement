import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { AnimationControls } from '../engines/animation-controls';
import { AnimationEngine } from '../engines/animation-engine.service';
import { MoveKeyframes } from '../presets/presets.types';
import { SmoothScrollService } from '../scroll/smooth-scroll.service';

@Directive({
  selector: '[moveScroll]',
  exportAs: 'moveScroll',
})
export class MoveScrollDirective implements OnInit, OnDestroy {
  readonly moveScroll = input<MoveKeyframes | undefined>(undefined);
  readonly moveScrollOffset = input<[string, string]>(['0 1', '1 0']);
  /** Optional CSS selector for a custom scrollable container. Defaults to window scroll. */
  readonly moveScrollContainer = input<string | null>(null);

  readonly progress = signal(0);

  readonly #documentRef = inject(DOCUMENT);
  readonly #platformId = inject(PLATFORM_ID);
  readonly #host = inject(ElementRef<HTMLElement>);
  readonly #engine = inject(AnimationEngine);
  readonly #smoothScroll = inject(SmoothScrollService, { optional: true });

  #player: AnimationControls | null = null;
  #observer: IntersectionObserver | null = null;
  #isVisible = false;
  #scrollListener = () => this.#updateProgress();
  #scrollTarget: EventTarget | null = null;

  #targetProgress = 0;
  #animProgress = 0;
  #rafId: number | null = null;

  constructor() {
    // Recreate the player whenever keyframes change (e.g. user changes effect type).
    // Uses duration=1000 + linear easing so that currentTime ∈ [0,1000] maps cleanly
    // to the [0,1] scroll progress without easing distortion or premature finish.
    effect(() => {
      if (!isPlatformBrowser(this.#platformId)) return;
      const keyframes = this.moveScroll();

      if (this.#rafId !== null) {
        this.#documentRef.defaultView?.cancelAnimationFrame(this.#rafId);
        this.#rafId = null;
      }
      this.#player?.cancel();
      this.#player = null;
      this.#animProgress = 0;
      this.#targetProgress = 0;

      if (!keyframes) return;

      const view = this.#documentRef.defaultView;
      if (!view) return;

      this.#player = this.#engine.play(this.#host.nativeElement, keyframes, {
        config: { duration: 1000, easing: 'linear', delay: 0, disabled: false, iterations: 1 },
      });
      this.#player?.pause();

      // Sync the new player to the current scroll position immediately.
      this.#updateProgress();
    });

    // Smooth-scroll service support (fires via RAF signal instead of native scroll event).
    effect(() => {
      this.#smoothScroll?.scrollY();
      if (this.#smoothScroll?.isActive && this.#isVisible) {
        this.#updateProgress();
      }
    });
  }

  ngOnInit() {
    if (!isPlatformBrowser(this.#platformId)) return;

    const view = this.#documentRef.defaultView;
    if (!view) return;

    // Resolve scroll target: custom container selector or window.
    const containerSelector = this.moveScrollContainer();
    const containerEl = containerSelector
      ? (this.#documentRef.querySelector(containerSelector) as HTMLElement | null)
      : null;
    this.#scrollTarget = containerEl ?? view;

    // Use the custom container as IntersectionObserver root when available so that
    // the observer fires based on container-viewport visibility, not page-viewport visibility.
    this.#observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        this.#isVisible = entry.isIntersecting;

        if (entry.isIntersecting) {
          if (!this.#smoothScroll?.isActive) {
            this.#scrollTarget!.addEventListener('scroll', this.#scrollListener, { passive: true });
          }
          this.#updateProgress();
        } else {
          this.#scrollTarget?.removeEventListener('scroll', this.#scrollListener);
        }
      },
      {
        root: containerEl ?? null,
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1],
      },
    );

    this.#observer.observe(this.#host.nativeElement);
  }

  #updateProgress() {
    const view = this.#documentRef.defaultView;
    if (!view) return;

    const el = this.#host.nativeElement;
    const containerEl = this.#scrollTarget instanceof HTMLElement ? this.#scrollTarget : null;

    let p: number;

    if (containerEl) {
      // Container-relative scroll progress.
      const containerRect = containerEl.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();

      // Element's fixed position within the scroll content (invariant to scrollTop changes).
      const elTop = elRect.top - containerRect.top + containerEl.scrollTop;
      const elHeight = el.offsetHeight;
      const containerHeight = containerEl.clientHeight;

      const offsets = this.moveScrollOffset();
      const startScroll = this.#calcContainerOffset(elTop, elHeight, containerHeight, offsets[0]);
      const endScroll = this.#calcContainerOffset(elTop, elHeight, containerHeight, offsets[1]);

      const range = endScroll - startScroll;
      if (range === 0) return;

      p = (containerEl.scrollTop - startScroll) / range;
    } else {
      // Viewport-relative scroll progress (window scroll).
      const rect = el.getBoundingClientRect();
      const windowHeight = view.innerHeight;

      const offsets = this.moveScrollOffset();
      const startY = this.#calcViewportOffset(rect, windowHeight, offsets[0]);
      const endY = this.#calcViewportOffset(rect, windowHeight, offsets[1]);

      const totalDistance = startY - endY;
      if (totalDistance === 0) return;

      p = startY / totalDistance;
    }

    // Cap at 0.999 to prevent the WAAPI player's `finish` event from firing,
    // which would cancel the animation and make it uncontrollable for further scroll.
    p = Math.max(0, Math.min(0.999, p));
    this.#targetProgress = p;

    this.#startRaf();
  }

  #startRaf() {
    if (this.#rafId !== null) return;

    const view = this.#documentRef.defaultView;
    if (!view) return;

    const tick = () => {
      const diff = this.#targetProgress - this.#animProgress;

      // Stop the loop when close enough (< 0.001 difference).
      if (Math.abs(diff) < 0.001) {
        this.#animProgress = this.#targetProgress;
        this.#rafId = null;
        this.#applyProgress(this.#animProgress);
        return;
      }

      this.#animProgress += diff * 0.12;
      this.#applyProgress(this.#animProgress);
      this.#rafId = view.requestAnimationFrame(tick);
    };

    this.#rafId = view.requestAnimationFrame(tick);
  }

  #applyProgress(p: number) {
    this.progress.set(p);
    if (this.#player) {
      this.#player.currentTime = p * 1000;
    }
  }

  /**
   * Scroll position at which the animation start/end offset is reached.
   * "elFraction viewFraction" → e.g. "0 1" = element-top meets container-bottom.
   */
  #calcContainerOffset(
    elTop: number,
    elHeight: number,
    containerHeight: number,
    offsetStr: string,
  ): number {
    const [elVal, viewVal] = offsetStr.split(' ').map(parseFloat);
    return elTop + elHeight * elVal - containerHeight * viewVal;
  }

  #calcViewportOffset(rect: DOMRect, windowHeight: number, offsetStr: string): number {
    const [elVal, viewVal] = offsetStr.split(' ').map(parseFloat);
    return rect.top + rect.height * elVal - windowHeight * viewVal;
  }

  ngOnDestroy() {
    if (this.#rafId !== null) {
      this.#documentRef.defaultView?.cancelAnimationFrame(this.#rafId);
      this.#rafId = null;
    }
    this.#player?.cancel();
    this.#scrollTarget?.removeEventListener('scroll', this.#scrollListener);
    this.#observer?.disconnect();
  }
}
