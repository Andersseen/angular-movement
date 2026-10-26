export interface DemoGroup {
  title: string;
  items: DemoItem[];
}

export interface DemoItem {
  path: string;
  label: string;
  description?: string;
}

export const DEMO_GROUPS: DemoGroup[] = [
  {
    title: 'Basic Animations',
    items: [
      { path: 'enter', label: 'moveEnter', description: 'Animate on element enter' },
      { path: 'leave', label: 'moveLeave', description: 'Animate on element leave' },
      { path: 'animate', label: 'moveAnimate', description: 'Shorthand for enter/leave' },
      {
        path: 'animation',
        label: 'moveAnimation',
        description: 'Object-based Framer-style API',
      },
    ],
  },
  {
    title: 'Interaction',
    items: [
      { path: 'hover', label: 'moveWhileHover', description: 'Hover animations' },
      { path: 'tap', label: 'moveWhileTap', description: 'Click/tap animations' },
      { path: 'focus', label: 'moveWhileFocus', description: 'Focus animations' },
      { path: 'target', label: 'moveTarget', description: 'Boolean target animations' },
      { path: 'in-view', label: 'moveInView', description: 'Scroll-triggered animations' },
      { path: 'drag', label: 'moveDrag', description: 'Draggable elements' },
    ],
  },
  {
    title: 'Advanced',
    items: [
      { path: 'text', label: 'moveText', description: 'Split text animations' },
      { path: 'stagger', label: 'moveStagger', description: 'Staggered children' },
      { path: 'layout', label: 'moveLayout', description: 'Layout animations' },
      { path: 'variants', label: 'moveVariants', description: 'Variant-based animations' },
      { path: 'loop', label: 'moveLoop', description: 'Infinite loop animations' },
    ],
  },
  {
    title: 'SVG',
    items: [{ path: 'icons', label: 'SVG Icons', description: 'Path drawing and icon animations' }],
  },
  {
    title: 'Scroll Effects',
    items: [
      { path: 'scroll', label: 'moveScroll', description: 'Scroll-linked animations' },
      { path: 'parallax', label: 'Parallax', description: 'Multi-layer depth effect' },
      {
        path: 'smooth-scroll',
        label: 'moveSmoothScroll',
        description: 'Inertial smooth scrolling',
      },
    ],
  },
  {
    title: 'Special',
    items: [
      { path: 'presence', label: 'movePresence', description: 'AnimatePresence pattern' },
      {
        path: 'presence-list',
        label: 'movePresenceFor',
        description: 'Exit animations for keyed lists',
      },
      { path: 'values', label: 'Signal values', description: 'moveValue / moveTransform / spring' },
      {
        path: 'imperative',
        label: 'MoveAnimator',
        description: 'Imperative animation and View Transitions',
      },
    ],
  },
];
