import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkInventory, latestInventory, readExports } from './check-contract-inventory.mjs';

const REPORT = [
  '/**',
  ' * @stability stable',
  ' */',
  'export declare class MoveThingDirective {',
  '}',
  'export interface MoveThingOptions {',
  '}',
].join('\n');

const base = () => ({
  runtime: {
    MoveThingDirective: {
      stability: 'stable',
      dimensions: {
        initial: { status: 'PASS', tests: [{ file: 'package.json', title: '"name"' }] },
      },
    },
  },
  types: { names: ['MoveThingOptions'], status: 'PASS', tests: [{ file: 'package.json' }] },
});

test('reads runtime and type exports with their stability', () => {
  const exports_ = readExports(REPORT);
  assert.deepEqual(exports_.get('MoveThingDirective'), { kind: 'runtime', stability: 'stable' });
  assert.equal(exports_.get('MoveThingOptions').kind, 'type');
});

test('a consistent inventory has no problems and counts unlisted dimensions as NOT_TESTED', () => {
  const { problems, counts } = checkInventory(REPORT, base());
  assert.deepEqual(problems, []);
  assert.equal(counts.PASS, 1);
  assert.equal(counts.NOT_TESTED, 8);
});

test('an export without an inventory entry fails', () => {
  const inventory = base();
  delete inventory.runtime.MoveThingDirective;
  assert.match(checkInventory(REPORT, inventory).problems.join('\n'), /no inventory entry/);
});

test('a PASS must cite a test that exists and still contains its title', () => {
  const noTest = base();
  noTest.runtime.MoveThingDirective.dimensions.initial.tests = [];
  assert.match(checkInventory(REPORT, noTest).problems.join('\n'), /PASS without a cited test/);

  const gone = base();
  gone.runtime.MoveThingDirective.dimensions.initial.tests = [
    { file: 'package.json', title: 'zzz' },
  ];
  assert.match(checkInventory(REPORT, gone).problems.join('\n'), /not found in package.json/);

  const missing = base();
  missing.runtime.MoveThingDirective.dimensions.initial.tests = [{ file: 'nope.spec.ts' }];
  assert.match(checkInventory(REPORT, missing).problems.join('\n'), /does not exist/);
});

test('a FAIL fails the gate, and a KNOWN_LIMITATION needs a justification', () => {
  const failing = base();
  failing.runtime.MoveThingDirective.dimensions.repeated = { status: 'FAIL' };
  assert.match(checkInventory(REPORT, failing).problems.join('\n'), /unresolved regression/);

  const unexplained = base();
  unexplained.runtime.MoveThingDirective.dimensions.repeated = { status: 'KNOWN_LIMITATION' };
  assert.match(
    checkInventory(REPORT, unexplained).problems.join('\n'),
    /needs a written justification/,
  );
});

test('inventory stability must match the snapshot tag', () => {
  const inventory = base();
  inventory.runtime.MoveThingDirective.stability = 'experimental';
  assert.match(
    checkInventory(REPORT, inventory).problems.join('\n'),
    /stability experimental != @stability stable/,
  );
});

test('latestInventory picks the highest numeric version, not the lexicographic one', () => {
  const root = mkdtempSync(join(tmpdir(), 'evidence-'));
  try {
    for (const v of ['1.5', '1.6', '1.10', '2.0', 'notes']) {
      mkdirSync(join(root, v));
      writeFileSync(join(root, v, 'contracts.json'), '{}');
    }
    mkdirSync(join(root, '3.0')); // no contracts.json: not an inventory yet
    assert.equal(latestInventory(root), `${root}/2.0/contracts.json`);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
