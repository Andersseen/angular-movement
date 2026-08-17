import { vi } from 'vitest';
import { CompositeAnimationControls } from './composite-controls';
import { AnimationControls } from './animation-controls';

function member(currentTime = 0, finished: Promise<void> = Promise.resolve()): AnimationControls {
  return {
    play: vi.fn(),
    pause: vi.fn(),
    cancel: vi.fn(),
    currentTime,
    finished,
  };
}

describe('CompositeAnimationControls', () => {
  it('forwards play, pause and cancel to every member', () => {
    const a = member();
    const b = member();
    const composite = new CompositeAnimationControls([a, b]);

    composite.play();
    composite.pause();
    composite.cancel();

    for (const each of [a, b]) {
      expect(each.play).toHaveBeenCalledOnce();
      expect(each.pause).toHaveBeenCalledOnce();
      // One handle has to cancel all of them, or ngOnDestroy leaks the rest.
      expect(each.cancel).toHaveBeenCalledOnce();
    }
  });

  it('drops null members instead of throwing on them', () => {
    const a = member();
    const composite = new CompositeAnimationControls([a, null]);

    expect(composite.size).toBe(1);
    expect(() => composite.cancel()).not.toThrow();
  });

  it('reports the furthest-along member as the current time', () => {
    const composite = new CompositeAnimationControls([member(120), member(300)]);

    expect(composite.currentTime).toBe(300);
  });

  it('scrubs every member', () => {
    const a = member(0);
    const b = member(0);
    const composite = new CompositeAnimationControls([a, b]);

    composite.currentTime = 250;

    expect(a.currentTime).toBe(250);
    expect(b.currentTime).toBe(250);
  });

  it('resolves finished only once every member has', async () => {
    let resolveSlow: () => void = () => undefined;
    const slow = new Promise<void>((resolve) => {
      resolveSlow = resolve;
    });

    const composite = new CompositeAnimationControls([member(0), member(0, slow)]);

    let settled = false;
    void composite.finished.then(() => {
      settled = true;
    });

    await Promise.resolve();
    expect(settled).toBe(false);

    resolveSlow();
    await composite.finished;
    expect(settled).toBe(true);
  });

  it('resolves immediately with no members', async () => {
    await expect(new CompositeAnimationControls([]).finished).resolves.toBeUndefined();
  });
});
