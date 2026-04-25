export const DEFAULT_DURATION = 300;
export const DEFAULT_EASING = 'ease';
export const DEFAULT_DELAY = 0;

export const DEFAULT_PERSPECTIVE = '1200px';

export const DEFAULT_SPRING = {
  stiffness: 500,
  damping: 30,
} as const;

export const SPRING_BASE = {
  stiffness: 100,
  damping: 10,
  mass: 1,
  velocity: 0,
} as const;

export const SIMULATION_TICK_RATE = 1000 / 60; // 60fps
export const SIMULATION_MAX_ITERATIONS = 600;
export const SIMULATION_SETTLED_THRESHOLD = 0.001;

export const SCROLL_MAP_DURATION = 1000;
export const SCROLL_WAAPI_CAP = 0.999;
export const SCROLL_LERP_FACTOR = 0.12;
export const SCROLL_RAF_THRESHOLD = 0.001;

export const SMOOTH_SCROLL_FRICTION = 0.92;
export const SMOOTH_SCROLL_MIN_VELOCITY = 0.05;

export const DEFAULT_STAGGER_TIME = 100;
export const DEFAULT_TEXT_STAGGER = 30;

export const DRAG_SNAP_DURATION = 300;
export const DRAG_SNAP_EASING = 'ease';
