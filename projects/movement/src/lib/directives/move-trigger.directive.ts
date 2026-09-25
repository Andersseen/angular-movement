import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, OnDestroy, effect, inject, input } from '@angular/core';
import { AnimationControls } from '../engines/animation-controls';
import { AnimationEngine } from '../engines/animation-engine.service';
import { MoveKeyframes, MoveKeyframeState, MoveSpring } from '../presets/presets.types';
import { MOVEMENT_CONFIG } from '../tokens/movement.tokens';
import {
  applyComposedStyle,
  clearComposedStyle,
  composeFinalStyle,
  composeInitialStyle,
  ComposedKeyframe,
} from '../engines/keyframe-composer';
import {
  booleanAttribute,
  optionalBooleanAttribute,
  prefersReducedMotion,
  resolveMovementConfig,
} from './move-animation.utils';
import { optionalTimeAttribute } from '../move-time';
import { movementWarn } from '../dev-warn';
import { animateWithOptions } from '../engines/animate-with-options';
import type { MoveAnimateOptions } from '../engines/move-animator.service';

/**
 * Plays keyframes on its host when a boolean flips to `true`, and resets when it flips back —
 * the declarative trigger side of `moveTarget`/`moveTrigger`.
 *
 * ```html
 * <div [moveTrigger]="open()" [moveFrames]="{ opacity: [0, 1] }"></div>
 * ```
 *
 * It also exposes an imperative handle. A bare `moveTrigger` attribute means *imperative only* —
 * no declarative trigger, no frames required:
 *
 * ```html
 * <div #overlay="moveTrigger" moveTrigger></div>
 * ```
 * ```ts
 * await overlay.play({ opacity: [0, 1] }, { duration: '180ms' });
 * ```
 *
 * For animation driven entirely from TypeScript, prefer `MoveAnimator` — it needs no template
 * element at all and supports pseudo-elements.
 *
 * Experimental API — may change significantly between minor versions.
 *
 * @stability experimental
 * @experimental
 */
@Directive({
  selector: '[moveTrigger]',
  standalone: true,
  exportAs: 'moveTrigger',
})
export class MoveTriggerDirective implements OnDestroy {
  /**
   * `true` plays `moveFrames`, `false` resets. A bare attribute (`<div moveTrigger>`) or no value
   * leaves the directive in imperative-only mode: nothing plays until `play()` is called.
   */
  readonly moveTrigger = input<boolean | undefined, unknown>(undefined, {
    transform: (value) => (value === '' || value == null ? undefined : booleanAttribute(value)),
  });
  /** Keyframes the declarative trigger plays, and the default for `play()` without frames. */
  readonly moveFrames = input<MoveKeyframes | undefined>(undefined);
  readonly moveResetFrames = input<MoveKeyframes | undefined>(undefined);
  readonly moveResetState = input<'initial' | 'final' | 'clear'>('clear');

  readonly moveDuration = input<number | undefined, unknown>(undefined, {
    transform: optionalTimeAttribute('moveDuration'),
  });
  readonly moveEasing = input<string | undefined>(undefined);
  readonly moveDelay = input<number | undefined, unknown>(undefined, {
    transform: optionalTimeAttribute('moveDelay'),
  });
  readonly moveSpring = input<MoveSpring | undefined>(undefined);
  readonly moveDisabled = input<boolean | undefined, unknown>(undefined, {
    transform: optionalBooleanAttribute,
  });
  readonly moveReverseDuration = input<number | undefined, unknown>(undefined, {
    transform: optionalTimeAttribute('moveReverseDuration'),
  });
  readonly moveReverseEasing = input<string | undefined>(undefined);

  readonly #defaults = inject(MOVEMENT_CONFIG);
  readonly #documentRef = inject(DOCUMENT);
  readonly #host = inject(ElementRef<Element>);
  readonly #engine = inject(AnimationEngine);

  #currentPlayer: AnimationControls | null = null;
  #hasPlayedForward = false;
  /** Frames most recently played — what `reset()` and teardown clean up after. */
  #lastFrames: MoveKeyframes | undefined;

  readonly #triggerEffect = effect(() => {
    const active = this.moveTrigger();
    const frames = this.moveFrames();

    // Imperative-only mode: only `play()` drives the host.
    if (active === undefined) return;

    if (!frames) {
      if (active) movementWarn('moveTrigger is true but no moveFrames are bound; nothing to play.');
      return;
    }

    if (active) {
      this.#playForward(frames, {});
      this.#hasPlayedForward = true;
      return;
    }

    if (this.#hasPlayedForward) {
      this.#playReset(frames);
    }
  });

  /**
   * Plays `frames` (or `moveFrames`) on the host, cancelling whatever this directive was playing.
   *
   * `options` apply to this call only — no need to mutate inputs to play two phases with different
   * timing. Resolution order: `MOVEMENT_CONFIG` → this directive's inputs → `options` → reduced
   * motion.
   *
   * The promise always resolves, never rejects: when the animation finishes, and also when it is
   * cancelled (a second `play()`, `reset()`, destroy). Code after `await` always runs.
   */
  play(frames?: MoveKeyframes, options: MoveAnimateOptions = {}): Promise<void> {
    const targetFrames = frames ?? this.moveFrames();
    if (!targetFrames) {
      movementWarn('moveTrigger.play() was called without frames and no moveFrames are bound.');
      return Promise.resolve();
    }

    this.#playForward(targetFrames, options);
    this.#hasPlayedForward = true;
    return this.#currentPlayer?.finished ?? Promise.resolve();
  }

  /** Cancels the current animation and restores the host per `moveResetState`. */
  reset(): void {
    this.#currentPlayer?.cancel();
    const frames = this.#lastFrames ?? this.moveFrames();
    if (frames) this.#applyReset(frames);
  }

  set(state: MoveKeyframeState): void {
    this.#currentPlayer?.cancel();
    applyComposedStyle(this.#host.nativeElement, state as unknown as ComposedKeyframe);
  }

  #playForward(frames: MoveKeyframes, options: MoveAnimateOptions): void {
    this.#currentPlayer?.cancel();
    this.#lastFrames = frames;

    this.#currentPlayer = animateWithOptions(
      this.#engine,
      this.#documentRef,
      this.#defaults,
      this.#host.nativeElement,
      frames,
      options,
      {
        duration: this.moveDuration(),
        easing: this.moveEasing(),
        delay: this.moveDelay(),
        disabled: this.moveDisabled(),
        spring: this.moveSpring(),
      },
    );
  }

  #playReset(frames: MoveKeyframes): void {
    this.#currentPlayer?.cancel();

    const resetFrames = this.moveResetFrames();
    if (resetFrames) {
      const isReduced = prefersReducedMotion(this.#documentRef);
      const config = resolveMovementConfig(
        { ...this.#defaults, duration: 200, easing: 'ease-out', delay: 0 },
        {
          duration: this.moveReverseDuration() ?? this.moveDuration(),
          easing: this.moveReverseEasing(),
          delay: 0,
          disabled: this.moveDisabled(),
        },
        isReduced,
      );

      this.#currentPlayer = this.#engine.play(this.#host.nativeElement, resetFrames, {
        config,
        spring: this.moveSpring(),
        disabled: config.disabled,
      });
      return;
    }

    const reverseDuration = this.moveReverseDuration();
    if (reverseDuration === 0) {
      this.#applyReset(frames);
      return;
    }

    const isReduced = prefersReducedMotion(this.#documentRef);
    const config = resolveMovementConfig(
      { ...this.#defaults, duration: 200, easing: 'ease-out', delay: 0 },
      {
        duration: reverseDuration ?? this.moveDuration(),
        easing: this.moveReverseEasing(),
        delay: 0,
        disabled: this.moveDisabled(),
      },
      isReduced,
    );

    if (config.disabled) {
      this.#applyReset(frames);
      return;
    }

    // For triggers, reverse is typically not desired; we reset to initial/clear.
    // We apply the initial style of the forward frames to restore state.
    this.#applyReset(frames);
  }

  #applyReset(frames: MoveKeyframes): void {
    const mode = this.moveResetState();
    const host = this.#host.nativeElement;

    if (mode === 'clear') {
      clearComposedStyle(host, Object.keys(frames));
      return;
    }

    if (mode === 'initial') {
      clearComposedStyle(host, Object.keys(frames));
      applyComposedStyle(host, composeInitialStyle(frames));
      return;
    }

    if (mode === 'final') {
      clearComposedStyle(host, Object.keys(frames));
      applyComposedStyle(host, composeFinalStyle(frames));
    }
  }

  ngOnDestroy(): void {
    this.#triggerEffect.destroy();
    this.#currentPlayer?.cancel();
    const keys = new Set([
      ...Object.keys(this.moveFrames() ?? {}),
      ...Object.keys(this.#lastFrames ?? {}),
    ]);
    if (keys.size > 0) {
      clearComposedStyle(this.#host.nativeElement, [...keys]);
    }
  }
}
