import { ReleaseError } from './stages.mjs';

const STABLE = /^(\d+)\.(\d+)\.(\d+)$/;
const TAG = /^v(\d+\.\d+\.\d+)$/;

export function parseVersion(version) {
  const m = STABLE.exec(version);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/** @returns {number} negative, zero or positive like Array#sort comparators. */
export function compareVersions(a, b) {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  if (!pa || !pb) throw new ReleaseError('validation', `Cannot compare "${a}" with "${b}".`);
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i];
  return 0;
}

/** Library tags are `vX.Y.Z` (never `angular-movement-vX.Y.Z`); MCP tags use `mcp-v`. */
export function tagFor(version) {
  return `v${version}`;
}

export function versionFromTag(tag) {
  const m = TAG.exec(tag ?? '');
  if (!m) {
    throw new ReleaseError(
      'validation',
      `"${tag}" is not a stable library release tag (expected vX.Y.Z). Pre-release publishing is not enabled.`,
    );
  }
  return m[1];
}
