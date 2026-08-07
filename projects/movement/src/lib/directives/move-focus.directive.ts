import { DOCUMENT } from '@angular/common';
import { Directive, effect, ElementRef, inject, input, OnDestroy } from '@angular/core';
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

/**
 * Stable API — covered by semantic-versioning guarantees.
 *
 * @stability stable
 */
@Directive({
  selector: '[moveWhileFocus]',
  host: {
    '(focusin)': 'onFocus()',
    '(focusout)': 'onBlur()',
  },
})
export class MoveFocusDirective implements OnDestroy {
  readonly moveWhileFocus = input.required<MovePreset | MoveKeyframes>();
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

  #currentPlayer: AnimationControls | null = null;
  #isFocused = false;

  constructor() {
    effect(() => {
      // Track reactive inputs so a change while focused restarts the animation.
      this.moveWhileFocus();
      this.moveDuration();
      this.moveEasing();
      this.moveDelay();
      this.moveDisabled();
      this.moveSpring();
      this.moveReverseDuration();
      this.moveReverseEasing();

      if (this.#isFocused) {
        this.play(false);
      } else if (this.#currentPlayer) {
        this.play(true);
      }
    });
  }

  onFocus() {
    if (this.#isFocused) return;
    this.#isFocused = true;
    this.play(false);
  }

  onBlur() {
    if (!this.#isFocused) return;
    this.#isFocused = false;
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

    let frames = resolveMoveFrames(this.moveWhileFocus(), 'enter');

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
    this.#currentPlayer?.cancel();
  }
}
