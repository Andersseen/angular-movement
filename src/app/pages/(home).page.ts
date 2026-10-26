import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MoveScrollDirective } from 'movement';
import { Hero } from './home/sections/hero/hero';
import { StateDemo } from './home/sections/state-demo/state-demo';
import { HomeTemplates } from './home/sections/templates/templates';
import { Capabilities } from './home/sections/capabilities/capabilities';
import { Features } from './home/sections/features/features';
import { LiveCode } from './home/sections/live-code/live-code';
import { Explore } from './home/sections/explore/explore';
import { UseCases } from './home/sections/use-cases/use-cases';
import { ChooseTool } from './home/sections/choose-tool/choose-tool';
import { Paths } from './home/sections/paths/paths';
import { Faq } from './home/sections/faq/faq';
import { Install } from './home/sections/install/install';

@Component({
  selector: 'app-home',
  imports: [
    MoveScrollDirective,
    Hero,
    StateDemo,
    HomeTemplates,
    Capabilities,
    Features,
    LiveCode,
    Explore,
    UseCases,
    ChooseTool,
    Paths,
    Faq,
    Install,
  ],
  template: `
    <!-- Reading progress, driven by the library's own moveScroll (a stable API). -->
    <div
      aria-hidden="true"
      class="bg-accent fixed top-0 left-0 z-[60] h-0.5 w-full origin-left"
      [moveScroll]="{ scaleX: [0, 1] }"
    ></div>
    <app-hero />
    <app-state-demo />
    <app-capabilities />
    <app-features />
    <app-live-code />
    <app-explore />
    <app-use-cases />
    <app-choose-tool />
    <app-home-templates />
    <app-paths />
    <app-faq />
    <app-install />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Home {}
