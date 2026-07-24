#!/usr/bin/env node
/**
 * Release automation for the `angular-movement` library.
 *
 * Does the manual pre-release chores in one command:
 *   1. Bumps the version in projects/movement/package.json
 *   2. Rolls CHANGELOG.md: "Unreleased" -> "[X.Y.Z] - YYYY-MM-DD", opens a fresh Unreleased
 *   3. Commits (chore(release): vX.Y.Z) and creates an annotated tag vX.Y.Z
 *   4. With --push, pushes the commit + tag, which triggers .github/workflows/release.yml
 *      (npm publish + GitHub Release).
 *
 * Usage:
 *   pnpm release <patch|minor|major|X.Y.Z> [--push] [--dry-run] [--verify]
 *
 * Examples:
 *   pnpm release minor            # 0.5.0 -> 0.6.0, commit + tag locally
 *   pnpm release 0.6.0 --push     # set exact version, then push commit + tag
 *   pnpm release patch --dry-run  # preview everything, change nothing
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LIB_PKG = resolve(ROOT, 'projects/movement/package.json');
const CHANGELOG = resolve(ROOT, 'CHANGELOG.md');

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const bumpArg = args.find((a) => !a.startsWith('--'));
const DRY = flags.has('--dry-run');
const PUSH = flags.has('--push');
const VERIFY = flags.has('--verify');

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};
const log = (m) => console.log(m);
const info = (m) => log(`${c.cyan}›${c.reset} ${m}`);
const ok = (m) => log(`${c.green}✓${c.reset} ${m}`);
const warn = (m) => log(`${c.yellow}!${c.reset} ${m}`);
const fail = (m) => {
  log(`${c.red}✗ ${m}${c.reset}`);
  process.exit(1);
};

function sh(cmd, opts = {}) {
  return execSync(cmd, { cwd: ROOT, stdio: 'pipe', encoding: 'utf8', ...opts }).trim();
}
function shLive(cmd) {
  execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
}

function parseSemver(v) {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(v);
  if (!m) return null;
  return { major: +m[1], minor: +m[2], patch: +m[3] };
}
function gt(a, b) {
  if (a.major !== b.major) return a.major > b.major;
  if (a.minor !== b.minor) return a.minor > b.minor;
  return a.patch > b.patch;
}

// ---- 0. Validate input --------------------------------------------------
if (!bumpArg) {
  fail('Missing version.  Usage: pnpm release <patch|minor|major|X.Y.Z> [--push] [--dry-run] [--verify]');
}

const pkgText = readFileSync(LIB_PKG, 'utf8');
const currentVersion = JSON.parse(pkgText).version;
const current = parseSemver(currentVersion);
if (!current) fail(`Current library version "${currentVersion}" is not plain semver.`);

let next;
if (['patch', 'minor', 'major'].includes(bumpArg)) {
  next = { ...current };
  if (bumpArg === 'major') (next.major += 1), (next.minor = 0), (next.patch = 0);
  if (bumpArg === 'minor') (next.minor += 1), (next.patch = 0);
  if (bumpArg === 'patch') next.patch += 1;
} else {
  next = parseSemver(bumpArg);
  if (!next) fail(`"${bumpArg}" is not a bump keyword or an X.Y.Z version.`);
}
const nextVersion = `${next.major}.${next.minor}.${next.patch}`;
const tag = `v${nextVersion}`;

if (!gt(next, current)) fail(`Target ${nextVersion} is not greater than current ${currentVersion}.`);

// ---- 1. Preconditions ---------------------------------------------------
const branch = sh('git rev-parse --abbrev-ref HEAD');
const dirty = sh('git status --porcelain');
if (dirty && !DRY) {
  fail('Working tree is not clean. Commit or stash your changes before releasing.');
}
try {
  sh(`git rev-parse -q --verify "refs/tags/${tag}"`);
  fail(`Tag ${tag} already exists.`);
} catch {
  /* tag does not exist — good */
}

// ---- 2. Read + validate CHANGELOG Unreleased ---------------------------
const changelog = readFileSync(CHANGELOG, 'utf8');
const unreleasedRe = /^## Unreleased[ \t]*$/m;
if (!unreleasedRe.test(changelog)) fail('No "## Unreleased" heading found in CHANGELOG.md.');
const afterUnreleased = changelog.slice(changelog.search(unreleasedRe));
const nextHeadingIdx = afterUnreleased.slice(1).search(/^## /m);
const unreleasedBody =
  nextHeadingIdx === -1 ? afterUnreleased : afterUnreleased.slice(0, nextHeadingIdx + 1);
if (!/^-\s+\S/m.test(unreleasedBody)) {
  warn('The Unreleased section has no bullet entries — releasing an empty changelog section.');
}

// ---- 3. Compute edits ---------------------------------------------------
const date = (() => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
})();

const newPkgText = pkgText.replace(
  /("version":\s*")\d+\.\d+\.\d+(")/,
  `$1${nextVersion}$2`,
);
if (newPkgText === pkgText) fail('Could not find a "version" field to update in the library package.json.');

const newChangelog = changelog.replace(unreleasedRe, `## Unreleased\n\n## [${nextVersion}] - ${date}`);

// ---- Summary ------------------------------------------------------------
log('');
log(`${c.bold}Release plan${c.reset}`);
info(`branch:   ${branch}`);
info(`version:  ${c.dim}${currentVersion}${c.reset} → ${c.green}${nextVersion}${c.reset}`);
info(`tag:      ${tag}`);
info(`date:     ${date}`);
log('');
log(`${c.dim}Changelog entries moving into [${nextVersion}]:${c.reset}`);
log(
  unreleasedBody
    .replace(unreleasedRe, '')
    .trim()
    .split('\n')
    .map((l) => `  ${l}`)
    .join('\n') || '  (none)',
);
log('');

if (DRY) {
  warn('Dry run — no files written, nothing committed.');
  log(`Would run:`);
  log(`  ${c.dim}git add projects/movement/package.json CHANGELOG.md${c.reset}`);
  log(`  ${c.dim}git commit -m "chore(release): ${tag}"${c.reset}`);
  log(`  ${c.dim}git tag -a ${tag} -m "${tag}"${c.reset}`);
  if (PUSH) log(`  ${c.dim}git push --follow-tags${c.reset}`);
  process.exit(0);
}

// ---- 4. Optional verification ------------------------------------------
if (VERIFY) {
  info('Running verification (lint, tests, pack check)…');
  shLive('pnpm run lint');
  shLive('pnpm run test:coverage');
  shLive('pnpm run pack:check');
  ok('Verification passed.');
}

// ---- 5. Write, commit, tag ---------------------------------------------
writeFileSync(LIB_PKG, newPkgText);
writeFileSync(CHANGELOG, newChangelog);
ok(`Bumped version and rolled changelog to ${nextVersion}.`);

sh('git add projects/movement/package.json CHANGELOG.md');
shLive(`git commit -m "chore(release): ${tag}"`);
sh(`git tag -a ${tag} -m "${tag}"`);
ok(`Committed and tagged ${tag}.`);

if (PUSH) {
  info('Pushing commit and tag…');
  shLive('git push --follow-tags');
  ok(`Pushed. The Release workflow will publish ${tag} to npm and create the GitHub Release.`);
} else {
  log('');
  info('Not pushed yet. To trigger the release, run:');
  log(`  ${c.bold}git push --follow-tags${c.reset}`);
}
