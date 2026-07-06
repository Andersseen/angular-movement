/**
 * Helpers for reading and writing composed CSS transforms.
 *
 * The library animates transform-related properties through several channels:
 * - WAAPI keyframes composed from `x`, `y`, `scale`, `rotate`, etc.
 * - Direct drag positioning (`moveDrag`).
 * - FLIP layout animations (`moveLayout`).
 *
 * To avoid these channels fighting over inline styles, every channel writes a
 * single `transform` string that preserves whatever base transform the element
 * already had. This is a pragmatic, WAAPI-compatible composition strategy:
 * one canonical `transform` property instead of a mix of `translate` / `scale`
 * / `rotate` atomics and `transform`.
 */

export interface TransformState {
  translateX: number;
  translateY: number;
  scaleX: number;
  scaleY: number;
  rotate: number;
  rotateX: number;
  rotateY: number;
}

const DEFAULT_STATE: TransformState = {
  translateX: 0,
  translateY: 0,
  scaleX: 1,
  scaleY: 1,
  rotate: 0,
  rotateX: 0,
  rotateY: 0,
};

const TRANSLATE_RE = /translate(?:3d)?\(([^)]+)\)/i;
const SCALE_RE = /scale(?:3d)?\(([^)]+)\)/i;
const ROTATE_RE = /rotate\(([^)]+)\)/i;
const ROTATE_X_RE = /rotateX\(([^)]+)\)/i;
const ROTATE_Y_RE = /rotateY\(([^)]+)\)/i;

function parseNumber(value: string): number {
  const n = parseFloat(value);
  return Number.isNaN(n) ? 0 : n;
}

function parseTranslate(match: string): { x: number; y: number } {
  const parts = match.split(',').map((p) => parseNumber(p.trim()));
  return {
    x: parts[0] ?? 0,
    y: parts[1] ?? 0,
  };
}

function parseScale(match: string): { x: number; y: number } {
  const parts = match.split(',').map((p) => parseNumber(p.trim()));
  return {
    x: parts[0] ?? 1,
    y: parts[1] ?? parts[0] ?? 1,
  };
}

/**
 * Reads the current transform state from an element.
 * Prefers inline `transform`, then falls back to computed style, then zero.
 */
export function readTransformState(el: Element): TransformState {
  const styledEl = el as HTMLElement;
  const raw = styledEl.style.transform || getComputedStyle(styledEl).transform;

  if (!raw || raw === 'none') {
    return { ...DEFAULT_STATE };
  }

  // getComputedStyle returns a matrix; we only parse raw transform strings here.
  if (!raw.includes('(')) {
    return { ...DEFAULT_STATE };
  }

  const state = { ...DEFAULT_STATE };

  const translateMatch = TRANSLATE_RE.exec(raw);
  if (translateMatch) {
    const t = parseTranslate(translateMatch[1]);
    state.translateX = t.x;
    state.translateY = t.y;
  }

  const scaleMatch = SCALE_RE.exec(raw);
  if (scaleMatch) {
    const s = parseScale(scaleMatch[1]);
    state.scaleX = s.x;
    state.scaleY = s.y;
  }

  const rotateMatch = ROTATE_RE.exec(raw);
  if (rotateMatch) {
    state.rotate = parseNumber(rotateMatch[1]);
  }

  const rotateXMatch = ROTATE_X_RE.exec(raw);
  if (rotateXMatch) {
    state.rotateX = parseNumber(rotateXMatch[1]);
  }

  const rotateYMatch = ROTATE_Y_RE.exec(raw);
  if (rotateYMatch) {
    state.rotateY = parseNumber(rotateYMatch[1]);
  }

  return state;
}

/**
 * Builds a canonical `transform` string from a transform state.
 */
export function formatTransform(state: TransformState): string {
  const parts: string[] = [];

  if (state.rotateX !== 0 || state.rotateY !== 0) {
    parts.push(`perspective(1200px)`);
  }

  if (state.translateX !== 0 || state.translateY !== 0) {
    parts.push(`translate(${state.translateX}px, ${state.translateY}px)`);
  }

  if (state.rotate !== 0) {
    parts.push(`rotate(${state.rotate}deg)`);
  }

  if (state.rotateX !== 0) {
    parts.push(`rotateX(${state.rotateX}deg)`);
  }

  if (state.rotateY !== 0) {
    parts.push(`rotateY(${state.rotateY}deg)`);
  }

  if (state.scaleX !== 1 || state.scaleY !== 1) {
    if (state.scaleX === state.scaleY) {
      parts.push(`scale(${state.scaleX})`);
    } else {
      parts.push(`scale(${state.scaleX}, ${state.scaleY})`);
    }
  }

  return parts.length > 0 ? parts.join(' ') : 'none';
}

/**
 * Applies a composed transform to an element, preserving its base transform state.
 * `delta` values are merged on top of the existing base state.
 */
export function applyComposedTransform(
  el: Element,
  delta: Partial<TransformState>,
  base?: TransformState,
): void {
  const state = base ?? readTransformState(el);
  const next: TransformState = {
    translateX: state.translateX + (delta.translateX ?? 0),
    translateY: state.translateY + (delta.translateY ?? 0),
    scaleX: state.scaleX * (delta.scaleX ?? 1),
    scaleY: state.scaleY * (delta.scaleY ?? 1),
    rotate: state.rotate + (delta.rotate ?? 0),
    rotateX: state.rotateX + (delta.rotateX ?? 0),
    rotateY: state.rotateY + (delta.rotateY ?? 0),
  };

  (el as HTMLElement).style.transform = formatTransform(next);
}

/**
 * Resets the inline transform to the base state (without any delta).
 * Useful when a drag finishes and the animation engine takes over.
 */
export function resetTransformToBase(el: Element, base: TransformState): void {
  (el as HTMLElement).style.transform = formatTransform(base);
}

/**
 * Returns true if the element currently has any inline transform set by us.
 */
export function hasInlineTransform(el: Element): boolean {
  return !!(el as HTMLElement).style.transform;
}
