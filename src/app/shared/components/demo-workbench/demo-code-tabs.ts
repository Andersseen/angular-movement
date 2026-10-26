import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { CodeBlock } from '../code-block/code-block';

export interface DemoCodeFile {
  readonly title: string;
  readonly code: string;
}
@Component({
  selector: 'app-demo-code-tabs',
  imports: [CodeBlock],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="workbench-code-tabs" role="group" aria-label="Source files">
      @for (file of files(); track file.title; let i = $index) {
        <button type="button" [attr.aria-pressed]="selected() === i" (click)="selected.set(i)">
          {{ file.title }}
        </button>
      }
    </div>
    @if (files()[selected()]; as file) {
      <app-code-block [title]="file.title" [code]="file.code" />
    }
  `,
  host: { class: 'workbench-source-files' },
})
export class DemoCodeTabs {
  readonly files = input.required<readonly DemoCodeFile[]>();
  protected readonly selected = signal(0);
}
