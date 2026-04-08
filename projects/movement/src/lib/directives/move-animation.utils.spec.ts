import {
  applyInitialStyles,
  clearInitialStyles,
  prefersReducedMotion,
  resolveMovementConfig,
  resolveMoveFrames,
  reverseFrames,
} from './move-animation.utils';
import { MOVEMENT_DEFAULTS } from '../tokens/movement.tokens';
import { MoveKeyframes } from '../presets/presets.types';

describe('move-animation.utils', () => {
  // ─── reverseFrames ──────────────────────────────────────────────────────────

  describe('reverseFrames', () => {
    it('reverses all value arrays in the keyframes object', () => {
      const frames: MoveKeyframes = { opacity: [0, 1], x: [24, 0] };
      expect(reverseFrames(frames)).toEqual({ opacity: [1, 0], x: [0, 24] });
    });

    it('returns a new object (does not mutate the input)', () => {
      const frames: MoveKeyframes = { opacity: [0, 1] };
      const result = reverseFrames(frames);
      expect(result).not.toBe(frames);
      expect(frames.opacity).toEqual([0, 1]); // original untouched
    });

    it('handles an empty keyframes object', () => {
      expect(reverseFrames({})).toEqual({});
    });

    it('handles single-value arrays', () => {
      const frames: MoveKeyframes = { scale: [0.5] };
      expect(reverseFrames(frames)).toEqual({ scale: [0.5] });
    });
  });

  // ─── applyInitialStyles ─────────────────────────────────────────────────────

  describe('applyInitialStyles', () => {
    let el: HTMLElement;

    beforeEach(() => {
      el = document.createElement('div');
    });

    it('sets opacity from the first array value', () => {
      applyInitialStyles(el, { opacity: [0, 1] });
      expect(el.style.opacity).toBe('0');
    });

    it('sets translate from x and y first values', () => {
      applyInitialStyles(el, { x: [24, 0], y: [0, 0] });
      expect(el.style.translate).toBe('24px 0px');
    });

    it('sets scale from the first array value', () => {
      applyInitialStyles(el, { scale: [0.5, 1] });
      expect(el.style.scale).toBe('0.5');
    });

    it('sets perspective transform from rotateX / rotateY', () => {
      applyInitialStyles(el, { rotateX: [-90, 0] });
      expect(el.style.transform).toContain('perspective(1200px)');
      expect(el.style.transform).toContain('rotateX(-90deg)');
    });

    it('does not set style if the property is absent from frames', () => {
      applyInitialStyles(el, {});
      expect(el.style.opacity).toBe('');
      expect(el.style.translate).toBe('');
    });
  });

  // ─── clearInitialStyles ─────────────────────────────────────────────────────

  describe('clearInitialStyles', () => {
    it('resets all tracked inline styles to empty strings', () => {
      const el = document.createElement('div');
      el.style.opacity = '0';
      el.style.translate = '24px 0px';
      el.style.scale = '0.5';
      el.style.transform = 'perspective(1200px) rotateX(-90deg) rotateY(0deg)';

      clearInitialStyles(el);

      expect(el.style.opacity).toBe('');
      expect(el.style.translate).toBe('');
      expect(el.style.scale).toBe('');
      expect(el.style.transform).toBe('');
    });
  });

  // ─── resolveMovementConfig ──────────────────────────────────────────────────

  describe('resolveMovementConfig', () => {
    it('returns defaults when no overrides are provided', () => {
      const result = resolveMovementConfig(MOVEMENT_DEFAULTS, {}, false);
      expect(result).toEqual(MOVEMENT_DEFAULTS);
    });

    it('merges overrides on top of defaults', () => {
      const result = resolveMovementConfig(MOVEMENT_DEFAULTS, { duration: 600, delay: 100 }, false);
      expect(result.duration).toBe(600);
      expect(result.delay).toBe(100);
      expect(result.easing).toBe(MOVEMENT_DEFAULTS.easing);
    });

    it('forces disabled = true when reducedMotion is true', () => {
      const result = resolveMovementConfig(MOVEMENT_DEFAULTS, { disabled: false }, true);
      expect(result.disabled).toBe(true);
    });

    it('clamps negative duration to 0', () => {
      const result = resolveMovementConfig(MOVEMENT_DEFAULTS, { duration: -100 }, false);
      expect(result.duration).toBe(0);
    });

    it('clamps negative delay to 0', () => {
      const result = resolveMovementConfig(MOVEMENT_DEFAULTS, { delay: -50 }, false);
      expect(result.delay).toBe(0);
    });
  });

  // ─── resolveMoveFrames ──────────────────────────────────────────────────────

  describe('resolveMoveFrames', () => {
    it('returns the enter keyframes for a string preset', () => {
      const frames = resolveMoveFrames('fade-up', 'enter');
      expect(frames.opacity).toBeDefined();
      expect(frames.y).toBeDefined();
    });

    it('returns the leave keyframes for a string preset', () => {
      const frames = resolveMoveFrames('fade-up', 'leave');
      expect(frames.opacity?.[0]).toBe(1); // leave starts at full opacity
    });

    it('returns keyframes as-is when a MoveKeyframes object is passed', () => {
      const custom: MoveKeyframes = { scale: [0, 1] };
      expect(resolveMoveFrames(custom, 'enter')).toBe(custom);
    });
  });

  // ─── prefersReducedMotion ───────────────────────────────────────────────────

  describe('prefersReducedMotion', () => {
    it('returns false when matchMedia is not available', () => {
      const doc = { defaultView: null } as unknown as Document;
      expect(prefersReducedMotion(doc)).toBe(false);
    });

    it('returns true when matchMedia reports prefers-reduced-motion: reduce', () => {
      const doc = {
        defaultView: {
          matchMedia: () => ({ matches: true }),
        },
      } as unknown as Document;
      expect(prefersReducedMotion(doc)).toBe(true);
    });

    it('returns false when matchMedia reports no preference', () => {
      const doc = {
        defaultView: {
          matchMedia: () => ({ matches: false }),
        },
      } as unknown as Document;
      expect(prefersReducedMotion(doc)).toBe(false);
    });
  });
});
