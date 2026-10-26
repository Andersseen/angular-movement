import type { RouteMeta } from '@analogjs/router';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TemplateHero } from './templates/sections/hero/hero';
import { TemplateFeatureGrid } from './templates/sections/feature-grid/feature-grid';
import { TemplateSteps } from './templates/sections/steps/steps';
import { TemplateCta } from './templates/sections/cta/cta';

export const routeMeta: RouteMeta = {
  title: 'Angular landing page template with motion · Angular Movement',
  meta: [
    {
      name: 'description',
      content:
        'A complete Angular landing page built with Angular Movement, VoltUI components and Lumen icons: hero, feature grid, steps and call to action, animated.',
    },
  ],
};

@Component({
  selector: 'app-templates',
  imports: [TemplateHero, TemplateFeatureGrid, TemplateSteps, TemplateCta],
  template: `
    <div class="bg-bg text-text overflow-hidden pt-20">
      <app-template-hero />
      <app-template-feature-grid />
      <app-template-steps />
      <app-template-cta />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TemplatesPage {}
