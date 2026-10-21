import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { REPOSITORY_URL, packArtifact } from './artifact.mjs';
import {
  assertNoLongLivedCredentials,
  classifyPublishFailure,
  publishArtifact,
} from './publish.mjs';

const SHA = 'c'.repeat(40);

/** A real tarball, produced by the real `npm pack`, from a throwaway package directory. */
function artifact({
  version = '1.3.0',
  name = 'angular-movement',
  repository = REPOSITORY_URL,
} = {}) {
  const base = mkdtempSync(join(tmpdir(), 'release-test-'));
  const dist = join(base, 'dist');
  const out = join(base, 'out');
  mkdirSync(dist);
  mkdirSync(out);
  writeFileSync(
    join(dist, 'package.json'),
    JSON.stringify({ name, version, repository: { type: 'git', url: repository } }),
  );
  writeFileSync(join(dist, 'index.js'), 'export {};\n');
  const manifest = packArtifact({
    distDir: dist,
    outDir: out,
    tag: `v${version}`,
    sha: SHA,
    version,
  });
  return { dir: out, manifest, tarball: join(out, manifest.filename) };
}

const registry = (state) => async () => state;
const absent = {
  packageExists: true,
  versionExists: false,
  latest: '1.2.0',
  distTags: { latest: '1.2.0' },
};
const input = (a, extra = {}) => ({
  dir: a.dir,
  version: '1.3.0',
  sha: SHA,
  env: {},
  npmrcFiles: [],
  ...extra,
});
const never = () => assert.fail('npm publish must not run');

describe('publishArtifact', () => {
  it('publishes a verified artifact', async () => {
    const a = artifact();
    let ran = 0;
    const result = await publishArtifact(input(a), {
      getState: registry(absent),
      run: (tarball) => {
        ran++;
        assert.equal(tarball, a.tarball, 'publishes the verified tarball, not a rebuilt one');
        return { code: 0, output: '' };
      },
    });
    assert.equal(result.status, 'published');
    assert.equal(ran, 1);
  });

  it('does not republish an identical version that is already on npm', async () => {
    const a = artifact();
    const state = { ...absent, versionExists: true, meta: { dist: { shasum: a.manifest.sha1 } } };
    const result = await publishArtifact(input(a), { getState: registry(state), run: never });
    assert.equal(result.status, 'already-published');
  });

  it('never overwrites an existing version with different content', async () => {
    const a = artifact();
    const state = { ...absent, versionExists: true, meta: { dist: { shasum: 'f'.repeat(40) } } };
    await assert.rejects(
      publishArtifact(input(a), { getState: registry(state), run: never }),
      /different content/,
    );
  });

  it('prevents version regression', async () => {
    const a = artifact();
    await assert.rejects(
      publishArtifact(input(a), { getState: registry({ ...absent, latest: '1.4.0' }), run: never }),
      /Version regression/,
    );
  });

  it('refuses a tampered tarball (SHA-256 mismatch)', async () => {
    const a = artifact();
    writeFileSync(a.tarball, 'not the verified artifact');
    await assert.rejects(
      publishArtifact(input(a), { getState: registry(absent), run: never }),
      /SHA-256/,
    );
  });

  it('refuses a mismatched artifact version, source commit, name or repository', async () => {
    const a = artifact();
    await assert.rejects(
      publishArtifact(input(a, { version: '1.4.0' }), { getState: registry(absent), run: never }),
      /Artifact is 1\.3\.0/,
    );
    await assert.rejects(
      publishArtifact(input(a, { sha: 'd'.repeat(40) }), {
        getState: registry(absent),
        run: never,
      }),
      /built from/,
    );
    // The pack step applies the same identity gate, so a wrong package never becomes an artifact.
    assert.throws(() => artifact({ name: 'someone-elses-package' }), /name is/);
    assert.throws(
      () => artifact({ repository: 'git+https://github.com/evil/fork.git' }),
      /repository\.url/,
    );
  });

  it('fails safely, with setup instructions, when OIDC is not authorised', async () => {
    const a = artifact();
    const error = await publishArtifact(input(a), {
      getState: registry(absent),
      run: () => ({
        code: 1,
        output:
          'npm error code ENEEDAUTH\nnpm error need auth This command requires you to be logged in.',
      }),
    }).catch((e) => e);
    assert.equal(error.stage, 'auth');
    assert.match(error.message, /Trusted publishing is not ready/);
    assert.match(error.message, /release\.yml/);
    assert.match(error.message, /No token fallback/);
  });

  it('reports a publish failure as a publish failure, not as success', async () => {
    const a = artifact();
    const error = await publishArtifact(input(a), {
      getState: registry(absent),
      run: () => ({ code: 1, output: 'npm error code E500\nnpm error registry exploded' }),
    }).catch((e) => e);
    assert.equal(error.stage, 'publish');
  });

  it('is recoverable: a rerun after a failed publish publishes, one after success skips', async () => {
    const a = artifact();
    const failing = { getState: registry(absent), run: () => ({ code: 1, output: 'E500' }) };
    await assert.rejects(publishArtifact(input(a), failing));
    const retry = await publishArtifact(input(a), {
      getState: registry(absent),
      run: () => ({ code: 0, output: '' }),
    });
    assert.equal(retry.status, 'published');
    const published = {
      ...absent,
      versionExists: true,
      meta: { dist: { shasum: a.manifest.sha1 } },
    };
    assert.equal(
      (await publishArtifact(input(a), { getState: registry(published), run: never })).status,
      'already-published',
    );
  });

  it('concurrent attempts cannot double-publish: the loser sees the winner and succeeds as a no-op', async () => {
    const a = artifact();
    let published = false;
    const getState = async () =>
      published
        ? { ...absent, versionExists: true, meta: { dist: { shasum: a.manifest.sha1 } } }
        : absent;
    const run = () => {
      // The racing run lands between our pre-check and our publish; npm refuses the duplicate.
      published = true;
      return {
        code: 1,
        output: 'npm error 403 You cannot publish over the previously published versions: 1.3.0.',
      };
    };
    const result = await publishArtifact(input(a), { getState, run });
    assert.equal(result.status, 'already-published');
  });
});

describe('credentials', () => {
  it('refuses to run with a long-lived token in the environment', () => {
    for (const key of ['NODE_AUTH_TOKEN', 'NPM_TOKEN']) {
      assert.throws(
        () => assertNoLongLivedCredentials({ [key]: 'x' }),
        /refusing to publish with a token/,
      );
    }
  });
  it('refuses a token written to .npmrc', () => {
    const file = join(mkdtempSync(join(tmpdir(), 'npmrc-')), '.npmrc');
    writeFileSync(file, '//registry.npmjs.org/:_authToken=abc\n');
    assert.throws(() => assertNoLongLivedCredentials({}, [file]), /contains an auth token/);
  });
  it('classifies npm failures', () => {
    assert.equal(classifyPublishFailure('npm error code ENEEDAUTH'), 'auth-blocked');
    assert.equal(
      classifyPublishFailure(
        'Unable to authenticate, your authentication token seems to be invalid',
      ),
      'auth-blocked',
    );
    assert.equal(
      classifyPublishFailure('You cannot publish over the previously published versions'),
      'conflict',
    );
    assert.equal(classifyPublishFailure('ETIMEDOUT'), 'failed');
  });
});
