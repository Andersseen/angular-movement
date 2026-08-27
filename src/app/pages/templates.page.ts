import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TemplateHero } from './templates/sections/hero/hero';
import { TemplateFeatureGrid } from './templates/sections/feature-grid/feature-grid';
import { TemplateSteps } from './templates/sections/steps/steps';
import { TemplateCta } from './templates/sections/cta/cta';

@Component({
  selector: 'app-templates',
  imports: [TemplateHero, TemplateFeatureGrid, TemplateSteps, TemplateCta],
  template: `
    <main class="bg-bg text-text overflow-hidden pt-20">
      <app-template-hero />
      <app-template-feature-grid />
      <app-template-steps />
      <app-template-cta />
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TemplatesPage {}
