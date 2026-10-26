import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { warmHeroGpu } from './hero-flow-warmup';

class ProbeWorker extends EventTarget {
  static instances: ProbeWorker[] = [];
  readonly terminate = vi.fn();
  constructor() {
    super();
    ProbeWorker.instances.push(this);
  }
}

describe('hero GPU warm-up ownership', () => {
  beforeEach(() => {
    ProbeWorker.instances = [];
    vi.stubGlobal('Worker', ProbeWorker);
    vi.stubGlobal('OffscreenCanvas', class {});
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('releases the probe after a capability result, including a late duplicate event', async () => {
    const result = warmHeroGpu(new AbortController().signal);
    const worker = ProbeWorker.instances[0];
    worker.dispatchEvent(new MessageEvent('message', { data: true }));
    worker.dispatchEvent(new Event('error'));
    expect(await result).toBe(true);
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

  it('terminates pending work when the route owner aborts', async () => {
    const owner = new AbortController();
    const result = warmHeroGpu(owner.signal);
    owner.abort();
    expect(await result).toBe(false);
    expect(ProbeWorker.instances[0].terminate).toHaveBeenCalledOnce();
  });

  it('falls back after the bounded deadline and terminates a stalled probe', async () => {
    vi.useFakeTimers();
    const result = warmHeroGpu(new AbortController().signal);
    vi.advanceTimersByTime(3000);
    expect(await result).toBe(false);
    expect(ProbeWorker.instances[0].terminate).toHaveBeenCalledOnce();
  });

  it('does not start work for an already destroyed owner or an unsupported browser', async () => {
    const owner = new AbortController();
    owner.abort();
    expect(await warmHeroGpu(owner.signal)).toBe(false);
    vi.stubGlobal('Worker', undefined);
    expect(await warmHeroGpu(new AbortController().signal)).toBe(false);
    expect(ProbeWorker.instances).toHaveLength(0);
  });
});
