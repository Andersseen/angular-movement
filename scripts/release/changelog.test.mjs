import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { extractNotes, extractSection, foldIntoChangelog, hasSection } from './changelog.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');

const PR_BODY = `:robot: I have created a release *beep* *boop*
---


## [1.4.0](https://github.com/Andersseen/angular-movement/compare/v1.3.0...v1.4.0) (2026-11-02)


### Features

* **spring:** damping presets ([abc1234](https://github.com/Andersseen/angular-movement/commit/abc1234))

### Bug Fixes

* release the host on cancel ([def5678](https://github.com/Andersseen/angular-movement/commit/def5678))

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).`;

const HISTORY = `# Changelog

## [1.3.0] - 2026-10-22

Shipped.

## [1.2.0] - 2026-09-26

Older.
`;

describe('release notes extraction', () => {
  it('reads the generated section out of a release-please PR body', () => {
    const notes = extractNotes(PR_BODY);
    assert.match(notes, /^## \[1\.4\.0\]/);
    assert.match(notes, /damping presets/);
    assert.doesNotMatch(notes, /beep|Release Please/);
  });

  it('rejects a body that is not release-please output', () => {
    assert.throws(() => extractNotes('hello'), /release-please format/);
  });
});

describe('root CHANGELOG.md behaviour', () => {
  const notes = extractNotes(PR_BODY);

  it('inserts the new section above the previous release in the repo heading style', () => {
    const { content, changed } = foldIntoChangelog(HISTORY, '1.4.0', notes);
    assert.ok(changed);
    assert.ok(content.indexOf('## [1.4.0] - 2026-11-02') < content.indexOf('## [1.3.0]'));
    assert.match(content, /\*\*Full changelog:\*\* \[v1\.3\.0\.\.\.v1\.4\.0\]/);
    assert.match(content, /damping presets/);
    assert.ok(content.includes('## [1.2.0] - 2026-09-26'), 'history is preserved');
  });

  it('is idempotent', () => {
    const once = foldIntoChangelog(HISTORY, '1.4.0', notes).content;
    const twice = foldIntoChangelog(once, '1.4.0', notes);
    assert.equal(twice.changed, false);
    assert.equal(twice.content, once);
  });

  it('folds hand-written Unreleased notes in first, loses nothing and removes the heading', () => {
    const withCurated = HISTORY.replace(
      '# Changelog\n',
      '# Changelog\n\n## Unreleased\n\n**Highlights.** Curated words.\n\n### Added\n\n- A thing.\n',
    );
    const { content } = foldIntoChangelog(withCurated, '1.4.0', notes);
    assert.doesNotMatch(content, /## Unreleased/);
    assert.match(content, /Curated words\./);
    assert.match(content, /- A thing\./);
    assert.match(content, /### Commits in this release/);
    assert.match(content, /#### Features/);
    assert.ok(content.indexOf('Curated words.') < content.indexOf('damping presets'));
    assert.equal(content.match(/## \[1\.4\.0\]/g).length, 1);
  });

  it('keeps the real pending 1.3 notes intact when the 1.3.0 Release PR is prepared', () => {
    const real = readFileSync(join(ROOT, 'CHANGELOG.md'), 'utf8');
    if (!/^## Unreleased/m.test(real)) return; // already released; nothing left to fold
    const unreleased = /^## Unreleased\n([\s\S]*?)(?=^## \[)/m.exec(real)[1].trim();
    const body = PR_BODY.replace(/1\.4\.0/g, '1.3.0').replace('v1.3.0...', 'v1.2.0...');
    const { content } = foldIntoChangelog(real, '1.3.0', extractNotes(body));
    assert.ok(content.includes(unreleased), 'every human-authored 1.3 line survives verbatim');
    assert.doesNotMatch(content, /^## Unreleased/m);
    assert.ok(content.includes('## [1.2.0] - 2026-09-26'));
    assert.equal(content.match(/^## \[1\.3\.0\]/gm).length, 1);
  });

  it('extracts one section for the GitHub Release body', () => {
    const { content } = foldIntoChangelog(HISTORY, '1.4.0', notes);
    assert.equal(extractSection(content, '1.3.0'), 'Shipped.');
    assert.match(extractSection(content, '1.4.0'), /damping presets/);
    assert.throws(() => extractSection(content, '9.9.9'), /no "## \[9\.9\.9\]"/);
    assert.ok(hasSection(content, '1.2.0'));
  });
});
