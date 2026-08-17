import {
  MoveKeyframes,
  MovePropertyTransition,
  MoveTransitionConfig,
} from '../presets/presets.types';
import { MovementConfig } from '../tokens/movement.tokens';

/**
 * Transform channels all end up in one composed `transform` string, so they cannot be split across
 * animations — two animations writing `transform` would clobber each other. They therefore share a
 * single easing, which is the documented limitation of per-property easing.
 */
const TRANSFORM_CHANNELS = new Set([
  'x',
  'y',
  'scale',
  'scaleX',
  'scaleY',
  'rotate',
  'rotateX',
  'rotateY',
]);

export interface EasingGroup {
  frames: MoveKeyframes;
  duration: number;
  easing: string;
  delay: number;
  /** Transform groups must be composed against the element's base transform; others must not. */
  isTransform: boolean;
}

function propertyTransition(value: unknown): MovePropertyTransition | null {
  if (typeof value !== 'object' || value === null) return null;
  if (!('duration' in value || 'easing' in value || 'delay' in value)) return null;
  return value as MovePropertyTransition;
}

/**
 * Splits keyframes into groups that can each carry their own easing.
 *
 * Returns `null` when every property resolves to the same easing — the common case, which the
 * single-animation path handles better.
 */
export function groupByEasing(
  frames: MoveKeyframes,
  transition: MoveTransitionConfig,
  config: MovementConfig,
): EasingGroup[] | null {
  const globalDuration = transition.duration ?? config.duration;
  const globalEasing = transition.easing ?? config.easing;
  const globalDelay = transition.delay ?? config.delay;

  const properties = Object.keys(frames).filter((key) => frames[key] !== undefined);
  if (properties.length === 0) return null;

  const resolved = properties.map((property) => {
    const parsed = propertyTransition(transition[property]);
    return {
      property,
      duration: parsed?.duration ?? globalDuration,
      easing: parsed?.easing ?? globalEasing,
      delay: parsed?.delay ?? globalDelay,
    };
  });

  const easings = new Set(resolved.map((entry) => entry.easing));
  if (easings.size <= 1) return null;

  const transformFrames: MoveKeyframes = {};
  let transformTiming: (typeof resolved)[number] | null = null;
  const groups: EasingGroup[] = [];

  for (const entry of resolved) {
    if (TRANSFORM_CHANNELS.has(entry.property)) {
      transformFrames[entry.property] = frames[entry.property];
      // First transform channel wins the timing; the rest of the group follows it.
      transformTiming ??= entry;
      continue;
    }

    groups.push({
      frames: { [entry.property]: frames[entry.property] },
      duration: entry.duration,
      easing: entry.easing,
      delay: entry.delay,
      isTransform: false,
    });
  }

  if (transformTiming) {
    groups.push({
      frames: transformFrames,
      duration: transformTiming.duration,
      easing: transformTiming.easing,
      delay: transformTiming.delay,
      isTransform: true,
    });
  }

  return groups.length > 1 ? groups : null;
}
