import { describe, expect, it } from 'vitest';
import { loadSnapshot } from './snapshot.js';

/**
 * Guards the committed data the published server ships. A regeneration once produced zero
 * directives (the extractor could not read `MOVEMENT_DIRECTIVES` after it became a spread of two
 * aggregates) and nothing failed.
 */
describe('committed api snapshot', () => {
  const snapshot = loadSnapshot();

  it('contains every directive wired into MOVEMENT_DIRECTIVES', () => {
    expect(snapshot.directives).toHaveLength(21);
    expect(snapshot.directives.map((d) => d.className)).toEqual(
      expect.arrayContaining(['MoveHoverDirective', 'MoveTapDirective', 'MoveTriggerDirective']),
    );
  });

  it('includes the interaction presets', () => {
    expect(snapshot.presets).toEqual(expect.arrayContaining(['lift', 'press']));
  });

  it('describes timing inputs as MoveTime', () => {
    const hover = snapshot.directives.find((d) => d.className === 'MoveHoverDirective');
    expect(hover?.inputs.find((i) => i.name === 'moveDuration')?.type).toBe('MoveTime');
  });

  it('marks moveTrigger inputs optional (imperative-only mode)', () => {
    const trigger = snapshot.directives.find((d) => d.className === 'MoveTriggerDirective');
    expect(trigger?.inputs.filter((i) => i.required)).toEqual([]);
  });
});
