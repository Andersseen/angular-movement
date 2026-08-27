import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { loadSnapshot } from './snapshot.js';
import { getDirective, getExample, listDirectives, listPresets } from './tools.js';

function text(payload: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }] };
}

export function createServer(): McpServer {
  const snapshot = loadSnapshot();
  const server = new McpServer({ name: 'angular-movement', version: '0.1.0' });

  server.registerTool(
    'list_directives',
    {
      title: 'List movement directives',
      description:
        'Lists every angular-movement directive (selector, inputs, outputs, signals) currently wired into MOVEMENT_DIRECTIVES. Call this before writing any [move*] binding instead of guessing an API.',
      inputSchema: {
        filter: z
          .string()
          .optional()
          .describe('Case-insensitive substring match on class name or selector'),
      },
    },
    ({ filter }) => text(listDirectives(snapshot, filter)),
  );

  server.registerTool(
    'get_directive',
    {
      title: 'Get one movement directive',
      description:
        'Full detail for a single directive by class name (e.g. "MoveHoverDirective") or selector (e.g. "moveWhileHover"). Use this to confirm a selector/input name before writing it — do not guess.',
      inputSchema: {
        nameOrSelector: z.string(),
      },
    },
    ({ nameOrSelector }) => {
      const directive = getDirective(snapshot, nameOrSelector);
      return directive
        ? text(directive)
        : {
            content: [{ type: 'text' as const, text: `No directive matches "${nameOrSelector}".` }],
            isError: true,
          };
    },
  );

  server.registerTool(
    'list_presets',
    {
      title: 'List movement presets',
      description:
        'Lists every valid MovePreset name usable as a string value for a preset-typed input.',
      inputSchema: {},
    },
    () => text(listPresets(snapshot)),
  );

  server.registerTool(
    'get_example',
    {
      title: 'Get a minimal usage skeleton',
      description:
        'Generates a minimal template-binding skeleton for a directive, built from its own selector and inputs (not a curated demo — verifies attribute names and value shape).',
      inputSchema: {
        nameOrSelector: z.string(),
      },
    },
    ({ nameOrSelector }) => {
      const example = getExample(snapshot, nameOrSelector);
      return example
        ? text(example)
        : {
            content: [{ type: 'text' as const, text: `No directive matches "${nameOrSelector}".` }],
            isError: true,
          };
    },
  );

  return server;
}

export async function startServer(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
