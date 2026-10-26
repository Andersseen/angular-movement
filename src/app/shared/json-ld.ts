import { SITE } from './site';

export type JsonLd = Record<string, unknown>;

/** Section roots that get a breadcrumb trail, with the label a search result shows for them. */
const SECTIONS: Record<string, string> = { docs: 'Documentation', demos: 'Demos' };

/** `Presence: animate things leaving · Angular Movement` → `Presence: animate things leaving`. */
export function pageName(title: string): string {
  return title.replace(/\s*[·—|-]\s*Angular Movement\s*$/, '').trim() || SITE.name;
}

/**
 * The structured data for a canonical path: the site and the library itself on the home page, a
 * breadcrumb trail on pages inside a section, nothing elsewhere. Only facts the site already states
 * are described — no ratings, prices or dates nothing in the repository records.
 */
export function jsonLdFor(path: string, title: string, description: string): JsonLd[] {
  const url = (route: string) => `${SITE.origin}${route}`;

  if (path === '/') {
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE.name,
        url: url('/'),
        description,
        inLanguage: 'en',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'SoftwareSourceCode',
        name: SITE.name,
        description,
        url: url('/'),
        codeRepository: SITE.github,
        programmingLanguage: 'TypeScript',
        runtimePlatform: 'Angular',
        license: 'https://opensource.org/licenses/MIT',
        author: { '@type': 'Person', ...SITE.author },
        sameAs: [SITE.github, SITE.npm],
      },
    ];
  }

  const [section] = path.split('/').filter(Boolean);
  const sectionName = SECTIONS[section];
  if (!sectionName) return [];

  const items = [
    { name: SITE.name, item: url('/') },
    { name: sectionName, item: url(`/${section}`) },
  ];
  if (path !== `/${section}`) items.push({ name: pageName(title), item: url(path) });

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((entry, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        ...entry,
      })),
    },
  ];
}

/** JSON for a `<script type="application/ld+json">`: `<` is escaped so content cannot close the tag. */
export function serializeJsonLd(data: JsonLd[]): string {
  return JSON.stringify(data.length === 1 ? data[0] : data).replace(/</g, '\\u003c');
}
