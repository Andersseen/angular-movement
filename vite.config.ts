/// <reference types="vitest" />

import { defineConfig } from 'vite';
import analog from '@analogjs/platform';
import { readFileSync } from 'node:fs';
import { resolve } from 'path';

// Single source of truth for the version the site advertises. Hardcoding it in a component means
// the site keeps announcing an old release after every publish.
const libraryVersion = JSON.parse(
  readFileSync(resolve(__dirname, 'projects/movement/package.json'), 'utf8'),
).version as string;

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  build: {
    target: ['es2020'],
  },
  resolve: {
    mainFields: ['module'],
    alias: {
      movement: resolve(__dirname, 'projects/movement/src/public-api.ts'),
    },
  },
  plugins: [
    analog({
      content: {
        prismOptions: {
          additionalLangs: ['bash', 'typescript', 'html', 'css', 'json'],
        },
      },
      ssr: true,
      nitro: {
        routeRules: {
          '/api/**': {
            cors: true,
          },
        },
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
    include: ['**/*.spec.ts'],
    reporters: ['default'],
  },
  define: {
    'import.meta.vitest': mode !== 'production',
    __MOVEMENT_VERSION__: JSON.stringify(libraryVersion),
  },
}));
