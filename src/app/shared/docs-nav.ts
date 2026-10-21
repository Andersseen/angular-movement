/** Single source of truth for docs navigation: sidebar, quick-find and previous/next links. */
export interface DocsNavItem {
  readonly path: string;
  readonly title: string;
  /** Extra words the quick-find matches against. */
  readonly keywords?: string;
}

export interface DocsNavGroup {
  readonly label: string;
  readonly items: readonly DocsNavItem[];
}

export const DOCS_NAV: readonly DocsNavGroup[] = [
  {
    label: 'Start here',
    items: [
      { path: '/docs/introduction', title: 'Introduction', keywords: 'why overview install' },
      {
        path: '/docs/get-started',
        title: 'Get started',
        keywords: 'install first animation setup',
      },
      {
        path: '/docs/choose-a-tool',
        title: 'Choose the right tool',
        keywords: 'css animate.enter animate.leave waapi compare native',
      },
    ],
  },
  {
    label: 'Learn',
    items: [
      {
        path: '/docs/patterns',
        title: 'Angular patterns',
        keywords: 'recipes timing reduced motion ssr cancellation',
      },
      {
        path: '/docs/api',
        title: 'API guide',
        keywords: 'enter leave hover tap variants stagger presence scroll svg',
      },
      {
        path: '/docs/api-selection',
        title: 'Choose an API',
        keywords:
          'moveAnimate moveAnimation moveVariants moveTarget MoveAnimator one-shot reactive overlap',
      },
    ],
  },
  {
    label: 'Reference',
    items: [
      { path: '/docs/reference', title: 'API reference', keywords: 'inputs selectors directives' },
      { path: '/docs/presets', title: 'Presets', keywords: 'fade slide zoom flip bounce' },
    ],
  },
  {
    label: 'Adopt',
    items: [
      {
        path: '/docs/migration',
        title: 'Migrate from @angular/animations',
        keywords: 'legacy trigger transition assessment recipes animate.enter animate.leave',
      },
      {
        path: '/docs/accessibility',
        title: 'Accessibility & troubleshooting',
        keywords: 'reduced motion keyboard focus ssr hydration warnings debug',
      },
    ],
  },
  {
    label: 'AI tooling',
    items: [{ path: '/docs/mcp', title: 'AI agent setup', keywords: 'mcp claude skill' }],
  },
];

export const DOCS_FLAT: readonly DocsNavItem[] = DOCS_NAV.flatMap((group) => group.items);

export function docsNeighbours(url: string): {
  prev: DocsNavItem | undefined;
  next: DocsNavItem | undefined;
} {
  const path = url.split(/[?#]/)[0].replace(/\/$/, '');
  const index = DOCS_FLAT.findIndex((item) => item.path === path);
  if (index < 0) return { prev: undefined, next: undefined };
  return { prev: DOCS_FLAT[index - 1], next: DOCS_FLAT[index + 1] };
}

export function searchDocs(query: string): readonly DocsNavItem[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return DOCS_FLAT;
  return DOCS_FLAT.filter((item) => {
    const haystack = `${item.title} ${item.keywords ?? ''}`.toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
}
