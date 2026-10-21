import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { validateTarget } from './target.mjs';

const good = {
  tag: 'v1.3.0',
  tagSha: 'a'.repeat(40),
  expectedSha: 'a'.repeat(40),
  onMain: true,
  packageVersion: '1.3.0',
  manifestVersion: '1.3.0',
  commitSubject: 'chore(release): angular-movement v1.3.0 (#90)',
  changelog: '# Changelog\n\n## [1.3.0] - 2026-10-22\n',
};
const rejects = (patch, pattern) =>
  assert.throws(
    () => validateTarget({ ...good, ...patch }),
    (e) => e.stage === 'validation' && pattern.test(e.message),
  );

describe('release target validation', () => {
  it('accepts a merged Release PR commit on main', () => {
    assert.deepEqual(validateTarget(good), {
      tag: 'v1.3.0',
      version: '1.3.0',
      sha: 'a'.repeat(40),
    });
  });
  it('accepts a merge-commit of the release-please branch', () => {
    validateTarget({
      ...good,
      commitSubject:
        'Merge pull request #90 from Andersseen/release-please--branches--main--components--angular-movement',
    });
  });
  it('rejects arbitrary tags and component-prefixed tags', () => {
    rejects({ tag: 'angular-movement-v1.3.0' }, /not a stable library release tag/);
    rejects({ tag: 'mcp-v0.2.0' }, /not a stable library release tag/);
    rejects({ tag: 'v1.3.0-rc.1' }, /Pre-release publishing is not enabled/);
    rejects({ tag: '../../etc' }, /not a stable/);
  });
  it('rejects a missing tag, a moved tag and commits outside main', () => {
    rejects({ tagSha: null }, /does not exist/);
    rejects({ expectedSha: 'b'.repeat(40) }, /expected release commit/);
    rejects({ onMain: false }, /not part of the main branch/);
  });
  it('rejects version mismatches (hand-edited bumps)', () => {
    rejects({ packageVersion: '1.2.0' }, /package\.json is 1\.2\.0/);
    rejects({ manifestVersion: '1.2.0' }, /manifest/);
  });
  it('rejects commits that are not a Release PR and tags without a changelog section', () => {
    rejects({ commitSubject: 'feat: sneaky' }, /not a merged Release PR/);
    rejects({ changelog: '# Changelog\n' }, /no "## \[1\.3\.0\]"/);
  });
});
