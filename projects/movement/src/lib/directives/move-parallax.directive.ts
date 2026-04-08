import {
  Directive,
  ElementRef,
  effect,
  inject,
  input,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { AnimationEngine } from '../engines/animation-engine.service';
import { AnimationControls } from '../engines/animation-controls';
import { SmoothScrollService } from '../scroll/smooth-scroll.service';
import { MoveKeyframes } from '../presets/presets.types';

@Directive({
  selector: '[moveParallax]',
  exportAs: 'moveParallax',
})
export class MoveParallaxDirective implements OnInit, OnDestroy {
  readonly moveParallax = input<number>(0.2);
  readonly moveParallaxAxis = input<'x' | 'y'>('y');

  readonly #documentRef = inject(DOCUMENT);
  readonly #platformId = inject(PLATFORM_ID);
  readonly #host = inject(ElementRef<HTMLElement>);
  readonly #engine = inject(AnimationEngine);
  readonly #smoothScroll = inject(SmoothScrollService, { optional: true });

  #player: AnimationControls | null = null;
  #observer: IntersectionObserver | null = null;
  #isVisible = false;
  #scrollListener = () => this.#updateProgress();

  #elHeight = 0;
  #windowHeight = 0;
  #totalDistance = 0;
  #initialAbsoluteTop = 0;

  constructor() {
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

    this.#initAnimation();

    this.#observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        this.#isVisible = entry.isIntersecting;

        if (entry.isIntersecting) {
          if (!this.#smoothScroll?.isActive) {
            view.addEventListener('scroll', this.#scrollListener, { passive: true });
          }
          this.#updateProgress();
        } else {
          view.removeEventListener('scroll', this.#scrollListener);
        }
      },
      { root: null },
    );

    this.#observer.observe(this.#host.nativeElement);

    // Re-initialize animation on resize to update dimensions
    view.addEventListener('resize', this.#resizeListener, { passive: true });
  }

  #resizeListener = () => {
    this.#initAnimation();
  };

  #initAnimation() {
    const view = this.#documentRef.defaultView;
    if (!view) return;

    this.#windowHeight = view.innerHeight;
    this.#elHeight = this.#host.nativeElement.offsetHeight;
    this.#totalDistance = this.#windowHeight + this.#elHeight;

    const scrollY = this.#smoothScroll?.isActive
      ? this.#smoothScroll.scrollY()
      : view.scrollY || view.pageYOffset || 0;
    const rect = this.#host.nativeElement.getBoundingClientRect();
    this.#initialAbsoluteTop = scrollY + rect.top;

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
      config: { duration: 1000, delay: 0, easing: 'linear', disabled: false },
    });
    this.#player?.pause();

    if (this.#player) {
      this.#player.currentTime = 0;
    }
  }

  #updateProgress() {
    const view = this.#documentRef.defaultView;
    if (!view || this.#totalDistance === 0) return;

    const scrollY = this.#smoothScroll?.isActive
      ? this.#smoothScroll.scrollY()
      : view.scrollY || view.pageYOffset || 0;

    // Efficiently calculate the current visual top without triggering layout thrashing
    // or feedback loops caused by the active CSS transform translating the element.
    const currentVirtualTop = this.#initialAbsoluteTop - scrollY;

    // progress is 0 when element top hits window bottom (currentVirtualTop === windowHeight)
    // progress is 1 when element bottom hits window top (currentVirtualTop === -elHeight)
    let p = (this.#windowHeight - currentVirtualTop) / this.#totalDistance;
    p = Math.max(0, Math.min(1, p));

    if (this.#player) {
      this.#player.currentTime = p * 1000;
    }
  }

  ngOnDestroy() {
    this.#player?.cancel();
    const view = this.#documentRef.defaultView;
    if (view) {
      view.removeEventListener('scroll', this.#scrollListener);
      view.removeEventListener('resize', this.#resizeListener);
    }
    this.#observer?.disconnect();
  }
}
