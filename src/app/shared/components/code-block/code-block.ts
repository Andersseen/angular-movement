import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-code-block',
  template: `
    <div class="relative bg-code-bg rounded-2xl border border-border overflow-hidden h-full flex flex-col w-full shadow-lg">
      <!-- Mac style header -->
      <div class="h-10 border-b border-border bg-surface flex items-center px-4 gap-2 z-20 shrink-0">
        <div class="w-2.5 h-2.5 rounded-full bg-border/50"></div>
        <div class="w-2.5 h-2.5 rounded-full bg-border/50"></div>
        <div class="w-2.5 h-2.5 rounded-full bg-border/50"></div>
        <div class="text-xs font-mono text-text-subtle ml-2 flex-1 text-center pr-10">
          {{ title() }}
        </div>
      </div>

      <!-- Code Content -->
      <div class="p-6 overflow-x-auto flex-1 h-full w-full">
        <pre class="text-sm font-mono leading-relaxed"><code class="text-text" [innerHTML]="safeCode()"></code></pre>
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
    this.#sanitizer.bypassSecurityTrustHtml(this.code())
  );
}
