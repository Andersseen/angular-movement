#!/usr/bin/env node
/**
 * Entry point used by .github/workflows/release.yml. One subcommand per pipeline step; all
 * decisions live in the sibling modules so they can be tested without GitHub or npm.
 *
 *   node scripts/release/cli.mjs <command> [--flag value]...
 *
 * Commands: fold-changelog | resolve | pack | verify-dist | publish | finalize | report
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { packArtifact, verifyArtifact } from './artifact.mjs';
import { extractNotes, foldIntoChangelog } from './changelog.mjs';
import { finalizeGithubRelease, composeNotes } from './github-release.mjs';
import { verifyPublished } from './npm-registry.mjs';
import { publishArtifact } from './publish.mjs';
import { ReleaseError, STAGES, renderReport } from './stages.mjs';
import { validateTarget } from './target.mjs';
import { versionFromTag } from './semver.mjs';

const [command, ...rest] = process.argv.slice(2);
const flags = {};
for (let i = 0; i < rest.length; i += 2) flags[rest[i].replace(/^--/, '')] = rest[i + 1];

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const output = (key, value) => {
  console.log(`${key}=${value}`);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
};
const summary = (markdown) => {
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`);
};

async function main() {
  switch (command) {
    case 'fold-changelog': {
      const repo = resolve(flags.repo ?? '.');
      const manifest = JSON.parse(readFileSync(`${repo}/.release-please-manifest.json`, 'utf8'));
      const version = manifest['projects/movement'];
      const notes = extractNotes(readFileSync(flags['pr-body-file'], 'utf8'));
      const file = `${repo}/CHANGELOG.md`;
      const { content, changed } = foldIntoChangelog(readFileSync(file, 'utf8'), version, notes);
      if (changed) writeFileSync(file, content);
      output('changed', String(changed));
      output('version', version);
      return;
    }
    case 'resolve': {
      const tag = flags.tag;
      const tagSha = (() => {
        try {
          return git('rev-parse', '--verify', `refs/tags/${tag}^{commit}`);
        } catch {
          return null;
        }
      })();
      const onMain =
        tagSha !== null &&
        spawnSync('git', ['merge-base', '--is-ancestor', tagSha, 'origin/main']).status === 0;
      const show = (path) => (tagSha ? git('show', `${tagSha}:${path}`) : '');
      const target = validateTarget({
        tag,
        expectedSha: flags.sha || undefined,
        tagSha,
        onMain,
        packageVersion: tagSha ? JSON.parse(show('projects/movement/package.json')).version : '',
        manifestVersion: tagSha
          ? JSON.parse(show('.release-please-manifest.json'))['projects/movement']
          : '',
        commitSubject: tagSha ? git('log', '-1', '--format=%s', tagSha) : '',
        changelog: show('CHANGELOG.md'),
      });
      for (const [k, v] of Object.entries(target)) output(k, v);
      return;
    }
    case 'pack': {
      const version = versionFromTag(flags.tag);
      const manifest = packArtifact({
        distDir: resolve(flags.dist),
        outDir: resolve(flags.out),
        tag: flags.tag,
        sha: flags.sha,
        version,
      });
      console.log(JSON.stringify(manifest, null, 2));
      return;
    }
    case 'verify-dist': {
      // The consumer jobs install the `dist/movement` they downloaded; prove it repacks to the
      // exact tarball that was recorded, so "validated" and "published" are the same bytes.
      const { manifest } = verifyArtifact({
        dir: resolve(flags.dir),
        version: versionFromTag(flags.tag),
        sha: flags.sha,
      });
      const tmp = execFileSync('mktemp', ['-d'], { encoding: 'utf8' }).trim();
      const repacked = packArtifact({
        distDir: resolve(flags.dist),
        outDir: tmp,
        tag: flags.tag,
        sha: flags.sha,
        version: manifest.version,
      });
      if (repacked.sha256 !== manifest.sha256) {
        throw new ReleaseError(
          'validation',
          `dist/movement repacks to ${repacked.sha256}, not ${manifest.sha256}.`,
        );
      }
      console.log(`dist/movement matches the release artifact (${manifest.sha256}).`);
      return;
    }
    case 'publish': {
      const version = versionFromTag(flags.tag);
      try {
        const result = await publishArtifact(
          { dir: resolve(flags.dir), version, sha: flags.sha, env: process.env },
          {
            run: (tarball) => {
              const res = spawnSync(
                'npm',
                ['publish', tarball, '--access', 'public', '--provenance'],
                { encoding: 'utf8' },
              );
              const text = `${res.stdout ?? ''}${res.stderr ?? ''}`;
              process.stdout.write(text);
              return { code: res.status ?? 1, output: text };
            },
          },
        );
        output('status', result.status);
        summary(`**npm:** ${result.message}`);
      } catch (error) {
        output('status', error.stage === 'auth' ? 'auth-blocked' : 'failed');
        throw error;
      }
      return;
    }
    case 'finalize': {
      const version = versionFromTag(flags.tag);
      const report = await verifyPublished({
        name: 'angular-movement',
        version,
        requireProvenance: flags['require-provenance'] === 'true',
      });
      console.log(
        `npm serves ${report.name}@${report.version} (latest, provenance: ${report.provenance ? 'verified' : 'not present'}).`,
      );
      const changelog = git('show', `${flags.sha}:CHANGELOG.md`);
      const notes = composeNotes({ version, tag: flags.tag, changelog });
      const notesFile = resolve('release-notes.md');
      writeFileSync(notesFile, notes);
      const gh = (...args) => execFileSync('gh', args, { encoding: 'utf8' });
      const view = (tag) => {
        try {
          return JSON.parse(
            gh('release', 'view', tag, '--json', 'isDraft,isPrerelease,tagName,url'),
          );
        } catch {
          return null;
        }
      };
      const result = finalizeGithubRelease(
        {
          tag: flags.tag,
          version,
          tagSha: git('rev-parse', `refs/tags/${flags.tag}^{commit}`),
          expectedSha: flags.sha,
          notes,
        },
        {
          view,
          create: ({ tag }) =>
            gh(
              'release',
              'create',
              tag,
              '--draft',
              '--verify-tag',
              '--title',
              tag,
              '--notes-file',
              notesFile,
            ),
          publish: ({ tag }) =>
            gh(
              'release',
              'edit',
              tag,
              '--title',
              tag,
              '--notes-file',
              notesFile,
              '--draft=false',
              '--prerelease=false',
              '--latest',
            ),
        },
      );
      summary(`${STAGES.complete}: [${result.tag}](${result.url}) is on npm and GitHub.`);
      return;
    }
    case 'report': {
      const needs = JSON.parse(process.env.NEEDS_JSON ?? '{}');
      const { markdown } = renderReport(needs);
      summary(markdown);
      console.log(markdown);
      return;
    }
    default:
      throw new Error(`Unknown command "${command}".`);
  }
}

main().catch((error) => {
  const stage = error instanceof ReleaseError ? STAGES[error.stage] : 'Unexpected error';
  console.error(`::error title=${stage}::${error.message.split('\n')[0]}`);
  console.error(error.message);
  summary(`### ${stage}\n\n\`\`\`\n${error.message}\n\`\`\``);
  process.exit(1);
});
