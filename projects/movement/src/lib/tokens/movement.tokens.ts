import { InjectionToken } from '@angular/core';

/**
 * The resolved, library-wide animation defaults — what `MOVEMENT_CONFIG` injects. Every timing
 * value here is already normalized to milliseconds; `provideMovement()` is where `"320ms"` /
 * `"0.32s"` are accepted.
 *
 * Stable API — covered by semantic-versioning guarantees.
 *
 * @stability stable
 */
export interface MovementConfig {
  /** Default duration, in milliseconds. */
  duration: number;
  /** Default CSS easing. */
  easing: string;
  /** Default delay, in milliseconds. */
  delay: number;
  /**
   * Application-level kill switch: `true` turns every animation into an instant jump to its end
   * state. **Not** the reduced-motion mechanism — the library already honours the user's
   * `prefers-reduced-motion: reduce` preference automatically, whatever this is set to. Use it
   * for app-owned reasons: a user-facing "disable animations" setting, visual regression tests.
   *
   * Precedence: OS reduced-motion preference (always wins) → this flag → per-element
   * `moveDisabled`.
   */
  disabled: boolean;
  iterations?: number;
}

/**
 * Stable API — covered by semantic-versioning guarantees.
 *
 * @stability stable
 */
export const MOVEMENT_DEFAULTS: MovementConfig = {
  duration: 300,
  easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
  delay: 0,
  disabled: false,
  iterations: 1,
};

/**
 * Stable API — covered by semantic-versioning guarantees.
 *
 * @stability stable
 */
export const MOVEMENT_CONFIG = new InjectionToken<MovementConfig>('MOVEMENT_CONFIG', {
  factory: () => ({ ...MOVEMENT_DEFAULTS }),
});
