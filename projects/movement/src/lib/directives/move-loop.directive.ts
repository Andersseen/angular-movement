import { DOCUMENT } from '@angular/common';
import { Directive, effect, ElementRef, inject, input, OnDestroy } from '@angular/core';
import { MoveKeyframes, MovePreset, MoveRepeatType, MoveSpring } from '../presets/presets.types';
import { MOVEMENT_CONFIG } from '../tokens/movement.tokens';
import {
  numberAttribute,
  optionalBooleanAttribute,
  optionalNumberAttribute,
  prefersReducedMotion,
  resolveMovementConfig,
  resolveMoveFrames,
} from './move-animation.utils';
import { AnimationEngine } from '../engines/animation-engine.service';
import { AnimationControls } from '../engines/animation-controls';

/**
 * Stable candidate — feature-complete, but naming or behaviour may still receive small adjustments before 1.0.
 *
 * @stability candidate
 */
@Directive({
  selector: '[moveLoop]',
})
export class MoveLoopDirective implements OnDestroy {
  readonly moveLoop = input<MovePreset | MoveKeyframes>('none');
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

  /**
   * `'loop'` (default) restarts each cycle from the first keyframe. `'reverse'` alternates, so the
   * animation plays back down to its start — what breathing, pulsing and yoyo effects need.
   */
  readonly moveLoopType = input<MoveRepeatType>('loop');
  /** Pause between cycles, in milliseconds. */
  readonly moveLoopDelay = input<number, unknown>(0, { transform: numberAttribute });
  /** Cycle count. Defaults to endless, which is what makes it a loop. */
  readonly moveLoopCount = input<number, unknown>(Infinity, {
    transform: (value) => {
      const parsed = numberAttribute(value);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : Infinity;
    },
  });

  readonly #defaults = inject(MOVEMENT_CONFIG);
  readonly #documentRef = inject(DOCUMENT);
  readonly #host = inject(ElementRef<HTMLElement>);
  readonly #engine = inject(AnimationEngine);

  #player: AnimationControls | null = null;

  constructor() {
    effect(() => {
      this.#player?.cancel();
      this.#player = null;

      const frames = resolveMoveFrames(this.moveLoop(), 'loop');

      // Skip noop presets to avoid creating an infinite animation that does nothing
      if (this.moveLoop() === 'none' || Object.keys(frames).length === 0) {
        return;
      }

      this.moveLoopType();
      this.moveLoopDelay();
      this.moveLoopCount();

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

      this.#player = this.#engine.play(this.#host.nativeElement, frames, {
        config,
        spring: this.moveSpring(),
        disabled: config.disabled,
        repeat: {
          repeat: this.moveLoopCount(),
          repeatType: this.moveLoopType(),
          repeatDelay: this.moveLoopDelay(),
        },
      });
    });
  }

  ngOnDestroy(): void {
    this.#player?.cancel();
  }
}
