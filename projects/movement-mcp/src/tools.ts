import type { ApiSnapshot, DirectiveExample, DirectiveSnapshot, Guideline } from './types.js';
import { GUIDELINES } from './guidelines.js';

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

/** Interaction directives get the interaction preset real apps use, not an entrance preset. */
const PREFERRED_PRESET: Record<string, string> = {
  MoveHoverDirective: 'lift',
  MoveTapDirective: 'press',
};

const DIRECTIVE_NOTES: Record<string, string[]> = {
  MoveHoverDirective: [
    'Mouse and pen only — touch never triggers hover. Add moveWhileTap="press" for touch feedback.',
  ],
  MoveTapDirective: ['Use two keyframe values; a three-value tap replays on release.'],
  MoveTriggerDirective: [
    'Experimental. For animation driven from TypeScript, inject MoveAnimator instead.',
  ],
};

const TIMING_NOTE =
  'Timing inputs take a MoveTime: numbers are milliseconds; static attributes can say "300ms" or "0.3s".';

function isTimeType(type: string | null): boolean {
  return !!type && type.includes('MoveTime');
}

/**
 * Builds the main binding. Presets and times are written as static attributes
 * (`moveWhileHover="lift"`, `moveStagger="100ms"`) — the shape the docs teach; everything else is
 * a property binding with a literal.
 */
function formatBinding(
  snapshot: ApiSnapshot,
  directive: DirectiveSnapshot,
  input: DirectiveSnapshot['inputs'][number],
): string {
  if (input.type?.includes('MovePreset')) {
    const preferred = PREFERRED_PRESET[directive.className];
    const preset =
      preferred && snapshot.presets.includes(preferred)
        ? preferred
        : snapshot.presets.includes('fade-up')
          ? 'fade-up'
          : (snapshot.presets[0] ?? 'fade-up');
    return `${input.name}="${preset}"`;
  }
  if (isTimeType(input.type)) {
    const ms = Number(input.defaultValue?.replace(/['"]/g, ''));
    return `${input.name}="${Number.isFinite(ms) ? ms : 100}ms"`;
  }
  if (input.type === 'number') return `[${input.name}]="${input.defaultValue ?? '0'}"`;
  if (input.type === 'boolean') return `[${input.name}]="${input.defaultValue ?? 'true'}"`;
  if (input.defaultValue && /^['"].*['"]$/.test(input.defaultValue)) {
    return `[${input.name}]="${input.defaultValue}"`;
  }
  return `[${input.name}]="'${input.defaultValue ?? ''}'"`;
}

/**
 * Generates a minimal template-binding skeleton from the directive's own selector + inputs —
 * not a curated demo snippet, so it can never drift from the snapshot data. Always paired with the
 * narrow import, so agents stop reproducing `imports: [MOVEMENT_DIRECTIVES]`.
 */
export function getExample(snapshot: ApiSnapshot, nameOrSelector: string): DirectiveExample | null {
  const directive = getDirective(snapshot, nameOrSelector);
  if (!directive) return null;

  const mainAttr = directive.selector
    .split(',')[0]
    .trim()
    .replace(/^\[|\]$/g, '')
    .replace(/^\*/, '');
  const mainInput = directive.inputs.find((i) => i.name === mainAttr);
  const binding = mainInput ? formatBinding(snapshot, directive, mainInput) : mainAttr;

  const notes = [...(DIRECTIVE_NOTES[directive.className] ?? [])];
  if (directive.inputs.some((input) => isTimeType(input.type))) notes.push(TIMING_NOTE);

  return {
    className: directive.className,
    selector: directive.selector,
    importStatement: `import { ${directive.className} } from 'angular-movement';`,
    imports: [directive.className],
    template: `<div ${binding}>...</div>`,
    notes,
  };
}

export function getGuidelines(topic?: string): Guideline[] {
  if (!topic) return GUIDELINES;
  const q = topic.toLowerCase();
  return GUIDELINES.filter(
    (g) => g.topic.toLowerCase().includes(q) || g.rule.toLowerCase().includes(q),
  );
}
