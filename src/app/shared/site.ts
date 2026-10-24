/**
 * Site-wide constants shared by the shell, SEO and links. One place, so a future localized site (or a
 * domain change) edits a single file and no component hard-codes an origin or a repository URL.
 */
export const SITE = {
  name: 'Angular Movement',
  origin: 'https://angular-movement.andersseen.dev',
  github: 'https://github.com/Andersseen/angular-movement',
  npm: 'https://www.npmjs.com/package/angular-movement',
  /** What the page says when a route does not provide a description of its own. */
  defaultDescription:
    'Motion for Angular that follows your state: declarative directives on the Web Animations API, with presence, variants, scroll and signals.',
  ogImage: '/og-image.png',
} as const;
