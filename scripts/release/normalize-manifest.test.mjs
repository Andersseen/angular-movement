import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { it } from 'node:test';
import { check } from 'prettier';
import { normalizeManifest } from './normalize-manifest.mjs';

it('normalizes a future Release Please update without changing versions, and is idempotent', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'movement-release-format-'));
  try {
    const path = join(dir, '.release-please-manifest.json');
    const manifest = { 'projects/movement': '1.4.0' };
    const require = createRequire(import.meta.url);
    const {
      ReleasePleaseManifest,
    } = require('release-please/build/src/updaters/release-please-manifest');
    const { Version } = require('release-please/build/src/version');
    const updater = new ReleasePleaseManifest({
      versionsMap: new Map([['projects/movement', Version.parse('1.4.0')]]),
    });
    await writeFile(path, updater.updateContent('{\"projects/movement\":\"1.3.0\"}\n'));
    assert.equal(await normalizeManifest(path), true);
    const result = await readFile(path, 'utf8');
    assert.deepEqual(JSON.parse(result), manifest);
    assert.equal(await check(result, { parser: 'json' }), true);
    assert.equal(updater.updateContent(result), result);
    assert.equal(await normalizeManifest(path), false);
    assert.equal(await readFile(path, 'utf8'), result);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
