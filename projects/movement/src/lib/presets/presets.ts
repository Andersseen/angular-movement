import { MovePreset, MovePresetDefinition } from './presets.types';

const DEFAULT_FADE_OPACITY = [0, 1] as const;
const DEFAULT_LEAVE_OPACITY = [1, 0] as const;

export const MOVE_PRESETS: Record<MovePreset, MovePresetDefinition> = {
  'fade-up': {
    enter: { opacity: DEFAULT_FADE_OPACITY, y: [24, 0] },
    leave: { opacity: DEFAULT_LEAVE_OPACITY, y: [0, -16] },
  },
  'fade-down': {
    enter: { opacity: DEFAULT_FADE_OPACITY, y: [-24, 0] },
    leave: { opacity: DEFAULT_LEAVE_OPACITY, y: [0, 16] },
  },
  'fade-left': {
    enter: { opacity: DEFAULT_FADE_OPACITY, x: [24, 0] },
    leave: { opacity: DEFAULT_LEAVE_OPACITY, x: [0, -16] },
  },
  'fade-right': {
    enter: { opacity: DEFAULT_FADE_OPACITY, x: [-24, 0] },
    leave: { opacity: DEFAULT_LEAVE_OPACITY, x: [0, 16] },
  },
  'slide-up': {
    enter: { y: [60, 0], opacity: DEFAULT_FADE_OPACITY },
    leave: { y: [0, -60], opacity: DEFAULT_LEAVE_OPACITY },
  },
  'slide-down': {
    enter: { y: [-60, 0], opacity: DEFAULT_FADE_OPACITY },
    leave: { y: [0, 60], opacity: DEFAULT_LEAVE_OPACITY },
  },
  'slide-left': {
    enter: { x: [60, 0], opacity: DEFAULT_FADE_OPACITY },
    leave: { x: [0, -60], opacity: DEFAULT_LEAVE_OPACITY },
  },
  'slide-right': {
    enter: { x: [-60, 0], opacity: DEFAULT_FADE_OPACITY },
    leave: { x: [0, 60], opacity: DEFAULT_LEAVE_OPACITY },
  },
  'zoom-in': {
    enter: { opacity: DEFAULT_FADE_OPACITY, scale: [0.5, 1] },
    leave: { opacity: DEFAULT_LEAVE_OPACITY, scale: [1, 0.5] },
  },
  'zoom-out': {
    enter: { opacity: DEFAULT_FADE_OPACITY, scale: [1.3, 1] },
    leave: { opacity: DEFAULT_LEAVE_OPACITY, scale: [1, 1.3] },
  },
  'flip-x': {
    enter: { opacity: DEFAULT_FADE_OPACITY, rotateX: [-90, 0] },
    leave: { opacity: DEFAULT_LEAVE_OPACITY, rotateX: [0, 90] },
  },
  'flip-y': {
    enter: { opacity: DEFAULT_FADE_OPACITY, rotateY: [-90, 0] },
    leave: { opacity: DEFAULT_LEAVE_OPACITY, rotateY: [0, 90] },
  },
  'bounce-in': {
    enter: { opacity: DEFAULT_FADE_OPACITY, y: [30, 0], scale: [0.85, 1] },
    leave: { opacity: DEFAULT_LEAVE_OPACITY, y: [0, -20], scale: [1, 0.9] },
    loop: { y: [0, -10, 0], scale: [1, 0.95, 1] },
  },
  'blur-in': {
    enter: { opacity: DEFAULT_FADE_OPACITY, blur: [10, 0] },
    leave: { opacity: DEFAULT_LEAVE_OPACITY, blur: [0, 10] },
  },
  spin: {
    enter: { opacity: DEFAULT_FADE_OPACITY, rotate: [-360, 0] },
    leave: { opacity: DEFAULT_LEAVE_OPACITY, rotate: [0, 360] },
    loop: { rotate: [0, 360] },
  },
  pulse: {
    enter: { scale: [1, 1.05, 1] },
    leave: { scale: [1, 0.95, 1] },
    loop: { scale: [1, 1.05, 1] },
  },
  shake: {
    enter: { opacity: DEFAULT_FADE_OPACITY, x: [0, -10, 10, -10, 10, -5, 5, -5, 5, 0] },
    leave: { opacity: DEFAULT_LEAVE_OPACITY, x: [0, 10, -10, 10, -10, 5, -5, 5, -5, 0] },
  },
  swing: {
    enter: { opacity: DEFAULT_FADE_OPACITY, rotate: [0, 15, -10, 5, -5, 0] },
    leave: { opacity: DEFAULT_LEAVE_OPACITY, rotate: [0, -15, 10, -5, 5, 0] },
  },
  wobble: {
    enter: {
      opacity: DEFAULT_FADE_OPACITY,
      x: [0, -25, 20, -15, 10, -5, 0],
      rotate: [0, -5, 3, -3, 2, -1, 0],
    },
    leave: {
      opacity: DEFAULT_LEAVE_OPACITY,
      x: [0, 25, -20, 15, -10, 5, 0],
      rotate: [0, 5, -3, 3, -2, 1, 0],
    },
  },
  'rubber-band': {
    enter: {
      opacity: DEFAULT_FADE_OPACITY,
      scaleX: [1, 1.25, 0.75, 1.15, 0.95, 1.05, 1],
      scaleY: [1, 0.75, 1.25, 0.85, 1.05, 0.95, 1],
    },
    leave: {
      opacity: DEFAULT_LEAVE_OPACITY,
      scaleX: [1, 1.25, 0.75, 1.15, 0.95, 1.05, 1],
      scaleY: [1, 0.75, 1.25, 0.85, 1.05, 0.95, 1],
    },
  },
  'heart-beat': {
    enter: { opacity: DEFAULT_FADE_OPACITY, scale: [1, 1.3, 1, 1.3, 1] },
    leave: { opacity: DEFAULT_LEAVE_OPACITY, scale: [1, 1.3, 1, 1.3, 1] },
    loop: { scale: [1, 1.3, 1, 1.3, 1] },
  },
  tada: {
    enter: {
      opacity: DEFAULT_FADE_OPACITY,
      scale: [1, 0.9, 1.1, 1.1, 1.1, 1],
      rotate: [0, -3, 3, -3, 3, 0],
    },
    leave: {
      opacity: DEFAULT_LEAVE_OPACITY,
      scale: [1, 0.9, 1.1, 1.1, 1.1, 1],
      rotate: [0, 3, -3, 3, -3, 0],
    },
  },
  jello: {
    enter: {
      opacity: DEFAULT_FADE_OPACITY,
      scaleX: [1, 1.25, 0.75, 1.15, 0.95, 1.05, 1],
      scaleY: [1, 0.75, 1.25, 0.85, 1.05, 0.95, 1],
    },
    leave: {
      opacity: DEFAULT_LEAVE_OPACITY,
      scaleX: [1, 1.25, 0.75, 1.15, 0.95, 1.05, 1],
      scaleY: [1, 0.75, 1.25, 0.85, 1.05, 0.95, 1],
    },
  },
  'light-speed': {
    enter: { opacity: [0, 1], x: [200, 0], scaleX: [0, 1] },
    leave: { opacity: [1, 0], x: [0, 200], scaleX: [1, 0] },
  },
  'roll-in': {
    enter: { opacity: [0, 1], x: [-100, 0], rotate: [-120, 0] },
    leave: { opacity: [1, 0], x: [0, 100], rotate: [0, 120] },
  },
  none: {
    enter: { opacity: [1, 1] },
    leave: { opacity: [1, 1] },
  },
};
