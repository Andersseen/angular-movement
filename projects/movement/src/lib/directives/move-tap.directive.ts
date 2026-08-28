import { DOCUMENT } from '@angular/common';
import { Directive, effect, ElementRef, inject, input, OnDestroy, OnInit } from '@angular/core';
import { MoveKeyframes, MovePreset, MoveSpring } from '../presets/presets.types';
import { MOVEMENT_CONFIG } from '../tokens/movement.tokens';
import {
  clearComposedStyle,
  optionalBooleanAttribute,
  optionalNumberAttribute,
  prefersReducedMotion,
  resolveMovementConfig,
  resolveMoveFrames,
  reverseFrames,
} from './move-animation.utils';
import { AnimationEngine } from '../engines/animation-engine.service';
import { AnimationControls } from '../engines/animation-controls';
import { MOVE_PRESENCE_PARENT, MovePresenceChild } from '../tokens/presence.tokens';

/**
 * Stable API — covered by semantic-versioning guarantees.
 *
 * @stability stable
 */
@Directive({
  selector: '[moveWhileTap]',
  host: {
    '(pointerdown)': 'onPointerDown()',
    '(pointerup)': 'onPointerUp()',
    '(pointercancel)': 'onPointerUp()',
    '(pointerleave)': 'onPointerUp()',
  },
})
export class MoveTapDirective implements OnDestroy, OnInit, MovePresenceChild {
  readonly moveWhileTap = input.required<MovePreset | MoveKeyframes>();
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
  readonly moveReverseDuration = input<number | undefined, unknown>(undefined, {
    transform: optionalNumberAttribute,
  });
  readonly moveReverseEasing = input<string | undefined>(undefined);

  readonly #defaults = inject(MOVEMENT_CONFIG);
  readonly #documentRef = inject(DOCUMENT);
  readonly #host = inject(ElementRef<HTMLElement>);
  readonly #engine = inject(AnimationEngine);
  readonly #presence = inject(MOVE_PRESENCE_PARENT, { optional: true });

  #currentPlayer: AnimationControls | null = null;
  #isTapped = false;

  constructor() {
    effect(() => {
      // Track reactive inputs so a change while tapped restarts the animation.
      this.moveWhileTap();
      this.moveDuration();
      this.moveEasing();
      this.moveDelay();
      this.moveDisabled();
      this.moveSpring();
      this.moveReverseDuration();
      this.moveReverseEasing();

      if (this.#isTapped) {
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
   * Called by `MovePresenceParent` once a `*movePresence` exit begins on this element. Tap has no
   * leave animation of its own to run — it just cancels whatever it's mid-flight and gets out of
   * the way so the real leave animation doesn't race it.
   */
  playLeave(): void {
    this.#currentPlayer?.cancel();
  }

  onPointerDown() {
    if (this.#isTapped) return;
    this.#isTapped = true;
    this.play(false);
  }

  onPointerUp() {
    if (!this.#isTapped) return;
    this.#isTapped = false;
    this.play(true);
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

    let frames = resolveMoveFrames(this.moveWhileTap(), 'enter');

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
