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

export type MoveValuePair = readonly [number, number];

export interface MoveKeyframes {
  opacity?: MoveValuePair;
  x?: MoveValuePair;
  y?: MoveValuePair;
  scale?: MoveValuePair;
  rotate?: MoveValuePair;
  rotateX?: MoveValuePair;
  rotateY?: MoveValuePair;
}

export interface MovePresetDefinition {
  enter: MoveKeyframes;
  leave: MoveKeyframes;
}
