import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEMO_LINKS } from './demo-links';
import { MOTION_EXAMPLES } from './registry';

const root = process.cwd();

/** `/docs/guides/enter` → `src/content/docs/guides/enter.md` (Doqs serves the Markdown tree 1:1). */
const docFile = (path: string) => resolve(root, 'src/content', `${path.replace(/^\//, '')}.md`);

const demoSlugs = readdirSync(resolve(root, 'src/app/pages/demos'))
  .filter((file) => file.endsWith('.page.ts') && !file.endsWith('.spec.ts'))
  .map((file) => file.replace(/\.page\.ts$/, ''))
  .filter((slug) => slug !== 'index');

describe('demo ↔ documentation cross-links', () => {
  it('every demo route has a link entry, and every entry is a real demo', () => {
    expect(Object.keys(DEMO_LINKS).sort()).toEqual([...demoSlugs].sort());
  });

  it('every documented guide and API page exists in the generated content', () => {
    const missing: string[] = [];
    for (const [slug, links] of Object.entries(DEMO_LINKS)) {
      for (const link of [...(links.docs ? [links.docs] : []), ...links.api]) {
        if (!existsSync(docFile(link.path))) missing.push(`${slug}: ${link.path}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('related demos exist and never point at themselves', () => {
    for (const [slug, links] of Object.entries(DEMO_LINKS)) {
      for (const related of links.related) {
        expect(demoSlugs, `${slug} → ${related}`).toContain(related);
        expect(related).not.toBe(slug);
      }
    }
  });

  it('every motion example points at an existing guide and demo', () => {
    for (const example of Object.values(MOTION_EXAMPLES)) {
      expect(existsSync(docFile(example.docs)), example.docs).toBe(true);
      expect(demoSlugs).toContain(example.demo.replace('/demos/', ''));
    }
  });
});
