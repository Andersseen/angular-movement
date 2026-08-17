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
    expect((first as Record<string, unknown>)['scale']).toBe('0.5');
  });

  it('composes x/y transitions into WAAPI translate keyframes', () => {
    const result = composeTransitionKeyframes(
      { x: [0, 80], y: [0, -24], opacity: [0, 1] },
      { duration: 500, x: { duration: 250 }, y: { delay: 100 } },
      baseConfig,
    );

    expect(result).not.toBeNull();
    const first = result!.keyframes[0] as Record<string, unknown>;
    expect(first['translate']).toBe('0px 0px');
    expect(first['x']).toBeUndefined();
    expect(first['y']).toBeUndefined();

    const last = result!.keyframes[result!.keyframes.length - 1] as Record<string, unknown>;
    expect(last['translate']).toBe('80px -24px');
  });

  it('composes scale and rotate transitions through the normal keyframe composer', () => {
    const result = composeTransitionKeyframes(
      { scale: [0.8, 1], rotate: [-12, 0], opacity: [0, 1] },
      { duration: 480, scale: { duration: 160 }, rotate: { delay: 80 } },
      baseConfig,
    );

    expect(result).not.toBeNull();
    const first = result!.keyframes[0] as Record<string, unknown>;
    expect(first['scale']).toBe('0.8');
    expect(first['rotate']).toBe('-12deg');

    const last = result!.keyframes[result!.keyframes.length - 1] as Record<string, unknown>;
    expect(last['scale']).toBe('1');
    expect(last['rotate']).toBe('0deg');
  });

  it('composes scaleX/scaleY transitions into WAAPI scale keyframes', () => {
    const result = composeTransitionKeyframes(
      { scaleX: [0.75, 1], scaleY: [1.25, 1], opacity: [0, 1] },
      { duration: 500, scaleX: { duration: 200 }, scaleY: { delay: 100 } },
      baseConfig,
    );

    expect(result).not.toBeNull();
    const first = result!.keyframes[0] as Record<string, unknown>;
    expect(first['scale']).toBe('0.75 1.25');
    expect(first['scaleX']).toBeUndefined();
    expect(first['scaleY']).toBeUndefined();

    const last = result!.keyframes[result!.keyframes.length - 1] as Record<string, unknown>;
    expect(last['scale']).toBe('1 1');
  });

  it('composes rotateX/rotateY transitions into WAAPI transform keyframes', () => {
    const result = composeTransitionKeyframes(
      { rotateX: [-45, 0], rotateY: [0, 20], opacity: [0, 1] },
      { duration: 500, rotateX: { duration: 200 }, rotateY: { delay: 100 } },
      baseConfig,
    );

    expect(result).not.toBeNull();
    const first = result!.keyframes[0] as Record<string, unknown>;
    expect(first['transform']).toBe('perspective(1200px) rotateX(-45deg) rotateY(0deg)');
    expect(first['rotateX']).toBeUndefined();
    expect(first['rotateY']).toBeUndefined();

    const last = result!.keyframes[result!.keyframes.length - 1] as Record<string, unknown>;
    expect(last['transform']).toBe('perspective(1200px) rotateX(0deg) rotateY(20deg)');
  });

  it('composes blur transitions into WAAPI filter keyframes', () => {
    const result = composeTransitionKeyframes(
      { blur: [12, 0], opacity: [0, 1] },
      { duration: 400, blur: { duration: 160 } },
      baseConfig,
    );

    expect(result).not.toBeNull();
    expect(result!.keyframes[0]).toMatchObject({ filter: 'blur(12px)' });
    expect(result!.keyframes[result!.keyframes.length - 1]).toMatchObject({
      filter: 'blur(0px)',
    });
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

  it('preserves string SVG dash values instead of coercing them to numbers', () => {
    const result = composeTransitionKeyframes(
      {
        opacity: [0, 1],
        strokeDasharray: ['0 120', '120 120'],
        strokeDashoffset: [0, -24],
      },
      { duration: 600, opacity: { duration: 200 } },
      baseConfig,
    );

    expect(result).not.toBeNull();
    const first = result!.keyframes[0] as Record<string, unknown>;
    const last = result!.keyframes[result!.keyframes.length - 1] as Record<string, unknown>;

    expect(first['strokeDasharray']).toBe('0 120');
    expect(last['strokeDasharray']).toBe('120 120');
    expect(result!.keyframes).not.toContainEqual(
      expect.objectContaining({ strokeDasharray: Number.NaN }),
    );
  });

  it('preserves discrete CSS string properties during interpolation', () => {
    const result = composeTransitionKeyframes(
      {
        opacity: [0, 1],
        clipPath: ['inset(0% 0% 100% 0%)', 'inset(0% 0% 0% 0%)'],
      },
      { duration: 600, opacity: { duration: 200 } },
      baseConfig,
    );

    expect(result).not.toBeNull();
    const first = result!.keyframes[0] as Record<string, unknown>;
    const middle = result!.keyframes.find((keyframe) => keyframe.offset === 1 / 3) as Record<
      string,
      unknown
    >;
    const last = result!.keyframes[result!.keyframes.length - 1] as Record<string, unknown>;

    expect(first['clipPath']).toBe('inset(0% 0% 100% 0%)');
    expect(middle['clipPath']).toBe('inset(0% 0% 100% 0%)');
    expect(last['clipPath']).toBe('inset(0% 0% 0% 0%)');
  });

  it('warns in dev mode that transform channels cannot have separate easings', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
      /* suppress */
    });

    // Independent properties are split into their own animations by `groupByEasing` before this
    // composer runs, so reaching this branch means the clash is inside the transform channels —
    // which compose into one `transform` string and genuinely cannot be split.
    composeTransitionKeyframes(
      { x: [0, 100], scale: [1, 2] },
      { duration: 300, x: { easing: 'linear' } },
      baseConfig,
    );

    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('share a single easing because they compose'),
      );
    }

    warnSpy.mockRestore();
  });
});
