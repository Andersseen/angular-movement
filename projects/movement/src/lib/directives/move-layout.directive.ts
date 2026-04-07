import { Directive, ElementRef, inject, input, OnDestroy, afterEveryRender } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { MoveSpring } from '../presets/presets.types';
import { MOVEMENT_CONFIG } from '../tokens/movement.tokens';
import { prefersReducedMotion, resolveMovementConfig } from './move-animation.utils';
import { AnimationEngine } from '../engines/animation-engine.service';
import { AnimationControls } from '../engines/animation-controls';

@Directive({
  selector: '[moveLayout]',
})
export class MoveLayoutDirective implements OnDestroy {
  readonly moveLayout = input<boolean | ''>(true);
  readonly moveLayoutId = input<string | undefined>(undefined);
  readonly moveDuration = input<number | undefined>(undefined);
  readonly moveEasing = input<string | undefined>(undefined);
  readonly moveDelay = input<number | undefined>(undefined);
  readonly moveDisabled = input<boolean | undefined>(undefined);
  readonly moveSpring = input<MoveSpring | undefined>(undefined);

  readonly #defaults = inject(MOVEMENT_CONFIG);
  readonly #documentRef = inject(DOCUMENT);
  readonly #host = inject(ElementRef<HTMLElement>);
  readonly #engine = inject(AnimationEngine);

  #snapshot: DOMRect | null = null;
  #currentPlayer: AnimationControls | null = null;
  #isReducedMotion = false;
  #isAnimating = false;

  constructor() {
    this.#isReducedMotion = prefersReducedMotion(this.#documentRef);

    afterEveryRender({
      earlyRead: () => {
        if (
          this.moveLayout() === false ||
          this.moveDisabled() ||
          this.#isReducedMotion ||
          this.#isAnimating
        ) {
          return null;
        }

        const currentRect = this.#host.nativeElement.getBoundingClientRect();

        if (this.#snapshot) {
          const dx = this.#snapshot.left - currentRect.left;
          const dy = this.#snapshot.top - currentRect.top;
          const dw = this.#snapshot.width / currentRect.width;
          const dh = this.#snapshot.height / currentRect.height;

          if (
            Math.abs(dx) > 0.5 ||
            Math.abs(dy) > 0.5 ||
            Math.abs(dw - 1) > 0.01 ||
            Math.abs(dh - 1) > 0.01
          ) {
            return {
              dx,
              dy,
              dw,
              dh,
              targetRect: currentRect,
            };
          }
        }

        this.#snapshot = currentRect;
        return null;
      },
      write: (
        flipData: { dx: number; dy: number; dw: number; dh: number; targetRect: DOMRect } | null,
      ) => {
        if (flipData) {
          this.playFlip(flipData);
        }
      },
    });
  }

  private playFlip(flipData: {
    dx: number;
    dy: number;
    dw: number;
    dh: number;
    targetRect: DOMRect;
  }) {
    this.#isAnimating = true;

    // The host is currently visually at its NEW position (unpainted).
    // We apply the inverse transform to make it LOOK like it's at the OLD position.
    // We apply transform origin 0 0 so scaling works correctly from top-left.
    const transformOrigin = this.#host.nativeElement.style.transformOrigin;
    this.#host.nativeElement.style.transformOrigin = '0 0';

    const config = resolveMovementConfig(
      this.#defaults,
      {
        duration: this.moveDuration(),
        easing: this.moveEasing(),
        delay: this.moveDelay(),
        disabled: this.moveDisabled(),
      },
      this.#isReducedMotion,
    );

    this.#currentPlayer = this.#engine.play(
      this.#host.nativeElement,
      {
        x: [flipData.dx, 0],
        y: [flipData.dy, 0],
        scaleX: [flipData.dw, 1],
        scaleY: [flipData.dh, 1],
      },
      {
        config,
        spring: this.moveSpring(),
        disabled: false,
        onDone: () => {
          this.#isAnimating = false;
          this.#host.nativeElement.style.transformOrigin = transformOrigin;
          // Take final snapshot so next check is fresh
          this.#snapshot = this.#host.nativeElement.getBoundingClientRect();
        },
      },
    );
  }

  ngOnDestroy(): void {
    this.#currentPlayer?.cancel();
  }
}
