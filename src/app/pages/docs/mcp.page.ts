import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlock } from '../../shared/components/code-block/code-block';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { DocsFooterNav } from '../../shared/components/docs-footer-nav/docs-footer-nav';

interface McpTool {
  name: string;
  returns: string;
}

@Component({
  selector: 'app-docs-mcp',
  imports: [CodeBlock, PageHeader, DocsFooterNav],
  template: `
    <article class="max-w-3xl">
      <app-page-header
        title="AI Agent Setup"
        description="Give Claude Code (or any MCP-compatible agent) ground-truth access to every directive, input, and preset — no more guessed selectors."
      />

      <div
        class="prose prose-invert prose-p:text-text-muted prose-headings:text-text prose-headings:font-display prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-code:text-accent-light prose-code:bg-surface-raised prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none max-w-none"
      >
        <h2>Why</h2>
        <p>
          An agent working in a repo that has <code>angular-movement</code> installed has almost
          nothing to ground its guesses in — it will happily invent <code>[moveFadeIn]</code> or an
          <code>easing</code> input that doesn't exist. A wrong selector or input name fails
          silently or throws at runtime instead of producing a type error, so it's worth eliminating
          the guesswork entirely.
          <a
            href="https://www.npmjs.com/package/angular-movement-mcp"
            target="_blank"
            rel="noopener"
            ><code>angular-movement-mcp</code></a
          >
          is a real MCP server that exposes the library's actual directive/input/preset metadata as
          tools, plus a Claude Code skill that teaches an agent to reach for them.
        </p>

        <h2>1. Install</h2>
        <p>
          Run this once from the root of the app that consumes <code>angular-movement</code>
          (not from this library's own repo):
        </p>

        <div class="not-prose my-6 h-36">
          <app-code-block title="Terminal" [code]="installCode"></app-code-block>
        </div>

        <p>This single command:</p>

        <ul>
          <li>
            Adds a <code>movement</code> entry to <code>.mcp.json</code> in the current repo —
            creating the file if it doesn't exist, and merging into it (never overwriting an
            existing <code>movement</code> entry) if it does.
          </li>
          <li>
            Copies the <code>movement-usage</code> skill to
            <code>.claude/skills/movement-usage/</code>.
          </li>
        </ul>

        <div class="not-prose my-6 h-80">
          <app-code-block title=".mcp.json" [code]="mcpConfigCode"></app-code-block>
        </div>

        <p>
          Restart Claude Code (or reload the window) after running <code>init</code> so it picks up
          the new server and skill.
        </p>

        <h2>2. What the server exposes</h2>
        <p>
          All four tools are backed by a committed JSON snapshot regenerated from the library's
          actual source — not hand-written documentation that can silently drift.
        </p>

        <div class="not-prose my-6 overflow-hidden rounded-lg border">
          <table class="w-full text-left text-sm">
            <thead class="bg-surface-raised text-text font-display">
              <tr>
                <th class="px-4 py-3 font-semibold">Tool</th>
                <th class="px-4 py-3 font-semibold">Returns</th>
              </tr>
            </thead>
            <tbody class="divide-border text-text-muted divide-y">
              @for (tool of tools; track tool.name) {
                <tr>
                  <td class="text-accent-light px-4 py-3 font-mono whitespace-nowrap">
                    {{ tool.name }}
                  </td>
                  <td class="px-4 py-3">{{ tool.returns }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <h2>3. What the skill does</h2>
        <p>
          <code>movement-usage</code> tells the agent to call <code>list_directives</code> /
          <code>get_directive</code> / <code>get_example</code> before writing any
          <code>[move*]</code> binding, gives it the <code>move</code>-prefixed selector convention,
          and flags directive-specific gotchas (for example, that <code>[moveAnimation]</code> takes
          a single-value state object, not arrays of keyframes). It activates automatically once
          installed — nothing to reference by name in your prompts.
        </p>

        <p class="bg-accent/5 border-accent/20 mt-8 rounded-xl border p-4">
          <strong>Note:</strong> the MCP server speaks plain stdio MCP, so any MCP-compatible client
          can run it directly (<code>npx -y angular-movement-mcp</code>) — the
          <code>init</code> command's <code>.mcp.json</code> output and bundled skill are
          specifically the Claude Code integration.
        </p>
      </div>

      <app-docs-footer-nav
        prevHref="/docs/presets"
        prevLabel="Presets"
        nextHref="/demos"
        nextLabel="Demos"
      />
    </article>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AiAgentSetupPage {
  protected readonly installCode = `<span class="code-comment"># from your app's repo root</span>
<span class="code-keyword">npx</span> angular-movement-mcp init`;

  protected readonly mcpConfigCode = `<span class="code-comment">// .mcp.json</span>
{
  <span class="code-string">"mcpServers"</span>: {
    <span class="code-string">"movement"</span>: {
      <span class="code-string">"command"</span>: <span class="code-string">"npx"</span>,
      <span class="code-string">"args"</span>: [<span class="code-string">"-y"</span>, <span class="code-string">"angular-movement-mcp"</span>]
    }
  }
}`;

  protected readonly tools: McpTool[] = [
    {
      name: 'list_directives',
      returns:
        'Every directive wired into MOVEMENT_DIRECTIVES (selector, inputs, outputs, signals), optionally filtered by a substring.',
    },
    {
      name: 'get_directive',
      returns: 'Full detail for one directive, by class name or selector.',
    },
    {
      name: 'list_presets',
      returns: 'Every valid MovePreset string.',
    },
    {
      name: 'get_example',
      returns:
        'A minimal template-binding skeleton for a directive, generated from its own selector + inputs.',
    },
  ];
}
