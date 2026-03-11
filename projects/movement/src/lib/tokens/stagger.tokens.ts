import { InjectionToken } from '@angular/core';

export interface MoveStaggerProvider {
  register(el: HTMLElement): void;
  unregister(el: HTMLElement): void;
  getDelay(el: HTMLElement): number;
}

export const MOVE_STAGGER_PARENT = new InjectionToken<MoveStaggerProvider>('MOVE_STAGGER_PARENT');
