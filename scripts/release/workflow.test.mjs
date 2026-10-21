/**
 * Structural guarantees of the release setup, asserted on the real files: the properties that
 * make publication safe must not be editable away by accident.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const json = (p) => JSON.parse(read(p));
const workflow = (name) => parse(read(`.github/workflows/${name}`));
const workflowFiles = readdirSync(join(ROOT, '.github/workflows')).filter((f) =>
  f.endsWith('.yml'),
);

const release = workflow('release.yml');
const mcp = workflow('release-mcp.yml');
const jobPermissions = (job) => release.jobs[job].permissions ?? {};
const stepsOf = (job) => release.jobs[job].steps;
const runText = (job) =>
  stepsOf(job)
    .map((s) => s.run ?? '')
    .join('\n');

describe('triggers', () => {
  it('release.yml reacts only to pushes to main and a manual recovery dispatch', () => {
    assert.deepEqual(Object.keys(release.on).sort(), ['push', 'workflow_dispatch']);
    assert.deepEqual(release.on.push, { branches: ['main'] });
    assert.equal(release.on.push.tags, undefined);
  });

  it('no workflow depends on a tag created by another workflow (suppressed GITHUB_TOKEN event)', () => {
    for (const file of workflowFiles) {
      const tags = workflow(file).on?.push?.tags ?? [];
      assert.ok(
        tags.every((t) => t.startsWith('mcp-v')),
        `${file} triggers on tags ${tags}`,
      );
    }
    assert.ok(workflow('release-mcp.yml').on.push.tags.every((t) => t.startsWith('mcp-v')));
  });

  it('only one workflow can publish the library', () => {
    const publishing = (f) =>
      /cli\.mjs publish|npm publish|pnpm publish/.test(read(`.github/workflows/${f}`));
    assert.deepEqual(workflowFiles.filter(publishing).sort(), ['release-mcp.yml', 'release.yml']);
    assert.doesNotMatch(
      read('.github/workflows/release-mcp.yml'),
      /dist\/movement|angular-movement-v|projects\/movement\/package/,
    );
  });

  it('the recovery dispatch is bound to main and never interpolates its input into a script', () => {
    assert.match(release.jobs.resolve.if, /github\.ref == 'refs\/heads\/main'/);
    for (const [name, job] of Object.entries(release.jobs)) {
      for (const step of job.steps) {
        assert.doesNotMatch(
          step.run ?? '',
          /\$\{\{\s*(inputs|github\.event)\./,
          `${name}: untrusted input in run`,
        );
      }
    }
  });
});

describe('least privilege', () => {
  it('has no default permissions', () => {
    assert.deepEqual(release.permissions, {});
  });

  it('only the publish job can mint an OIDC token', () => {
    for (const job of Object.keys(release.jobs)) {
      const has = jobPermissions(job)['id-token'] === 'write';
      assert.equal(has, job === 'publish', `${job} id-token`);
    }
  });

  it('only prepare and finalize can write to the repository', () => {
    const writers = Object.keys(release.jobs).filter((j) => jobPermissions(j).contents === 'write');
    assert.deepEqual(writers.sort(), ['finalize', 'prepare']);
  });

  it('the gate jobs hold no write permission and no secrets', () => {
    for (const job of ['resolve', 'package', 'quality', 'consumer', 'consumer-runtime']) {
      assert.deepEqual(jobPermissions(job), { contents: 'read' });
      assert.doesNotMatch(JSON.stringify(release.jobs[job]), /secrets\./);
    }
  });

  it('every external action is pinned to a full commit SHA', () => {
    for (const file of workflowFiles) {
      const w = workflow(file);
      for (const job of Object.values(w.jobs)) {
        for (const step of job.steps ?? []) {
          if (step.uses) assert.match(step.uses, /@[0-9a-f]{40}$/, `${file}: ${step.uses}`);
        }
      }
    }
  });

  it('checkouts never persist credentials except the bot-owned Release PR branch', () => {
    const checkouts = Object.entries(release.jobs).flatMap(([job, j]) =>
      j.steps.filter((s) => s.uses?.startsWith('actions/checkout')).map((s) => ({ job, step: s })),
    );
    for (const { job, step } of checkouts) {
      if (job === 'prepare' && step.with.path === 'release-pr') continue;
      assert.equal(step.with['persist-credentials'], false, `${job} checkout`);
    }
  });
});

describe('publication', () => {
  const publish = release.jobs.publish;

  it('runs on a GitHub-hosted runner, in the npm-publish environment, never cancelled', () => {
    assert.equal(publish['runs-on'], 'ubuntu-latest');
    assert.equal(publish.environment, 'npm-publish');
    assert.equal(publish.concurrency['cancel-in-progress'], false);
    assert.match(publish.concurrency.group, /angular-movement/);
    assert.equal(release.concurrency['cancel-in-progress'], false);
  });

  it('cannot start before every gate and the artifact job passed', () => {
    for (const need of ['resolve', 'package', 'quality', 'consumer', 'consumer-runtime']) {
      assert.ok(publish.needs.includes(need), `publish must need ${need}`);
    }
    assert.equal(publish.if, undefined, 'no condition that could skip a failed gate');
  });

  it('uses OIDC only: no token, no registry-url placeholder, no install or build', () => {
    const text = JSON.stringify(publish);
    assert.doesNotMatch(text, /NPM_TOKEN|NODE_AUTH_TOKEN|_authToken|secrets\./);
    const node = publish.steps.find((s) => s.uses?.startsWith('actions/setup-node'));
    assert.equal(node.with['registry-url'], undefined);
    assert.doesNotMatch(runText('publish'), /pnpm|npm (ci|install) (?!--global)|ng build/);
  });

  it('publishes the downloaded, checksum-verified artifact', () => {
    const download = publish.steps.find((s) => s.uses?.startsWith('actions/download-artifact'));
    assert.equal(download.with.name, 'release-package');
    assert.match(runText('publish'), /cli\.mjs publish --dir artifact/);
  });

  it('the legacy secret is no longer used by the library release', () => {
    assert.doesNotMatch(read('.github/workflows/release.yml'), /NPM_TOKEN/);
  });

  it('finalizes (npm check + GitHub Release) only after a successful publish', () => {
    assert.equal(release.jobs.finalize.if, "needs.publish.result == 'success'");
    assert.ok(release.jobs.finalize.needs.includes('publish'));
  });
});

describe('release-please configuration', () => {
  const config = json('release-please-config.json');
  const pkg = config.packages['projects/movement'];

  it('manages exactly the library package, with the established vX.Y.Z tags', () => {
    assert.deepEqual(Object.keys(config.packages), ['projects/movement']);
    assert.equal(pkg['package-name'], 'angular-movement');
    assert.equal(pkg['include-component-in-tag'], false);
    assert.equal(pkg['include-v-in-tag'], true);
    assert.equal(pkg['pull-request-title-pattern'], 'chore(release): angular-movement v${version}');
  });

  it('creates a draft release with its tag, so npm publishes before the release goes public', () => {
    assert.equal(pkg.draft, true);
    assert.equal(pkg['force-tag-creation'], true);
  });

  it('has no permanent version override and does not own the changelog', () => {
    assert.equal(pkg['release-as'], undefined);
    assert.equal(config['release-as'], undefined);
    assert.equal(pkg['skip-changelog'], true);
    assert.equal(config['bootstrap-sha'], undefined, 'bootstrap comes from the v1.2.0+ tags');
  });

  it('keeps the MCP package and the private root out of release-please', () => {
    assert.ok(!JSON.stringify(config).includes('movement-mcp'));
    assert.equal(json('package.json').version, '0.0.0');
    assert.ok(!('.' in config.packages));
    assert.ok(
      !Object.keys(json('.release-please-manifest.json')).includes('projects/movement-mcp'),
    );
  });

  it('manifest and package.json agree on the last released version', () => {
    assert.equal(
      json('.release-please-manifest.json')['projects/movement'],
      json('projects/movement/package.json').version,
    );
  });
});

describe('quality gates', () => {
  const scripts = json('package.json').scripts;
  const gateText = ['quality', 'consumer', 'consumer-runtime', 'package']
    .map((j) => runText(j))
    .join('\n');
  const required = [
    'pnpm install --frozen-lockfile',
    'pnpm run lint',
    'pnpm run docs:check',
    'pnpm run test:coverage',
    'pnpm run test:site',
    'pnpm run test:scripts',
    'pnpm run migrate:test',
    'pnpm run migrate:build',
    'pnpm exec ng build movement',
    'pnpm run api:check',
    'pnpm run pack:check',
    'pnpm run build:prod',
    'pnpm run e2e',
    'pnpm run validate:consumer',
    'pnpm run validate:consumer:runtime',
    'pnpm run format:check',
  ];
  for (const command of required) {
    it(`runs ${command} before publishing`, () => {
      assert.ok(gateText.includes(command), `${command} missing from the gate jobs`);
    });
  }

  it('only references pnpm scripts that exist', () => {
    for (const m of gateText.matchAll(/pnpm run ([\w:-]+)/g)) {
      assert.ok(m[1] in scripts, `package.json has no script "${m[1]}"`);
    }
  });

  it('keeps the release tests in the CI test:scripts run', () => {
    assert.match(scripts['test:scripts'], /scripts\/release\/\*\.test\.mjs/);
  });
});

describe('legacy release path', () => {
  it('the version-bump-and-tag script and local publish script are gone', () => {
    assert.ok(!existsSync(join(ROOT, 'scripts/release.mjs')));
    const scripts = json('package.json').scripts;
    assert.equal(scripts.release, undefined);
    assert.equal(scripts['lib:publish'], undefined);
  });

  it('no maintained doc recommends manual bumps or tag pushes for the library', () => {
    const docs = [
      'README.md',
      'CONTRIBUTING.md',
      'AGENTS.md',
      'CLAUDE.md',
      'RELEASE_CHECKLIST.md',
      '.claude/skills/release/SKILL.md',
      'docs/RELEASING.md',
    ];
    for (const doc of docs) {
      if (!existsSync(join(ROOT, doc))) continue;
      assert.doesNotMatch(
        read(doc),
        /pnpm release (minor|patch|major)|git tag v\d|lib:publish/,
        doc,
      );
    }
  });
});

describe('MCP package stays independent', () => {
  it('has its own tag prefix, verify-then-publish split and no release-please coupling', () => {
    assert.deepEqual(mcp.on.push.tags, ['mcp-v*.*.*']);
    assert.deepEqual(mcp.jobs.publish.needs, ['verify']);
    assert.equal(mcp.jobs.verify.permissions['id-token'], undefined);
    assert.ok(!JSON.stringify(mcp).includes('release-please-action'));
  });

  it('refuses tags that are not on main and checks the tag against its own package.json', () => {
    const text = JSON.stringify(mcp.jobs.verify);
    assert.match(text, /merge-base --is-ancestor/);
    assert.match(text, /projects\/movement-mcp\/package\.json/);
  });

  it('never falls back from OIDC to the token', () => {
    const steps = mcp.jobs.publish.steps;
    const oidc = steps.find((s) => s.name.includes('OIDC'));
    const legacy = steps.find((s) => s.name.includes('NPM_TOKEN'));
    assert.match(oidc.if, /== 'oidc'/);
    assert.match(legacy.if, /!= 'oidc'/);
    assert.doesNotMatch(JSON.stringify(oidc), /NPM_TOKEN|NODE_AUTH_TOKEN/);
  });

  it('library releases do not touch the MCP version', () => {
    assert.equal(json('projects/movement-mcp/package.json').name, 'angular-movement-mcp');
    assert.doesNotMatch(read('.github/workflows/release.yml'), /movement-mcp/);
  });
});
