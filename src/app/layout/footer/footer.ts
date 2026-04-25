import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
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
                <path d="M 45 20 L 70 50 L 45 80 L 65 80 L 90 50 L 65 20 Z" fill="currentColor" />
              </svg>
              <span class="font-display font-bold tracking-tight">Angular Movement</span>
            </a>
            <p class="text-text-muted text-sm">
              Animate Angular with a single attribute. The simplest way to add enter & leave
              animations to Angular apps.
            </p>
            <p class="text-text-subtle mt-2 text-xs">Released under the MIT License.</p>
          </div>

          <!-- Col 2: Links -->
          <div class="flex flex-col gap-3">
            <h4 class="font-display text-text font-semibold">Resources</h4>
            <a
              routerLink="/docs"
              class="text-text-muted hover:text-accent w-fit text-sm transition-colors"
              >Documentation</a
            >
            <a
              routerLink="/demos"
              class="text-text-muted hover:text-accent w-fit text-sm transition-colors"
              >Interactive Demos</a
            >
            <a
              href="https://github.com/angular-movement/core"
              target="_blank"
              rel="noopener noreferrer"
              class="text-text-muted hover:text-accent w-fit text-sm transition-colors"
              >GitHub Repository</a
            >
            <a
              href="https://www.npmjs.com/package/@angular-movement/core"
              target="_blank"
              rel="noopener noreferrer"
              class="text-text-muted hover:text-accent w-fit text-sm transition-colors"
              >npm Package</a
            >
          </div>

          <!-- Col 3: Tech -->
          <div class="flex flex-col gap-3">
            <h4 class="font-display text-text font-semibold">Tech Stack</h4>
            <div class="flex flex-col gap-2">
              <span class="text-text-muted flex items-center gap-2 text-sm">
                <svg class="h-4 w-4 text-[#DD0031]" viewBox="0 0 256 256" fill="currentColor">
                  <path
                    d="M128 0L9.4 42.4l19 146.4L128 256l99.6-67.2 19-146.4L128 0zm0 21.6l96.6 35.5-16.1 123.5L128 238V21.6zM128 21.6v216.4l-80.5-57.4L31.4 57.1 128 21.6zM128 49v166.4l58.4-41.6L128 49zM128 58.6L80.9 164h19.5l10.3-26.6h34.6l10.3 26.6h19.5L128 58.6zm0 24.3l12.4 31.8h-24.8L128 82.9zm0 0l-12.4 31.8h24.8L128 82.9z"
                  />
                </svg>
                Angular 21
              </span>
              <span class="text-text-muted text-sm">Zoneless Ready</span>
              <span class="text-text-muted text-sm">Signals Architecture</span>
              <span class="text-text-muted text-sm">No external dependencies</span>
            </div>
          </div>
        </div>

        <div
          class="border-border mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row"
        >
          <p class="text-text-subtle text-xs">&copy; 2025 Angular Movement · Open Source</p>
        </div>
      </div>
    </footer>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {}
