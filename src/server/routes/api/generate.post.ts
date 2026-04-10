import { createError, defineEventHandler, readBody } from 'h3';
import { MOVE_PRESETS, type MovePreset } from '../../utils/presets';

interface GenerateRequest {
  preset: MovePreset;
  directive?: string;
  duration?: number;
  delay?: number;
  easing?: string;
  element?: string;
}

interface GenerateResponse {
  html: string;
  config: {
    preset: MovePreset;
    directive: string;
    duration?: number;
    delay?: number;
    easing?: string;
  };
  keyframes: {
    enter: Record<string, number[]>;
    leave: Record<string, number[]>;
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default defineEventHandler(async (event: any): Promise<GenerateResponse> => {
  const body = await readBody<GenerateRequest>(event);

  const { preset, directive = 'moveEnter', duration, delay, easing, element = 'div' } = body;

  const presetDef = MOVE_PRESETS[preset];
  if (!presetDef) {
    throw createError({
      statusCode: 400,
      statusMessage: `Unknown preset: ${preset}`,
    });
  }

  const attrs: string[] = [`${directive}="${preset}"`];

  if (duration && duration !== 300) {
    attrs.push(`moveDuration="${duration}"`);
  }
  if (delay && delay !== 0) {
    attrs.push(`moveDelay="${delay}"`);
  }
  if (easing && easing !== 'ease') {
    attrs.push(`moveEasing="${easing}"`);
  }

  const html = `<${element}\n  ${attrs.join('\n  ')}\n>\n  Content\n</${element}>`;

  return {
    html,
    config: {
      preset,
      directive,
      duration,
      delay,
      easing,
    },
    keyframes: {
      enter: presetDef.enter as Record<string, number[]>,
      leave: presetDef.leave as Record<string, number[]>,
    },
  };
});
