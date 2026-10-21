import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Hero } from './home/sections/hero/hero';
import { Features } from './home/sections/features/features';
import { ChooseTool } from './home/sections/choose-tool/choose-tool';
import { UseCases } from './home/sections/use-cases/use-cases';
import { PresetsShowcase } from './home/sections/presets-showcase/presets-showcase';
import { Install } from './home/sections/install/install';

@Component({
  selector: 'app-home',
  imports: [Hero, Features, ChooseTool, UseCases, PresetsShowcase, Install],
  template: `
    <app-hero />
    <app-features />
    <app-choose-tool />
    <app-use-cases />
    <app-presets-showcase />
    <app-install />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Home {}
