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
