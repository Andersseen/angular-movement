#!/usr/bin/env node
/**
 * Release gate for the runtime contract inventory (spec 020).
 *
 * `docs/v2/evidence/1.5/contracts.json` records, per public export and per behavioural dimension,
 * a status and the executable tests that back it. This script keeps that file honest:
 *
 * - every export in the API snapshot is covered (a new export without an inventory entry fails);
 * - stability recorded in the inventory equals the `@stability` tag in the snapshot;
 * - a PASS must cite at least one test, every cited file must exist and, when a title is given, the
 *   file must contain it — so a renamed or deleted test cannot keep claiming a pass;
 * - any FAIL fails the gate (a known unresolved regression cannot ship);
 * - NOT_TESTED / BLOCKED / KNOWN_LIMITATION are allowed but counted and printed, and a
 *   KNOWN_LIMITATION must carry a written justification. A missing result is never a pass.
 *
 *   node scripts/check-contract-inventory.mjs [--summary]
 */
import { existsSync, readFileSync } from 'node:fs';

const SNAPSHOT = 'projects/movement/api-report.txt';
const INVENTORY = 'docs/v2/evidence/1.5/contracts.json';
const STATUSES = new Set(['PASS', 'FAIL', 'BLOCKED', 'NOT_TESTED', 'KNOWN_LIMITATION']);
const DIMENSIONS = [
  'initial',
  'reactive',
  'repeated',
  'interruption',
  'cancellation',
  'completion',
  'cleanup',
  'reducedMotion',
  'ssr',
];

/** Names of every export in the rolled-up declaration file, with the `@stability` of its JSDoc. */
export function readExports(report) {
  const lines = report.split('\n');
  const found = new Map();

  lines.forEach((line, index) => {
    if (line.startsWith('export type {')) {
      for (const name of line.replace(/^export type \{|\};?$/g, '').split(',')) {
        if (name.trim()) found.set(name.trim(), { kind: 'type', stability: null });
      }
      return;
    }
    const m =
      /^export (?:declare )?(?:abstract )?(class|const|function|interface|type|enum) ([A-Za-z0-9_]+)/.exec(
        line,
      );
    if (!m) return;

    let stability = null;
    for (let i = index - 1; i >= 0 && !lines[i].startsWith('export '); i -= 1) {
      const tag = /@stability\s+(\w+)/.exec(lines[i]);
      if (tag) {
        stability = tag[1];
        break;
      }
      if (lines[i].trim().startsWith('/**')) break;
    }
    const kind = m[1];
    const previous = found.get(m[2]);
    found.set(m[2], {
      kind: kind === 'interface' || kind === 'type' || kind === 'enum' ? 'type' : 'runtime',
      stability: previous?.stability ?? stability,
    });
  });
  return found;
}

/** Collects problems for one claim; returns the number of tests it cites. */
function checkClaim(label, claim, problems) {
  if (!STATUSES.has(claim.status)) {
    problems.push(`${label}: unknown status "${claim.status}"`);
    return;
  }
  if (claim.status === 'KNOWN_LIMITATION' && !claim.note) {
    problems.push(`${label}: KNOWN_LIMITATION needs a written justification (note)`);
  }
  const tests = claim.tests ?? [];
  if (claim.status === 'PASS' && tests.length === 0) {
    problems.push(`${label}: PASS without a cited test`);
  }
  for (const test of tests) {
    if (!existsSync(test.file)) {
      problems.push(`${label}: cited file ${test.file} does not exist`);
      continue;
    }
    if (test.title && !readFileSync(test.file, 'utf8').includes(test.title)) {
      problems.push(`${label}: "${test.title}" not found in ${test.file}`);
    }
  }
}

export function checkInventory(report, inventory) {
  const problems = [];
  const counts = { PASS: 0, FAIL: 0, BLOCKED: 0, NOT_TESTED: 0, KNOWN_LIMITATION: 0 };
  const exports_ = readExports(report);
  const runtime = inventory.runtime ?? {};

  for (const [name, info] of exports_) {
    if (info.kind === 'runtime' && !runtime[name]) {
      problems.push(`${name}: runtime export has no inventory entry`);
    }
    if (info.kind === 'type' && !(inventory.types?.names ?? []).includes(name)) {
      problems.push(`${name}: type export is not listed under "types"`);
    }
  }
  for (const name of Object.keys(runtime)) {
    if (exports_.get(name)?.kind !== 'runtime') {
      problems.push(`${name}: inventory entry has no matching runtime export`);
    }
  }

  for (const [name, entry] of Object.entries(runtime)) {
    const declared = exports_.get(name)?.stability;
    if (declared && entry.stability !== declared) {
      problems.push(`${name}: stability ${entry.stability} != @stability ${declared} in snapshot`);
    }
    for (const dimension of DIMENSIONS) {
      const claim = entry.dimensions?.[dimension] ?? { status: 'NOT_TESTED' };
      checkClaim(`${name}.${dimension}`, claim, problems);
      counts[claim.status] = (counts[claim.status] ?? 0) + 1;
    }
  }

  if (inventory.types) checkClaim('types', inventory.types, problems);
  for (const [id, claim] of Object.entries(inventory.crossCutting ?? {})) {
    checkClaim(`crossCutting.${id}`, claim, problems);
    counts[claim.status] = (counts[claim.status] ?? 0) + 1;
  }

  for (const [label, n] of Object.entries(counts)) {
    if (label === 'FAIL' && n > 0)
      problems.push(`${n} contract(s) are FAIL — unresolved regression`);
  }
  return { problems, counts, runtimeCount: Object.keys(runtime).length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { problems, counts, runtimeCount } = checkInventory(
    readFileSync(SNAPSHOT, 'utf8'),
    JSON.parse(readFileSync(INVENTORY, 'utf8')),
  );
  console.log(`runtime exports: ${runtimeCount}  |  ${JSON.stringify(counts)}`);
  if (problems.length > 0) {
    console.error(`\n${problems.length} problem(s):\n- ${problems.join('\n- ')}`);
    process.exit(1);
  }
  console.log('contract inventory is consistent with the API snapshot and the cited tests.');
}
