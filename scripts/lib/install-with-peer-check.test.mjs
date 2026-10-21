import assert from 'node:assert/strict';
import { test } from 'node:test';
import { satisfies } from './install-with-peer-check.mjs';

const PEER = '^21.2.0 || ^22.0.0';

test('accepts every version the library claims to support', () => {
  for (const v of ['21.2.0', '21.2.25', '21.9.0', '22.0.0', '22.2.3']) assert.ok(satisfies(v, PEER), v);
});

test('rejects versions outside the peer range', () => {
  for (const v of ['21.1.9', '20.3.0', '23.0.0', '19.0.0']) assert.ok(!satisfies(v, PEER), v);
});

test('handles >= and ~ ranges', () => {
  assert.ok(satisfies('5.9.3', '>=5.9.0'));
  assert.ok(!satisfies('5.8.9', '>=5.9.0'));
  assert.ok(satisfies('21.2.9', '~21.2.0'));
  assert.ok(!satisfies('21.3.0', '~21.2.0'));
});
