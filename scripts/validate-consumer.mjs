#!/usr/bin/env node
/**
 * Real-app validation (ROADMAP 0.7).
 *
 * Builds and packs the library, then installs the **tarball** into a throwaway Angular app outside
 * this workspace and compiles it ahead of time with `strictTemplates`, once per supported Angular
 * major.
 *
 * Why this exists: the demo site imports the library through a Vite source alias, so it never
 * exercises the published package. Anything that only breaks after packaging is invisible until a
 * user hits it. On its first run this caught the library being uninstallable on Angular 22 — the
 * peer range still said `^21.2.0` only.
 *
 * Covers: peer resolution under a plain `npm install`, the `exports` map, the shipped `.d.ts`, and
 * AOT template type-checking of every directive and signal helper.
 * Does not cover: SSR of the built package. That is covered by `ssr.spec.ts` (18 directives on
 * `PLATFORM_ID: 'server'`) and by the demo site's own AnalogJS prerender in `pnpm build`.
 *
 *   node scripts/validate-consumer.mjs            # every supported Angular major
 *   node scripts/validate-consumer.mjs 22         # one major
 *   node scripts/validate-consumer.mjs 22 --keep  # leave the temp app for inspection
 */
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURE = join(ROOT, 'validation/consumer');
const DIST = join(ROOT, 'dist/movement');

const args = process.argv.slice(2);
const keep = args.includes('--keep');
const requested = args.filter((a) => !a.startsWith('--'));

/** Majors the library claims to support, derived from its own peer range. */
function supportedMajors() {
  const peer = JSON.parse(readFileSync(join(ROOT, 'projects/movement/package.json'), 'utf8'))
    .peerDependencies['@angular/core'];
  return [...peer.matchAll(/\^(\d+)\./g)].map((m) => m[1]);
}

const majors = requested.length ? requested : supportedMajors();

/**
 * Each Angular major pins a narrow TypeScript peer range, so the consumer app has to match it.
 * Unknown majors fall back to whatever the toolchain resolves.
 */
const TYPESCRIPT_FOR_ANGULAR = { 21: '~5.9.0', 22: '~6.0.0' };

const c = { reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m', cyan: '\x1b[36m', dim: '\x1b[2m' };
const info = (m) => console.log(`${c.cyan}›${c.reset} ${m}`);
const ok = (m) => console.log(`${c.green}✓${c.reset} ${m}`);
const bad = (m) => console.log(`${c.red}✗${c.reset} ${m}`);

function run(cmd, cmdArgs, cwd) {
  return execFileSync(cmd, cmdArgs, { cwd, encoding: 'utf8', stdio: 'pipe' });
}

info('Building and packing the library…');
run('pnpm', ['exec', 'ng', 'build', 'movement'], ROOT);
const packOutput = run('npm', ['pack', '--json', '--pack-destination', ROOT], DIST);
const tarball = join(ROOT, JSON.parse(packOutput)[0].filename);
ok(`packed ${JSON.parse(packOutput)[0].filename}`);

const failures = [];

for (const major of majors) {
  const dir = mkdtempSync(join(tmpdir(), `movement-consumer-${major}-`));
  info(`Angular ${major} → ${dir}`);

  cpSync(FIXTURE, dir, { recursive: true });

  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify(
      {
        name: `movement-consumer-${major}`,
        version: '0.0.0',
        private: true,
        type: 'module',
        dependencies: {
          '@angular/common': `^${major}.0.0`,
          '@angular/compiler': `^${major}.0.0`,
          '@angular/core': `^${major}.0.0`,
          '@angular/platform-browser': `^${major}.0.0`,
          'angular-movement': `file:${tarball}`,
          tslib: '^2.3.0',
          rxjs: '^7.8.0',
        },
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
    // A plain `npm install` (no workspace, no overrides) is what a user runs — and it is what
    // surfaces a peer-range conflict rather than silently resolving it.
    info(`  installing (npm, strict peers)…`);
    run('npm', ['install', '--no-audit', '--no-fund'], dir);
    ok('  install resolved with no peer conflict');

    info('  building (AOT, strictTemplates)…');
    run('npx', ['ng', 'build'], dir);
    ok(`  Angular ${major}: AOT build passed`);
  } catch (error) {
    const output = `${error.stdout ?? ''}${error.stderr ?? ''}`.trim();
    bad(`  Angular ${major} FAILED`);
    console.log(`${c.dim}${output.slice(-4000)}${c.reset}`);
    failures.push(major);
  } finally {
    if (!keep) rmSync(dir, { recursive: true, force: true });
  }
}

if (!keep) rmSync(tarball, { force: true });

if (failures.length) {
  bad(`consumer validation failed for Angular ${failures.join(', ')}`);
  process.exit(1);
}
ok(`consumer validation passed for Angular ${majors.join(', ')}`);
