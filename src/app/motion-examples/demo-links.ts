/**
 * Where each full demo (`/demos/<slug>`) sits in the documentation: its conceptual guide, the
 * generated API pages of the directives it shows, and neighbouring demos. The demo layout renders
 * this as a strip above every demo, so no individual demo page needs to know about the docs.
 *
 * API paths are the Doqs reference pages generated from `public-api.ts` (`/docs/reference/<kebab>`);
 * `pnpm test:site` checks every path against the generated content.
 */
export interface DemoLink {
  readonly label: string;
  readonly path: string;
}

export interface DemoLinks {
  readonly docs?: DemoLink;
  readonly api: readonly DemoLink[];
  readonly related: readonly string[];
}

const guide = (slug: string, label: string): DemoLink => ({ label, path: `/docs/guides/${slug}` });
const api = (kebab: string, label: string): DemoLink => ({
  label,
  path: `/docs/reference/${kebab}`,
});

const ENTER = guide('enter', 'Animate on enter and leave');
const INTERACTIONS = guide('interactions', 'Hover, tap and focus feedback');
const VARIANTS = guide('variants', 'Reactive animation and variants');
const PRESENCE = guide('presence', 'Presence: animate things leaving');
const STAGGER = guide('stagger-and-scroll', 'Stagger, scroll and loops');
const SIGNALS = guide('signals', 'Motion values and imperative animation');
const EXPERIMENTAL = guide('experimental', 'Experimental: layout and drag');

export const DEMO_LINKS: Readonly<Record<string, DemoLinks>> = {
  enter: {
    docs: ENTER,
    api: [api('move-enter-directive', 'MoveEnterDirective')],
    related: ['leave', 'animate', 'presence'],
  },
  leave: {
    docs: ENTER,
    api: [api('move-leave-directive', 'MoveLeaveDirective')],
    related: ['enter', 'presence', 'presence-list'],
  },
  animate: {
    docs: ENTER,
    api: [api('move-animate-directive', 'MoveAnimateDirective')],
    related: ['enter', 'animation', 'in-view'],
  },
  animation: {
    docs: VARIANTS,
    api: [api('move-animation-directive', 'MoveAnimationDirective')],
    related: ['variants', 'animate', 'target'],
  },
  hover: {
    docs: INTERACTIONS,
    api: [api('move-hover-directive', 'MoveHoverDirective')],
    related: ['tap', 'focus', 'drag'],
  },
  tap: {
    docs: INTERACTIONS,
    api: [api('move-tap-directive', 'MoveTapDirective')],
    related: ['hover', 'focus', 'drag'],
  },
  focus: {
    docs: INTERACTIONS,
    api: [api('move-focus-directive', 'MoveFocusDirective')],
    related: ['hover', 'tap'],
  },
  target: {
    docs: EXPERIMENTAL,
    api: [
      api('move-target-directive', 'MoveTargetDirective'),
      api('move-trigger-directive', 'MoveTriggerDirective'),
    ],
    related: ['variants', 'animation'],
  },
  'in-view': {
    docs: INTERACTIONS,
    api: [api('move-in-view-directive', 'MoveInViewDirective')],
    related: ['stagger', 'scroll', 'enter'],
  },
  drag: {
    docs: EXPERIMENTAL,
    api: [api('move-drag-directive', 'MoveDragDirective')],
    related: ['layout', 'tap', 'hover'],
  },
  text: {
    docs: STAGGER,
    api: [api('move-text-directive', 'MoveTextDirective')],
    related: ['stagger', 'loop'],
  },
  stagger: {
    docs: STAGGER,
    api: [api('move-stagger-directive', 'MoveStaggerDirective')],
    related: ['enter', 'in-view', 'variants'],
  },
  layout: {
    docs: EXPERIMENTAL,
    api: [api('move-layout-directive', 'MoveLayoutDirective')],
    related: ['drag', 'presence-list'],
  },
  variants: {
    docs: VARIANTS,
    api: [api('move-variants-directive', 'MoveVariantsDirective')],
    related: ['animation', 'target', 'stagger'],
  },
  loop: {
    docs: STAGGER,
    api: [api('move-loop-directive', 'MoveLoopDirective')],
    related: ['text', 'icons'],
  },
  icons: {
    docs: { label: 'Presets', path: '/docs/presets' },
    api: [api('move-path-draw', 'MovePathDraw')],
    related: ['enter', 'loop'],
  },
  scroll: {
    docs: STAGGER,
    api: [api('move-scroll-directive', 'MoveScrollDirective')],
    related: ['parallax', 'in-view', 'smooth-scroll'],
  },
  parallax: {
    docs: STAGGER,
    api: [api('move-parallax-directive', 'MoveParallaxDirective')],
    related: ['scroll', 'in-view'],
  },
  'smooth-scroll': {
    docs: EXPERIMENTAL,
    api: [
      api('move-smooth-scroll-directive', 'MoveSmoothScrollDirective'),
      api('smooth-scroll-service', 'SmoothScrollService'),
    ],
    related: ['scroll', 'parallax'],
  },
  presence: {
    docs: PRESENCE,
    api: [api('move-presence-directive', 'MovePresenceDirective')],
    related: ['presence-list', 'leave', 'enter'],
  },
  'presence-list': {
    docs: PRESENCE,
    api: [api('move-presence-for-directive', 'MovePresenceForDirective')],
    related: ['presence', 'layout', 'stagger'],
  },
  values: {
    docs: SIGNALS,
    api: [
      api('move-transform', 'moveTransform'),
      api('move-spring-value', 'moveSpringValue'),
      api('move-value', 'moveValue'),
    ],
    related: ['imperative', 'scroll'],
  },
  imperative: {
    docs: SIGNALS,
    api: [api('move-animator', 'MoveAnimator')],
    related: ['values', 'enter'],
  },
};
