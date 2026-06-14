import {
  computed,
  effect,
  Injector,
  Signal,
  signal,
  untracked,
  WritableSignal,
} from '@angular/core';
import { MoveSpring } from '../presets/presets.types';

export type MoveTransformValue = number | string;

export interface MoveTransformOptions {
  clamp?: boolean;
}

export interface MoveSpringValueConfig extends MoveSpring {
  initial?: number;
  precision?: number;
  restSpeed?: number;
  disabled?: boolean;
  injector?: Injector;
}

export function moveValue<T>(initial: T): WritableSignal<T> {
  return signal(initial);
}

export function moveTransform(
  source: Signal<number>,
  inputRange: readonly number[],
  outputRange: readonly number[],
  options?: MoveTransformOptions,
): Signal<number>;
export function moveTransform(
  source: Signal<number>,
  inputRange: readonly number[],
  outputRange: readonly string[],
  options?: MoveTransformOptions,
): Signal<string>;
export function moveTransform(
  source: Signal<number>,
  inputRange: readonly number[],
  outputRange: readonly MoveTransformValue[],
  options: MoveTransformOptions = {},
): Signal<MoveTransformValue> {
  validateRanges(inputRange, outputRange);

  const clamp = options.clamp ?? true;

  return computed(() => {
    const value = source();
    const segment = findSegment(value, inputRange, clamp);
    const inputStart = inputRange[segment];
    const inputEnd = inputRange[segment + 1];
    const outputStart = outputRange[segment];
    const outputEnd = outputRange[segment + 1];
    const progress = inputEnd === inputStart ? 0 : (value - inputStart) / (inputEnd - inputStart);
    const t = clamp ? clamp01(progress) : progress;

    return interpolateOutput(outputStart, outputEnd, t);
  });
}

export function moveSpringValue(
  source: Signal<number>,
  config: MoveSpringValueConfig = {},
): Signal<number> {
  const value = signal(config.initial ?? source());
  let velocity = config.velocity ?? 0;
  let rafId: number | null = null;
  let lastTime: number | null = null;

  const cancelRaf = () => {
    if (rafId !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(rafId);
    }
    rafId = null;
    lastTime = null;
  };

  effect(
    (onCleanup) => {
      const target = source();
      const stiffness = config.stiffness ?? 170;
      const damping = config.damping ?? 26;
      const mass = config.mass ?? 1;
      const precision = config.precision ?? 0.01;
      const restSpeed = config.restSpeed ?? 0.01;

      cancelRaf();

      if (
        config.disabled ||
        typeof requestAnimationFrame !== 'function' ||
        typeof cancelAnimationFrame !== 'function'
      ) {
        velocity = 0;
        value.set(target);
        return;
      }

      const currentValue = untracked(value);

      if (Math.abs(target - currentValue) <= precision && Math.abs(velocity) <= restSpeed) {
        velocity = 0;
        value.set(target);
        return;
      }

      const tick = (time: number) => {
        const dt =
          lastTime === null ? 1 / 60 : Math.min(0.04, Math.max(0.001, (time - lastTime) / 1000));
        lastTime = time;

        const current = value();
        const displacement = current - target;
        const springForce = -stiffness * displacement;
        const dampingForce = -damping * velocity;
        const acceleration = (springForce + dampingForce) / mass;
        velocity += acceleration * dt;

        const next = current + velocity * dt;
        value.set(next);

        if (Math.abs(target - next) <= precision && Math.abs(velocity) <= restSpeed) {
          velocity = 0;
          value.set(target);
          rafId = null;
          lastTime = null;
          return;
        }

        rafId = requestAnimationFrame(tick);
      };

      rafId = requestAnimationFrame(tick);
      onCleanup(cancelRaf);
    },
    config.injector ? { injector: config.injector } : undefined,
  );

  return value.asReadonly();
}

function validateRanges(
  inputRange: readonly number[],
  outputRange: readonly MoveTransformValue[],
): void {
  if (inputRange.length !== outputRange.length || inputRange.length < 2) {
    throw new Error(
      'moveTransform requires matching input and output ranges with at least two values.',
    );
  }

  for (let i = 1; i < inputRange.length; i += 1) {
    if (inputRange[i] <= inputRange[i - 1]) {
      throw new Error('moveTransform inputRange values must be in ascending order.');
    }
  }
}

function findSegment(value: number, inputRange: readonly number[], clamp: boolean): number {
  if (value <= inputRange[0]) return 0;
  if (value >= inputRange[inputRange.length - 1]) return inputRange.length - 2;

  for (let i = 0; i < inputRange.length - 1; i += 1) {
    if (value >= inputRange[i] && value <= inputRange[i + 1]) {
      return i;
    }
  }

  return clamp ? 0 : inputRange.length - 2;
}

function interpolateOutput(
  from: MoveTransformValue,
  to: MoveTransformValue,
  progress: number,
): MoveTransformValue {
  if (typeof from === 'number' && typeof to === 'number') {
    return from + (to - from) * progress;
  }

  const fromUnit = parseNumericUnit(from);
  const toUnit = parseNumericUnit(to);

  if (fromUnit && toUnit && fromUnit.unit === toUnit.unit) {
    return `${fromUnit.value + (toUnit.value - fromUnit.value) * progress}${fromUnit.unit}`;
  }

  return progress < 0.5 ? from : to;
}

function parseNumericUnit(value: MoveTransformValue): { value: number; unit: string } | null {
  if (typeof value === 'number') return { value, unit: '' };

  const match = value.trim().match(/^(-?\d+(?:\.\d+)?)(.*)$/);
  if (!match) return null;

  return {
    value: Number(match[1]),
    unit: match[2],
  };
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
