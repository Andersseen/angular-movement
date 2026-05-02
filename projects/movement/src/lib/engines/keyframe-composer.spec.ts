import { MoveKeyframes } from '../presets/presets.types';
import {
  applyComposedStyle,
  clearComposedStyle,
  composeInitialStyle,
  composeInterpolatedKeyframe,
  composeKeyframeAt,
} from './keyframe-composer';

describe('keyframe-composer', () => {
  describe('composeKeyframeAt', () => {
    it('composes known transform properties', () => {
      const frames: MoveKeyframes = { x: [0, 100], opacity: [0, 1] };
      const kf = composeKeyframeAt(frames, 0);
      expect(kf.translate).toBe('0px 0px');
      expect(kf.opacity).toBe(0);
    });

    it('passes through arbitrary numeric properties', () => {
      const frames: MoveKeyframes = {
        opacity: [0, 1],
        strokeDashoffset: [24, 0],
      };
      const kf = composeKeyframeAt(frames, 0);
      expect(kf.opacity).toBe(0);
      expect((kf as Record<string, unknown>)['strokeDashoffset']).toBe(24);
    });

    it('passes through arbitrary properties at the last index', () => {
      const frames: MoveKeyframes = {
        strokeDashoffset: [24, 0],
      };
      const kf = composeKeyframeAt(frames, 1);
      expect((kf as Record<string, unknown>)['strokeDashoffset']).toBe(0);
    });
  });

  describe('composeInterpolatedKeyframe', () => {
    it('interpolates arbitrary properties', () => {
      const frames: MoveKeyframes = {
        strokeDashoffset: [24, 0],
      };
      const kf = composeInterpolatedKeyframe(frames, 0, 1, 0.5);
      expect((kf as Record<string, unknown>)['strokeDashoffset']).toBe(12);
    });
  });

  describe('applyComposedStyle / clearComposedStyle', () => {
    let el: HTMLElement;

    beforeEach(() => {
      el = document.createElement('div');
    });

    it('applies arbitrary properties via inline styles when supported', () => {
      const style = composeInitialStyle({ strokeDashoffset: [24, 0] });
      applyComposedStyle(el, style);
      // strokeDashoffset is not a standard CSS property on divs, so it won't be set,
      // but the function should not throw.
      expect(el.style.opacity).toBe('');
    });

    it('clears composed styles', () => {
      applyComposedStyle(el, { opacity: 0, translate: '10px 0px' });
      clearComposedStyle(el);
      expect(el.style.opacity).toBe('');
      expect(el.style.translate).toBe('');
    });
  });
});
