import { defineEventHandler } from 'h3';
import {
  MOVE_PRESETS,
  PRESET_DESCRIPTIONS,
  type MovePreset,
  type PresetKeyframes,
} from '../../utils/presets';

interface PresetInfo {
  name: MovePreset;
  description: string;
  enter: PresetKeyframes;
  leave: PresetKeyframes;
}

export default defineEventHandler(() => {
  const presets: PresetInfo[] = Object.entries(MOVE_PRESETS).map(([name, definition]) => ({
    name: name as MovePreset,
    description: PRESET_DESCRIPTIONS[name as MovePreset],
    enter: definition.enter,
    leave: definition.leave,
  }));

  return {
    presets,
    count: presets.length,
  };
});
