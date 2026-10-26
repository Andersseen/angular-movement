import { expect, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { DEMO_ROUTES } from './routes';
import { waitForHydration } from './hydration';

test('generated demo components compile against the public Angular Movement API', async ({
  page,
}) => {
  test.setTimeout(120_000);
  const dir = mkdtempSync(join(tmpdir(), 'movement-demo-sources-'));
  const files: string[] = [];
  try {
    symlinkSync(resolve('node_modules'), join(dir, 'node_modules'), 'dir');
    for (const slug of DEMO_ROUTES) {
      await page.goto(`/demos/${slug}`);
      await waitForHydration(page);
      const tabs = page.getByRole('group', { name: 'Source files' });
      const component = tabs.getByRole('button', { name: 'demo.component.ts', exact: true });
      if (!(await component.count())) {
        if (slug === 'values' || slug === 'imperative') {
          const target = join(dir, slug + '.ts');
          writeFileSync(target, await page.locator('app-code-block pre code').innerText());
          files.push(target);
          if (slug === 'imperative') {
            for (const title of ['theme-reveal.component.ts', 'flash.component.ts']) {
              await tabs.getByRole('button', { name: title, exact: true }).click();
              await expect(page.locator('app-code-block figcaption')).toContainText(title);
              const example = join(dir, title);
              writeFileSync(example, await page.locator('app-code-block pre code').innerText());
              files.push(example);
            }
          }
        } else if (slug === 'smooth-scroll') {
          const target = join(dir, slug);
          mkdirSync(target);
          writeFileSync(
            join(target, 'scoped-container.html'),
            await page.locator('app-code-block pre code').innerText(),
          );
          await tabs.getByRole('button', { name: 'scroll.component.ts', exact: true }).click();
          await expect(page.locator('app-code-block figcaption')).toContainText(
            'scroll.component.ts',
          );
          writeFileSync(
            join(target, 'scroll.component.ts'),
            await page.locator('app-code-block pre code').innerText(),
          );
          files.push(join(target, 'scroll.component.ts'));
        }
        continue;
      }
      const target = join(dir, slug);
      mkdirSync(target);
      const html = await page.locator('app-code-block pre code').innerText();
      await component.click();
      await expect(page.locator('app-code-block figcaption')).toContainText('demo.component.ts');
      const source = await page.locator('app-code-block pre code').innerText();
      writeFileSync(join(target, 'demo.html'), html);
      writeFileSync(join(target, 'demo.component.ts'), source);
      files.push(join(target, 'demo.component.ts'));
    }
    expect(files.length).toBe(25);
    writeFileSync(
      join(dir, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          target: 'ES2022',
          module: 'preserve',
          moduleResolution: 'bundler',
          strict: true,
          skipLibCheck: true,
          experimentalDecorators: true,
          noEmit: true,
          paths: { 'angular-movement': [resolve('projects/movement/src/public-api.ts')] },
        },
        angularCompilerOptions: { strictTemplates: true },
        files,
      }),
    );
    execFileSync(resolve('node_modules/.bin/ngc'), ['-p', join(dir, 'tsconfig.json')], {
      encoding: 'utf8',
      timeout: 60_000,
      stdio: 'pipe',
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
