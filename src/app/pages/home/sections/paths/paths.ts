import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Three ways in, one product: guides (Markdown), playgrounds (Angular), reference (generated). */
@Component({
  selector: 'app-paths',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="border-border mx-auto max-w-7xl border-t px-4 py-20 sm:px-6 lg:px-8">
      <div class="mb-12 max-w-2xl">
        <h2 class="font-display text-text mb-4 text-3xl font-bold tracking-tight md:text-4xl">
          Learn it the way you prefer
        </h2>
        <p class="text-text-muted text-lg leading-relaxed">
          The same examples are reachable three ways, and each links to the others.
        </p>
      </div>
      <ul class="m-0 grid list-none grid-cols-1 gap-6 p-0 md:grid-cols-3">
        @for (path of paths; track path.href) {
          <li class="bg-surface border-border flex flex-col rounded-2xl border p-7">
            <h3 class="font-display text-text mb-2 text-xl font-bold">{{ path.title }}</h3>
            <p class="text-text-muted mb-6 leading-relaxed">{{ path.body }}</p>
            <a
              [routerLink]="path.href"
              class="text-accent focus-visible:outline-accent mt-auto min-h-11 font-semibold underline underline-offset-4 focus-visible:outline-2"
              >{{ path.cta }} <span aria-hidden="true">→</span></a
            >
          </li>
        }
      </ul>
    </section>
  `,
})
export class Paths {
  protected readonly paths = [
    {
      title: 'Read the guides',
      body: 'Task-first documentation: install, animate on enter, react to state, keep things mounted while they leave. Searchable, with live playgrounds inline.',
      href: '/docs/get-started',
      cta: 'Get started',
    },
    {
      title: 'Experiment in the demos',
      body: 'A full playground per directive: tune presets, timing and easing, replay the motion and copy valid Angular code.',
      href: '/demos',
      cta: 'Explore demos',
    },
    {
      title: 'Check the contract',
      body: 'Every public directive, input, output and type, generated from the library source with its stability — stable, experimental or deprecated.',
      href: '/docs/reference',
      cta: 'Open the API reference',
    },
  ];
}
