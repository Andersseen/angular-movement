import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { MOVEMENT_CONFIG, MOVEMENT_DEFAULTS, MovementConfig } from '../tokens/movement.tokens';
import { MoveTime, normalizeTime } from '../move-time';

/**
 * What `provideMovement()` accepts: any subset of {@link MovementConfig}, with `duration` and
 * `delay` taking a {@link MoveTime} (`320`, `'320ms'`, `'0.32s'`). The injected
 * `MOVEMENT_CONFIG` is always normalized to numeric milliseconds.
 *
 * Stable API — covered by semantic-versioning guarantees.
 *
 * @stability stable
 */
export type MovementConfigInput = Partial<Omit<MovementConfig, 'duration' | 'delay'>> & {
  duration?: MoveTime;
  delay?: MoveTime;
};

/**
 * Sets library-wide animation defaults.
 *
 * ```ts
 * provideMovement({ duration: '320ms', easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
 * ```
 *
 * Reduced motion needs no configuration: the user's `prefers-reduced-motion: reduce` preference
 * is honoured automatically. `disabled` is an application-level kill switch, not a place to
 * forward `matchMedia('(prefers-reduced-motion: reduce)')` — see {@link MovementConfig.disabled}.
 * Nothing needs disabling for SSR either; animations are already no-ops on the server.
 *
 * Stable API — covered by semantic-versioning guarantees.
 *
 * @stability stable
 */
export function provideMovement(config: MovementConfigInput = {}): EnvironmentProviders {
  const { duration, delay, ...rest } = config;

  return makeEnvironmentProviders([
    {
      provide: MOVEMENT_CONFIG,
      useValue: {
        ...MOVEMENT_DEFAULTS,
        ...rest,
        duration: normalizeTime('provideMovement duration', duration) ?? MOVEMENT_DEFAULTS.duration,
        delay: normalizeTime('provideMovement delay', delay) ?? MOVEMENT_DEFAULTS.delay,
      } satisfies MovementConfig,
    },
  ]);
}
