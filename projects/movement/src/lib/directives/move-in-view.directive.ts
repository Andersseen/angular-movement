import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  Directive,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { MoveKeyframes, MovePreset, MoveSpring } from '../presets/presets.types';
import { MOVEMENT_CONFIG } from '../tokens/movement.tokens';
import {
  prefersReducedMotion,
  resolveMovementConfig,
  resolveMoveFrames,
} from './move-animation.utils';
import { AnimationEngine } from '../engines/animation-engine.service';
import { AnimationControls } from '../engines/animation-controls';

@Directive({
  selector: '[moveInView]',
})
export class MoveInViewDirective implements OnDestroy, OnInit {
  readonly moveInView = input<MovePreset | MoveKeyframes>('none');
  readonly moveInViewMargin = input<string>('0px');
  readonly moveInViewOnce = input<boolean>(true);
  /** CSS selector for the IntersectionObserver root (for inner scrollable containers). */
  readonly moveInViewRoot = input<string | null>(null);

  readonly moveDuration = input<number | undefined>(undefined);
  readonly moveEasing = input<string | undefined>(undefined);
  readonly moveDelay = input<number | undefined>(undefined);
  readonly moveDisabled = input<boolean | undefined>(undefined);
  readonly moveSpring = input<MoveSpring | undefined>(undefined);

  readonly #defaults = inject(MOVEMENT_CONFIG);
  readonly #documentRef = inject(DOCUMENT);
  readonly #platformId = inject(PLATFORM_ID);
  readonly #host = inject(ElementRef<HTMLElement>);
  readonly #engine = inject(AnimationEngine);

  #player: AnimationControls | null = null;
  #observer: IntersectionObserver | null = null;
  #frames: MoveKeyframes | null = null;
  #isAnimated = false;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.#platformId) || this.moveDisabled()) return;

    const isReduced = prefersReducedMotion(this.#documentRef);
    if (isReduced) return;

    this.#frames = resolveMoveFrames(this.moveInView(), 'enter');

    // Apply initial (invisible) state directly to DOM - avoid creating a player
    this.#applyInitialStyles(this.#frames);

    const rootSelector = this.moveInViewRoot();
    const rootEl = rootSelector ? this.#documentRef.querySelector(rootSelector) : null;

    this.#observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !this.#isAnimated) {
          this.#playAnimation();
          if (this.moveInViewOnce()) {
            this.#isAnimated = true;
            this.#observer?.disconnect();
          }
        } else if (!entry.isIntersecting && !this.moveInViewOnce() && this.#isAnimated) {
          // Reset to initial state for re-animation
          this.#player?.cancel();
          this.#player = null;
          this.#isAnimated = false;
          if (this.#frames) {
            this.#applyInitialStyles(this.#frames);
          }
        }
      },
      {
        root: rootEl as HTMLElement | null,
        rootMargin: this.moveInViewMargin(),
        threshold: 0,
      },
    );

    this.#observer.observe(this.#host.nativeElement);
  }

  #playAnimation(): void {
    if (!this.#frames) return;

    const config = resolveMovementConfig(
      this.#defaults,
      {
        duration: this.moveDuration(),
        easing: this.moveEasing(),
        delay: this.moveDelay() ?? 0,
        disabled: false,
      },
      false,
    );

    // Clear inline styles before animating so WAAPI can take over cleanly
    this.#clearInitialStyles();

    this.#player = this.#engine.play(this.#host.nativeElement, this.#frames, {
      config,
      spring: this.moveSpring(),
      disabled: false,
    });

    this.#isAnimated = true;
  }

  #applyInitialStyles(frames: MoveKeyframes): void {
    const el = this.#host.nativeElement;
    const getFirst = (arr: readonly number[] | undefined) =>
      arr && arr.length > 0 ? arr[0] : undefined;

    const opacity = getFirst(frames.opacity);
    if (opacity !== undefined) el.style.opacity = `${opacity}`;

    const x = getFirst(frames.x);
    const y = getFirst(frames.y);
    if (x !== undefined || y !== undefined) {
      el.style.translate = `${x ?? 0}px ${y ?? 0}px`;
    }

    const scale = getFirst(frames.scale);
    if (scale !== undefined) {
      el.style.scale = `${scale}`;
    }

    const rotateX = getFirst(frames.rotateX);
    const rotateY = getFirst(frames.rotateY);
    if (rotateX !== undefined || rotateY !== undefined) {
      el.style.transform = `perspective(1200px) rotateX(${rotateX ?? 0}deg) rotateY(${rotateY ?? 0}deg)`;
    }
  }

  #clearInitialStyles(): void {
    const el = this.#host.nativeElement;
    el.style.opacity = '';
    el.style.translate = '';
    el.style.scale = '';
    el.style.transform = '';
  }

  ngOnDestroy(): void {
    this.#observer?.disconnect();
    this.#player?.cancel();
  }
}
