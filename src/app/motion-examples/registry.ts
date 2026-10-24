/**
 * Language-neutral identity and cross-links of every interactive example. Ids are stable keys, not
 * display text: the Doqs registry, the demo gallery strip and the tests all refer to them, so a
 * future localized site can translate labels without touching identities or routes.
 */
export type Stability = 'stable' | 'experimental';

export interface MotionExampleMeta {
  readonly id: string;
  /** What the example is called where it is listed. */
  readonly title: string;
  readonly directive: string;
  readonly stability: Stability;
  /** Conceptual guide (Doqs page). */
  readonly docs: string;
  /** Full interactive playground (host-owned gallery route). */
  readonly demo: string;
}

export const MOTION_EXAMPLES = {
  enter: {
    id: 'enter',
    title: 'moveEnter',
    directive: 'moveEnter',
    stability: 'stable',
    docs: '/docs/guides/enter',
    demo: '/demos/enter',
  },
  interaction: {
    id: 'interaction',
    title: 'moveWhileHover + moveWhileTap',
    directive: 'moveWhileHover',
    stability: 'stable',
    docs: '/docs/guides/interactions',
    demo: '/demos/hover',
  },
  variants: {
    id: 'variants',
    title: 'moveVariants',
    directive: 'moveVariants',
    stability: 'stable',
    docs: '/docs/guides/variants',
    demo: '/demos/variants',
  },
  presence: {
    id: 'presence',
    title: 'movePresence',
    directive: 'movePresence',
    stability: 'stable',
    docs: '/docs/guides/presence',
    demo: '/demos/presence',
  },
  stagger: {
    id: 'stagger',
    title: 'moveStagger',
    directive: 'moveStagger',
    stability: 'stable',
    docs: '/docs/guides/stagger-and-scroll',
    demo: '/demos/stagger',
  },
  signals: {
    id: 'signals',
    title: 'moveTransform + moveSpringValue',
    directive: 'moveTransform',
    stability: 'stable',
    docs: '/docs/guides/signals',
    demo: '/demos/values',
  },
} as const satisfies Record<string, MotionExampleMeta>;

export type MotionExampleId = keyof typeof MOTION_EXAMPLES;
