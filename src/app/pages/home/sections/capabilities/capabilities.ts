import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MoveInViewDirective, MoveStaggerDirective } from 'movement';
import { VoltBadge } from '@voltui/components';

interface Capability {
  readonly api: string;
  readonly guide: string;
}

/** The stable surface at a glance: each chip links to the guide that teaches it. */
@Component({
  selector: 'app-capabilities',
  imports: [RouterLink, MoveInViewDirective, MoveStaggerDirective, VoltBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="border-border mx-auto max-w-7xl border-y px-4 py-10 sm:px-6 lg:px-8"
      aria-labelledby="capabilities-title"
    >
      <p id="capabilities-title" class="text-text-subtle mb-5 text-center text-sm font-medium">
        Stable APIs, one attribute away
      </p>
      <ul
        moveStagger
        moveStaggerStep="40ms"
        class="m-0 flex list-none flex-wrap justify-center gap-2 p-0"
      >
        @for (item of items; track item.api) {
          <li moveInView="fade-up">
            <a [routerLink]="item.guide" class="rounded-full focus-visible:outline-2">
              <volt-badge
                variant="outline"
                class="hover:border-accent hover:text-accent font-mono transition-colors"
                >{{ item.api }}</volt-badge
              >
            </a>
          </li>
        }
      </ul>
    </section>
  `,
})
export class Capabilities {
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
