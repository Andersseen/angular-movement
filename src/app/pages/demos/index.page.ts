import type { RouteMeta } from '@analogjs/router';

export { default } from './enter.page';

// The lab opens on the enter demo, but `/demos` is the entry point a search result links to.
export const routeMeta: RouteMeta = {
  title: 'Interactive demos: the Angular Movement motion lab',
  meta: [
    {
      name: 'description',
      content:
        'Twenty-three interactive Angular animation playgrounds: enter, presence, variants, hover, scroll, drag and more. Tune each one and copy valid code.',
    },
  ],
};
