import '@angular/platform-server/init';
import { render } from '@analogjs/router/server';
import { config } from './app/app.config.server';
import { App } from './app/app';

export default render(App, config);
