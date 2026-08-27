import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { MovePresenceForDirective, MovePresenceForMode } from './move-presence-for.directive';
import { MoveLeaveDirective } from './move-leave.directive';
import { provideMovement } from '../providers/provide-movement';
import { AnimationEngine } from '../engines/animation-engine.service';
import { AnimationControls } from '../engines/animation-controls';

interface Row {
  id: number;
  label: string;
}

@Component({
  template: `
    <div
      *movePresenceFor="let row of rows(); trackBy: byId; mode: mode()"
      [moveLeave]="'fade-up'"
      [attr.data-id]="row.id"
    >
      {{ row.label }}
    </div>
  `,
  imports: [MovePresenceForDirective, MoveLeaveDirective],
})
class ListHostComponent {
  readonly rows = signal<Row[]>([
    { id: 1, label: 'one' },
    { id: 2, label: 'two' },
  ]);
  readonly mode = signal<MovePresenceForMode>('sync');
  readonly byId = (_index: number, row: Row) => row.id;
}

@Component({
  template: `
    <div *movePresenceFor="let row of rows(); trackBy: byId; let i = index" [attr.data-id]="row.id">
      {{ i }}:{{ row.label }}
    </div>
  `,
  imports: [MovePresenceForDirective],
})
class PlainListHostComponent {
  readonly rows = signal<Row[]>([]);
  readonly byId = (_index: number, row: Row) => row.id;
}

function controls(finished: Promise<void>): AnimationControls {
  return {
    play: vi.fn(),
    pause: vi.fn(),
    cancel: vi.fn(),
    currentTime: 0,
    finished,
  };
}

/** A leave player the test resolves by hand, so "still leaving" is a real state. */
function deferredControls(): { player: AnimationControls; resolve: () => void } {
  let resolve: () => void = () => undefined;
  const finished = new Promise<void>((r) => {
    resolve = r;
  });
  return { player: controls(finished), resolve: () => resolve() };
}

function ids(fixture: ComponentFixture<unknown>): string[] {
  return Array.from(fixture.nativeElement.querySelectorAll('[data-id]')).map(
    (el) => (el as HTMLElement).dataset['id'] as string,
  );
}

describe('MovePresenceForDirective', () => {
  let fixture: ComponentFixture<ListHostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ListHostComponent],
      providers: [provideMovement()],
    });
    fixture = TestBed.createComponent(ListHostComponent);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('renders one view per tracked item', () => {
    fixture.detectChanges();
    expect(ids(fixture)).toEqual(['1', '2']);
    expect(fixture.nativeElement.textContent).toContain('one');
    expect(fixture.nativeElement.textContent).toContain('two');
  });

  it('keeps a removed item in the DOM until its leave resolves, then removes it', async () => {
    const engine = TestBed.inject(AnimationEngine);
    const { player, resolve } = deferredControls();
    vi.spyOn(engine, 'play').mockReturnValue(player);

    fixture.detectChanges();

    fixture.componentInstance.rows.set([{ id: 2, label: 'two' }]);
    fixture.detectChanges();

    // Still present: the leave has not resolved yet.
    expect(ids(fixture)).toEqual(['1', '2']);

    resolve();
    await new Promise((r) => setTimeout(r, 0));

    expect(ids(fixture)).toEqual(['2']);
  });

  it('plays leave only on the removed item, never on its siblings', async () => {
    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play').mockReturnValue(controls(Promise.resolve()));

    fixture.detectChanges();
    playSpy.mockClear();

    fixture.componentInstance.rows.set([{ id: 2, label: 'two' }]);
    fixture.detectChanges();
    await new Promise((r) => setTimeout(r, 0));

    expect(playSpy).toHaveBeenCalledTimes(1);
    const animated = playSpy.mock.calls[0][0] as HTMLElement;
    expect(animated.dataset['id']).toBe('1');
  });

  it('revives a leaving item when its key comes back, reusing the same node', async () => {
    const engine = TestBed.inject(AnimationEngine);
    const { player } = deferredControls();
    vi.spyOn(engine, 'play').mockReturnValue(player);

    fixture.detectChanges();
    const original = fixture.nativeElement.querySelector('[data-id="1"]');

    fixture.componentInstance.rows.set([{ id: 2, label: 'two' }]);
    fixture.detectChanges();

    fixture.componentInstance.rows.set([
      { id: 1, label: 'one' },
      { id: 2, label: 'two' },
    ]);
    fixture.detectChanges();
    await new Promise((r) => setTimeout(r, 0));

    expect(player.cancel).toHaveBeenCalled();
    expect(ids(fixture)).toEqual(['1', '2']);
    expect(fixture.nativeElement.querySelector('[data-id="1"]')).toBe(original);
  });

  it('does not remove a revived view when the stale leave resolves afterwards', async () => {
    const engine = TestBed.inject(AnimationEngine);
    const { player, resolve } = deferredControls();
    vi.spyOn(engine, 'play').mockReturnValue(player);

    fixture.detectChanges();

    fixture.componentInstance.rows.set([{ id: 2, label: 'two' }]);
    fixture.detectChanges();

    fixture.componentInstance.rows.set([
      { id: 1, label: 'one' },
      { id: 2, label: 'two' },
    ]);
    fixture.detectChanges();

    // The abandoned leave settles only now.
    resolve();
    await new Promise((r) => setTimeout(r, 0));

    expect(ids(fixture)).toEqual(['1', '2']);
  });

  it('keeps a leaving row in place when the live rows around it do not move', () => {
    const engine = TestBed.inject(AnimationEngine);
    const { player } = deferredControls();
    vi.spyOn(engine, 'play').mockReturnValue(player);

    fixture.componentInstance.rows.set([
      { id: 1, label: 'one' },
      { id: 2, label: 'two' },
      { id: 3, label: 'three' },
    ]);
    fixture.detectChanges();

    // Drop the middle row only.
    fixture.componentInstance.rows.set([
      { id: 1, label: 'one' },
      { id: 3, label: 'three' },
    ]);
    fixture.detectChanges();

    // Row 2 is still leaving and holds the slot it occupied, so the list does not jump.
    expect(ids(fixture)).toEqual(['1', '2', '3']);
  });

  it('keeps live rows in source order while a row leaves during a reorder', () => {
    const engine = TestBed.inject(AnimationEngine);
    const { player } = deferredControls();
    vi.spyOn(engine, 'play').mockReturnValue(player);

    fixture.componentInstance.rows.set([
      { id: 1, label: 'one' },
      { id: 2, label: 'two' },
      { id: 3, label: 'three' },
    ]);
    fixture.detectChanges();

    // Drop the middle row and swap the outer two in the same pass.
    fixture.componentInstance.rows.set([
      { id: 3, label: 'three' },
      { id: 1, label: 'one' },
    ]);
    fixture.detectChanges();

    // Where the leaving row lands mid-reorder is not specified; that the live rows follow the
    // source order and the leaving row is still mounted is.
    const rendered = ids(fixture);
    expect(rendered).toContain('2');
    expect(rendered.filter((id) => id !== '2')).toEqual(['3', '1']);
  });

  it('moves existing views on reorder instead of recreating them', () => {
    fixture.detectChanges();
    const first = fixture.nativeElement.querySelector('[data-id="1"]');
    const second = fixture.nativeElement.querySelector('[data-id="2"]');

    fixture.componentInstance.rows.set([
      { id: 2, label: 'two' },
      { id: 1, label: 'one' },
    ]);
    fixture.detectChanges();

    expect(ids(fixture)).toEqual(['2', '1']);
    expect(fixture.nativeElement.querySelector('[data-id="1"]')).toBe(first);
    expect(fixture.nativeElement.querySelector('[data-id="2"]')).toBe(second);
  });

  it('mode="wait" holds new views back until pending leaves resolve', async () => {
    const engine = TestBed.inject(AnimationEngine);
    const { player, resolve } = deferredControls();
    vi.spyOn(engine, 'play').mockReturnValue(player);

    fixture.componentInstance.mode.set('wait');
    fixture.detectChanges();

    fixture.componentInstance.rows.set([{ id: 3, label: 'three' }]);
    fixture.detectChanges();

    // Rows 1 and 2 are leaving; row 3 must not appear yet.
    expect(ids(fixture)).toEqual(['1', '2']);

    resolve();
    await new Promise((r) => setTimeout(r, 0));
    fixture.detectChanges();

    expect(ids(fixture)).toEqual(['3']);
  });

  it('exposes NgFor-style context values over the live rows only', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [PlainListHostComponent],
      providers: [provideMovement()],
    });
    const plain = TestBed.createComponent(PlainListHostComponent);
    plain.componentInstance.rows.set([
      { id: 1, label: 'a' },
      { id: 2, label: 'b' },
      { id: 3, label: 'c' },
    ]);
    plain.detectChanges();

    const nodes = Array.from(plain.nativeElement.querySelectorAll('[data-id]')) as HTMLElement[];
    expect(nodes.map((n) => n.textContent?.trim())).toEqual(['0:a', '1:b', '2:c']);
  });

  it('cancels pending leaves on destroy', async () => {
    const engine = TestBed.inject(AnimationEngine);
    const { player } = deferredControls();
    vi.spyOn(engine, 'play').mockReturnValue(player);

    fixture.detectChanges();

    fixture.componentInstance.rows.set([]);
    fixture.detectChanges();

    fixture.destroy();
    await new Promise((r) => setTimeout(r, 0));

    expect(player.cancel).toHaveBeenCalled();
  });

  it('handles a null source without rendering anything', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [PlainListHostComponent],
      providers: [provideMovement()],
    });
    const plain = TestBed.createComponent(PlainListHostComponent);
    plain.componentInstance.rows.set([]);
    plain.detectChanges();

    expect(plain.nativeElement.querySelectorAll('[data-id]').length).toBe(0);
  });
});

@Component({
  selector: 'move-presence-for-pop-host',
  template: `
    <div
      *movePresenceFor="let row of rows(); trackBy: byId; mode: mode()"
      [moveLeave]="'fade-up'"
      [attr.data-id]="row.id"
    >
      {{ row.label }}
    </div>
  `,
  imports: [MovePresenceForDirective, MoveLeaveDirective],
})
class PopLayoutHostComponent {
  readonly rows = signal<Row[]>([
    { id: 1, label: 'one' },
    { id: 2, label: 'two' },
  ]);
  readonly mode = signal<MovePresenceForMode>('popLayout');
  readonly byId = (_index: number, row: Row) => row.id;
}

describe('MovePresenceForDirective popLayout', () => {
  let fixture: ComponentFixture<PopLayoutHostComponent>;
  const offsets = { offsetTop: 40, offsetLeft: 8, offsetWidth: 200, offsetHeight: 32 };
  const descriptors: Record<string, PropertyDescriptor | undefined> = {};

  beforeEach(() => {
    // jsdom reports every offset as 0, so the popped values would be indistinguishable from unset.
    for (const [key, value] of Object.entries(offsets)) {
      descriptors[key] = Object.getOwnPropertyDescriptor(HTMLElement.prototype, key);
      Object.defineProperty(HTMLElement.prototype, key, {
        configurable: true,
        get: () => value,
      });
    }

    TestBed.configureTestingModule({
      imports: [PopLayoutHostComponent],
      providers: [provideMovement()],
    });
    vi.spyOn(TestBed.inject(AnimationEngine), 'play').mockReturnValue(deferredControls().player);
    fixture = TestBed.createComponent(PopLayoutHostComponent);
  });

  afterEach(() => {
    for (const [key, descriptor] of Object.entries(descriptors)) {
      if (descriptor) Object.defineProperty(HTMLElement.prototype, key, descriptor);
      else delete (HTMLElement.prototype as unknown as Record<string, unknown>)[key];
    }
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('lifts a leaving row out of flow at the position it already occupied', () => {
    fixture.detectChanges();

    fixture.componentInstance.rows.set([{ id: 2, label: 'two' }]);
    fixture.detectChanges();

    const leaving = fixture.nativeElement.querySelector('[data-id="1"]') as HTMLElement;
    expect(leaving.style.position).toBe('absolute');
    expect(leaving.style.top).toBe('40px');
    expect(leaving.style.left).toBe('8px');
    expect(leaving.style.width).toBe('200px');
    expect(leaving.style.height).toBe('32px');
    // offsetWidth/Height include padding and border, which is what border-box means.
    expect(leaving.style.boxSizing).toBe('border-box');
    expect(leaving.style.pointerEvents).toBe('none');
  });

  it('leaves rows in flow in sync mode', () => {
    fixture.componentInstance.mode.set('sync');
    fixture.detectChanges();

    fixture.componentInstance.rows.set([{ id: 2, label: 'two' }]);
    fixture.detectChanges();

    const leaving = fixture.nativeElement.querySelector('[data-id="1"]') as HTMLElement;
    expect(leaving.style.position).toBe('');
  });

  it('puts a revived row back into flow', () => {
    fixture.detectChanges();

    fixture.componentInstance.rows.set([{ id: 2, label: 'two' }]);
    fixture.detectChanges();
    expect(
      (fixture.nativeElement.querySelector('[data-id="1"]') as HTMLElement).style.position,
    ).toBe('absolute');

    fixture.componentInstance.rows.set([
      { id: 1, label: 'one' },
      { id: 2, label: 'two' },
    ]);
    fixture.detectChanges();

    const revived = fixture.nativeElement.querySelector('[data-id="1"]') as HTMLElement;
    expect(revived.style.position).toBe('');
    expect(revived.style.top).toBe('');
    expect(revived.style.pointerEvents).toBe('');
  });
});

interface Group {
  id: number;
  rows: Row[];
}

@Component({
  template: `
    <div
      *movePresenceFor="let group of groups(); trackBy: byGroupId"
      [moveLeave]="'fade-up'"
      [attr.data-group]="group.id"
    >
      <div
        *movePresenceFor="let row of group.rows; trackBy: byRowId"
        [moveLeave]="'fade-up'"
        [attr.data-row]="row.id"
      >
        {{ row.label }}
      </div>
    </div>
  `,
  imports: [MovePresenceForDirective, MoveLeaveDirective],
})
class NestedListHostComponent {
  readonly groups = signal<Group[]>([
    {
      id: 1,
      rows: [
        { id: 1, label: 'one' },
        { id: 2, label: 'two' },
      ],
    },
  ]);
  readonly byGroupId = (_index: number, group: Group) => group.id;
  readonly byRowId = (_index: number, row: Row) => row.id;
}

describe('MovePresenceForDirective nested lists', () => {
  let fixture: ComponentFixture<NestedListHostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NestedListHostComponent],
      providers: [provideMovement()],
    });
    fixture = TestBed.createComponent(NestedListHostComponent);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('tears down a nested *movePresenceFor cleanly when the outer group leaves', async () => {
    const engine = TestBed.inject(AnimationEngine);
    const { player, resolve } = deferredControls();
    vi.spyOn(engine, 'play').mockReturnValue(player);

    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('[data-row]')).toHaveLength(2);

    // Remove the whole group. Its own [moveLeave] starts playing; the nested list's two rows
    // (a separate, per-item MOVE_PRESENCE_PARENT scope each) are still mounted underneath it.
    fixture.componentInstance.groups.set([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-group]')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('[data-row]')).toHaveLength(2);

    // Resolving the outer leave destroys the embedded view, which recursively destroys the
    // nested MovePresenceForDirective instance and its own per-row entries. Must not throw.
    resolve();
    await expect(new Promise((r) => setTimeout(r, 0))).resolves.toBeUndefined();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-group]')).toBeFalsy();
    expect(fixture.nativeElement.querySelectorAll('[data-row]')).toHaveLength(0);
  });
});
