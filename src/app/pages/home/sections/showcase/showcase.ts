import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  MoveAnimateDirective,
  MoveAnimationDirective,
  MoveEnterDirective,
  MoveHoverDirective,
  MoveLeaveDirective,
  MovePresenceDirective,
  MovePresenceForDirective,
  MoveTapDirective,
} from 'movement';

interface Task {
  id: number;
  title: string;
  done: boolean;
  open: boolean;
}

const TITLES = [
  'Review pull request',
  'Ship the changelog',
  'Reply to feedback',
  'Update the roadmap',
  'Record a demo',
];

/**
 * The homepage's interactive showcase: one small, coherent UI (a task list) built only from
 * stable directives — `*movePresenceFor` (keyed enter/leave), `[moveAnimation]` (reactive state),
 * `*movePresence` (conditional detail), `moveWhileHover` / `moveWhileTap` (feedback).
 *
 * It is mounted behind `@defer`, so it adds no animation work to the initial render or hydration.
 */
@Component({
  selector: 'app-showcase',
  imports: [
    MoveAnimateDirective,
    MoveEnterDirective,
    MoveLeaveDirective,
    MovePresenceForDirective,
    MovePresenceDirective,
    MoveAnimationDirective,
    MoveHoverDirective,
    MoveTapDirective,
  ],
  template: `
    <div class="flex flex-col gap-3" data-testid="showcase">
      <div class="flex items-center justify-between gap-3">
        <h3 class="font-display text-text m-0 text-base font-semibold">Today</h3>
        <button
          type="button"
          data-testid="showcase-add"
          class="bg-accent-solid focus-visible:outline-accent min-h-11 rounded-lg px-4 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2"
          [moveWhileTap]="{ scale: [1, 0.96] }"
          (click)="add()"
        >
          Add task
        </button>
      </div>

      <ul class="m-0 flex list-none flex-col gap-2 p-0" data-testid="showcase-list">
        <li
          *movePresenceFor="let task of tasks(); trackBy: trackById"
          move="fade-up"
          moveDuration="300ms"
          class="bg-surface border-border rounded-xl border"
          [moveWhileHover]="{ y: [0, -2] }"
          [attr.data-testid]="'showcase-task-' + task.id"
        >
          <div
            class="flex items-center gap-3 px-4 py-3"
            [moveAnimation]="{
              initial: { scale: 1 },
              animate: { scale: task.done ? 0.985 : 1 },
              duration: 200,
            }"
          >
            <button
              type="button"
              role="checkbox"
              class="border-border focus-visible:outline-accent flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs focus-visible:outline-2 focus-visible:outline-offset-2"
              [class.bg-accent-solid]="task.done"
              [class.text-white]="task.done"
              [attr.aria-checked]="task.done"
              [attr.aria-label]="'Mark ' + task.title + ' as done'"
              (click)="toggle(task.id)"
            >
              @if (task.done) {
                <span aria-hidden="true">✓</span>
              }
            </button>
            <button
              type="button"
              class="text-text focus-visible:outline-accent min-h-8 flex-1 text-left text-sm font-medium focus-visible:outline-2"
              [class.line-through]="task.done"
              [class.text-text-muted]="task.done"
              [attr.aria-expanded]="task.open"
              [attr.aria-controls]="'showcase-detail-' + task.id"
              (click)="toggleOpen(task.id)"
            >
              {{ task.title }}
            </button>
            <button
              type="button"
              class="text-text-muted hover:text-text focus-visible:outline-accent min-h-8 min-w-8 rounded-md text-xs focus-visible:outline-2"
              [attr.aria-label]="'Remove ' + task.title"
              (click)="remove(task.id)"
            >
              ✕
            </button>
          </div>
          <ng-container *movePresence="task.open">
            <p
              class="text-text-muted m-0 px-4 pt-0 pb-3 text-sm"
              moveEnter="fade-down"
              moveLeave="fade-up"
              moveDuration="200ms"
              [id]="'showcase-detail-' + task.id"
            >
              Presence keeps this panel mounted until its leave animation has finished.
            </p>
          </ng-container>
        </li>
      </ul>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Showcase {
  #nextId = 4;

  protected readonly tasks = signal<Task[]>([
    { id: 1, title: TITLES[0], done: false, open: false },
    { id: 2, title: TITLES[1], done: true, open: false },
    { id: 3, title: TITLES[2], done: false, open: false },
  ]);

  protected readonly trackById = (_: number, task: Task) => task.id;

  protected add(): void {
    const id = this.#nextId++;
    const title = TITLES[(id - 1) % TITLES.length];
    this.tasks.update((tasks) => [{ id, title, done: false, open: false }, ...tasks].slice(0, 5));
  }

  protected remove(id: number): void {
    this.tasks.update((tasks) => tasks.filter((t) => t.id !== id));
  }

  protected toggle(id: number): void {
    this.tasks.update((tasks) => tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  protected toggleOpen(id: number): void {
    this.tasks.update((tasks) => tasks.map((t) => (t.id === id ? { ...t, open: !t.open } : t)));
  }
}
