import { composeTransitionKeyframes } from './transition-composer';
import { MovementConfig } from '../tokens/movement.tokens';

describe('composeTransitionKeyframes', () => {
  const baseConfig: MovementConfig = {
    duration: 300,
    easing: 'ease',
    delay: 0,
    disabled: false,
    iterations: 1,
  };

  it('returns null when no per-property overrides exist', () => {
    const result = composeTransitionKeyframes({ opacity: [0, 1] }, { duration: 300 }, baseConfig);
    expect(result).toBeNull();
  });

  it('returns null when all properties share the same timing', () => {
    const result = composeTransitionKeyframes(
      { opacity: [0, 1], x: [0, 100] },
      { duration: 300, easing: 'ease', delay: 0 },
      baseConfig,
    );
    expect(result).toBeNull();
  });

  it('generates keyframes with offsets when durations differ', () => {
    const result = composeTransitionKeyframes(
      { opacity: [0, 1], pathLength: [0, 1] },
      { duration: 600, opacity: { duration: 200 } },
      baseConfig,
    );

    expect(result).not.toBeNull();
    const kfs = result!.keyframes;
    expect(kfs.length).toBeGreaterThan(0);
    expect(kfs[0]).toHaveProperty('offset', 0);
    expect(kfs[kfs.length - 1]).toHaveProperty('offset', 1);

    // Opacity should reach final value earlier than pathLength
    const opacityFinal = kfs.find((k) => (k as Record<string, unknown>)['opacity'] === 1);
    expect(opacityFinal).toBeDefined();
    expect((opacityFinal as Keyframe).offset).toBeLessThanOrEqual(1 / 3 + 0.01);
  });

  it('generates keyframes with offsets when delays differ', () => {
    const result = composeTransitionKeyframes(
      { opacity: [0, 1], scale: [0.5, 1] },
      { duration: 300, opacity: { delay: 100 } },
      baseConfig,
    );

    expect(result).not.toBeNull();
    const kfs = result!.keyframes;
    // First keyframe at t=0 should have scale started but opacity still at initial
    const first = kfs[0];
    expect((first as Record<string, unknown>)['scale']).toBe(0.5);
  });

  it('handles three-value arrays with different durations', () => {
    const result = composeTransitionKeyframes(
      { opacity: [0, 0.72, 0], pathLength: [0, 1] },
      { duration: 760, opacity: { duration: 300, delay: 100 } },
      baseConfig,
    );

    expect(result).not.toBeNull();
    expect(result!.duration).toBe(760);
    const kfs = result!.keyframes;
    expect(kfs.length).toBeGreaterThanOrEqual(3);
  });

  it('warns in dev mode when easings differ', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
      /* suppress */
    });

    composeTransitionKeyframes(
      { opacity: [0, 1], x: [0, 100] },
      { duration: 300, opacity: { easing: 'linear' } },
      baseConfig,
    );

    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Per-property easing differences are not supported yet'),
      );
    }

    warnSpy.mockRestore();
  });
});
