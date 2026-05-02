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
  | 'blur-in'
  | 'spin'
  | 'pulse'
  | 'none';

export type MoveValuePair = readonly number[];

export interface MoveSpring {
  stiffness?: number;
  damping?: number;
  mass?: number;
  velocity?: number;
}

export interface MoveKeyframes {
  opacity?: MoveValuePair;
  x?: MoveValuePair;
  y?: MoveValuePair;
  scale?: MoveValuePair;
  scaleX?: MoveValuePair;
  scaleY?: MoveValuePair;
  rotate?: MoveValuePair;
  rotateX?: MoveValuePair;
  rotateY?: MoveValuePair;
  blur?: MoveValuePair;
  [key: string]: MoveValuePair | undefined;
}

export type MoveVariant = MoveKeyframes & {
  spring?: MoveSpring;
  duration?: number;
  easing?: string;
  delay?: number;
};

export interface MovePresetDefinition {
  enter: MoveKeyframes;
  leave: MoveKeyframes;
  loop?: MoveKeyframes;
}

export interface MoveKeyframeState {
  opacity?: number;
  x?: number;
  y?: number;
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  rotate?: number;
  rotateX?: number;
  rotateY?: number;
  blur?: number;
  [key: string]: number | undefined;
}

export interface MoveAnimationConfig {
  initial?: MoveKeyframeState;
  animate?: MoveKeyframeState;
  exit?: MoveKeyframeState;
  duration?: number;
  easing?: string;
  delay?: number;
  spring?: MoveSpring;
}
