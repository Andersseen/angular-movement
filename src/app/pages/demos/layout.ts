import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { Navbar } from '../../layout/navbar/navbar';
import { Footer } from '../../layout/footer/footer';

interface DemoGroup {
  title: string;
  items: DemoItem[];
}

interface DemoItem {
  path: string;
  label: string;
  description?: string;
}

const DEMO_GROUPS: DemoGroup[] = [
  {
    title: 'Basic Animations',
    items: [
      { path: 'enter', label: 'moveEnter', description: 'Animate on element enter' },
      { path: 'leave', label: 'moveLeave', description: 'Animate on element leave' },
      { path: 'animate', label: 'moveAnimate', description: 'Shorthand for enter/leave' },
    ],
  },
  {
    title: 'Interaction',
    items: [
      { path: 'hover', label: 'moveWhileHover', description: 'Hover animations' },
      { path: 'tap', label: 'moveWhileTap', description: 'Click/tap animations' },
      { path: 'in-view', label: 'moveInView', description: 'Scroll-triggered animations' },
      { path: 'drag', label: 'moveDrag', description: 'Draggable elements' },
    ],
  },
  {
    title: 'Advanced',
    items: [
      { path: 'text', label: 'moveText', description: 'Split text animations' },
      { path: 'stagger', label: 'moveStagger', description: 'Staggered children' },
      { path: 'layout', label: 'moveLayout', description: 'Layout animations' },
      { path: 'variants', label: 'moveVariants', description: 'Variant-based animations' },
    ],
  },
  {
    title: 'Scroll Effects',
    items: [
      { path: 'scroll', label: 'moveScroll', description: 'Scroll-linked animations' },
      { path: 'parallax', label: 'Parallax', description: 'Multi-layer depth effect' },
    ],
  },
  {
    title: 'Special',
    items: [{ path: 'presence', label: 'movePresence', description: 'AnimatePresence pattern' }],
  },
];

@Component({
  selector: 'app-demos-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Navbar, Footer],
  template: `
    <div class="flex min-h-screen flex-col">
      <app-navbar />

      <main class="flex-1">
        <div
          class="mx-auto min-h-[calc(100vh-theme('spacing.64'))] max-w-7xl px-4 py-24 sm:px-6 lg:px-8"
        >
          <div class="flex flex-col gap-12 lg:flex-row">
            <!-- Sidebar Navigation -->
            <aside
              class="hidden-scrollbar w-full shrink-0 overflow-y-auto lg:sticky lg:top-24 lg:max-h-[calc(100vh-theme('spacing.32'))] lg:w-64 lg:self-start"
            >
              <nav class="space-y-8">
                @for (group of demoGroups; track group.title) {
                  <div>
                    <h4
                      class="font-display text-text mb-3 px-3 text-sm font-bold tracking-wider uppercase"
                    >
                      {{ group.title }}
                    </h4>
                    <ul class="space-y-1">
                      @for (item of group.items; track item.path) {
                        <li>
                          <a
                            [routerLink]="['/demos', item.path]"
                            routerLinkActive="bg-accent/10 text-accent font-medium"
                            class="text-text-muted hover:text-text hover:bg-surface-raise block rounded-lg px-3 py-2 text-sm transition-colors"
                          >
                            {{ item.label }}
                          </a>
                        </li>
                      }
                    </ul>
                  </div>
                }
              </nav>
            </aside>

            <!-- Main Content Area -->
            <div class="min-w-0 flex-1">
              <router-outlet />
            </div>
          </div>
        </div>
      </main>

      <app-footer />
    </div>
  `,
  styles: [
    `
      .hidden-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .hidden-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `,
  ],
})
export default class DemosLayout {
  protected readonly demoGroups = DEMO_GROUPS;
}
