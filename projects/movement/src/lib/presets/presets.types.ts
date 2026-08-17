export type MovePreset =
  | 'fade-up'
  | 'fade-down'
  | 'fade-left'
  | 'fade-right'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'zoom-in'
  | 'zoom-out'
  | 'flip-x'
  | 'flip-y'
  | 'bounce-in'
  | 'blur-in'
  | 'spin'
  | 'pulse'
  | 'shake'
  | 'swing'
  | 'wobble'
  | 'rubber-band'
  | 'heart-beat'
  | 'tada'
  | 'jello'
  | 'light-speed'
  | 'roll-in'
  | 'icon-draw'
  | 'icon-pulse'
  | 'icon-bounce'
  | 'none';

export type MoveValue = number | string;

export type MoveValuePair = readonly MoveValue[];
export type MoveStateValue = MoveValue | MoveValuePair;

export interface MoveSpring {
  stiffness?: number;
  damping?: number;
  mass?: number;
  velocity?: number;
}

/**
 * `'loop'` restarts from the first keyframe each cycle. `'reverse'` alternates direction, so the
 * animation plays back to its start instead of snapping there — what a breathing or yoyo effect
 * needs.
 */
export type MoveRepeatType = 'loop' | 'reverse';

export interface MoveRepeatOptions {
  /** Number of cycles, or `Infinity` for an endless one. */
  repeat?: number;
  repeatType?: MoveRepeatType;
  /** Pause between cycles, in milliseconds. */
  repeatDelay?: number;
}

export interface MovePropertyTransition {
  duration?: number;
  easing?: string;
  delay?: number;
}

export type MoveTransitionConfig = MovePropertyTransition &
  MoveRepeatOptions & {
    /**
     * Explicit keyframe offsets in the `0..1` range, one per keyframe value. Without it, values are
     * spaced evenly, so `{ x: [0, 100, 0] }` cannot dwell at its midpoint.
     */
    times?: readonly number[];
  } & Record<string, MovePropertyTransition | MoveValue | readonly number[] | undefined>;

export interface MoveKeyframeProperties {
  opacity?: MoveValuePair;
  x?: MoveValuePair;
  y?: MoveValuePair;
  scale?: MoveValuePair;
  scaleX?: MoveValuePair;
  scaleY?: MoveValuePair;
  rotate?: MoveValuePair;
  rotateX?: MoveValuePair;
  rotateY?: MoveValuePair;
  blur?: MoveValuePair;
  pathLength?: MoveValuePair;
  pathOffset?: MoveValuePair;
  pathSpacing?: MoveValuePair;
  strokeDashoffset?: MoveValuePair;
  strokeDasharray?: MoveValuePair;
  fillOpacity?: MoveValuePair;
  strokeOpacity?: MoveValuePair;
}

export type MoveKeyframes = MoveKeyframeProperties & Record<string, MoveValuePair | undefined>;

export type MoveVariantState = {
  [K in keyof MoveKeyframeProperties]?: MoveStateValue;
} & Record<
  string,
  MoveStateValue | MoveSpring | MovePropertyTransition | MoveTransitionConfig | undefined
>;

/**
 * `'beforeChildren'` plays the parent first and offsets its children by the parent's duration.
 * `'afterChildren'` runs the children first and delays the parent until their stagger span is done.
 */
export type MoveVariantOrchestration = 'beforeChildren' | 'afterChildren';

export type MoveVariant = MoveVariantState & {
  spring?: MoveSpring;
  duration?: number;
  easing?: string;
  delay?: number;
  transition?: MoveTransitionConfig;
  /** Delay added per nested `[moveVariants]` child, in DOM order. */
  staggerChildren?: number;
  /** Delay applied to every nested `[moveVariants]` child before staggering. */
  delayChildren?: number;
  when?: MoveVariantOrchestration;
};

export interface MovePresetDefinition {
  enter: MoveKeyframes;
  leave: MoveKeyframes;
  loop?: MoveKeyframes;
}

export interface MoveKeyframeState {
  opacity?: number;
  x?: number;
  y?: number;
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  rotate?: number;
  rotateX?: number;
  rotateY?: number;
  blur?: number;
  pathLength?: number;
  pathOffset?: number;
  pathSpacing?: number;
  strokeDashoffset?: number;
  strokeDasharray?: string;
  fillOpacity?: number;
  strokeOpacity?: number;
  [key: string]: number | string | undefined;
}

export interface MoveAnimationConfig {
  initial?: MoveKeyframeState;
  animate?: MoveKeyframeState;
  exit?: MoveKeyframeState;
  duration?: number;
  easing?: string;
  delay?: number;
  spring?: MoveSpring;
}
