import { createHeroFlowRenderer } from './hero-flow-renderer';

// Warm the driver and shader cache off the main thread, before creating the visible context.
// Unsupported or software-only devices retain the CSS fallback without main-thread GL work.
try {
  const renderer = createHeroFlowRenderer(new OffscreenCanvas(1, 1));
  const supported = !!renderer;
  renderer?.dispose(true);
  postMessage(supported);
} catch {
  postMessage(false);
}
close();
