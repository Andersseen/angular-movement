import {
  Directive,
  ElementRef,
  PLATFORM_ID,
  inject,
  input,
  OnDestroy,
  afterEveryRender,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { MoveSpring } from '../presets/presets.types';
import { MOVEMENT_CONFIG } from '../tokens/movement.tokens';
import {
  booleanAttribute,
  optionalBooleanAttribute,
  optionalNumberAttribute,
  prefersReducedMotion,
  resolveMovementConfig,
} from './move-animation.utils';
import { AnimationEngine } from '../engines/animation-engine.service';
import { AnimationControls } from '../engines/animation-controls';
import { hasInlineTransform } from '../engines/transform-state';

/**
 * Experimental API — may change significantly between minor versions.
 *
 * @stability experimental
 * @experimental
 */
@Directive({
  selector: '[moveLayout]',
})
export class MoveLayoutDirective implements OnDestroy {
  readonly moveLayout = input<boolean | '', unknown>(true, { transform: booleanAttribute });
  readonly moveLayoutId = input<string | undefined>(undefined);
  readonly moveDuration = input<number | undefined, unknown>(undefined, {
    transform: optionalNumberAttribute,
  });
  readonly moveEasing = input<string | undefined>(undefined);
  readonly moveDelay = input<number | undefined, unknown>(undefined, {
    transform: optionalNumberAttribute,
  });
  readonly moveDisabled = input<boolean | undefined, unknown>(undefined, {
    transform: optionalBooleanAttribute,
  });
  readonly moveSpring = input<MoveSpring | undefined>(undefined);

  readonly #defaults = inject(MOVEMENT_CONFIG);
  readonly #documentRef = inject(DOCUMENT);
  readonly #platformId = inject(PLATFORM_ID);
  readonly #host = inject(ElementRef<HTMLElement>);
  readonly #engine = inject(AnimationEngine);

  #snapshot: DOMRect | null = null;
  #currentPlayer: AnimationControls | null = null;
  #isBrowser = isPlatformBrowser(this.#platformId);
  #isReducedMotion = false;
  #isAnimating = false;

  constructor() {
    this.#isReducedMotion = prefersReducedMotion(this.#documentRef);

    if (!this.#isBrowser) {
      return;
    }

    afterEveryRender({
      earlyRead: () => {
        if (this.#isAnimating) {
          return null;
        }

        const currentRect = this.#readRect();
        if (!currentRect) {
          return null;
        }

        if (this.moveLayout() === false || this.moveDisabled() || this.#isReducedMotion) {
          this.#snapshot = currentRect;
          return null;
        }

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

  /**
   * Measures the host in **untransformed layout space**.
   *
   * `getBoundingClientRect()` reports the box *after* the element's own CSS transform, so any other
   * transform channel — a `moveDrag` offset, a committed `moveWhileHover` scale, the tail of a
   * previous FLIP — would be baked into the snapshot. The engine then composes the FLIP delta on
   * top of that very same base transform (`composeElementKeyframes`), counting it twice: a plain
   * hover scale on a `[moveLayout]` element is enough to trigger a spurious FLIP.
   *
   * Clearing the inline transform for the duration of the measurement puts snapshot and target in
   * the same space, so the delta is pure layout. Same technique `moveDrag` uses to measure bounds.
   */
  #readRect(): DOMRect | null {
    const el = this.#host.nativeElement;
    if (typeof el.getBoundingClientRect !== 'function') {
      return null;
    }

    const inlineTransform = hasInlineTransform(el) ? el.style.transform : null;
    if (inlineTransform !== null) {
      el.style.transform = '';
    }

    const rect = el.getBoundingClientRect();

    if (inlineTransform !== null) {
      el.style.transform = inlineTransform;
    }

    if (rect.width === 0 || rect.height === 0) {
      return null;
    }

    return rect;
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
          this.#finishLayoutAnimation(transformOrigin);
        },
      },
    );

    if (!this.#currentPlayer) {
      this.#finishLayoutAnimation(transformOrigin);
    }
  }

  #finishLayoutAnimation(transformOrigin: string): void {
    this.#isAnimating = false;
    this.#host.nativeElement.style.transformOrigin = transformOrigin;
    this.#snapshot = this.#readRect();
  }

  ngOnDestroy(): void {
    this.#currentPlayer?.cancel();
  }
}
