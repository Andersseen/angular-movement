import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MoveInViewDirective, MoveStaggerDirective } from 'movement';
import {
  VoltCard,
  VoltCardContent,
  VoltCardDescription,
  VoltCardHeader,
  VoltCardTitle,
  VoltNativeButton,
} from '@voltui/components';
import { LmnArrowRightIcon } from 'lumen-icons/arrow-right';
import { LmnBookOpenIcon } from 'lumen-icons/book-open';
import { LmnCodeBracketIcon } from 'lumen-icons/code-bracket';
import { LmnPlayIcon } from 'lumen-icons/play';

/** Three ways in, one product: guides (Markdown), playgrounds (Angular), reference (generated). */
@Component({
  selector: 'app-paths',
  imports: [
    RouterLink,
    MoveInViewDirective,
    MoveStaggerDirective,
    VoltCard,
    VoltCardHeader,
    VoltCardTitle,
    VoltCardDescription,
    VoltCardContent,
    VoltNativeButton,
    LmnArrowRightIcon,
    LmnBookOpenIcon,
    LmnCodeBracketIcon,
    LmnPlayIcon,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div class="mb-12 max-w-2xl" moveInView="fade-up">
        <h2 class="font-display text-text mb-4 text-3xl font-bold tracking-tight md:text-4xl">
          Learn it the way you prefer
        </h2>
        <p class="text-text-muted text-lg leading-relaxed">
          The same examples are reachable three ways, and each links to the others.
        </p>
      </div>
      <ul
        moveStagger
        moveStaggerStep="100ms"
        class="m-0 grid list-none grid-cols-1 gap-6 p-0 md:grid-cols-3"
      >
        @for (path of paths; track path.href) {
          <li moveInView="fade-up">
            <volt-card class="landing-card h-full">
              <volt-card-header>
                <span
                  class="bg-accent/10 text-accent mb-3 flex h-11 w-11 items-center justify-center rounded-xl"
                >
                  @switch (path.icon) {
                    @case ('book') {
                      <lmn-book-open [size]="24" ariaLabel="" />
                    }
                    @case ('play') {
                      <lmn-play [size]="24" ariaLabel="" />
                    }
                    @default {
                      <lmn-code-bracket [size]="24" ariaLabel="" />
                    }
                  }
                </span>
                <volt-card-title>{{ path.title }}</volt-card-title>
                <volt-card-description>{{ path.body }}</volt-card-description>
              </volt-card-header>
              <volt-card-content>
                <a voltButton variant="outline" size="sm" [routerLink]="path.href">
                  {{ path.cta }}
                  <lmn-arrow-right [size]="14" ariaLabel="" />
                </a>
              </volt-card-content>
            </volt-card>
          </li>
        }
      </ul>
    </section>
  `,
})
export class Paths {
  protected readonly paths = [
    {
      icon: 'book',
      title: 'Read the guides',
      body: 'Task-first documentation: install, animate on enter, react to state, keep things mounted while they leave. Searchable, with live playgrounds inline.',
      href: '/docs/get-started',
      cta: 'Get started',
    },
    {
      icon: 'play',
      title: 'Experiment in the demos',
      body: 'A full playground per directive: tune presets, timing and easing, replay the motion and copy valid Angular code.',
      href: '/demos',
      cta: 'Explore demos',
    },
    {
      icon: 'code',
      title: 'Check the contract',
      body: 'Every public directive, input, output and type, generated from the library source with its stability — stable, experimental or deprecated.',
      href: '/docs/reference',
      cta: 'Open the API reference',
    },
  ];
}
