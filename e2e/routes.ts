/**
 * Single source of the routes the e2e suite touches, shared by the specs and by the global warm-up.
 *
 * Keeping one list means a new page cannot be smoke-tested but left out of the warm-up (or the
 * reverse), which is how the suite drifted into being cold-cache flaky in the first place.
 */

export const DEMO_ROUTES = [
  'animate',
  'animation',
  'drag',
  'enter',
  'focus',
  'hover',
  'icons',
  'in-view',
  'layout',
  'leave',
  'loop',
  'parallax',
  'presence',
  'scroll',
  'smooth-scroll',
  'stagger',
  'tap',
  'target',
  'text',
  'values',
  'variants',
] as const;

export const DOCS_ROUTES = [
  { path: '/docs/api', heading: 'API Guide', text: 'How it works' },
  { path: '/docs/reference', heading: 'API Reference', text: 'Choose by job' },
  { path: '/docs/presets', heading: 'Presets', text: 'Where presets fit' },
  { path: '/docs/patterns', heading: 'Angular patterns', text: '@if and leave animations' },
] as const;

/** Every route the suite loads, for the warm-up pass. */
export const ALL_ROUTES: string[] = [
  '/',
  '/templates',
  '/demos',
  '/docs',
  '/docs/introduction',
  '/docs/get-started',
  ...DOCS_ROUTES.map((route) => route.path),
  ...DEMO_ROUTES.map((route) => `/demos/${route}`),
];
