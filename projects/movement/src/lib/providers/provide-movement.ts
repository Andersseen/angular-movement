import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { MOVEMENT_CONFIG, MOVEMENT_DEFAULTS, MovementConfig } from '../tokens/movement.tokens';

export type MovementConfigInput = Partial<MovementConfig>;

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
