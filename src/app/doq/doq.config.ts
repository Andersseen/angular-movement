import { defineDoqConfig, formatDoqUsage } from '@doqs/analog';
import type { DoqPlaygroundDefinition, DoqPlaygroundValues } from '@doqs/analog';
import { doqPaths } from '../../doq.paths';
import { EnterExample } from '../motion-examples/enter/enter-example';
import { InteractionExample } from '../motion-examples/interaction/interaction-example';
import { PresenceExample } from '../motion-examples/presence/presence-example';
import { SignalsExample } from '../motion-examples/signals/signals-example';
import { StaggerExample } from '../motion-examples/stagger/stagger-example';
import { VariantsExample } from '../motion-examples/variants/variants-example';
import { PresetsGallery } from '../motion-examples/presets/presets-gallery';
import { MOTION_EXAMPLES } from '../motion-examples/registry';
import { DocPageFooter } from './doc-page-footer';

const options = (values: readonly string[]) => values.map((value) => ({ label: value, value }));

const ENTRANCE_PRESETS = [
  'fade-up',
  'fade-down',
  'fade-left',
  'fade-right',
  'slide-up',
  'slide-down',
  'zoom-in',
  'blur-in',
  'bounce-in',
] as const;
const EASINGS = ['ease-out', 'ease-in-out', 'ease', 'linear'] as const;

/** `disabled: false` is the directive default — leave it out of the copied code instead of printing it. */
const withoutFalseDisabled = (values: Record<string, unknown>): DoqPlaygroundValues =>
  Object.fromEntries(
    Object.entries(values).filter(([key, value]) => !(key === 'moveDisabled' && value === false)),
  ) as DoqPlaygroundValues;

const enterPlayground: DoqPlaygroundDefinition = {
  component: EnterExample,
  title: MOTION_EXAMPLES.enter.title,
  description:
    'The real directive. moveEnter plays once when the element is created, so each change recreates the element to replay it.',
  controls: [
    {
      input: 'preset',
      kind: 'select',
      label: 'Preset',
      initial: 'fade-up',
      options: options(ENTRANCE_PRESETS),
    },
    {
      input: 'duration',
      kind: 'number',
      label: 'Duration (ms)',
      initial: 500,
      min: 100,
      max: 3000,
      step: 100,
    },
    {
      input: 'delay',
      kind: 'number',
      label: 'Delay (ms)',
      initial: 0,
      min: 0,
      max: 2000,
      step: 100,
    },
    {
      input: 'easing',
      kind: 'select',
      label: 'Easing',
      initial: 'ease-out',
      options: options(EASINGS),
    },
    { input: 'disabled', kind: 'boolean', label: 'Disabled' },
  ],
  outputs: [{ event: 'played', label: 'Played' }],
  code: [
    {
      label: 'Template',
      language: 'html',
      code: ({ preset, duration, delay, easing, disabled }) =>
        formatDoqUsage(
          'div',
          withoutFalseDisabled({
            moveEnter: preset,
            moveDuration: duration,
            moveDelay: delay,
            moveEasing: easing,
            moveDisabled: disabled,
          }),
          { text: 'Content' },
        ),
    },
  ],
};

const interactionPlayground: DoqPlaygroundDefinition = {
  component: InteractionExample,
  title: MOTION_EXAMPLES.interaction.title,
  description:
    'Both directives follow their inputs, so controls apply immediately. Hover responds to a mouse or pen; the tap effect is the touch feedback.',
  controls: [
    {
      input: 'hover',
      kind: 'select',
      label: 'Hover preset',
      initial: 'lift',
      options: options(['lift', 'zoom-in', 'none']),
    },
    {
      input: 'tap',
      kind: 'select',
      label: 'Tap preset',
      initial: 'press',
      options: options(['press', 'zoom-out', 'none']),
    },
    {
      input: 'duration',
      kind: 'number',
      label: 'Duration (ms)',
      initial: 200,
      min: 50,
      max: 1000,
      step: 50,
    },
    { input: 'disabled', kind: 'boolean', label: 'Disabled' },
  ],
  outputs: [{ event: 'pressed', label: 'Pressed' }],
  code: [
    {
      label: 'Template',
      language: 'html',
      code: ({ hover, tap, duration, disabled }) =>
        formatDoqUsage(
          'button',
          withoutFalseDisabled({
            moveWhileHover: hover,
            moveWhileTap: tap,
            moveDuration: duration,
            moveDisabled: disabled,
          }),
          { text: 'Save' },
        ),
    },
  ],
};

const variantsPlayground: DoqPlaygroundDefinition = {
  component: VariantsExample,
  title: MOTION_EXAMPLES.variants.title,
  description:
    'Variants are reactive: change the active name and the element animates to that state.',
  controls: [
    {
      input: 'variant',
      kind: 'select',
      label: 'Active variant',
      initial: 'idle',
      options: options(['idle', 'active', 'error']),
    },
    {
      input: 'duration',
      kind: 'number',
      label: 'Duration (ms)',
      initial: 300,
      min: 50,
      max: 2000,
      step: 50,
    },
    { input: 'disabled', kind: 'boolean', label: 'Disabled' },
  ],
  code: [
    {
      label: 'Template',
      language: 'html',
      code: ({ variant, duration, disabled }) =>
        `<div
  [moveVariants]="{
    idle: { scale: 1, rotate: 0, opacity: 1 },
    active: { scale: 1.1, rotate: 4, opacity: 1 },
    error: { scale: 0.94, rotate: -3, opacity: 0.55 }
  }"
${[
  `  moveVariant="${variant}"`,
  `  [moveDuration]="${duration}"`,
  disabled ? '  [moveDisabled]="true"' : '',
]
  .filter(Boolean)
  .join('\n')}
>
  Card
</div>`,
    },
  ],
};

const presencePlayground: DoqPlaygroundDefinition = {
  component: PresenceExample,
  title: MOTION_EXAMPLES.presence.title,
  description:
    'movePresence keeps the view mounted until the leave animation finishes. Toggle it with the control or the button in the preview.',
  controls: [
    { input: 'open', kind: 'boolean', label: 'Open', initial: true },
    {
      input: 'enter',
      kind: 'select',
      label: 'Enter preset',
      initial: 'fade-up',
      options: options(ENTRANCE_PRESETS),
    },
    {
      input: 'leave',
      kind: 'select',
      label: 'Leave preset',
      initial: 'fade-down',
      options: options(ENTRANCE_PRESETS),
    },
    {
      input: 'duration',
      kind: 'number',
      label: 'Duration (ms)',
      initial: 300,
      min: 50,
      max: 2000,
      step: 50,
    },
    { input: 'disabled', kind: 'boolean', label: 'Disabled' },
  ],
  code: [
    {
      label: 'Template',
      language: 'html',
      code: ({ enter, leave, duration, disabled }) =>
        `<ng-container *movePresence="isOpen()">
${formatDoqUsage(
  'div',
  withoutFalseDisabled({
    moveEnter: enter,
    moveLeave: leave,
    moveDuration: duration,
    moveDisabled: disabled,
  }),
  { text: 'Panel' },
)
  .split('\n')
  .map((line) => `  ${line}`)
  .join('\n')}
</ng-container>`,
    },
  ],
};

const staggerPlayground: DoqPlaygroundDefinition = {
  component: StaggerExample,
  title: MOTION_EXAMPLES.stagger.title,
  description:
    'Delays come from DOM order. The children use moveEnter, so a change recreates the list to replay it.',
  controls: [
    { input: 'step', kind: 'number', label: 'Step (ms)', initial: 80, min: 0, max: 400, step: 20 },
    {
      input: 'direction',
      kind: 'select',
      label: 'Direction',
      initial: 'first',
      options: options(['first', 'last', 'center']),
    },
    { input: 'count', kind: 'number', label: 'Items', initial: 6, min: 2, max: 12, step: 1 },
  ],
  code: [
    {
      label: 'Template',
      language: 'html',
      code: ({ step, direction }) =>
        `<ul moveStagger [moveStaggerStep]="${step}" moveStaggerDirection="${direction}">
  @for (item of items(); track item.id) {
    <li moveEnter="fade-up">{{ item.label }}</li>
  }
</ul>`,
    },
  ],
};

const signalsPlayground: DoqPlaygroundDefinition = {
  component: SignalsExample,
  title: MOTION_EXAMPLES.signals.title,
  description:
    'Motion values are signals: the progress drives a derived position directly and a spring follows it.',
  controls: [
    {
      input: 'progress',
      kind: 'number',
      label: 'Progress (0–1)',
      initial: 0.5,
      min: 0,
      max: 1,
      step: 0.05,
    },
  ],
  code: [
    {
      label: 'Component',
      language: 'ts',
      code: ({ progress }) =>
        `const progress = signal(${progress}); // any Signal<number>

const x = moveTransform(progress, [0, 1], [0, 220]);
const scale = moveSpringValue(moveTransform(progress, [0, 1], [0.8, 1.3]));

const transform = computed(() => \`translateX(\${x()}px) scale(\${scale()})\`);`,
    },
  ],
};

export const doqConfig = defineDoqConfig({
  ...doqPaths,
  // The application shell already wraps every route in <main>; Doqs must not add a second one.
  landmark: 'host',
  search: { enabled: true },
  demos: { 'presets-gallery': PresetsGallery },
  slots: { documentAfterContent: DocPageFooter },
  playgrounds: {
    [MOTION_EXAMPLES.enter.id]: enterPlayground,
    [MOTION_EXAMPLES.interaction.id]: interactionPlayground,
    [MOTION_EXAMPLES.variants.id]: variantsPlayground,
    [MOTION_EXAMPLES.presence.id]: presencePlayground,
    [MOTION_EXAMPLES.stagger.id]: staggerPlayground,
    [MOTION_EXAMPLES.signals.id]: signalsPlayground,
  },
  presentation: {
    documentationLabel: 'Documentation',
    indexTitle: 'Angular Movement documentation',
    indexDescription:
      'Guides for animating Angular with directives and signals, the stability policy, and the generated API reference.',
    pageTitleSuffix: 'Angular Movement',
  },
});
