import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import ts from 'typescript';
import { classifyTrigger } from './classify.js';
import { scanTemplate, type TemplateUsage } from './template-scan.js';
import { isTriggerCall, parseTrigger, type TriggerModel } from './trigger-model.js';
import type { Classification, Finding, Report, SourceLocation } from './types.js';

const SKIP_DIRS = new Set(['node_modules', 'dist', '.angular', '.git', 'coverage', 'out-tsc']);
const PROVIDERS = new Set([
  'provideAnimations',
  'provideAnimationsAsync',
  'provideNoopAnimations',
  'BrowserAnimationsModule',
  'NoopAnimationsModule',
]);

interface ComponentInfo {
  file: string;
  sourceFile: ts.SourceFile;
  triggers: { model: TriggerModel; unresolved?: undefined }[];
  unresolvedAnimations: { text: string; location: SourceLocation }[];
  templates: { text: string; file: string; lineOffset: number }[];
  hostBindings: { name: string; dynamic: boolean; location: SourceLocation }[];
}

function walk(dir: string, out: string[]): void {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else if (/\.ts$/.test(entry) && !/\.d\.ts$/.test(entry) && !/\.spec\.ts$/.test(entry))
      out.push(full);
  }
}

const loc = (sf: ts.SourceFile, node: ts.Node, root: string): SourceLocation => {
  const { line, character } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
  return { file: relative(root, sf.fileName), line: line + 1, column: character + 1 };
};

function propertyOf(obj: ts.ObjectLiteralExpression, name: string): ts.Expression | undefined {
  for (const p of obj.properties) {
    if (
      ts.isPropertyAssignment(p) &&
      (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) &&
      p.name.text === name
    ) {
      return p.initializer;
    }
  }
  return undefined;
}

/** Reads the project without writing anything and returns a classified report. */
export function assessProject(rootDir: string): Report {
  const root = resolve(rootDir);
  const files: string[] = [];
  walk(root, files);

  const sources = new Map<string, ts.SourceFile>();
  for (const file of files) {
    sources.set(
      file,
      ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true),
    );
  }

  // 1. Registry of top-level `const x = trigger(...)` so `animations: [x]` can be resolved.
  const registry = new Map<string, TriggerModel>();
  for (const [file, sf] of sources) {
    for (const statement of sf.statements) {
      if (!ts.isVariableStatement(statement)) continue;
      for (const decl of statement.declarationList.declarations) {
        if (
          ts.isIdentifier(decl.name) &&
          decl.initializer &&
          ts.isCallExpression(decl.initializer) &&
          isTriggerCall(decl.initializer)
        ) {
          if (!registry.has(decl.name.text))
            registry.set(decl.name.text, parseTrigger(decl.initializer, sf));
        }
      }
    }
    void file;
  }

  const findings: Finding[] = [];
  const claimed = new Set<TriggerModel>();

  // 2. Components.
  for (const [file, sf] of sources) {
    const visit = (node: ts.Node): void => {
      if (ts.isClassDeclaration(node)) {
        for (const decorator of ts.getDecorators(node) ?? []) {
          if (!ts.isCallExpression(decorator.expression)) continue;
          const callee = decorator.expression.expression;
          if (!ts.isIdentifier(callee) || callee.text !== 'Component') continue;
          const arg = decorator.expression.arguments[0];
          if (arg && ts.isObjectLiteralExpression(arg)) assessComponent(arg, sf, file);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }

  function assessComponent(obj: ts.ObjectLiteralExpression, sf: ts.SourceFile, file: string): void {
    const info: ComponentInfo = {
      file,
      sourceFile: sf,
      triggers: [],
      unresolvedAnimations: [],
      templates: [],
      hostBindings: [],
    };

    const animations = propertyOf(obj, 'animations');
    if (animations && ts.isArrayLiteralExpression(animations)) {
      for (const el of animations.elements) {
        if (ts.isCallExpression(el) && isTriggerCall(el)) {
          info.triggers.push({ model: parseTrigger(el, sf) });
        } else if (ts.isIdentifier(el) && registry.has(el.text)) {
          info.triggers.push({ model: registry.get(el.text)! });
        } else {
          info.unresolvedAnimations.push({ text: el.getText(sf), location: loc(sf, el, root) });
        }
      }
    } else if (animations) {
      info.unresolvedAnimations.push({
        text: animations.getText(sf),
        location: loc(sf, animations, root),
      });
    }

    const template = propertyOf(obj, 'template');
    const templateUrl = propertyOf(obj, 'templateUrl');
    if (
      template &&
      (ts.isStringLiteral(template) || ts.isNoSubstitutionTemplateLiteral(template))
    ) {
      info.templates.push({
        text: template.text,
        file,
        lineOffset: sf.getLineAndCharacterOfPosition(template.getStart(sf)).line,
      });
    } else if (templateUrl && ts.isStringLiteral(templateUrl)) {
      const path = resolve(dirname(file), templateUrl.text);
      if (existsSync(path))
        info.templates.push({ text: readFileSync(path, 'utf8'), file: path, lineOffset: 0 });
    }

    const host = propertyOf(obj, 'host');
    if (host && ts.isObjectLiteralExpression(host)) {
      for (const p of host.properties) {
        if (ts.isPropertyAssignment(p) && (ts.isStringLiteral(p.name) || ts.isIdentifier(p.name))) {
          const key = p.name.text;
          if (/^\[?@/.test(key)) {
            info.hostBindings.push({
              name: key.replace(/^\[?@/, '').replace(/\]$/, ''),
              dynamic: key.startsWith('['),
              location: loc(sf, p, root),
            });
          }
        }
      }
    }

    // Template usages, mapped to absolute locations.
    const usages: (TemplateUsage & { location: SourceLocation })[] = [];
    for (const tpl of info.templates) {
      const scan = scanTemplate(tpl.text, tpl.file);
      for (const u of scan.usages) {
        usages.push({
          ...u,
          location: {
            file: relative(root, tpl.file),
            line: tpl.lineOffset + u.line + 1,
            column: u.column + 1,
          },
        });
      }
    }
    for (const h of info.hostBindings) {
      usages.push({
        trigger: h.name,
        dynamic: h.dynamic,
        callbacks: [],
        line: 0,
        column: 0,
        element: 'host',
        owner: null,
        location: h.location,
      });
    }

    const known = new Set(info.triggers.map((t) => t.model.name));

    for (const { model } of info.triggers) {
      claimed.add(model);
      const own = usages.filter((u) => u.trigger === model.name);
      const verdict = classifyTrigger(model, own);
      const hostOnly = own.length > 0 && own.every((u) => u.element === 'host');
      findings.push({
        kind: 'trigger',
        classification: hostOnly ? 'manual' : verdict.classification,
        name: model.name,
        location: loc(model.sourceFile, model.node, root),
        usages: own.map((u) => u.location),
        reasons: hostOnly
          ? ['bound through a host binding; migrate the host element by hand']
          : verdict.reasons,
        suggestion: hostOnly ? undefined : verdict.suggestion,
      });
    }

    for (const u of info.unresolvedAnimations) {
      findings.push({
        kind: 'trigger',
        classification: 'manual',
        location: u.location,
        usages: [],
        reasons: [
          `animations entry '${u.text.slice(0, 60)}' could not be resolved statically (spread, factory or import from outside the scanned folder)`,
        ],
      });
    }

    for (const u of usages) {
      if (!known.has(u.trigger) && info.unresolvedAnimations.length === 0) {
        findings.push({
          kind: 'unresolved-binding',
          classification: 'manual',
          name: u.trigger,
          location: u.location,
          usages: [],
          reasons: [
            `template binds @${u.trigger} but this component does not declare that trigger`,
          ],
        });
      }
    }
  }

  // 3. Providers / modules / AnimationBuilder (informational).
  for (const [, sf] of sources) {
    const visit = (node: ts.Node): void => {
      if (ts.isIdentifier(node) && !ts.isImportSpecifier(node.parent)) {
        if (PROVIDERS.has(node.text)) {
          findings.push({
            kind: 'provider',
            classification: 'manual',
            name: node.text,
            location: loc(sf, node, root),
            usages: [],
            reasons: [
              'keep this until no @trigger bindings remain; removing it early breaks every trigger still in use',
            ],
          });
        } else if (node.text === 'AnimationBuilder' && !ts.isImportSpecifier(node.parent)) {
          findings.push({
            kind: 'animation-builder',
            classification: 'manual',
            name: node.text,
            location: loc(sf, node, root),
            usages: [],
            reasons: [
              'imperative AnimationBuilder code; consider MoveAnimator, but control flow and callbacks must be ported by hand',
            ],
          });
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }

  // Triggers never attached to a component (exported but unused here) are not reported.
  findings.sort(
    (a, b) =>
      a.location.file.localeCompare(b.location.file) ||
      a.location.line - b.location.line ||
      a.location.column - b.location.column,
  );

  const summary: Record<Classification, number> = {
    automatic: 0,
    partial: 0,
    manual: 0,
    'keep-native': 0,
  };
  for (const f of findings) summary[f.classification]++;
  return { root, filesScanned: files.length, summary, findings };
}
