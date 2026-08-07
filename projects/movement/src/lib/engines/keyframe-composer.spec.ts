import { MoveKeyframes } from '../presets/presets.types';
import {
  applyComposedStyle,
  clearComposedStyle,
  composeElementKeyframes,
  composeInitialStyle,
  composeInterpolatedKeyframe,
  composeKeyframeAt,
  composeKeyframesWithBase,
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

    it('applies arbitrary properties via inline styles', () => {
      const style = composeInitialStyle({ strokeDashoffset: [24, 0] });
      applyComposedStyle(el, style);
      expect((el.style as unknown as Record<string, string>)['strokeDashoffset']).toBe('24');
    });

    it('clears composed styles including known properties', () => {
      applyComposedStyle(el, { opacity: 0, translate: '10px 0px' });
      clearComposedStyle(el);
      expect(el.style.opacity).toBe('');
      expect(el.style.translate).toBe('');
    });

    it('clears arbitrary properties when extraKeys are provided', () => {
      const style = composeInitialStyle({ strokeDashoffset: [24, 0] });
      applyComposedStyle(el, style);
      expect((el.style as unknown as Record<string, string>)['strokeDashoffset']).toBe('24');
      clearComposedStyle(el, ['strokeDashoffset']);
      expect((el.style as unknown as Record<string, string>)['strokeDashoffset']).toBe('');
    });

    it('clears only style properties represented by provided frame keys', () => {
      el.style.transform = 'rotate(12deg)';
      el.style.translate = '24px 0px';

      clearComposedStyle(el, ['x']);

      expect(el.style.translate).toBe('');
      expect(el.style.transform).toBe('rotate(12deg)');
    });
  });

  describe('composeElementKeyframes', () => {
    let el: HTMLElement;

    beforeEach(() => {
      el = document.createElement('div');
    });

    it('uses atomic transform properties by default', () => {
      const frames: MoveKeyframes = { x: [0, 100], opacity: [0, 1] };
      const keyframes = composeElementKeyframes(el, frames);
      expect(keyframes[0]).toEqual(expect.objectContaining({ translate: '0px 0px', opacity: 0 }));
      expect(keyframes[1]).toEqual(expect.objectContaining({ translate: '100px 0px', opacity: 1 }));
    });

    it('composes on top of an existing inline transform', () => {
      el.style.transform = 'translate(10px, 20px)';
      const frames: MoveKeyframes = { x: [0, 100], opacity: [0, 1] };
      const keyframes = composeElementKeyframes(el, frames);

      expect((keyframes[0] as Record<string, unknown>)['transform']).toBe('translate(10px, 20px)');
      expect((keyframes[1] as Record<string, unknown>)['transform']).toBe('translate(110px, 20px)');
      expect(keyframes[0]['opacity']).toBe(0);
    });

    it('falls back to a composed transform when atomic and 3d transforms mix', () => {
      const frames: MoveKeyframes = { x: [0, 100], rotateX: [0, 45], opacity: [0, 1] };
      const keyframes = composeElementKeyframes(el, frames);

      const first = (keyframes[0] as Record<string, unknown>)['transform'] as string;
      const last = (keyframes[1] as Record<string, unknown>)['transform'] as string;

      expect(first).toContain('perspective(1200px)');
      expect(first).toContain('rotateX(0deg)');
      expect(last).toContain('rotateX(45deg)');
      expect(last).toContain('translate(100px, 0px)');
    });

    it('multiplies scale onto an existing base scale instead of replacing it', () => {
      el.style.transform = 'scale(2)';
      const frames: MoveKeyframes = { scale: [1, 1.5] };
      const keyframes = composeElementKeyframes(el, frames);

      // 2 × 1 = 2 at the start, 2 × 1.5 = 3 at the end.
      expect((keyframes[0] as Record<string, unknown>)['transform']).toContain('scale(2)');
      expect((keyframes[1] as Record<string, unknown>)['transform']).toContain('scale(3)');
    });

    it('adds rotation onto an existing base rotation', () => {
      el.style.transform = 'rotate(45deg)';
      const frames: MoveKeyframes = { rotate: [0, 90] };
      const keyframes = composeElementKeyframes(el, frames);

      expect((keyframes[0] as Record<string, unknown>)['transform']).toContain('rotate(45deg)');
      expect((keyframes[1] as Record<string, unknown>)['transform']).toContain('rotate(135deg)');
    });

    it('carries non-transform properties through the composed path', () => {
      el.style.transform = 'translate(10px, 0px)';
      const frames: MoveKeyframes = { x: [0, 50], opacity: [0, 1], blur: [4, 0] };
      const keyframes = composeElementKeyframes(el, frames);

      expect(keyframes[0]['opacity']).toBe(0);
      expect((keyframes[0] as Record<string, unknown>)['filter']).toContain('blur');
      expect((keyframes[1] as Record<string, unknown>)['transform']).toContain('60px');
    });

    it('returns no keyframes for an empty frame set', () => {
      expect(composeElementKeyframes(el, {})).toEqual([]);
    });
  });

  describe('composeKeyframesWithBase', () => {
    let el: HTMLElement;

    beforeEach(() => {
      el = document.createElement('div');
    });

    it('returns pre-built keyframes untouched when there is nothing to compose', () => {
      const keyframes = [{ opacity: 0 }, { opacity: 1 }];
      expect(composeKeyframesWithBase(el, keyframes)).toBe(keyframes);
    });

    it('composes interpolated keyframes on top of the base transform', () => {
      el.style.transform = 'translate(30px, 0px)';
      const keyframes = [{ translate: '0px 0px' }, { translate: '100px 0px' }];

      const result = composeKeyframesWithBase(el, keyframes) as Record<string, unknown>[];

      // SpringPlayer generates its keyframes by interpolation; they must land in the same
      // composed space as the WAAPI path or the spring would jump on start.
      expect(result[0]['transform']).toContain('30px');
      expect(result[1]['transform']).toContain('130px');
    });

    it('preserves opacity, filter and arbitrary properties while composing', () => {
      el.style.transform = 'translate(10px, 0px)';
      const keyframes = [
        { translate: '0px 0px', opacity: 0, filter: 'blur(4px)', strokeDashoffset: 10 },
        { translate: '20px 0px', opacity: 1, filter: 'blur(0px)', strokeDashoffset: 0 },
      ] as unknown as Parameters<typeof composeKeyframesWithBase>[1];

      const result = composeKeyframesWithBase(el, keyframes) as Record<string, unknown>[];

      expect(result[0]['opacity']).toBe(0);
      expect(result[0]['filter']).toBe('blur(4px)');
      expect(result[0]['strokeDashoffset']).toBe(10);
      expect(result[1]['transform']).toContain('30px');
    });

    it('returns an empty array for no keyframes', () => {
      expect(composeKeyframesWithBase(el, [])).toEqual([]);
    });
  });

  describe('applyComposedStyle — full property set', () => {
    it('writes every known channel it is given', () => {
      const el = document.createElement('div');

      applyComposedStyle(el, {
        opacity: 0.5,
        translate: '10px 20px',
        scale: '1.5',
        rotate: '45deg',
        filter: 'blur(2px)',
      });

      expect(el.style.opacity).toBe('0.5');
      expect(el.style.translate).toBe('10px 20px');
      expect(el.style.scale).toBe('1.5');
      expect(el.style.rotate).toBe('45deg');
      expect(el.style.filter).toBe('blur(2px)');
    });

    it('writes a composed transform when given one', () => {
      const el = document.createElement('div');

      applyComposedStyle(el, { transform: 'translate(5px, 5px) scale(2)' });

      expect(el.style.transform).toBe('translate(5px, 5px) scale(2)');
    });
  });

  describe('clearComposedStyle — targeted clearing', () => {
    it('clears the transform channel when given a 3d frame key', () => {
      const el = document.createElement('div');
      el.style.transform = 'perspective(1200px) rotateX(45deg)';
      el.style.opacity = '0.5';

      clearComposedStyle(el, ['rotateX']);

      expect(el.style.transform).toBe('');
      // Untouched channels must survive — interaction directives clear only what they animated.
      expect(el.style.opacity).toBe('0.5');
    });

    it('maps scaleX/scaleY frame keys onto the scale channel', () => {
      const el = document.createElement('div');
      el.style.scale = '1.5 2';
      el.style.translate = '10px 0px';

      clearComposedStyle(el, ['scaleX']);

      expect(el.style.scale).toBe('');
      expect(el.style.translate).toBe('10px 0px');
    });

    it('clears arbitrary non-transform properties by name', () => {
      const el = document.createElement('div');
      el.style.strokeDashoffset = '20';

      clearComposedStyle(el, ['strokeDashoffset']);

      expect(el.style.strokeDashoffset).toBe('');
    });
  });
});
