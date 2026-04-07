import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-code-block',
  template: `
    <div
      class="bg-code-bg border-border relative flex h-full w-full flex-col overflow-hidden rounded-2xl border shadow-lg"
    >
      <!-- Mac style header -->
      <div
        class="border-border bg-surface z-20 flex h-10 shrink-0 items-center gap-2 border-b px-4"
      >
        <div class="bg-border/50 h-2.5 w-2.5 rounded-full"></div>
        <div class="bg-border/50 h-2.5 w-2.5 rounded-full"></div>
        <div class="bg-border/50 h-2.5 w-2.5 rounded-full"></div>
        <div class="text-text-subtle ml-2 flex-1 pr-10 text-center font-mono text-xs">
          {{ title() }}
        </div>
      </div>

      <!-- Code Content -->
      <div class="h-full w-full flex-1 overflow-x-auto p-6">
        <pre
          class="font-mono text-sm leading-relaxed"
        ><code class="text-text" [innerHTML]="safeCode()"></code></pre>
      </div>

      <ng-content></ng-content>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodeBlock {
  #sanitizer = inject(DomSanitizer);

  readonly title = input<string>('code.ts');
  readonly code = input<string>('');

  protected safeCode = computed<SafeHtml>(() =>
    this.#sanitizer.bypassSecurityTrustHtml(this.code()),
  );
}
