import {
  Directive,
  ElementRef,
  effect,
  inject,
  input,
  OnDestroy,
  OnInit,
  signal,
  PLATFORM_ID,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { MoveKeyframes } from '../presets/presets.types';
import { AnimationEngine } from '../engines/animation-engine.service';
import { AnimationControls } from '../engines/animation-controls';
import { SmoothScrollService } from '../scroll/smooth-scroll.service';

@Directive({
  selector: '[moveScroll]',
  exportAs: 'moveScroll',
})
export class MoveScrollDirective implements OnInit, OnDestroy {
  readonly moveScroll = input<MoveKeyframes | undefined>(undefined);
  readonly moveScrollOffset = input<[string, string]>(['0 1', '1 0']);

  readonly progress = signal(0);

  readonly #documentRef = inject(DOCUMENT);
  readonly #platformId = inject(PLATFORM_ID);
  readonly #host = inject(ElementRef<HTMLElement>);
  readonly #engine = inject(AnimationEngine);
  /**
   * Injected optionally. When SmoothScrollService is active it fires scroll
   * via RAF (no native `scroll` event on window), so we react to its signal
   * instead. Falls back to native scroll listener when not active.
   */
  readonly #smoothScroll = inject(SmoothScrollService, { optional: true });

  #player: AnimationControls | null = null;
  #observer: IntersectionObserver | null = null;
  #isVisible = false;
  #scrollListener = () => this.#updateProgress();

  constructor() {
    // React to the smooth-scroll signal when the service is active.
    // `effect()` runs inside the injection context (constructor) so it's safe here.
    effect(() => {
      // Reading scrollY creates a reactive dependency.
      // Only update if smooth scroll is active and this element is visible.
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

    const frames = this.moveScroll();
    if (frames) {
      this.#player = this.#engine.play(this.#host.nativeElement, frames, {
        config: { duration: 1000, delay: 0, easing: 'linear', disabled: false },
      });
      this.#player?.pause();
      if (this.#player) {
        this.#player.currentTime = 0;
      }
    }

    this.#observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        this.#isVisible = entry.isIntersecting;

        if (entry.isIntersecting) {
          // Only attach native scroll listener when smooth scroll is NOT active
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
  }

  #updateProgress() {
    const view = this.#documentRef.defaultView;
    if (!view) return;

    const el = this.#host.nativeElement;
    const rect = el.getBoundingClientRect();
    const windowHeight = view.innerHeight;

    const offsets = this.moveScrollOffset();
    const startY = this.#calculateOffset(rect, windowHeight, offsets[0]);
    const endY = this.#calculateOffset(rect, windowHeight, offsets[1]);

    const totalDistance = startY - endY;
    if (totalDistance === 0) return;

    let p = startY / totalDistance;
    p = Math.max(0, Math.min(1, p));

    this.progress.set(p);

    if (this.#player) {
      this.#player.currentTime = p * 1000;
    }
  }

  #calculateOffset(rect: DOMRect, windowHeight: number, offsetStr: string): number {
    const parts = offsetStr.split(' ');
    const elVal = parseFloat(parts[0]);
    const viewVal = parseFloat(parts[1]);

    return rect.top + rect.height * elVal - windowHeight * viewVal;
  }

  ngOnDestroy() {
    this.#player?.cancel();
    this.#documentRef.defaultView?.removeEventListener('scroll', this.#scrollListener);
    this.#observer?.disconnect();
  }
}
