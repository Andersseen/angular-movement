import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideMovement } from 'movement';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideMovement({
      duration: 320,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      delay: 0,
      disabled: false,
    }),
  ],
};
