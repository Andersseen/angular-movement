/**
 * The published library version, injected by Vite from `projects/movement/package.json`
 * (see `define` in `vite.config.ts`).
 *
 * Import this instead of writing a version literal in a template — a hardcoded one silently goes
 * stale on the next release and the site keeps advertising an old version.
 */
declare const __MOVEMENT_VERSION__: string;

export const MOVEMENT_VERSION: string =
  typeof __MOVEMENT_VERSION__ === 'string' ? __MOVEMENT_VERSION__ : '';

/** Display form used in the navbar and docs, e.g. `v0.6.0`. */
export const MOVEMENT_VERSION_LABEL = MOVEMENT_VERSION ? `v${MOVEMENT_VERSION}` : '';
