import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Hero } from './sections/hero/hero';
import { Features } from './sections/features/features';
import { HowItWorks } from './sections/how-it-works/how-it-works';
import { PresetsShowcase } from './sections/presets-showcase/presets-showcase';
import { CodePreview } from './sections/code-preview/code-preview';
import { Install } from './sections/install/install';

@Component({
  selector: 'app-home',
  imports: [Hero, Features, HowItWorks, PresetsShowcase, CodePreview, Install],
  template: `
    <app-hero />
    <app-features />
    <app-how-it-works />
    <app-presets-showcase />
    <app-code-preview />
    <app-install />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Home {}
