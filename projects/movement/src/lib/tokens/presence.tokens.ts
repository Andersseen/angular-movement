import { InjectionToken } from '@angular/core';

export interface MovePresenceChild {
  playLeave(): Promise<void> | void;
}

export interface MovePresenceProvider {
  register(child: MovePresenceChild): void;
  unregister(child: MovePresenceChild): void;
}

export const MOVE_PRESENCE_PARENT = new InjectionToken<MovePresenceProvider>(
  'MOVE_PRESENCE_PARENT',
);
