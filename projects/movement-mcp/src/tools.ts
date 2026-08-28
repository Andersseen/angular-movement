import type { ApiSnapshot, DirectiveExample, DirectiveSnapshot } from './types.js';

export function listDirectives(snapshot: ApiSnapshot, filter?: string): DirectiveSnapshot[] {
  if (!filter) return snapshot.directives;
  const q = filter.toLowerCase();
  return snapshot.directives.filter(
    (d) => d.className.toLowerCase().includes(q) || d.selector.toLowerCase().includes(q),
  );
}

export function getDirective(
  snapshot: ApiSnapshot,
  nameOrSelector: string,
): DirectiveSnapshot | null {
  const q = nameOrSelector.toLowerCase().replace(/^\[|\]$/g, '');
  return (
    snapshot.directives.find(
      (d) => d.className.toLowerCase() === q || d.selector.toLowerCase().includes(`[${q}]`),
    ) ?? null
  );
}

export function listPresets(snapshot: ApiSnapshot): string[] {
  return snapshot.presets;
}

/** Formats a template-binding literal for an input — numbers/booleans unquoted, everything else a string. */
function formatValue(snapshot: ApiSnapshot, input: DirectiveSnapshot['inputs'][number]): string {
  if (input.type === 'number') return input.defaultValue ?? '300';
  if (input.type === 'boolean') return input.defaultValue ?? 'true';
  if (input.defaultValue && /^['"].*['"]$/.test(input.defaultValue)) return input.defaultValue;
  const value = input.type?.includes('MovePreset')
    ? (snapshot.presets[0] ?? 'fade-up')
    : (input.defaultValue ?? '');
  return `'${value}'`;
}

/**
 * Generates a minimal template-binding skeleton from the directive's own selector + inputs —
 * not a curated demo snippet, so it can never drift from the snapshot data.
 */
export function getExample(snapshot: ApiSnapshot, nameOrSelector: string): DirectiveExample | null {
  const directive = getDirective(snapshot, nameOrSelector);
  if (!directive) return null;

  const mainAttr = directive.selector
    .split(',')[0]
    .trim()
    .replace(/^\[|\]$/g, '');
  const mainInput = directive.inputs.find((i) => i.name === mainAttr);
  const binding = mainInput ? `[${mainAttr}]="${formatValue(snapshot, mainInput)}"` : mainAttr;

  return {
    className: directive.className,
    selector: directive.selector,
    template: `<div ${binding}>...</div>`,
  };
}
