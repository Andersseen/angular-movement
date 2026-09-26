import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { loadSnapshot } from './snapshot.js';
import { getDirective, getExample, getGuidelines, listDirectives, listPresets } from './tools.js';

function text(payload: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }] };
}

export function createServer(): McpServer {
  const snapshot = loadSnapshot();
  const server = new McpServer({ name: 'angular-movement', version: '0.2.0' });

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
        'Lists every valid MovePreset name usable as a string value for a preset-typed input. lift (hover) and press (tap) are the interaction presets; the rest are entrance/exit presets.',
      inputSchema: {},
    },
    () => text(listPresets(snapshot)),
  );

  server.registerTool(
    'get_example',
    {
      title: 'Get a minimal usage skeleton',
      description:
        'Generates a minimal usage skeleton for a directive: the narrow import line, the imports array entry, a template binding built from its own selector and inputs, and directive-specific notes. Use the returned import — never MOVEMENT_DIRECTIVES for a component that uses a few directives.',
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

  server.registerTool(
    'get_guidelines',
    {
      title: 'Get angular-movement usage guidelines',
      description:
        'Conventions that selectors and input names do not reveal: timing units (numbers are milliseconds), lift/press presets, touch vs hover, automatic reduced motion, MoveAnimator for imperative animation, cancellation, View Transitions, narrow imports, and when CSS is better. Call this once before writing or reviewing animation code.',
      inputSchema: {
        topic: z
          .string()
          .optional()
          .describe('Optional case-insensitive filter, e.g. "timing", "touch", "imports"'),
      },
    },
    ({ topic }) => text(getGuidelines(topic)),
  );

  return server;
}

export async function startServer(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
