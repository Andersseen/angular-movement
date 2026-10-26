/** Cancelable, bounded capability probe and shader warm-up; no main-thread WebGL initialization. */
export function warmHeroGpu(signal: AbortSignal): Promise<boolean> {
  if (signal.aborted || typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined') {
    return Promise.resolve(false);
  }
  return new Promise((resolve) => {
    let worker: Worker;
    try {
      worker = new Worker(new URL('./hero-flow-warmup.worker.ts', import.meta.url), {
        type: 'module',
      });
    } catch {
      resolve(false);
      return;
    }
    let settled = false;
    const finish = (supported: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      signal.removeEventListener('abort', abort);
      worker.terminate();
      resolve(supported);
    };
    const abort = () => finish(false);
    const timeout = setTimeout(() => finish(false), 3000);
    worker.addEventListener('message', (event) => finish(event.data === true), { once: true });
    worker.addEventListener('error', () => finish(false), { once: true });
    signal.addEventListener('abort', abort, { once: true });
  });
}
