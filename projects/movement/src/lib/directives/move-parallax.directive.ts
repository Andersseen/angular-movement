import {
  Directive,
  ElementRef,
  effect,
  inject,
  input,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { AnimationEngine } from '../engines/animation-engine.service';
import { AnimationControls } from '../engines/animation-controls';
import { SmoothScrollService } from '../scroll/smooth-scroll.service';
import { MoveKeyframes } from '../presets/presets.types';
import { numberAttribute, prefersReducedMotion } from './move-animation.utils';

/**
 * Stable candidate — feature-complete, but naming or behaviour may still receive small adjustments before 1.0.
 *
 * @stability candidate
 */
@Directive({
  selector: '[moveParallax]',
  exportAs: 'moveParallax',
})
export class MoveParallaxDirective implements OnInit, OnDestroy {
  readonly moveParallax = input<number, unknown>(0.2, { transform: numberAttribute });
  readonly moveParallaxAxis = input<'x' | 'y'>('y');
  /** Optional CSS selector for a custom scrollable container. Defaults to window scroll. */
  readonly moveParallaxContainer = input<string | null>(null);
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
  #containerEl: HTMLElement | null = null;

  #elHeight = 0;
  #windowHeight = 0;
  #totalDistance = 0;
  #initialAbsoluteTop = 0;

  constructor() {
    effect(() => {
      this.#smoothScroll?.scrollY();
      if (this.#smoothScroll?.isActive && this.#isVisible && !this.#containerEl) {
        this.#updateProgress();
      }
    });
  }

  ngOnInit() {
    if (!isPlatformBrowser(this.#platformId)) return;

    // Scroll-linked parallax is exactly the motion `prefers-reduced-motion` exists to suppress
    // (WCAG 2.3.3). Bail out entirely rather than applying a final state: leaving no transform is
    // the correct resting appearance for a parallax layer.
    if (prefersReducedMotion(this.#documentRef)) return;

    const view = this.#documentRef.defaultView;
    if (!view) return;

    const containerSelector = this.moveParallaxContainer();
    this.#containerEl = containerSelector
      ? (this.#documentRef.querySelector(containerSelector) as HTMLElement | null)
      : null;
    this.#scrollTarget = this.#containerEl ?? view;

    this.#initAnimation();

    this.#observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        this.#isVisible = entry.isIntersecting;

        if (entry.isIntersecting) {
          // Defer to the smooth-scroll service only when it is actually the scroll source, i.e.
          // when this directive tracks the page. A custom container scrolls natively either way.
          if (!this.#smoothScroll?.isActive || this.#containerEl) {
            this.#scrollTarget!.addEventListener('scroll', this.#scrollListener, { passive: true });
          }
          this.#updateProgress();
        } else {
          this.#scrollTarget?.removeEventListener('scroll', this.#scrollListener);
        }
      },
      { root: this.#containerEl ?? null },
    );

    this.#observer.observe(this.#host.nativeElement);

    // Re-initialize animation on window resize to update dimensions
    view.addEventListener('resize', this.#resizeListener, { passive: true });
  }

  #resizeListener = () => {
    this.#initAnimation();
  };

  #initAnimation() {
    const view = this.#documentRef.defaultView;
    if (!view) return;

    this.#windowHeight = this.#containerEl ? this.#containerEl.clientHeight : view.innerHeight;
    this.#elHeight = this.#host.nativeElement.offsetHeight;
    this.#totalDistance = this.#windowHeight + this.#elHeight;

    const initialScrollY = this.#containerEl
      ? this.#containerEl.scrollTop
      : this.#smoothScroll?.isActive
        ? this.#smoothScroll.scrollY()
        : view.scrollY || view.pageYOffset || 0;

    let elTop: number;
    if (this.#containerEl) {
      const containerRect = this.#containerEl.getBoundingClientRect();
      const elRect = this.#host.nativeElement.getBoundingClientRect();
      elTop = elRect.top - containerRect.top + this.#containerEl.scrollTop;
    } else {
      const rect = this.#host.nativeElement.getBoundingClientRect();
      elTop = initialScrollY + rect.top;
    }
    this.#initialAbsoluteTop = elTop;

    const speed = this.moveParallax();
    const axis = this.moveParallaxAxis();

    // Total translation distance across the entire scroll intersection
    const translateDist = this.#totalDistance * speed;

    const frames: MoveKeyframes = {};
    if (axis === 'x') {
      frames.x = [translateDist / 2, -translateDist / 2];
    } else {
      frames.y = [translateDist / 2, -translateDist / 2];
    }

    this.#player?.cancel();

    this.#player = this.#engine.play(this.#host.nativeElement, frames, {
      config: { duration: 1000, delay: 0, easing: 'linear', disabled: false, iterations: 1 },
    });
    this.#player?.pause();

    if (this.#player) {
      this.#player.currentTime = 0;
    }
  }

  #updateProgress() {
    const view = this.#documentRef.defaultView;
    if (!view || this.#totalDistance === 0) return;

    // A custom container's own scrollTop always wins: SmoothScrollService reports the page offset,
    // which is meaningless in a container-relative calculation.
    const scrollY = this.#containerEl
      ? this.#containerEl.scrollTop
      : this.#smoothScroll?.isActive
        ? this.#smoothScroll.scrollY()
        : view.scrollY || view.pageYOffset || 0;

    // Efficiently calculate the current visual top without triggering layout thrashing
    // or feedback loops caused by the active CSS transform translating the element.
    const currentVirtualTop = this.#initialAbsoluteTop - scrollY;

    // progress is 0 when element top hits viewport/container bottom (currentVirtualTop === windowHeight)
    // progress is 1 when element bottom hits viewport/container top (currentVirtualTop === -elHeight)
    let p = (this.#windowHeight - currentVirtualTop) / this.#totalDistance;
    p = Math.max(0, Math.min(1, p));

    this.progress.set(p);

    if (this.#player) {
      this.#player.currentTime = p * 1000;
    }
  }

  ngOnDestroy() {
    this.#player?.cancel();
    this.#scrollTarget?.removeEventListener('scroll', this.#scrollListener);
    const view = this.#documentRef.defaultView;
    if (view) {
      view.removeEventListener('resize', this.#resizeListener);
    }
    this.#observer?.disconnect();
  }
}
