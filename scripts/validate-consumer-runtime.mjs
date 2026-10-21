#!/usr/bin/env node
/**
 * Packed-package RUNTIME validation (spec 016).
 *
 * `validate-consumer.mjs` proves the tarball installs and compiles (AOT). It never executes
 * anything. This script does: it builds a small Angular app from `validation/consumer-runtime/`
 * against the **packed tarball**, prerenders it on the server, then loads it in a real Chromium and
 * checks what actually happens — SSR output, hydration, event replay, animations really running,
 * presence, reduced motion, teardown and no-JS rendering — once per supported Angular major.
 *
 * What this is NOT: Firefox/WebKit coverage (the demo site's e2e covers those against the source
 * alias), a real third-party app, or a performance benchmark. Results are labelled accordingly.
 *
 *   node scripts/validate-consumer-runtime.mjs            # every supported Angular major
 *   node scripts/validate-consumer-runtime.mjs 22         # one major
 *   node scripts/validate-consumer-runtime.mjs 21 --keep  # keep the temp app
 *   node scripts/validate-consumer-runtime.mjs --json out.json   # write the evidence record
 */
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { chromium } from '@playwright/test';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURE = join(ROOT, 'validation/consumer-runtime');
const DIST = join(ROOT, 'dist/movement');

const args = process.argv.slice(2);
const keep = args.includes('--keep');
const jsonIndex = args.indexOf('--json');
const jsonOut = jsonIndex >= 0 ? args[jsonIndex + 1] : undefined;
const requested = args.filter((a, i) => !a.startsWith('--') && i !== jsonIndex + 1);

function supportedMajors() {
  const peer = JSON.parse(readFileSync(join(ROOT, 'projects/movement/package.json'), 'utf8'))
    .peerDependencies['@angular/core'];
  return [...peer.matchAll(/\^(\d+)\./g)].map((m) => m[1]);
}
const majors = requested.length ? requested : supportedMajors();
const TYPESCRIPT_FOR_ANGULAR = { 21: '~5.9.0', 22: '~6.0.0' };

const c = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};
const info = (m) => console.log(`${c.cyan}›${c.reset} ${m}`);
const ok = (m) => console.log(`${c.green}✓${c.reset} ${m}`);
const bad = (m) => console.log(`${c.red}✗${c.reset} ${m}`);

const run = (cmd, cmdArgs, cwd) =>
  execFileSync(cmd, cmdArgs, { cwd, encoding: 'utf8', stdio: 'pipe', maxBuffer: 64 * 1024 * 1024 });

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.txt': 'text/plain',
};

/** Static file server with an optional artificial delay for the main bundle. */
function serve(dir, { delayMainMs = 0 } = {}) {
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    let file = join(dir, url.pathname === '/' ? 'index.html' : url.pathname);
    if (!existsSync(file)) file = join(dir, 'index.html');
    const body = readFileSync(file);
    const send = () => {
      res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
      res.end(body);
    };
    if (delayMainMs && url.pathname.endsWith('main.js')) setTimeout(send, delayMainMs);
    else send();
  });
  return new Promise((done) =>
    server.listen(0, '127.0.0.1', () =>
      done({ server, url: `http://127.0.0.1:${server.address().port}` }),
    ),
  );
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Collects `[name, passed, detail]` rows for the evidence record. */
function createChecks() {
  const rows = [];
  return {
    rows,
    async check(name, fn) {
      try {
        const detail = await fn();
        rows.push({ name, passed: true, detail: detail ?? '' });
        ok(`  ${name}${detail ? ` ${c.dim}(${detail})${c.reset}` : ''}`);
      } catch (error) {
        rows.push({ name, passed: false, detail: String(error.message ?? error) });
        bad(`  ${name}: ${error.message ?? error}`);
      }
    },
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function poll(page, fn, arg, { timeout = 3000 } = {}) {
  await page.waitForFunction(fn, arg, { timeout });
}

async function runBrowserChecks({ distDir, major, versions }) {
  const { check, rows } = createChecks();
  const browser = await chromium.launch();
  const { server, url } = await serve(distDir);

  try {
    // --- Server output (read straight from the prerendered file) --------------------------------
    const html = readFileSync(join(distDir, 'index.html'), 'utf8');
    await check('SSR: prerendered HTML contains the app content', () => {
      assert(html.includes('Packed runtime'), 'title text missing from prerendered HTML');
      assert(html.includes('data-testid="row-1"'), 'initial keyed row not server-rendered');
      return 'title + row-1 present';
    });
    await check('SSR: hydration annotations are present', () => {
      assert(/ng-server-context=/.test(html), 'ng-server-context missing');
      assert(/\bngh="/.test(html), 'ngh hydration markers missing');
    });
    await check('SSR: content is not hidden by inline styles before hydration', () => {
      assert(
        !/data-testid="row-1"[^>]*style="[^"]*opacity/.test(html),
        'row-1 server HTML carries inline opacity',
      );
      assert(!/data-testid="title"[^>]*style=/.test(html), 'title carries inline style');
    });
    await check('SSR: server-only branch is not rendered (panel closed, spinner unmounted)', () => {
      assert(!html.includes('data-testid="panel"'), 'panel rendered on server');
      assert(!html.includes('data-testid="spinner"'), 'spinner rendered on server');
    });

    // --- Normal browser context ----------------------------------------------------------------
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(`console.error: ${m.text()}`);
    });

    await page.goto(url);
    await check('Hydration: app hydrates (afterNextRender marks the client)', async () => {
      await page.waitForFunction(
        () => document.querySelector('[data-testid="hydrated"]')?.textContent === 'client',
        undefined,
        { timeout: 8000 },
      );
    });

    await check('Presence: enter plays a real animation and ends fully visible', async () => {
      await page.click('[data-testid="toggle"]');
      await page.waitForSelector('[data-testid="panel"]');
      const running = await page.evaluate(
        () => document.querySelector('[data-testid="panel"]').getAnimations().length,
      );
      assert(running > 0, 'no Web Animation running on the entering panel');
      await poll(page, () => {
        const el = document.querySelector('[data-testid="panel"]');
        return el.getAnimations().length === 0 && getComputedStyle(el).opacity === '1';
      });
      return `${running} animation(s) while entering`;
    });

    await check('Presence: leave keeps the node mounted, then removes it', async () => {
      await page.click('[data-testid="toggle"]');
      const stillMounted = await page.evaluate(
        () => !!document.querySelector('[data-testid="panel"]'),
      );
      assert(stillMounted, 'panel removed synchronously instead of after its leave animation');
      await page.waitForSelector('[data-testid="panel"]', { state: 'detached', timeout: 3000 });
    });

    await check('Interaction: moveWhileHover scales the card (real pointer hover)', async () => {
      await page.hover('[data-testid="card"]');
      await poll(page, () => {
        const el = document.querySelector('[data-testid="card"]');
        const s = getComputedStyle(el);
        return (
          (s.scale !== 'none' && parseFloat(s.scale) > 1.1) || /matrix\(1\.[1-9]/.test(s.transform)
        );
      });
    });

    await check('Reactive state: [moveAnimation] follows a signal change', async () => {
      await page.click('[data-testid="flip"]');
      await poll(
        page,
        () => getComputedStyle(document.querySelector('[data-testid="state"]')).opacity === '1',
      );
    });

    await check(
      'Keyed list: added row enters; removed row leaves after its animation',
      async () => {
        await page.click('[data-testid="add"]');
        await page.waitForSelector('[data-testid="row-2"]');
        await page.click('[data-testid="remove-1"]');
        assert(
          await page.evaluate(() => !!document.querySelector('[data-testid="row-1"]')),
          'row removed synchronously',
        );
        await page.waitForSelector('[data-testid="row-1"]', { state: 'detached', timeout: 3000 });
      },
    );

    await check(
      'Teardown: destroying a looping + hover host leaves no running animations',
      async () => {
        await page.click('[data-testid="mount"]');
        await page.waitForSelector('[data-testid="spinner"]');
        await poll(
          page,
          () => document.querySelector('[data-testid="spinner"]').getAnimations().length > 0,
        );
        await page.click('[data-testid="mount"]');
        await page.waitForSelector('[data-testid="spinner"]', { state: 'detached' });
        await poll(page, () => document.getAnimations().length === 0);
      },
    );

    await check('No console errors or page errors during the whole session', () => {
      assert(errors.length === 0, errors.join(' | '));
    });
    await context.close();

    // --- prefers-reduced-motion ----------------------------------------------------------------
    const reduced = await browser.newContext({ reducedMotion: 'reduce' });
    const rp = await reduced.newPage();
    await rp.goto(url);
    await rp.waitForFunction(
      () => document.querySelector('[data-testid="hydrated"]')?.textContent === 'client',
    );
    await check('Reduced motion: panel appears with no running animations', async () => {
      await rp.click('[data-testid="toggle"]');
      await rp.waitForSelector('[data-testid="panel"]');
      const running = await rp.evaluate(() => document.getAnimations().length);
      assert(running === 0, `${running} animation(s) running under reduced motion`);
      assert(
        (await rp.evaluate(
          () => getComputedStyle(document.querySelector('[data-testid="panel"]')).opacity,
        )) === '1',
        'panel not in its final state',
      );
    });
    await check('Reduced motion: state change applies immediately', async () => {
      await rp.click('[data-testid="flip"]');
      await poll(
        rp,
        () => getComputedStyle(document.querySelector('[data-testid="state"]')).opacity === '1',
        undefined,
        {
          timeout: 800,
        },
      );
      assert(
        (await rp.evaluate(() => document.getAnimations().length)) === 0,
        'animations still running',
      );
    });
    await reduced.close();

    // --- No JavaScript -------------------------------------------------------------------------
    const nojs = await browser.newContext({ javaScriptEnabled: false });
    const np = await nojs.newPage();
    await np.goto(url);
    await check('No JS: server HTML is readable and visible', async () => {
      assert(await np.locator('[data-testid="title"]').isVisible(), 'title not visible without JS');
      assert(await np.locator('[data-testid="row-1"]').isVisible(), 'row-1 not visible without JS');
      assert(
        (await np.locator('[data-testid="hydrated"]').textContent()) === 'server',
        'unexpected client marker',
      );
    });
    await nojs.close();

    // --- Slow hydration + event replay ---------------------------------------------------------
    const slow = await serve(distDir, { delayMainMs: 1500 });
    const slowCtx = await browser.newContext();
    const sp = await slowCtx.newPage();
    // Module scripts run before DOMContentLoaded, so wait only for the response to commit.
    await sp.goto(slow.url, { waitUntil: 'commit' });
    await sp.waitForSelector('[data-testid="title"]', { state: 'visible' });
    await check('Slow hydration: SSR content is visible before the bundle arrives', async () => {
      assert(
        await sp.locator('[data-testid="title"]').isVisible(),
        'title not visible during slow load',
      );
      assert(
        (await sp.locator('[data-testid="hydrated"]').textContent()) === 'server',
        'hydrated too early',
      );
    });
    await check(
      'Slow hydration: a pre-hydration click is replayed once the app is ready',
      async () => {
        await sp.click('[data-testid="toggle"]', { noWaitAfter: true });
        await sp.waitForFunction(
          () => document.querySelector('[data-testid="hydrated"]')?.textContent === 'client',
          undefined,
          {
            timeout: 8000,
          },
        );
        await sp.waitForSelector('[data-testid="panel"]', { timeout: 4000 });
      },
    );
    await slowCtx.close();
    slow.server.close();

    // --- Measurements --------------------------------------------------------------------------
    const main = readFileSync(join(distDir, 'main.js'));
    rows.push({
      name: 'Measured: narrow-import production bundle (main.js, includes Angular + router + hydration)',
      passed: true,
      detail: `${(main.length / 1024).toFixed(1)} kB raw, ${(gzipSync(main).length / 1024).toFixed(1)} kB gzip`,
    });

    return { major, versions, chromium: browser.version(), checks: rows };
  } finally {
    server.close();
    await browser.close();
  }
}

info('Building and packing the library…');
run('pnpm', ['exec', 'ng', 'build', 'movement'], ROOT);
const packOutput = JSON.parse(run('npm', ['pack', '--json', '--pack-destination', ROOT], DIST));
const tarball = join(ROOT, packOutput[0].filename);
ok(`packed ${packOutput[0].filename}`);

const evidence = [];
const failures = [];

for (const major of majors) {
  const dir = mkdtempSync(join(tmpdir(), `movement-runtime-${major}-`));
  info(`Angular ${major} → ${dir}`);
  cpSync(FIXTURE, dir, { recursive: true });
  const dep = (name) => [name, `^${major}.0.0`];
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify(
      {
        name: `movement-runtime-${major}`,
        version: '0.0.0',
        private: true,
        type: 'module',
        dependencies: Object.fromEntries([
          dep('@angular/common'),
          dep('@angular/compiler'),
          dep('@angular/core'),
          dep('@angular/platform-browser'),
          dep('@angular/platform-server'),
          dep('@angular/router'),
          dep('@angular/ssr'),
          ['angular-movement', `file:${tarball}`],
          ['tslib', '^2.3.0'],
          ['rxjs', '^7.8.0'],
        ]),
        devDependencies: {
          '@angular/build': `^${major}.0.0`,
          '@angular/cli': `^${major}.0.0`,
          '@angular/compiler-cli': `^${major}.0.0`,
          typescript: TYPESCRIPT_FOR_ANGULAR[major] ?? 'latest',
        },
      },
      null,
      2,
    ),
  );

  try {
    // npm 10's arborist can crash resolving the @angular/ssr peer set with a `file:` dependency;
    // strict peer resolution is already enforced by validate-consumer.mjs, so this fixture only
    // needs a working install.
    info('  installing (npm --legacy-peer-deps)…');
    run('npm', ['install', '--no-audit', '--no-fund', '--legacy-peer-deps'], dir);
    info('  building + prerendering (AOT, production)…');
    run('npx', ['ng', 'build'], dir);

    const tree = JSON.parse(
      run('npm', ['ls', '--json', '--depth=0', '--all'], dir).toString() || '{}',
    );
    const versions = Object.fromEntries(
      [
        '@angular/core',
        '@angular/ssr',
        '@angular/platform-server',
        '@angular/router',
        'typescript',
      ].map((n) => [n, tree.dependencies?.[n]?.version ?? 'unknown']),
    );
    versions['angular-movement'] = packOutput[0].filename;

    info('  running in Chromium…');
    const result = await runBrowserChecks({ distDir: join(dir, 'dist/browser'), major, versions });
    evidence.push(result);
    const failed = result.checks.filter((r) => !r.passed);
    if (failed.length) failures.push(major);
    else ok(`Angular ${major}: runtime validation passed (${result.checks.length} checks)`);
  } catch (error) {
    bad(`  Angular ${major} FAILED to build or run`);
    console.log(
      `${c.dim}${`${error.stdout ?? ''}${error.stderr ?? ''}${error.message}`.slice(-4000)}${c.reset}`,
    );
    failures.push(major);
  } finally {
    if (!keep) rmSync(dir, { recursive: true, force: true });
  }
}

if (!keep) rmSync(tarball, { force: true });
if (jsonOut) writeFileSync(jsonOut, JSON.stringify(evidence, null, 2));

console.log('\nResolved versions per major:');
for (const e of evidence)
  console.log(`  Angular ${e.major}: ${JSON.stringify(e.versions)}  (Chromium ${e.chromium})`);

if (failures.length) {
  bad(`runtime validation failed for Angular ${[...new Set(failures)].join(', ')}`);
  process.exit(1);
}
ok(`runtime validation passed for Angular ${majors.join(', ')}`);
