import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MOVEMENT_DIRECTIVES } from 'movement';
import {
  VoltBadge,
  VoltCard,
  VoltCardContent,
  VoltCardHeader,
  VoltCardTitle,
  VoltCardDescription,
} from '@voltui/components';
import { LmnDatabaseIcon } from 'lumen-icons/database';
import { LmnZapIcon } from 'lumen-icons/zap';

const PREVIEW_STATS = [
  { label: 'Visitors', value: '48k' },
  { label: 'Activation', value: '32%' },
  { label: 'Motion', value: '12ms' },
];

const PROGRESS_BARS = [
  { label: 'Hero readiness', value: 92, color: 'accent' },
  { label: 'Interaction polish', value: 78, color: 'success' },
  { label: 'Content clarity', value: 86, color: 'warning' },
];

@Component({
  selector: 'app-template-live-preview',
  imports: [
    ...MOVEMENT_DIRECTIVES,
    VoltBadge,
    VoltCard,
    VoltCardHeader,
    VoltCardTitle,
    VoltCardDescription,
    VoltCardContent,
    LmnZapIcon,
    LmnDatabaseIcon,
  ],
  template: `
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
              <volt-card-description>Hover, tap, focus, and target states.</volt-card-description>
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
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateLivePreview {
  protected readonly previewStats = PREVIEW_STATS;
  protected readonly progressBars = PROGRESS_BARS;
}
