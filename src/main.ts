import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

function initUmami(): void {
  // Bracket access, NOT dot access: repos with `noUncheckedIndexedAccess`
  // (TS4111) reject `import.meta.env.PUBLIC_X` — the env object is an index
  // signature. This cost a full CI cycle on a strict Angular repo.
  const env = import.meta.env as Record<string, string | undefined>;
  const url = env['PUBLIC_UMAMI_URL'];
  const websiteId = env['PUBLIC_UMAMI_WEBSITE_ID'];
  if (!url || !websiteId || typeof document === 'undefined') return;
  const script = document.createElement('script');
  script.defer = true;
  script.src = url;
  script.dataset['websiteId'] = websiteId; // also index-signature access (TS4111)
  document.head.appendChild(script);
}

initUmami();

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
