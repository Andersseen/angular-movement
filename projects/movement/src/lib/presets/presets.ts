import { MovePreset, MovePresetDefinition } from './presets.types';

const DEFAULT_FADE_OPACITY = [0, 1] as const;
const DEFAULT_LEAVE_OPACITY = [1, 0] as const;

export const MOVE_PRESETS: Record<MovePreset, MovePresetDefinition> = {
  'fade-up': {
    enter: { opacity: DEFAULT_FADE_OPACITY, y: [14, 0] },
    leave: { opacity: DEFAULT_LEAVE_OPACITY, y: [0, -10] },
  },
  'fade-down': {
    enter: { opacity: DEFAULT_FADE_OPACITY, y: [-14, 0] },
    leave: { opacity: DEFAULT_LEAVE_OPACITY, y: [0, 10] },
  },
  'fade-left': {
    enter: { opacity: DEFAULT_FADE_OPACITY, x: [14, 0] },
    leave: { opacity: DEFAULT_LEAVE_OPACITY, x: [0, -10] },
  },
  'fade-right': {
    enter: { opacity: DEFAULT_FADE_OPACITY, x: [-14, 0] },
    leave: { opacity: DEFAULT_LEAVE_OPACITY, x: [0, 10] },
  },
  'slide-up': {
    enter: { y: [20, 0], opacity: [0.98, 1] },
    leave: { y: [0, -18], opacity: [1, 0.98] },
  },
  'slide-down': {
    enter: { y: [-20, 0], opacity: [0.98, 1] },
    leave: { y: [0, 18], opacity: [1, 0.98] },
  },
  'slide-left': {
    enter: { x: [20, 0], opacity: [0.98, 1] },
    leave: { x: [0, -18], opacity: [1, 0.98] },
  },
  'slide-right': {
    enter: { x: [-20, 0], opacity: [0.98, 1] },
    leave: { x: [0, 18], opacity: [1, 0.98] },
  },
  'zoom-in': {
    enter: { opacity: DEFAULT_FADE_OPACITY, scale: [0.92, 1] },
    leave: { opacity: DEFAULT_LEAVE_OPACITY, scale: [1, 0.92] },
  },
  'zoom-out': {
    enter: { opacity: DEFAULT_FADE_OPACITY, scale: [1.06, 1] },
    leave: { opacity: DEFAULT_LEAVE_OPACITY, scale: [1, 1.06] },
  },
  'flip-x': {
    enter: { opacity: DEFAULT_FADE_OPACITY, rotateX: [-20, 0] },
    leave: { opacity: DEFAULT_LEAVE_OPACITY, rotateX: [0, 16] },
  },
  'flip-y': {
    enter: { opacity: DEFAULT_FADE_OPACITY, rotateY: [-20, 0] },
    leave: { opacity: DEFAULT_LEAVE_OPACITY, rotateY: [0, 16] },
  },
  'bounce-in': {
    enter: { opacity: DEFAULT_FADE_OPACITY, y: [12, 0], scale: [0.95, 1] },
    leave: { opacity: DEFAULT_LEAVE_OPACITY, y: [0, -8], scale: [1, 0.97] },
  },
  none: {
    enter: { opacity: [1, 1] },
    leave: { opacity: [1, 1] },
  },
};
