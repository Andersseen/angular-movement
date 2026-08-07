import { vi } from 'vitest';
import { BaseAnimationPlayer } from './base-player';

/** Minimal stand-in for a WAAPI `Animation`, with the finish listener captured. */
function makeAnimation(
  overrides: Partial<Animation> & { playState?: string } = {},
): Animation & { fireFinish: () => void; listenerOptions: AddEventListenerOptions | undefined } {
  let finishListener: (() => void) | null = null;
  let listenerOptions: AddEventListenerOptions | undefined;

  const animation = {
    playState: 'running',
    currentTime: 0,
    play: vi.fn(),
    pause: vi.fn(),
    cancel: vi.fn(),
    commitStyles: vi.fn(),
    addEventListener: vi.fn((event: string, listener: () => void, options?: unknown) => {
      if (event === 'finish') {
        finishListener = listener;
        listenerOptions = options as AddEventListenerOptions;
      }
    }),
    fireFinish: () => finishListener?.(),
    get listenerOptions() {
      return listenerOptions;
    },
    ...overrides,
  };

  return animation as unknown as Animation & {
    fireFinish: () => void;
    listenerOptions: AddEventListenerOptions | undefined;
  };
}

/** Concrete subclass so the abstract base can be exercised directly. */
class TestPlayer extends BaseAnimationPlayer {
  constructor(animation: Animation | null, onDone?: () => void, passOnDoneToAttach = true) {
    super();
    this.attachAnimation(animation, passOnDoneToAttach ? onDone : undefined);
  }
}

/** Subclass that routes onDone through the constructor promise instead of attachAnimation. */
class ConstructorOnDonePlayer extends BaseAnimationPlayer {
  constructor(animation: Animation | null, onDone?: () => void) {
    super(onDone);
    this.attachAnimation(animation);
  }
}

describe('BaseAnimationPlayer', () => {
  it('resolves `finished` and calls onDone immediately when there is no animation', async () => {
    const onDone = vi.fn();
    const player = new TestPlayer(null, onDone);

    await expect(player.finished).resolves.toBeUndefined();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('commits styles, cancels and resolves when the animation finishes', async () => {
    const onDone = vi.fn();
    const animation = makeAnimation();
    const player = new TestPlayer(animation, onDone);

    expect(onDone).not.toHaveBeenCalled();

    animation.fireFinish();
    await player.finished;

    // commitStyles before cancel — cancelling first would discard the final frame.
    expect(animation.commitStyles).toHaveBeenCalledTimes(1);
    expect(animation.cancel).toHaveBeenCalledTimes(1);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('registers the finish listener as once, so it cannot fire twice', () => {
    const animation = makeAnimation();
    new TestPlayer(animation);

    expect(animation.addEventListener).toHaveBeenCalledWith(
      'finish',
      expect.any(Function),
      expect.objectContaining({ once: true }),
    );
  });

  it('tolerates engines that do not implement commitStyles', async () => {
    const animation = makeAnimation({ commitStyles: undefined });
    const player = new TestPlayer(animation);

    expect(() => animation.fireFinish()).not.toThrow();
    await expect(player.finished).resolves.toBeUndefined();
    expect(animation.cancel).toHaveBeenCalledTimes(1);
  });

  it('supports onDone passed through the constructor promise', async () => {
    const onDone = vi.fn();
    const animation = makeAnimation();
    const player = new ConstructorOnDonePlayer(animation, onDone);

    animation.fireFinish();
    await player.finished;
    // The promise callback is queued as a microtask.
    await Promise.resolve();

    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('delegates play and pause to the animation', () => {
    const animation = makeAnimation();
    const player = new TestPlayer(animation);

    player.play();
    player.pause();

    expect(animation.play).toHaveBeenCalledTimes(1);
    expect(animation.pause).toHaveBeenCalledTimes(1);
  });

  it('play, pause and cancel are safe with no animation attached', async () => {
    const player = new TestPlayer(null);

    expect(() => {
      player.play();
      player.pause();
      player.cancel();
    }).not.toThrow();

    await expect(player.finished).resolves.toBeUndefined();
  });

  it('cancel stops a running animation and resolves finished', async () => {
    const animation = makeAnimation({ playState: 'running' });
    const player = new TestPlayer(animation);

    player.cancel();

    expect(animation.cancel).toHaveBeenCalledTimes(1);
    await expect(player.finished).resolves.toBeUndefined();
  });

  it('cancel does not re-cancel an already idle animation but still resolves', async () => {
    const animation = makeAnimation({ playState: 'idle' });
    const player = new TestPlayer(animation);

    player.cancel();

    expect(animation.cancel).not.toHaveBeenCalled();
    await expect(player.finished).resolves.toBeUndefined();
  });

  it('cancelling twice is harmless', async () => {
    const animation = makeAnimation();
    const player = new TestPlayer(animation);

    player.cancel();
    player.cancel();

    await expect(player.finished).resolves.toBeUndefined();
  });

  it('reads and writes currentTime through the animation', () => {
    const animation = makeAnimation({ currentTime: 120 });
    const player = new TestPlayer(animation);

    expect(player.currentTime).toBe(120);

    player.currentTime = 400;
    expect(animation.currentTime).toBe(400);
  });

  it('reports currentTime 0 and ignores writes when there is no animation', () => {
    const player = new TestPlayer(null);

    expect(player.currentTime).toBe(0);
    expect(() => (player.currentTime = 250)).not.toThrow();
    expect(player.currentTime).toBe(0);
  });

  it('reports currentTime 0 when the animation reports null', () => {
    const animation = makeAnimation({ currentTime: null });
    const player = new TestPlayer(animation);

    expect(player.currentTime).toBe(0);
  });
});
