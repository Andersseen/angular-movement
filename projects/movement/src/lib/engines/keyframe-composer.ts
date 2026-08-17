import { MoveKeyframes } from '../presets/presets.types';
import { movementWarn } from '../dev-warn';
import { DEFAULT_PERSPECTIVE } from '../constants';
import { formatTransform, readTransformState, TransformState } from './transform-state';

export interface ComposedKeyframe extends Keyframe {
  opacity?: number;
  translate?: string;
  scale?: string;
  rotate?: string;
  filter?: string;
  transform?: string;
}

function getValAt(
  arr: readonly (number | string)[] | undefined,
  index: number,
): number | string | undefined {
  if (!arr || arr.length === 0) return undefined;
  return arr[Math.min(index, arr.length - 1)];
}

function getInterpolated(
  arr: readonly (number | string)[] | undefined,
  i1: number,
  i2: number,
  p: number,
): number | string | undefined {
  if (!arr || arr.length === 0) return undefined;
  const v1 = arr[Math.min(i1, arr.length - 1)];
  const v2 = arr[Math.min(i2, arr.length - 1)];
  if (typeof v1 === 'string' || typeof v2 === 'string') {
    return p >= 1 ? v2 : v1;
  }
  return v1 + (v2 - v1) * p;
}

const KNOWN_KEYS = new Set([
  'opacity',
  'x',
  'y',
  'scale',
  'scaleX',
  'scaleY',
  'rotate',
  'rotateX',
  'rotateY',
  'blur',
]);

function buildKeyframe(
  frames: MoveKeyframes,
  getVal: (arr: readonly (number | string)[] | undefined) => number | string | undefined,
): ComposedKeyframe {
  const keyframe: ComposedKeyframe = {};

  const opacity = getVal(frames.opacity);
  if (opacity !== undefined) {
    keyframe.opacity = Number(opacity);
  }

  const x = getVal(frames.x);
  const y = getVal(frames.y);
  if (x !== undefined || y !== undefined) {
    keyframe.translate = `${Number(x ?? 0)}px ${Number(y ?? 0)}px`;
  }

  const scale = getVal(frames.scale);
  if (scale !== undefined) {
    keyframe.scale = `${Number(scale)}`;
  } else {
    const scaleX = getVal(frames.scaleX);
    const scaleY = getVal(frames.scaleY);
    if (scaleX !== undefined || scaleY !== undefined) {
      keyframe.scale = `${Number(scaleX ?? 1)} ${Number(scaleY ?? 1)}`;
    }
  }

  const rotate = getVal(frames.rotate);
  if (rotate !== undefined) {
    keyframe.rotate = `${Number(rotate)}deg`;
  }

  const blur = getVal(frames.blur);
  if (blur !== undefined) {
    keyframe.filter = `blur(${Number(blur)}px)`;
  }

  const rotateX = getVal(frames.rotateX);
  const rotateY = getVal(frames.rotateY);
  if (rotateX !== undefined || rotateY !== undefined) {
    keyframe.transform = `perspective(${DEFAULT_PERSPECTIVE}) rotateX(${Number(rotateX ?? 0)}deg) rotateY(${Number(rotateY ?? 0)}deg)`;
  }

  // Passthrough arbitrary properties for WAAPI (e.g. strokeDashoffset)
  for (const key in frames) {
    if (KNOWN_KEYS.has(key)) continue;
    const arr = frames[key];
    const val = getVal(arr);
    if (val !== undefined) {
      (keyframe as Record<string, unknown>)[key] = val;
    }
  }

  return keyframe;
}

export function composeKeyframeAt(frames: MoveKeyframes, index: number): ComposedKeyframe {
  return buildKeyframe(frames, (arr) => getValAt(arr, index));
}

export function composeInterpolatedKeyframe(
  frames: MoveKeyframes,
  i1: number,
  i2: number,
  p: number,
): ComposedKeyframe {
  return buildKeyframe(frames, (arr) => getInterpolated(arr, i1, i2, p));
}

export function composeInitialStyle(frames: MoveKeyframes): ComposedKeyframe {
  return buildKeyframe(frames, (arr) => (arr && arr.length > 0 ? arr[0] : undefined));
}

export function composeFinalStyle(frames: MoveKeyframes): ComposedKeyframe {
  return buildKeyframe(frames, (arr) => (arr && arr.length > 0 ? arr[arr.length - 1] : undefined));
}

/**
 * Converts a composed keyframe into a single `transform` string.
 * Used when composing on top of an existing base transform.
 */
function keyframeToTransform(keyframe: ComposedKeyframe, base: TransformState): string {
  const state: TransformState = { ...base };
  const explicitTransform = keyframe.transform;
  const hasExplicit3d = explicitTransform !== undefined;

  if (keyframe.translate) {
    const parts = keyframe.translate.split(' ').map((p) => parseFloat(p));
    state.translateX += parts[0] ?? 0;
    state.translateY += parts[1] ?? 0;
  }

  if (keyframe.scale) {
    const parts = keyframe.scale.split(' ').map((p) => parseFloat(p));
    const sx = parts[0] ?? 1;
    const sy = parts[1] ?? sx;
    state.scaleX *= sx;
    state.scaleY *= sy;
  }

  if (keyframe.rotate) {
    state.rotate += parseFloat(keyframe.rotate);
  }

  if (hasExplicit3d) {
    // rotateX/Y are already expressed as a transform string; parse and add.
    const rxMatch = /rotateX\(([^)]+)\)/.exec(explicitTransform);
    const ryMatch = /rotateY\(([^)]+)\)/.exec(explicitTransform);
    if (rxMatch) state.rotateX += parseFloat(rxMatch[1]);
    if (ryMatch) state.rotateY += parseFloat(ryMatch[1]);
  }

  // When the keyframe defines 3d rotation, always emit perspective and the
  // rotation functions so every keyframe has the same transform structure.
  // This avoids WAAPI mismatch errors when animating from/to zero values.
  if (hasExplicit3d) {
    const parts: string[] = [`perspective(1200px)`];
    if (state.translateX !== 0 || state.translateY !== 0) {
      parts.push(`translate(${state.translateX}px, ${state.translateY}px)`);
    }
    if (state.rotate !== 0) parts.push(`rotate(${state.rotate}deg)`);
    parts.push(`rotateX(${state.rotateX}deg)`);
    parts.push(`rotateY(${state.rotateY}deg)`);
    if (state.scaleX !== 1 || state.scaleY !== 1) {
      parts.push(
        state.scaleX === state.scaleY
          ? `scale(${state.scaleX})`
          : `scale(${state.scaleX}, ${state.scaleY})`,
      );
    }
    return parts.join(' ');
  }

  return formatTransform(state);
}

function hasTransformConflict(frames: MoveKeyframes, keyframes: ComposedKeyframe[]): boolean {
  const hasAtomic =
    frames.x || frames.y || frames.scale || frames.scaleX || frames.scaleY || frames.rotate;
  const hasTransform = frames.rotateX || frames.rotateY || keyframes.some((kf) => kf.transform);
  return !!(hasAtomic && hasTransform);
}

function shouldComposeWithBase(
  el: Element,
  frames: MoveKeyframes,
  keyframes: ComposedKeyframe[],
): boolean {
  const inlineTransform = (el as HTMLElement).style.transform;
  if (inlineTransform && inlineTransform !== 'none') return true;
  return hasTransformConflict(frames, keyframes);
}

/**
 * Composes already-built keyframes on top of an element's base transform.
 * Used by SpringPlayer which generates keyframes through interpolation.
 */
export function composeKeyframesWithBase(el: Element, keyframes: ComposedKeyframe[]): Keyframe[] {
  if (keyframes.length === 0) return [];

  const inlineTransform = (el as HTMLElement).style.transform;
  const hasTransform = keyframes.some((kf) => kf.transform);
  const hasAtomic = keyframes.some((kf) => kf.translate || kf.scale || kf.rotate);

  if (!((inlineTransform && inlineTransform !== 'none') || (hasAtomic && hasTransform))) {
    return keyframes as Keyframe[];
  }

  const base = readTransformState(el);

  return keyframes.map((kf) => {
    const result: Keyframe = {};

    if (kf.opacity !== undefined) (result as Record<string, unknown>)['opacity'] = kf.opacity;
    if (kf.filter !== undefined) (result as Record<string, unknown>)['filter'] = kf.filter;
    (result as Record<string, unknown>)['transform'] = keyframeToTransform(kf, base);

    for (const key in kf) {
      if (['opacity', 'translate', 'scale', 'rotate', 'transform', 'filter'].includes(key))
        continue;
      const val = (kf as Record<string, unknown>)[key];
      if (val !== undefined) {
        (result as Record<string, unknown>)[key] = val;
      }
    }

    return result;
  });
}

/**
 * Generates WAAPI-compatible keyframes for a specific element.
 * If the element already has an inline `transform`, or if the frames mix
 * atomic transform properties with 3D rotation, all transform-related values
 * are composed into a single `transform` string so they do not fight with the
 * element's existing transform state.
 */
export function composeElementKeyframes(el: Element, frames: MoveKeyframes): Keyframe[] {
  let maxLength = 0;
  for (const key in frames) {
    const arr = frames[key as keyof MoveKeyframes];
    if (Array.isArray(arr)) {
      maxLength = Math.max(maxLength, arr.length);
    }
  }

  if (maxLength === 0) return [];

  const keyframes: ComposedKeyframe[] = [];
  for (let i = 0; i < maxLength; i++) {
    keyframes.push(composeKeyframeAt(frames, i));
  }

  const useComposedTransform = shouldComposeWithBase(el, frames, keyframes);
  const base = useComposedTransform ? readTransformState(el) : null;

  return keyframes.map((kf) => {
    if (!useComposedTransform) return kf as Keyframe;

    const result: Keyframe = {};

    if (kf.opacity !== undefined) (result as Record<string, unknown>)['opacity'] = kf.opacity;
    if (kf.filter !== undefined) (result as Record<string, unknown>)['filter'] = kf.filter;
    (result as Record<string, unknown>)['transform'] = keyframeToTransform(kf, base!);

    // Passthrough arbitrary non-transform properties.
    for (const key in kf) {
      if (['opacity', 'translate', 'scale', 'rotate', 'transform', 'filter'].includes(key))
        continue;
      const val = (kf as Record<string, unknown>)[key];
      if (val !== undefined) {
        (result as Record<string, unknown>)[key] = val;
      }
    }

    return result;
  });
}

const KNOWN_STYLE_KEYS = new Set([
  'opacity',
  'translate',
  'scale',
  'rotate',
  'transform',
  'filter',
]);

const FRAME_TO_STYLE_KEYS: Record<string, readonly string[]> = {
  opacity: ['opacity'],
  x: ['translate'],
  y: ['translate'],
  scale: ['scale'],
  scaleX: ['scale'],
  scaleY: ['scale'],
  rotate: ['rotate'],
  rotateX: ['transform'],
  rotateY: ['transform'],
  blur: ['filter'],
};

export function applyComposedStyle(el: Element, style: ComposedKeyframe): void {
  const styledEl = el as HTMLElement;
  if (style.opacity !== undefined) styledEl.style.opacity = `${style.opacity}`;
  if (style.translate !== undefined) styledEl.style.translate = style.translate;
  if (style.scale !== undefined) styledEl.style.scale = style.scale;
  if (style.rotate !== undefined) styledEl.style.rotate = style.rotate;
  if (style.transform !== undefined) styledEl.style.transform = style.transform;
  if (style.filter !== undefined) styledEl.style.filter = style.filter;

  // Passthrough arbitrary properties (e.g. strokeDashoffset)
  for (const key in style) {
    if (KNOWN_STYLE_KEYS.has(key)) continue;
    const val = (style as Record<string, unknown>)[key];
    if (val !== undefined) {
      (styledEl.style as unknown as Record<string, string>)[key] = String(val);
    }
  }
}

export function clearComposedStyle(el: Element, extraKeys?: readonly string[]): void {
  const styledEl = el as HTMLElement;

  if (!extraKeys) {
    styledEl.style.opacity = '';
    styledEl.style.translate = '';
    styledEl.style.scale = '';
    styledEl.style.rotate = '';
    styledEl.style.transform = '';
    styledEl.style.filter = '';
    return;
  }

  const styleKeys = new Set<string>();

  for (const key of extraKeys) {
    const mapped = FRAME_TO_STYLE_KEYS[key];
    if (mapped) {
      for (const styleKey of mapped) {
        styleKeys.add(styleKey);
      }
    } else {
      styleKeys.add(key);
    }
  }

  for (const key of styleKeys) {
    if (key === 'opacity') styledEl.style.opacity = '';
    else if (key === 'translate') styledEl.style.translate = '';
    else if (key === 'scale') styledEl.style.scale = '';
    else if (key === 'rotate') styledEl.style.rotate = '';
    else if (key === 'transform') styledEl.style.transform = '';
    else if (key === 'filter') styledEl.style.filter = '';
    else {
      (styledEl.style as unknown as Record<string, string>)[key] = '';
    }
  }
}

/**
 * Stamps explicit offsets onto composed keyframes.
 *
 * Without this, WAAPI spaces keyframes evenly, so `{ x: [0, 100, 0] }` sweeps out and back at a
 * constant rate and can never dwell. Returns `null` — and warns — when the offsets do not describe
 * a usable timeline, so the caller can fall back to even spacing instead of throwing.
 */
export function applyKeyframeTimes(
  keyframes: Keyframe[],
  times: readonly number[],
): Keyframe[] | null {
  if (keyframes.length === 0) return null;

  if (times.length !== keyframes.length) {
    movementWarn(
      `transition.times must have one entry per keyframe (got ${times.length} for ` +
        `${keyframes.length} keyframes). Falling back to even spacing.`,
    );
    return null;
  }

  for (let i = 0; i < times.length; i += 1) {
    if (times[i] < 0 || times[i] > 1) {
      movementWarn(
        'transition.times values must be between 0 and 1. Falling back to even spacing.',
      );
      return null;
    }
    if (i > 0 && times[i] < times[i - 1]) {
      movementWarn('transition.times values must be ascending. Falling back to even spacing.');
      return null;
    }
  }

  return keyframes.map((keyframe, index) => ({ ...keyframe, offset: times[index] }));
}
