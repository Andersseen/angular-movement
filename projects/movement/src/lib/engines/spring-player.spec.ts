import { vi } from 'vitest';
import { SpringPlayer } from './spring-player';

function createAnimationMock(): Animation {
  const listeners = new Map<string, EventListener>();
  let time: CSSNumberish | null = 0;

  return {
    play: vi.fn(),
    pause: vi.fn(),
    cancel: vi.fn(),
    commitStyles: vi.fn(),
    addEventListener: vi.fn((type: string, listener: EventListener) => {
      listeners.set(type, listener);
    }),
    get currentTime() {
      return time;
    },
    set currentTime(next: CSSNumberish | null) {
      time = next;
    },
    get playState() {
      return 'running' as AnimationPlayState;
    },
    dispatchFinish() {
      listeners.get('finish')?.(new Event('finish'));
    },
  } as unknown as Animation & { dispatchFinish: () => void };
}

describe('SpringPlayer', () => {
  it('resolves immediately when WAAPI is unavailable', async () => {
    const host = document.createElement('div');
    const onDone = vi.fn();

    const player = new SpringPlayer(host, { opacity: [0, 1] }, {}, 0, 1, onDone);
    await player.finished;

    expect(onDone).toHaveBeenCalledOnce();
  });

  it('generates spring keyframes and plays them with linear easing', async () => {
    const host = document.createElement('div');
    const animation = createAnimationMock() as Animation & { dispatchFinish: () => void };
    const animate = vi.fn(() => animation);
    const onDone = vi.fn();
    Object.defineProperty(host, 'animate', { value: animate });

    const player = new SpringPlayer(
      host,
      { opacity: [0, 1], y: [24, 0] },
      { stiffness: 120, damping: 16 },
      25,
      1,
      onDone,
    );
    player.currentTime = 42;
    player.play();
    player.pause();
    animation.dispatchFinish();
    await player.finished;

    expect(animate).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ opacity: expect.any(Number) })]),
      expect.objectContaining({ delay: 25, easing: 'linear', fill: 'both', iterations: 1 }),
    );
    expect(player.currentTime).toBe(42);
    expect(animation.play).toHaveBeenCalledOnce();
    expect(animation.pause).toHaveBeenCalledOnce();
    expect(animation.commitStyles).toHaveBeenCalledOnce();
    expect(animation.cancel).toHaveBeenCalledOnce();
    expect(onDone).toHaveBeenCalledOnce();
  });

  it('resolves without animating when frames cannot produce spring segments', async () => {
    const host = document.createElement('div');
    const animate = vi.fn();
    const onDone = vi.fn();
    Object.defineProperty(host, 'animate', { value: animate });

    const player = new SpringPlayer(host, { opacity: [1] }, {}, 0, 1, onDone);
    await player.finished;

    expect(animate).not.toHaveBeenCalled();
    expect(onDone).toHaveBeenCalledOnce();
  });
});
