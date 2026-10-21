import { ReleaseError } from './stages.mjs';

const REGISTRY = 'https://registry.npmjs.org';
const enc = (name) => name.replace('/', '%2f');

export async function getVersionState(name, version, { fetchImpl = fetch } = {}) {
  const res = await fetchImpl(`${REGISTRY}/${enc(name)}`, {
    headers: { accept: 'application/vnd.npm.install-v1+json' },
  });
  if (res.status === 404) return { packageExists: false, versionExists: false, distTags: {} };
  if (!res.ok) throw new Error(`npm registry answered ${res.status} for ${name}`);
  const doc = await res.json();
  const meta = doc.versions?.[version];
  return {
    packageExists: true,
    versionExists: Boolean(meta),
    distTags: doc['dist-tags'] ?? {},
    latest: doc['dist-tags']?.latest,
    meta,
  };
}

export async function getProvenance(name, version, { fetchImpl = fetch } = {}) {
  const res = await fetchImpl(`${REGISTRY}/-/npm/v1/attestations/${enc(name)}@${version}`);
  if (res.status === 404) return false;
  if (!res.ok) throw new Error(`npm attestations endpoint answered ${res.status}`);
  const doc = await res.json();
  return (doc.attestations ?? []).some((a) =>
    String(a.predicateType).includes('slsa.dev/provenance'),
  );
}

/** Bounded retry with exponential backoff: a fresh publish takes a moment to reach every edge. */
export async function retry(
  fn,
  { attempts = 8, baseMs = 2000, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) } = {},
) {
  let last;
  for (let i = 0; i < attempts; i++) {
    try {
      const value = await fn();
      if (value.ok) return value;
      last = value.reason;
    } catch (error) {
      last = error.message;
    }
    if (i < attempts - 1) await sleep(Math.min(baseMs * 2 ** i, 30_000));
  }
  throw new Error(last);
}

/**
 * Confirms what npm now serves. Provenance is only reported as verified when the registry returns
 * a SLSA provenance attestation; it is never assumed.
 */
export async function verifyPublished(
  { name, version, distTag = 'latest', requireProvenance },
  deps = {},
) {
  try {
    const report = await retry(async () => {
      const state = await getVersionState(name, version, deps);
      if (!state.versionExists) return { ok: false, reason: `${name}@${version} not visible yet` };
      if (state.distTags[distTag] !== version) {
        return {
          ok: false,
          reason: `dist-tag ${distTag} is ${state.distTags[distTag]}, expected ${version}`,
        };
      }
      const provenance = await getProvenance(name, version, deps);
      if (requireProvenance && !provenance) {
        return { ok: false, reason: `no provenance attestation for ${name}@${version} yet` };
      }
      return { ok: true, report: { name, version, distTag, provenance } };
    }, deps);
    return report.report;
  } catch (error) {
    throw new ReleaseError('finalization', `npm verification failed: ${error.message}`);
  }
}
