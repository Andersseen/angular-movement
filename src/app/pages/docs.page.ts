import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-docs-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div
      class="mx-auto min-h-[calc(100vh-theme('spacing.64'))] max-w-7xl px-4 py-24 sm:px-6 lg:px-8"
    >
      <div class="flex flex-col gap-12 lg:flex-row">
        <!-- Sidebar Navigation -->
        <aside
          class="hidden-scrollbar w-full shrink-0 overflow-y-auto lg:sticky lg:top-24 lg:max-h-[calc(100vh-theme('spacing.32'))] lg:w-64 lg:self-start"
        >
          <nav class="space-y-8">
            <!-- Group 1 -->
            <div>
              <h4
                class="font-display text-text mb-3 px-3 text-sm font-bold tracking-wider uppercase"
              >
                Getting Started
              </h4>
              <ul class="space-y-1">
                <li>
                  <a
                    routerLink="introduction"
                    routerLinkActive="bg-accent/10 text-accent font-medium"
                    class="text-text-muted hover:text-text hover:bg-surface-raised block rounded-lg px-3 py-2 text-sm transition-colors"
                  >
                    Introduction
                  </a>
                </li>
                <li>
                  <a
                    routerLink="get-started"
                    routerLinkActive="bg-accent/10 text-accent font-medium"
                    class="text-text-muted hover:text-text hover:bg-surface-raised block rounded-lg px-3 py-2 text-sm transition-colors"
                  >
                    Get Started
                  </a>
                </li>
              </ul>
            </div>

            <!-- Group 2 Placeholder -->
            <div>
              <h4
                class="font-display text-text mb-3 px-3 text-sm font-bold tracking-wider uppercase"
              >
                Motion API
              </h4>
              <ul class="space-y-1">
                <li>
                  <a
                    routerLink="api"
                    routerLinkActive="bg-accent/10 text-accent font-medium"
                    class="text-text-muted hover:text-text hover:bg-surface-raised block rounded-lg px-3 py-2 text-sm transition-colors"
                  >
                    API Guide
                  </a>
                </li>
                <li>
                  <a
                    routerLink="/demos/animate"
                    routerLinkActive="bg-accent/10 text-accent font-medium"
                    class="text-text-muted hover:text-text hover:bg-surface-raised block rounded-lg px-3 py-2 text-sm transition-colors"
                  >
                    Basic Motion
                  </a>
                </li>
                <li>
                  <a
                    routerLink="/demos/variants"
                    routerLinkActive="bg-accent/10 text-accent font-medium"
                    class="text-text-muted hover:text-text hover:bg-surface-raised block rounded-lg px-3 py-2 text-sm transition-colors"
                  >
                    Variants
                  </a>
                </li>
              </ul>
            </div>

            <!-- Group 3 -->
            <div>
              <h4
                class="font-display text-text mb-3 px-3 text-sm font-bold tracking-wider uppercase"
              >
                Advanced
              </h4>
              <ul class="space-y-1">
                <li>
                  <a
                    routerLink="/demos/icons"
                    routerLinkActive="bg-accent/10 text-accent font-medium"
                    class="text-text-muted hover:text-text hover:bg-surface-raised block rounded-lg px-3 py-2 text-sm transition-colors"
                  >
                    SVG Icons
                  </a>
                </li>
                <li>
                  <a
                    routerLink="/demos/drag"
                    routerLinkActive="bg-accent/10 text-accent font-medium"
                    class="text-text-muted hover:text-text hover:bg-surface-raised block rounded-lg px-3 py-2 text-sm transition-colors"
                  >
                    Drag
                  </a>
                </li>
                <li>
                  <a
                    routerLink="/demos/scroll"
                    routerLinkActive="bg-accent/10 text-accent font-medium"
                    class="text-text-muted hover:text-text hover:bg-surface-raised block rounded-lg px-3 py-2 text-sm transition-colors"
                  >
                    Scroll
                  </a>
                </li>
              </ul>
            </div>
          </nav>
        </aside>

        <!-- Main Content Area -->
        <main class="prose prose-invert max-w-none min-w-0 flex-1">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .hidden-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .hidden-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `,
})
export default class DocsLayout {}
