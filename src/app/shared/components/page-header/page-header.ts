import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  template: `
    <div class="border-border mb-10 border-b pb-10">
      <h1
        class="font-display text-text relative mb-4 inline-block text-4xl font-bold tracking-tight md:text-5xl"
      >
        {{ title() }}
        <div class="bg-accent absolute -bottom-2 left-0 h-1 w-1/3 rounded-full"></div>
      </h1>
      <p class="text-text-muted mt-6 text-xl">{{ description() }}</p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly description = input.required<string>();
}
