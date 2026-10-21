/**
 * Release-decision simulation. Runs the *real* release-please engine (same version the workflow's
 * pinned action bundles) against this repo's *real* config and manifest, with fixture commits
 * instead of the GitHub API. Nothing is published, tagged or pushed.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { Manifest } = require('release-please');
const { PullRequestTitle } = require('release-please/build/src/util/pull-request-title');

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const LIB = 'projects/movement/src/lib/x.ts';
const SITE = 'src/app/home.ts';
const MCP = 'projects/movement-mcp/src/server.ts';
let n = 0;
const commit = (message, ...files) => ({
  sha: `sha${String(++n).padStart(37, '0')}`,
  message,
  files,
});

function fakeGithub({ commits, files = {}, releaseSha = 'release-sha-1.2.0', version = '1.2.0' }) {
  const all = {
    'release-please-config.json': read('release-please-config.json'),
    '.release-please-manifest.json': JSON.stringify({ 'projects/movement': version }),
    'projects/movement/package.json': JSON.stringify({ name: 'angular-movement', version }),
    ...files,
  };
  const history = [
    ...commits,
    { sha: releaseSha, message: `chore(release): angular-movement v${version}`, files: [] },
  ];
  return {
    repository: { owner: 'Andersseen', repo: 'angular-movement', defaultBranch: 'main' },
    async *mergeCommitIterator() {
      yield* history;
    },
    async *pullRequestIterator() {},
    async *tagIterator() {},
    async *releaseIterator() {
      yield {
        id: 1,
        name: `v${version}`,
        tagName: `v${version}`,
        sha: releaseSha,
        notes: '',
        draft: false,
        prerelease: false,
      };
    },
    async findFilesByGlobAndRef() {
      return [];
    },
    async getFileJson(path) {
      if (!(path in all)) throw new Error(`not found: ${path}`);
      return JSON.parse(all[path]);
    },
    async getFileContentsOnBranch(path) {
      if (!(path in all)) {
        const error = new Error(`not found: ${path}`);
        error.status = 404;
        throw Object.assign(error, { name: 'FileNotFoundError' });
      }
      const content = all[path];
      return {
        content: Buffer.from(content).toString('base64'),
        sha: 'blob',
        parsedContent: content,
      };
    },
  };
}

async function propose(opts) {
  const manifest = await Manifest.fromManifest(
    fakeGithub(opts),
    'main',
    'release-please-config.json',
    '.release-please-manifest.json',
  );
  return manifest.buildPullRequests([], []);
}

describe('release proposals', () => {
  it('feat -> minor', async () => {
    const [pr] = await propose({ commits: [commit('feat: spring presets', LIB)] });
    assert.equal(pr.version.toString(), '1.3.0');
  });

  it('fix -> patch', async () => {
    const [pr] = await propose({ commits: [commit('fix: leak on cancel', LIB)] });
    assert.equal(pr.version.toString(), '1.2.1');
  });

  it('breaking change -> major', async () => {
    const [pr] = await propose({
      commits: [commit('feat!: rename moveEnter input', LIB)],
    });
    assert.equal(pr.version.toString(), '2.0.0');
    const [footer] = await propose({
      commits: [commit('fix: tweak\n\nBREAKING CHANGE: removes a selector', LIB)],
    });
    assert.equal(footer.version.toString(), '2.0.0');
  });

  it('docs/chore/test/refactor in the library alone propose nothing', async () => {
    const prs = await propose({
      commits: [
        commit('docs: readme', LIB),
        commit('chore: tidy', LIB),
        commit('test: add spec', LIB),
        commit('refactor: rename private field', LIB),
      ],
    });
    assert.equal(prs.length, 0);
  });

  it('website, docs-tree and MCP changes never release the library', async () => {
    const prs = await propose({
      commits: [
        commit('feat(site): new homepage', SITE, 'docs/ai/STATE.md'),
        commit('fix(site): contrast', SITE),
        commit('feat(mcp): new tool', MCP),
        commit('fix: release workflow', '.github/workflows/release.yml', 'scripts/release/cli.mjs'),
      ],
    });
    assert.equal(prs.length, 0);
  });

  it('Dependabot-only commits do not release', async () => {
    const prs = await propose({
      commits: [
        commit('chore(deps): bump the angular group', 'package.json', 'pnpm-lock.yaml'),
        commit('chore(deps-dev): bump vitest', 'package.json', 'pnpm-lock.yaml'),
      ],
    });
    assert.equal(prs.length, 0);
  });

  it('accumulates many commits into ONE release at the highest bump', async () => {
    const prs = await propose({
      commits: [
        commit('fix: one', LIB),
        commit('feat: two', LIB),
        commit('fix: three', LIB),
        commit('feat(site): not mine', SITE),
        commit('docs: ignored', LIB),
      ],
    });
    assert.equal(prs.length, 1);
    assert.equal(prs[0].version.toString(), '1.3.0');
    assert.match(prs[0].body.toString(), /two/);
    assert.match(prs[0].body.toString(), /one/);
    assert.doesNotMatch(prs[0].body.toString(), /not mine/);
  });

  it('is idempotent: identical history yields the identical proposal', async () => {
    const commits = [commit('feat: a', LIB), commit('fix: b', LIB)];
    const [first] = await propose({ commits });
    const [second] = await propose({ commits });
    assert.equal(first.title.toString(), second.title.toString());
    assert.equal(first.headRefName, second.headRefName);
    assert.equal(first.version.toString(), second.version.toString());
  });

  it('bootstraps from the real v1.2.0 baseline to 1.3.0 (never 1.2.1 or a restart)', async () => {
    // The 1.3 milestone as it sits on main: a merge commit, feat commits and a fix, no new tag.
    const [pr] = await propose({
      commits: [
        commit('Merge pull request #85 from Andersseen/feat/1.3-adoption-dx-site', LIB),
        commit('feat: packed-package runtime validation and layout cancel cleanup', LIB),
        commit('fix(ci): survive npm arborist crash in consumer validation', LIB),
      ],
    });
    assert.equal(pr.version.toString(), '1.3.0');
  });

  it('uses the established tag convention and a recognisable PR title', async () => {
    const [pr] = await propose({ commits: [commit('feat: a', LIB)] });
    assert.equal(pr.title.toString(), 'chore(release): angular-movement v1.3.0');
    const body = pr.body.toString();
    assert.match(body, /compare\/v1\.2\.0\.\.\.v1\.3\.0/);
    assert.ok(!/angular-movement-v1/.test(body) && !/angular-movement@1/.test(body));
    // release-please finds a merged Release PR again by parsing this title, so it must round-trip.
    const parsed = PullRequestTitle.parse(
      pr.title.toString(),
      'chore(release): angular-movement v${version}',
    );
    assert.equal(parsed?.getVersion()?.toString(), '1.3.0');
  });

  it('bumps only projects/movement/package.json and the manifest; the MCP package is untouched', async () => {
    const [pr] = await propose({ commits: [commit('feat: a', LIB)] });
    const paths = pr.updates.map((u) => u.path);
    assert.ok(paths.includes('projects/movement/package.json'));
    assert.ok(paths.includes('.release-please-manifest.json'));
    assert.ok(!paths.some((p) => p.includes('movement-mcp')));
    assert.ok(!paths.includes('package.json'), 'the private root package.json stays at 0.0.0');
    assert.ok(!paths.includes('CHANGELOG.md'), 'the changelog is written by the fold adapter');
  });

  it('applies the version bump to the real library package.json', async () => {
    const [pr] = await propose({ commits: [commit('feat: a', LIB)] });
    const update = pr.updates.find((u) => u.path === 'projects/movement/package.json');
    const next = JSON.parse(update.updater.updateContent(read('projects/movement/package.json')));
    assert.equal(next.version, '1.3.0');
    assert.equal(next.name, 'angular-movement');
  });
});
