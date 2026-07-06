import {
  applyComposedTransform,
  formatTransform,
  readTransformState,
  resetTransformToBase,
} from './transform-state';

describe('transform-state', () => {
  let el: HTMLElement;

  beforeEach(() => {
    el = document.createElement('div');
  });

  describe('readTransformState', () => {
    it('returns default state when no transform is set', () => {
      const state = readTransformState(el);
      expect(state).toEqual({
        translateX: 0,
        translateY: 0,
        scaleX: 1,
        scaleY: 1,
        rotate: 0,
        rotateX: 0,
        rotateY: 0,
      });
    });

    it('parses translate from inline transform', () => {
      el.style.transform = 'translate(10px, 20px)';
      const state = readTransformState(el);
      expect(state.translateX).toBe(10);
      expect(state.translateY).toBe(20);
    });

    it('parses scale from inline transform', () => {
      el.style.transform = 'scale(1.5, 2)';
      const state = readTransformState(el);
      expect(state.scaleX).toBe(1.5);
      expect(state.scaleY).toBe(2);
    });

    it('parses uniform scale', () => {
      el.style.transform = 'scale(0.5)';
      const state = readTransformState(el);
      expect(state.scaleX).toBe(0.5);
      expect(state.scaleY).toBe(0.5);
    });

    it('parses rotate and 3d rotations', () => {
      el.style.transform = 'rotate(45deg) rotateX(10deg) rotateY(20deg)';
      const state = readTransformState(el);
      expect(state.rotate).toBe(45);
      expect(state.rotateX).toBe(10);
      expect(state.rotateY).toBe(20);
    });
  });

  describe('formatTransform', () => {
    it('returns none for default state', () => {
      expect(formatTransform(readTransformState(el))).toBe('none');
    });

    it('formats translate only', () => {
      expect(
        formatTransform({
          translateX: 10,
          translateY: 20,
          scaleX: 1,
          scaleY: 1,
          rotate: 0,
          rotateX: 0,
          rotateY: 0,
        }),
      ).toBe('translate(10px, 20px)');
    });

    it('includes perspective when 3d rotation is present', () => {
      const formatted = formatTransform({
        translateX: 0,
        translateY: 0,
        scaleX: 1,
        scaleY: 1,
        rotate: 0,
        rotateX: 10,
        rotateY: 0,
      });
      expect(formatted).toContain('perspective(1200px)');
      expect(formatted).toContain('rotateX(10deg)');
    });
  });

  describe('applyComposedTransform', () => {
    it('applies a translate delta on top of the current transform', () => {
      el.style.transform = 'translate(5px, 5px)';
      applyComposedTransform(el, { translateX: 10, translateY: 20 });
      expect(el.style.transform).toBe('translate(15px, 25px)');
    });

    it('multiplies scale on top of the current transform', () => {
      el.style.transform = 'scale(2)';
      applyComposedTransform(el, { scaleX: 1.5, scaleY: 1.5 });
      expect(el.style.transform).toBe('scale(3)');
    });

    it('uses an explicit base state when provided', () => {
      el.style.transform = 'translate(100px, 100px)';
      applyComposedTransform(
        el,
        { translateX: 10, translateY: 20 },
        { translateX: 0, translateY: 0, scaleX: 1, scaleY: 1, rotate: 0, rotateX: 0, rotateY: 0 },
      );
      expect(el.style.transform).toBe('translate(10px, 20px)');
    });
  });

  describe('resetTransformToBase', () => {
    it('restores the inline transform to the provided base state', () => {
      el.style.transform = 'translate(50px, 50px)';
      resetTransformToBase(el, {
        translateX: 5,
        translateY: 10,
        scaleX: 1,
        scaleY: 1,
        rotate: 0,
        rotateX: 0,
        rotateY: 0,
      });
      expect(el.style.transform).toBe('translate(5px, 10px)');
    });
  });
});
