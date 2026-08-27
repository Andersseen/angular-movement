import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'movement-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly #document = inject(DOCUMENT);
  readonly #isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly theme = signal<Theme>(this.#readInitialTheme());

  toggle(): void {
    this.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  set(theme: Theme): void {
    this.theme.set(theme);

    if (!this.#isBrowser) return;

    this.#document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Storage can throw in private-browsing/blocked-cookie modes — theme just won't persist.
    }
  }

  #readInitialTheme(): Theme {
    if (!this.#isBrowser) return 'dark';

    // The blocking inline script in index.html already resolved and applied the theme
    // before Angular bootstraps, specifically to avoid a flash of the wrong theme — read
    // its result back rather than recomputing it (and disagreeing with what's on screen).
    const applied = this.#document.documentElement.getAttribute('data-theme');
    return applied === 'light' ? 'light' : 'dark';
  }
}
