import { vi } from 'vitest';
import { MovementConfig } from '../tokens/movement.tokens';
import { WaapiPlayer } from './waapi-player';

const baseConfig: MovementConfig = {
  duration: 100,
  easing: 'ease',
  delay: 0,
  disabled: false,
};

function createAnimationMock(): Animation {
  const listeners = new Map<string, EventListener>();
  return {
    play: vi.fn(),
    pause: vi.fn(),
    cancel: vi.fn(),
    commitStyles: vi.fn(),
    addEventListener: vi.fn((type: string, listener: EventListener) => {
      listeners.set(type, listener);
    }),
    get currentTime() {
      return 0;
    },
    set currentTime(_time: CSSNumberish | null) {
      /* test setter */
    },
    get playState() {
      return 'running' as AnimationPlayState;
    },
    dispatchFinish() {
      listeners.get('finish')?.(new Event('finish'));
    },
  } as unknown as Animation & { dispatchFinish: () => void };
}

describe('WaapiPlayer', () => {
  it('resolves immediately when WAAPI is unavailable', async () => {
    const host = document.createElement('div');
    const onDone = vi.fn();

    const player = new WaapiPlayer(host, { opacity: [0, 1] }, baseConfig, onDone);
    await player.finished;

    expect(onDone).toHaveBeenCalledOnce();
  });

  it('plays, pauses, commits final styles, and resolves on finish', async () => {
    const host = document.createElement('div');
    const animation = createAnimationMock() as Animation & { dispatchFinish: () => void };
    const animate = vi.fn(() => animation);
    const onDone = vi.fn();
    Object.defineProperty(host, 'animate', { value: animate });

    const player = new WaapiPlayer(
      host,
      { opacity: [0, 1], x: [0, 24] },
      { ...baseConfig, duration: 250 },
      onDone,
    );
    player.play();
    player.pause();
    animation.dispatchFinish();
    await player.finished;

    expect(animate).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ opacity: 0 })]),
      expect.objectContaining({ duration: 250, fill: 'both', iterations: 1 }),
    );
    expect(animation.play).toHaveBeenCalledOnce();
    expect(animation.pause).toHaveBeenCalledOnce();
    expect(animation.commitStyles).toHaveBeenCalledOnce();
    expect(animation.cancel).toHaveBeenCalledOnce();
    expect(onDone).toHaveBeenCalledOnce();
  });

  it('cancels active animations and resolves finished', async () => {
    const host = document.createElement('div');
    const animation = createAnimationMock();
    Object.defineProperty(host, 'animate', { value: vi.fn(() => animation) });

    const player = new WaapiPlayer(host, [{ opacity: 0 }, { opacity: 1 }], baseConfig);
    player.cancel();
    await player.finished;

    expect(animation.cancel).toHaveBeenCalledOnce();
  });

  it('never fires onDone for an infinite animation', async () => {
    const host = document.createElement('div');
    const animation = createAnimationMock() as Animation & { dispatchFinish: () => void };
    Object.defineProperty(host, 'animate', { value: vi.fn(() => animation) });
    const onDone = vi.fn();

    new WaapiPlayer(host, { opacity: [0, 1] }, { ...baseConfig, iterations: Infinity }, onDone);

    // An infinite animation has no finish event; if one somehow arrives it must not run onDone,
    // which callers use to tear the element down.
    animation.dispatchFinish();
    await Promise.resolve();

    expect(onDone).not.toHaveBeenCalled();
  });

  it('an infinite animation can still be cancelled by the consumer', async () => {
    const host = document.createElement('div');
    const animation = createAnimationMock();
    Object.defineProperty(host, 'animate', { value: vi.fn(() => animation) });

    const player = new WaapiPlayer(
      host,
      { opacity: [0, 1] },
      { ...baseConfig, iterations: Infinity },
    );
    player.cancel();

    await expect(player.finished).resolves.toBeUndefined();
    expect(animation.cancel).toHaveBeenCalledOnce();
  });

  it('passes the iteration count through to WAAPI', () => {
    const host = document.createElement('div');
    const animate = vi.fn(() => createAnimationMock());
    Object.defineProperty(host, 'animate', { value: animate });

    new WaapiPlayer(host, { opacity: [0, 1] }, { ...baseConfig, iterations: 3 });

    expect(animate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ iterations: 3 }),
    );
  });

  it('accepts pre-built keyframe arrays without recomposing them', () => {
    const host = document.createElement('div');
    const animate = vi.fn(() => createAnimationMock());
    Object.defineProperty(host, 'animate', { value: animate });
    const keyframes = [{ opacity: 0 }, { opacity: 1 }];

    new WaapiPlayer(host, keyframes, baseConfig);

    expect(animate).toHaveBeenCalledWith(keyframes, expect.anything());
  });
});

describe('WaapiPlayer repeat controls', () => {
  function spyOnAnimate(host: HTMLElement) {
    const animate = vi.fn(() => createAnimationMock());
    (host as unknown as { animate: unknown }).animate = animate;
    return animate;
  }

  it('plays a single normal-direction cycle by default', () => {
    const host = document.createElement('div');
    const animate = spyOnAnimate(host);

    new WaapiPlayer(host, { opacity: [0, 1] }, baseConfig);

    const [, options] = animate.mock.calls[0] as unknown as [Keyframe[], KeyframeAnimationOptions];
    expect(options.direction).toBe('normal');
    expect(options.iterations).toBe(1);
  });

  it("alternates direction for repeatType 'reverse'", () => {
    const host = document.createElement('div');
    const animate = spyOnAnimate(host);

    new WaapiPlayer(host, { scale: [1, 1.2] }, baseConfig, undefined, {
      repeat: Infinity,
      repeatType: 'reverse',
    });

    const [, options] = animate.mock.calls[0] as unknown as [Keyframe[], KeyframeAnimationOptions];
    // Without `direction` every cycle snapped back to frame 0, so a loop could never yoyo.
    expect(options.direction).toBe('alternate');
    expect(options.iterations).toBe(Infinity);
  });

  it("keeps restarting for repeatType 'loop'", () => {
    const host = document.createElement('div');
    const animate = spyOnAnimate(host);

    new WaapiPlayer(host, { scale: [1, 1.2] }, baseConfig, undefined, {
      repeat: 3,
      repeatType: 'loop',
    });

    const [, options] = animate.mock.calls[0] as unknown as [Keyframe[], KeyframeAnimationOptions];
    expect(options.direction).toBe('normal');
    expect(options.iterations).toBe(3);
  });

  it('bakes repeatDelay into the timeline as a hold on the final value', () => {
    const host = document.createElement('div');
    const animate = spyOnAnimate(host);

    // 100ms of motion + 100ms of hold ⇒ the motion occupies the first half of each 200ms cycle.
    new WaapiPlayer(host, { opacity: [0, 1] }, baseConfig, undefined, {
      repeat: Infinity,
      repeatDelay: 100,
    });

    const [keyframes, options] = animate.mock.calls[0] as unknown as [
      Keyframe[],
      KeyframeAnimationOptions,
    ];

    expect(options.duration).toBe(200);
    expect(keyframes.map((frame) => frame.offset)).toEqual([0, 0.5, 1]);
    // The appended frame repeats the last value so nothing moves during the hold.
    expect(keyframes[2]['opacity']).toBe(keyframes[1]['opacity']);
  });

  it('ignores repeatDelay on a single-cycle animation', () => {
    const host = document.createElement('div');
    const animate = spyOnAnimate(host);

    new WaapiPlayer(host, { opacity: [0, 1] }, baseConfig, undefined, { repeatDelay: 100 });

    const [keyframes, options] = animate.mock.calls[0] as unknown as [
      Keyframe[],
      KeyframeAnimationOptions,
    ];
    // A trailing hold on a one-shot animation would just make it finish late.
    expect(options.duration).toBe(100);
    expect(keyframes).toHaveLength(2);
  });

  it('treats a negative repeatDelay as none', () => {
    const host = document.createElement('div');
    const animate = spyOnAnimate(host);

    new WaapiPlayer(host, { opacity: [0, 1] }, baseConfig, undefined, {
      repeat: Infinity,
      repeatDelay: -50,
    });

    const [, options] = animate.mock.calls[0] as unknown as [Keyframe[], KeyframeAnimationOptions];
    expect(options.duration).toBe(100);
  });
});
