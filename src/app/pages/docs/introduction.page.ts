import type { RouteMeta } from '@analogjs/router';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlock } from '../../shared/components/code-block/code-block';
import { PageHeader } from '../../shared/components/page-header/page-header';

export const routeMeta: RouteMeta = { title: 'Introduction — Angular Movement' };

@Component({
  selector: 'app-docs-introduction',
  imports: [CodeBlock, PageHeader],
  template: `
    <article class="max-w-3xl">
      <app-page-header
        title="Introduction"
        description="Angular Movement is a motion library for Angular 21 and 22 with Angular-native directives, state APIs, and Web Animations API-powered runtime playback."
      />

      <div class="docs-prose max-w-none">
        <h2>Why Angular Movement?</h2>
        <p>
          Angular teams often need the same motion primitives that product interfaces use every day:
          enter and exit animation, state variants, gestures, scroll progress, drag, SVG path
          drawing, and layout transitions. Angular Movement packages those patterns as declarative
          directives that fit standalone Angular components.
        </p>
        <p>
          The API feels native to Angular templates, while the runtime uses the browser Web
          Animations API for efficient playback:
        </p>

        <div class="my-6 h-28">
          <app-code-block title="html" [code]="htmlCode"></app-code-block>
        </div>

        <h2>Key features</h2>
        <ul class="mt-4 space-y-2">
          <li class="flex items-start gap-3">
            <svg
              class="text-accent mt-1 h-5 w-5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
            <span
              ><strong>Zero boilerplate</strong> for standard enter, leave, and reveal motion.</span
            >
          </li>
          <li class="flex items-start gap-3">
            <svg
              class="text-accent mt-1 h-5 w-5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
            <span
              ><strong>Angular-native API</strong> powered by the browser Web Animations API.</span
            >
          </li>
          <li class="flex items-start gap-3">
            <svg
              class="text-accent mt-1 h-5 w-5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
            <span
              ><strong>No @angular/animations setup</strong> and no GSAP or Framer Motion
              dependency.</span
            >
          </li>
          <li class="flex items-start gap-3">
            <svg
              class="text-accent mt-1 h-5 w-5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
            <span><strong>Zoneless ready</strong>. No <code>zone.js</code> requirements.</span>
          </li>
          <li class="flex items-start gap-3">
            <svg
              class="text-accent mt-1 h-5 w-5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
            <span>Automatically respects <strong>prefers-reduced-motion</strong> safely.</span>
          </li>
        </ul>
      </div>
    </article>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Introduction {
  protected readonly htmlCode = `<div moveEnter="fade-up">This fades up on enter</div>`;
}
