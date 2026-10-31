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
import { installWithPeerCheck } from './lib/install-with-peer-check.mjs';

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

/** Web Animations Movement started on matching elements (CSS transitions are not counted). */
const motionCount = (page, selector) =>
  page.evaluate(
    (sel) =>
      Array.from(document.querySelectorAll(sel)).reduce(
        (n, el) =>
          n +
          el
            .getAnimations()
            .filter((a) => !(a instanceof CSSTransition) && !(a instanceof CSSAnimation)).length,
        0,
      ),
    selector,
  );

const boxesOf = (page, selector) =>
  page.evaluate(
    (sel) =>
      Array.from(document.querySelectorAll(sel)).map((el) => {
        const r = el.getBoundingClientRect();
        return [r.x, r.y, r.width, r.height].map((v) => Math.round(v * 10) / 10);
      }),
    selector,
  );

const hasResidue = (page, selector) =>
  page.evaluate(
    (sel) =>
      Array.from(document.querySelectorAll(sel)).some((el) => {
        const c = getComputedStyle(el);
        const identity =
          ['none', '0px', '0px 0px'].includes(c.translate) &&
          ['none', '1', '1 1'].includes(c.scale);
        return el.style.transformOrigin !== '' || !identity;
      }),
    selector,
  );

/** Resolves once nothing Movement started is running on the matching elements. */
const settle = (page, selector, timeout = 4000) =>
  page.waitForFunction(
    (sel) =>
      Array.from(document.querySelectorAll(sel)).every((el) =>
        el.getAnimations().every((a) => a instanceof CSSTransition || a instanceof CSSAnimation),
      ),
    selector,
    { timeout },
  );

/** Clicks inside the page and reports the boxes before and `frames` animation frames after. */
const clickAndMeasure = (page, clickSelector, boxSelector, frames = 2) =>
  page.evaluate(
    async ({ clickSelector, boxSelector, frames }) => {
      const read = () =>
        Array.from(document.querySelectorAll(boxSelector)).map((el) => {
          const r = el.getBoundingClientRect();
          return [r.x, r.y, r.width, r.height];
        });
      const before = read();
      document.querySelector(clickSelector).click();
      for (let i = 0; i < frames; i += 1) {
        await new Promise((r) => requestAnimationFrame(() => r(null)));
      }
      return { before, after: read() };
    },
    { clickSelector, boxSelector, frames },
  );

const maxJump = (a, b) =>
  Math.max(...a.map((box, i) => Math.max(...box.map((v, k) => Math.abs(v - b[i][k])))));

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

    // The packed artifact, not the source alias: a drag must track the pointer exactly on every
    // repeat (spec 020). Alternating pairs of same-direction drags make a double-counted
    // displacement accumulate instead of cancelling out.
    await check(
      'Repeated moveDrag: 12 consecutive drags track the pointer with no drift',
      async () => {
        const centre = () =>
          page.evaluate(() => {
            const r = document.querySelector('[data-testid="drag"]').getBoundingClientRect();
            return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
          });
        const settled = async () => {
          let previous = await centre();
          for (let i = 0; i < 100; i += 1) {
            await sleep(40);
            const current = await centre();
            if (Math.hypot(current.x - previous.x, current.y - previous.y) < 0.05) return current;
            previous = current;
          }
          return previous;
        };

        let worst = 0;
        for (let i = 0; i < 12; i += 1) {
          const sign = Math.floor(i / 2) % 2 === 0 ? 1 : -1;
          const before = await settled();
          await page.mouse.move(before.x + 6, before.y + 4);
          await page.mouse.down();
          const pressed = await settled();
          await page.mouse.move(before.x + 6 + sign * 30, before.y + 4 + sign * 18, { steps: 6 });
          const held = await centre();
          await page.mouse.up();
          const released = await settled();

          const pressJump = Math.hypot(pressed.x - before.x, pressed.y - before.y);
          const follow = Math.hypot(held.x - pressed.x - sign * 30, held.y - pressed.y - sign * 18);
          const releaseJump = Math.hypot(released.x - held.x, released.y - held.y);
          worst = Math.max(worst, pressJump, follow, releaseJump);
          assert(
            pressJump < 1.5 && follow < 1.5 && releaseJump < 1.5,
            `drag ${i}: press jump ${pressJump.toFixed(1)}, follow error ${follow.toFixed(1)}, release jump ${releaseJump.toFixed(1)} px`,
          );
        }
        return `worst error ${worst.toFixed(2)} px`;
      },
    );

    // --- Layout motion (spec 021): two consumer workflows + composition, on the packed tarball ----
    const CARD = '[data-testid="dash-card"]';
    const click = (id) =>
      page.evaluate((i) => document.querySelector(`[data-testid="${i}"]`).click(), id);

    await check('Layout dashboard: hydration starts no FLIP and cards are laid out', async () => {
      await settle(page, CARD);
      assert((await boxesOf(page, CARD)).length === 6, 'expected six dashboard cards');
      return 'no layout animation after hydration';
    });

    await check(
      'Layout dashboard: 12 un-awaited column/filter/expand toggles (4 each) return to the exact grid',
      async () => {
        await settle(page, CARD);
        const original = await boxesOf(page, CARD);
        for (let i = 0; i < 12; i += 1) {
          await click(['dash-cols', 'dash-filter', 'dash-expand'][i % 3]);
        }
        await settle(page, CARD);
        assert(!(await hasResidue(page, CARD)), 'residual translate/scale/origin on a card');
        const after = await boxesOf(page, CARD);
        assert(
          JSON.stringify(after) === JSON.stringify(original),
          `cards did not return: ${JSON.stringify(original[0])} vs ${JSON.stringify(after[0])}`,
        );
        return `${original.length} cards, 12 changes`;
      },
    );

    await check(
      'Layout dashboard: a change mid-FLIP continues from the visible position',
      async () => {
        await settle(page, CARD);
        await click('dash-cols');
        // Mid-flight, not at time zero: a change landing at t=0 would be trivially continuous.
        await page.waitForFunction(
          (sel) =>
            document
              .querySelector(sel)
              .getAnimations()
              .some((a) => a.currentTime > 90),
          CARD,
        );
        const { before, after } = await clickAndMeasure(page, '[data-testid="dash-cols"]', CARD);
        const jump = maxJump(before, after);
        assert(
          jump < 24,
          `cards jumped ${jump.toFixed(1)} px when the layout changed mid-FLIP: ` +
            before
              .map((b, i) => `#${i} ${b.map(Math.round)} -> ${after[i].map(Math.round)}`)
              .join('; '),
        );
        await settle(page, CARD);
        return `${jump.toFixed(1)} px in two frames`;
      },
    );

    await check(
      'Layout dashboard: insert, remove and reorder keep identity and settle',
      async () => {
        await settle(page, CARD);
        await page.evaluate(() =>
          document
            .querySelector('[data-testid="dash-card"][data-id="2"]')
            .setAttribute('data-mark', 'kept'),
        );
        await click('dash-add');
        await click('dash-add');
        await click('dash-shuffle');
        await click('dash-remove');
        await click('dash-remove');
        await click('dash-shuffle');
        await settle(page, CARD);
        const count = (await boxesOf(page, CARD)).length;
        assert(count === 6, `expected 6 cards after +2 −2, found ${count}`);
        assert(
          await page.evaluate(() => !!document.querySelector('[data-mark="kept"]')),
          'a surviving card was recreated instead of moved',
        );
        assert(!(await hasResidue(page, CARD)), 'residue after insert/remove/reorder');
      },
    );

    await check(
      'Layout dashboard: scrolling the page between renders is not layout movement',
      async () => {
        await settle(page, CARD);
        await page.evaluate(() =>
          document.querySelector('[data-testid="dash-grid"]').scrollIntoView(),
        );
        await page.evaluate(() => window.scrollBy(0, 60));
        await click('dash-add');
        await page.waitForFunction(
          () => document.querySelectorAll('[data-testid="dash-card"]').length === 7,
        );
        const running = await motionCount(page, `${CARD}:not(:last-child)`);
        await click('dash-remove');
        await settle(page, CARD);
        assert(running === 0, `${running} animation(s) started by scrolling alone`);
      },
    );

    const SHARED_DETAIL = '[data-testid="shared-detail"]';
    await check(
      'Shared card/detail: the detail starts on its card and lands on its natural box',
      async () => {
        await page.evaluate(() =>
          document.querySelector('[data-testid="shared-grid"]').scrollIntoView(),
        );
        const cardBox = (await boxesOf(page, '[data-testid="shared-card-2"]'))[0];
        const { after } = await page.evaluate(async () => {
          document.querySelector('[data-testid="shared-card-2"]').click();
          await new Promise((r) =>
            requestAnimationFrame(() => requestAnimationFrame(() => r(null))),
          );
          const r = document.querySelector('[data-testid="shared-detail"]').getBoundingClientRect();
          return { after: [r.x, r.y, r.width, r.height] };
        });
        await settle(page, SHARED_DETAIL);
        const natural = (await boxesOf(page, SHARED_DETAIL))[0];
        const dist = (a, b) => Math.hypot(...a.map((v, i) => v - b[i]));
        assert(
          dist(after, cardBox) < dist(after, natural) * 0.6,
          `detail did not start from its card: ${after.map(Math.round)} vs card ${cardBox.map(Math.round)}`,
        );
        assert(natural[2] > cardBox[2] * 2, 'detail did not reach its natural width');
        assert(!(await hasResidue(page, SHARED_DETAIL)), 'residue on the detail');
      },
    );

    await check('Shared card/detail: focus follows the application on open and close', async () => {
      const focused = () =>
        page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
      await page.waitForFunction(
        () => document.activeElement?.getAttribute('data-testid') === 'shared-close',
      );
      assert((await focused()) === 'shared-close', 'close button not focused after open');
      await click('shared-close');
      await page.waitForFunction(
        () => document.activeElement?.getAttribute('data-testid') === 'shared-card-2',
      );
    });

    await check(
      'Shared card/detail: rapid A/B/A/C opens leave one detail, no ghost, no residue',
      async () => {
        for (const id of [1, 2, 1, 3]) await click(`shared-card-${id}`);
        await settle(page, '[data-testid^="shared"]');
        const details = (await boxesOf(page, SHARED_DETAIL)).length;
        assert(details === 1, `${details} detail surfaces`);
        assert(!(await hasResidue(page, '[data-testid^="shared"]')), 'residue after A/B/A/C');
        await click('shared-close');
        await settle(page, '[data-testid^="shared"]');
        assert(
          (await boxesOf(page, '[data-testid^="shared-card-"]')).length === 3,
          'cards not restored',
        );
      },
    );

    await check('Shared card/detail: destroying the host mid-handover throws nothing', async () => {
      const before = errors.length;
      await click('shared-card-1');
      await click('toggle'); // unrelated re-render while the handover runs
      await click('toggle');
      await click('shared-close');
      await settle(page, '[data-testid^="shared"]');
      assert(errors.length === before, errors.slice(before).join(' | '));
    });

    const ITEM = '[data-testid="composed-item"]';
    const GRID = '[data-testid="composed-grid"]';
    /** Offset of the item from its layout cell: the part of its position that is not layout. */
    const displacement = () =>
      page.evaluate(
        ({ ITEM, GRID }) => {
          const el = document.querySelector(ITEM);
          const g = document.querySelector(GRID).getBoundingClientRect();
          const r = el.getBoundingClientRect();
          return [r.x - g.x - el.offsetLeft, r.y - g.y - el.offsetTop].map(
            (v) => Math.round(v * 10) / 10,
          );
        },
        { ITEM, GRID },
      );

    await check('Layout + hover: a held hover scale is not a layout change', async () => {
      await page.evaluate(() =>
        document.querySelector('[data-testid="composed-grid"]').scrollIntoView({ block: 'center' }),
      );
      await settle(page, ITEM);
      const box = (await boxesOf(page, ITEM))[0];
      await page.mouse.move(box[0] + box[2] / 2, box[1] + box[3] / 2);
      await page.waitForFunction(
        (sel) => parseFloat(getComputedStyle(document.querySelector(sel)).scale) > 1.05,
        ITEM,
      );
      await settle(page, ITEM);
      await click('composed-add'); // a render pass while hover is held
      await page.waitForFunction(
        () => document.querySelectorAll('[data-testid="composed-grid"] > div').length === 5,
      );
      const running = await motionCount(page, ITEM);
      assert(running === 0, `${running} animation(s) started on a hovered, unmoved layout host`);
      await page.mouse.move(0, 0);
      await settle(page, ITEM);
    });

    await check(
      'Layout + drag: 10 reflows after a drag keep the drag offset exactly, no drift',
      async () => {
        await settle(page, ITEM);
        let box = (await boxesOf(page, ITEM))[0];
        const x = box[0] + box[2] / 2;
        const y = box[1] + box[3] / 2;
        await page.mouse.move(x, y);
        await page.mouse.down();
        await page.mouse.move(x + 24, y + 14, { steps: 6 });
        await page.mouse.up();
        await page.mouse.move(0, 0);
        await settle(page, ITEM);
        const offset = await displacement();
        assert(Math.abs(offset[0]) > 10, `drag did not displace the item: ${offset}`);

        for (let i = 0; i < 10; i += 1) {
          await click('composed-cols');
          await settle(page, ITEM);
          const now = await displacement();
          assert(
            Math.abs(now[0] - offset[0]) < 1 && Math.abs(now[1] - offset[1]) < 1,
            `reflow ${i}: drag offset ${offset} became ${now}`,
          );
        }
        assert((await hasResidue(page, ITEM)) === false, 'layout residue after drag + reflow');
        return `offset ${offset} held for 10 reflows`;
      },
    );

    await check(
      'Layout + drag: pressing during a FLIP takes over cleanly and layout keeps working',
      async () => {
        await settle(page, ITEM);
        await click('composed-cols');
        await page.waitForFunction(
          (sel) => document.querySelector(sel).getAnimations().length > 0,
          ITEM,
        );
        const box = (await boxesOf(page, ITEM))[0];
        await page.mouse.move(box[0] + box[2] / 2, box[1] + box[3] / 2);
        await page.mouse.down();
        await page.mouse.move(box[0] + box[2] / 2 + 10, box[1] + box[3] / 2 + 6, { steps: 4 });
        await page.mouse.up();
        await page.mouse.move(0, 0);
        await settle(page, ITEM);
        assert(
          await page.evaluate(
            (sel) => document.querySelector(sel).style.transformOrigin === '',
            ITEM,
          ),
          'transform-origin still borrowed after the drag preempted the FLIP',
        );
        // Layout must still animate afterwards.
        await click('composed-cols');
        await page.waitForFunction(
          (sel) => document.querySelector(sel).getAnimations().length > 0,
          ITEM,
          { timeout: 2000 },
        );
        await settle(page, ITEM);
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
    const CARD_SEL = '[data-testid="dash-card"]';
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
    await check(
      'Reduced motion: layout and shared handover apply with no Movement animation',
      async () => {
        const before = await boxesOf(rp, CARD_SEL);
        await rp.evaluate(() => document.querySelector('[data-testid="dash-cols"]').click());
        await rp.waitForFunction(
          (sel) => document.querySelector(sel).getBoundingClientRect().x !== undefined,
          CARD_SEL,
        );
        const running = await motionCount(rp, CARD_SEL);
        assert(running === 0, `${running} layout animation(s) under reduced motion`);
        assert(
          JSON.stringify(await boxesOf(rp, CARD_SEL)) !== JSON.stringify(before),
          'layout did not change',
        );
        await rp.evaluate(() => document.querySelector('[data-testid="shared-card-2"]').click());
        await rp.waitForSelector('[data-testid="shared-detail"]');
        assert((await motionCount(rp, '[data-testid^="shared"]')) === 0, 'handover animated');
      },
    );
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
    info('  installing (npm; strict peers, explicit peer check if npm itself crashes)…');
    installWithPeerCheck(dir, 'angular-movement', (m) => info(`  ${m}`));
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
