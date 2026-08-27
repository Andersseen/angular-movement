import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mergeMovementServer, type McpConfig } from './mcp-config.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const SKILL_SRC = join(HERE, '..', 'skill', 'movement-usage');

export interface InitResult {
  mcpConfigPath: string;
  mcpAdded: boolean;
  skillCopiedTo: string;
}

/** Wires the `movement` MCP server into a consumer repo's .mcp.json and copies the installable skill. */
export function runInit(targetDir: string): InitResult {
  const mcpConfigPath = join(targetDir, '.mcp.json');
  const existing: McpConfig = existsSync(mcpConfigPath)
    ? JSON.parse(readFileSync(mcpConfigPath, 'utf8'))
    : {};
  const { config, added } = mergeMovementServer(existing);
  writeFileSync(mcpConfigPath, JSON.stringify(config, null, 2) + '\n');

  const skillCopiedTo = join(targetDir, '.claude', 'skills', 'movement-usage');
  mkdirSync(dirname(skillCopiedTo), { recursive: true });
  cpSync(SKILL_SRC, skillCopiedTo, { recursive: true });

  return { mcpConfigPath, mcpAdded: added, skillCopiedTo };
}
