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

  #player: AnimationControls | null = null;
  #observer: IntersectionObserver | null = null;
  #scrollContainer: Window | Element | null = null;

  constructor() {
    // Recreate animation when keyframes change
    effect(() => {
      const frames = this.moveScroll();
      if (!isPlatformBrowser(this.#platformId)) return;

      // Cancel existing player
      this.#player?.cancel();
      this.#player = null;

      if (frames) {
        this.#player = this.#engine.play(this.#host.nativeElement, frames, {
          config: { duration: 1000, delay: 0, easing: 'linear', disabled: false },
        });
        this.#player?.pause();
        if (this.#player) {
          this.#player.currentTime = this.progress() * 1000;
        }
      }
    });
  }

  ngOnInit() {
    if (!isPlatformBrowser(this.#platformId)) return;

    const view = this.#documentRef.defaultView;
    if (!view) return;

    // Find scroll container - check parent chain for scrollable elements
    this.#scrollContainer = this.findScrollContainer(this.#host.nativeElement) ?? view;

    // Use IntersectionObserver to detect when element is visible
    this.#observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          this.updateProgress();
        }
      },
      { root: null, threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    this.#observer.observe(this.#host.nativeElement);

    // Listen for scroll events
    const scrollTarget = this.#scrollContainer === view ? view : this.#scrollContainer;
    scrollTarget?.addEventListener('scroll', this.updateProgress.bind(this), { passive: true });

    // Also listen for resize
    view.addEventListener('resize', this.updateProgress.bind(this), { passive: true });

    // Initial update
    this.updateProgress();
  }

  private findScrollContainer(el: HTMLElement): Element | null {
    let parent = el.parentElement;
    while (parent) {
      const style = window.getComputedStyle(parent);
      if (
        style.overflowY === 'auto' ||
        style.overflowY === 'scroll' ||
        style.overflow === 'auto' ||
        style.overflow === 'scroll'
      ) {
        return parent;
      }
      parent = parent.parentElement;
    }
    return null;
  }

  private updateProgress() {
    const view = this.#documentRef.defaultView;
    if (!view) return;

    const el = this.#host.nativeElement;
    const rect = el.getBoundingClientRect();
    const windowHeight = view.innerHeight;

    const offsets = this.moveScrollOffset();
    const startY = this.calculateOffset(rect, windowHeight, offsets[0]);
    const endY = this.calculateOffset(rect, windowHeight, offsets[1]);

    const totalDistance = startY - endY;
    if (totalDistance === 0) return;

    let p = startY / totalDistance;
    p = Math.max(0, Math.min(1, p));

    this.progress.set(p);

    if (this.#player) {
      this.#player.currentTime = p * 1000;
    }
  }

  private calculateOffset(rect: DOMRect, windowHeight: number, offsetStr: string): number {
    const parts = offsetStr.split(' ');
    const elVal = parseFloat(parts[0]);
    const viewVal = parseFloat(parts[1]);

    return rect.top + rect.height * elVal - windowHeight * viewVal;
  }

  ngOnDestroy() {
    this.#player?.cancel();

    const view = this.#documentRef.defaultView;
    if (view) {
      view.removeEventListener('resize', this.updateProgress.bind(this));
      if (this.#scrollContainer === view) {
        view.removeEventListener('scroll', this.updateProgress.bind(this));
      }
    }

    if (this.#scrollContainer && this.#scrollContainer !== view) {
      (this.#scrollContainer as Element).removeEventListener(
        'scroll',
        this.updateProgress.bind(this),
      );
    }

    this.#observer?.disconnect();
  }
}
