import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MoveLoopDirective } from 'movement';
import { VoltBadge } from '@voltui/components';

interface Capability {
  readonly api: string;
  readonly guide: string;
}

/** The stable surface at a glance: each chip links to the guide that teaches it. */
@Component({
  selector: 'app-capabilities',
  imports: [RouterLink, MoveLoopDirective, VoltBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="border-border mx-auto max-w-7xl border-y px-4 py-10 sm:px-6 lg:px-8"
      aria-labelledby="capabilities-title"
    >
      <p id="capabilities-title" class="text-text-subtle mb-5 text-center text-sm font-medium">
        Stable APIs, one attribute away
      </p>
      <!-- An endless marquee built with the library's own moveLoop: two identical runs, slid by
           exactly one run's width. The copy is hidden from assistive tech and the tab order. -->
      <div class="api-marquee">
        <div
          class="api-marquee-track"
          [moveLoop]="{ x: ['0%', '-50%'] }"
          [moveDuration]="40000"
          moveEasing="linear"
        >
          @for (run of runs; track run) {
            <ul
              class="m-0 flex shrink-0 list-none gap-2.5 p-0 pr-2.5"
              [attr.aria-hidden]="run === 1 ? 'true' : null"
            >
              @for (item of items; track item.api) {
                <li>
                  <a
                    [routerLink]="item.guide"
                    class="rounded-full focus-visible:outline-2"
                    [attr.tabindex]="run === 1 ? -1 : null"
                  >
                    <volt-badge
                      variant="outline"
                      class="hover:border-accent hover:text-accent font-mono whitespace-nowrap transition-colors"
                      >{{ item.api }}</volt-badge
                    >
                  </a>
                </li>
              }
            </ul>
          }
        </div>
      </div>
    </section>
  `,
})
export class Capabilities {
  protected readonly runs = [0, 1] as const;
  protected readonly items: readonly Capability[] = [
    { api: 'moveEnter', guide: '/docs/guides/enter' },
    { api: 'moveLeave', guide: '/docs/guides/enter' },
    { api: 'movePresence', guide: '/docs/guides/presence' },
    { api: 'movePresenceFor', guide: '/docs/guides/presence' },
    { api: 'moveAnimation', guide: '/docs/guides/variants' },
    { api: 'moveVariants', guide: '/docs/guides/variants' },
    { api: 'moveWhileHover', guide: '/docs/guides/interactions' },
    { api: 'moveWhileTap', guide: '/docs/guides/interactions' },
    { api: 'moveInView', guide: '/docs/guides/interactions' },
    { api: 'moveStagger', guide: '/docs/guides/stagger-and-scroll' },
    { api: 'moveScroll', guide: '/docs/guides/stagger-and-scroll' },
    { api: 'moveParallax', guide: '/docs/guides/stagger-and-scroll' },
    { api: 'moveValue', guide: '/docs/guides/signals' },
    { api: 'moveSpringValue', guide: '/docs/guides/signals' },
    { api: 'MoveAnimator', guide: '/docs/guides/signals' },
  ];
}
