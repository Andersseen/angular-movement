import { describe, expect, it } from 'vitest';
import { mergeMovementServer, MOVEMENT_SERVER_ENTRY } from './mcp-config.js';

describe('mergeMovementServer', () => {
  it('adds the movement entry to an empty config', () => {
    const { config, added } = mergeMovementServer({});
    expect(added).toBe(true);
    expect(config).toEqual({ mcpServers: { movement: MOVEMENT_SERVER_ENTRY } });
  });

  it('preserves existing servers and top-level fields', () => {
    const existing = {
      mcpServers: { playwright: { command: 'npx', args: ['@playwright/mcp'] } },
      extra: true,
    };
    const { config, added } = mergeMovementServer(existing);
    expect(added).toBe(true);
    expect(config).toEqual({
      extra: true,
      mcpServers: {
        playwright: { command: 'npx', args: ['@playwright/mcp'] },
        movement: MOVEMENT_SERVER_ENTRY,
      },
    });
  });

  it('does not clobber an existing, possibly customized, movement entry', () => {
    const existing = { mcpServers: { movement: { command: 'node', args: ['./local-build.js'] } } };
    const { config, added } = mergeMovementServer(existing);
    expect(added).toBe(false);
    expect(config).toEqual(existing);
  });
});
