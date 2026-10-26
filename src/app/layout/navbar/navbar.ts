import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs';
import { MoveEnterDirective } from 'movement';
import { VoltBadge, VoltNativeButton, VoltSeparator } from '@voltui/components';
import { LmnSunIcon } from 'lumen-icons/sun';
import { LmnMoonIcon } from 'lumen-icons/moon';
import { LmnBars3Icon } from 'lumen-icons/bars-3';
import { LmnXMarkIcon } from 'lumen-icons/x-mark';
import { MOVEMENT_VERSION_LABEL } from '../../shared/version';
import { SITE } from '../../shared/site';
import { ThemeService } from '../../shared/theme.service';

interface NavLink {
  readonly href: string;
  readonly label: string;
  /** Sections under `href` that another link owns, so only one link reads as current. */
  readonly excludes?: readonly string[];
}

const LINKS: readonly NavLink[] = [
  { href: '/docs', label: 'Docs', excludes: ['/docs/reference'] },
  { href: '/docs/reference', label: 'API' },
  { href: '/demos', label: 'Demos' },
];

const within = (path: string, section: string) =>
  path === section || path.startsWith(section + '/');

@Component({
  selector: 'app-navbar',
  imports: [
    RouterLink,
    LmnSunIcon,
    LmnMoonIcon,
    LmnBars3Icon,
    LmnXMarkIcon,
    MoveEnterDirective,
    VoltBadge,
    VoltNativeButton,
    VoltSeparator,
  ],
  template: `
    <nav
      aria-label="Main"
      class="fixed top-0 right-0 left-0 z-50 border-b border-transparent transition-all duration-300"
      [class.backdrop-blur-xl]="scrolled()"
      [class.bg-surface/70]="scrolled()"
      [class.!border-border]="scrolled()"
    >
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex h-16 items-center justify-between">
          <a
            routerLink="/"
            class="group flex items-center gap-2"
            aria-label="Angular Movement home"
          >
            <svg
              class="text-accent group-hover:text-accent-light h-8 w-8 transition-colors"
              viewBox="0 0 100 100"
              fill="none"
              aria-hidden="true"
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

          <div class="hidden items-center gap-2 md:flex">
            @for (link of links; track link.href) {
              <a
                voltButton
                variant="ghost"
                size="sm"
                [routerLink]="link.href"
                [class.text-accent]="isActive(link)"
                [attr.aria-current]="isActive(link) ? 'page' : null"
                >{{ link.label }}</a
              >
            }
            <volt-separator orientation="vertical" class="mx-2 h-6" />
            <volt-badge variant="outline" class="font-mono">{{ version }} source</volt-badge>
            <button
              voltButton
              variant="ghost"
              size="icon"
              type="button"
              [attr.aria-label]="themeLabel()"
              (click)="toggleTheme()"
            >
              @if (theme() === 'dark') {
                <lmn-sun [size]="20" ariaLabel="" />
              } @else {
                <lmn-moon [size]="20" ariaLabel="" />
              }
            </button>
            <a voltButton variant="ghost" size="icon" [href]="github" aria-label="GitHub">
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill-rule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clip-rule="evenodd"
                />
              </svg>
            </a>
          </div>

          <div class="flex items-center gap-1 md:hidden">
            <button
              voltButton
              variant="ghost"
              size="icon"
              type="button"
              [attr.aria-label]="themeLabel()"
              (click)="toggleTheme()"
            >
              @if (theme() === 'dark') {
                <lmn-sun [size]="20" ariaLabel="" />
              } @else {
                <lmn-moon [size]="20" ariaLabel="" />
              }
            </button>
            <button
              voltButton
              variant="ghost"
              size="icon"
              type="button"
              aria-controls="mobile-menu"
              [attr.aria-expanded]="mobileMenuOpen()"
              [attr.aria-label]="mobileMenuOpen() ? 'Close menu' : 'Open menu'"
              (click)="toggleMobileMenu()"
            >
              @if (mobileMenuOpen()) {
                <lmn-x-mark [size]="24" ariaLabel="" />
              } @else {
                <lmn-bars-3 [size]="24" ariaLabel="" />
              }
            </button>
          </div>
        </div>
      </div>

      @if (mobileMenuOpen()) {
        <div
          id="mobile-menu"
          class="bg-surface border-border border-b md:hidden"
          moveEnter="slide-down"
          moveDuration="200ms"
          moveEasing="ease-out"
        >
          <div class="flex flex-col gap-1 px-2 pt-2 pb-3 sm:px-3">
            @for (link of links; track link.href) {
              <a
                voltButton
                variant="ghost"
                class="justify-start"
                [routerLink]="link.href"
                [class.text-accent]="isActive(link)"
                [attr.aria-current]="isActive(link) ? 'page' : null"
                (click)="closeMobileMenu()"
                >{{ link.label }}</a
              >
            }
            <volt-separator class="my-1" />
            <div class="flex items-center justify-between px-2">
              <volt-badge variant="outline" class="font-mono">{{ version }} source</volt-badge>
              <a voltButton variant="ghost" size="sm" [href]="github" (click)="closeMobileMenu()"
                >GitHub</a
              >
            </div>
          </div>
        </div>
      }
    </nav>
  `,
  host: {
    '(window:scroll)': 'onWindowScroll()',
    '(keydown.escape)': 'closeMobileMenu()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar {
  readonly #themeService = inject(ThemeService);
  readonly #router = inject(Router);
  readonly #path = toSignal(
    this.#router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.#currentPath()),
    ),
    { initialValue: this.#currentPath() },
  );

  protected readonly links = LINKS;
  protected readonly github = SITE.github;
  protected readonly version = MOVEMENT_VERSION_LABEL;
  protected readonly scrolled = signal(false);
  protected readonly mobileMenuOpen = signal(false);
  protected readonly theme = this.#themeService.theme;

  protected isActive(link: NavLink): boolean {
    const path = this.#path();
    return within(path, link.href) && !link.excludes?.some((section) => within(path, section));
  }

  #currentPath(): string {
    return this.#router.url.split(/[?#]/)[0];
  }

  protected themeLabel(): string {
    return this.theme() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
  }

  protected onWindowScroll() {
    this.scrolled.set(window.scrollY > 20);
  }

  protected toggleMobileMenu() {
    this.mobileMenuOpen.update((v) => !v);
  }

  protected closeMobileMenu() {
    this.mobileMenuOpen.set(false);
  }

  protected toggleTheme() {
    this.#themeService.toggle();
  }
}
