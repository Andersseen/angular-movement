import { hasSection } from './changelog.mjs';
import { versionFromTag } from './semver.mjs';
import { ReleaseError } from './stages.mjs';

const RELEASE_COMMIT = /^chore\(release\): angular-movement v\d+\.\d+\.\d+/;
const RELEASE_BRANCH = /release-please--branches--main--components--angular-movement/;

/**
 * Decides whether a tag may be published. Everything is a fact read from git by the caller, never
 * from workflow inputs, so a dispatch can only name a release that already exists on `main`.
 *
 * @param {{
 *   tag: string, expectedSha?: string, tagSha: string|null, packageVersion: string,
 *   manifestVersion: string, onMain: boolean, commitSubject: string, changelog: string,
 * }} facts
 */
export function validateTarget(facts) {
  const version = versionFromTag(facts.tag);
  const fail = (message) => {
    throw new ReleaseError('validation', message);
  };

  if (!facts.tagSha) fail(`Tag ${facts.tag} does not exist.`);
  if (facts.expectedSha && facts.expectedSha !== facts.tagSha) {
    fail(
      `Tag ${facts.tag} points to ${facts.tagSha}, expected release commit ${facts.expectedSha}.`,
    );
  }
  if (!facts.onMain) fail(`Release commit ${facts.tagSha} is not part of the main branch history.`);
  if (facts.packageVersion !== version) {
    fail(
      `projects/movement/package.json is ${facts.packageVersion} at ${facts.tag}, not ${version}.`,
    );
  }
  if (facts.manifestVersion !== version) {
    fail(
      `.release-please-manifest.json is ${facts.manifestVersion} at ${facts.tag}, not ${version}.`,
    );
  }
  if (!RELEASE_COMMIT.test(facts.commitSubject) && !RELEASE_BRANCH.test(facts.commitSubject)) {
    fail(`${facts.tagSha} is not a merged Release PR ("${facts.commitSubject}").`);
  }
  if (!hasSection(facts.changelog, version)) fail(`CHANGELOG.md has no "## [${version}]" section.`);
  return { tag: facts.tag, version, sha: facts.tagSha };
}
