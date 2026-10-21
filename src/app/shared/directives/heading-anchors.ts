import { DOCUMENT } from '@angular/common';
import {
  DestroyRef,
  Directive,
  ElementRef,
  Renderer2,
  afterEveryRender,
  inject,
  signal,
} from '@angular/core';
import { copyToClipboard } from '../utils/clipboard';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Progressive enhancement for documentation content: gives every `h2`/`h3` a stable `id` and a
 * keyboard-focusable "copy link" anchor. Pages stay readable without it (SSR / no JS); the
 * enhancement runs after render and is idempotent, so it follows route changes automatically.
 */
@Directive({
  selector: '[appHeadingAnchors]',
  exportAs: 'headingAnchors',
  host: {
    '(click)': 'onClick($event)',
  },
})
export class HeadingAnchors {
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  readonly #doc = inject(DOCUMENT);
  readonly #renderer = inject(Renderer2);
  readonly #seen = new Set<string>();
  #lastRoot: Element | null = null;
  #timer: ReturnType<typeof setTimeout> | undefined;

  /** Polite announcement text for the copy action; rendered by the layout. */
  readonly message = signal('');

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.#timer));
    afterEveryRender(() => this.#enhance());
  }

  #enhance(): void {
    const headings = this.#host.querySelectorAll<HTMLElement>(
      'h2:not([data-anchored]), h3:not([data-anchored])',
    );
    if (headings.length === 0) return;

    // A new page replaced the old one: ids only need to be unique within the visible page.
    const root = headings[0].closest('article, [data-docs-page]') ?? this.#host;
    if (root !== this.#lastRoot) {
      this.#seen.clear();
      this.#lastRoot = root;
    }

    headings.forEach((heading) => {
      const text = heading.textContent?.trim() ?? '';
      let id = heading.id || slugify(text);
      if (!id) return;
      let n = 2;
      const base = id;
      while (this.#seen.has(id)) id = `${base}-${n++}`;
      this.#seen.add(id);
      heading.id = id;
      heading.setAttribute('data-anchored', '');
      heading.classList.add('group', 'scroll-mt-24');

      const link = this.#renderer.createElement('a') as HTMLAnchorElement;
      link.href = `#${id}`;
      link.setAttribute('data-heading-anchor', id);
      link.setAttribute('aria-label', `Copy link to section: ${text}`);
      link.className =
        'heading-anchor ml-2 inline-block rounded px-1 text-accent no-underline opacity-0 ' +
        'transition-opacity group-hover:opacity-100 focus-visible:opacity-100 ' +
        'focus-visible:outline-2 focus-visible:outline-accent';
      link.textContent = '#';
      this.#renderer.appendChild(heading, link);
    });

    const hash = this.#doc.defaultView?.location.hash.slice(1);
    if (hash) {
      this.#doc.getElementById(decodeURIComponent(hash))?.scrollIntoView({ block: 'start' });
    }
  }

  protected async onClick(event: Event): Promise<void> {
    const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>(
      'a[data-heading-anchor]',
    );
    if (!anchor) return;
    event.preventDefault();
    const id = anchor.getAttribute('data-heading-anchor')!;
    const win = this.#doc.defaultView!;
    win.history.replaceState(null, '', `#${id}`);
    const url = `${win.location.origin}${win.location.pathname}#${id}`;
    const ok = await copyToClipboard(this.#doc, url);
    this.message.set(ok ? 'Link copied to clipboard' : 'Could not copy the link');
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => this.message.set(''), 2500);
  }
}
