/**
 * Failure vocabulary for the release pipeline. Every thrown `ReleaseError` carries the stage it
 * belongs to so the final report can say *what* failed instead of a bare "release failed".
 */
export const STAGES = Object.freeze({
  preparation: 'Release preparation failed',
  validation: 'Release validation failed',
  auth: 'Authentication/setup blocked',
  publish: 'npm publication failed',
  finalization: 'npm publication succeeded but GitHub Release finalization failed',
  complete: 'Release fully completed',
});

export class ReleaseError extends Error {
  /** @param {keyof typeof STAGES} stage */
  constructor(stage, message) {
    super(message);
    this.name = 'ReleaseError';
    this.stage = stage;
  }
}

/**
 * Collapses the `needs` results of the release workflow into one outcome.
 * @param {Record<string, {result: string, outputs?: Record<string, string>}>} needs
 */
export function classifyOutcome(needs) {
  const result = (job) => needs[job]?.result ?? 'skipped';
  const failed = (job) => ['failure', 'cancelled'].includes(result(job));
  const publishStatus = needs.publish?.outputs?.status ?? '';

  if (failed('prepare') || failed('resolve')) return 'preparation';
  if (['package', 'quality', 'consumer', 'consumer-runtime'].some(failed)) return 'validation';
  if (failed('publish')) return publishStatus === 'auth-blocked' ? 'auth' : 'publish';
  if (failed('finalize')) return 'finalization';
  if (result('finalize') === 'success') return 'complete';
  return null; // nothing was released in this run
}

export function renderReport(needs) {
  const outcome = classifyOutcome(needs);
  const lines = ['## Release pipeline', '', '| Job | Result |', '| --- | --- |'];
  for (const [job, value] of Object.entries(needs)) lines.push(`| ${job} | ${value.result} |`);
  lines.push('');
  if (outcome === null) lines.push('No release was attempted in this run.');
  else lines.push(`**${STAGES[outcome]}.**`);
  return { outcome, markdown: lines.join('\n') };
}
