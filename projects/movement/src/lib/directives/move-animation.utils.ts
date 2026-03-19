import { MoveKeyframes, MovePreset } from '../presets/presets.types';
import { MOVE_PRESETS } from '../presets/presets';
import { MovementConfig } from '../tokens/movement.tokens';

export type MovePhase = 'enter' | 'leave';

export type MoveDirectiveInput = MovePreset | MoveKeyframes;

export interface MoveInputOverrides {
  duration?: number;
  easing?: string;
  delay?: number;
  disabled?: boolean;
}

export function resolveMovementConfig(
  defaults: MovementConfig,
  overrides: MoveInputOverrides,
  reducedMotion: boolean,
): MovementConfig {
  if (reducedMotion && typeof ngDevMode !== 'undefined' && ngDevMode) {
    console.warn(
      '[Movement] Animations disabled: prefers-reduced-motion is active. ' +
      'Disable "Reduce motion" in your OS accessibility settings to see animations.'
    );
  }

  return {
    duration: Math.max(0, overrides.duration ?? defaults.duration),
    easing: overrides.easing ?? defaults.easing,
    delay: Math.max(0, overrides.delay ?? defaults.delay),
    disabled: reducedMotion || (overrides.disabled ?? defaults.disabled),
  };
}

export function resolveMoveFrames(value: MoveDirectiveInput, phase: MovePhase): MoveKeyframes {
  if (typeof value === 'string') {
    return MOVE_PRESETS[value][phase];
  }

  return value;
}

export function prefersReducedMotion(documentRef: Document): boolean {
  const view = documentRef.defaultView;
  if (!view || typeof view.matchMedia !== 'function') {
    return false;
  }

  return view.matchMedia('(prefers-reduced-motion: reduce)').matches;
}


export function createLeaveClone(documentRef: Document, source: HTMLElement): HTMLElement | null {
  const sourceRect = source.getBoundingClientRect();
  if (sourceRect.width === 0 || sourceRect.height === 0) {
    return null;
  }

  const cloned = source.cloneNode(true) as HTMLElement;
  const sourceStyle = documentRef.defaultView?.getComputedStyle(source);
  cloned.style.position = 'fixed';
  cloned.style.left = `${sourceRect.left}px`;
  cloned.style.top = `${sourceRect.top}px`;
  cloned.style.width = `${sourceRect.width}px`;
  cloned.style.height = `${sourceRect.height}px`;
  cloned.style.margin = '0';
  cloned.style.pointerEvents = 'none';
  cloned.style.transformOrigin = sourceStyle?.transformOrigin ?? 'center';
  cloned.style.boxSizing = sourceStyle?.boxSizing ?? 'border-box';
  cloned.style.zIndex = '2147483647';

  documentRef.body.appendChild(cloned);
  return cloned;
}
