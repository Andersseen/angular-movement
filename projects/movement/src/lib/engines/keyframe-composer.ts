import { MoveKeyframes } from '../presets/presets.types';
import { DEFAULT_PERSPECTIVE } from '../constants';

export interface ComposedKeyframe extends Keyframe {
  opacity?: number;
  translate?: string;
  scale?: string;
  rotate?: string;
  filter?: string;
  transform?: string;
}

function getValAt(arr: readonly number[] | undefined, index: number): number | undefined {
  if (!arr || arr.length === 0) return undefined;
  return arr[Math.min(index, arr.length - 1)];
}

function getInterpolated(
  arr: readonly number[] | undefined,
  i1: number,
  i2: number,
  p: number,
): number | undefined {
  if (!arr || arr.length === 0) return undefined;
  const v1 = arr[Math.min(i1, arr.length - 1)];
  const v2 = arr[Math.min(i2, arr.length - 1)];
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
  getVal: (arr: readonly number[] | undefined) => number | undefined,
): ComposedKeyframe {
  const keyframe: ComposedKeyframe = {};

  const opacity = getVal(frames.opacity);
  if (opacity !== undefined) {
    keyframe.opacity = opacity;
  }

  const x = getVal(frames.x);
  const y = getVal(frames.y);
  if (x !== undefined || y !== undefined) {
    keyframe.translate = `${x ?? 0}px ${y ?? 0}px`;
  }

  const scale = getVal(frames.scale);
  if (scale !== undefined) {
    keyframe.scale = `${scale}`;
  } else {
    const scaleX = getVal(frames.scaleX);
    const scaleY = getVal(frames.scaleY);
    if (scaleX !== undefined || scaleY !== undefined) {
      keyframe.scale = `${scaleX ?? 1} ${scaleY ?? 1}`;
    }
  }

  const rotate = getVal(frames.rotate);
  if (rotate !== undefined) {
    keyframe.rotate = `${rotate}deg`;
  }

  const blur = getVal(frames.blur);
  if (blur !== undefined) {
    keyframe.filter = `blur(${blur}px)`;
  }

  const rotateX = getVal(frames.rotateX);
  const rotateY = getVal(frames.rotateY);
  if (rotateX !== undefined || rotateY !== undefined) {
    keyframe.transform = `perspective(${DEFAULT_PERSPECTIVE}) rotateX(${rotateX ?? 0}deg) rotateY(${rotateY ?? 0}deg)`;
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

const KNOWN_STYLE_KEYS = new Set([
  'opacity',
  'translate',
  'scale',
  'rotate',
  'transform',
  'filter',
]);

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
  styledEl.style.opacity = '';
  styledEl.style.translate = '';
  styledEl.style.scale = '';
  styledEl.style.rotate = '';
  styledEl.style.transform = '';
  styledEl.style.filter = '';

  if (extraKeys) {
    for (const key of extraKeys) {
      (styledEl.style as unknown as Record<string, string>)[key] = '';
    }
  }
}
