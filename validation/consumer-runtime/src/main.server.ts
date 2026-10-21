import { bootstrapApplication, type BootstrapContext } from '@angular/platform-browser';
import { App } from './app';
import { serverConfig } from './app.config.server';

const bootstrap = (context: BootstrapContext) => bootstrapApplication(App, serverConfig, context);

export default bootstrap;
