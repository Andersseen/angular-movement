import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import { LmnBugAntIcon } from 'lumen-icons/bug-ant';
import { LmnCodeBracketIcon } from 'lumen-icons/code-bracket';
import { LmnPencilSquareIcon } from 'lumen-icons/pencil-square';
import { SITE } from '../shared/site';

const REFERENCE = '/docs/reference';

/**
 * Doqs `documentAfterContent` slot: the page's provenance and a way to improve it, as angular.dev
 * does. Authored pages map 1:1 onto `src/authoring/docs`; the API reference is generated from the
 * library's declarations, so it links to the source instead of a Markdown file nobody should edit.
 */
@Component({
  selector: 'app-doc-page-footer',
  imports: [LmnBugAntIcon, LmnCodeBracketIcon, LmnPencilSquareIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="doc-page-footer" aria-label="About this page">
      @if (generated()) {
        <a [href]="sourceUrl" rel="noopener noreferrer" target="_blank">
          <lmn-code-bracket [size]="16" ariaLabel="" />
          Generated from the library source
        </a>
      } @else {
        <a [href]="editUrl()" rel="noopener noreferrer" target="_blank">
          <lmn-pencil-square [size]="16" ariaLabel="" />
          Edit this page on GitHub
        </a>
      }
      <a [href]="issueUrl()" rel="noopener noreferrer" target="_blank">
        <lmn-bug-ant [size]="16" ariaLabel="" />
        Report an issue with this page
      </a>
    </footer>
  `,
})
export class DocPageFooter {
  readonly #router = inject(Router);
  readonly #path = toSignal(
    this.#router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.#currentPath()),
    ),
    { initialValue: this.#currentPath() },
  );

  protected readonly sourceUrl = `${SITE.github}/tree/main/projects/movement/src/lib`;
  protected readonly generated = computed(
    () => this.#path() === REFERENCE || this.#path().startsWith(REFERENCE + '/'),
  );
  protected readonly editUrl = computed(() => {
    const slug = this.#path().replace(/^\/docs\/?/, '') || 'introduction';
    return `${SITE.github}/edit/main/src/authoring/docs/${slug}.md`;
  });
  protected readonly issueUrl = computed(() => {
    const page = `${SITE.origin}${this.#path()}`;
    const params = new URLSearchParams({
      title: `Docs: ${this.#path()}`,
      body: `Page: ${page}\n\n`,
    });
    return `${SITE.github}/issues/new?${params}`;
  });

  #currentPath(): string {
    return this.#router.url.split(/[?#]/)[0];
  }
}
