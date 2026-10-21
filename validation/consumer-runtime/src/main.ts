import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app.config';
import { App } from './app';

bootstrapApplication(App, appConfig).catch((error) => console.error(error));
