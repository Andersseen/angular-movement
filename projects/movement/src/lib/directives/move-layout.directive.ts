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
  prefersReducedMotion,
  resolveMovementConfig,
} from './move-animation.utils';
import { optionalTimeAttribute } from '../move-time';
import { AnimationEngine } from '../engines/animation-engine.service';
import { AnimationControls } from '../engines/animation-controls';
import {
  LayoutBox,
  measureLayout,
  projectBox,
  setLayoutProjecting,
} from '../engines/layout-geometry';
import { SharedLayoutRegistry, readLayoutViewport } from './shared-layout.registry';

interface FlipDelta {
  dx: number;
  dy: number;
  dw: number;
  dh: number;
}

/**
 * The FLIP delta between two boxes, or `null` when the movement is too small to be worth animating.
 *
 * The thresholds keep sub-pixel layout noise — and a re-measure that lands on the same box — from
 * kicking off an animation on every render pass.
 */
function flipDelta(from: LayoutBox, to: LayoutBox): FlipDelta | null {
  const dx = from.left - to.left;
  const dy = from.top - to.top;
  const dw = from.width / to.width;
  const dh = from.height / to.height;

  const moved =
    Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5 || Math.abs(dw - 1) > 0.01 || Math.abs(dh - 1) > 0.01;

  return moved ? { dx, dy, dw, dh } : null;
}

/**
 * Animates the element from its previous position and size to its new layout (FLIP), including
 * shared-element transitions by `moveLayoutId`.
 *
 * Contract (spec 021): every Angular render pass measures the host's *natural* box (own transforms
 * inverted, running animations included), so a layout change that lands while a previous FLIP is
 * still running continues from where the element is painted instead of jumping. A cancelled,
 * replaced or destroyed FLIP always releases the transform origin it borrowed. Layout changes that
 * happen without an Angular render (CSS-only) are not observed until the next one.
 *
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
  /**
   * Namespace for `moveLayoutId`. Two regions that reuse the same local id (several dashboard
   * panels each with a `"card"`) must not hand over to one another: give each region its own scope.
   * Without it, ids share one app-wide namespace.
   */
  readonly moveLayoutScope = input<string | undefined>(undefined);
  readonly moveDuration = input<number | undefined, unknown>(undefined, {
    transform: optionalTimeAttribute('moveDuration'),
  });
  readonly moveEasing = input<string | undefined>(undefined);
  readonly moveDelay = input<number | undefined, unknown>(undefined, {
    transform: optionalTimeAttribute('moveDelay'),
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
  /** Opaque identity for the shared-layout registry; unlike the host it holds no DOM reference. */
  readonly #owner = {};

  /** The natural box as of the last render pass (or, mid-FLIP, the box the FLIP is heading to). */
  #snapshot: LayoutBox | null = null;
  #currentPlayer: AnimationControls | null = null;
  #isBrowser = isPlatformBrowser(this.#platformId);
  #isAnimating = false;
  #destroyed = false;
  /** Identifies the FLIP that owns the borrowed origin; a settled stale player must not clear a newer one. */
  #flipId = 0;
  /** The inline `transform-origin` before the first active FLIP borrowed it; `null` when not borrowed. */
  #borrowedOrigin: string | null = null;
  /** A shared-layout handover is an entrance: it may only be claimed on this element's first read. */
  #claimedForId: string | undefined;

  constructor() {
    if (!this.#isBrowser) {
      return;
    }

    afterEveryRender({
      earlyRead: () => this.#measure(),
      write: (delta: FlipDelta | null) => {
        if (delta && !this.#destroyed) {
          this.#playFlip(delta);
        }
      },
    });
  }

  /** The read phase: decides whether this render pass needs a FLIP. Never writes animation state. */
  #measure(): FlipDelta | null {
    if (this.#destroyed) {
      return null;
    }

    const measurement = measureLayout(this.#host.nativeElement);
    if (!measurement) {
      return null;
    }
    const { box, transform } = measurement;

    // Re-read each pass so toggling the OS setting mid-session takes effect on the next layout.
    if (
      this.moveLayout() === false ||
      this.moveDisabled() ||
      prefersReducedMotion(this.#documentRef)
    ) {
      this.#abortFlip();
      this.#snapshot = box;
      this.#publishSharedLayout(box);
      return null;
    }

    const shared = this.#claimSharedLayout(box);
    this.#publishSharedLayout(box);
    if (shared) {
      this.#snapshot = box;
      return shared;
    }

    const previous = this.#snapshot;
    this.#snapshot = box;
    if (!previous || !flipDelta(previous, box)) {
      return null;
    }

    // Layout moved. Start from where the old layout is *painted right now*: idle, that is the old
    // natural box; mid-FLIP it is the old natural box under the running animation's transform.
    const from = this.#isAnimating ? projectBox(previous, transform) : previous;
    const delta = flipDelta(from, box);
    if (!delta) {
      // The old layout was painted exactly where the new one sits (a change back to where the
      // running FLIP started). Its keyframes are relative to a layout that no longer exists, so
      // it must not keep running.
      this.#abortFlip();
    }
    return delta;
  }

  /**
   * Claims the box left behind by the *other* element that shares this `moveLayoutId`, so the
   * host animates in from where its predecessor sat rather than from its own position.
   *
   * Only ever fires once per id: after that the element owns the id, and any further movement is
   * ordinary layout FLIP against its own snapshot. Changing the id is a new identity, so it may
   * claim again.
   */
  #claimSharedLayout(box: LayoutBox): FlipDelta | null {
    const id = this.moveLayoutId();
    if (!id || this.#claimedForId === id) {
      return null;
    }

    this.#claimedForId = id;

    const source = this.#sharedLayout.claim(
      id,
      this.#owner,
      readLayoutViewport(this.#documentRef.defaultView),
      Date.now(),
      this.moveLayoutScope() ?? '',
    );
    return source ? flipDelta(source, box) : null;
  }

  #publishSharedLayout(box: LayoutBox): void {
    const id = this.moveLayoutId();
    if (id) {
      this.#sharedLayout.publish(
        id,
        this.#owner,
        box,
        readLayoutViewport(this.#documentRef.defaultView),
        Date.now(),
        this.moveLayoutScope() ?? '',
      );
    }
  }

  #playFlip(flipData: FlipDelta): void {
    // A FLIP already in flight is replaced, not layered: left running it would later commit its own
    // end value over the newer one. Its settled `finished` is ignored through `#flipId`.
    this.#currentPlayer?.cancel();

    this.#isAnimating = true;
    setLayoutProjecting(this.#host.nativeElement, true);
    const flipId = ++this.#flipId;

    // The host is currently visually at its NEW position (unpainted).
    // We apply the inverse transform to make it LOOK like it's at the OLD position.
    // We apply transform origin 0 0 so scaling works correctly from top-left. A replaced FLIP
    // already borrowed the origin: keep the user's original, never the borrowed value.
    const style = this.#host.nativeElement.style;
    this.#borrowedOrigin ??= style.transformOrigin;
    style.transformOrigin = '0 0';

    const config = resolveMovementConfig(
      this.#defaults,
      {
        duration: this.moveDuration(),
        easing: this.moveEasing(),
        delay: this.moveDelay(),
        disabled: this.moveDisabled(),
      },
      prefersReducedMotion(this.#documentRef),
    );

    const player = this.#engine.play(
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
          this.#finishLayoutAnimation(flipId);
        },
      },
    );
    this.#currentPlayer = player;

    if (!player) {
      this.#finishLayoutAnimation(flipId);
    } else {
      // `onDone` only fires on a natural finish. A cancelled FLIP (a drag, `MoveAnimator.set/clear`
      // or an external WAAPI cancel) still settles `finished`, and must release the borrowed
      // origin too — otherwise the host keeps `transform-origin: 0 0` for good.
      void player.finished.then(() => this.#finishLayoutAnimation(flipId));
    }
  }

  #finishLayoutAnimation(flipId: number): void {
    if (flipId !== this.#flipId || !this.#isAnimating || this.#destroyed) {
      return;
    }
    this.#isAnimating = false;
    this.#currentPlayer = null;
    this.#restoreOrigin();
    // Absorb any layout change that arrived without an Angular render, so it is not mistaken for
    // movement on the next pass.
    this.#snapshot = measureLayout(this.#host.nativeElement)?.box ?? this.#snapshot;
  }

  /** Stops the FLIP in flight (if any) and releases what it borrowed. */
  #abortFlip(): void {
    if (!this.#isAnimating) {
      return;
    }
    this.#flipId++;
    this.#isAnimating = false;
    this.#currentPlayer?.cancel();
    this.#currentPlayer = null;
    this.#restoreOrigin();
  }

  #restoreOrigin(): void {
    setLayoutProjecting(this.#host.nativeElement, false);
    if (this.#borrowedOrigin !== null) {
      this.#host.nativeElement.style.transformOrigin = this.#borrowedOrigin;
      this.#borrowedOrigin = null;
    }
  }

  ngOnDestroy(): void {
    this.#abortFlip();
    this.#destroyed = true;
  }
}
