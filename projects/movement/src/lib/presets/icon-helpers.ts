import { MoveKeyframes } from './presets.types';

/**
 * Returns keyframes for a path-drawing animation.
 * Ideal for SVG `<path>`, `<circle>`, `<line>`, etc.
 *
 * @example
 * ```html
 * <path [moveTarget]="animate()" [moveFrames]="movePathDraw({ opacity: [0, 1] })" moveDuration="700" />
 * ```
 */
export function movePathDraw(overrides?: Partial<MoveKeyframes>): MoveKeyframes {
  return {
    pathLength: [0, 1],
    opacity: [0, 1],
    ...overrides,
  };
}

/**
 * Returns keyframes for a subtle pulse animation on an icon.
 */
export function moveIconPulse(overrides?: Partial<MoveKeyframes>): MoveKeyframes {
  return {
    scale: [1, 1.08, 1],
    opacity: [1, 0.85, 1],
    ...overrides,
  };
}

/**
 * Returns keyframes for a subtle bounce animation on an icon.
 */
export function moveIconBounce(overrides?: Partial<MoveKeyframes>): MoveKeyframes {
  return {
    y: [0, -3, 0],
    ...overrides,
  };
}

/**
 * Returns keyframes for a subtle shake animation on an icon.
 */
export function moveIconShake(overrides?: Partial<MoveKeyframes>): MoveKeyframes {
  return {
    rotate: [0, -8, 8, -8, 8, 0],
    ...overrides,
  };
}

/**
 * Returns keyframes for a subtle rotate animation on an icon.
 */
export function moveIconRotate(overrides?: Partial<MoveKeyframes>): MoveKeyframes {
  return {
    rotate: [0, 15, 0],
    ...overrides,
  };
}
