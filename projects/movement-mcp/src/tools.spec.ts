import { describe, expect, it } from 'vitest';
import { getDirective, getExample, listDirectives, listPresets } from './tools.js';
import type { ApiSnapshot } from './types.js';

const snapshot: ApiSnapshot = {
  generatedAt: '2026-01-01T00:00:00.000Z',
  presets: ['fade-up', 'fade-down'],
  directives: [
    {
      className: 'MoveHoverDirective',
      selector: '[moveWhileHover]',
      exportAs: null,
      description: 'Animate elements on hover',
      inputs: [
        { name: 'moveWhileHover', type: 'MovePreset | MoveKeyframes', required: false },
        { name: 'moveDuration', type: 'number', required: false, defaultValue: '300' },
      ],
      outputs: [],
      signals: [],
      oneShot: false,
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
    expect(listDirectives(snapshot)).toHaveLength(2);
  });

  it('filters case-insensitively by class name or selector', () => {
    expect(listDirectives(snapshot, 'drag')).toEqual([snapshot.directives[1]]);
    expect(listDirectives(snapshot, 'HOVER')).toEqual([snapshot.directives[0]]);
  });
});

describe('getDirective', () => {
  it('matches by class name', () => {
    expect(getDirective(snapshot, 'MoveDragDirective')).toEqual(snapshot.directives[1]);
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
    expect(listPresets(snapshot)).toEqual(['fade-up', 'fade-down']);
  });
});

describe('getExample', () => {
  it('builds a preset-valued binding for a MovePreset-typed main input', () => {
    expect(getExample(snapshot, 'MoveHoverDirective')).toEqual({
      className: 'MoveHoverDirective',
      selector: '[moveWhileHover]',
      template: `<div [moveWhileHover]="'fade-up'">...</div>`,
    });
  });

  it('emits a boolean literal unquoted, using the input default', () => {
    expect(getExample(snapshot, 'MoveDragDirective')).toEqual({
      className: 'MoveDragDirective',
      selector: '[moveDrag]',
      template: `<div [moveDrag]="true">...</div>`,
    });
  });

  it('returns null for an unknown directive', () => {
    expect(getExample(snapshot, 'nope')).toBeNull();
  });
});
