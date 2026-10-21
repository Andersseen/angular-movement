import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { ReleaseError } from './stages.mjs';

export const PACKAGE_NAME = 'angular-movement';
export const REPOSITORY_URL = 'git+https://github.com/Andersseen/angular-movement.git';
export const MANIFEST_FILE = 'release-artifact.json';

export const digest = (file, algorithm) =>
  createHash(algorithm).update(readFileSync(file)).digest('hex');

/** `package/package.json` as shipped inside the tarball — what npm will actually publish. */
export function readTarballPackageJson(tarball) {
  const json = execFileSync('tar', ['-xOzf', tarball, 'package/package.json'], {
    encoding: 'utf8',
  });
  return JSON.parse(json);
}

function assertPublishable(pkg, version) {
  const problems = [];
  if (pkg.name !== PACKAGE_NAME) problems.push(`name is "${pkg.name}"`);
  if (pkg.version !== version) problems.push(`version is "${pkg.version}", expected "${version}"`);
  if (pkg.private) problems.push('package is marked private');
  if (pkg.repository?.url !== REPOSITORY_URL) {
    problems.push(`repository.url is "${pkg.repository?.url}", expected "${REPOSITORY_URL}"`);
  }
  if (problems.length) {
    throw new ReleaseError('validation', `Refusing to publish: ${problems.join('; ')}.`);
  }
}

/** Packs `distDir` once and records the identity of the tarball that every later job must match. */
export function packArtifact({ distDir, outDir, tag, sha, version }) {
  const out = JSON.parse(
    execFileSync('npm', ['pack', '--json', '--pack-destination', outDir], {
      cwd: distDir,
      encoding: 'utf8',
    }),
  );
  const filename = basename(out[0].filename);
  const tarball = join(outDir, filename);
  assertPublishable(readTarballPackageJson(tarball), version);
  const manifest = {
    name: PACKAGE_NAME,
    version,
    tag,
    sourceSha: sha,
    filename,
    sha256: digest(tarball, 'sha256'),
    sha1: digest(tarball, 'sha1'),
  };
  writeFileSync(join(outDir, MANIFEST_FILE), `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

/** Re-checks a downloaded artifact against its manifest and the expected release identity. */
export function verifyArtifact({ dir, version, sha }) {
  const manifest = JSON.parse(readFileSync(join(dir, MANIFEST_FILE), 'utf8'));
  const fail = (message) => {
    throw new ReleaseError('validation', message);
  };
  if (manifest.version !== version) fail(`Artifact is ${manifest.version}, expected ${version}.`);
  if (sha && manifest.sourceSha !== sha) fail(`Artifact was built from ${manifest.sourceSha}.`);
  if (manifest.filename !== `${PACKAGE_NAME}-${version}.tgz`) {
    fail(`Unexpected tarball name ${manifest.filename}.`);
  }
  const extras = readdirSync(dir).filter((f) => f !== MANIFEST_FILE && f !== manifest.filename);
  if (extras.length) fail(`Unexpected files in the release artifact: ${extras.join(', ')}.`);

  const tarball = join(dir, manifest.filename);
  const actual = digest(tarball, 'sha256');
  if (actual !== manifest.sha256) {
    fail(`Tarball SHA-256 ${actual} does not match the verified ${manifest.sha256}.`);
  }
  assertPublishable(readTarballPackageJson(tarball), version);
  return { manifest, tarball };
}
