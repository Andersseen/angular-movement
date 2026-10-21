import { ReleaseError } from './stages.mjs';

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function hasSection(content, version) {
  return new RegExp(`^## \\[${escapeRe(version)}\\]`, 'm').test(content);
}

/** The generated notes sit between the first and second `---` rule of a release-please PR body. */
export function extractNotes(prBody) {
  const parts = String(prBody ?? '').split(/^---\s*$/m);
  const notes = parts.length >= 3 ? parts[1].trim() : '';
  if (!/^## \[[^\]]+\]/.test(notes)) {
    throw new ReleaseError('preparation', 'The Release PR body is not in release-please format.');
  }
  return notes;
}

/**
 * Builds the CHANGELOG.md of a Release PR.
 *
 * release-please runs with `skip-changelog` (it cannot address the root CHANGELOG.md from the
 * `projects/movement` package path), so this adapter writes the new section itself:
 *   - heading in the repo's existing style: `## [X.Y.Z] - YYYY-MM-DD`;
 *   - hand-written `## Unreleased` notes, when present, come first and are folded in (the
 *     `Unreleased` section is then removed), followed by the generated commit list;
 *   - already folded (`## [X.Y.Z]` exists) -> unchanged, so repeated runs are idempotent.
 */
export function foldIntoChangelog(content, version, notes) {
  if (hasSection(content, version)) return { content, changed: false };

  const [headingLine, ...rest] = notes.split('\n');
  const heading = /^## \[[^\]]+\]\((?<url>[^)]*)\) \((?<date>[^)]+)\)/.exec(headingLine);
  if (!heading) {
    throw new ReleaseError('preparation', `Unrecognised release notes heading: ${headingLine}`);
  }
  const { url, date } = heading.groups;
  const generated = rest.join('\n').trim();

  let remaining = content;
  let curated = '';
  const unreleased = /^## Unreleased[^\n]*\n([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(remaining);
  if (unreleased) {
    curated = unreleased[1].trim();
    remaining = remaining.replace(unreleased[0], '');
  }

  const compare = url ? `**Full changelog:** [${url.split('/').pop()}](${url})` : '';
  const parts = [`## [${version}] - ${date}`];
  if (compare) parts.push(compare);
  if (curated) {
    parts.push(curated);
    if (generated) {
      parts.push(`### Commits in this release\n\n${generated.replace(/^### /gm, '#### ')}`);
    }
  } else if (generated) {
    parts.push(generated);
  }
  const section = `${parts.join('\n\n')}\n\n`;

  const firstVersion = /^## \[/m.exec(remaining);
  const next = firstVersion
    ? remaining.slice(0, firstVersion.index) + section + remaining.slice(firstVersion.index)
    : `${remaining.trimEnd()}\n\n${section}`;
  return { content: `${next.trimEnd()}\n`, changed: true };
}

/** The `## [X.Y.Z]` section of a changelog, without its heading line. */
export function extractSection(content, version) {
  const start = new RegExp(`^## \\[${escapeRe(version)}\\][^\\n]*\\n`, 'm').exec(content);
  if (!start) {
    throw new ReleaseError('validation', `CHANGELOG.md has no "## [${version}]" section.`);
  }
  const body = content.slice(start.index + start[0].length);
  const end = /^## /m.exec(body);
  return (end ? body.slice(0, end.index) : body).trim();
}
