import {
  moveIconBounce,
  moveIconPulse,
  moveIconRotate,
  moveIconShake,
  movePathDraw,
} from './icon-helpers';

describe('icon helpers', () => {
  it('movePathDraw returns a path-drawing keyframe pair', () => {
    expect(movePathDraw()).toEqual({ pathLength: [0, 1], opacity: [0, 1] });
  });

  it('movePathDraw lets overrides win over the defaults', () => {
    expect(movePathDraw({ opacity: [1, 1] })).toEqual({ pathLength: [0, 1], opacity: [1, 1] });
  });

  it('moveIconPulse returns a scale/opacity pulse', () => {
    expect(moveIconPulse()).toEqual({ scale: [1, 1.08, 1], opacity: [1, 0.85, 1] });
  });

  it('moveIconBounce returns a vertical bounce', () => {
    expect(moveIconBounce()).toEqual({ y: [0, -3, 0] });
  });

  it('moveIconShake returns a rotational shake', () => {
    expect(moveIconShake()).toEqual({ rotate: [0, -8, 8, -8, 8, 0] });
  });

  it('moveIconRotate returns a rotation sweep', () => {
    expect(moveIconRotate()).toEqual({ rotate: [0, 15, 0] });
  });

  it('every helper still lets overrides win, not just movePathDraw', () => {
    expect(moveIconPulse({ scale: [2, 2] })).toEqual({ scale: [2, 2], opacity: [1, 0.85, 1] });
    expect(moveIconBounce({ y: [0, -10, 0] })).toEqual({ y: [0, -10, 0] });
  });
});
