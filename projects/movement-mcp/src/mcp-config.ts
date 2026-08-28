export interface McpConfig {
  mcpServers?: Record<string, unknown>;
  [key: string]: unknown;
}

export const MOVEMENT_SERVER_ENTRY = { command: 'npx', args: ['-y', 'angular-movement-mcp'] };

/** Adds the "movement" MCP server entry, leaving an existing one (and every other server) untouched. */
export function mergeMovementServer(existing: McpConfig): { config: McpConfig; added: boolean } {
  const mcpServers = { ...(existing.mcpServers ?? {}) };
  if (mcpServers['movement']) {
    return { config: { ...existing, mcpServers }, added: false };
  }
  mcpServers['movement'] = MOVEMENT_SERVER_ENTRY;
  return { config: { ...existing, mcpServers }, added: true };
}
