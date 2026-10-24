import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MoveInViewDirective } from 'movement';
import {
  VoltAccordion,
  VoltAccordionContent,
  VoltAccordionItem,
  VoltAccordionTrigger,
  VoltNativeButton,
} from '@voltui/components';

interface Question {
  readonly id: string;
  readonly q: string;
  readonly a: string;
  readonly href: string;
  readonly cta: string;
}

/** Honest answers to the questions an Angular developer asks before adding a dependency. */
@Component({
  selector: 'app-faq',
  imports: [
    RouterLink,
    MoveInViewDirective,
    VoltAccordion,
    VoltAccordionItem,
    VoltAccordionTrigger,
    VoltAccordionContent,
    VoltNativeButton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
      <div class="mb-10" moveInView="fade-up">
        <h2 class="font-display text-text mb-4 text-3xl font-bold tracking-tight md:text-4xl">
          Questions worth asking first
        </h2>
        <p class="text-text-muted text-lg leading-relaxed">
          Short answers, with the page that has the long one.
        </p>
      </div>

      <volt-accordion type="single" [collapsible]="true" moveInView="fade-up">
        @for (item of questions; track item.id) {
          <volt-accordion-item [value]="item.id">
            <volt-accordion-trigger>{{ item.q }}</volt-accordion-trigger>
            <volt-accordion-content>
              <p class="text-text-muted mb-2">{{ item.a }}</p>
              <a voltButton variant="link" class="text-accent" size="sm" [routerLink]="item.href"
                >{{ item.cta }} →</a
              >
            </volt-accordion-content>
          </volt-accordion-item>
        }
      </volt-accordion>
    </section>
  `,
})
export class Faq {
  protected readonly questions: readonly Question[] = [
    {
      id: 'need',
      q: 'Do I need this, or is CSS enough?',
      a: 'If the motion is a function of a class or a pseudo-class, or one element has its own enter and leave, CSS and Angular’s animate.enter / animate.leave are the right tools. Movement earns its place when motion follows state and has to be coordinated: presence, variants, stagger, scroll.',
      href: '/docs/choose-a-tool',
      cta: 'Choose the right tool',
    },
    {
      id: 'ssr',
      q: 'Does it work with SSR and zoneless apps?',
      a: 'Yes. Every directive is a no-op on the server and starts after hydration, and nothing needs Zone.js. Because it runs after hydration, use CSS for an above-the-fold entrance that must paint immediately.',
      href: '/docs/accessibility',
      cta: 'SSR and hydration',
    },
    {
      id: 'motion',
      q: 'What about reduced motion?',
      a: 'The operating system setting is honoured automatically: directives jump to the end state. provideMovement({ disabled }) and moveDisabled add an app-level and a per-element switch.',
      href: '/docs/accessibility',
      cta: 'Reduced motion',
    },
    {
      id: 'stable',
      q: 'Which APIs are stable?',
      a: 'Enter, leave, presence, variants, interactions, stagger, scroll, motion values and MoveAnimator are stable. Layout, drag, smooth scroll and the target/trigger pair are experimental and marked as such everywhere.',
      href: '/docs/api',
      cta: 'API overview and stability',
    },
    {
      id: 'migrate',
      q: 'Can I migrate from @angular/animations?',
      a: 'Often the right answer is plain CSS. The migration guide classifies each trigger and shows reviewed recipes for the ones that benefit from Movement.',
      href: '/docs/migration',
      cta: 'Migration guide',
    },
  ];
}
