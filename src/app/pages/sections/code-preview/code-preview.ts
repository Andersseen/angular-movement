import { ChangeDetectionStrategy, Component, ElementRef, signal, ViewChild } from '@angular/core';
import { BEFORE_CODE_SNIPPET, AFTER_CODE_SNIPPET } from './code-preview.snippets';
import { CodeBlock } from '../../../../shared/components/code-block/code-block';

@Component({
  selector: 'app-code-preview',
  imports: [CodeBlock],
  templateUrl: './code-preview.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodePreview {
  @ViewChild('section') sectionRef!: ElementRef;
  protected readonly showAfter = signal(false);

  protected readonly beforeSnippet = BEFORE_CODE_SNIPPET;
  protected readonly afterSnippet = AFTER_CODE_SNIPPET;
}
