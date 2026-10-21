import type { Classification } from './types.js';
import type { StyleLiteral, TransitionModel, TriggerModel } from './trigger-model.js';
import type { TemplateUsage } from './template-scan.js';

const ENTER = new Set([':enter', 'void => *', 'void=>*', 'void => *']);
const LEAVE = new Set([':leave', '* => void', '*=>void']);
const MOVEMENT_SAFE = new Set(['opacity', 'transform']);
const LAYOUT_OR_PAINT =
  /^(height|width|min-|max-|margin|padding|top|left|right|bottom|color|background|border|font|line-height|flex|gap|inset|box-shadow|outline)/i;

export interface Verdict {
  classification: Classification;
  reasons: string[];
  suggestion?: string;
}

interface Tween {
  from: Record<string, number>;
  to: Record<string, number>;
  durationMs: number;
  delayMs: number;
  easing: string | undefined;
}

const normalize = (expression: string) => expression.replace(/\s+/g, ' ').trim();

function toMs(value: string, unit: string): number {
  return unit === 's' ? Math.round(parseFloat(value) * 1000) : parseFloat(value);
}

function parseTiming(timing: string): Pick<Tween, 'durationMs' | 'delayMs' | 'easing'> | string {
  if (timing.includes('{{')) return 'timing uses an interpolated parameter';
  const match = /^\s*(\d+(?:\.\d+)?)(ms|s)(?:\s+(\d+(?:\.\d+)?)(ms|s))?(?:\s+(.+?))?\s*$/.exec(
    timing,
  );
  if (!match) return `timing '${timing}' is not a plain duration [delay] [easing] string`;
  const easing = match[5];
  if (
    easing &&
    !/^(ease|ease-in|ease-out|ease-in-out|linear|cubic-bezier\([^)]*\))$/.test(easing)
  ) {
    return `easing '${easing}' has no direct equivalent`;
  }
  return {
    durationMs: toMs(match[1], match[2]),
    delayMs: match[3] ? toMs(match[3], match[4]) : 0,
    easing,
  };
}

/** Maps a literal `transform` string to Movement channel values, or returns a reason it cannot. */
function parseTransform(value: string): Record<string, number> | string {
  const out: Record<string, number> = {};
  const fn = /(translateX|translateY|translate|scaleX|scaleY|scale|rotate)\(([^)]*)\)/g;
  let rest = value.trim();
  let matched: RegExpExecArray | null;
  let consumed = '';
  while ((matched = fn.exec(value))) {
    consumed += matched[0];
    const args = matched[2].split(',').map((a) => a.trim());
    const num = (arg: string, unit: RegExp): number | null => {
      const m = unit.exec(arg);
      return m ? parseFloat(m[1]) : null;
    };
    const px = (a: string) => num(a, /^(-?\d+(?:\.\d+)?)(?:px)?$/);
    const unitless = (a: string) => num(a, /^(-?\d+(?:\.\d+)?)$/);
    const deg = (a: string) => num(a, /^(-?\d+(?:\.\d+)?)deg$/);
    let ok = true;
    const set = (key: string, v: number | null) => {
      if (v === null) ok = false;
      else out[key] = v;
    };
    switch (matched[1]) {
      case 'translateX':
        set('x', px(args[0]));
        break;
      case 'translateY':
        set('y', px(args[0]));
        break;
      case 'translate':
        set('x', px(args[0]));
        set('y', args[1] === undefined ? 0 : px(args[1]));
        break;
      case 'scale': {
        const x = unitless(args[0]);
        if (x === null || (args[1] !== undefined && unitless(args[1]) !== x)) ok = false;
        else out['scale'] = x;
        break;
      }
      case 'scaleX':
        set('scaleX', unitless(args[0]));
        break;
      case 'scaleY':
        set('scaleY', unitless(args[0]));
        break;
      case 'rotate':
        set('rotate', deg(args[0]));
        break;
    }
    if (!ok)
      return `transform '${matched[0]}' uses units or arguments with no direct Movement channel`;
    rest = rest.replace(matched[0], '');
  }
  if (rest.trim() !== '' || consumed === '')
    return `transform '${value}' is not a simple translate/scale/rotate list`;
  return out;
}

function styleToValues(style: StyleLiteral): Record<string, number> | string {
  if (style.props === null) return 'style() contains a non-literal value';
  const out: Record<string, number> = {};
  for (const [key, raw] of Object.entries(style.props)) {
    if (key === 'opacity') {
      const n = Number(raw);
      if (Number.isNaN(n)) return `opacity '${raw}' is not numeric`;
      out['opacity'] = n;
    } else if (key === 'transform') {
      const t = parseTransform(raw);
      if (typeof t === 'string') return t;
      Object.assign(out, t);
    } else {
      return `property '${key}' is not opacity/transform`;
    }
  }
  return out;
}

/** Strict `[style(from), animate(timing, style(to))]` shape → tween, or the reason it is not one. */
function toTween(transition: TransitionModel): Tween | string {
  const [first, second, ...extra] = transition.steps;
  if (extra.length > 0 || first?.kind !== 'style' || second?.kind !== 'animate') {
    return 'steps are not exactly style(from) followed by animate(timing, style(to))';
  }
  if (second.timing === null) return 'animate() timing is not a string literal';
  if (second.style === null) return 'animate() has no target style(); the end state is implicit';
  const timing = parseTiming(second.timing);
  if (typeof timing === 'string') return timing;
  const from = styleToValues(first.style);
  if (typeof from === 'string') return from;
  const to = styleToValues(second.style);
  if (typeof to === 'string') return to;
  const fromKeys = Object.keys(from).sort().join();
  const toKeys = Object.keys(to).sort().join();
  if (fromKeys !== toKeys) {
    return 'from and to define different properties, so the implicit end state differs from Movement';
  }
  return { from, to, ...timing };
}

function frames(tween: Tween): string {
  const parts = Object.keys(tween.from).map((k) => `${k}: [${tween.from[k]}, ${tween.to[k]}]`);
  return `{ ${parts.join(', ')} }`;
}

function enterSuggestion(tween: Tween): string {
  const attrs = [`[moveEnter]="${frames(tween)}"`, `moveDuration="${tween.durationMs}ms"`];
  if (tween.delayMs) attrs.push(`moveDelay="${tween.delayMs}ms"`);
  if (tween.easing) attrs.push(`moveEasing="${tween.easing}"`);
  return `<element ${attrs.join(' ')}>`;
}

function leaveSuggestion(tween: Tween): string {
  const attrs = [`[moveLeave]="${frames(tween)}"`, `moveDuration="${tween.durationMs}ms"`];
  if (tween.easing) attrs.push(`moveEasing="${tween.easing}"`);
  return `<ng-container *movePresence="condition"><element ${attrs.join(' ')}>…</element></ng-container>`;
}

const where = (u: TemplateUsage) => u.owner ?? 'none';

export function classifyTrigger(model: TriggerModel, usages: TemplateUsage[]): Verdict {
  // ---- Hard stops: constructs we deliberately do not convert -------------------------------
  if (model.complexFeatures.size > 0) {
    const reasons = [
      `uses ${[...model.complexFeatures].map((f) => `${f}()`).join(', ')}, which has no safe one-to-one Movement mapping`,
    ];
    if (
      model.complexFeatures.has('query') &&
      model.transitions.some(
        (t) => t.expression !== null && /\*\s*(=>|<=>)\s*\*/.test(t.expression),
      )
    ) {
      reasons.push(
        'looks like a route transition: consider the Router View Transitions API (withViewTransitions) first',
      );
    }
    return { classification: 'manual', reasons };
  }
  if (model.hasParams)
    return { classification: 'manual', reasons: ['uses params, so values are decided at runtime'] };
  if (model.hasDynamicParts) {
    return {
      classification: 'manual',
      reasons: ['contains a non-literal transition expression, timing or style value'],
    };
  }
  if (usages.length === 0) {
    return {
      classification: 'manual',
      reasons: [
        'no template binding found in this component; it may be used from a host binding, another file or AnimationBuilder',
      ],
    };
  }

  const properties = [...model.properties];
  const hasSafe = properties.some((p) => MOVEMENT_SAFE.has(p));
  const layoutish = properties.filter((p) => LAYOUT_OR_PAINT.test(p));

  if (!hasSafe && layoutish.length > 0) {
    return {
      classification: 'keep-native',
      reasons: [
        `only animates ${layoutish.join(', ')}; a CSS transition or animate.enter / animate.leave covers this without a library`,
      ],
    };
  }
  if (layoutish.length > 0) {
    return {
      classification: 'partial',
      reasons: [
        `mixes opacity/transform with ${layoutish.join(', ')}; Movement handles the first well, the rest is better in CSS`,
      ],
    };
  }

  const enters = model.transitions.filter(
    (t) => t.expression !== null && ENTER.has(normalize(t.expression)),
  );
  const leaves = model.transitions.filter(
    (t) => t.expression !== null && LEAVE.has(normalize(t.expression)),
  );
  const others = model.transitions.filter((t) => !enters.includes(t) && !leaves.includes(t));

  // ---- State-driven triggers ---------------------------------------------------------------
  if (others.length > 0 || model.states.length > 0) {
    const reasons = [
      `state-driven trigger (${model.states.length ? `states: ${model.states.join(', ')}` : 'state-to-state transitions'}); Movement models this with moveVariants or [moveAnimation], but each state must be mapped by hand`,
    ];
    if (usages.some((u) => u.callbacks.length))
      reasons.push('animation callbacks (start/done) have no equivalent on moveVariants');
    return {
      classification: 'partial',
      reasons,
      suggestion: '<element [moveVariants]="{ stateA: {…}, stateB: {…} }" [moveVariant]="state()">',
    };
  }

  // ---- Enter / leave only ------------------------------------------------------------------
  const enterTween =
    enters.length === 1
      ? toTween(enters[0])
      : enters.length > 1
        ? 'more than one enter transition'
        : null;
  const leaveTween =
    leaves.length === 1
      ? toTween(leaves[0])
      : leaves.length > 1
        ? 'more than one leave transition'
        : null;

  const reasons: string[] = [];
  for (const [label, tween] of [
    ['enter', enterTween],
    ['leave', leaveTween],
  ] as const) {
    if (typeof tween === 'string') reasons.push(`${label}: ${tween}`);
  }
  if (reasons.length > 0) return { classification: 'manual', reasons };
  if (!enterTween && !leaveTween)
    return { classification: 'manual', reasons: ['no recognisable enter or leave transition'] };

  const dynamicUsage = usages.find((u) => u.dynamic);
  if (dynamicUsage) {
    return {
      classification: 'partial',
      reasons: [
        'bound with [@name]="expression"; the expression value selects states, which an enter/leave pair does not model',
      ],
    };
  }
  const callbackUsage = usages.find((u) => u.callbacks.length);
  if (callbackUsage) {
    return {
      classification: 'partial',
      reasons: [
        `animation callback (${callbackUsage.callbacks.join(', ')}) has no equivalent; keep the callback logic and trigger it from your own code`,
      ],
      suggestion:
        enterTween && typeof enterTween !== 'string' ? enterSuggestion(enterTween) : undefined,
    };
  }

  if (leaveTween && typeof leaveTween !== 'string') {
    const owners = usages.map(where);
    const out = [
      'leave animation: the element is removed by ' +
        (owners.every((o) => o === 'none')
          ? 'its parent, so this leave may never have run in the legacy version either'
          : `${[...new Set(owners)].join('/')} before a directive can run`) +
        '; keep it mounted with *movePresence / *movePresenceFor, or use native animate.leave',
    ];
    return {
      classification: 'partial',
      reasons: out,
      suggestion: [
        enterTween && typeof enterTween !== 'string' ? enterSuggestion(enterTween) : null,
        leaveSuggestion(leaveTween),
      ]
        .filter(Boolean)
        .join('\n'),
    };
  }

  const tween = enterTween as Tween;
  return {
    classification: 'automatic',
    reasons: [
      'static :enter tween on opacity/transform with literal timing, no callbacks, no parameters',
      'angular native animate.enter with CSS is an equally valid target',
    ],
    suggestion: enterSuggestion(tween),
  };
}
