import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { MOVEMENT_CONFIG, MOVEMENT_DEFAULTS, MovementConfig } from '../tokens/movement.tokens';

/**
 * Stable API — covered by semantic-versioning guarantees.
 *
 * @stability stable
 */
export type MovementConfigInput = Partial<MovementConfig>;

/**
 * Stable API — covered by semantic-versioning guarantees.
 *
 * @stability stable
 */
export function provideMovement(config: MovementConfigInput = {}): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: MOVEMENT_CONFIG,
      useValue: {
        ...MOVEMENT_DEFAULTS,
        ...config,
      } satisfies MovementConfig,
    },
  ]);
}
