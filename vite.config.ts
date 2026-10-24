/// <reference types="vitest" />

import { defineConfig } from 'vite';
import analog from '@analogjs/platform';
import { readFileSync } from 'node:fs';
import { resolve } from 'path';
import { doqDeterministicMarkdown } from '@doqs/analog/vite';
import { doqPrerenderRoutes } from '@doqs/analog/config';
import { doqPaths } from './src/doq.paths';
import { hostPrerenderRoutes } from './src/site-routes';

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
  envPrefix: ['VITE_', 'PUBLIC_'],
  // @analogjs/content imports front-matter (CommonJS). Under pnpm Vite does not pre-bundle it for the dev
  // server, so the Markdown routes fail to load with "does not provide an export named 'default'".
  optimizeDeps: { include: ['@analogjs/content > front-matter'] },
  resolve: {
    mainFields: ['module'],
    alias: {
      movement: resolve(__dirname, 'projects/movement/src/public-api.ts'),
    },
  },
  plugins: [
    analog({
      content: {
        highlighter: 'prism',
        prismOptions: {
          additionalLangs: ['bash', 'typescript', 'html', 'css', 'json'],
        },
      },
      ssr: true,
      // Doqs expands the Markdown tree; the host's own routes are listed so adopting Doqs can never
      // silently drop one from the static output.
      prerender: {
        routes: async () => [...hostPrerenderRoutes(), ...doqPrerenderRoutes(doqPaths)],
      },
      nitro: {
        // `docs/get-started.html`, not `docs/get-started/index.html`: Cloudflare Pages then serves the
        // canonical, slash-less URL directly instead of redirecting it to a trailing slash.
        prerender: { autoSubfolderIndex: false },
        routeRules: {
          '/api/**': {
            cors: true,
          },
        },
      },
    }),
    // Analog renders Markdown concurrently; this keeps duplicate-heading ids stable between builds.
    doqDeterministicMarkdown(),
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
