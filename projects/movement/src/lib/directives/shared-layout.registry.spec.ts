import { TestBed } from '@angular/core/testing';
import { SHARED_LAYOUT_MAX_AGE_MS, SharedLayoutRegistry } from './shared-layout.registry';

function rect(left: number, top: number, width = 100, height = 50): DOMRect {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
  } as DOMRect;
}

describe('SharedLayoutRegistry', () => {
  let registry: SharedLayoutRegistry;
  let first: HTMLElement;
  let second: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    registry = TestBed.inject(SharedLayoutRegistry);
    first = document.createElement('div');
    second = document.createElement('div');
  });

  it('hands a published rect to a different element', () => {
    registry.publish('card', first, rect(10, 20), 1_000);

    expect(registry.claim('card', second, 1_010)).toEqual(rect(10, 20));
  });

  it('never hands an element its own rect back', () => {
    registry.publish('card', first, rect(10, 20), 1_000);

    expect(registry.claim('card', first, 1_010)).toBeNull();
  });

  it('returns null for an unknown id', () => {
    expect(registry.claim('nothing', first, 1_000)).toBeNull();
  });

  it('ignores a rect older than the max age', () => {
    registry.publish('card', first, rect(10, 20), 1_000);

    const tooLate = 1_000 + SHARED_LAYOUT_MAX_AGE_MS + 1;
    expect(registry.claim('card', second, tooLate)).toBeNull();
  });

  it('accepts a rect published exactly at the max age boundary', () => {
    registry.publish('card', first, rect(10, 20), 1_000);

    expect(registry.claim('card', second, 1_000 + SHARED_LAYOUT_MAX_AGE_MS)).toEqual(rect(10, 20));
  });

  it('keeps the rect claimable after its element is gone', () => {
    // The outgoing element is destroyed without any explicit release; the handover still works.
    registry.publish('card', first, rect(10, 20), 1_000);
    first.remove();

    expect(registry.claim('card', second, 1_050)).toEqual(rect(10, 20));
  });

  it('drops expired entries instead of retaining them forever', () => {
    registry.publish('card', first, rect(10, 20), 1_000);

    // A later publish for an unrelated id prunes the expired one.
    registry.publish('other', second, rect(0, 0), 1_000 + SHARED_LAYOUT_MAX_AGE_MS + 1);

    expect(registry.claim('card', second, 1_000 + SHARED_LAYOUT_MAX_AGE_MS + 2)).toBeNull();
  });

  it('lets the newest publisher own the id', () => {
    registry.publish('card', first, rect(10, 20), 1_000);
    registry.publish('card', second, rect(80, 90), 1_010);

    expect(registry.claim('card', first, 1_020)).toEqual(rect(80, 90));
    expect(registry.claim('card', second, 1_020)).toBeNull();
  });
});
