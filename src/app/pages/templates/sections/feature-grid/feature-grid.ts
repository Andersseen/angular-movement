import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MOVEMENT_DIRECTIVES } from 'movement';
import {
  VoltBadge,
  VoltCard,
  VoltCardDescription,
  VoltCardHeader,
  VoltCardTitle,
} from '@voltui/components';
import { LmnShieldIcon } from 'lumen-icons/shield';
import { LmnSparklesIcon } from 'lumen-icons/sparkles';
import { LmnZapIcon } from 'lumen-icons/zap';

interface FeatureCard {
  title: string;
  description: string;
  metric: string;
  icon: 'sparkles' | 'zap' | 'shield';
}

const FEATURES: FeatureCard[] = [
  {
    title: 'Motion presets',
    description: 'Use expressive enter states, hover feedback, and SVG drawing without local glue.',
    metric: '18+ presets',
    icon: 'sparkles',
  },
  {
    title: 'UI primitives',
    description: 'Compose landing sections from VoltUI cards, buttons, badges, and form controls.',
    metric: 'Angular-first',
    icon: 'zap',
  },
  {
    title: 'Production rhythm',
    description: 'Reduced motion, SSR guards, and predictable WAAPI playback keep the page stable.',
    metric: 'SSR ready',
    icon: 'shield',
  },
];

@Component({
  selector: 'app-template-feature-grid',
  imports: [
    ...MOVEMENT_DIRECTIVES,
    VoltBadge,
    VoltCard,
    VoltCardHeader,
    VoltCardTitle,
    VoltCardDescription,
    LmnSparklesIcon,
    LmnZapIcon,
    LmnShieldIcon,
  ],
  template: `
    <section class="border-border bg-surface/40 border-y">
      <div class="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div class="mb-10 max-w-2xl" moveInView="fade-up">
          <volt-badge variant="outline">Section 02</volt-badge>
          <h2 class="mt-4 text-3xl font-bold tracking-tight md:text-5xl">
            Standard landing blocks, Angular-native motion.
          </h2>
        </div>

        <div class="grid gap-4 md:grid-cols-3" moveStagger [moveStaggerStep]="110">
          @for (feature of features; track feature.title) {
            <volt-card moveInView="fade-up" [moveWhileHover]="{ y: [0, -8] }">
              <volt-card-header>
                <div class="mb-3 flex items-center justify-between">
                  @switch (feature.icon) {
                    @case ('sparkles') {
                      <lmn-sparkles tone="primary" [size]="24" ariaLabel="Presets" />
                    }
                    @case ('zap') {
                      <lmn-zap tone="warning" [size]="24" ariaLabel="Speed" />
                    }
                    @case ('shield') {
                      <lmn-shield tone="success" [size]="24" ariaLabel="Stable" />
                    }
                  }
                  <span class="text-text-subtle font-mono text-xs">{{ feature.metric }}</span>
                </div>
                <volt-card-title>{{ feature.title }}</volt-card-title>
                <volt-card-description>{{ feature.description }}</volt-card-description>
              </volt-card-header>
            </volt-card>
          }
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateFeatureGrid {
  protected readonly features = FEATURES;
}
