import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MOVEMENT_DIRECTIVES } from 'movement';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, ...MOVEMENT_DIRECTIVES],
  template: `
    <nav
      class="fixed top-0 right-0 left-0 z-50 border-b border-transparent transition-all duration-300"
      [class.backdrop-blur-xl]="scrolled()"
      [class.bg-surface/70]="scrolled()"
      [class.!border-border]="scrolled()"
    >
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex h-16 items-center justify-between">
          <!-- Logo -->
          <a routerLink="/" class="group flex items-center gap-2">
            <svg
              class="text-accent group-hover:text-accent-light h-8 w-8 transition-colors"
              viewBox="0 0 100 100"
              fill="none"
            >
              <path
                d="M 25 20 L 50 50 L 25 80 L 45 80 L 70 50 L 45 20 Z"
                fill="currentColor"
                fill-opacity="0.8"
              />
              <path d="M 45 20 L 70 50 L 45 80 L 65 80 L 90 50 L 65 20 Z" fill="currentColor" />
            </svg>
            <span class="font-display text-lg font-bold tracking-tight">Angular Movement</span>
          </a>

          <!-- Desktop Nav -->
          <div class="hidden items-center gap-8 md:flex">
            <div class="text-text-muted flex items-center gap-6 text-sm font-medium">
              <a
                routerLink="/"
                routerLinkActive="text-accent"
                [routerLinkActiveOptions]="{ exact: true }"
                class="hover:text-text transition-colors"
                >Home</a
              >
              <a
                routerLink="/demos"
                routerLinkActive="text-accent"
                [routerLinkActiveOptions]="{ exact: false }"
                class="hover:text-text transition-colors"
                >Demos</a
              >
              <a
                routerLink="/docs"
                routerLinkActive="text-accent"
                class="hover:text-text transition-colors"
                >Docs</a
              >
            </div>

            <div class="border-border flex items-center gap-4 border-l pl-6">
              <span
                class="text-text-subtle bg-surface-raised border-border rounded-md border px-2 py-1 font-mono text-xs"
                >v0.1.0</span
              >
              <a
                href="https://github.com/angular-movement/core"
                target="_blank"
                rel="noopener noreferrer"
                class="text-text-muted hover:text-text transition-colors"
                aria-label="GitHub"
              >
                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fill-rule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clip-rule="evenodd"
                  />
                </svg>
              </a>
            </div>
          </div>

          <!-- Mobile menu button -->
          <div class="flex items-center md:hidden">
            <button
              (click)="toggleMobileMenu()"
              [attr.aria-expanded]="mobileMenuOpen()"
              aria-controls="mobile-menu"
              class="text-text-muted hover:text-text p-2"
            >
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                @if (mobileMenuOpen()) {
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                } @else {
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                }
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile Menu -->
      @if (mobileMenuOpen()) {
        <div
          id="mobile-menu"
          class="bg-surface border-border border-b md:hidden"
          moveEnter="slide-down"
          [moveDuration]="200"
          moveEasing="ease-out"
        >
          <div class="flex flex-col space-y-1 px-2 pt-2 pb-3 sm:px-3">
            <a
              routerLink="/"
              routerLinkActive="text-accent bg-surface-raised"
              [routerLinkActiveOptions]="{ exact: true }"
              class="text-text-muted hover:text-text hover:bg-surface-raised block rounded-md px-3 py-2 text-base font-medium transition-colors"
              (click)="closeMobileMenu()"
              >Home</a
            >
            <a
              routerLink="/demos"
              routerLinkActive="text-accent bg-surface-raised"
              [routerLinkActiveOptions]="{ exact: false }"
              class="text-text-muted hover:text-text hover:bg-surface-raised block rounded-md px-3 py-2 text-base font-medium transition-colors"
              (click)="closeMobileMenu()"
              >Demos</a
            >
            <a
              routerLink="/docs"
              routerLinkActive="text-accent bg-surface-raised"
              class="text-text-muted hover:text-text hover:bg-surface-raised block rounded-md px-3 py-2 text-base font-medium transition-colors"
              (click)="closeMobileMenu()"
              >Docs</a
            >

            <div class="border-border mt-2 flex items-center justify-between border-t px-3 pt-2">
              <span
                class="text-text-subtle bg-surface-raised border-border rounded-md border px-2 py-1 font-mono text-xs"
                >v0.1.0</span
              >
              <a
                href="https://github.com/angular-movement/core"
                target="_blank"
                rel="noopener noreferrer"
                class="text-text-muted hover:text-text py-2"
                (click)="closeMobileMenu()"
              >
                <div class="flex items-center gap-2">
                  <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      fill-rule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <span>GitHub</span>
                </div>
              </a>
            </div>
          </div>
        </div>
      }
    </nav>
  `,
  host: {
    '(window:scroll)': 'onWindowScroll()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar {
  protected readonly scrolled = signal(false);
  protected readonly mobileMenuOpen = signal(false);

  protected onWindowScroll() {
    this.scrolled.set(window.scrollY > 20);
  }

  protected toggleMobileMenu() {
    this.mobileMenuOpen.update((v) => !v);
  }

  protected closeMobileMenu() {
    this.mobileMenuOpen.set(false);
  }
}
