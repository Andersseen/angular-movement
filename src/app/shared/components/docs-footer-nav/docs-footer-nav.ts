import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-docs-footer-nav',
  imports: [RouterLink],
  template: `
    <div
      class="border-border mt-16 flex items-center border-t pt-8"
      [class.justify-between]="prevHref()"
      [class.justify-end]="!prevHref()"
    >
      @if (prevHref()) {
        <a
          [routerLink]="prevHref()"
          class="group hover:text-accent flex flex-col items-start gap-1 transition-colors"
        >
          <span class="text-text-subtle text-sm font-medium">Previous</span>
          <span class="font-display flex items-center gap-2 text-lg font-semibold">
            <span class="transition-transform group-hover:-translate-x-1">&larr;</span>
            {{ prevLabel() }}
          </span>
        </a>
      }

      <a
        [routerLink]="nextHref()"
        class="group hover:text-accent flex flex-col items-end gap-1 transition-colors"
      >
        <span class="text-text-subtle text-sm font-medium">Next</span>
        <span class="font-display flex items-center gap-2 text-lg font-semibold">
          {{ nextLabel() }}
          <span class="transition-transform group-hover:translate-x-1">&rarr;</span>
        </span>
      </a>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsFooterNav {
  readonly prevHref = input<string | undefined>(undefined);
  readonly prevLabel = input<string>('');
  readonly nextHref = input.required<string>();
  readonly nextLabel = input.required<string>();
}
