import {
  MoveKeyframes,
  MovePropertyTransition,
  MoveTransitionConfig,
} from '../presets/presets.types';
import { MovementConfig } from '../tokens/movement.tokens';

export interface ResolvedTransition {
  keyframes: Keyframe[];
  duration: number;
  easing: string;
  delay: number;
}

function isPropertyTransition(value: unknown): value is MovePropertyTransition {
  return (
    typeof value === 'object' &&
    value !== null &&
    ('duration' in value || 'easing' in value || 'delay' in value)
  );
}

export function composeTransitionKeyframes(
  frames: MoveKeyframes,
  transition: MoveTransitionConfig,
  baseConfig: MovementConfig,
): ResolvedTransition | null {
  const globalDuration = transition.duration ?? baseConfig.duration;
  const globalEasing = transition.easing ?? baseConfig.easing;
  const globalDelay = transition.delay ?? baseConfig.delay;

  const propNames = Object.keys(frames).filter((k) => k !== 'transition');
  if (propNames.length === 0) return null;

  const timings = propNames.map((prop) => {
    const pt = transition[prop];
    const parsed = isPropertyTransition(pt) ? pt : ({} as MovePropertyTransition);
    return {
      prop,
      duration: parsed.duration ?? globalDuration,
      easing: parsed.easing ?? globalEasing,
      delay: parsed.delay ?? globalDelay,
      values: frames[prop]!.map((v) => Number(v)),
    };
  });

  const allSame = timings.every(
    (t) =>
      t.duration === timings[0].duration &&
      t.easing === timings[0].easing &&
      t.delay === timings[0].delay,
  );

  if (allSame) {
    return null;
  }

  const uniqueEasings = new Set(timings.map((t) => t.easing));
  let finalEasing = timings[0].easing;
  if (uniqueEasings.size > 1) {
    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
      console.warn(
        '[Movement] Per-property easing differences are not supported yet. Using global easing.',
      );
    }
    finalEasing = globalEasing;
  }

  const totalDuration = Math.max(...timings.map((t) => t.delay + t.duration));
  const totalDelay = Math.min(...timings.map((t) => t.delay));

  // Collect all keyframe times
  const timeSet = new Set<number>();
  for (const t of timings) {
    const n = t.values.length;
    for (let i = 0; i < n; i++) {
      const time = t.delay + (t.duration * i) / Math.max(1, n - 1);
      timeSet.add(time);
    }
  }

  const sortedTimes = Array.from(timeSet).sort((a, b) => a - b);
  const resultKeyframes: Keyframe[] = [];

  for (const time of sortedTimes) {
    const offset =
      totalDuration > totalDelay ? (time - totalDelay) / (totalDuration - totalDelay) : 0;
    const kf: Keyframe = { offset };

    for (const t of timings) {
      const localTime = time - t.delay;
      const n = t.values.length;

      if (n === 1) {
        (kf as Record<string, unknown>)[t.prop] = t.values[0];
        continue;
      }

      if (localTime <= 0) {
        (kf as Record<string, unknown>)[t.prop] = t.values[0];
      } else if (localTime >= t.duration) {
        (kf as Record<string, unknown>)[t.prop] = t.values[n - 1];
      } else {
        const progress = t.duration > 0 ? localTime / t.duration : 0;
        const maxIdx = n - 1;
        const idx = progress * maxIdx;
        const i1 = Math.floor(idx);
        const i2 = Math.min(Math.ceil(idx), maxIdx);
        const p = idx - i1;
        const v1 = t.values[i1];
        const v2 = t.values[i2];
        (kf as Record<string, unknown>)[t.prop] = v1 + (v2 - v1) * p;
      }
    }

    resultKeyframes.push(kf);
  }

  return {
    keyframes: resultKeyframes,
    duration: totalDuration,
    easing: finalEasing,
    delay: totalDelay,
  };
}
