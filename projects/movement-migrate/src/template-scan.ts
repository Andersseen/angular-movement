import { parseTemplate } from '@angular/compiler';

export type ConditionalOwner = 'if' | 'for' | 'switch' | 'ngIf' | 'ngFor' | 'ngSwitch' | 'defer';

export interface TemplateUsage {
  trigger: string;
  /** `@name` (static) vs `[@name]="expr"` (state-driven). */
  dynamic: boolean;
  /** Animation callbacks bound on the same element: `(@name.start)` / `(@name.done)`. */
  callbacks: string[];
  /** Zero-based line within the template source. */
  line: number;
  column: number;
  element: string;
  /** Nearest control-flow construct that decides whether the element exists. */
  owner: ConditionalOwner | null;
}

interface AnyNode {
  constructor: { name: string };
  name?: string;
  tagName?: string | null;
  inputs?: {
    name: string;
    type: number;
    value?: { ast?: { constructor: { name: string }; value?: unknown } };
  }[];
  outputs?: { name: string; type: number; phase: string | null }[];
  templateAttrs?: { name: string }[];
  children?: AnyNode[];
  branches?: AnyNode[];
  cases?: AnyNode[];
  empty?: AnyNode | null;
  placeholder?: AnyNode | null;
  loading?: AnyNode | null;
  error?: AnyNode | null;
  sourceSpan?: { start: { line: number; col: number } };
}

/** `BindingType.Animation` / `ParsedEventType.Animation` in @angular/compiler. */
const BINDING_ANIMATION = 4;
const EVENT_ANIMATION = 1;

const BLOCK_OWNERS: Record<string, ConditionalOwner> = {
  IfBlockBranch: 'if',
  ForLoopBlock: 'for',
  ForLoopBlockEmpty: 'for',
  SwitchBlockCase: 'switch',
  DeferredBlock: 'defer',
};

const STRUCTURAL_OWNERS: Record<string, ConditionalOwner> = {
  ngIf: 'ngIf',
  ngForOf: 'ngFor',
  ngFor: 'ngFor',
  ngSwitchCase: 'ngSwitch',
  ngSwitchDefault: 'ngSwitch',
};

export interface TemplateScan {
  usages: TemplateUsage[];
  parseErrors: string[];
}

export function scanTemplate(source: string, url: string): TemplateScan {
  const parsed = parseTemplate(source, url, { preserveWhitespaces: true });
  const usages: TemplateUsage[] = [];
  const seen = new Set<string>();

  const walk = (nodes: AnyNode[], owner: ConditionalOwner | null): void => {
    for (const node of nodes) {
      const kind = node.constructor.name;
      let childOwner = owner;

      if (kind === 'Template' && node.templateAttrs) {
        for (const attr of node.templateAttrs) {
          if (STRUCTURAL_OWNERS[attr.name]) childOwner = STRUCTURAL_OWNERS[attr.name];
        }
      }
      if (BLOCK_OWNERS[kind]) childOwner = BLOCK_OWNERS[kind];

      const animationInputs = (node.inputs ?? []).filter((i) => i.type === BINDING_ANIMATION);
      if ((kind === 'Element' || kind === 'Template') && animationInputs.length > 0) {
        for (const input of animationInputs) {
          const astName = input.value?.ast?.constructor.name ?? '';
          const staticValue =
            astName === 'EmptyExpr' ||
            (astName === 'LiteralPrimitive' &&
              (input.value?.ast?.value === '' || input.value?.ast?.value == null));
          const callbacks = (node.outputs ?? [])
            .filter((o) => o.type === EVENT_ANIMATION && o.name === input.name)
            .map((o) => `${o.name}.${o.phase ?? 'done'}`);
          // `*ngIf` hoists bindings onto both the wrapper template and the inner element.
          const key = `${input.name}:${node.sourceSpan?.start.line}:${node.sourceSpan?.start.col}`;
          if (seen.has(key)) continue;
          seen.add(key);
          usages.push({
            trigger: input.name,
            dynamic: !staticValue,
            callbacks,
            line: node.sourceSpan?.start.line ?? 0,
            column: node.sourceSpan?.start.col ?? 0,
            element: node.name ?? node.tagName ?? 'ng-template',
            // The owner of an element that itself carries *ngIf is that structural directive.
            owner: childOwner,
          });
        }
      }

      for (const key of ['children', 'branches', 'cases'] as const) {
        const list = node[key];
        if (list) walk(list, childOwner);
      }
      for (const key of ['empty', 'placeholder', 'loading', 'error'] as const) {
        const child = node[key];
        if (child) walk([child], childOwner);
      }
    }
  };

  walk(parsed.nodes as unknown as AnyNode[], null);
  return { usages, parseErrors: (parsed.errors ?? []).map((e) => e.msg) };
}
