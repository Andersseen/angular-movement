import { defineEventHandler } from 'h3';

interface DirectiveInfo {
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

const directives: DirectiveInfo[] = [
  {
    name: 'MoveEnterDirective',
    selector: '[moveEnter]',
    description: 'Animate elements when they enter the DOM',
    inputs: [
      { name: 'moveEnter', type: 'MovePreset | MoveKeyframes', required: true },
      { name: 'moveDuration', type: 'number', required: false, defaultValue: '300' },
      { name: 'moveDelay', type: 'number', required: false, defaultValue: '0' },
      { name: 'moveEasing', type: 'string', required: false, defaultValue: 'ease' },
      { name: 'moveSpring', type: 'MoveSpring', required: false },
    ],
  },
  {
    name: 'MoveLeaveDirective',
    selector: '[moveLeave]',
    description: 'Animate elements when they leave the DOM',
    inputs: [
      { name: 'moveLeave', type: 'MovePreset | MoveKeyframes', required: true },
      { name: 'moveDuration', type: 'number', required: false, defaultValue: '300' },
      { name: 'moveDelay', type: 'number', required: false, defaultValue: '0' },
      { name: 'moveEasing', type: 'string', required: false, defaultValue: 'ease' },
    ],
  },
  {
    name: 'MoveAnimateDirective',
    selector: '[moveAnimate]',
    description: 'Shorthand for enter and leave animations',
    inputs: [
      { name: 'moveAnimate', type: 'MovePreset | MoveKeyframes', required: true },
      { name: 'moveDuration', type: 'number', required: false, defaultValue: '300' },
      { name: 'moveDelay', type: 'number', required: false, defaultValue: '0' },
      { name: 'moveEasing', type: 'string', required: false, defaultValue: 'ease' },
    ],
  },
  {
    name: 'MoveHoverDirective',
    selector: '[moveWhileHover]',
    description: 'Animate elements on hover',
    inputs: [
      { name: 'moveWhileHover', type: 'MovePreset | MoveKeyframes', required: true },
      { name: 'moveDuration', type: 'number', required: false, defaultValue: '300' },
      { name: 'moveEasing', type: 'string', required: false, defaultValue: 'ease' },
    ],
  },
  {
    name: 'MoveTapDirective',
    selector: '[moveWhileTap]',
    description: 'Animate elements on tap/click',
    inputs: [
      { name: 'moveWhileTap', type: 'MovePreset | MoveKeyframes', required: true },
      { name: 'moveDuration', type: 'number', required: false, defaultValue: '100' },
      { name: 'moveEasing', type: 'string', required: false, defaultValue: 'ease' },
    ],
  },
  {
    name: 'MoveInViewDirective',
    selector: '[moveInView]',
    description: 'Trigger animations when elements enter the viewport',
    inputs: [
      { name: 'moveInView', type: 'MovePreset | MoveKeyframes', required: true },
      { name: 'moveInViewOnce', type: 'boolean', required: false, defaultValue: 'true' },
      { name: 'moveDuration', type: 'number', required: false, defaultValue: '800' },
      { name: 'moveEasing', type: 'string', required: false, defaultValue: 'ease-out' },
    ],
  },
  {
    name: 'MoveTextDirective',
    selector: '[moveText]',
    description: 'Split text animation by characters or words',
    inputs: [
      { name: 'moveText', type: 'MovePreset | MoveKeyframes', required: true },
      { name: 'moveTextSplit', type: 'chars | words', required: false, defaultValue: 'chars' },
      { name: 'moveTextStagger', type: 'number', required: false, defaultValue: '30' },
      { name: 'moveDuration', type: 'number', required: false, defaultValue: '300' },
    ],
  },
  {
    name: 'MoveStaggerDirective',
    selector: '[moveStagger]',
    description: 'Staggered animations for multiple children',
    inputs: [{ name: 'moveStagger', type: 'number', required: false, defaultValue: '50' }],
  },
  {
    name: 'MoveLayoutDirective',
    selector: '[moveLayout]',
    description: 'Animate layout changes',
    inputs: [
      { name: 'moveLayout', type: 'boolean', required: false, defaultValue: 'true' },
      { name: 'moveDuration', type: 'number', required: false, defaultValue: '400' },
    ],
  },
  {
    name: 'MoveDragDirective',
    selector: '[moveDrag]',
    description: 'Make elements draggable',
    inputs: [
      { name: 'moveDrag', type: 'boolean', required: false, defaultValue: 'true' },
      { name: 'moveDragConstraints', type: 'MoveDragConstraints', required: false },
    ],
  },
  {
    name: 'MoveScrollDirective',
    selector: '[moveScroll]',
    description: 'Scroll-linked animations',
    inputs: [
      { name: 'moveScroll', type: 'MoveKeyframes', required: true },
      {
        name: 'moveScrollOffset',
        type: '[string, string]',
        required: false,
        defaultValue: "['0 1', '1 0']",
      },
    ],
  },
  {
    name: 'MoveVariantsDirective',
    selector: '[moveVariants]',
    description: 'Define and transition between animation states',
    inputs: [
      { name: 'moveVariants', type: 'Record<string, MoveVariant>', required: true },
      { name: 'moveAnimate', type: 'string', required: false },
      { name: 'moveDuration', type: 'number', required: false, defaultValue: '300' },
    ],
  },
];

export default defineEventHandler(() => {
  return {
    directives,
    count: directives.length,
  };
});
