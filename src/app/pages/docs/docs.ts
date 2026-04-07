import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-docs',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div
      class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 min-h-[calc(100vh-theme('spacing.64'))]"
    >
      <div class="flex flex-col lg:flex-row gap-12">
        <!-- Sidebar Navigation -->
        <aside
          class="w-full lg:w-64 shrink-0 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-theme('spacing.32'))] overflow-y-auto hidden-scrollbar"
        >
          <nav class="space-y-8">
            <!-- Group 1 -->
            <div>
              <h4
                class="font-display font-bold text-sm text-text mb-3 px-3 uppercase tracking-wider"
              >
                Getting Started
              </h4>
              <ul class="space-y-1">
                <li>
                  <a
                    routerLink="/docs/introduction"
                    routerLinkActive="bg-accent/10 text-accent font-medium"
                    class="block px-3 py-2 text-sm text-text-muted hover:text-text hover:bg-surface-raised rounded-lg transition-colors"
                  >
                    Introduction
                  </a>
                </li>
                <li>
                  <a
                    routerLink="/docs/get-started"
                    routerLinkActive="bg-accent/10 text-accent font-medium"
                    class="block px-3 py-2 text-sm text-text-muted hover:text-text hover:bg-surface-raised rounded-lg transition-colors"
                  >
                    Get Started
                  </a>
                </li>
              </ul>
            </div>

            <!-- Group 2 Placeholder -->
            <div>
              <h4
                class="font-display font-bold text-sm text-text mb-3 px-3 uppercase tracking-wider"
              >
                Directives
              </h4>
              <ul class="space-y-1 opacity-50 pointer-events-none">
                <li>
                  <a href="#" class="block px-3 py-2 text-sm text-text-muted rounded-lg"
                    >moveEnter</a
                  >
                </li>
                <li>
                  <a href="#" class="block px-3 py-2 text-sm text-text-muted rounded-lg"
                    >moveLeave</a
                  >
                </li>
                <li>
                  <a href="#" class="block px-3 py-2 text-sm text-text-muted rounded-lg"
                    >moveAnimate (shorthand)</a
                  >
                </li>
              </ul>
            </div>

            <!-- Group 3 Placeholder -->
            <div>
              <h4
                class="font-display font-bold text-sm text-text mb-3 px-3 uppercase tracking-wider"
              >
                Presets
              </h4>
              <ul class="space-y-1 opacity-50 pointer-events-none">
                <li>
                  <a href="#" class="block px-3 py-2 text-sm text-text-muted rounded-lg"
                    >Available Presets</a
                  >
                </li>
                <li>
                  <a href="#" class="block px-3 py-2 text-sm text-text-muted rounded-lg"
                    >Custom Keyframes</a
                  >
                </li>
              </ul>
            </div>
          </nav>
        </aside>

        <!-- Main Content Area -->
        <main class="flex-1 min-w-0 prose prose-invert max-w-none">
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
export default class Docs {}
