import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MoveInViewDirective } from 'movement';
import {
  VoltBadge,
  VoltCard,
  VoltCardContent,
  VoltNativeButton,
  VoltTabs,
  VoltToggleGroup,
  VoltToggleGroupItem,
  VoltTabsContent,
  VoltTabsList,
  VoltTabsTrigger,
} from '@voltui/components';
import { CodeBlock } from '../../../../shared/components/code-block/code-block';
import { InteractionExample } from '../../../../motion-examples/interaction/interaction-example';
import { PresenceExample } from '../../../../motion-examples/presence/presence-example';
import { StaggerExample } from '../../../../motion-examples/stagger/stagger-example';
import { VariantsExample } from '../../../../motion-examples/variants/variants-example';

interface Tab {
  readonly id: string;
  readonly label: string;
  readonly blurb: string;
  readonly code: string;
  readonly guide: string;
  readonly demo: string;
}

const TABS: readonly Tab[] = [
  {
    id: 'interaction',
    label: 'Hover & press',
    blurb:
      'Feedback while something is true: the pointer is over it, it is pressed. Touch gets press feedback, not a sticky hover.',
    code: `<button moveWhileHover="lift" moveWhileTap="press">Save</button>`,
    guide: '/docs/guides/interactions',
    demo: '/demos/hover',
  },
  {
    id: 'variants',
    label: 'State',
    blurb:
      'Bind a state name and the element animates to it whenever a signal changes. Nothing is recreated.',
    code: `<div
  [moveVariants]="{
    idle: { scale: 1 },
    active: { scale: 1.1, rotate: 4 }
  }"
  [moveVariant]="selected() ? 'active' : 'idle'"
></div>`,
    guide: '/docs/guides/variants',
    demo: '/demos/variants',
  },
  {
    id: 'presence',
    label: 'Presence',
    blurb:
      'A leave animation needs an element that still exists. Presence keeps the view mounted until it has finished leaving.',
    code: `<ng-container *movePresence="open()">
  <aside moveEnter="fade-up" moveLeave="fade-down">Panel</aside>
</ng-container>`,
    guide: '/docs/guides/presence',
    demo: '/demos/presence',
  },
  {
    id: 'stagger',
    label: 'Stagger',
    blurb: 'Sibling delays come from DOM order, so it works with @for without index bookkeeping.',
    code: `<ul moveStagger moveStaggerStep="80ms">
  @for (item of items(); track item.id) {
    <li moveEnter="fade-up">{{ item.label }}</li>
  }
</ul>`,
    guide: '/docs/guides/stagger-and-scroll',
    demo: '/demos/stagger',
  },
];

/** "See it move": four real, stable directives in Volt UI tabs, each with its code, guide and demo. */
@Component({
  selector: 'app-explore',
  imports: [
    RouterLink,
    MoveInViewDirective,
    CodeBlock,
    InteractionExample,
    VariantsExample,
    PresenceExample,
    StaggerExample,
    VoltBadge,
    VoltCard,
    VoltCardContent,
    VoltNativeButton,
    VoltTabs,
    VoltTabsList,
    VoltTabsTrigger,
    VoltTabsContent,
    VoltToggleGroup,
    VoltToggleGroupItem,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div class="mb-10 max-w-2xl" moveInView="fade-up">
        <h2 class="font-display text-text mb-4 text-3xl font-bold tracking-tight md:text-4xl">
          See it move
        </h2>
        <p class="text-text-muted text-lg leading-relaxed">
          Four things CSS alone makes awkward, running live. Each one is a stable API.
        </p>
      </div>

      <volt-card moveInView="fade-up" class="landing-card">
        <volt-card-content class="p-4 sm:p-6">
          <volt-tabs [value]="active()" (valueChange)="setActive($event)">
            <volt-tabs-list class="mb-6 flex-wrap">
              @for (tab of tabs; track tab.id) {
                <volt-tabs-trigger [value]="tab.id">{{ tab.label }}</volt-tabs-trigger>
              }
            </volt-tabs-list>

            @for (tab of tabs; track tab.id) {
              <volt-tabs-content [value]="tab.id">
                <div class="grid grid-cols-1 items-center gap-6 lg:grid-cols-2">
                  <div class="bg-bg border-border min-h-48 rounded-xl border p-6">
                    <!-- Only the active tab's example is created: Volt keeps inactive panels in the
                         DOM, hidden, and an animation cannot commit its styles on a hidden element. -->
                    @if (active() === tab.id) {
                      @switch (tab.id) {
                        @case ('interaction') {
                          <app-interaction-example />
                        }
                        @case ('variants') {
                          <volt-toggle-group
                            type="single"
                            class="mb-4"
                            aria-label="Active variant"
                            [value]="[variant()]"
                            (valueChange)="setVariant($event)"
                          >
                            @for (v of variants; track v) {
                              <volt-toggle-group-item [value]="v">{{ v }}</volt-toggle-group-item>
                            }
                          </volt-toggle-group>
                          <app-variants-example [variant]="variant()" />
                        }
                        @case ('presence') {
                          <app-presence-example />
                        }
                        @default {
                          <app-stagger-example />
                        }
                      }
                    }
                  </div>
                  <div class="min-w-0 space-y-4">
                    <div class="flex items-center gap-2">
                      <volt-badge variant="success">Stable</volt-badge>
                    </div>
                    <p class="text-text-muted m-0 leading-relaxed">{{ tab.blurb }}</p>
                    <app-code-block [title]="tab.id + '.html'" language="html" [code]="tab.code" />
                    <div class="flex flex-wrap gap-2">
                      <a voltButton size="sm" variant="outline" [routerLink]="tab.guide"
                        >Read the guide</a
                      >
                      <a voltButton size="sm" variant="ghost" [routerLink]="tab.demo"
                        >Open playground</a
                      >
                    </div>
                  </div>
                </div>
              </volt-tabs-content>
            }
          </volt-tabs>
        </volt-card-content>
      </volt-card>
    </section>
  `,
})
export class Explore {
  protected readonly tabs = TABS;
  protected readonly active = signal(TABS[0].id);

  protected setActive(id: string | undefined): void {
    if (id) this.active.set(id);
  }
  protected readonly variants = ['idle', 'active', 'error'] as const;
  protected readonly variant = signal<(typeof this.variants)[number]>('active');

  protected setVariant(value: string[]): void {
    const next = this.variants.find((v) => v === value[0]);
    if (next) this.variant.set(next);
  }
}
