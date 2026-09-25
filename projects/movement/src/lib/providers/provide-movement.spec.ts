import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { provideMovement } from './provide-movement';
import { MOVEMENT_CONFIG, MOVEMENT_DEFAULTS } from '../tokens/movement.tokens';
import { resetTimeWarningsForTesting } from '../move-time';

function configFor(input: Parameters<typeof provideMovement>[0]) {
  TestBed.configureTestingModule({ providers: [provideMovement(input)] });
  return TestBed.inject(MOVEMENT_CONFIG);
}

describe('provideMovement', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  it('falls back to MOVEMENT_DEFAULTS for everything not provided', () => {
    expect(configFor({})).toEqual(MOVEMENT_DEFAULTS);
  });

  it('accepts no argument at all', () => {
    expect(configFor(undefined)).toEqual(MOVEMENT_DEFAULTS);
  });

  it('keeps numeric milliseconds exactly as before', () => {
    const config = configFor({ duration: 320, delay: 40, easing: 'linear', disabled: true });
    expect(config).toEqual({
      ...MOVEMENT_DEFAULTS,
      duration: 320,
      delay: 40,
      easing: 'linear',
      disabled: true,
    });
  });

  it('normalizes MoveTime strings so the injected config stays numeric', () => {
    const config = configFor({ duration: '320ms', delay: '0.05s' });
    expect(config.duration).toBe(320);
    expect(config.delay).toBe(50);
  });

  it('treats an explicit undefined as "not provided" rather than injecting undefined', () => {
    expect(configFor({ duration: undefined }).duration).toBe(MOVEMENT_DEFAULTS.duration);
  });

  it('warns and keeps the default for an unparseable duration', () => {
    resetTimeWarningsForTesting();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(configFor({ duration: 'slow' as never }).duration).toBe(MOVEMENT_DEFAULTS.duration);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('provideMovement duration'));
  });
});
