import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, OnDestroy, effect, inject, input } from '@angular/core';
import { AnimationControls } from '../engines/animation-controls';
import { AnimationEngine } from '../engines/animation-engine.service';
import { MoveKeyframes, MoveSpring, MoveTransitionConfig } from '../presets/presets.types';
import { MOVEMENT_CONFIG } from '../tokens/movement.tokens';
import { prefersReducedMotion, resolveMovementConfig, reverseFrames } from './move-animation.utils';

function optionalNumberAttribute(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return Number(value);
}

@Directive({
  selector: '[moveTarget]',
  standalone: true,
})
export class MoveTargetDirective implements OnDestroy {
  readonly moveTarget = input.required<boolean>();
  readonly moveFrames = input.required<MoveKeyframes>();
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
  readonly moveTransition = input<MoveTransitionConfig | undefined>(undefined);

  readonly #defaults = inject(MOVEMENT_CONFIG);
  readonly #documentRef = inject(DOCUMENT);
  readonly #host = inject(ElementRef<Element>);
  readonly #engine = inject(AnimationEngine);

  #currentPlayer: AnimationControls | null = null;
  #hasPlayedForward = false;

  readonly #targetEffect = effect(() => {
    const active = this.moveTarget();
    const frames = this.moveFrames();

    if (active) {
      this.#playForward(frames);
      this.#hasPlayedForward = true;
      return;
    }

    if (this.#hasPlayedForward) {
      this.#playReverse(frames);
    }
  });

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
      transition: this.moveTransition(),
    });
  }

  #playReverse(frames: MoveKeyframes): void {
    this.#currentPlayer?.cancel();

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

    this.#currentPlayer = this.#engine.play(this.#host.nativeElement, reverseFrames(frames), {
      config,
      spring: this.moveSpring(),
      disabled: config.disabled,
      transition: this.moveTransition(),
    });
  }

  ngOnDestroy(): void {
    this.#targetEffect.destroy();
    this.#currentPlayer?.cancel();
  }
}
