import { MoveKeyframes, MovePreset } from 'movement';

/** All available presets for demos */
export const ALL_PRESETS: MovePreset[] = [
  'none',
  'fade-up',
  'fade-down',
  'fade-left',
  'fade-right',
  'slide-up',
  'slide-down',
  'slide-left',
  'slide-right',
  'zoom-in',
  'zoom-out',
  'flip-x',
  'flip-y',
  'bounce-in',
];

/** Get a human-readable label for a preset */
export function getPresetLabel(preset: MovePreset): string {
  return preset
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Get description for a preset */
export function getPresetDescription(
  preset: MovePreset,
  type: 'enter' | 'leave' = 'enter',
): string {
  const enterDesc: Record<string, string> = {
    none: 'No animation',
    'fade-up': 'Fades in while moving up',
    'fade-down': 'Fades in while moving down',
    'fade-left': 'Fades in while moving left',
    'fade-right': 'Fades in while moving right',
    'slide-up': 'Slides in from below',
    'slide-down': 'Slides in from above',
    'slide-left': 'Slides in from right',
    'slide-right': 'Slides in from left',
    'zoom-in': 'Scales up from small',
    'zoom-out': 'Scales down from large',
    'flip-x': 'Flips in horizontally',
    'flip-y': 'Flips in vertically',
    'bounce-in': 'Bounces in with scale',
  };

  const leaveDesc: Record<string, string> = {
    none: 'No animation',
    'fade-up': 'Fades out while moving up',
    'fade-down': 'Fades out while moving down',
    'fade-left': 'Fades out while moving left',
    'fade-right': 'Fades out while moving right',
    'slide-up': 'Slides out upward',
    'slide-down': 'Slides out downward',
    'slide-left': 'Slides out to left',
    'slide-right': 'Slides out to right',
    'zoom-in': 'Scales down to small',
    'zoom-out': 'Scales up to large',
    'flip-x': 'Flips out horizontally',
    'flip-y': 'Flips out vertically',
    'bounce-in': 'Bounces out with scale',
  };

  const desc = type === 'enter' ? enterDesc : leaveDesc;
  return desc[preset] || `${type === 'enter' ? 'Enter' : 'Leave'} animation`;
}

/** Common easing options */
export const EASING_OPTIONS = ['ease', 'ease-in', 'ease-out', 'ease-in-out'] as const;

/** Default control configs for common demo types */
export const DEFAULT_CONTROLS = {
  /** Full controls: preset, duration, delay, easing */
  full: {
    showPreset: true,
    showDuration: true,
    showDelay: true,
    showEasing: true,
  },
  /** Standard controls: preset, duration, easing */
  standard: {
    showPreset: true,
    showDuration: true,
    showDelay: false,
    showEasing: true,
  },
  /** Minimal controls: preset, duration */
  minimal: {
    showPreset: true,
    showDuration: true,
    showDelay: false,
    showEasing: false,
  },
  /** No controls */
  none: {
    showPreset: false,
    showDuration: false,
    showDelay: false,
    showEasing: false,
  },
} as const;

/**
 * Convert MoveKeyframes into a compact string representation suitable for code previews.
 * Example: { scale: [1, 1.1], y: [0, -8] }
 */
export function keyframesToString(kf: MoveKeyframes): string {
  const entries = Object.entries(kf)
    .map(([key, val]) => {
      if (!val || !Array.isArray(val)) return '';
      return `${key}: [${val.join(', ')}]`;
    })
    .filter(Boolean);
  return `{ ${entries.join(', ')} }`;
}
