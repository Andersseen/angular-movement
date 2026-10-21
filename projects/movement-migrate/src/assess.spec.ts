import { createHash } from 'node:crypto';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { assessProject } from './assess.js';
import { formatText } from './format.js';

const created: string[] = [];

function project(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'movement-migrate-'));
  created.push(dir);
  for (const [name, content] of Object.entries(files)) {
    const path = join(dir, name);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  }
  return dir;
}

function snapshot(dir: string): string {
  const hash = createHash('sha256');
  const walk = (d: string) => {
    for (const entry of readdirSync(d).sort()) {
      const full = join(d, entry);
      if (statSync(full).isDirectory()) walk(full);
      else hash.update(full).update(readFileSync(full));
    }
  };
  walk(dir);
  return hash.digest('hex');
}

afterEach(() => {
  while (created.length) rmSync(created.pop()!, { recursive: true, force: true });
});

const FADE_UP = `trigger('fadeUp', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(20px)' }),
    animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
  ]),
])`;

const component = (animations: string, template: string, extra = '') => `
import { Component } from '@angular/core';
import { trigger, transition, style, animate, state, query, stagger, group } from '@angular/animations';
@Component({
  selector: 'app-x',
  template: \`${template}\`,
  animations: [${animations}],${extra}
})
export class X {}
`;

function only(dir: string) {
  const report = assessProject(dir);
  const triggers = report.findings.filter((f) => f.kind === 'trigger');
  expect(triggers).toHaveLength(1);
  return triggers[0];
}

describe('assessProject: classification', () => {
  it('flags a static literal :enter tween as an automatic candidate with a suggestion', () => {
    const f = only(
      project({
        'a.ts': component(FADE_UP, '@for (i of items; track i) { <li @fadeUp>{{ i }}</li> }'),
      }),
    );
    expect(f.classification).toBe('automatic');
    expect(f.suggestion).toContain('[moveEnter]="{ opacity: [0, 1], y: [20, 0] }"');
    expect(f.suggestion).toContain('moveDuration="300ms"');
    expect(f.suggestion).toContain('moveEasing="ease-out"');
    expect(f.usages).toHaveLength(1);
    expect(f.location).toMatchObject({ file: 'a.ts' });
  });

  it('follows templateUrl and reports usage locations in the html file', () => {
    const dir = project({
      'a.ts': component(FADE_UP, '').replace(/template: `[^`]*`/, "templateUrl: './a.html'"),
      'a.html': '<div>\n  <p @fadeUp>x</p>\n</div>',
    });
    const f = only(dir);
    expect(f.classification).toBe('automatic');
    expect(f.usages[0]).toEqual({ file: 'a.html', line: 2, column: 3 });
  });

  it('resolves a trigger exported from another file', () => {
    const f = only(
      project({
        'anim.ts': `import { trigger, transition, style, animate } from '@angular/animations';\nexport const fadeUp = ${FADE_UP};`,
        'a.ts': component('fadeUp', '<p @fadeUp></p>'),
      }),
    );
    expect(f.classification).toBe('automatic');
  });

  it('treats enter+leave under @if as partial and explains the ownership problem', () => {
    const f = only(
      project({
        'a.ts': component(
          `trigger('panel', [
            transition(':enter', [style({ opacity: 0 }), animate('200ms', style({ opacity: 1 }))]),
            transition(':leave', [style({ opacity: 1 }), animate('150ms', style({ opacity: 0 }))]),
          ])`,
          '@if (open) { <aside @panel>x</aside> }',
        ),
      }),
    );
    expect(f.classification).toBe('partial');
    expect(f.reasons.join(' ')).toMatch(/if before a directive can run/);
    expect(f.suggestion).toContain('*movePresence');
  });

  it('treats state-driven triggers as partial (manual state mapping)', () => {
    const f = only(
      project({
        'a.ts': component(
          `trigger('open', [
            state('closed', style({ opacity: 0 })),
            state('open', style({ opacity: 1 })),
            transition('closed <=> open', animate('200ms')),
          ])`,
          "<div [@open]=\"isOpen ? 'open' : 'closed'\"></div>",
        ),
      }),
    );
    expect(f.classification).toBe('partial');
    expect(f.reasons[0]).toContain('moveVariants');
  });

  it('keeps :enter with an animation callback as partial, never automatic', () => {
    const f = only(
      project({ 'a.ts': component(FADE_UP, '<p @fadeUp (@fadeUp.done)="done()"></p>') }),
    );
    expect(f.classification).toBe('partial');
    expect(f.reasons[0]).toContain('fadeUp.done');
  });

  it('classifies [@name]="expr" bound enter as partial', () => {
    const f = only(project({ 'a.ts': component(FADE_UP, '<p [@fadeUp]="state"></p>') }));
    expect(f.classification).toBe('partial');
  });

  it('marks query/stagger/group triggers manual', () => {
    const f = only(
      project({
        'a.ts': component(
          `trigger('list', [transition('* => *', [query(':enter', [style({ opacity: 0 }), stagger(100, animate('300ms', style({ opacity: 1 })))], { optional: true })])])`,
          '<ul [@list]="items.length"></ul>',
        ),
      }),
    );
    expect(f.classification).toBe('manual');
    expect(f.reasons.join(' ')).toContain('query()');
    expect(f.reasons.join(' ')).toContain('View Transitions');
  });

  it('marks params-based and non-literal triggers manual', () => {
    const params = only(
      project({
        'a.ts': component(
          `trigger('p', [transition(':enter', [style({ opacity: 0 }), animate('{{ t }}ms', style({ opacity: 1 }))], { params: { t: 200 } })])`,
          '<p @p></p>',
        ),
      }),
    );
    expect(params.classification).toBe('manual');

    const dynamic = only(
      project({
        'a.ts': `${component(`trigger('d', [transition(':enter', [style({ opacity: 0 }), animate(TIMING, style({ opacity: 1 }))])])`, '<p @d></p>')}\nconst TIMING = '1s';`,
      }),
    );
    expect(dynamic.classification).toBe('manual');
  });

  it('keeps height/colour tweens native', () => {
    const f = only(
      project({
        'a.ts': component(
          `trigger('grow', [transition(':enter', [style({ height: 0 }), animate('200ms', style({ height: '*' }))])])`,
          '<p @grow></p>',
        ),
      }),
    );
    expect(f.classification).toBe('keep-native');
  });

  it('refuses to guess when from/to properties differ', () => {
    const f = only(
      project({
        'a.ts': component(
          `trigger('x', [transition(':enter', [style({ opacity: 0, transform: 'translateY(8px)' }), animate('200ms', style({ opacity: 1 }))])])`,
          '<p @x></p>',
        ),
      }),
    );
    expect(f.classification).toBe('manual');
    expect(f.reasons.join(' ')).toContain('different properties');
  });

  it('refuses percentage / unknown transform units', () => {
    const f = only(
      project({
        'a.ts': component(
          `trigger('x', [transition(':enter', [style({ transform: 'translateY(50%)' }), animate('200ms', style({ transform: 'translateY(0)' }))])])`,
          '<p @x></p>',
        ),
      }),
    );
    expect(f.classification).toBe('manual');
  });

  it('reports a trigger with no resolvable usage as manual', () => {
    const f = only(project({ 'a.ts': component(FADE_UP, '<p>no binding</p>') }));
    expect(f.classification).toBe('manual');
    expect(f.reasons[0]).toContain('no template binding');
  });

  it('flags providers and AnimationBuilder informationally, never as automatic', () => {
    const report = assessProject(
      project({
        'main.ts': `import { provideAnimations } from '@angular/platform-browser/animations';\nbootstrap({ providers: [provideAnimations()] });`,
        'svc.ts': `import { AnimationBuilder } from '@angular/animations';\nexport class S { constructor(private b: AnimationBuilder) {} }`,
      }),
    );
    expect(report.findings.map((f) => f.kind).sort()).toEqual(['animation-builder', 'provider']);
    expect(report.findings.every((f) => f.classification === 'manual')).toBe(true);
  });

  it('reports a binding to an undeclared trigger', () => {
    const report = assessProject(project({ 'a.ts': component('', '<p @ghost></p>') }));
    expect(report.findings[0]).toMatchObject({ kind: 'unresolved-binding', name: 'ghost' });
  });

  it('does not misclassify unresolved animations arrays', () => {
    const report = assessProject(project({ 'a.ts': component('...shared', '<p @fadeUp></p>') }));
    expect(report.summary.automatic).toBe(0);
    expect(report.findings.some((f) => f.reasons[0].includes('could not be resolved'))).toBe(true);
  });
});

describe('assessProject: safety', () => {
  it('never modifies the scanned project and is deterministic', () => {
    const dir = project({
      'a.ts': component(FADE_UP, '<p @fadeUp></p>'),
      'main.ts': 'provideAnimations();',
    });
    const before = snapshot(dir);
    const first = assessProject(dir);
    const second = assessProject(dir);
    expect(snapshot(dir)).toBe(before);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });

  it('skips node_modules, dist and spec files', () => {
    const report = assessProject(
      project({
        'node_modules/x/a.ts': component(FADE_UP, '<p @fadeUp></p>'),
        'dist/a.ts': component(FADE_UP, '<p @fadeUp></p>'),
        'a.spec.ts': component(FADE_UP, '<p @fadeUp></p>'),
      }),
    );
    expect(report.filesScanned).toBe(0);
  });

  it('formats a readable text report with locations and the no-write notice', () => {
    const text = formatText(
      assessProject(project({ 'a.ts': component(FADE_UP, '<p @fadeUp></p>') })),
    );
    expect(text).toContain('AUTOMATIC CANDIDATE');
    expect(text).toContain("trigger 'fadeUp'  a.ts:");
    expect(text).toContain('No files were modified');
  });
});
