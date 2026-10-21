#!/usr/bin/env node
/**
 * Fails when the documented directive reference no longer matches the library source.
 *
 * The reference in `src/app/shared/api/directive-reference.ts` is hand-written prose + types that
 * cannot be fully derived from the source, but every *fact* in it can be checked: which directives
 * exist, their selectors, their input names, and which inputs are required.
 *
 * Reuses `.claude/scripts/api-surface.mjs --json` as the parser so there is exactly one place that
 * knows how to read the library.
 *
 *   node scripts/check-docs-drift.mjs
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const REFERENCE = 'src/app/shared/api/directive-reference.ts';

/** Inputs every directive inherits from the shared timing config — documented selectively. */
const OPTIONAL_TO_DOCUMENT = new Set([
  'moveDuration',
  'moveEasing',
  'moveDelay',
  'moveDisabled',
  'moveSpring',
  'moveReverseDuration',
  'moveReverseEasing',
  'moveTransition',
]);

const surface = JSON.parse(
  execFileSync('node', ['.claude/scripts/api-surface.mjs', '--json'], { encoding: 'utf8' }),
);

const referenceSource = readFileSync(REFERENCE, 'utf8');

/** Pulls each documented directive block out of the reference module. */
function parseReference(source) {
  const entries = [];
  const blockRe = /\{\s*name:\s*'(\w+)',\s*selector:\s*'([^']+)',([\s\S]*?)\n {2}\},?\n/g;
  let match;
  while ((match = blockRe.exec(source))) {
    const [, name, selector, body] = match;
    const inputs = [...body.matchAll(/\{\s*name:\s*'(\w+)',[\s\S]*?required:\s*(true|false)/g)].map(
      (m) => ({ name: m[1], required: m[2] === 'true' }),
    );
    entries.push({ name, selector, inputs });
  }
  return entries;
}

/**
 * Selectors are compared semantically, not textually:
 * - whitespace between alternatives is insignificant (`[a], [b]` ≡ `[a],[b]`);
 * - docs may use the structural-directive form (`*movePresence` ≡ `[movePresence]`), which is how
 *   users actually write it in a template.
 */
function selectorsMatch(documented, source) {
  const normalize = (selector) =>
    selector
      .split(',')
      .map((part) => part.trim().replace(/^\*(\w+)$/, '[$1]'))
      .filter(Boolean)
      .sort()
      .join(',');

  return normalize(documented) === normalize(source);
}

const documented = parseReference(referenceSource);
const errors = [];

const byName = new Map(surface.map((d) => [d.className, d]));
const documentedNames = new Set(documented.map((d) => d.name));

for (const directive of surface) {
  if (!documentedNames.has(directive.className)) {
    errors.push(`${directive.className} exists in the library but is missing from ${REFERENCE}`);
  }
}

for (const entry of documented) {
  const actual = byName.get(entry.name);
  if (!actual) {
    errors.push(`${entry.name} is documented in ${REFERENCE} but no longer exists in the library`);
    continue;
  }

  if (!selectorsMatch(entry.selector, actual.selector)) {
    errors.push(
      `${entry.name}: documented selector ${entry.selector} != source selector ${actual.selector}`,
    );
  }

  const actualInputs = new Map(
    actual.inputs.map((raw) => [raw.replace(/\*$/, ''), raw.endsWith('*')]),
  );

  for (const input of entry.inputs) {
    if (!actualInputs.has(input.name)) {
      errors.push(`${entry.name}: documented input "${input.name}" does not exist in the source`);
      continue;
    }
    const requiredInSource = actualInputs.get(input.name);
    if (requiredInSource !== input.required) {
      errors.push(
        `${entry.name}: input "${input.name}" is ${requiredInSource ? 'required' : 'optional'} in ` +
          `the source but documented as ${input.required ? 'required' : 'optional'}`,
      );
    }
  }

  // Required inputs are the API contract — they must always be documented.
  for (const [inputName, isRequired] of actualInputs) {
    const isDocumented = entry.inputs.some((i) => i.name === inputName);
    if (!isDocumented && (isRequired || !OPTIONAL_TO_DOCUMENT.has(inputName))) {
      errors.push(
        `${entry.name}: input "${inputName}" exists in the source but is not documented` +
          (isRequired ? ' (and it is required)' : ''),
      );
    }
  }
}

/**
 * Editorial pages cannot be generated from the source, so they are checked for the failure modes
 * that actually bite:
 *   1. every `moveSomething` identifier they mention still exists (renamed inputs silently
 *      outliving the rename);
 *   2. known-wrong *patterns* in code samples (see ANTI_PATTERNS) do not reappear.
 */
function listFiles(dir, test, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) listFiles(full, test, out);
    else if (test(full)) out.push(full);
  }
  return out;
}

const EDITORIAL_PAGES = [
  ...listFiles('src/app/pages/docs', (f) => f.endsWith('.page.ts')),
  ...listFiles('src/app/pages/home', (f) => f.endsWith('.ts') && !f.endsWith('.spec.ts')),
  'README.md',
  'MIGRATION.md',
  'projects/movement/README.md',
].filter((f) => existsSync(f));

const knownIdentifiers = new Set();
for (const directive of surface) {
  for (const part of directive.selector.split(',')) {
    knownIdentifiers.add(part.trim().replace(/[[\]*]/g, ''));
  }
  if (directive.exportAs) knownIdentifiers.add(directive.exportAs);
  for (const input of directive.inputs) knownIdentifiers.add(input.replace(/\*$/, ''));
  for (const output of directive.outputs) knownIdentifiers.add(output);
  for (const signal of directive.signals) knownIdentifiers.add(signal);
}
// Everything the package exports (functions, constants, types) is a legitimate identifier too.
const apiReport = readFileSync('projects/movement/api-report.txt', 'utf8');
for (const match of apiReport.matchAll(/\bmove[A-Z]\w*/g)) knownIdentifiers.add(match[0]);
// Identifiers that are documented as concepts or inputs of a *template-level* config object.
const CONCEPT_IDENTIFIERS = new Set(['moveMigrate', 'moveFadeIn' /* deliberate invented name in mcp.page.ts */]);
for (const id of CONCEPT_IDENTIFIERS) knownIdentifiers.add(id);

for (const page of EDITORIAL_PAGES) {
  const source = readFileSync(page, 'utf8');
  const mentioned = new Set(source.match(/\bmove[A-Z]\w*/g) ?? []);
  for (const identifier of mentioned) {
    if (!knownIdentifiers.has(identifier)) {
      errors.push(`${page}: mentions "${identifier}", which does not exist in the library`);
    }
  }
}

/**
 * Patterns that were once published and are semantically wrong. Each is matched per element-ish
 * chunk (a tag, or a JS object), so unrelated examples on the same page do not trigger it.
 */
const ANTI_PATTERNS = [
  {
    name: '[moveAnimate] on a host that also has [moveVariants] (moveAnimate is ignored there; use moveVariant)',
    test: (source) =>
      [...source.matchAll(/<[a-zA-Z][^<>]*?>/gs)].some(
        ([tag]) => /\[?moveVariants\]?\s*=/.test(tag) && /\[moveAnimate\]\s*=\s*"[^"]*\?/.test(tag),
      ),
  },
  {
    name: 'claims per-property easing falls back to the global easing (only transform channels share one)',
    test: (source) => /per-property\s+(<code>|`)?easing(<\/code>|`)?\s+values\s+currently\s+fall\s+back/i.test(source),
  },
  {
    name: 'documents an npx/pnpm dlx command for the unpublished movement-migrate package',
    test: (source) => /(npx|pnpm dlx|yarn dlx)\s+(angular-)?movement-migrate/.test(source),
  },
];

for (const page of EDITORIAL_PAGES) {
  const source = readFileSync(page, 'utf8');
  for (const pattern of ANTI_PATTERNS) {
    if (pattern.test(source)) errors.push(`${page}: ${pattern.name}`);
  }
}

if (errors.length) {
  console.error(`✗ docs drift — ${errors.length} problem(s) against the library source:\n`);
  for (const error of errors) console.error(`  • ${error}`);
  console.error('\nUpdate the docs so they match the library source.');
  process.exit(1);
}

console.log(
  `✓ no docs drift — ${documented.length} documented directives match the library source ` +
    `(${surface.length} in the API surface); ${EDITORIAL_PAGES.length} editorial files mention ` +
    `only existing identifiers and contain no known-wrong patterns`,
);
