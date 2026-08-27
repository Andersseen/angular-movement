import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MOVEMENT_DIRECTIVES } from 'movement';
import { VoltBadge } from '@voltui/components';

interface StepCard {
  title: string;
  description: string;
  label: string;
}

const STEPS: StepCard[] = [
  {
    title: 'Declare',
    description: 'Put motion where the UI lives: in the Angular template.',
    label: '[move]',
  },
  {
    title: 'Compose',
    description: 'Layer cards, icons, badges, and staggered children into sections.',
    label: 'VoltUI',
  },
  {
    title: 'Ship',
    description: 'Use the same primitives in marketing pages, dashboards, and docs.',
    label: 'WAAPI',
  },
];

@Component({
  selector: 'app-template-steps',
  imports: [...MOVEMENT_DIRECTIVES, VoltBadge],
  template: `
    <section class="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div class="grid gap-10 lg:grid-cols-[0.75fr_1fr]">
        <div moveInView="fade-up" class="space-y-5">
          <volt-badge variant="secondary">Section 03</volt-badge>
          <h2 class="text-3xl font-bold tracking-tight md:text-5xl">From component to campaign.</h2>
          <p class="text-text-muted text-lg leading-8">
            The page uses the same primitives you would use in a dashboard: cards, badges, input,
            buttons, icons, stagger, and in-view reveals.
          </p>
        </div>

        <div class="grid gap-4" moveStagger [moveStaggerStep]="100">
          @for (step of steps; track step.title; let index = $index) {
            <div
              moveInView="fade-left"
              class="border-border bg-surface grid gap-4 rounded-xl border p-5 sm:grid-cols-[auto_1fr_auto]"
            >
              <div
                class="bg-accent/15 text-accent flex h-11 w-11 items-center justify-center rounded-lg font-mono text-sm"
              >
                0{{ index + 1 }}
              </div>
              <div>
                <h3 class="text-lg font-semibold">{{ step.title }}</h3>
                <p class="text-text-muted mt-1 text-sm leading-6">{{ step.description }}</p>
              </div>
              <volt-badge variant="outline" class="h-fit self-start">{{ step.label }}</volt-badge>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateSteps {
  protected readonly steps = STEPS;
}
