import { movementWarn } from './dev-warn';

/**
 * A duration or delay.
 *
 * - A **number is always milliseconds** — `80` is 80ms. This never changes.
 * - A string states its unit: `'80ms'`, `'0.08s'`.
 *
 * Every public timing option accepts it, and it is normalized to milliseconds before any
 * animation math runs. In templates, a static attribute reads naturally with a unit
 * (`moveStaggerStep="80ms"`); a bound expression is a number of milliseconds
 * (`[moveStaggerStep]="80"`).
 *
 * Stable API — covered by semantic-versioning guarantees.
 *
 * @stability stable
 */
export type MoveTime = number | `${number}ms` | `${number}s`;

const TIME_PATTERN = /^\s*([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)\s*(ms|s)?\s*$/i;

/** Seconds → ms without `0.07 * 1000 === 70.00000000000001` leaking into keyframe timing. */
const toMilliseconds = (seconds: number): number => Math.round(seconds * 1e12) / 1e9;

interface ParsedTime {
  ms: number;
  /** False for numbers and bare numeric strings, whose unit is implied (always ms). */
  explicitUnit: boolean;
}

function parse(value: unknown): ParsedTime | undefined {
  // Numbers pass through untouched — this is the pre-1.2 contract, including NaN/Infinity.
  if (typeof value === 'number') return { ms: value, explicitUnit: false };
  if (typeof value !== 'string') return undefined;

  const match = TIME_PATTERN.exec(value);
  if (!match) return undefined;

  const amount = Number(match[1]);
  const unit = match[2]?.toLowerCase();
  return {
    ms: unit === 's' ? toMilliseconds(amount) : amount,
    explicitUnit: unit !== undefined,
  };
}

/**
 * Converts a {@link MoveTime} to milliseconds: `moveTimeToMs('0.08s') === 80`,
 * `moveTimeToMs(80) === 80`. Returns `NaN` (and warns in dev mode) for a string that is not a time,
 * which is only reachable by bypassing the type.
 *
 * Useful when application code needs the resolved number — for example to schedule work after an
 * animation whose duration came from configuration.
 *
 * Stable API — covered by semantic-versioning guarantees.
 *
 * @stability stable
 */
export function moveTimeToMs(value: MoveTime): number {
  const parsed = parse(value);
  if (!parsed) {
    movementWarn(
      `"${String(value)}" is not a valid time. Use milliseconds (300), "300ms" or "0.3s".`,
    );
    return NaN;
  }
  return parsed.ms;
}

/**
 * Internal: resolves an optional {@link MoveTime} read from a typed option object. Idempotent on
 * numbers, so it is safe on values that were already normalized upstream.
 */
export function resolveTime(value: MoveTime | undefined): number | undefined {
  if (value === undefined) return undefined;
  return parse(value)?.ms;
}

const warnedFractional = new Set<string>();

function warnIfFractional(source: string, raw: unknown, parsed: ParsedTime): void {
  if (parsed.explicitUnit || !(parsed.ms > 0 && parsed.ms < 1)) return;

  const key = `${source}:${String(raw)}`;
  if (warnedFractional.has(key)) return;
  warnedFractional.add(key);

  movementWarn(
    `${source} received ${String(raw)}. Numeric timing values are milliseconds. ` +
      `Did you mean "${toMilliseconds(parsed.ms)}ms" or "${parsed.ms}s"?`,
  );
}

/** Test-only: the fractional-value warning is deduplicated for the lifetime of the module. */
export function resetTimeWarningsForTesting(): void {
  warnedFractional.clear();
}

/**
 * Internal: normalizes a time from an untyped source (an input binding, a config object), warning
 * when it is unparseable or looks like seconds written as a number. `undefined` means "not set":
 * the caller falls back to its default.
 */
export function normalizeTime(source: string, value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;

  const parsed = parse(value);
  if (!parsed) {
    movementWarn(
      `${source} received "${String(value)}", which is not a time. ` +
        'Use milliseconds (300), "300ms" or "0.3s". Falling back to the default.',
    );
    return undefined;
  }

  warnIfFractional(source, value, parsed);
  return parsed.ms;
}

/**
 * Input transform for an optional timing input: accepts {@link MoveTime}, a bare numeric attribute
 * string (`moveDuration="300"`, milliseconds), or nothing.
 */
export function optionalTimeAttribute(inputName: string): (value: unknown) => number | undefined {
  return (value) => normalizeTime(inputName, value);
}

/** Input transform for a timing input that always has a value. */
export function timeAttribute(inputName: string, fallback: number): (value: unknown) => number {
  return (value) => normalizeTime(inputName, value) ?? fallback;
}
