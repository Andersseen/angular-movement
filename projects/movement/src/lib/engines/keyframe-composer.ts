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

export function applyComposedStyle(el: HTMLElement, style: ComposedKeyframe): void {
  if (style.opacity !== undefined) el.style.opacity = `${style.opacity}`;
  if (style.translate !== undefined) el.style.translate = style.translate;
  if (style.scale !== undefined) el.style.scale = style.scale;
  if (style.rotate !== undefined) el.style.rotate = style.rotate;
  if (style.transform !== undefined) el.style.transform = style.transform;
  if (style.filter !== undefined) el.style.filter = style.filter;
}

export function clearComposedStyle(el: HTMLElement): void {
  el.style.opacity = '';
  el.style.translate = '';
  el.style.scale = '';
  el.style.rotate = '';
  el.style.transform = '';
  el.style.filter = '';
}
