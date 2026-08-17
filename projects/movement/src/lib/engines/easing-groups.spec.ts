import { groupByEasing } from './easing-groups';
import { MovementConfig } from '../tokens/movement.tokens';

const config: MovementConfig = {
  duration: 300,
  easing: 'ease',
  delay: 0,
  disabled: false,
  iterations: 1,
};

describe('groupByEasing', () => {
  it('returns null when every property resolves to the same easing', () => {
    // The single-animation path handles this better, so splitting would be pure overhead.
    expect(groupByEasing({ opacity: [0, 1], x: [0, 10] }, { easing: 'linear' }, config)).toBeNull();
  });

  it('returns null for an empty keyframe set', () => {
    expect(groupByEasing({}, { opacity: { easing: 'linear' } }, config)).toBeNull();
  });

  it('splits independent properties into their own groups', () => {
    const groups = groupByEasing(
      { opacity: [0, 1], filter: ['blur(0px)', 'blur(4px)'] },
      { opacity: { easing: 'linear' }, filter: { easing: 'ease-in' } },
      config,
    );

    expect(groups).toHaveLength(2);
    expect(groups?.map((group) => group.easing).sort()).toEqual(['ease-in', 'linear']);
    expect(groups?.every((group) => group.isTransform === false)).toBe(true);
  });

  it('keeps every transform channel in one group', () => {
    const groups = groupByEasing(
      { x: [0, 10], scale: [1, 2], opacity: [0, 1] },
      { x: { easing: 'linear' }, scale: { easing: 'ease-out' }, opacity: { easing: 'ease-in' } },
      config,
    );

    const transform = groups?.find((group) => group.isTransform);
    // Two animations writing `transform` would clobber each other, so x and scale cannot split.
    expect(Object.keys(transform?.frames ?? {}).sort()).toEqual(['scale', 'x']);
    expect(groups).toHaveLength(2);
  });

  it('returns null when the only differing easings are transform channels', () => {
    const groups = groupByEasing(
      { x: [0, 10], scale: [1, 2] },
      { x: { easing: 'linear' }, scale: { easing: 'ease-out' } },
      config,
    );

    // One group is not worth a composite; the existing single-animation path takes it.
    expect(groups).toBeNull();
  });

  it('carries per-property duration and delay onto each group', () => {
    const groups = groupByEasing(
      { opacity: [0, 1], filter: ['blur(0px)', 'blur(4px)'] },
      {
        opacity: { easing: 'linear', duration: 100, delay: 20 },
        filter: { easing: 'ease-in', duration: 500 },
      },
      config,
    );

    const opacity = groups?.find((group) => 'opacity' in group.frames);
    expect(opacity).toMatchObject({ duration: 100, delay: 20, easing: 'linear' });

    const filter = groups?.find((group) => 'filter' in group.frames);
    // Unspecified fields fall back to the global/config values.
    expect(filter).toMatchObject({ duration: 500, delay: 0 });
  });
});
