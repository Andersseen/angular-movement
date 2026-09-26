import { describe, expect, it } from 'vitest';
import { getDirective, getExample, getGuidelines, listDirectives, listPresets } from './tools.js';
import type { ApiSnapshot } from './types.js';

const snapshot: ApiSnapshot = {
  generatedAt: '2026-01-01T00:00:00.000Z',
  presets: ['fade-up', 'fade-down', 'lift', 'press'],
  directives: [
    {
      className: 'MoveHoverDirective',
      selector: '[moveWhileHover]',
      exportAs: null,
      description: 'Animate elements on hover',
      inputs: [
        { name: 'moveWhileHover', type: 'MovePreset | MoveKeyframes', required: false },
        { name: 'moveDuration', type: 'MoveTime', required: false, defaultValue: '300' },
      ],
      outputs: [],
      signals: [],
      oneShot: false,
    },
    {
      className: 'MoveEnterDirective',
      selector: '[moveEnter]',
      exportAs: null,
      description: 'Animate on enter',
      inputs: [{ name: 'moveEnter', type: 'MovePreset | MoveKeyframes', required: false }],
      outputs: [],
      signals: [],
      oneShot: true,
    },
    {
      className: 'MoveStaggerDirective',
      selector: '[moveStagger]',
      exportAs: null,
      description: 'Stagger children',
      inputs: [
        {
          name: 'moveStagger',
          type: 'MoveTime | MoveSpring | ""',
          required: false,
          defaultValue: '100',
        },
      ],
      outputs: [],
      signals: [],
      oneShot: null,
    },
    {
      className: 'MoveDragDirective',
      selector: '[moveDrag]',
      exportAs: null,
      description: 'Make elements draggable',
      inputs: [{ name: 'moveDrag', type: 'boolean', required: false, defaultValue: 'true' }],
      outputs: ['moveDragStart', 'moveDragEnd'],
      signals: ['isDragging'],
      oneShot: null,
    },
  ],
};

describe('listDirectives', () => {
  it('returns everything with no filter', () => {
    expect(listDirectives(snapshot)).toHaveLength(4);
  });

  it('filters case-insensitively by class name or selector', () => {
    expect(listDirectives(snapshot, 'drag')).toEqual([snapshot.directives[3]]);
    expect(listDirectives(snapshot, 'HOVER')).toEqual([snapshot.directives[0]]);
  });
});

describe('getDirective', () => {
  it('matches by class name', () => {
    expect(getDirective(snapshot, 'MoveDragDirective')).toEqual(snapshot.directives[3]);
  });

  it('matches by bare or bracketed selector', () => {
    expect(getDirective(snapshot, 'moveWhileHover')).toEqual(snapshot.directives[0]);
    expect(getDirective(snapshot, '[moveWhileHover]')).toEqual(snapshot.directives[0]);
  });

  it('returns null for an unknown directive', () => {
    expect(getDirective(snapshot, 'moveNonsense')).toBeNull();
  });
});

describe('listPresets', () => {
  it('returns the preset list', () => {
    expect(listPresets(snapshot)).toEqual(['fade-up', 'fade-down', 'lift', 'press']);
  });
});

describe('getExample', () => {
  it('uses the interaction preset as a static attribute, with notes on touch and timing', () => {
    expect(getExample(snapshot, 'MoveHoverDirective')).toEqual({
      className: 'MoveHoverDirective',
      selector: '[moveWhileHover]',
      importStatement: `import { MoveHoverDirective } from 'angular-movement';`,
      imports: ['MoveHoverDirective'],
      template: `<div moveWhileHover="lift">...</div>`,
      notes: [
        expect.stringContaining('touch never triggers hover'),
        expect.stringContaining('MoveTime'),
      ],
    });
  });

  it('uses an entrance preset for non-interaction directives', () => {
    expect(getExample(snapshot, 'moveEnter')?.template).toBe(`<div moveEnter="fade-up">...</div>`);
  });

  it('writes a MoveTime main input with an explicit unit', () => {
    expect(getExample(snapshot, 'moveStagger')?.template).toBe(
      `<div moveStagger="100ms">...</div>`,
    );
  });

  it('always returns the narrow import, never MOVEMENT_DIRECTIVES', () => {
    for (const directive of snapshot.directives) {
      const example = getExample(snapshot, directive.className)!;
      expect(example.imports).toEqual([directive.className]);
      expect(example.importStatement).not.toContain('MOVEMENT_DIRECTIVES');
    }
  });

  it('emits a boolean literal unquoted, using the input default', () => {
    expect(getExample(snapshot, 'MoveDragDirective')?.template).toBe(
      `<div [moveDrag]="true">...</div>`,
    );
  });

  it('returns null for an unknown directive', () => {
    expect(getExample(snapshot, 'nope')).toBeNull();
  });
});

describe('getGuidelines', () => {
  it('covers every convention the consumer audit found agents getting wrong', () => {
    const topics = getGuidelines().map((g) => g.topic);
    for (const topic of [
      'imports',
      'timing units',
      'interaction presets',
      'touch',
      'reduced motion',
      'imperative animation',
      'cancellation',
      'view transitions',
      'first paint',
    ]) {
      expect(topics).toContain(topic);
    }
  });

  it('states that numbers are milliseconds', () => {
    const [timing] = getGuidelines('timing');
    expect(timing.rule).toContain('number is ALWAYS milliseconds');
  });

  it('filters case-insensitively and returns [] for no match', () => {
    expect(getGuidelines('TOUCH').map((g) => g.topic)).toContain('touch');
    expect(getGuidelines('no-such-topic-xyz')).toEqual([]);
  });

  it('never recommends MOVEMENT_DIRECTIVES in an example', () => {
    for (const guideline of getGuidelines()) {
      expect(guideline.example ?? '').not.toContain('MOVEMENT_DIRECTIVES');
    }
  });
});
