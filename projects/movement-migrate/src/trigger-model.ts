import ts from 'typescript';

/** Functions from `@angular/animations` that make a trigger more than a simple style tween. */
const COMPLEX_FUNCTIONS = new Set([
  'query',
  'stagger',
  'group',
  'sequence',
  'animateChild',
  'keyframes',
  'useAnimation',
  'animation',
]);

export interface StyleLiteral {
  /** Property → raw literal text. `null` means the object had a non-literal member. */
  props: Record<string, string> | null;
}

export interface AnimateStep {
  kind: 'animate';
  timing: string | null; // null: not a plain string literal
  style: StyleLiteral | null; // null: animate() had no style() argument
}

export interface StyleStep {
  kind: 'style';
  style: StyleLiteral;
}

export interface OtherStep {
  kind: 'other';
  callee: string;
}

export type Step = AnimateStep | StyleStep | OtherStep;

export interface TransitionModel {
  /** `null` when the expression is not a string literal (function / template). */
  expression: string | null;
  steps: Step[];
}

export interface TriggerModel {
  name: string;
  node: ts.CallExpression;
  sourceFile: ts.SourceFile;
  transitions: TransitionModel[];
  states: string[];
  /** Complex functions used anywhere inside the trigger. */
  complexFeatures: Set<string>;
  /** Properties (any) animated or styled anywhere inside the trigger. */
  properties: Set<string>;
  hasParams: boolean;
  /** True if any argument that should be a literal was not one. */
  hasDynamicParts: boolean;
}

function calleeName(call: ts.CallExpression): string | undefined {
  const expr = call.expression;
  if (ts.isIdentifier(expr)) return expr.text;
  if (ts.isPropertyAccessExpression(expr)) return expr.name.text;
  return undefined;
}

function stringLiteral(node: ts.Node | undefined): string | null {
  if (node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))) {
    return node.text;
  }
  return null;
}

function styleFromCall(node: ts.Node | undefined): StyleLiteral | null {
  if (!node || !ts.isCallExpression(node) || calleeName(node) !== 'style') return null;
  const arg = node.arguments[0];
  if (!arg || !ts.isObjectLiteralExpression(arg)) return { props: null };
  const props: Record<string, string> = {};
  for (const member of arg.properties) {
    if (!ts.isPropertyAssignment(member)) return { props: null };
    const key =
      ts.isIdentifier(member.name) || ts.isStringLiteral(member.name) ? member.name.text : null;
    const value = member.initializer;
    const literal = stringLiteral(value) ?? (ts.isNumericLiteral(value) ? value.text : null);
    if (key === null || literal === null) return { props: null };
    props[key] = literal;
  }
  return { props };
}

function parseStep(node: ts.Expression): Step {
  if (ts.isCallExpression(node)) {
    const name = calleeName(node);
    if (name === 'style') return { kind: 'style', style: styleFromCall(node) ?? { props: null } };
    if (name === 'animate') {
      return {
        kind: 'animate',
        timing: stringLiteral(node.arguments[0]),
        style: node.arguments[1] ? styleFromCall(node.arguments[1]) : null,
      };
    }
    return { kind: 'other', callee: name ?? '<call>' };
  }
  return { kind: 'other', callee: '<expression>' };
}

function parseTransition(call: ts.CallExpression): TransitionModel {
  const stepsArg = call.arguments[1];
  const steps: Step[] = [];
  if (stepsArg && ts.isArrayLiteralExpression(stepsArg)) {
    for (const el of stepsArg.elements) steps.push(parseStep(el));
  } else if (stepsArg) {
    steps.push(parseStep(stepsArg));
  }
  return { expression: stringLiteral(call.arguments[0]), steps };
}

/** Returns the trigger name if `call` is a `trigger('name', [...])` call. */
export function isTriggerCall(call: ts.CallExpression): boolean {
  return calleeName(call) === 'trigger' && stringLiteral(call.arguments[0]) !== null;
}

export function parseTrigger(call: ts.CallExpression, sourceFile: ts.SourceFile): TriggerModel {
  const model: TriggerModel = {
    name: stringLiteral(call.arguments[0])!,
    node: call,
    sourceFile,
    transitions: [],
    states: [],
    complexFeatures: new Set(),
    properties: new Set(),
    hasParams: false,
    hasDynamicParts: false,
  };

  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node)) {
      const name = calleeName(node);
      if (name && COMPLEX_FUNCTIONS.has(name)) model.complexFeatures.add(name);
      if (name === 'transition') {
        model.transitions.push(parseTransition(node));
        if (stringLiteral(node.arguments[0]) === null) model.hasDynamicParts = true;
      }
      if (name === 'state') {
        const s = stringLiteral(node.arguments[0]);
        if (s) model.states.push(s);
      }
      if (name === 'style') {
        const lit = styleFromCall(node);
        if (!lit || lit.props === null) model.hasDynamicParts = true;
        else for (const k of Object.keys(lit.props)) model.properties.add(k);
      }
      if (name === 'animate' && stringLiteral(node.arguments[0]) === null) {
        model.hasDynamicParts = true;
      }
    }
    if (
      ts.isPropertyAssignment(node) &&
      (ts.isIdentifier(node.name) ? node.name.text : '') === 'params'
    ) {
      model.hasParams = true;
    }
    ts.forEachChild(node, visit);
  };
  for (const arg of call.arguments.slice(1)) visit(arg);

  return model;
}
