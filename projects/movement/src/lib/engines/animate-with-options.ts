import { AnimationEngine } from './animation-engine.service';
import { AnimationControls } from './animation-controls';
import { MoveKeyframes, MoveSpring, MoveTransitionConfig } from '../presets/presets.types';
import { MovementConfig } from '../tokens/movement.tokens';
import { prefersReducedMotion, resolveMovementConfig } from '../directives/move-animation.utils';
import { normalizeTime } from '../move-time';
import type { MoveAnimateOptions } from './move-animator.service';

/**
 * Internal — not barrel-exported. Already-normalized values from a middle layer, e.g. a
 * directive's own inputs.
 */
export interface AnimateLayer {
  duration?: number;
  easing?: string;
  delay?: number;
  disabled?: boolean;
  iterations?: number;
  spring?: MoveSpring;
  transition?: MoveTransitionConfig;
}

/**
 * The single resolution path behind `MoveAnimator.animate()` and `MoveTriggerDirective.play()`:
 *
 * `MOVEMENT_CONFIG` defaults → `layer` (directive inputs) → per-call `options` → reduced motion.
 *
 * Reduced motion always wins; everything else is "last defined value wins".
 */
export function animateWithOptions(
  engine: AnimationEngine,
  documentRef: Document,
  defaults: MovementConfig,
  target: Element,
  keyframes: MoveKeyframes,
  options: MoveAnimateOptions,
  layer: AnimateLayer = {},
): AnimationControls | null {
  const config = resolveMovementConfig(
    defaults,
    {
      duration: normalizeTime('duration', options.duration) ?? layer.duration,
      easing: options.easing ?? layer.easing,
      delay: normalizeTime('delay', options.delay) ?? layer.delay,
      disabled: options.disabled ?? layer.disabled,
      iterations: options.iterations ?? layer.iterations,
    },
    prefersReducedMotion(documentRef),
  );

  return engine.play(target, keyframes, {
    config,
    spring: options.spring ?? layer.spring,
    delay: config.delay,
    // The engine keys off this flag, not `config.disabled` — passing the resolved config alone
    // would animate straight through a reduced-motion preference.
    disabled: config.disabled,
    iterations: config.iterations,
    transition: options.transition ?? layer.transition,
    onDone: options.onDone,
    pseudoElement: options.pseudoElement,
  });
}
