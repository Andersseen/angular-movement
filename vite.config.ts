/// <reference types="vitest" />

import { defineConfig } from 'vite';
import analog from '@analogjs/platform';
import { resolve } from 'path';

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
  },
}));
