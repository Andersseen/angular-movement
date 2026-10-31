import { TestBed } from '@angular/core/testing';
import {
  SHARED_LAYOUT_MAX_AGE_MS,
  SHARED_LAYOUT_MAX_ENTRIES,
  SharedLayoutRegistry,
} from './shared-layout.registry';

function box(left: number, top: number, width = 100, height = 50) {
  return { left, top, width, height };
}

describe('SharedLayoutRegistry', () => {
  let registry: SharedLayoutRegistry;
  const first = {};
  const second = {};

  beforeEach(() => {
    TestBed.configureTestingModule({});
    registry = TestBed.inject(SharedLayoutRegistry);
  });

  it('hands a published box to a different owner', () => {
    registry.publish('card', first, box(10, 20), null, 1_000);

    expect(registry.claim('card', second, null, 1_010)).toEqual(box(10, 20));
  });

  it('never hands an owner its own box back', () => {
    registry.publish('card', first, box(10, 20), null, 1_000);

    expect(registry.claim('card', first, null, 1_010)).toBeNull();
  });

  it('returns null for an unknown id', () => {
    expect(registry.claim('nothing', first, null, 1_000)).toBeNull();
  });

  it('ignores a box older than the max age, and accepts one exactly at the boundary', () => {
    registry.publish('card', first, box(10, 20), null, 1_000);

    expect(registry.claim('card', second, null, 1_000 + SHARED_LAYOUT_MAX_AGE_MS)).toEqual(
      box(10, 20),
    );
    expect(registry.claim('card', second, null, 1_000 + SHARED_LAYOUT_MAX_AGE_MS + 1)).toBeNull();
  });

  it('keeps the box claimable after its owner is gone (no release on destroy)', () => {
    registry.publish('card', first, box(10, 20), null, 1_000);

    expect(registry.claim('card', second, null, 1_050)).toEqual(box(10, 20));
  });

  it('drops expired entries instead of retaining them forever', () => {
    registry.publish('card', first, box(10, 20), null, 1_000);
    registry.publish('other', second, box(0, 0), null, 1_000 + SHARED_LAYOUT_MAX_AGE_MS + 1);

    expect(registry.size).toBe(1);
  });

  it('lets the newest publisher own the id', () => {
    registry.publish('card', first, box(10, 20), null, 1_000);
    registry.publish('card', second, box(80, 90), null, 1_010);

    expect(registry.claim('card', first, null, 1_020)).toEqual(box(80, 90));
    expect(registry.claim('card', second, null, 1_020)).toBeNull();
  });

  describe('scope', () => {
    it('keeps the same local id in two scopes apart', () => {
      registry.publish('card', first, box(10, 20), null, 1_000, 'panel-a');
      registry.publish('card', second, box(500, 600), null, 1_001, 'panel-b');

      const incomingA = {};
      expect(registry.claim('card', incomingA, null, 1_002, 'panel-a')).toEqual(box(10, 20));
      expect(registry.claim('card', incomingA, null, 1_002, 'panel-b')).toEqual(box(500, 600));
      expect(registry.claim('card', incomingA, null, 1_002, 'panel-c')).toBeNull();
    });

    it('does not let an unscoped id see a scoped one', () => {
      registry.publish('card', first, box(10, 20), null, 1_000, 'panel-a');

      expect(registry.claim('card', second, null, 1_001)).toBeNull();
    });
  });

  describe('invalidation', () => {
    it('drops every box when the viewport was resized since it was published', () => {
      registry.publish('card', first, box(10, 20), { width: 1000, height: 800 }, 1_000);

      expect(registry.claim('card', second, { width: 900, height: 800 }, 1_010)).toBeNull();
      expect(registry.claim('card', second, { width: 1000, height: 800 }, 1_010)).toEqual(
        box(10, 20),
      );
    });
  });

  describe('resource bounds', () => {
    it('never exceeds the entry cap, evicting the stalest first', () => {
      for (let i = 0; i < SHARED_LAYOUT_MAX_ENTRIES + 40; i += 1) {
        registry.publish(`id-${i}`, first, box(i, 0), null, 1_000);
      }

      expect(registry.size).toBe(SHARED_LAYOUT_MAX_ENTRIES);
      expect(registry.claim('id-0', second, null, 1_000)).toBeNull();
      expect(
        registry.claim(`id-${SHARED_LAYOUT_MAX_ENTRIES + 39}`, second, null, 1_000),
      ).not.toBeNull();
    });

    it('stores a plain copy of the box, never the live object it was handed', () => {
      const live = { ...box(10, 20) };
      registry.publish('card', first, live, null, 1_000);
      live.left = 999;

      expect(registry.claim('card', second, null, 1_001)).toEqual(box(10, 20));
    });
  });
});
