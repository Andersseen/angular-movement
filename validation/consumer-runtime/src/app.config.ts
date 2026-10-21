import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideZonelessChangeDetection, type ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideMovement } from 'angular-movement';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter([]),
    provideClientHydration(withEventReplay()),
    provideMovement({ duration: '200ms' }),
  ],
};
