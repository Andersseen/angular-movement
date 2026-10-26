import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MoveInViewDirective } from 'movement';
import { VoltBadge, VoltNativeButton } from '@voltui/components';
import { LmnArrowRightIcon } from 'lumen-icons/arrow-right';
import { TemplateLivePreview } from '../../../templates/sections/hero/live-preview';

interface TemplateEntry {
  readonly title: string;
  readonly body: string;
  readonly tags: readonly string[];
}

const LANDING: TemplateEntry = {
  title: 'Product landing',
  body: 'Hero, feature grid, steps and a call to action, composed with Angular Movement, Volt UI components and Lumen icons. Copy the sections you need.',
  tags: ['Angular Movement', 'Volt UI', 'Lumen icons'],
};

const INCLUDED: readonly string[] = [
  'Staggered entrances that respect reduced motion',
  'Hover and press feedback on every card',
  'Scroll-revealed sections, server-rendered first',
];

/** Templates live on the home page, not the navbar: one featured template with a live preview. */
@Component({
  selector: 'app-home-templates',
  imports: [
    RouterLink,
    MoveInViewDirective,
    VoltBadge,
    VoltNativeButton,
    LmnArrowRightIcon,
    TemplateLivePreview,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="templates" class="mx-auto max-w-7xl scroll-mt-20 px-4 py-24 sm:px-6 lg:px-8">
      <div class="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div class="max-w-2xl" moveInView="fade-up">
          <p class="home-kicker">TEMPLATES <span>/</span> READY TO SHIP</p>
          <h2 class="font-display text-text mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            Start from a template
          </h2>
          <p class="text-text-muted m-0 text-lg leading-relaxed">
            Complete pages with motion already wired in. Open one, read the source, and keep what
            fits your product.
          </p>
        </div>
        <a voltButton variant="outline" routerLink="/templates" moveInView="fade-up">
          Browse templates
          <lmn-arrow-right [size]="14" ariaLabel="" />
        </a>
      </div>

      <article
        class="template-feature landing-card grid overflow-hidden lg:grid-cols-[0.8fr_1.2fr]"
        moveInView="fade-up"
      >
        <div class="flex flex-col gap-6 p-6 sm:p-8 lg:p-10">
          <div class="flex flex-wrap gap-2">
            @for (tag of landing.tags; track tag) {
              <volt-badge variant="secondary">{{ tag }}</volt-badge>
            }
          </div>
          <div>
            <h3 class="font-display text-text mb-3 text-2xl font-bold tracking-tight">
              {{ landing.title }}
            </h3>
            <p class="text-text-muted m-0 leading-relaxed">{{ landing.body }}</p>
          </div>
          <ul class="text-text-muted m-0 list-none space-y-3 p-0 text-sm">
            @for (item of included; track item) {
              <li class="flex gap-3">
                <span class="bg-accent mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"></span>
                <span>{{ item }}</span>
              </li>
            }
          </ul>
          <div class="mt-auto flex flex-wrap gap-3">
            <a voltButton routerLink="/templates">
              Preview template
              <lmn-arrow-right [size]="14" ariaLabel="" />
            </a>
            <a voltButton variant="ghost" routerLink="/docs/get-started">Install the library</a>
          </div>
        </div>

        <div class="template-stage relative p-4 sm:p-6 lg:min-h-[640px]">
          <div class="lg:absolute lg:inset-6">
            @defer (on viewport) {
              <app-template-live-preview />
            } @placeholder {
              <div class="min-h-[480px]" aria-hidden="true"></div>
            }
          </div>
        </div>
      </article>
    </section>
  `,
})
export class HomeTemplates {
  protected readonly landing = LANDING;
  protected readonly included = INCLUDED;
}
