import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import {
  VoltButton,
  VoltTabs,
  VoltTabsContent,
  VoltTabsList,
  VoltTabsTrigger,
} from '@voltui/components';
import { LmnCheckIcon } from 'lumen-icons/check';
import { LmnCopyIcon } from 'lumen-icons/copy';
import { copyToClipboard } from '../../utils/clipboard';

type PackageManager = 'npm' | 'pnpm' | 'yarn';

const INSTALL_COMMANDS: Record<PackageManager, string> = {
  npm: 'npm install angular-movement',
  pnpm: 'pnpm add angular-movement',
  yarn: 'yarn add angular-movement',
};

/** Package-manager switcher + copy button, built only from Volt UI atoms. */
@Component({
  selector: 'app-install-command',
  imports: [
    VoltTabs,
    VoltTabsContent,
    VoltTabsList,
    VoltTabsTrigger,
    VoltButton,
    LmnCopyIcon,
    LmnCheckIcon,
  ],
  template: `
    <div
      class="bg-code-bg border-border w-full overflow-hidden rounded-xl border shadow-2xl"
      [class.interactive-scale]="interactiveScale()"
    >
      <volt-tabs [value]="selectedManager()" (valueChange)="select($event)">
        <volt-tabs-list class="border-border w-full justify-start gap-1 rounded-none border-b p-2">
          @for (manager of managers; track manager) {
            <volt-tabs-trigger [value]="manager" class="font-mono text-xs">{{
              manager
            }}</volt-tabs-trigger>
          }
        </volt-tabs-list>

        @for (manager of managers; track manager) {
          <volt-tabs-content [value]="manager">
            <div class="flex items-center justify-between gap-4 p-4">
              <code
                class="text-text-muted min-w-0 flex-1 truncate text-left font-mono text-sm select-all"
                >{{ command() }}</code
              >
              <volt-button
                variant="ghost"
                size="icon"
                aria-label="Copy install command"
                data-testid="copy-install"
                (click)="copyInstallCommand()"
              >
                @if (copied()) {
                  <lmn-check [size]="20" ariaLabel="Copied" />
                } @else {
                  <lmn-copy [size]="20" ariaLabel="Copy" />
                }
              </volt-button>
            </div>
          </volt-tabs-content>
        }
      </volt-tabs>

      <span class="sr-only" role="status">{{ status() }}</span>
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

  readonly #document = inject(DOCUMENT);
  #timer: ReturnType<typeof setTimeout> | undefined;
  protected readonly status = signal('');
  protected readonly copied = signal(false);

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.#timer));
  }

  protected select(value: string | undefined): void {
    if (value && value in INSTALL_COMMANDS) this.selectedManager.set(value as PackageManager);
  }

  protected async copyInstallCommand(): Promise<void> {
    const ok = await copyToClipboard(this.#document, this.command());
    this.copied.set(ok);
    this.status.set(ok ? 'Install command copied' : 'Copy failed. Select the command manually.');
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => {
      this.status.set('');
      this.copied.set(false);
    }, 2500);
  }
}
