import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MOVEMENT_DIRECTIVES } from 'movement';
import { VoltBadge, VoltButton } from '@voltui/components';
import { LmnArrowRightIcon } from 'lumen-icons/arrow-right';
import { LmnSparklesIcon } from 'lumen-icons/sparkles';
import { TemplateLivePreview } from './live-preview';

@Component({
  selector: 'app-template-hero',
  imports: [
    ...MOVEMENT_DIRECTIVES,
    VoltBadge,
    VoltButton,
    LmnSparklesIcon,
    LmnArrowRightIcon,
    TemplateLivePreview,
  ],
  template: `
    <section
      class="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.95fr] lg:px-8 lg:py-24"
    >
      <div class="flex flex-col justify-center">
        <div moveStagger [moveStaggerStep]="90" class="space-y-8">
          <volt-badge moveEnter="fade-up" variant="secondary" class="w-fit">
            <span class="inline-flex items-center gap-2">
              <lmn-sparkles tone="primary" [size]="14" [animate]="true" ariaLabel="Spark" />
              Landing template
            </span>
          </volt-badge>

          <div moveEnter="fade-up" class="max-w-3xl space-y-6">
            <h1
              class="font-display text-5xl leading-[1.02] font-bold tracking-tight text-balance md:text-7xl"
            >
              Launch polished Angular pages with motion built in.
            </h1>
            <p class="text-text-muted max-w-2xl text-lg leading-8 md:text-xl">
              A complete landing pattern using Angular Movement, VoltUI components, and Lumen icons.
              Fast to compose, calm to maintain, and lively where it matters.
            </p>
          </div>

          <div moveEnter="fade-up" class="flex flex-col gap-3 sm:flex-row">
            <volt-button size="lg" (click)="goTo('/docs/get-started')">
              Start from docs
              <lmn-arrow-right slot="trailing" [size]="16" ariaLabel="Open docs" />
            </volt-button>
            <volt-button variant="outline" size="lg" (click)="goTo('/demos')">
              Browse demos
            </volt-button>
          </div>

          <div moveEnter="fade-up" class="grid max-w-xl grid-cols-3 gap-4 pt-2 text-sm">
            <div>
              <strong class="text-text block text-2xl">4</strong>
              <span class="text-text-muted">sections</span>
            </div>
            <div>
              <strong class="text-text block text-2xl">3</strong>
              <span class="text-text-muted">libraries</span>
            </div>
            <div>
              <strong class="text-text block text-2xl">0</strong>
              <span class="text-text-muted">animation setup</span>
            </div>
          </div>
        </div>
      </div>

      <div moveEnter="fade-left" [moveDelay]="160" class="relative lg:min-h-[620px]">
        <app-template-live-preview />
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateHero {
  readonly #router = inject(Router);

  protected goTo(path: string): void {
    void this.#router.navigateByUrl(path);
  }
}
