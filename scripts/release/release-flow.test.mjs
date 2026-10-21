import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { composeNotes, finalizeGithubRelease } from './github-release.mjs';
import { retry, verifyPublished } from './npm-registry.mjs';
import { classifyOutcome, renderReport } from './stages.mjs';

const SHA = 'e'.repeat(40);
const CHANGELOG =
  '# Changelog\n\n## [1.3.0] - 2026-10-22\n\nNotes.\n\n## [1.2.0] - 2026-09-26\n\nOld.\n';

function fakeGh(initial) {
  let release = initial;
  const calls = [];
  return {
    calls,
    view: () => release,
    create: ({ tag }) => {
      calls.push('create');
      release = { tagName: tag, isDraft: true, isPrerelease: false, url: 'u' };
    },
    publish: ({ tag }) => {
      calls.push('publish');
      release = { tagName: tag, isDraft: false, isPrerelease: false, url: 'u' };
    },
  };
}
const args = { tag: 'v1.3.0', version: '1.3.0', tagSha: SHA, expectedSha: SHA, notes: 'n' };

describe('GitHub Release finalization', () => {
  it('turns the draft into the single published release', () => {
    const gh = fakeGh({ tagName: 'v1.3.0', isDraft: true, isPrerelease: false, url: 'u' });
    assert.equal(finalizeGithubRelease(args, gh).tag, 'v1.3.0');
    assert.deepEqual(gh.calls, ['publish'], 'no second release is created');
  });
  it('recovers a release that is missing, and is repeatable once published', () => {
    const gh = fakeGh(null);
    finalizeGithubRelease(args, gh);
    finalizeGithubRelease(args, gh);
    assert.deepEqual(gh.calls, ['create', 'publish', 'publish']);
  });
  it('refuses when the tag no longer points at the verified release commit', () => {
    assert.throws(
      () => finalizeGithubRelease({ ...args, tagSha: 'f'.repeat(40) }, fakeGh(null)),
      /moved/,
    );
  });
  it('fails if the release does not end up final', () => {
    const gh = { view: () => ({ tagName: 'v1.3.0', isDraft: true }), create() {}, publish() {} };
    assert.throws(
      () => finalizeGithubRelease(args, gh),
      (e) => e.stage === 'finalization',
    );
  });
  it('writes notes from the changelog section with npm and changelog links', () => {
    const notes = composeNotes({ version: '1.3.0', tag: 'v1.3.0', changelog: CHANGELOG });
    assert.match(notes, /^Notes\./);
    assert.doesNotMatch(notes, /Old\./);
    assert.match(notes, /npmjs\.com\/package\/angular-movement\/v\/1\.3\.0/);
    assert.match(notes, /blob\/v1\.3\.0\/CHANGELOG\.md/);
  });
});

describe('post-publish npm verification', () => {
  const fast = { baseMs: 0, sleep: async () => {} };
  const packument = (versions, distTags) => ({
    ok: true,
    status: 200,
    json: async () => ({ versions, 'dist-tags': distTags }),
  });
  const attestations = (ok) => ({
    ok: true,
    status: ok ? 200 : 404,
    json: async () => ({
      attestations: ok ? [{ predicateType: 'https://slsa.dev/provenance/v1' }] : [],
    }),
  });

  it('retries through registry propagation instead of trusting one lookup', async () => {
    let calls = 0;
    const fetchImpl = async (url) => {
      if (url.includes('attestations')) return attestations(true);
      calls++;
      return calls < 3
        ? packument({}, { latest: '1.2.0' })
        : packument({ '1.3.0': {} }, { latest: '1.3.0' });
    };
    const report = await verifyPublished(
      { name: 'angular-movement', version: '1.3.0', requireProvenance: true },
      { fetchImpl, ...fast },
    );
    assert.equal(calls, 3);
    assert.deepEqual(report, {
      name: 'angular-movement',
      version: '1.3.0',
      distTag: 'latest',
      provenance: true,
    });
  });
  it('does not fabricate provenance', async () => {
    const fetchImpl = async (url) =>
      url.includes('attestations')
        ? attestations(false)
        : packument({ '1.3.0': {} }, { latest: '1.3.0' });
    const report = await verifyPublished(
      { name: 'angular-movement', version: '1.3.0', requireProvenance: false },
      { fetchImpl, ...fast },
    );
    assert.equal(report.provenance, false);
    await assert.rejects(
      verifyPublished(
        { name: 'angular-movement', version: '1.3.0', requireProvenance: true },
        { fetchImpl, attempts: 2, ...fast },
      ),
      (e) => e.stage === 'finalization' && /provenance/.test(e.message),
    );
  });
  it('gives up after a bounded number of attempts', async () => {
    let calls = 0;
    await assert.rejects(
      retry(async () => (calls++, { ok: false, reason: 'nope' }), { attempts: 4, ...fast }),
      /nope/,
    );
    assert.equal(calls, 4);
  });
  it('fails when the dist-tag does not point at the version', async () => {
    const fetchImpl = async () => packument({ '1.3.0': {} }, { latest: '1.2.0' });
    await assert.rejects(
      verifyPublished(
        { name: 'angular-movement', version: '1.3.0' },
        { fetchImpl, attempts: 2, ...fast },
      ),
      /dist-tag latest/,
    );
  });
});

describe('outcome classification', () => {
  const ok = { result: 'success' };
  const all = {
    prepare: ok,
    resolve: ok,
    package: ok,
    quality: ok,
    consumer: ok,
    'consumer-runtime': ok,
    publish: ok,
    finalize: ok,
  };
  it('is complete only when finalization succeeded', () => {
    assert.equal(classifyOutcome(all), 'complete');
  });
  it('maps every failure to its own stage', () => {
    assert.equal(classifyOutcome({ ...all, resolve: { result: 'failure' } }), 'preparation');
    assert.equal(
      classifyOutcome({
        ...all,
        quality: { result: 'failure' },
        publish: { result: 'skipped' },
        finalize: { result: 'skipped' },
      }),
      'validation',
    );
    assert.equal(
      classifyOutcome({
        ...all,
        publish: { result: 'failure', outputs: { status: 'auth-blocked' } },
        finalize: { result: 'skipped' },
      }),
      'auth',
    );
    assert.equal(
      classifyOutcome({
        ...all,
        publish: { result: 'failure', outputs: { status: 'failed' } },
        finalize: { result: 'skipped' },
      }),
      'publish',
    );
    assert.equal(classifyOutcome({ ...all, finalize: { result: 'failure' } }), 'finalization');
  });
  it('never reports success when publication failed', () => {
    const { markdown } = renderReport({
      ...all,
      publish: { result: 'failure' },
      finalize: { result: 'skipped' },
    });
    assert.doesNotMatch(markdown, /fully completed/);
  });
  it('reports nothing for an ordinary push that releases nothing', () => {
    assert.equal(
      classifyOutcome({
        prepare: ok,
        resolve: { result: 'skipped' },
        publish: { result: 'skipped' },
      }),
      null,
    );
  });
});
