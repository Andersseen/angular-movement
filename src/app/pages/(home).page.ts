import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Hero } from './home/sections/hero/hero';
import { Features } from './home/sections/features/features';
import { HowItWorks } from './home/sections/how-it-works/how-it-works';
import { PresetsShowcase } from './home/sections/presets-showcase/presets-showcase';
import { CodePreview } from './home/sections/code-preview/code-preview';
import { Install } from './home/sections/install/install';

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
