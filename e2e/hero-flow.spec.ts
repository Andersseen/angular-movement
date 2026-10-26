import { expect, test as base, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { waitForHydration } from './hydration';

// Test-only software WebGL makes shader and lifecycle checks deterministic on GPU-less CI.
const test = base.extend<{ emulateHardwareCapability: boolean }>({
  emulateHardwareCapability: [true, { option: true }],
});
test.use({ launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } });

interface FieldMetrics {
  times: number[];
  cpu: number[];
  points: number[];
  deletedPrograms: number;
  deletedBuffers: number;
  requestedPerformanceGuard: boolean;
  programsCreated: number;
}

test.beforeEach(async ({ page, emulateHardwareCapability }) => {
  await page.addInitScript((emulateHardware) => {
    const metrics = {
      times: [] as number[],
      cpu: [] as number[],
      points: [] as number[],
      deletedPrograms: 0,
      deletedBuffers: 0,
      requestedPerformanceGuard: false,
      programsCreated: 0,
    };
    Object.defineProperty(window, '__heroFieldMetrics', { value: metrics });
    if (emulateHardware) {
      // The real worker rejects this CI software adapter. Simulate its capability response;
      // the visible renderer below still compiles and executes the actual shaders.
      window.Worker = class extends EventTarget {
        constructor() {
          super();
          queueMicrotask(() => this.dispatchEvent(new MessageEvent('message', { data: true })));
        }
        terminate() {
          return undefined;
        }
      } as unknown as typeof Worker;
    }
    // Production rejects slow software contexts. Opt into one only in shader/lifecycle tests.
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      type: string,
      options?: WebGLContextAttributes,
    ) {
      if (type === 'webgl' && options?.failIfMajorPerformanceCaveat) {
        metrics.requestedPerformanceGuard = true;
        if (emulateHardware) {
          return getContext.call(this, type, { ...options, failIfMajorPerformanceCaveat: false });
        }
      }
      return getContext.call(this, type as '2d', options);
    } as typeof HTMLCanvasElement.prototype.getContext;
    if (typeof WebGLRenderingContext === 'undefined') return;
    const prototype = WebGLRenderingContext.prototype;
    const createProgram = prototype.createProgram;
    prototype.createProgram = function () {
      metrics.programsCreated++;
      return createProgram.call(this);
    };
    if (emulateHardware) {
      // Exercise real shaders in software while simulating only the hardware-capability check.
      const parameter = prototype.getParameter;
      prototype.getParameter = function (name) {
        return name === 0x9246 ? 'Test hardware adapter' : parameter.call(this, name);
      };
    }
    const draw = prototype.drawArrays;
    prototype.drawArrays = function (mode, first, count) {
      const start = performance.now();
      draw.call(this, mode, first, count);
      metrics.times.push(start);
      metrics.cpu.push(performance.now() - start);
      metrics.points.push(count);
    };
    const deleteProgram = prototype.deleteProgram;
    prototype.deleteProgram = function (program) {
      metrics.deletedPrograms++;
      deleteProgram.call(this, program);
    };
    const deleteBuffer = prototype.deleteBuffer;
    prototype.deleteBuffer = function (buffer) {
      metrics.deletedBuffers++;
      deleteBuffer.call(this, buffer);
    };
  }, emulateHardwareCapability);
});

const metrics = (page: Page) =>
  page.evaluate(
    () => (window as unknown as { __heroFieldMetrics: FieldMetrics }).__heroFieldMetrics,
  );
const twoFrames = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
const fieldUniform = (page: Page, name: string) =>
  page.evaluate((uniform) => {
    const canvas = document.querySelector('app-hero-flow canvas');
    const gl = canvas?.getContext('webgl');
    if (!gl) return null;
    const program = gl.getParameter(gl.CURRENT_PROGRAM) as WebGLProgram;
    const location =
      gl.getUniformLocation(program, uniform) ?? gl.getUniformLocation(program, `${uniform}[0]`);
    if (!location) return null;
    const value = gl.getUniform(program, location) as number | Float32Array;
    return typeof value === 'number' ? value : [...value];
  }, name);

async function openField(page: Page) {
  await page.goto('/');
  await waitForHydration(page);
  const field = page.locator('app-hero-flow');
  await expect(field).toBeAttached({ timeout: 15_000 });
  const available = await field
    .locator('canvas')
    .evaluate((canvas) => !!canvas.getContext('webgl'));
  expect(available).toBe(true);
  return field;
}

test('organic hero draws a bounded field and supports theme changes and route cleanup', async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const field = await openField(page);
  await expect(field).toHaveAttribute('data-motion-state', 'running');
  await expect
    .poll(async () => (await metrics(page)).times.length, { timeout: 15_000 })
    .toBeGreaterThan(12);
  const sample = await metrics(page);
  expect(sample.requestedPerformanceGuard).toBe(true);
  expect(Math.max(...sample.points)).toBeLessThanOrEqual(22000);
  const canvasSize = await field
    .locator('canvas')
    .evaluate((canvas) => ({ width: canvas.width, height: canvas.height }));
  expect(canvasSize.width).toBeLessThanOrEqual(1600);
  expect(canvasSize.height).toBeLessThanOrEqual(1000);
  const cadence = sample.times.slice(3);
  const seconds = (cadence.at(-1)! - cadence[0]) / 1000;
  expect((cadence.length - 1) / seconds).toBeLessThanOrEqual(27);
  await info.attach('hero-draw-submission-sample', {
    body: JSON.stringify(sample),
    contentType: 'application/json',
  });

  // The pointer steers the flow: moving it to the right half shifts the field's pointer uniform.
  const viewport = page.viewportSize()!;
  await page.mouse.move(viewport.width - 80, viewport.height / 2);
  await expect
    .poll(async () => ((await fieldUniform(page, 'uPointer')) as number[] | null)?.[0] ?? 0, {
      timeout: 15_000,
    })
    .toBeGreaterThan(0.1);

  const theme = page.getByRole('button', { name: /Switch to (dark|light) theme/ }).first();
  await theme.click();
  const expectedGain =
    (await page.locator('html').getAttribute('data-theme')) === 'dark' ? 0.9 : 0.16;
  await expect
    .poll(() => fieldUniform(page, 'uGain'), { timeout: 10_000 })
    .toBeCloseTo(expectedGain, 1);

  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(field).toHaveAttribute('data-motion-state', 'paused');
  await twoFrames(page);
  const hidden = (await metrics(page)).times.length;
  await twoFrames(page);
  expect((await metrics(page)).times.length).toBe(hidden);
  await page.evaluate(() => {
    Reflect.deleteProperty(document, 'hidden');
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(field).toHaveAttribute('data-motion-state', 'running');
  await page.locator('app-footer').scrollIntoViewIfNeeded();
  await expect(field).toHaveAttribute('data-motion-state', 'paused');
  await twoFrames(page);
  const offscreen = (await metrics(page)).times.length;
  await twoFrames(page);
  expect((await metrics(page)).times.length).toBe(offscreen);
  // This jump is test setup: CSS smooth scrolling can otherwise move the link during its click.
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect(field).toHaveAttribute('data-motion-state', 'running');

  await page.locator('app-hero').getByRole('link', { name: 'Explore demos', exact: true }).click();
  await expect(page).toHaveURL(/\/demos$/);
  await expect(field).toHaveCount(0);
  await expect.poll(async () => (await metrics(page)).deletedPrograms).toBeGreaterThan(0);
  expect((await metrics(page)).deletedBuffers).toBeGreaterThan(0);
});

test('reduced motion is a static field and responds to live preference changes', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const field = await openField(page);
  await expect(field).toHaveAttribute('data-motion-state', 'static');
  await twoFrames(page);
  const count = (await metrics(page)).times.length;
  await twoFrames(page);
  expect((await metrics(page)).times.length).toBe(count);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(field).toHaveAttribute('data-motion-state', 'running');
  await expect.poll(async () => (await metrics(page)).times.length).toBeGreaterThan(count);
});

test('lost WebGL context stops drawing and restores without a second loop', async ({ page }) => {
  const field = await openField(page);
  await expect(field).toHaveAttribute('data-motion-state', 'running');
  const extension = await field.locator('canvas').evaluate((canvas) => {
    const lose = canvas.getContext('webgl')?.getExtension('WEBGL_lose_context');
    if (!lose) return false;
    Object.defineProperty(window, '__heroContextExtension', { value: lose });
    lose.loseContext();
    return true;
  });
  test.skip(!extension, 'Context-loss extension is unavailable on this runner.');
  await expect(field).toHaveAttribute('data-motion-state', 'unavailable');
  await page.evaluate(() =>
    (
      window as unknown as { __heroContextExtension: WEBGL_lose_context }
    ).__heroContextExtension.restoreContext(),
  );
  await expect(field).toHaveAttribute('data-motion-state', 'running');
  await expect(page.locator('h1')).toHaveText('Motion for Angular that follows your state.');
});

test('WebGL unavailable preserves hero content and a static fallback', async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type: string, options?: unknown) {
      if (type === 'webgl') return null;
      return getContext.call(this, type as '2d', options);
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
  await page.goto('/');
  await waitForHydration(page);
  await expect(page.locator('app-hero-flow')).toBeAttached({ timeout: 15_000 });
  await expect(page.locator('app-hero-flow')).toHaveAttribute('data-motion-state', 'unavailable');
  await expect(page.locator('.hero-flow-fallback')).toBeAttached();
  await expect(page.getByRole('link', { name: 'Get started', exact: true }).first()).toBeVisible();
  expect((await metrics(page)).times).toHaveLength(0);
});

test('compact screens use the smaller particle budget', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const field = await openField(page);
  await expect(field).toHaveAttribute('data-motion-state', 'running');
  await expect.poll(async () => (await metrics(page)).times.length).toBeGreaterThan(3);
  expect(Math.max(...(await metrics(page)).points)).toBeLessThanOrEqual(7500);
});

for (const theme of ['dark', 'light']) {
  test(`mounted hero has accessible naming and contrast in ${theme} theme`, async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem('movement-theme', value), theme);
    await openField(page);
    await page.waitForFunction(() =>
      [...document.querySelectorAll('.landing-rise')].every(
        (element) => getComputedStyle(element).opacity === '1',
      ),
    );
    await twoFrames(page);
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(
      result.violations.map((violation) => ({ id: violation.id, nodes: violation.nodes })),
    ).toEqual([]);
  });
}

test.describe('software rendering', () => {
  test.use({ emulateHardwareCapability: false });
  test('uses the static fallback before compiling or drawing the field', async ({ page }) => {
    const probe = page.waitForEvent('worker');
    await page.goto('/');
    await waitForHydration(page);
    const field = page.locator('app-hero-flow');
    await expect(field).toBeAttached({ timeout: 15_000 });
    await probe;
    // The probe compiles the real shaders; under a software adapter that can outlast the
    // capability deadline, so allow the worker to finish and terminate before counting.
    await expect.poll(() => page.workers().length, { timeout: 20_000 }).toBe(0);
    await expect(field).toHaveAttribute('data-motion-state', 'unavailable');
    expect((await metrics(page)).times).toHaveLength(0);
    expect((await metrics(page)).programsCreated).toBe(0);
    expect((await metrics(page)).requestedPerformanceGuard).toBe(false);
    await expect(page.locator('.hero-flow-fallback')).toBeAttached();
  });
});
