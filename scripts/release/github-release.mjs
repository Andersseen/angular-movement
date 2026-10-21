import { extractSection } from './changelog.mjs';
import { ReleaseError } from './stages.mjs';

const REPO = 'Andersseen/angular-movement';

export function composeNotes({ version, tag, changelog }) {
  const body = extractSection(changelog, version);
  return [
    body,
    '---',
    `**npm:** https://www.npmjs.com/package/angular-movement/v/${version}  `,
    `**Changelog:** https://github.com/${REPO}/blob/${tag}/CHANGELOG.md`,
    '',
  ].join('\n\n');
}

/**
 * Turns the draft release-please created into the final, published release. Safe to repeat: it
 * creates the release if recovery finds none, then (re)applies notes and publication.
 *
 * @param {{ view: (tag: string) => object|null, create: Function, publish: Function }} gh
 */
export function finalizeGithubRelease({ tag, version, tagSha, expectedSha, notes }, gh) {
  if (tagSha !== expectedSha) {
    throw new ReleaseError('finalization', `Tag ${tag} moved: ${tagSha} != ${expectedSha}.`);
  }
  let release = gh.view(tag);
  if (!release) gh.create({ tag, title: tag, notes });
  gh.publish({ tag, title: tag, notes });
  release = gh.view(tag);
  if (!release || release.isDraft || release.isPrerelease || release.tagName !== tag) {
    throw new ReleaseError('finalization', `GitHub Release ${tag} is not in its final state.`);
  }
  return { tag, version, url: release.url };
}
