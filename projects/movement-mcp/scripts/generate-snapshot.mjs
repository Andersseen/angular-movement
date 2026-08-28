#!/usr/bin/env node
/**
 * Regenerates projects/movement-mcp/src/data/api-snapshot.json — the static data the MCP server
 * serves at runtime (no live source parsing in the published package).
 *
 * Sources, each already a maintained source of truth elsewhere in this repo:
 *   - `.claude/scripts/api-surface.mjs --json` for selector/exportAs/inputs/outputs/signals
 *     (regex-based, dependency-free, run as a subprocess so this script doesn't duplicate that
 *     parsing logic).
 *   - `src/app/shared/api/directive-reference.ts`'s DIRECTIVE_REFERENCE for human descriptions and
 *     input types/defaults (kept honest by `pnpm docs:check` in CI).
 *   - `projects/movement/src/lib/presets/presets.types.ts`'s MovePreset union for preset names.
 *
 * The one-shot/reactive classification is not structurally derivable from source (it's a design
 * fact documented in prose in docs/ai/STATE.md), so it's a short hardcoded allowlist below —
 * update it if STATE.md's one-shot list changes.
 *
 *   node scripts/generate-snapshot.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '..', '..', '..');
const OUT = join(HERE, '..', 'src', 'data', 'api-snapshot.json');

const ONE_SHOT = new Set([
  'MoveAnimateDirective',
  'MoveEnterDirective',
  'MoveLeaveDirective',
  'MoveInViewDirective',
  'MoveSmoothScrollDirective',
]);
const REACTIVE = new Set(['MoveLoopDirective', 'MoveTextDirective', 'MoveAnimationDirective']);

function oneShotFlag(className) {
  if (ONE_SHOT.has(className)) return true;
  if (REACTIVE.has(className)) return false;
  return null;
}

/** Runs the existing regex-based extractor and parses its --json output. */
function loadApiSurface() {
  const out = execFileSync('node', ['.claude/scripts/api-surface.mjs', '--json'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  });
  return JSON.parse(out);
}

/**
 * DIRECTIVE_REFERENCE is plain-JS-shaped (object/array literals only) apart from a TS interface
 * and one type annotation. Strip just those two constructs, then import the rest as real JS —
 * more robust than re-deriving every field with regex, and it's our own repo file.
 */
async function loadDirectiveReference() {
  const path = join(REPO_ROOT, 'src/app/shared/api/directive-reference.ts');
  const source = readFileSync(path, 'utf8');
  const stripped = source
    .replace(/export interface DirectiveInfo \{[\s\S]*?\n\}\n/, '')
    .replace('export const DIRECTIVE_REFERENCE: DirectiveInfo[] = [', 'export const DIRECTIVE_REFERENCE = [');

  const tmpDir = mkdtempSync(join(tmpdir(), 'movement-mcp-'));
  const tmpFile = join(tmpDir, 'directive-reference.mjs');
  writeFileSync(tmpFile, stripped);
  try {
    const mod = await import(pathToFileURL(tmpFile).href);
    return mod.DIRECTIVE_REFERENCE;
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

function loadPresets() {
  const path = join(REPO_ROOT, 'projects/movement/src/lib/presets/presets.types.ts');
  const source = readFileSync(path, 'utf8');
  const match = source.match(/export type MovePreset =\s*([\s\S]*?);/);
  if (!match) throw new Error('Could not find MovePreset union in presets.types.ts');
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

const [surface, reference, presets] = await Promise.all([
  Promise.resolve(loadApiSurface()),
  loadDirectiveReference(),
  Promise.resolve(loadPresets()),
]);

const referenceByName = new Map(reference.map((r) => [r.name, r]));

const directives = surface
  .filter((d) => d.inMovementDirectives)
  .map((d) => {
    const ref = referenceByName.get(d.className);
    return {
      className: d.className,
      selector: d.selector,
      exportAs: d.exportAs,
      description: ref?.description ?? null,
      inputs: ref
        ? ref.inputs
        : d.inputs.map((name) => ({
            name: name.replace(/\*$/, ''),
            type: null,
            required: name.endsWith('*'),
            defaultValue: null,
          })),
      outputs: d.outputs,
      signals: d.signals,
      oneShot: oneShotFlag(d.className),
    };
  })
  .sort((a, b) => a.className.localeCompare(b.className));

const snapshot = {
  generatedAt: new Date().toISOString(),
  directives,
  presets,
};

writeFileSync(OUT, JSON.stringify(snapshot, null, 2) + '\n');
console.log(`Wrote ${directives.length} directives and ${presets.length} presets to ${OUT}`);
