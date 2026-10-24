import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  MoveAnimationDirective,
  MoveEnterDirective,
  MoveHoverDirective,
  MoveLeaveDirective,
  MovePresenceDirective,
  MovePresenceForDirective,
} from 'movement';
import { VoltBadge, VoltButton, VoltCheckbox } from '@voltui/components';
import { LmnPlusIcon } from 'lumen-icons/plus';
import { LmnXMarkIcon } from 'lumen-icons/x-mark';

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
 * The hero's interactive showcase: one small, coherent UI (a task list) built from stable
 * directives — `*movePresenceFor` (keyed enter/leave), `[moveAnimation]` (reactive state),
 * `*movePresence` (conditional detail), `moveWhileHover` — and Volt UI atoms only.
 *
 * Mounted behind `@defer`, so it adds no animation work to the initial render or hydration.
 */
@Component({
  selector: 'app-showcase',
  imports: [
    MoveEnterDirective,
    MoveLeaveDirective,
    MovePresenceForDirective,
    MovePresenceDirective,
    MoveAnimationDirective,
    MoveHoverDirective,
    VoltBadge,
    VoltButton,
    VoltCheckbox,
    LmnPlusIcon,
    LmnXMarkIcon,
  ],
  template: `
    <div class="flex flex-col gap-3" data-testid="showcase">
      <div class="flex items-center justify-between gap-3">
        <p class="font-display text-text m-0 flex items-center gap-2 text-base font-semibold">
          Today
          <volt-badge variant="secondary">{{ remaining() }}</volt-badge>
        </p>
        <volt-button size="sm" data-testid="showcase-add" (click)="add()">
          <lmn-plus slot="leading" [size]="14" ariaLabel="Add" />
          Add task
        </volt-button>
      </div>

      <ul class="m-0 flex list-none flex-col gap-2 p-0" data-testid="showcase-list">
        <li
          *movePresenceFor="let task of tasks(); trackBy: trackById"
          move="fade-up"
          moveDuration="300ms"
          class="landing-card bg-surface border-border rounded-xl border"
          [moveWhileHover]="{ y: [0, -2] }"
          [attr.data-testid]="'showcase-task-' + task.id"
        >
          <div
            class="flex items-center gap-3 px-3 py-2"
            [moveAnimation]="{
              initial: { scale: 1 },
              animate: { scale: task.done ? 0.985 : 1 },
              duration: 200,
            }"
          >
            <volt-checkbox
              [checked]="task.done"
              [ariaLabel]="'Mark ' + task.title + ' as done'"
              (checkedChange)="toggle(task.id)"
            />
            <volt-button
              variant="ghost"
              size="sm"
              class="flex-1 justify-start"
              [class.line-through]="task.done"
              [class.opacity-60]="task.done"
              [aria-expanded]="task.open"
              [aria-controls]="'showcase-detail-' + task.id"
              (click)="toggleOpen(task.id)"
            >
              {{ task.title }}
            </volt-button>
            <volt-button
              variant="ghost"
              size="icon"
              [aria-label]="'Remove ' + task.title"
              (click)="remove(task.id)"
            >
              <lmn-x-mark [size]="16" ariaLabel="Remove" />
            </volt-button>
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

  protected remaining(): number {
    return this.tasks().filter((task) => !task.done).length;
  }

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
