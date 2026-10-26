import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { VoltNativeButton, VoltSeparator } from '@voltui/components';
import { SITE } from '../../shared/site';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, VoltNativeButton, VoltSeparator],
  template: `
    <footer class="border-border bg-surface mt-24 border-t">
      <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-12">
          <!-- Col 1: Brand -->
          <div class="flex flex-col gap-4">
            <a routerLink="/" class="flex items-center gap-2">
              <svg class="text-accent h-6 w-6" viewBox="0 0 100 100" fill="none">
                <path
                  d="M 25 20 L 50 50 L 25 80 L 45 80 L 70 50 L 45 20 Z"
                  fill="currentColor"
                  fill-opacity="0.8"
                />
                <defs>
                  <linearGradient
                    id="logo-lead-footer"
                    x1="45"
                    y1="20"
                    x2="90"
                    y2="80"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0" stop-color="currentColor" />
                    <stop offset="1" style="stop-color: var(--color-ember)" />
                  </linearGradient>
                </defs>
                <path
                  d="M 45 20 L 70 50 L 45 80 L 65 80 L 90 50 L 65 20 Z"
                  fill="url(#logo-lead-footer)"
                />
              </svg>
              <span class="font-display font-bold tracking-tight">Angular Movement</span>
            </a>
            <p class="text-text-muted text-sm">
              Motion for Angular that follows your state: declarative directives on the Web
              Animations API.
            </p>
            <p class="text-text-subtle mt-2 text-xs">Released under the MIT License.</p>
          </div>

          <!-- Col 2: Links -->
          <div class="flex flex-col gap-3">
            <h2 class="font-display text-text font-semibold">Resources</h2>
            <a
              routerLink="/docs"
              voltButton
              variant="link"
              size="sm"
              class="text-accent w-fit justify-start px-0"
              >Documentation</a
            >
            <a
              routerLink="/docs/reference"
              voltButton
              variant="link"
              size="sm"
              class="text-accent w-fit justify-start px-0"
              >API reference</a
            >
            <a
              routerLink="/demos"
              voltButton
              variant="link"
              size="sm"
              class="text-accent w-fit justify-start px-0"
              >Interactive Demos</a
            >
            <a
              routerLink="/templates"
              voltButton
              variant="link"
              size="sm"
              class="text-accent w-fit justify-start px-0"
              >Templates</a
            >
            <a
              [href]="github"
              target="_blank"
              rel="noopener noreferrer"
              voltButton
              variant="link"
              size="sm"
              class="text-accent w-fit justify-start px-0"
              >GitHub Repository</a
            >
            <a
              [href]="npm"
              target="_blank"
              rel="noopener noreferrer"
              voltButton
              variant="link"
              size="sm"
              class="text-accent w-fit justify-start px-0"
              >npm Package</a
            >
          </div>

          <!-- Col 3: Tech -->
          <div class="flex flex-col gap-3">
            <h2 class="font-display text-text font-semibold">Tech Stack</h2>
            <div class="flex flex-col gap-2">
              <span class="text-text-muted flex items-center gap-2 text-sm">
                <svg class="h-4 w-4 text-[#DD0031]" viewBox="0 0 256 256" fill="currentColor">
                  <path
                    d="M128 0L9.4 42.4l19 146.4L128 256l99.6-67.2 19-146.4L128 0zm0 21.6l96.6 35.5-16.1 123.5L128 238V21.6zM128 21.6v216.4l-80.5-57.4L31.4 57.1 128 21.6zM128 49v166.4l58.4-41.6L128 49zM128 58.6L80.9 164h19.5l10.3-26.6h34.6l10.3 26.6h19.5L128 58.6zm0 24.3l12.4 31.8h-24.8L128 82.9zm0 0l-12.4 31.8h24.8L128 82.9z"
                  />
                </svg>
                Angular 21 and 22
              </span>
              <span class="text-text-muted text-sm">Zoneless Ready</span>
              <span class="text-text-muted text-sm">Signals Architecture</span>
              <span class="text-text-muted text-sm">Server rendering safe</span>
            </div>
          </div>
        </div>

        <volt-separator class="mt-12" />
        <div class="mt-8 flex flex-col items-center justify-between gap-4 md:flex-row">
          <p class="text-text-subtle text-xs">&copy; {{ year }} Angular Movement · MIT License</p>
        </div>
      </div>
    </footer>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {
  protected readonly github = SITE.github;
  protected readonly npm = SITE.npm;
  protected readonly year = new Date().getFullYear();
}
