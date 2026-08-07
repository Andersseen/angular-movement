import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideMovement } from 'angular-movement';
import { App } from './app';

bootstrapApplication(App, {
  providers: [provideZonelessChangeDetection(), provideMovement({ duration: 300 })],
}).catch((error) => console.error(error));
