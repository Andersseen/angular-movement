import { TestBed } from '@angular/core/testing';
import * as publicApi from './movement';
import {
  MOVEMENT_DIRECTIVES,
  MOVEMENT_EXPERIMENTAL_DIRECTIVES,
  MOVEMENT_STABLE_DIRECTIVES,
} from './movement';
import { MOVE_PRESETS } from './presets/presets';
import { provideMovement } from './providers/provide-movement';
import { MOVEMENT_CONFIG, MOVEMENT_DEFAULTS } from './tokens/movement.tokens';

describe('movement library', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('exposes MoveAnimator as the only imperative entry point', () => {
    expect(publicApi).toHaveProperty('MoveAnimator');

    // The engine stays internal on purpose: 1.0 freezes what is exported here, and keeping the
    // engine out of that contract is what leaves it free to change afterwards.
    expect(publicApi).not.toHaveProperty('AnimationEngine');
  });

  it('keeps internal DI handshakes and engine-internal classes out of the public barrel', () => {
    // MOVE_STAGGER_PARENT / MOVE_PRESENCE_PARENT already live outside the barrel; the variants
    // equivalent is the same kind of parent/child DI token, not a documented extension point.
    expect(publicApi).not.toHaveProperty('MOVE_VARIANTS_PARENT');

    // Every public return path already types itself as `AnimationControls` (which stays exported);
    // the concrete class is an engine-internal detail parallel to `AnimationEngine` itself.
    expect(publicApi).not.toHaveProperty('CompositeAnimationControls');
  });

  it('provides default movement config', () => {
    TestBed.configureTestingModule({
      providers: [provideMovement()],
    });

    expect(TestBed.inject(MOVEMENT_CONFIG)).toEqual(MOVEMENT_DEFAULTS);
  });

  it('overrides movement defaults from provideMovement()', () => {
    TestBed.configureTestingModule({
      providers: [
        provideMovement({
          duration: 450,
          easing: 'ease-out',
          delay: 60,
          disabled: true,
        }),
      ],
    });

    expect(TestBed.inject(MOVEMENT_CONFIG)).toEqual({
      duration: 450,
      easing: 'ease-out',
      delay: 60,
      disabled: true,
      iterations: 1,
    });
  });

  it('composes MOVEMENT_DIRECTIVES from exactly the stable and experimental aggregates', () => {
    // Locks down the split introduced for the post-1.0 stability audit: MOVEMENT_DIRECTIVES must
    // never silently drift from being the union of the two stability-pure aggregates, and the two
    // aggregates must never overlap.
    const stable = new Set<unknown>(MOVEMENT_STABLE_DIRECTIVES);
    const experimental = new Set<unknown>(MOVEMENT_EXPERIMENTAL_DIRECTIVES);

    for (const directive of experimental) {
      expect(stable.has(directive)).toBe(false);
    }

    expect(new Set(MOVEMENT_DIRECTIVES)).toEqual(new Set([...stable, ...experimental]));
    expect(MOVEMENT_DIRECTIVES.length).toBe(
      MOVEMENT_STABLE_DIRECTIVES.length + MOVEMENT_EXPERIMENTAL_DIRECTIVES.length,
    );
  });

  it('defines every documented preset key', () => {
    expect(Object.keys(MOVE_PRESETS).sort()).toEqual([
      'blur-in',
      'bounce-in',
      'fade-down',
      'fade-left',
      'fade-right',
      'fade-up',
      'flip-x',
      'flip-y',
      'heart-beat',
      'icon-bounce',
      'icon-draw',
      'icon-pulse',
      'jello',
      'light-speed',
      'none',
      'pulse',
      'roll-in',
      'rubber-band',
      'shake',
      'slide-down',
      'slide-left',
      'slide-right',
      'slide-up',
      'spin',
      'swing',
      'tada',
      'wobble',
      'zoom-in',
      'zoom-out',
    ]);
  });
});
