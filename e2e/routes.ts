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
  'imperative',
  'in-view',
  'layout',
  'leave',
  'loop',
  'parallax',
  'presence',
  'presence-list',
  'scroll',
  'smooth-scroll',
  'stagger',
  'tap',
  'target',
  'text',
  'values',
  'variants',
] as const;

/**
 * Every documentation URL, with the page's h1 and a sentence that proves the Markdown body rendered.
 * The first eleven are the URLs the previous hand-written site published; they must never regress.
 */
export const DOCS_ROUTES = [
  { path: '/docs/introduction', heading: 'Introduction', text: 'What it is not' },
  { path: '/docs/get-started', heading: 'Get started', text: 'Install the package' },
  { path: '/docs/choose-a-tool', heading: 'Choose the right tool', text: 'Quick decision guide' },
  { path: '/docs/api-selection', heading: 'Choose an API', text: 'Rule of thumb' },
  { path: '/docs/api', heading: 'API overview and stability', text: 'Input reactivity' },
  { path: '/docs/reference', heading: 'API reference', text: 'MoveEnterDirective' },
  { path: '/docs/presets', heading: 'Presets', text: 'Where presets fit' },
  { path: '/docs/patterns', heading: 'Angular patterns', text: '@if and leave animations' },
  { path: '/docs/migration', heading: 'Migrate from legacy animations', text: 'Recipes' },
  {
    path: '/docs/accessibility',
    heading: 'Accessibility and troubleshooting',
    text: 'Reduced motion',
  },
  { path: '/docs/mcp', heading: 'AI agent setup', text: 'What the server exposes' },
] as const;

export const GUIDE_ROUTES = [
  { path: '/docs/guides/enter', heading: 'Animate on enter and leave', demo: '/demos/enter' },
  {
    path: '/docs/guides/interactions',
    heading: 'Hover, tap and focus feedback',
    demo: '/demos/hover',
  },
  {
    path: '/docs/guides/variants',
    heading: 'Reactive animation and variants',
    demo: '/demos/variants',
  },
  {
    path: '/docs/guides/presence',
    heading: 'Presence: animate things leaving',
    demo: '/demos/presence',
  },
  {
    path: '/docs/guides/stagger-and-scroll',
    heading: 'Stagger, scroll and loops',
    demo: '/demos/stagger',
  },
  {
    path: '/docs/guides/signals',
    heading: 'Motion values and imperative animation',
    demo: '/demos/values',
  },
  {
    path: '/docs/guides/experimental',
    heading: 'Experimental: layout and drag',
    demo: '/demos/drag',
  },
] as const;

/** Every route the suite loads, for the warm-up pass. */
export const ALL_ROUTES: string[] = [
  '/',
  '/templates',
  '/demos',
  '/docs',
  '/docs/introduction',
  '/docs/get-started',
  '/docs/reference/move-enter-directive',
  ...DOCS_ROUTES.map((route) => route.path),
  ...GUIDE_ROUTES.map((route) => route.path),
  ...DEMO_ROUTES.map((route) => `/demos/${route}`),
];
