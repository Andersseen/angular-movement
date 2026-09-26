import { DOCUMENT } from '@angular/common';
import { Directive, effect, ElementRef, inject, input, OnDestroy, OnInit } from '@angular/core';
import { MoveKeyframes, MovePreset, MoveSpring } from '../presets/presets.types';
import { MOVEMENT_CONFIG } from '../tokens/movement.tokens';
import {
  clearComposedStyle,
  optionalBooleanAttribute,
  prefersReducedMotion,
  resolveMovementConfig,
  resolveMoveFrames,
  reverseFrames,
} from './move-animation.utils';
import { optionalTimeAttribute } from '../move-time';
import { AnimationEngine } from '../engines/animation-engine.service';
import { AnimationControls } from '../engines/animation-controls';
import { MOVE_PRESENCE_PARENT, MovePresenceChild } from '../tokens/presence.tokens';

/**
 * Plays while a hover-capable pointer is over the element, and reverses when it leaves.
 *
 * Hover means real hover: a mouse, or a pen/stylus (which reports hover when the device supports
 * it, and leaves on lift when it does not). **Touch never triggers it** — a finger has no hover
 * state, and emulating one is what produced sticky hover and blocked taps. For press feedback on
 * touch, pair it with `moveWhileTap`:
 *
 * ```html
 * <a href="/pricing" moveWhileHover="lift" moveWhileTap="press">Pricing</a>
 * ```
 *
 * The directive never calls `preventDefault()`: links, buttons and scrolling behave natively.
 *
 * Stable API — covered by semantic-versioning guarantees.
 *
 * @stability stable
 */
@Directive({
  selector: '[moveWhileHover]',
  host: {
    '(pointerenter)': 'onPointerEnter($event)',
    '(pointerleave)': 'onPointerLeave()',
  },
})
export class MoveHoverDirective implements OnDestroy, OnInit, MovePresenceChild {
  readonly moveWhileHover = input.required<MovePreset | MoveKeyframes>();
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
  readonly moveReverseDuration = input<number | undefined, unknown>(undefined, {
    transform: optionalTimeAttribute('moveReverseDuration'),
  });
  readonly moveReverseEasing = input<string | undefined>(undefined);

  readonly #defaults = inject(MOVEMENT_CONFIG);
  readonly #documentRef = inject(DOCUMENT);
  readonly #host = inject(ElementRef<HTMLElement>);
  readonly #engine = inject(AnimationEngine);
  readonly #presence = inject(MOVE_PRESENCE_PARENT, { optional: true });

  #currentPlayer: AnimationControls | null = null;
  #isHovered = false;

  constructor() {
    effect(() => {
      // Track reactive inputs so a change while hovered restarts the animation.
      this.moveWhileHover();
      this.moveDuration();
      this.moveEasing();
      this.moveDelay();
      this.moveDisabled();
      this.moveSpring();
      this.moveReverseDuration();
      this.moveReverseEasing();

      if (this.#isHovered) {
        this.play(false);
      } else if (this.#currentPlayer) {
        this.play(true);
      }
    });
  }

  ngOnInit(): void {
    this.#presence?.register(this);
  }

  /**
   * Called by `MovePresenceParent` once a `*movePresence` exit begins on this element. Hover has
   * no leave animation of its own to run — it just cancels whatever it's mid-flight and gets out
   * of the way so the real leave animation doesn't race it.
   */
  playLeave(): void {
    this.#currentPlayer?.cancel();
  }

  /** Starts the hover animation for any pointer except touch. */
  onPointerEnter(event?: Pick<PointerEvent, 'pointerType'>) {
    if (event?.pointerType === 'touch') return;
    this.onMouseEnter();
  }

  /** Ends hover. A no-op when hover never started, which is always the case for touch. */
  onPointerLeave() {
    this.onMouseLeave();
  }

  /** Enters the hovered state. Called by `onPointerEnter()`; kept public for compatibility. */
  onMouseEnter() {
    if (this.#isHovered) return;
    this.#isHovered = true;
    this.play(false);
  }

  /** Leaves the hovered state. Called by `onPointerLeave()`; kept public for compatibility. */
  onMouseLeave() {
    if (!this.#isHovered) return;
    this.#isHovered = false;
    this.play(true);
  }

  /**
   * @deprecated No longer bound to any event and does nothing: touch does not emulate hover as of
   * 1.2 (use `moveWhileTap` for touch feedback). Kept so the class shape stays compatible within
   * 1.x.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- keeps the 1.x call signature
  onTouchStart(_event?: TouchEvent) {
    // Intentionally empty — see the deprecation note.
  }

  /**
   * @deprecated No longer bound to any event. Ends a hover in progress, like `onMouseLeave()`.
   * Kept so the class shape stays compatible within 1.x.
   */
  onTouchEnd() {
    this.onMouseLeave();
  }

  private play(reverse: boolean) {
    this.#currentPlayer?.cancel();

    const isReduced = prefersReducedMotion(this.#documentRef);
    const config = resolveMovementConfig(
      this.#defaults,
      {
        duration: this.moveDuration(),
        easing: this.moveEasing(),
        delay: this.moveDelay(),
        disabled: this.moveDisabled(),
      },
      isReduced,
    );

    if (config.disabled) return;

    let frames = resolveMoveFrames(this.moveWhileHover(), 'enter');

    if (reverse) {
      const reverseDuration = this.moveReverseDuration();
      if (reverseDuration === 0) {
        clearComposedStyle(this.#host.nativeElement, Object.keys(frames));
        return;
      }
      frames = reverseFrames(frames);
    }

    const reverseConfig = reverse
      ? resolveMovementConfig(
          { ...this.#defaults, duration: 200, easing: 'ease-out', delay: 0 },
          {
            duration: this.moveReverseDuration() ?? this.moveDuration(),
            easing: this.moveReverseEasing(),
            delay: 0,
          },
          isReduced,
        )
      : config;

    this.#currentPlayer = this.#engine.play(this.#host.nativeElement, frames, {
      config: reverseConfig,
      spring: this.moveSpring(),
      disabled: false,
    });
  }

  ngOnDestroy(): void {
    this.#presence?.unregister(this);
    this.#currentPlayer?.cancel();
  }
}
