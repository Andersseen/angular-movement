import { expect, test, type Page } from '@playwright/test';
import { waitForHydration } from './hydration';

// Test-only software WebGL makes shader and lifecycle checks deterministic on GPU-less CI.
test.use({ launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } });

interface FieldMetrics {
  times: number[];
  cpu: number[];
  points: number[];
  deletedPrograms: number;
  deletedBuffers: number;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const metrics = {
      times: [] as number[],
      cpu: [] as number[],
      points: [] as number[],
      deletedPrograms: 0,
      deletedBuffers: 0,
    };
    Object.defineProperty(window, '__heroFieldMetrics', { value: metrics });
    if (typeof WebGLRenderingContext === 'undefined') return;
    const prototype = WebGLRenderingContext.prototype;
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
  });
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

test('organic hero draws a bounded field and supports pause, theme changes and route cleanup', async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const field = await openField(page);
  await expect(field).toHaveAttribute('data-motion-state', 'running');
  await expect.poll(async () => (await metrics(page)).times.length).toBeGreaterThan(12);
  const sample = await metrics(page);
  expect(Math.max(...sample.points)).toBeLessThanOrEqual(16000);
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

  await page.getByRole('button', { name: 'Pause background motion' }).click();
  await expect(field).toHaveAttribute('data-motion-state', 'paused');
  await twoFrames(page);
  const paused = (await metrics(page)).times.length;
  await twoFrames(page);
  expect((await metrics(page)).times.length).toBe(paused);
  const toggle = page.getByRole('button', { name: 'Resume background motion' });
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  const theme = page.getByRole('button', { name: /Switch to (dark|light) theme/ }).first();
  await theme.click();
  const expectedDark = (await page.locator('html').getAttribute('data-theme')) === 'dark' ? 1 : 0;
  await expect
    .poll(() =>
      field.locator('canvas').evaluate((canvas) => {
        const gl = canvas.getContext('webgl')!;
        return gl.getUniform(
          gl.getParameter(gl.CURRENT_PROGRAM),
          gl.getUniformLocation(gl.getParameter(gl.CURRENT_PROGRAM), 'uDark'),
        ) as number;
      }),
    )
    .toBe(expectedDark);
  await toggle.click();
  await expect(field).toHaveAttribute('data-motion-state', 'running');
  await expect.poll(async () => (await metrics(page)).times.length).toBeGreaterThan(paused);

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
  await page.evaluate(() => window.scrollTo(0, 0));
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
  await expect(page.getByRole('button', { name: 'Pause background motion' })).toHaveCount(0);
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
  expect(Math.max(...(await metrics(page)).points)).toBeLessThanOrEqual(6000);
});
