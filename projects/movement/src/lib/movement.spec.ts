import { TestBed } from '@angular/core/testing';
import { MOVE_PRESETS } from './presets/presets';
import { provideMovement } from './providers/provide-movement';
import { MOVEMENT_CONFIG, MOVEMENT_DEFAULTS } from './tokens/movement.tokens';

describe('movement library', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
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
    });
  });

  it('defines every documented preset key', () => {
    expect(Object.keys(MOVE_PRESETS).sort()).toEqual([
      'bounce-in',
      'fade-down',
      'fade-left',
      'fade-right',
      'fade-up',
      'flip-x',
      'flip-y',
      'none',
      'slide-down',
      'slide-left',
      'slide-right',
      'slide-up',
      'zoom-in',
      'zoom-out',
    ]);
  });
});
