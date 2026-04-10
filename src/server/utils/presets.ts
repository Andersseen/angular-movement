export type MovePreset =
  | 'fade-up'
  | 'fade-down'
  | 'fade-left'
  | 'fade-right'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'zoom-in'
  | 'zoom-out'
  | 'flip-x'
  | 'flip-y'
  | 'bounce-in'
  | 'none';

export interface PresetKeyframes {
  opacity?: number[];
  x?: number[];
  y?: number[];
  scale?: number[];
  rotateX?: number[];
  rotateY?: number[];
}

export interface PresetDefinition {
  enter: PresetKeyframes;
  leave: PresetKeyframes;
}

export const MOVE_PRESETS: Record<MovePreset, PresetDefinition> = {
  none: {
    enter: { opacity: [1, 1] },
    leave: { opacity: [1, 1] },
  },
  'fade-up': {
    enter: { opacity: [0, 1], y: [24, 0] },
    leave: { opacity: [1, 0], y: [0, -16] },
  },
  'fade-down': {
    enter: { opacity: [0, 1], y: [-24, 0] },
    leave: { opacity: [1, 0], y: [0, 16] },
  },
  'fade-left': {
    enter: { opacity: [0, 1], x: [24, 0] },
    leave: { opacity: [1, 0], x: [0, -16] },
  },
  'fade-right': {
    enter: { opacity: [0, 1], x: [-24, 0] },
    leave: { opacity: [1, 0], x: [0, 16] },
  },
  'slide-up': {
    enter: { y: [60, 0], opacity: [0, 1] },
    leave: { y: [0, -60], opacity: [1, 0] },
  },
  'slide-down': {
    enter: { y: [-60, 0], opacity: [0, 1] },
    leave: { y: [0, 60], opacity: [1, 0] },
  },
  'slide-left': {
    enter: { x: [60, 0], opacity: [0, 1] },
    leave: { x: [0, -60], opacity: [1, 0] },
  },
  'slide-right': {
    enter: { x: [-60, 0], opacity: [0, 1] },
    leave: { x: [0, 60], opacity: [1, 0] },
  },
  'zoom-in': {
    enter: { opacity: [0, 1], scale: [0.5, 1] },
    leave: { opacity: [1, 0], scale: [1, 0.5] },
  },
  'zoom-out': {
    enter: { opacity: [0, 1], scale: [1.3, 1] },
    leave: { opacity: [1, 0], scale: [1, 1.3] },
  },
  'flip-x': {
    enter: { opacity: [0, 1], rotateX: [-90, 0] },
    leave: { opacity: [1, 0], rotateX: [0, 90] },
  },
  'flip-y': {
    enter: { opacity: [0, 1], rotateY: [-90, 0] },
    leave: { opacity: [1, 0], rotateY: [0, 90] },
  },
  'bounce-in': {
    enter: { opacity: [0, 1], y: [30, 0], scale: [0.85, 1] },
    leave: { opacity: [1, 0], y: [0, -20], scale: [1, 0.9] },
  },
};

export const PRESET_DESCRIPTIONS: Record<MovePreset, string> = {
  none: 'No animation',
  'fade-up': 'Fade in while moving up',
  'fade-down': 'Fade in while moving down',
  'fade-left': 'Fade in while moving left',
  'fade-right': 'Fade in while moving right',
  'slide-up': 'Slide in from below',
  'slide-down': 'Slide in from above',
  'slide-left': 'Slide in from right',
  'slide-right': 'Slide in from left',
  'zoom-in': 'Scale up from small',
  'zoom-out': 'Scale down from large',
  'flip-x': 'Flip in horizontally',
  'flip-y': 'Flip in vertically',
  'bounce-in': 'Bounce in with scale',
};
