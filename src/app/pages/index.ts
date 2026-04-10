import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MOVEMENT_DIRECTIVES } from 'movement';
import { Navbar } from '../layout/navbar/navbar';
import { Footer } from '../layout/footer/footer';
import { Hero } from './home/sections/hero/hero';
import { Features } from './home/sections/features/features';
import { CodePreview } from './home/sections/code-preview/code-preview';
import { HowItWorks } from './home/sections/how-it-works/how-it-works';
import { PresetsShowcase } from './home/sections/presets-showcase/presets-showcase';
import { Install } from './home/sections/install/install';

@Component({
  selector: 'app-home',
  imports: [
    RouterLink,
    MOVEMENT_DIRECTIVES,
    Navbar,
    Footer,
    Hero,
    Features,
    CodePreview,
    HowItWorks,
    PresetsShowcase,
    Install,
  ],
  template: `
    <div class="flex min-h-screen flex-col">
      <app-navbar />

      <main class="flex-1">
        <app-hero />
        <app-features />
        <app-code-preview />
        <app-how-it-works />
        <app-presets-showcase />
        <app-install />
      </main>

      <app-footer />
    </div>
  `,
})
export default class Home {}
