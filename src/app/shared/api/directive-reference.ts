/**
 * Single source of truth for the directive reference shown on the docs pages and served by
 * `/api/directives`.
 *
 * Kept honest by `pnpm docs:check`, which diffs this data against the real library source
 * (selectors, input names and required flags). Update it in the same commit as any directive
 * API change — the check runs in CI.
 */

export interface DirectiveInfo {
  name: string;
  selector: string;
  description: string;
  inputs: {
    name: string;
    type: string;
    required: boolean;
    defaultValue?: string;
  }[];
}

export const DIRECTIVE_REFERENCE: DirectiveInfo[] = [
  {
    name: 'MoveEnterDirective',
    selector: '[moveEnter]',
    description: 'Animate elements when they enter the DOM',
    inputs: [
      { name: 'moveEnter', type: 'MovePreset | MoveKeyframes', required: false },
      { name: 'moveDuration', type: 'number', required: false, defaultValue: '300' },
      { name: 'moveDelay', type: 'number', required: false, defaultValue: '0' },
      {
        name: 'moveEasing',
        type: 'string',
        required: false,
        defaultValue: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      { name: 'moveSpring', type: 'MoveSpring', required: false },
      { name: 'moveDisabled', type: 'boolean', required: false },
    ],
  },
  {
    name: 'MoveLeaveDirective',
    selector: '[moveLeave]',
    description: 'Animate elements before removal when used inside movePresence',
    inputs: [
      { name: 'moveLeave', type: 'MovePreset | MoveKeyframes', required: false },
      { name: 'moveDuration', type: 'number', required: false, defaultValue: '300' },
      { name: 'moveDelay', type: 'number', required: false, defaultValue: '0' },
      {
        name: 'moveEasing',
        type: 'string',
        required: false,
        defaultValue: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      { name: 'moveSpring', type: 'MoveSpring', required: false },
      { name: 'moveDisabled', type: 'boolean', required: false },
    ],
  },
  {
    name: 'MoveAnimateDirective',
    selector: '[move], [moveAnimate]',
    description: 'Shorthand for enter/leave animations, including Motion-style state inputs',
    inputs: [
      { name: 'move', type: 'MovePreset | MoveKeyframes', required: false },
      {
        name: 'moveAnimate',
        type: 'MovePreset | MoveKeyframes | MoveKeyframeState',
        required: false,
      },
      { name: 'moveInitial', type: 'MoveKeyframeState', required: false },
      { name: 'moveExit', type: 'MoveKeyframeState', required: false },
      { name: 'moveAnimateLeave', type: 'MovePreset | MoveKeyframes', required: false },
      { name: 'moveDuration', type: 'number', required: false, defaultValue: '300' },
      { name: 'moveDelay', type: 'number', required: false, defaultValue: '0' },
      {
        name: 'moveEasing',
        type: 'string',
        required: false,
        defaultValue: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      { name: 'moveSpring', type: 'MoveSpring', required: false },
      { name: 'moveDisabled', type: 'boolean', required: false },
    ],
  },
  {
    name: 'MoveAnimationDirective',
    selector: '[moveAnimation]',
    description: 'Framer Motion-style { initial, animate, exit } state objects',
    inputs: [
      { name: 'moveAnimation', type: 'MoveAnimationConfig', required: true },
      { name: 'moveDuration', type: 'number', required: false, defaultValue: '300' },
      { name: 'moveDelay', type: 'number', required: false, defaultValue: '0' },
      {
        name: 'moveEasing',
        type: 'string',
        required: false,
        defaultValue: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      { name: 'moveSpring', type: 'MoveSpring', required: false },
      { name: 'moveDisabled', type: 'boolean', required: false },
    ],
  },
  {
    name: 'MoveHoverDirective',
    selector: '[moveWhileHover]',
    description: 'Animate elements on hover',
    inputs: [
      { name: 'moveWhileHover', type: 'MovePreset | MoveKeyframes', required: true },
      { name: 'moveDuration', type: 'number', required: false, defaultValue: '300' },
      {
        name: 'moveEasing',
        type: 'string',
        required: false,
        defaultValue: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      { name: 'moveDelay', type: 'number', required: false, defaultValue: '0' },
      { name: 'moveSpring', type: 'MoveSpring', required: false },
      { name: 'moveReverseDuration', type: 'number', required: false, defaultValue: '200' },
      { name: 'moveReverseEasing', type: 'string', required: false, defaultValue: 'ease-out' },
      { name: 'moveDisabled', type: 'boolean', required: false },
    ],
  },
  {
    name: 'MoveTapDirective',
    selector: '[moveWhileTap]',
    description: 'Animate elements on tap/click',
    inputs: [
      { name: 'moveWhileTap', type: 'MovePreset | MoveKeyframes', required: true },
      { name: 'moveDuration', type: 'number', required: false, defaultValue: '300' },
      {
        name: 'moveEasing',
        type: 'string',
        required: false,
        defaultValue: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      { name: 'moveDelay', type: 'number', required: false, defaultValue: '0' },
      { name: 'moveSpring', type: 'MoveSpring', required: false },
      { name: 'moveReverseDuration', type: 'number', required: false, defaultValue: '200' },
      { name: 'moveReverseEasing', type: 'string', required: false, defaultValue: 'ease-out' },
      { name: 'moveDisabled', type: 'boolean', required: false },
    ],
  },
  {
    name: 'MoveFocusDirective',
    selector: '[moveWhileFocus]',
    description: 'Animate elements on focus/blur',
    inputs: [
      { name: 'moveWhileFocus', type: 'MovePreset | MoveKeyframes', required: true },
      { name: 'moveDuration', type: 'number', required: false, defaultValue: '300' },
      {
        name: 'moveEasing',
        type: 'string',
        required: false,
        defaultValue: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      { name: 'moveDelay', type: 'number', required: false, defaultValue: '0' },
      { name: 'moveSpring', type: 'MoveSpring', required: false },
      { name: 'moveReverseDuration', type: 'number', required: false, defaultValue: '200' },
      { name: 'moveReverseEasing', type: 'string', required: false, defaultValue: 'ease-out' },
      { name: 'moveDisabled', type: 'boolean', required: false },
    ],
  },
  {
    name: 'MoveTargetDirective',
    selector: '[moveTarget]',
    description: 'Animate any element from a boolean trigger, including smooth reverse',
    inputs: [
      { name: 'moveTarget', type: 'boolean', required: true },
      { name: 'moveFrames', type: 'MoveKeyframes', required: false },
      { name: 'movePreset', type: 'MovePreset', required: false },
      { name: 'moveDuration', type: 'number', required: false, defaultValue: '300' },
      { name: 'moveDelay', type: 'number', required: false, defaultValue: '0' },
      {
        name: 'moveEasing',
        type: 'string',
        required: false,
        defaultValue: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      { name: 'moveReverseDuration', type: 'number', required: false, defaultValue: '200' },
      { name: 'moveReverseEasing', type: 'string', required: false, defaultValue: 'ease-out' },
      { name: 'moveSpring', type: 'MoveSpring', required: false },
      { name: 'moveTransition', type: 'MoveTransitionConfig', required: false },
      { name: 'moveDisabled', type: 'boolean', required: false },
    ],
  },
  {
    name: 'MoveTriggerDirective',
    selector: '[moveTrigger]',
    description: 'Trigger animations imperatively from a boolean or via exportAs methods',
    inputs: [
      { name: 'moveTrigger', type: 'boolean', required: true },
      { name: 'moveFrames', type: 'MoveKeyframes', required: true },
      { name: 'moveResetFrames', type: 'MoveKeyframes', required: false },
      {
        name: 'moveResetState',
        type: "'initial' | 'final' | 'clear'",
        required: false,
        defaultValue: 'clear',
      },
      { name: 'moveDuration', type: 'number', required: false, defaultValue: '300' },
      { name: 'moveDelay', type: 'number', required: false, defaultValue: '0' },
      {
        name: 'moveEasing',
        type: 'string',
        required: false,
        defaultValue: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      { name: 'moveReverseDuration', type: 'number', required: false, defaultValue: '200' },
      { name: 'moveReverseEasing', type: 'string', required: false, defaultValue: 'ease-out' },
      { name: 'moveSpring', type: 'MoveSpring', required: false },
      { name: 'moveDisabled', type: 'boolean', required: false },
    ],
  },
  {
    name: 'MoveInViewDirective',
    selector: '[moveInView]',
    description: 'Trigger animations when elements enter the viewport',
    inputs: [
      { name: 'moveInView', type: 'MovePreset | MoveKeyframes', required: false },
      { name: 'moveInViewMargin', type: 'string', required: false, defaultValue: '0px' },
      { name: 'moveInViewOnce', type: 'boolean', required: false, defaultValue: 'true' },
      { name: 'moveInViewRoot', type: 'string | null', required: false, defaultValue: 'null' },
      { name: 'moveDuration', type: 'number', required: false, defaultValue: '800' },
      {
        name: 'moveEasing',
        type: 'string',
        required: false,
        defaultValue: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      { name: 'moveDelay', type: 'number', required: false, defaultValue: '0' },
      { name: 'moveSpring', type: 'MoveSpring', required: false },
      { name: 'moveDisabled', type: 'boolean', required: false },
    ],
  },
  {
    name: 'MoveTextDirective',
    selector: '[moveText]',
    description: 'Split text animation by characters or words',
    inputs: [
      { name: 'moveText', type: 'MovePreset | MoveKeyframes', required: false },
      { name: 'moveTextSplit', type: 'chars | words', required: false, defaultValue: 'chars' },
      { name: 'moveTextStagger', type: 'number', required: false, defaultValue: '30' },
      { name: 'moveDuration', type: 'number', required: false, defaultValue: '300' },
      {
        name: 'moveEasing',
        type: 'string',
        required: false,
        defaultValue: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      { name: 'moveDelay', type: 'number', required: false, defaultValue: '0' },
      { name: 'moveSpring', type: 'MoveSpring', required: false },
      { name: 'moveDisabled', type: 'boolean', required: false },
    ],
  },
  {
    name: 'MoveStaggerDirective',
    selector: '[moveStagger]',
    description: 'Staggered animations for multiple children',
    inputs: [
      {
        name: 'moveStagger',
        type: 'number | MoveSpring | ""',
        required: false,
        defaultValue: '100',
      },
      { name: 'moveStaggerStep', type: 'number', required: false },
      {
        name: 'moveStaggerDirection',
        type: "'first' | 'last' | 'center'",
        required: false,
        defaultValue: 'first',
      },
    ],
  },
  {
    name: 'MoveLayoutDirective',
    selector: '[moveLayout]',
    description: 'Animate layout changes',
    inputs: [
      { name: 'moveLayout', type: 'boolean | ""', required: false, defaultValue: 'true' },
      { name: 'moveLayoutId', type: 'string', required: false },
      { name: 'moveDuration', type: 'number', required: false, defaultValue: '400' },
      {
        name: 'moveEasing',
        type: 'string',
        required: false,
        defaultValue: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      { name: 'moveDelay', type: 'number', required: false, defaultValue: '0' },
      { name: 'moveSpring', type: 'MoveSpring', required: false },
      { name: 'moveDisabled', type: 'boolean', required: false },
    ],
  },
  {
    name: 'MoveDragDirective',
    selector: '[moveDrag]',
    description: 'Make elements draggable with constraints, axis locking, momentum, and outputs',
    inputs: [
      { name: 'moveDrag', type: 'boolean | "" | "x" | "y"', required: false, defaultValue: 'true' },
      { name: 'moveDragConstraints', type: 'MoveDragConstraints', required: false },
      { name: 'moveDragElastic', type: 'number', required: false, defaultValue: '0.5' },
      { name: 'moveDragMomentum', type: 'boolean', required: false, defaultValue: 'false' },
      { name: 'moveDragSnapToOrigin', type: 'boolean', required: false, defaultValue: 'false' },
      { name: 'moveDragSnapPoints', type: 'readonly MoveDragSnapPoint[]', required: false },
      { name: 'moveSpring', type: 'MoveSpring', required: false },
    ],
  },
  {
    name: 'MoveScrollDirective',
    selector: '[moveScroll]',
    description: 'Scroll-linked animations',
    inputs: [
      { name: 'moveScroll', type: 'MoveKeyframes', required: false },
      {
        name: 'moveScrollOffset',
        type: '[string, string]',
        required: false,
        defaultValue: "['0 1', '1 0']",
      },
      { name: 'moveScrollContainer', type: 'string | null', required: false, defaultValue: 'null' },
    ],
  },
  {
    name: 'MoveParallaxDirective',
    selector: '[moveParallax]',
    description: 'Parallax translation linked to scroll progress',
    inputs: [
      { name: 'moveParallax', type: 'number', required: false, defaultValue: '0.2' },
      { name: 'moveParallaxAxis', type: "'x' | 'y'", required: false, defaultValue: 'y' },
      {
        name: 'moveParallaxContainer',
        type: 'string | null',
        required: false,
        defaultValue: 'null',
      },
    ],
  },
  {
    name: 'MoveLoopDirective',
    selector: '[moveLoop]',
    description: 'Infinite looping animations',
    inputs: [
      { name: 'moveLoop', type: 'MovePreset | MoveKeyframes', required: false },
      { name: 'moveDuration', type: 'number', required: false, defaultValue: '300' },
      {
        name: 'moveEasing',
        type: 'string',
        required: false,
        defaultValue: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      { name: 'moveDelay', type: 'number', required: false, defaultValue: '0' },
      { name: 'moveSpring', type: 'MoveSpring', required: false },
      { name: 'moveDisabled', type: 'boolean', required: false },
    ],
  },
  {
    name: 'MovePresenceDirective',
    selector: '*movePresence',
    description: 'Wait for child leave animations before removing a view',
    inputs: [{ name: 'movePresence', type: 'boolean | "" | undefined', required: false }],
  },
  {
    name: 'MovePresenceForDirective',
    selector: '*movePresenceFor',
    description: 'Render a keyed list and animate items out before removing them',
    inputs: [
      { name: 'movePresenceForOf', type: 'readonly T[] | null | undefined', required: true },
      {
        name: 'movePresenceForTrackBy',
        type: 'MovePresenceForTrackBy<T>',
        required: false,
        defaultValue: 'identity',
      },
      {
        name: 'movePresenceForMode',
        type: "'sync' | 'wait'",
        required: false,
        defaultValue: "'sync'",
      },
    ],
  },
  {
    name: 'MoveSmoothScrollDirective',
    selector: '[moveSmoothScroll]',
    description: 'Enable momentum-based smooth scrolling on a container',
    inputs: [
      { name: 'moveSmoothScrollLerp', type: 'number', required: false, defaultValue: '0.1' },
    ],
  },
  {
    name: 'MoveVariantsDirective',
    selector: '[moveVariants]',
    description: 'Define and transition between animation states',
    inputs: [
      { name: 'moveVariants', type: 'Record<string, MoveVariant>', required: true },
      { name: 'moveVariant', type: 'string', required: false },
      { name: 'moveActiveVariant', type: 'string', required: false },
      { name: 'moveExitVariant', type: 'string', required: false },
      { name: 'moveDuration', type: 'number', required: false, defaultValue: '300' },
      { name: 'moveDelay', type: 'number', required: false, defaultValue: '0' },
      {
        name: 'moveEasing',
        type: 'string',
        required: false,
        defaultValue: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      { name: 'moveSpring', type: 'MoveSpring', required: false },
      { name: 'moveTransition', type: 'MoveTransitionConfig', required: false },
      { name: 'moveDisabled', type: 'boolean', required: false },
    ],
  },
];
