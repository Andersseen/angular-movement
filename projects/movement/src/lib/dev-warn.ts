import { effect, Injector } from '@angular/core';

/**
 * Centralized development warning helper.
 * All library warnings should go through here so they:
 * - only fire in development builds (guarded by `ngDevMode`),
 * - use a consistent `[Movement]` namespace,
 * - and are easy to disable or redirect in tests.
 */
export function movementWarn(message: string): void {
  if (isDevMode()) {
    console.warn(`[Movement] ${message}`);
  }
}

function isDevMode(): boolean {
  return typeof ngDevMode !== 'undefined' && !!ngDevMode;
}

/** Compares input values by content, so a template object literal rebuilt each pass is not a change. */
function sameValue(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

/**
 * Dev-mode warning for one-shot directives: warns once when `read()` returns a different value after
 * the directive has already used it (`consumed()`), because that change will not replay anything.
 *
 * The effect belongs to `injector` (the directive's), so it is destroyed with the directive. A no-op
 * in production builds, where no effect is created.
 */
export function warnOnChangeAfterPlay(
  injector: Injector,
  selector: string,
  read: () => unknown,
  consumed: () => boolean,
): void {
  if (!isDevMode()) return;

  let previous: { value: unknown } | null = null;
  let warned = false;

  effect(
    () => {
      const value = read();

      if (!warned && previous && consumed() && !sameValue(previous.value, value)) {
        warned = true;
        movementWarn(
          `[${selector}] changed after the animation played. ${selector} is one-shot: it plays once, ` +
            'when the element is created, and ignores later changes. To animate on a change use ' +
            '[moveAnimation], [moveVariants] or MoveAnimator; to replay, recreate the element.',
        );
      }

      previous = { value };
    },
    { injector },
  );
}
