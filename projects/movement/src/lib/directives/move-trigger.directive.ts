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
import { prefersReducedMotion, resolveMovementConfig } from './move-animation.utils';

function optionalNumberAttribute(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return Number(value);
}

@Directive({
  selector: '[moveTrigger]',
  standalone: true,
  exportAs: 'moveTrigger',
})
export class MoveTriggerDirective implements OnDestroy {
  readonly moveTrigger = input.required<boolean>();
  readonly moveFrames = input.required<MoveKeyframes>();
  readonly moveResetFrames = input<MoveKeyframes | undefined>(undefined);
  readonly moveResetState = input<'initial' | 'final' | 'clear'>('clear');

  readonly moveDuration = input<number | undefined, unknown>(undefined, {
    transform: optionalNumberAttribute,
  });
  readonly moveEasing = input<string | undefined>(undefined);
  readonly moveDelay = input<number | undefined, unknown>(undefined, {
    transform: optionalNumberAttribute,
  });
  readonly moveSpring = input<MoveSpring | undefined>(undefined);
  readonly moveDisabled = input<boolean | undefined>(undefined);
  readonly moveReverseDuration = input<number | undefined, unknown>(undefined, {
    transform: optionalNumberAttribute,
  });
  readonly moveReverseEasing = input<string | undefined>(undefined);

  readonly #defaults = inject(MOVEMENT_CONFIG);
  readonly #documentRef = inject(DOCUMENT);
  readonly #host = inject(ElementRef<Element>);
  readonly #engine = inject(AnimationEngine);

  #currentPlayer: AnimationControls | null = null;
  #hasPlayedForward = false;

  readonly #triggerEffect = effect(() => {
    const active = this.moveTrigger();
    const frames = this.moveFrames();

    if (active) {
      this.#playForward(frames);
      this.#hasPlayedForward = true;
      return;
    }

    if (this.#hasPlayedForward) {
      this.#playReset(frames);
    }
  });

  play(frames?: MoveKeyframes): Promise<void> {
    const targetFrames = frames ?? this.moveFrames();
    this.#playForward(targetFrames);
    this.#hasPlayedForward = true;
    return this.#currentPlayer?.finished ?? Promise.resolve();
  }

  reset(): void {
    this.#currentPlayer?.cancel();
    const frames = this.moveFrames();
    this.#applyReset(frames);
  }

  set(state: MoveKeyframeState): void {
    this.#currentPlayer?.cancel();
    applyComposedStyle(this.#host.nativeElement, state as unknown as ComposedKeyframe);
  }

  #playForward(frames: MoveKeyframes): void {
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

    this.#currentPlayer = this.#engine.play(this.#host.nativeElement, frames, {
      config,
      spring: this.moveSpring(),
      disabled: config.disabled,
    });
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
    const frames = this.moveFrames();
    if (frames) {
      clearComposedStyle(this.#host.nativeElement, Object.keys(frames));
    }
  }
}
