import { ApplicationConfig, Component } from '@angular/core';
// #region doqs:get-started-imports
import { MoveEnterDirective, provideMovement } from 'angular-movement';
// #endregion doqs:get-started-imports

// #region doqs:get-started-config
export const appConfig: ApplicationConfig = {
  providers: [
    provideMovement({
      duration: '300ms', // or 300: numbers are milliseconds
      easing: 'ease-out',
    }),
    // prefers-reduced-motion is honoured automatically, no config needed.
  ],
};
// #endregion doqs:get-started-config

// #region doqs:get-started-component
@Component({
  selector: 'app-welcome',
  imports: [MoveEnterDirective],
  template: `<h1 moveEnter="fade-up">Welcome back</h1>`,
})
export class Welcome {}
// #endregion doqs:get-started-component
