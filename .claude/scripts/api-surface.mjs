#!/usr/bin/env node
/**
 * Prints the public API surface of the `movement` library in one pass:
 * every directive's class name, selector, inputs, outputs and exported signals,
 * plus whether it is wired into MOVEMENT_DIRECTIVES and re-exported from movement.ts.
 *
 * Exists so agents can diff the API without reading 20+ directive files.
 *
 *   node .claude/scripts/api-surface.mjs           # human-readable table
 *   node .claude/scripts/api-surface.mjs --json    # machine-readable, for diffing
 *   node .claude/scripts/api-surface.mjs --ref HEAD~1   # surface at a git ref
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const LIB = 'projects/movement/src/lib';
const DIRS = [`${LIB}/directives`, `${LIB}/scroll`];
const BARREL = `${LIB}/movement.ts`;

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const refIndex = args.indexOf('--ref');
const ref = refIndex === -1 ? null : args[refIndex + 1];

/** Reads a repo file either from disk or from a git ref. */
function read(path) {
  if (!ref) return readFileSync(path, 'utf8');
  return execFileSync('git', ['show', `${ref}:${path}`], { encoding: 'utf8' });
}

/** Lists *.directive.ts files (never specs) either from disk or from a git ref. */
function listDirectiveFiles() {
  if (!ref) {
    return DIRS.flatMap((dir) =>
      readdirSync(dir)
        .filter((f) => f.endsWith('.directive.ts'))
        .map((f) => join(dir, f)),
    );
  }
  const tracked = execFileSync('git', ['ls-tree', '-r', '--name-only', ref, ...DIRS], {
    encoding: 'utf8',
  });
  return tracked.split('\n').filter((f) => f.endsWith('.directive.ts'));
}

/**
 * Extracts one entry per @Directive class. Regex-based on purpose: it must stay
 * dependency-free and survive being run against an arbitrary git ref.
 */
function parseDirective(source, file) {
  const out = [];
  const classRe = /@Directive\(\{([\s\S]*?)\}\)\s*export class (\w+)/g;
  let match;
  while ((match = classRe.exec(source))) {
    const [, meta, className] = match;
    const selector = meta.match(/selector:\s*'([^']+)'/)?.[1] ?? '(none)';
    const exportAs = meta.match(/exportAs:\s*'([^']+)'/)?.[1] ?? null;

    // Members are declared after the class header; slice to the next @Directive block.
    const bodyStart = match.index + match[0].length;
    const nextDirective = source.indexOf('@Directive({', bodyStart);
    const body = source.slice(bodyStart, nextDirective === -1 ? undefined : nextDirective);

    const inputs = [];
    const inputRe = /readonly\s+(\w+)\s*=\s*input(\.required)?</g;
    let inputMatch;
    while ((inputMatch = inputRe.exec(body))) {
      inputs.push(inputMatch[1] + (inputMatch[2] ? '*' : ''));
    }

    const outputs = [];
    const outputRe = /readonly\s+(\w+)\s*=\s*output</g;
    let outputMatch;
    while ((outputMatch = outputRe.exec(body))) outputs.push(outputMatch[1]);

    // Public readonly signals (progress, isDragging, …) are part of the template API.
    const signals = [];
    // `signal(0)` as well as `signal<number>(0)` — the generic-only form missed every real signal.
    const signalRe = /readonly\s+(\w+)\s*=\s*(?:signal|computed|linkedSignal)\s*[<(]/g;
    let signalMatch;
    while ((signalMatch = signalRe.exec(body))) {
      if (!signalMatch[1].startsWith('#')) signals.push(signalMatch[1]);
    }

    out.push({ file, className, selector, exportAs, inputs, outputs, signals });
  }
  return out;
}

const barrel = read(BARREL);

/**
 * Members of an aggregate array in the barrel, following `...OTHER_AGGREGATE` spreads. Since spec
 * 013 `MOVEMENT_DIRECTIVES` is `[...MOVEMENT_STABLE_DIRECTIVES, ...MOVEMENT_EXPERIMENTAL_DIRECTIVES]`;
 * reading only its literal entries found no class names at all, which silently emptied the MCP
 * snapshot generated from this script.
 */
function aggregateMembers(name, seen = new Set()) {
  if (seen.has(name)) return [];
  seen.add(name);
  const body = barrel.match(new RegExp(`${name}\\s*=\\s*\\[([\\s\\S]*?)\\]`))?.[1] ?? '';
  return body
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .flatMap((entry) =>
      entry.startsWith('...') ? aggregateMembers(entry.slice(3).trim(), seen) : [entry],
    );
}

const registered = new Set(aggregateMembers('MOVEMENT_DIRECTIVES'));
const reExported = new Set(
  [...barrel.matchAll(/export \* from '\.\/(.+?)'/g)].map((m) => m[1].split('/').pop()),
);

const directives = listDirectiveFiles()
  .flatMap((file) => parseDirective(read(file), file))
  .map((d) => ({
    ...d,
    inMovementDirectives: registered.has(d.className),
    reExported: reExported.has(d.file.split('/').pop().replace(/\.ts$/, '')),
  }))
  .sort((a, b) => a.className.localeCompare(b.className));

if (asJson) {
  console.log(JSON.stringify(directives, null, 2));
} else {
  console.log(`# movement public API surface${ref ? ` @ ${ref}` : ''} — ${directives.length} directives\n`);
  for (const d of directives) {
    const flags = [
      d.inMovementDirectives ? null : 'NOT-IN-MOVEMENT_DIRECTIVES',
      d.reExported ? null : 'NOT-RE-EXPORTED',
    ].filter(Boolean);
    console.log(`${d.className}  ${d.selector}${d.exportAs ? `  exportAs=${d.exportAs}` : ''}`);
    console.log(`  inputs:  ${d.inputs.join(', ') || '—'}`);
    if (d.outputs.length) console.log(`  outputs: ${d.outputs.join(', ')}`);
    if (d.signals.length) console.log(`  signals: ${d.signals.join(', ')}`);
    if (flags.length) console.log(`  ⚠ ${flags.join(' | ')}`);
    console.log('');
  }
  console.log('(* = input.required)');
}
