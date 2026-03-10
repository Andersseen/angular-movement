import { InjectionToken } from '@angular/core';

export interface MovementConfig {
  duration: number;
  easing: string;
  delay: number;
  disabled: boolean;
}

export const MOVEMENT_DEFAULTS: MovementConfig = {
  duration: 300,
  easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
  delay: 0,
  disabled: false,
};

export const MOVEMENT_CONFIG = new InjectionToken<MovementConfig>('MOVEMENT_CONFIG', {
  factory: () => ({ ...MOVEMENT_DEFAULTS }),
});
