import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  moveTimeToMs,
  normalizeTime,
  optionalTimeAttribute,
  resetTimeWarningsForTesting,
  resolveTime,
  timeAttribute,
} from './move-time';

describe('MoveTime', () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    resetTimeWarningsForTesting();
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => warn.mockRestore());

  describe('moveTimeToMs', () => {
    it('treats numbers as milliseconds, forever', () => {
      expect(moveTimeToMs(80)).toBe(80);
      expect(moveTimeToMs(0)).toBe(0);
      expect(moveTimeToMs(0.08)).toBe(0.08);
    });

    it('parses explicit ms and s units', () => {
      expect(moveTimeToMs('80ms')).toBe(80);
      expect(moveTimeToMs('0.08s')).toBe(80);
      expect(moveTimeToMs('1.5s')).toBe(1500);
      expect(moveTimeToMs('.5s')).toBe(500);
    });

    it('converts seconds without floating-point residue', () => {
      // 0.07 * 1000 === 70.00000000000001 in plain JS.
      expect(moveTimeToMs('0.07s')).toBe(70);
      expect(moveTimeToMs('0.09s')).toBe(90);
      expect(moveTimeToMs('0.035s')).toBe(35);
    });

    it('returns NaN and warns for a value that is not a time', () => {
      expect(moveTimeToMs('fast' as never)).toBeNaN();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('"fast" is not a valid time'));
    });
  });

  describe('normalizeTime', () => {
    it('keeps a bare numeric string as milliseconds (static attributes, pre-1.2 behavior)', () => {
      expect(normalizeTime('moveDuration', '300')).toBe(300);
    });

    it('tolerates surrounding whitespace and upper-case units', () => {
      expect(normalizeTime('moveDuration', ' 300ms ')).toBe(300);
      expect(normalizeTime('moveDuration', '0.3S')).toBe(300);
    });

    it('allows negative values through for the caller to clamp, as before', () => {
      expect(normalizeTime('moveDelay', -50)).toBe(-50);
      expect(normalizeTime('moveDelay', '-0.05s')).toBe(-50);
    });

    it('returns undefined for "not set" so the caller falls back to its default', () => {
      expect(normalizeTime('moveDuration', undefined)).toBeUndefined();
      expect(normalizeTime('moveDuration', null)).toBeUndefined();
      expect(normalizeTime('moveDuration', '')).toBeUndefined();
      expect(warn).not.toHaveBeenCalled();
    });

    it('falls back instead of producing NaN for an unparseable string', () => {
      expect(normalizeTime('moveDuration', '300px')).toBeUndefined();
      expect(normalizeTime('moveDuration', 'abc')).toBeUndefined();
      expect(warn).toHaveBeenCalledTimes(2);
      expect(warn.mock.calls[0][0]).toContain('moveDuration received "300px", which is not a time');
    });

    it('warns once for a fractional number that looks like seconds', () => {
      expect(normalizeTime('moveStaggerStep', 0.08)).toBe(0.08);
      expect(normalizeTime('moveStaggerStep', 0.08)).toBe(0.08);

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toBe(
        '[Movement] moveStaggerStep received 0.08. Numeric timing values are milliseconds. ' +
          'Did you mean "80ms" or "0.08s"?',
      );
    });

    it('warns separately per input and per value', () => {
      normalizeTime('moveStaggerStep', 0.08);
      normalizeTime('moveStaggerStep', 0.09);
      normalizeTime('moveTextStagger', 0.08);
      expect(warn).toHaveBeenCalledTimes(3);
    });

    it('also warns for a bare fractional attribute string', () => {
      normalizeTime('moveDuration', '0.3');
      expect(warn).toHaveBeenCalledTimes(1);
    });

    it('never warns for zero, whole milliseconds, or an explicit unit', () => {
      normalizeTime('moveStaggerStep', 0);
      normalizeTime('moveStaggerStep', 1);
      normalizeTime('moveStaggerStep', 80);
      normalizeTime('moveStaggerStep', 12.5);
      normalizeTime('moveStaggerStep', '0.5ms');
      normalizeTime('moveStaggerStep', '0.08s');
      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('resolveTime', () => {
    it('is idempotent on numbers and resolves strings', () => {
      expect(resolveTime(undefined)).toBeUndefined();
      expect(resolveTime(120)).toBe(120);
      expect(resolveTime('120ms')).toBe(120);
      expect(resolveTime('0.12s')).toBe(120);
    });
  });

  describe('attribute transforms', () => {
    it('optionalTimeAttribute normalizes MoveTime values', () => {
      const transform = optionalTimeAttribute('moveDelay');
      expect(transform('80ms')).toBe(80);
      expect(transform('0.08s')).toBe(80);
      expect(transform(80)).toBe(80);
      expect(transform(undefined)).toBeUndefined();
    });

    it('timeAttribute falls back to its default when unset or invalid', () => {
      const transform = timeAttribute('moveLoopDelay', 0);
      expect(transform('150ms')).toBe(150);
      expect(transform(undefined)).toBe(0);
      expect(transform('soon')).toBe(0);
    });
  });
});
