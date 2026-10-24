import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MoveInViewDirective, MoveStaggerDirective } from 'movement';
import {
  VoltBadge,
  VoltCard,
  VoltCardContent,
  VoltCardDescription,
  VoltCardHeader,
  VoltCardTitle,
  VoltNativeButton,
} from '@voltui/components';
import { LmnCheckIcon } from 'lumen-icons/check';

interface Tool {
  name: string;
  when: string;
  points: string[];
  highlight: boolean;
}

@Component({
  selector: 'app-choose-tool',
  imports: [
    RouterLink,
    MoveInViewDirective,
    MoveStaggerDirective,
    VoltBadge,
    VoltCard,
    VoltCardHeader,
    VoltCardTitle,
    VoltCardDescription,
    VoltCardContent,
    VoltNativeButton,
    LmnCheckIcon,
  ],
  template: `
    <section class="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div class="mb-12 max-w-2xl" moveInView="fade-up">
        <h2 class="font-display text-text mb-4 text-3xl font-bold tracking-tight md:text-4xl">
          Use the simplest tool that works
        </h2>
        <p class="text-text-muted text-lg leading-relaxed">
          Movement is not a replacement for CSS or for Angular's own
          <code>animate.enter</code> / <code>animate.leave</code>. It adds value when motion has to
          react to state and be coordinated.
        </p>
      </div>

      <div
        moveStagger
        moveStaggerStep="90ms"
        class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4"
      >
        @for (tool of tools; track tool.name) {
          <volt-card
            moveInView="fade-up"
            class="landing-card h-full"
            [class.border-accent]="tool.highlight"
            [style.box-shadow]="
              tool.highlight ? '0 20px 60px -28px var(--color-accent-glow)' : null
            "
          >
            <volt-card-header>
              <div class="flex items-start justify-between gap-2">
                <volt-card-title>{{ tool.name }}</volt-card-title>
                @if (tool.highlight) {
                  <volt-badge class="shrink-0 whitespace-nowrap">State-driven</volt-badge>
                }
              </div>
              <volt-card-description>{{ tool.when }}</volt-card-description>
            </volt-card-header>
            <volt-card-content>
              <ul class="text-text-muted m-0 flex list-none flex-col gap-2 p-0 text-sm">
                @for (point of tool.points; track point) {
                  <li class="flex gap-2">
                    <lmn-check class="text-accent mt-0.5 shrink-0" [size]="16" ariaLabel="" />
                    <span>{{ point }}</span>
                  </li>
                }
              </ul>
            </volt-card-content>
          </volt-card>
        }
      </div>

      <p class="mt-8" moveInView="fade-up">
        <a voltButton variant="link" class="text-accent" routerLink="/docs/choose-a-tool"
          >Full comparison and decision guide →</a
        >
      </p>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChooseTool {
  protected readonly tools: Tool[] = [
    {
      name: 'CSS',
      when: 'Hover colours, simple transitions, loaders',
      points: [
        'Zero JavaScript, runs before hydration',
        'Best for state that already lives in a class or pseudo-class',
        'No coordination with element lifetime',
      ],
      highlight: false,
    },
    {
      name: 'animate.enter / animate.leave',
      when: 'Enter and leave of elements, Angular 20.2+',
      points: [
        'Built into Angular, nothing to install',
        'Applies CSS classes while a node enters or leaves',
        'Ideal when each element has its own self-contained enter/leave',
      ],
      highlight: false,
    },
    {
      name: 'Angular Movement',
      when: 'Motion driven by state and coordinated across elements',
      points: [
        'Reactive state-to-state transitions, variants and stagger',
        'Keyed-list presence, springs, scroll-linked and SVG motion',
        'Signals-based values, imperative MoveAnimator, SSR-safe',
      ],
      highlight: true,
    },
    {
      name: 'Raw WAAPI',
      when: 'One-off, fully custom effects',
      points: [
        'element.animate() directly, maximal control',
        'You own cancellation, reduced motion and cleanup',
        'Fine for a single isolated effect',
      ],
      highlight: false,
    },
  ];
}
