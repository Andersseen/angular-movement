import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { compareVersions } from './semver.mjs';
import { ReleaseError } from './stages.mjs';
import { getVersionState } from './npm-registry.mjs';
import { verifyArtifact } from './artifact.mjs';

const AUTH_FAILURE =
  /ENEEDAUTH|E401|E403|Unable to authenticate|need auth|trusted publisher|OIDC|id-token/i;
const OVERWRITE = /cannot publish over|previously published|EPUBLISHCONFLICT/i;

export const SETUP_HELP =
  'npm rejected the credentials. Trusted publishing is not ready: on npmjs.com open the ' +
  'angular-movement package settings > Trusted Publisher > GitHub Actions and enter user ' +
  '"Andersseen", repository "angular-movement", workflow "release.yml", environment ' +
  '"npm-publish". See docs/RELEASING.md. No token fallback is attempted.';

/** The pipeline must never publish with a stored secret; OIDC is the only accepted identity. */
export function assertNoLongLivedCredentials(env, npmrcFiles = []) {
  for (const key of ['NODE_AUTH_TOKEN', 'NPM_TOKEN', 'NPM_CONFIG__AUTH', 'NPM_CONFIG__AUTHTOKEN']) {
    if (env[key])
      throw new ReleaseError('validation', `${key} is set; refusing to publish with a token.`);
  }
  for (const file of npmrcFiles) {
    if (existsSync(file) && /_auth(Token)?\s*=/i.test(readFileSync(file, 'utf8'))) {
      throw new ReleaseError('validation', `${file} contains an auth token; refusing to publish.`);
    }
  }
}

export function classifyPublishFailure(output) {
  if (OVERWRITE.test(output)) return 'conflict';
  if (AUTH_FAILURE.test(output)) return 'auth-blocked';
  return 'failed';
}

/**
 * @param {{dir: string, version: string, sha?: string, env: object, npmrcFiles?: string[]}} input
 * @param {{ getState?: Function, run: (tarball: string) => {code: number, output: string} }} deps
 * @returns {Promise<{status: 'published'|'already-published', message: string}>}
 */
export async function publishArtifact(input, deps) {
  const getState = deps.getState ?? getVersionState;
  const { manifest, tarball } = verifyArtifact(input);
  assertNoLongLivedCredentials(input.env, input.npmrcFiles ?? [join(homedir(), '.npmrc')]);

  const identical = (state) => state.meta?.dist?.shasum === manifest.sha1;
  const before = await getState(manifest.name, manifest.version);
  if (before.versionExists) {
    if (identical(before)) {
      return {
        status: 'already-published',
        message: `${manifest.name}@${manifest.version} is already on npm.`,
      };
    }
    throw new ReleaseError(
      'validation',
      `${manifest.name}@${manifest.version} exists on npm with different content. Versions are immutable; cut a new release.`,
    );
  }
  if (before.latest && compareVersions(manifest.version, before.latest) <= 0) {
    throw new ReleaseError(
      'validation',
      `Version regression: npm latest is ${before.latest}, refusing to publish ${manifest.version}.`,
    );
  }

  const { code, output } = deps.run(tarball);
  if (code === 0)
    return { status: 'published', message: `Published ${manifest.name}@${manifest.version}.` };

  const kind = classifyPublishFailure(output);
  if (kind === 'conflict' || kind === 'failed') {
    // A retry or a racing run may have won; trust the registry, not the exit code.
    const after = await getState(manifest.name, manifest.version).catch(() => null);
    if (after?.versionExists && identical(after)) {
      return { status: 'already-published', message: 'Another run published this exact artifact.' };
    }
  }
  if (kind === 'auth-blocked') throw new ReleaseError('auth', `${SETUP_HELP}\n\n${output.trim()}`);
  throw new ReleaseError('publish', `npm publish failed:\n${output.trim()}`);
}
