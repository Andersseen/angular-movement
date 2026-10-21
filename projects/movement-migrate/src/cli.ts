#!/usr/bin/env node
import { existsSync, statSync } from 'node:fs';
import { assessProject } from './assess.js';
import { formatText } from './format.js';

const args = process.argv.slice(2);
const json = args.includes('--json');
const positional = args.filter((a) => !a.startsWith('--'));

if (args.includes('--help') || positional.length !== 1) {
  process.stderr.write(
    'Usage: movement-migrate <directory> [--json]\n\n' +
      'Read-only assessment of legacy @angular/animations usage. Writes nothing.\n',
  );
  process.exit(args.includes('--help') ? 0 : 2);
}

const dir = positional[0];
if (!existsSync(dir) || !statSync(dir).isDirectory()) {
  process.stderr.write(`Not a directory: ${dir}\n`);
  process.exit(2);
}

const report = assessProject(dir);
process.stdout.write((json ? JSON.stringify(report, null, 2) : formatText(report)) + '\n');
