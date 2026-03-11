import { ChangeDetectionStrategy, Component, ElementRef, signal, ViewChild } from '@angular/core';

@Component({
  selector: 'app-code-preview',
  templateUrl: './code-preview.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodePreview {
  @ViewChild('section') sectionRef!: ElementRef;
  protected readonly showAfter = signal(false);
}
