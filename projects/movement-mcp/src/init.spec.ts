import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runInit } from './init.js';

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'movement-mcp-init-'));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('runInit', () => {
  it('creates .mcp.json with the movement entry and copies the skill', () => {
    const result = runInit(dir);

    expect(result.mcpAdded).toBe(true);
    const written = JSON.parse(readFileSync(result.mcpConfigPath, 'utf8'));
    expect(written.mcpServers.movement).toEqual({
      command: 'npx',
      args: ['-y', 'angular-movement-mcp'],
    });

    const skillFile = readFileSync(join(result.skillCopiedTo, 'SKILL.md'), 'utf8');
    expect(skillFile).toContain('name: movement-usage');
  });

  it('merges into an existing .mcp.json without dropping other servers', () => {
    writeFileSync(
      join(dir, '.mcp.json'),
      JSON.stringify({ mcpServers: { playwright: { command: 'npx', args: ['@playwright/mcp'] } } }),
    );

    const result = runInit(dir);

    const written = JSON.parse(readFileSync(result.mcpConfigPath, 'utf8'));
    expect(written.mcpServers.playwright).toEqual({ command: 'npx', args: ['@playwright/mcp'] });
    expect(written.mcpServers.movement).toBeDefined();
  });

  it('does not overwrite an already-present movement entry on a second run', () => {
    runInit(dir);
    writeFileSync(
      join(dir, '.mcp.json'),
      JSON.stringify({ mcpServers: { movement: { command: 'node', args: ['./custom.js'] } } }),
    );

    const result = runInit(dir);

    expect(result.mcpAdded).toBe(false);
    const written = JSON.parse(readFileSync(result.mcpConfigPath, 'utf8'));
    expect(written.mcpServers.movement).toEqual({ command: 'node', args: ['./custom.js'] });
  });
});
