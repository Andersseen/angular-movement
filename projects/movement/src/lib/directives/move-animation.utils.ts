import { MoveKeyframes, MovePreset } from '../presets/presets.types';
import { MOVE_PRESETS } from '../presets/presets';
import { MovementConfig } from '../tokens/movement.tokens';

export type MovePhase = 'enter' | 'leave';

export type MoveDirectiveInput = MovePreset | MoveKeyframes;

export interface MoveInputOverrides {
  duration?: number;
  easing?: string;
  delay?: number;
  disabled?: boolean;
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
  };
}

export function resolveMoveFrames(value: MoveDirectiveInput, phase: MovePhase): MoveKeyframes {
  if (typeof value === 'string') {
    return MOVE_PRESETS[value][phase];
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
