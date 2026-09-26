import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { vi } from 'vitest';
import { AnimationEngine } from './animation-engine.service';
import { provideMovement } from '../providers/provide-movement';

describe('AnimationEngine', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should be created', () => {
    TestBed.configureTestingModule({ providers: [provideMovement()] });
    const engine = TestBed.inject(AnimationEngine);
    expect(engine).toBeTruthy();
  });

  it('should return null on server platform', () => {
    TestBed.configureTestingModule({
      providers: [provideMovement(), { provide: PLATFORM_ID, useValue: 'server' }],
    });
    const engine = TestBed.inject(AnimationEngine);
    const host = document.createElement('div');

    const result = engine.play(host, { opacity: [0, 1] });
    expect(result).toBeNull();
  });

  it('should return null when disabled and apply final styles', () => {
    TestBed.configureTestingModule({
      providers: [provideMovement({ disabled: true })],
    });
    const engine = TestBed.inject(AnimationEngine);
    const host = document.createElement('div');

    const result = engine.play(host, { opacity: [0, 1] }, { disabled: true });
    expect(result).toBeNull();
    expect(host.style.opacity).toBe('1');
  });

  it('should create a SpringPlayer when spring config is provided', () => {
    TestBed.configureTestingModule({ providers: [provideMovement()] });
    const engine = TestBed.inject(AnimationEngine);
    const host = document.createElement('div');

    const animateSpy = vi.fn().mockReturnValue({
      addEventListener: vi.fn(),
      play: vi.fn(),
      pause: vi.fn(),
      cancel: vi.fn(),
      currentTime: 0,
      playState: 'running',
      commitStyles: vi.fn(),
    });
    (host as HTMLElement).animate = animateSpy;

    const result = engine.play(
      host,
      { opacity: [0, 1] },
      { spring: { stiffness: 200, damping: 20 } },
    );
    expect(result).toBeTruthy();
    expect(animateSpy).toHaveBeenCalled();
    const keyframes = animateSpy.mock.calls[0][0] as Keyframe[];
    expect(keyframes.length).toBeGreaterThan(0);
  });

  it('should create a WaapiPlayer when no spring is provided', () => {
    TestBed.configureTestingModule({ providers: [provideMovement()] });
    const engine = TestBed.inject(AnimationEngine);
    const host = document.createElement('div');

    const animateSpy = vi.fn().mockReturnValue({
      addEventListener: vi.fn(),
      play: vi.fn(),
      pause: vi.fn(),
      cancel: vi.fn(),
      currentTime: 0,
      playState: 'running',
      commitStyles: vi.fn(),
    });
    (host as HTMLElement).animate = animateSpy;

    const result = engine.play(host, { opacity: [0, 1] });
    expect(result).toBeTruthy();
    expect(animateSpy).toHaveBeenCalled();
  });

  it('should prepare SVG stroke draw styles before animating strokeDashoffset', () => {
    TestBed.configureTestingModule({ providers: [provideMovement()] });
    const engine = TestBed.inject(AnimationEngine);
    const host = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    Object.defineProperty(host, 'getTotalLength', {
      value: vi.fn().mockReturnValue(42),
    });

    const animateSpy = vi.fn().mockReturnValue({
      addEventListener: vi.fn(),
      play: vi.fn(),
      pause: vi.fn(),
      cancel: vi.fn(),
      currentTime: 0,
      playState: 'running',
      commitStyles: vi.fn(),
    });
    (host as SVGElement).animate = animateSpy;

    const result = engine.play(host, { strokeDashoffset: [42, 0] });

    expect(result).toBeTruthy();
    expect(host.style.strokeDasharray).toBe('42');
    expect(host.style.strokeDashoffset).toBe('42');
    expect(animateSpy).toHaveBeenCalled();
  });

  it('should fall back to a default SVG stroke length when getTotalLength fails', () => {
    TestBed.configureTestingModule({ providers: [provideMovement()] });
    const engine = TestBed.inject(AnimationEngine);
    const host = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    Object.defineProperty(host, 'getTotalLength', {
      value: vi.fn(() => {
        throw new Error('not measurable');
      }),
    });

    const animateSpy = vi.fn().mockReturnValue({
      addEventListener: vi.fn(),
      play: vi.fn(),
      pause: vi.fn(),
      cancel: vi.fn(),
      currentTime: 0,
      playState: 'running',
      commitStyles: vi.fn(),
    });
    (host as SVGElement).animate = animateSpy;

    engine.play(host, { strokeDashoffset: [28, 0] });

    expect(host.style.strokeDasharray).toBe('28');
    expect(host.style.strokeDashoffset).toBe('28');
  });

  it('should validate invalid spring values and fall back to defaults', () => {
    TestBed.configureTestingModule({ providers: [provideMovement()] });
    const engine = TestBed.inject(AnimationEngine);
    const host = document.createElement('div');

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
      /* suppress dev warnings in tests */
    });

    const animateSpy = vi.fn().mockReturnValue({
      addEventListener: vi.fn(),
      play: vi.fn(),
      pause: vi.fn(),
      cancel: vi.fn(),
      currentTime: 0,
      playState: 'running',
      commitStyles: vi.fn(),
    });
    (host as HTMLElement).animate = animateSpy;

    // Use ngDevMode guard path - the test environment may or may not have ngDevMode
    const result = engine.play(
      host,
      { opacity: [0, 1] },
      {
        spring: { stiffness: -100, damping: -5, mass: 0 },
      },
    );
    expect(result).toBeTruthy();
    warnSpy.mockRestore();
  });

  it('should convert pathLength to strokeDasharray and strokeDashoffset', () => {
    TestBed.configureTestingModule({ providers: [provideMovement()] });
    const engine = TestBed.inject(AnimationEngine);
    const host = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    Object.defineProperty(host, 'getTotalLength', {
      value: vi.fn().mockReturnValue(100),
    });

    const animateSpy = vi.fn().mockReturnValue({
      addEventListener: vi.fn(),
      play: vi.fn(),
      pause: vi.fn(),
      cancel: vi.fn(),
      currentTime: 0,
      playState: 'running',
      commitStyles: vi.fn(),
    });
    (host as SVGElement).animate = animateSpy;

    engine.play(host, { pathLength: [0, 1] });

    expect(host.style.strokeDasharray).toBe('0 100');
    expect(host.style.strokeDashoffset).toBe('0');

    const keyframes = animateSpy.mock.calls[0][0] as Keyframe[];
    const first = keyframes[0] as Record<string, unknown>;
    expect(first['strokeDasharray']).toBe('0 100');
    expect(Math.abs(first['strokeDashoffset'] as number)).toBe(0);

    const last = keyframes[keyframes.length - 1] as Record<string, unknown>;
    expect(last['strokeDasharray']).toBe('100 100');
    expect(Math.abs(last['strokeDashoffset'] as number)).toBe(0);
  });

  it('should convert pathOffset to strokeDashoffset', () => {
    TestBed.configureTestingModule({ providers: [provideMovement()] });
    const engine = TestBed.inject(AnimationEngine);
    const host = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    Object.defineProperty(host, 'getTotalLength', {
      value: vi.fn().mockReturnValue(100),
    });

    const animateSpy = vi.fn().mockReturnValue({
      addEventListener: vi.fn(),
      play: vi.fn(),
      pause: vi.fn(),
      cancel: vi.fn(),
      currentTime: 0,
      playState: 'running',
      commitStyles: vi.fn(),
    });
    (host as SVGElement).animate = animateSpy;

    engine.play(host, { pathOffset: [0, 0.5] });

    const keyframes = animateSpy.mock.calls[0][0] as Keyframe[];
    const first = keyframes[0] as Record<string, unknown>;
    expect(Math.abs(first['strokeDashoffset'] as number)).toBe(0);

    const last = keyframes[keyframes.length - 1] as Record<string, unknown>;
    expect(last['strokeDashoffset']).toBe(-50);
  });

  it('should support per-property transitions via WaapiPlayer', () => {
    TestBed.configureTestingModule({ providers: [provideMovement()] });
    const engine = TestBed.inject(AnimationEngine);
    const host = document.createElement('div');

    const animateSpy = vi.fn().mockReturnValue({
      addEventListener: vi.fn(),
      play: vi.fn(),
      pause: vi.fn(),
      cancel: vi.fn(),
      currentTime: 0,
      playState: 'running',
      commitStyles: vi.fn(),
    });
    (host as HTMLElement).animate = animateSpy;

    engine.play(
      host,
      { opacity: [0, 1], x: [0, 100] },
      {
        transition: { duration: 600, opacity: { duration: 200 } },
      },
    );

    expect(animateSpy).toHaveBeenCalled();
    const options = animateSpy.mock.calls[0][1] as KeyframeAnimationOptions;
    expect(options.duration).toBe(600);

    const keyframes = animateSpy.mock.calls[0][0] as Keyframe[];
    expect(keyframes.length).toBeGreaterThan(0);
    expect(keyframes[0]).toHaveProperty('offset');
  });

  it('should support pathLength with opacity per-property transitions for SVG drawing', () => {
    TestBed.configureTestingModule({ providers: [provideMovement()] });
    const engine = TestBed.inject(AnimationEngine);
    const host = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    Object.defineProperty(host, 'getTotalLength', {
      value: vi.fn().mockReturnValue(120),
    });

    const animateSpy = vi.fn().mockReturnValue({
      addEventListener: vi.fn(),
      play: vi.fn(),
      pause: vi.fn(),
      cancel: vi.fn(),
      currentTime: 0,
      playState: 'running',
      commitStyles: vi.fn(),
    });
    (host as SVGElement).animate = animateSpy;

    engine.play(
      host,
      { pathLength: [0, 1], opacity: [0, 1] },
      {
        transition: { duration: 700, opacity: { duration: 200 } },
      },
    );

    expect(animateSpy).toHaveBeenCalled();
    const keyframes = animateSpy.mock.calls[0][0] as Keyframe[];
    const first = keyframes[0] as Record<string, unknown>;
    const last = keyframes[keyframes.length - 1] as Record<string, unknown>;

    expect(first['strokeDasharray']).toBe('0 120');
    expect(last['strokeDasharray']).toBe('120 120');
    expect(Math.abs(first['strokeDashoffset'] as number)).toBe(0);
    expect(Math.abs(last['strokeDashoffset'] as number)).toBe(0);
    expect(last['opacity']).toBe(1);
  });

  it('should support pathOffset with opacity per-property transitions for SVG drawing', () => {
    TestBed.configureTestingModule({ providers: [provideMovement()] });
    const engine = TestBed.inject(AnimationEngine);
    const host = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    Object.defineProperty(host, 'getTotalLength', {
      value: vi.fn().mockReturnValue(120),
    });

    const animateSpy = vi.fn().mockReturnValue({
      addEventListener: vi.fn(),
      play: vi.fn(),
      pause: vi.fn(),
      cancel: vi.fn(),
      currentTime: 0,
      playState: 'running',
      commitStyles: vi.fn(),
    });
    (host as SVGElement).animate = animateSpy;

    engine.play(
      host,
      { pathOffset: [0, 0.5], opacity: [0, 1] },
      {
        transition: { duration: 700, opacity: { duration: 200 } },
      },
    );

    expect(animateSpy).toHaveBeenCalled();
    const keyframes = animateSpy.mock.calls[0][0] as Keyframe[];
    const first = keyframes[0] as Record<string, unknown>;
    const last = keyframes[keyframes.length - 1] as Record<string, unknown>;

    expect(first['strokeDasharray']).toBe('120 120');
    expect(last['strokeDasharray']).toBe('120 120');
    expect(Math.abs(first['strokeDashoffset'] as number)).toBe(0);
    expect(last['strokeDashoffset']).toBe(-60);
    expect(last['opacity']).toBe(1);
  });

  describe('final styles when animations are disabled', () => {
    // This is the reduced-motion contract: no animation runs, but the element must still end up
    // in the animation's final visual state.

    it('applies the last keyframe using the atomic transform properties', () => {
      TestBed.configureTestingModule({ providers: [provideMovement()] });
      const engine = TestBed.inject(AnimationEngine);
      const host = document.createElement('div');

      engine.play(host, { opacity: [0, 0.5], x: [0, 40], scale: [1, 1.5] }, { disabled: true });

      expect(host.style.opacity).toBe('0.5');
      // With no pre-existing transform the engine writes `translate`/`scale`, not `transform`.
      expect(host.style.translate).toBe('40px 0px');
      expect(host.style.scale).toBe('1.5');
      expect(host.style.transform).toBe('');
    });

    it('switches to a composed `transform` when the host already has one', () => {
      TestBed.configureTestingModule({ providers: [provideMovement()] });
      const engine = TestBed.inject(AnimationEngine);
      const host = document.createElement('div');
      host.style.transform = 'translate(100px, 0px)';

      engine.play(host, { x: [0, 40] }, { disabled: true });

      // 100px base + 40px final keyframe — the base must not be discarded. The engine deliberately
      // switches channels here: mixing atomic `translate` with an existing `transform` would apply
      // both, doubling the offset.
      expect(host.style.transform).toContain('140px');
      expect(host.style.translate).toBe('');
    });

    it('commits camelCase properties on a host that already has a transform', () => {
      TestBed.configureTestingModule({ providers: [provideMovement()] });
      const engine = TestBed.inject(AnimationEngine);
      const host = document.createElement('div');
      host.style.transform = 'translate(100px, 0px)';

      engine.play(host, { x: [0, 40], strokeDashoffset: [24, 0] }, { disabled: true });

      // `style.setProperty('strokeDashoffset', …)` is a silent no-op — only the camelCase
      // assignment lands. Reduced motion must still reach the SVG end state.
      expect(host.style.strokeDashoffset).toBe('0');
      expect(host.style.transform).toContain('140px');
    });

    it('still reports done through onDone when disabled', () => {
      TestBed.configureTestingModule({ providers: [provideMovement()] });
      const engine = TestBed.inject(AnimationEngine);
      const host = document.createElement('div');
      const onDone = vi.fn();

      const result = engine.play(host, { opacity: [0, 1] }, { disabled: true, onDone });

      expect(result).toBeNull();
      expect(onDone).toHaveBeenCalledTimes(1);
    });

    it('still reports done through onDone on the server', () => {
      TestBed.configureTestingModule({
        providers: [provideMovement(), { provide: PLATFORM_ID, useValue: 'server' }],
      });
      const engine = TestBed.inject(AnimationEngine);
      const onDone = vi.fn();

      engine.play(document.createElement('div'), { opacity: [0, 1] }, { onDone });

      // Callers chain view removal off onDone; skipping it on the server would strand the view.
      expect(onDone).toHaveBeenCalledTimes(1);
    });
  });

  describe('SVG path length resolution', () => {
    it('falls back to the default length for non-SVG hosts', () => {
      TestBed.configureTestingModule({ providers: [provideMovement()] });
      const engine = TestBed.inject(AnimationEngine);
      const host = document.createElement('div');
      const animateSpy = vi.fn().mockReturnValue({ addEventListener: vi.fn(), cancel: vi.fn() });
      (host as unknown as { animate: unknown }).animate = animateSpy;

      engine.play(host, { pathLength: [0, 1] });

      const keyframes = animateSpy.mock.calls[0][0] as Record<string, unknown>[];
      // 28 is the documented fallback length.
      expect(keyframes[0]['strokeDasharray']).toBe('0 28');
      expect(keyframes[1]['strokeDasharray']).toBe('28 28');
    });

    it('seeds strokeDashoffset from pathLength before the animation starts', () => {
      TestBed.configureTestingModule({ providers: [provideMovement()] });
      const engine = TestBed.inject(AnimationEngine);

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      (path as unknown as { getTotalLength: () => number }).getTotalLength = () => 200;
      (path as unknown as { animate: unknown }).animate = vi
        .fn()
        .mockReturnValue({ addEventListener: vi.fn(), cancel: vi.fn() });

      engine.play(path, { pathLength: [0.25, 1] });

      // Without this seed the path flashes fully drawn on the first frame.
      expect(path.style.strokeDasharray).toBe('50 200');
    });
  });
});

describe('AnimationEngine transition.times', () => {
  function hostWithAnimateSpy(): { host: HTMLElement; animate: ReturnType<typeof vi.fn> } {
    const host = document.createElement('div');
    const animate = vi.fn(() => ({
      cancel: vi.fn(),
      pause: vi.fn(),
      play: vi.fn(),
      commitStyles: vi.fn(),
      addEventListener: vi.fn(),
      currentTime: 0,
      playState: 'running',
    }));
    (host as unknown as { animate: unknown }).animate = animate;
    return { host, animate };
  }

  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('passes explicit offsets through to WAAPI', () => {
    TestBed.configureTestingModule({ providers: [provideMovement()] });
    const { host, animate } = hostWithAnimateSpy();

    TestBed.inject(AnimationEngine).play(
      host,
      { x: [0, 100, 0] },
      { transition: { times: [0, 0.8, 1] } },
    );

    const keyframes = animate.mock.calls[0][0] as Keyframe[];
    expect(keyframes.map((frame) => frame.offset)).toEqual([0, 0.8, 1]);
  });

  it('falls back to even spacing when the offsets do not match the keyframes', () => {
    TestBed.configureTestingModule({ providers: [provideMovement()] });
    const { host, animate } = hostWithAnimateSpy();

    TestBed.inject(AnimationEngine).play(
      host,
      { x: [0, 100, 0] },
      { transition: { times: [0, 1] } },
    );

    const keyframes = animate.mock.calls[0][0] as Keyframe[];
    // Unusable offsets must not produce a broken timeline; WAAPI spaces them itself.
    expect(keyframes.every((frame) => frame.offset === undefined)).toBe(true);
  });
});

describe('AnimationEngine per-property easing', () => {
  function hostWithAnimateSpy(): { host: HTMLElement; animate: ReturnType<typeof vi.fn> } {
    const host = document.createElement('div');
    const animate = vi.fn(() => ({
      cancel: vi.fn(),
      pause: vi.fn(),
      play: vi.fn(),
      commitStyles: vi.fn(),
      addEventListener: vi.fn(),
      currentTime: 0,
      playState: 'running',
    }));
    (host as unknown as { animate: unknown }).animate = animate;
    return { host, animate };
  }

  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('runs properties with different easings as separate animations', () => {
    TestBed.configureTestingModule({ providers: [provideMovement()] });
    const { host, animate } = hostWithAnimateSpy();

    const controls = TestBed.inject(AnimationEngine).play(
      host,
      { opacity: [0, 1], x: [0, 40] },
      { transition: { opacity: { easing: 'linear' }, x: { easing: 'ease-out' } } },
    );

    expect(controls).toBeTruthy();
    // One WAAPI animation cannot carry two easings, so this must be two.
    expect(animate).toHaveBeenCalledTimes(2);

    const easings = animate.mock.calls.map((call) => (call[1] as KeyframeAnimationOptions).easing);
    expect(easings.sort()).toEqual(['ease-out', 'linear']);
  });

  it('never lets a non-transform group write transform', () => {
    TestBed.configureTestingModule({ providers: [provideMovement()] });
    const { host, animate } = hostWithAnimateSpy();
    // A pre-existing transform is what makes the composer want to emit one everywhere.
    host.style.transform = 'translate(10px, 0px)';

    TestBed.inject(AnimationEngine).play(
      host,
      { opacity: [0, 1], x: [0, 40] },
      { transition: { opacity: { easing: 'linear' }, x: { easing: 'ease-out' } } },
    );

    const writesTransform = animate.mock.calls.filter((call) =>
      (call[0] as Keyframe[]).some((frame) => 'transform' in frame),
    );
    // Two animations writing `transform` would clobber each other.
    expect(writesTransform).toHaveLength(1);
  });

  it('keeps a single animation when all easings agree', () => {
    TestBed.configureTestingModule({ providers: [provideMovement()] });
    const { host, animate } = hostWithAnimateSpy();

    TestBed.inject(AnimationEngine).play(
      host,
      { opacity: [0, 1], x: [0, 40] },
      { transition: { easing: 'linear' } },
    );

    expect(animate).toHaveBeenCalledTimes(1);
  });
  describe('pseudoElement', () => {
    const PSEUDO = '::view-transition-new(root)';
    const view = document.defaultView as unknown as Record<string, unknown>;
    let originalKeyframeEffect: unknown;

    function supportPseudoElements(supported: boolean) {
      view['KeyframeEffect'] = supported
        ? class {
            // Real browsers expose it as a prototype accessor, which is what feature detection sees
            // — a readonly field would live on the instance and fail detection.
            // eslint-disable-next-line @typescript-eslint/class-literal-property-style
            get pseudoElement(): string | null {
              return null;
            }
          }
        : class {};
    }

    function stubAnimation(host: Element) {
      const listeners = new Map<string, () => void>();
      const animation = {
        addEventListener: vi.fn((type: string, listener: () => void) => {
          listeners.set(type, listener);
        }),
        play: vi.fn(),
        pause: vi.fn(),
        cancel: vi.fn(),
        commitStyles: vi.fn(),
        currentTime: 0,
        playState: 'running',
        fire: (type: string) => listeners.get(type)?.(),
      };
      const animate = vi.fn().mockReturnValue(animation);
      (host as HTMLElement).animate = animate;
      return { animate, animation };
    }

    beforeEach(() => {
      originalKeyframeEffect = view['KeyframeEffect'];
      TestBed.configureTestingModule({ providers: [provideMovement()] });
    });

    afterEach(() => {
      view['KeyframeEffect'] = originalKeyframeEffect;
      vi.restoreAllMocks();
    });

    it('passes pseudoElement to WAAPI with plain keyframes and backwards fill', () => {
      supportPseudoElements(true);
      const engine = TestBed.inject(AnimationEngine);
      const host = document.createElement('div');
      const { animate } = stubAnimation(host);

      engine.play(
        host,
        { clipPath: ['circle(0px at 10px 10px)', 'circle(900px at 10px 10px)'] },
        {
          pseudoElement: PSEUDO,
          config: { duration: 520, easing: 'ease-out', delay: 0, disabled: false },
        },
      );

      const [keyframes, timing] = animate.mock.calls[0];
      expect(keyframes).toEqual([
        { clipPath: 'circle(0px at 10px 10px)' },
        { clipPath: 'circle(900px at 10px 10px)' },
      ]);
      expect(timing).toEqual(
        expect.objectContaining({
          pseudoElement: PSEUDO,
          duration: 520,
          easing: 'ease-out',
          fill: 'backwards',
        }),
      );
    });

    it('never commits styles on finish — a pseudo-element has no inline style', async () => {
      supportPseudoElements(true);
      const engine = TestBed.inject(AnimationEngine);
      const host = document.createElement('div');
      const { animation } = stubAnimation(host);
      const onDone = vi.fn();

      const controls = engine.play(host, { opacity: [0, 1] }, { pseudoElement: PSEUDO, onDone });
      animation.fire('finish');
      await controls?.finished;

      expect(animation.commitStyles).not.toHaveBeenCalled();
      expect(animation.cancel).not.toHaveBeenCalled();
      expect(onDone).toHaveBeenCalledTimes(1);
      expect(host.style.opacity).toBe('');
    });

    it('settles when the View Transition is skipped and cancels the animation', async () => {
      supportPseudoElements(true);
      const engine = TestBed.inject(AnimationEngine);
      const host = document.createElement('div');
      const { animation } = stubAnimation(host);

      const controls = engine.play(host, { opacity: [0, 1] }, { pseudoElement: PSEUDO });
      animation.fire('cancel');

      await expect(controls?.finished).resolves.toBeUndefined();
    });

    it('skips the animation entirely when disabled / reduced motion, touching no styles', () => {
      supportPseudoElements(true);
      const engine = TestBed.inject(AnimationEngine);
      const host = document.createElement('div');
      const { animate } = stubAnimation(host);
      const onDone = vi.fn();

      const result = engine.play(
        host,
        { opacity: [0, 1] },
        { pseudoElement: PSEUDO, disabled: true, onDone },
      );

      expect(result).toBeNull();
      expect(animate).not.toHaveBeenCalled();
      // The "final style" path must not run: it would write opacity onto the real element.
      expect(host.style.opacity).toBe('');
      expect(onDone).toHaveBeenCalledTimes(1);
    });

    it('no-ops without throwing where pseudo-element animation is unsupported', () => {
      supportPseudoElements(false);
      const engine = TestBed.inject(AnimationEngine);
      const host = document.createElement('div');
      const { animate } = stubAnimation(host);

      const result = engine.play(host, { opacity: [0, 1] }, { pseudoElement: PSEUDO });

      // Crucially the host itself is not animated as a fallback.
      expect(result).toBeNull();
      expect(animate).not.toHaveBeenCalled();
    });

    it('no-ops without throwing when the browser rejects the selector', () => {
      supportPseudoElements(true);
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const engine = TestBed.inject(AnimationEngine);
      const host = document.createElement('div');
      (host as HTMLElement).animate = vi.fn(() => {
        throw new DOMException("'::view-transition-new(root)' is not a valid", 'SyntaxError');
      });
      const onDone = vi.fn();

      expect(() =>
        engine.play(host, { opacity: [0, 1] }, { pseudoElement: PSEUDO, onDone }),
      ).not.toThrow();
      expect(onDone).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('Could not animate pseudo-element'),
      );
    });

    it('warns that springs are not applied, and still animates with WAAPI timing', () => {
      supportPseudoElements(true);
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const engine = TestBed.inject(AnimationEngine);
      const host = document.createElement('div');
      const { animate } = stubAnimation(host);

      engine.play(host, { opacity: [0, 1] }, { pseudoElement: PSEUDO, spring: { stiffness: 200 } });

      expect(animate).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('not applied to pseudo-elements'));
    });

    it('honours repeat from transition, and warns only about per-property timing', () => {
      supportPseudoElements(true);
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const engine = TestBed.inject(AnimationEngine);
      const host = document.createElement('div');
      const { animate } = stubAnimation(host);

      engine.play(
        host,
        { opacity: [0, 1] },
        { pseudoElement: PSEUDO, transition: { repeat: 3, repeatType: 'reverse' } },
      );
      expect(animate.mock.calls[0][1]).toEqual(
        expect.objectContaining({ iterations: 3, direction: 'alternate' }),
      );
      expect(warn).not.toHaveBeenCalled();

      engine.play(
        host,
        { opacity: [0, 1] },
        {
          pseudoElement: PSEUDO,
          transition: { opacity: { duration: 100 } },
        },
      );
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('not applied to pseudo-elements'));
    });

    it('does not claim the host as its active player', async () => {
      supportPseudoElements(true);
      const { cancelActivePlayer } = await import('./active-player-registry');
      const engine = TestBed.inject(AnimationEngine);
      const host = document.createElement('div');
      const { animation } = stubAnimation(host);

      engine.play(host, { opacity: [0, 1] }, { pseudoElement: PSEUDO });
      cancelActivePlayer(host);

      // A drag or MoveAnimator.set() on the real element must not kill a View Transition.
      expect(animation.cancel).not.toHaveBeenCalled();
    });
  });

  describe('arbitrary CSS properties', () => {
    it('pass straight through to WAAPI keyframes without being enumerated', () => {
      TestBed.configureTestingModule({ providers: [provideMovement()] });
      const engine = TestBed.inject(AnimationEngine);
      const host = document.createElement('div');
      const animate = vi.fn().mockReturnValue({
        addEventListener: vi.fn(),
        play: vi.fn(),
        pause: vi.fn(),
        cancel: vi.fn(),
        currentTime: 0,
        playState: 'running',
      });
      (host as HTMLElement).animate = animate;

      engine.play(host, {
        clipPath: ['inset(0 100% 0 0)', 'inset(0 0% 0 0)'],
        filter: ['saturate(0)', 'saturate(1)'],
        borderRadius: ['0px', '24px'],
        backgroundColor: ['rgb(0, 0, 0)', 'rgb(255, 0, 0)'],
      });

      expect(animate.mock.calls[0][0]).toEqual([
        {
          clipPath: 'inset(0 100% 0 0)',
          filter: 'saturate(0)',
          borderRadius: '0px',
          backgroundColor: 'rgb(0, 0, 0)',
        },
        {
          clipPath: 'inset(0 0% 0 0)',
          filter: 'saturate(1)',
          borderRadius: '24px',
          backgroundColor: 'rgb(255, 0, 0)',
        },
      ]);
    });

    it('commit their end state when motion is disabled', () => {
      TestBed.configureTestingModule({ providers: [provideMovement()] });
      const engine = TestBed.inject(AnimationEngine);
      const host = document.createElement('div');

      engine.play(
        host,
        { clipPath: ['inset(50%)', 'inset(0%)'], borderRadius: ['0px', '24px'] },
        { disabled: true },
      );

      expect(host.style.clipPath).toBe('inset(0%)');
      expect(host.style.borderRadius).toBe('24px');
    });
  });
});
