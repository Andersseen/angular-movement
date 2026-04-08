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
  const getFirst = (arr: readonly number[] | undefined) =>
    arr && arr.length > 0 ? arr[0] : undefined;

  const opacity = getFirst(frames.opacity);
  if (opacity !== undefined) el.style.opacity = `${opacity}`;

  const x = getFirst(frames.x);
  const y = getFirst(frames.y);
  if (x !== undefined || y !== undefined) {
    el.style.translate = `${x ?? 0}px ${y ?? 0}px`;
  }

  const scale = getFirst(frames.scale);
  if (scale !== undefined) el.style.scale = `${scale}`;

  const rotateX = getFirst(frames.rotateX);
  const rotateY = getFirst(frames.rotateY);
  if (rotateX !== undefined || rotateY !== undefined) {
    el.style.transform = `perspective(1200px) rotateX(${rotateX ?? 0}deg) rotateY(${rotateY ?? 0}deg)`;
  }
}

/**
 * Clears all inline styles set by `applyInitialStyles`.
 * Called just before WAAPI animates so it can take full control.
 */
export function clearInitialStyles(el: HTMLElement): void {
  el.style.opacity = '';
  el.style.translate = '';
  el.style.scale = '';
  el.style.transform = '';
}
