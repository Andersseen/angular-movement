import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

type PackageManager = 'npm' | 'pnpm' | 'yarn';

const INSTALL_COMMANDS: Record<PackageManager, string> = {
  npm: 'npm install angular-movement',
  pnpm: 'pnpm add angular-movement',
  yarn: 'yarn add angular-movement',
};

@Component({
  selector: 'app-install-command',
  template: `
    <div
      class="bg-code-bg border-border w-full overflow-hidden rounded-xl border shadow-2xl"
      [class.interactive-scale]="interactiveScale()"
    >
      <div class="border-border flex items-center gap-1 border-b p-2">
        @for (manager of managers; track manager) {
          <button
            type="button"
            class="rounded-md px-3 py-1.5 font-mono text-xs transition-colors"
            [class.bg-surface-raised]="selectedManager() === manager"
            [class.text-text]="selectedManager() === manager"
            [class.text-text-subtle]="selectedManager() !== manager"
            [class.hover:text-text]="selectedManager() !== manager"
            (click)="selectedManager.set(manager)"
          >
            {{ manager }}
          </button>
        }
      </div>

      <div class="flex items-center justify-between gap-4 p-4">
        <code
          class="text-text-muted min-w-0 flex-1 truncate text-left font-mono text-sm select-all"
        >
          {{ command() }}
        </code>
        <button
          type="button"
          class="text-text-subtle hover:text-text hover:bg-surface-raised shrink-0 rounded-md p-2 transition-colors"
          (click)="copyInstallCommand()"
          aria-label="Copy install command"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            ></path>
          </svg>
        </button>
      </div>
    </div>
  `,
  styles: `
    .interactive-scale {
      transition: transform 150ms ease;
    }

    .interactive-scale:hover {
      transform: scale(1.02);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstallCommand {
  readonly interactiveScale = input(true);

  protected readonly managers: PackageManager[] = ['npm', 'pnpm', 'yarn'];
  protected readonly selectedManager = signal<PackageManager>('npm');
  protected readonly command = computed(() => INSTALL_COMMANDS[this.selectedManager()]);

  protected copyInstallCommand(): void {
    if (typeof navigator === 'undefined') return;
    navigator.clipboard?.writeText(this.command()).catch(() => void 0);
  }
}
