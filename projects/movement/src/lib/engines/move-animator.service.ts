import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { AnimationEngine } from './animation-engine.service';
import { AnimationControls } from './animation-controls';
import { MoveKeyframes, MoveSpring, MoveTransitionConfig } from '../presets/presets.types';
import { MOVEMENT_CONFIG } from '../tokens/movement.tokens';
import { prefersReducedMotion, resolveMovementConfig } from '../directives/move-animation.utils';

/**
 * Stable API — covered by semantic-versioning guarantees.
 *
 * @stability stable
 */
export interface MoveAnimateOptions {
  duration?: number;
  easing?: string;
  delay?: number;
  disabled?: boolean;
  spring?: MoveSpring;
  iterations?: number;
  transition?: MoveTransitionConfig;
  onDone?: () => void;
}

/**
 * The supported way to animate an element without a directive — sequencing several elements,
 * reacting to a server response, driving a node the template does not own.
 *
 * Resolution order matches the directives exactly: `MOVEMENT_CONFIG` defaults, then the options
 * passed here, then the reduced-motion override. Returns `null` when nothing was scheduled — on
 * the server, or when motion is disabled — in which case the final styles have still been applied.
 *
 * ```ts
 * readonly #animator = inject(MoveAnimator);
 *
 * async reveal(el: HTMLElement) {
 *   await this.#animator.animate(el, { opacity: [0, 1], y: [20, 0] }, { duration: 400 })?.finished;
 * }
 * ```
 *
 * Stable API — covered by semantic-versioning guarantees.
 *
 * @stability stable
 */
@Injectable({ providedIn: 'root' })
export class MoveAnimator {
  readonly #engine = inject(AnimationEngine);
  readonly #defaults = inject(MOVEMENT_CONFIG);
  readonly #documentRef = inject(DOCUMENT);

  animate(
    target: Element,
    keyframes: MoveKeyframes,
    options: MoveAnimateOptions = {},
  ): AnimationControls | null {
    const config = resolveMovementConfig(
      this.#defaults,
      {
        duration: options.duration,
        easing: options.easing,
        delay: options.delay,
        disabled: options.disabled,
        iterations: options.iterations,
      },
      prefersReducedMotion(this.#documentRef),
    );

    return this.#engine.play(target, keyframes, {
      config,
      spring: options.spring,
      delay: config.delay,
      // The engine keys off this flag, not `config.disabled` — passing the resolved config alone
      // would animate straight through a reduced-motion preference.
      disabled: config.disabled,
      iterations: config.iterations,
      transition: options.transition,
      onDone: options.onDone,
    });
  }
}
