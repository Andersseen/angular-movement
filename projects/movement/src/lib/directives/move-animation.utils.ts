import {
  applyComposedStyle,
  clearComposedStyle,
  composeInitialStyle,
} from '../engines/keyframe-composer';
import { MOVE_PRESETS } from '../presets/presets';
import { MoveKeyframes, MovePreset, MoveSpring } from '../presets/presets.types';
import { MovementConfig } from '../tokens/movement.tokens';

export type MovePhase = 'enter' | 'leave' | 'loop';

export type MoveDirectiveInput = MovePreset | MoveKeyframes;

export interface MoveInputOverrides {
  duration?: number;
  easing?: string;
  delay?: number;
  disabled?: boolean;
  iterations?: number;
}

export function resolveMovementConfig(
  defaults: MovementConfig,
  overrides: MoveInputOverrides,
  reducedMotion: boolean,
): MovementConfig {
  if (reducedMotion && typeof ngDevMode !== 'undefined' && ngDevMode) {
    console.warn(
      '[Movement] Animations disabled: prefers-reduced-motion is active. ' +
        'Disable "Reduce motion" in your OS accessibility settings to see animations.',
    );
  }

  return {
    duration: Math.max(0, overrides.duration ?? defaults.duration),
    easing: overrides.easing ?? defaults.easing,
    delay: Math.max(0, overrides.delay ?? defaults.delay),
    disabled: reducedMotion || (overrides.disabled ?? defaults.disabled),
    iterations: overrides.iterations ?? defaults.iterations,
  };
}

export function resolveMoveFrames(value: MoveDirectiveInput, phase: MovePhase): MoveKeyframes {
  if (typeof value === 'string') {
    const preset = MOVE_PRESETS[value];
    if (!preset) {
      if (typeof ngDevMode !== 'undefined' && ngDevMode) {
        console.warn(`[Movement] Unknown preset: "${value}". Using "none" preset.`);
      }
      return MOVE_PRESETS['none'][phase] ?? MOVE_PRESETS['none'].enter;
    }
    return preset[phase] ?? preset.enter;
  }

  return value;
}

export function prefersReducedMotion(documentRef: Document): boolean {
  const view = documentRef.defaultView;
  if (!view || typeof view.matchMedia !== 'function') {
    return false;
  }

  return view.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Reverses all keyframe value arrays in a MoveKeyframes object.
 * Used by hover and tap directives to animate back to the original state.
 */
export function reverseFrames(frames: MoveKeyframes): MoveKeyframes {
  const reversed: MoveKeyframes = {};
  for (const key in frames) {
    const k = key as keyof MoveKeyframes;
    const arr = frames[k];
    if (arr) {
      reversed[k] = [...arr].reverse() as readonly number[];
    }
  }
  return reversed;
}

/**
 * Applies the first keyframe values as inline styles to an element.
 * Used by in-view and text directives to set the initial (hidden) state
 * before the IntersectionObserver triggers the animation.
 */
export function applyInitialStyles(el: HTMLElement, frames: MoveKeyframes): void {
  applyComposedStyle(el, composeInitialStyle(frames));
}

/**
 * Clears all inline styles set by `applyInitialStyles`.
 * Called just before WAAPI animates so it can take full control.
 */
export function clearInitialStyles(el: HTMLElement): void {
  clearComposedStyle(el);
}

/**
 * Validates MoveSpring configuration and returns sanitized values.
 * Warns in development mode for invalid values.
 */
export function validateSpring(spring: MoveSpring | undefined): MoveSpring | undefined {
  if (!spring) return undefined;

  const validated: MoveSpring = {};

  if (spring.stiffness !== undefined) {
    if (spring.stiffness <= 0 && typeof ngDevMode !== 'undefined' && ngDevMode) {
      console.warn('[Movement] Spring stiffness must be > 0. Using default.');
    }
    validated.stiffness = spring.stiffness > 0 ? spring.stiffness : 100;
  }

  if (spring.damping !== undefined) {
    if (spring.damping < 0 && typeof ngDevMode !== 'undefined' && ngDevMode) {
      console.warn('[Movement] Spring damping must be >= 0. Using default.');
    }
    validated.damping = spring.damping >= 0 ? spring.damping : 10;
  }

  if (spring.mass !== undefined) {
    if (spring.mass <= 0 && typeof ngDevMode !== 'undefined' && ngDevMode) {
      console.warn('[Movement] Spring mass must be > 0. Using default.');
    }
    validated.mass = spring.mass > 0 ? spring.mass : 1;
  }

  if (spring.velocity !== undefined) {
    validated.velocity = spring.velocity;
  }

  return validated;
}

/**
 * Validates scroll offset string format "elFraction viewFraction".
 * Returns true if valid, warns in dev mode if invalid.
 */
export function isValidScrollOffset(offset: string): boolean {
  const parts = offset.split(' ').map(parseFloat);
  if (parts.length !== 2 || parts.some(Number.isNaN)) {
    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
      console.warn(
        `[Movement] Invalid scroll offset: "${offset}". Expected format "elFraction viewFraction" (e.g. "0 1").`,
      );
    }
    return false;
  }
  return true;
}

/**
 * Validates drag elastic factor. Must be between 0 and 1.
 */
export function validateDragElastic(elastic: number): number {
  if (elastic < 0 || elastic > 1) {
    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
      console.warn(
        `[Movement] Drag elastic must be between 0 and 1. Got ${elastic}. Clamping to range.`,
      );
    }
    return Math.max(0, Math.min(1, elastic));
  }
  return elastic;
}
