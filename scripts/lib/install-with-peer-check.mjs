/**
 * Installs a consumer fixture with npm, keeping the peer-range check that a plain `npm install`
 * gives us even when npm itself crashes.
 *
 * Why this exists: npm 10's arborist throws `Cannot read properties of null (reading 'edgesOut')`
 * while resolving the Angular 21.2 CLI toolchain's peer graph — with or without our package in the
 * tree (reproducible with a bare `@angular/build@~21.2` + `@angular/cli@~21.2` package.json). That
 * is an npm bug, not a library defect, but it made `validate:consumer` fail for every PR.
 *
 * Strategy: try a strict install first (what users run). Only when npm crashes with that specific
 * error, retry with `--legacy-peer-deps` and then verify OUR peer ranges ourselves against what
 * was actually installed, so a genuine peer-range regression still fails the validation.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: 'pipe', maxBuffer: 64 * 1024 * 1024 });

const parse = (v) =>
  v
    .replace(/^[^\d]*/, '')
    .split('-')[0]
    .split('.')
    .map((n) => parseInt(n, 10) || 0);
const cmp = (a, b) => {
  for (let i = 0; i < 3; i++) if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) - (b[i] ?? 0);
  return 0;
};

/** Minimal semver `satisfies` for the `^x.y.z`, `~x.y.z`, `>=x.y.z` and `||` forms peers use. */
export function satisfies(version, range) {
  const v = parse(version);
  return range.split('||').some((part) => {
    const r = part.trim();
    const base = parse(r);
    if (r.startsWith('>=')) return cmp(v, base) >= 0;
    if (r.startsWith('~')) return cmp(v, base) >= 0 && v[0] === base[0] && v[1] === base[1];
    if (r.startsWith('^')) {
      if (cmp(v, base) < 0) return false;
      if (base[0] > 0) return v[0] === base[0];
      if (base[1] > 0) return v[0] === 0 && v[1] === base[1];
      return v[0] === 0 && v[1] === 0 && v[2] === base[2];
    }
    return cmp(v, base) === 0;
  });
}

export function installWithPeerCheck(dir, packageName, log = () => {}) {
  try {
    run('npm', ['install', '--no-audit', '--no-fund'], dir);
    log('install resolved with strict peers');
    return { mode: 'strict' };
  } catch (error) {
    const output = `${error.stdout ?? ''}${error.stderr ?? ''}`;
    if (!output.includes("reading 'edgesOut'")) throw error;
    log('npm crashed (known arborist bug); retrying with --legacy-peer-deps + explicit peer check');
    run('npm', ['install', '--no-audit', '--no-fund', '--legacy-peer-deps'], dir);
  }

  const installed = JSON.parse(
    readFileSync(join(dir, 'node_modules', packageName, 'package.json'), 'utf8'),
  );
  const problems = [];
  for (const [peer, range] of Object.entries(installed.peerDependencies ?? {})) {
    let version;
    try {
      version = JSON.parse(
        readFileSync(join(dir, 'node_modules', peer, 'package.json'), 'utf8'),
      ).version;
    } catch {
      if (installed.peerDependenciesMeta?.[peer]?.optional) continue;
      problems.push(`${peer}@${range} is not installed`);
      continue;
    }
    if (!satisfies(version, range)) problems.push(`${peer}@${version} does not satisfy ${range}`);
  }
  if (problems.length) throw new Error(`peer dependency check failed: ${problems.join('; ')}`);
  return { mode: 'legacy-with-explicit-peer-check' };
}
