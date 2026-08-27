import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MOVEMENT_DIRECTIVES } from 'movement';
import {
  VoltBadge,
  VoltButton,
  VoltCard,
  VoltCardContent,
  VoltCardDescription,
  VoltCardHeader,
  VoltCardTitle,
  VoltInput,
  VoltSeparator,
} from '@voltui/components';
import { LmnArrowRightIcon } from 'lumen-icons/arrow-right';
import { LmnCheckIcon } from 'lumen-icons/check';
import { LmnClockIcon } from 'lumen-icons/clock';
import { LmnGlobeIcon } from 'lumen-icons/globe';
import { LmnShieldIcon } from 'lumen-icons/shield';
import { LmnUsersIcon } from 'lumen-icons/users';

const TRUST_ITEMS = ['Standalone', 'Tree-shakable', 'Composable'];

@Component({
  selector: 'app-template-cta',
  imports: [
    ...MOVEMENT_DIRECTIVES,
    VoltBadge,
    VoltButton,
    VoltCard,
    VoltCardHeader,
    VoltCardTitle,
    VoltCardDescription,
    VoltCardContent,
    VoltInput,
    VoltSeparator,
    LmnArrowRightIcon,
    LmnCheckIcon,
    LmnClockIcon,
    LmnGlobeIcon,
    LmnShieldIcon,
    LmnUsersIcon,
  ],
  template: `
    <section class="border-border bg-surface/40 border-t">
      <div
        class="mx-auto grid max-w-7xl gap-8 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_0.85fr] lg:px-8"
      >
        <div moveInView="fade-up" class="space-y-6">
          <volt-badge variant="secondary">Section 04</volt-badge>
          <h2 class="max-w-2xl text-3xl font-bold tracking-tight md:text-5xl">
            Keep the template, swap the story.
          </h2>
          <p class="text-text-muted max-w-2xl text-lg leading-8">
            Replace the copy, keep the motion system, and your next product page already has a
            polished rhythm.
          </p>
          <div class="grid max-w-xl gap-3 sm:grid-cols-3">
            @for (item of trustItems; track item) {
              <div class="text-text-muted flex items-center gap-2 text-sm">
                <lmn-check tone="success" [size]="16" ariaLabel="Included" />
                {{ item }}
              </div>
            }
          </div>
        </div>

        <volt-card moveInView="zoom-in">
          <volt-card-header>
            <div class="mb-2 flex items-center gap-2">
              <lmn-users tone="primary" [size]="20" ariaLabel="Team" />
              <volt-card-title>Get the starter</volt-card-title>
            </div>
            <volt-card-description
              >Drop this pattern into a page and iterate from there.</volt-card-description
            >
          </volt-card-header>
          <volt-card-content>
            <div class="space-y-4">
              <volt-input placeholder="you@company.com" autocomplete="email" />
              <volt-button class="block w-full" (click)="goTo('/docs/get-started')">
                Open implementation notes
                <lmn-arrow-right slot="trailing" [size]="16" ariaLabel="Open" />
              </volt-button>
              <volt-separator />
              <div class="text-text-muted grid grid-cols-3 gap-3 text-center text-xs">
                <span class="flex flex-col items-center gap-1">
                  <lmn-globe tone="info" [size]="20" ariaLabel="Global" />
                  SSR
                </span>
                <span class="flex flex-col items-center gap-1">
                  <lmn-clock tone="warning" [size]="20" ariaLabel="Time" />
                  Fast
                </span>
                <span class="flex flex-col items-center gap-1">
                  <lmn-shield tone="success" [size]="20" ariaLabel="Safe" />
                  Stable
                </span>
              </div>
            </div>
          </volt-card-content>
        </volt-card>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateCta {
  readonly #router = inject(Router);

  protected readonly trustItems = TRUST_ITEMS;

  protected goTo(path: string): void {
    void this.#router.navigateByUrl(path);
  }
}
