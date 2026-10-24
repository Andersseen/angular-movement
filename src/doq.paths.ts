// Shared by the Angular app (doqRoutes/provideDoq) and vite.config.ts (prerender routes).
// Keep this file free of Angular components: it is imported by Node tooling.
export const doqPaths = {
  contentDirectory: 'docs',
  basePath: '/docs',
} as const;
