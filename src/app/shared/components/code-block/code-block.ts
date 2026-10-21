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
import { copyToClipboard } from '../../utils/clipboard';
import { languageFromFileName, tokenize, type CodeLanguage } from '../../utils/highlight';

type CopyState = 'idle' | 'copied' | 'failed';

/**
 * Renders plain source text with syntax colours.
 *
 * `code` is always raw source — never markup. Tokens are rendered through template bindings, so
 * nothing in the source can be interpreted as HTML, and the copy button copies exactly `code()`.
 */
@Component({
  selector: 'app-code-block',
  template: `
    <figure
      class="bg-code-bg border-border relative m-0 flex h-full w-full flex-col overflow-hidden rounded-2xl border shadow-lg"
    >
      <figcaption
        class="border-border bg-surface z-20 flex h-11 shrink-0 items-center justify-between gap-3 border-b pr-2 pl-4"
      >
        <span class="text-text-subtle min-w-0 truncate font-mono text-xs">{{ title() }}</span>
        <span class="flex shrink-0 items-center gap-2">
          <span class="text-text-subtle font-mono text-[11px] tracking-wide uppercase">{{
            resolvedLanguage()
          }}</span>
          <button
            type="button"
            data-testid="copy-code"
            class="text-text-muted hover:text-text hover:bg-surface-raised focus-visible:outline-accent inline-flex min-h-8 min-w-8 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
            [attr.aria-label]="'Copy ' + title() + ' to clipboard'"
            (click)="copy()"
          >
            <svg
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              @if (state() === 'copied') {
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              } @else {
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              }
            </svg>
            <span aria-hidden="true">{{
              state() === 'copied' ? 'Copied' : state() === 'failed' ? 'Failed' : 'Copy'
            }}</span>
          </button>
          <span class="sr-only" role="status" data-testid="copy-status">{{ statusMessage() }}</span>
        </span>
      </figcaption>

      <div
        class="h-full w-full flex-1 overflow-auto p-5 sm:p-6"
        tabindex="0"
        role="region"
        [attr.aria-label]="title() + ' source code'"
      >
        <pre
          class="m-0 bg-transparent p-0 font-mono text-sm leading-relaxed"
        ><code class="text-text bg-transparent p-0">@for (token of tokens(); track $index) {<span [class]="'code-' + token.type">{{ token.text }}</span>}</code></pre>
      </div>

      <ng-content />
    </figure>
  `,
  styles: `
    :host {
      display: block;
    }
    .code-plain {
      color: inherit;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodeBlock {
  readonly #document = inject(DOCUMENT);
  #resetTimer: ReturnType<typeof setTimeout> | undefined;

  readonly title = input<string>('code.ts');
  /** Raw source text. Never markup. */
  readonly code = input<string>('');
  /** Overrides the language inferred from `title`. */
  readonly language = input<CodeLanguage | undefined>(undefined);

  protected readonly state = signal<CopyState>('idle');

  protected readonly resolvedLanguage = computed(
    () => this.language() ?? languageFromFileName(this.title()),
  );
  protected readonly tokens = computed(() => tokenize(this.code(), this.resolvedLanguage()));
  protected readonly statusMessage = computed(() => {
    switch (this.state()) {
      case 'copied':
        return `${this.title()} copied to clipboard`;
      case 'failed':
        return 'Copy failed. Select the code and copy it manually.';
      default:
        return '';
    }
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.#resetTimer));
  }

  protected async copy(): Promise<void> {
    const ok = await copyToClipboard(this.#document, this.code());
    this.state.set(ok ? 'copied' : 'failed');
    clearTimeout(this.#resetTimer);
    this.#resetTimer = setTimeout(() => this.state.set('idle'), 2000);
  }
}
