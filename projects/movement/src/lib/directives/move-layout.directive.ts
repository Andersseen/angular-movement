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
import { SharedLayoutRegistry } from './shared-layout.registry';

interface FlipDelta {
  dx: number;
  dy: number;
  dw: number;
  dh: number;
  targetRect: DOMRect;
}

/**
 * The FLIP delta between two rects, or `null` when the movement is too small to be worth animating.
 *
 * The thresholds keep sub-pixel layout noise — and a re-measure that lands on the same box — from
 * kicking off an animation on every render pass.
 */
function flipDelta(from: DOMRect, to: DOMRect): FlipDelta | null {
  const dx = from.left - to.left;
  const dy = from.top - to.top;
  const dw = from.width / to.width;
  const dh = from.height / to.height;

  const moved =
    Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5 || Math.abs(dw - 1) > 0.01 || Math.abs(dh - 1) > 0.01;

  return moved ? { dx, dy, dw, dh, targetRect: to } : null;
}

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
  readonly #sharedLayout = inject(SharedLayoutRegistry);

  #snapshot: DOMRect | null = null;
  #currentPlayer: AnimationControls | null = null;
  #isBrowser = isPlatformBrowser(this.#platformId);
  #isReducedMotion = false;
  #isAnimating = false;
  /** A shared-layout handover is an entrance: it may only be claimed on this element's first read. */
  #hasClaimedSharedLayout = false;

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
          this.#publishSharedLayout(currentRect);
          return null;
        }

        const shared = this.#claimSharedLayout(currentRect);
        this.#publishSharedLayout(currentRect);
        if (shared) {
          this.#snapshot = currentRect;
          return shared;
        }

        const delta = this.#snapshot ? flipDelta(this.#snapshot, currentRect) : null;
        if (delta) {
          return delta;
        }

        this.#snapshot = currentRect;
        return null;
      },
      write: (delta: FlipDelta | null) => {
        if (delta) {
          this.playFlip(delta);
        }
      },
    });
  }

  /**
   * Claims the rect left behind by the *other* element that shares this `moveLayoutId`, so the
   * host animates in from where its predecessor sat rather than from its own position.
   *
   * Only ever fires on the first read: after that the element owns the id, and any further
   * movement is ordinary layout FLIP against its own snapshot.
   */
  #claimSharedLayout(currentRect: DOMRect): FlipDelta | null {
    const id = this.moveLayoutId();
    if (!id || this.#hasClaimedSharedLayout) {
      return null;
    }

    this.#hasClaimedSharedLayout = true;

    const sourceRect = this.#sharedLayout.claim(id, this.#host.nativeElement);
    return sourceRect ? flipDelta(sourceRect, currentRect) : null;
  }

  #publishSharedLayout(rect: DOMRect): void {
    const id = this.moveLayoutId();
    if (id) {
      this.#sharedLayout.publish(id, this.#host.nativeElement, rect);
    }
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

  private playFlip(flipData: FlipDelta) {
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
        // The engine keys off this flag, not `config.disabled` — a hardcoded `false` here would
        // silently ignore `MOVEMENT_CONFIG.disabled` (the app-wide kill switch).
        disabled: config.disabled,
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
