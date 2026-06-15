import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MOVEMENT_DIRECTIVES } from 'movement';
import {
  VoltBadge,
  VoltButton,
  VoltCard,
  VoltCardContent,
  VoltCardDescription,
  VoltCardHeader,
  VoltCardTitle,
  VoltInput,
  VoltSeparator,
} from '@voltui/components';
import { LmnArrowRightIcon } from 'lumen-icons/arrow-right';
import { LmnCheckIcon } from 'lumen-icons/check';
import { LmnClockIcon } from 'lumen-icons/clock';
import { LmnDatabaseIcon } from 'lumen-icons/database';
import { LmnGlobeIcon } from 'lumen-icons/globe';
import { LmnShieldIcon } from 'lumen-icons/shield';
import { LmnSparklesIcon } from 'lumen-icons/sparkles';
import { LmnUsersIcon } from 'lumen-icons/users';
import { LmnZapIcon } from 'lumen-icons/zap';

interface FeatureCard {
  title: string;
  description: string;
  metric: string;
  icon: 'sparkles' | 'zap' | 'shield';
}

interface StepCard {
  title: string;
  description: string;
  label: string;
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
  selector: 'app-templates',
  imports: [
    ...MOVEMENT_DIRECTIVES,
    VoltBadge,
    VoltButton,
    VoltCard,
    VoltCardContent,
    VoltCardDescription,
    VoltCardHeader,
    VoltCardTitle,
    VoltInput,
    VoltSeparator,
    LmnArrowRightIcon,
    LmnCheckIcon,
    LmnClockIcon,
    LmnDatabaseIcon,
    LmnGlobeIcon,
    LmnShieldIcon,
    LmnSparklesIcon,
    LmnUsersIcon,
    LmnZapIcon,
  ],
  template: `
    <main class="bg-bg text-text overflow-hidden pt-20">
      <section
        class="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.95fr] lg:px-8 lg:py-24"
      >
        <div class="flex flex-col justify-center">
          <div moveStagger [moveStaggerStep]="90" class="space-y-8">
            <volt-badge moveEnter="fade-up" variant="secondary" class="w-fit">
              <span class="inline-flex items-center gap-2">
                <lmn-sparkles tone="primary" [size]="14" [animate]="true" ariaLabel="Spark" />
                Landing template
              </span>
            </volt-badge>

            <div moveEnter="fade-up" class="max-w-3xl space-y-6">
              <h1
                class="font-display text-5xl leading-[1.02] font-bold tracking-tight text-balance md:text-7xl"
              >
                Launch polished Angular pages with motion built in.
              </h1>
              <p class="text-text-muted max-w-2xl text-lg leading-8 md:text-xl">
                A complete landing pattern using Angular Movement, VoltUI components, and Lumen
                icons. Fast to compose, calm to maintain, and lively where it matters.
              </p>
            </div>

            <div moveEnter="fade-up" class="flex flex-col gap-3 sm:flex-row">
              <volt-button size="lg" (click)="goTo('/docs/get-started')">
                Start from docs
                <lmn-arrow-right slot="trailing" [size]="16" ariaLabel="Open docs" />
              </volt-button>
              <volt-button variant="outline" size="lg" (click)="goTo('/demos')">
                Browse demos
              </volt-button>
            </div>

            <div moveEnter="fade-up" class="grid max-w-xl grid-cols-3 gap-4 pt-2 text-sm">
              <div>
                <strong class="text-text block text-2xl">4</strong>
                <span class="text-text-muted">sections</span>
              </div>
              <div>
                <strong class="text-text block text-2xl">3</strong>
                <span class="text-text-muted">libraries</span>
              </div>
              <div>
                <strong class="text-text block text-2xl">0</strong>
                <span class="text-text-muted">animation setup</span>
              </div>
            </div>
          </div>
        </div>

        <div moveEnter="fade-left" [moveDelay]="160" class="relative lg:min-h-[620px]">
          <div
            class="border-border bg-surface/70 relative rounded-[2rem] border shadow-2xl shadow-black/30 backdrop-blur lg:absolute lg:inset-0"
          >
            <div class="border-border flex items-center justify-between border-b px-5 py-4">
              <div class="flex items-center gap-3">
                <span class="h-3 w-3 rounded-full bg-rose-400"></span>
                <span class="h-3 w-3 rounded-full bg-amber-300"></span>
                <span class="h-3 w-3 rounded-full bg-emerald-400"></span>
              </div>
              <volt-badge variant="outline">Live preview</volt-badge>
            </div>

            <div class="grid gap-4 p-5" moveStagger [moveStaggerStep]="120">
              <volt-card moveEnter="fade-up">
                <volt-card-header>
                  <volt-card-title>Campaign health</volt-card-title>
                  <volt-card-description>Realtime launch system</volt-card-description>
                </volt-card-header>
                <volt-card-content>
                  <div class="grid grid-cols-3 gap-3">
                    @for (item of previewStats; track item.label) {
                      <div class="border-border bg-bg/50 rounded-lg border p-3">
                        <span class="text-text-subtle text-xs">{{ item.label }}</span>
                        <strong class="text-text mt-1 block text-xl">{{ item.value }}</strong>
                      </div>
                    }
                  </div>
                </volt-card-content>
              </volt-card>

              <div class="grid gap-4 sm:grid-cols-2">
                <volt-card moveEnter="fade-up" [moveWhileHover]="{ y: [0, -6], scale: [1, 1.02] }">
                  <volt-card-header>
                    <span class="mb-2 inline-flex">
                      <lmn-zap
                        tone="primary"
                        background="soft"
                        backgroundTone="primary"
                        [padding]="8"
                        [radius]="10"
                        [animate]="true"
                        ariaLabel="Fast"
                      />
                    </span>
                    <volt-card-title>Micro-interactions</volt-card-title>
                    <volt-card-description
                      >Hover, tap, focus, and target states.</volt-card-description
                    >
                  </volt-card-header>
                </volt-card>

                <volt-card moveEnter="fade-up" [moveWhileHover]="{ y: [0, -6], scale: [1, 1.02] }">
                  <volt-card-header>
                    <span class="mb-2 inline-flex">
                      <lmn-database
                        tone="success"
                        background="soft"
                        backgroundTone="success"
                        [padding]="8"
                        [radius]="10"
                        ariaLabel="Data"
                      />
                    </span>
                    <volt-card-title>Data-ready sections</volt-card-title>
                    <volt-card-description
                      >Cards and metrics that animate in cleanly.</volt-card-description
                    >
                  </volt-card-header>
                </volt-card>
              </div>

              <volt-card moveEnter="fade-up">
                <volt-card-content class="pt-6">
                  <div class="space-y-4">
                    @for (bar of progressBars; track bar.label) {
                      <div>
                        <div class="mb-2 flex items-center justify-between text-sm">
                          <span class="text-text-muted">{{ bar.label }}</span>
                          <span class="text-text-subtle font-mono">{{ bar.value }}%</span>
                        </div>
                        <div class="bg-bg h-2 overflow-hidden rounded-full">
                          <div
                            class="h-full rounded-full"
                            [class.bg-accent]="bar.color === 'accent'"
                            [class.bg-emerald-400]="bar.color === 'success'"
                            [class.bg-amber-300]="bar.color === 'warning'"
                            [style.width.%]="bar.value"
                            moveEnter="slide-right"
                            [moveDuration]="700"
                          ></div>
                        </div>
                      </div>
                    }
                  </div>
                </volt-card-content>
              </volt-card>
            </div>
          </div>
        </div>
      </section>

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

      <section class="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div class="grid gap-10 lg:grid-cols-[0.75fr_1fr]">
          <div moveInView="fade-up" class="space-y-5">
            <volt-badge variant="secondary">Section 03</volt-badge>
            <h2 class="text-3xl font-bold tracking-tight md:text-5xl">
              From component to campaign.
            </h2>
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

      <section class="border-border bg-surface/40 border-t">
        <div
          class="mx-auto grid max-w-7xl gap-8 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_0.85fr] lg:px-8"
        >
          <div moveInView="fade-up" class="space-y-6">
            <volt-badge variant="secondary">Section 04</volt-badge>
            <h2 class="max-w-2xl text-3xl font-bold tracking-tight md:text-5xl">
              Keep the template, swap the story.
            </h2>
            <p class="text-text-muted max-w-2xl text-lg leading-8">
              Replace the copy, keep the motion system, and your next product page already has a
              polished rhythm.
            </p>
            <div class="grid max-w-xl gap-3 sm:grid-cols-3">
              @for (item of trustItems; track item) {
                <div class="text-text-muted flex items-center gap-2 text-sm">
                  <lmn-check tone="success" [size]="16" ariaLabel="Included" />
                  {{ item }}
                </div>
              }
            </div>
          </div>

          <volt-card moveInView="zoom-in">
            <volt-card-header>
              <div class="mb-2 flex items-center gap-2">
                <lmn-users tone="primary" [size]="20" ariaLabel="Team" />
                <volt-card-title>Get the starter</volt-card-title>
              </div>
              <volt-card-description
                >Drop this pattern into a page and iterate from there.</volt-card-description
              >
            </volt-card-header>
            <volt-card-content>
              <div class="space-y-4">
                <volt-input placeholder="you@company.com" autocomplete="email" />
                <volt-button class="block w-full" (click)="goTo('/docs/get-started')">
                  Open implementation notes
                  <lmn-arrow-right slot="trailing" [size]="16" ariaLabel="Open" />
                </volt-button>
                <volt-separator />
                <div class="text-text-muted grid grid-cols-3 gap-3 text-center text-xs">
                  <span class="flex flex-col items-center gap-1">
                    <lmn-globe tone="info" [size]="20" ariaLabel="Global" />
                    SSR
                  </span>
                  <span class="flex flex-col items-center gap-1">
                    <lmn-clock tone="warning" [size]="20" ariaLabel="Time" />
                    Fast
                  </span>
                  <span class="flex flex-col items-center gap-1">
                    <lmn-shield tone="success" [size]="20" ariaLabel="Safe" />
                    Stable
                  </span>
                </div>
              </div>
            </volt-card-content>
          </volt-card>
        </div>
      </section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TemplatesPage {
  readonly #router = inject(Router);

  protected readonly features = FEATURES;
  protected readonly steps = STEPS;
  protected readonly previewStats = [
    { label: 'Visitors', value: '48k' },
    { label: 'Activation', value: '32%' },
    { label: 'Motion', value: '12ms' },
  ];
  protected readonly progressBars = [
    { label: 'Hero readiness', value: 92, color: 'accent' },
    { label: 'Interaction polish', value: 78, color: 'success' },
    { label: 'Content clarity', value: 86, color: 'warning' },
  ];
  protected readonly trustItems = ['Standalone', 'Tree-shakable', 'Composable'];

  protected goTo(path: string): void {
    void this.#router.navigateByUrl(path);
  }
}
