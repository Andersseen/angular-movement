import { ApplicationConfig, inject, mergeApplicationConfig } from '@angular/core';
import { BEFORE_APP_SERIALIZED, provideServerRendering } from '@angular/platform-server';
import { Router } from '@angular/router';
import { appConfig } from './app.config';
import { SeoService } from './shared/seo.service';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    // Doqs sets a page's title and description after its Markdown loads; derive the social tags,
    // canonical and JSON-LD from the final values, right before the HTML is written.
    {
      provide: BEFORE_APP_SERIALIZED,
      multi: true,
      useFactory: () => {
        const seo = inject(SeoService);
        const router = inject(Router);
        return () => seo.update(router.url);
      },
    },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
