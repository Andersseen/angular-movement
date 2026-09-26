import { MOVE_PRESETS } from './presets';
import { MovePreset } from './presets.types';
import { composeFinalStyle, composeInitialStyle } from '../engines/keyframe-composer';
import { resolveMoveFrames, reverseFrames } from '../directives/move-animation.utils';

describe('MOVE_PRESETS', () => {
  it('defines enter and leave for every preset name', () => {
    for (const [name, definition] of Object.entries(MOVE_PRESETS)) {
      expect(definition.enter, name).toBeDefined();
      expect(definition.leave, name).toBeDefined();
    }
  });

  describe('interaction presets', () => {
    it('lift is a subtle 4px rise on translate only', () => {
      expect(MOVE_PRESETS.lift.enter).toEqual({ y: [0, -4] });
    });

    it('press is a subtle scale-down on scale only', () => {
      expect(MOVE_PRESETS.press.enter).toEqual({ scale: [1, 0.97] });
    });

    it.each<MovePreset>(['lift', 'press'])('%s reverses exactly back to its start', (name) => {
      const enter = resolveMoveFrames(name, 'enter');
      const reversed = reverseFrames(enter);

      // What moveWhileHover/moveWhileTap play on leave/release must land on the resting state.
      expect(composeFinalStyle(reversed)).toEqual(composeInitialStyle(enter));
      expect(MOVE_PRESETS[name].leave).toEqual(reversed);
    });

    it('lift and press write disjoint style channels, so they compose on one element', () => {
      const lift = composeFinalStyle(MOVE_PRESETS.lift.enter);
      const press = composeFinalStyle(MOVE_PRESETS.press.enter);

      const liftChannels = Object.keys(lift);
      const pressChannels = Object.keys(press);

      expect(liftChannels).toEqual(['translate']);
      expect(pressChannels).toEqual(['scale']);
      expect(liftChannels.filter((channel) => pressChannels.includes(channel))).toEqual([]);
    });
  });
});
