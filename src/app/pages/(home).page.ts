import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Hero } from './home/sections/hero/hero';
import { Features } from './home/sections/features/features';
import { LiveCode } from './home/sections/live-code/live-code';
import { UseCases } from './home/sections/use-cases/use-cases';
import { ChooseTool } from './home/sections/choose-tool/choose-tool';
import { Paths } from './home/sections/paths/paths';
import { Install } from './home/sections/install/install';

@Component({
  selector: 'app-home',
  imports: [Hero, Features, LiveCode, UseCases, ChooseTool, Paths, Install],
  template: `
    <app-hero />
    <app-features />
    <app-live-code />
    <app-use-cases />
    <app-choose-tool />
    <app-paths />
    <app-install />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Home {}
