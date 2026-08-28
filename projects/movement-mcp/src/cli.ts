#!/usr/bin/env node
import { runInit } from './init.js';
import { startServer } from './index.js';

const command = process.argv[2];

if (command === 'init') {
  const result = runInit(process.cwd());
  console.log(
    `${result.mcpAdded ? 'Added' : 'Kept existing'} "movement" entry in ${result.mcpConfigPath}`,
  );
  console.log(`Copied skill to ${result.skillCopiedTo}`);
} else {
  startServer().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
