import { vi } from 'vitest';
import { AnimationControls } from './animation-controls';
import { cancelActivePlayer, registerActivePlayer } from './active-player-registry';

function createPlayer(): { controls: AnimationControls; resolve: () => void } {
  let resolve!: () => void;
  const finished = new Promise<void>((res) => {
    resolve = res;
  });

  return {
    controls: {
      play: vi.fn(),
      pause: vi.fn(),
      cancel: vi.fn(),
      currentTime: 0,
      finished,
    },
    resolve,
  };
}

describe('active player registry', () => {
  it('cancels the registered player for a host', () => {
    const host = document.createElement('div');
    const { controls } = createPlayer();

    registerActivePlayer(host, controls);
    cancelActivePlayer(host);

    expect(controls.cancel).toHaveBeenCalledTimes(1);
  });

  it('is a no-op when nothing is registered for the host', () => {
    const host = document.createElement('div');

    expect(() => cancelActivePlayer(host)).not.toThrow();
  });

  it('does not cancel a player registered for a different host', () => {
    const hostA = document.createElement('div');
    const hostB = document.createElement('div');
    const { controls: controlsA } = createPlayer();
    const { controls: controlsB } = createPlayer();

    registerActivePlayer(hostA, controlsA);
    registerActivePlayer(hostB, controlsB);
    cancelActivePlayer(hostA);

    expect(controlsA.cancel).toHaveBeenCalledTimes(1);
    expect(controlsB.cancel).not.toHaveBeenCalled();
  });

  it('replaces a previously-registered player for the same host', () => {
    const host = document.createElement('div');
    const { controls: first } = createPlayer();
    const { controls: second } = createPlayer();

    registerActivePlayer(host, first);
    registerActivePlayer(host, second);
    cancelActivePlayer(host);

    // Only the current registration is cancelled — the caller that registered `first` is
    // responsible for its own player, exactly like every directive already cancels its own
    // `#currentPlayer` before starting a new one.
    expect(first.cancel).not.toHaveBeenCalled();
    expect(second.cancel).toHaveBeenCalledTimes(1);
  });

  it('self-clears once the registered player settles, so a later cancel is a no-op', async () => {
    const host = document.createElement('div');
    const { controls, resolve } = createPlayer();

    registerActivePlayer(host, controls);
    resolve();
    await controls.finished;
    // Let the registry's own `.then()` cleanup microtask run.
    await Promise.resolve();

    cancelActivePlayer(host);

    expect(controls.cancel).not.toHaveBeenCalled();
  });

  it('registering null clears any existing entry for the host', () => {
    const host = document.createElement('div');
    const { controls } = createPlayer();

    registerActivePlayer(host, controls);
    registerActivePlayer(host, null);
    cancelActivePlayer(host);

    expect(controls.cancel).not.toHaveBeenCalled();
  });
});
