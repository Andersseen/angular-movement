/**
 * Centralized development warning helper.
 * All library warnings should go through here so they:
 * - only fire in development builds (guarded by `ngDevMode`),
 * - use a consistent `[Movement]` namespace,
 * - and are easy to disable or redirect in tests.
 */
export function movementWarn(message: string): void {
  if (typeof ngDevMode !== 'undefined' && ngDevMode) {
    console.warn(`[Movement] ${message}`);
  }
}
