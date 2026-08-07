import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CodeBlock } from '../../shared/components/code-block/code-block';

@Component({
  selector: 'app-docs-introduction',
  imports: [RouterLink, CodeBlock],
  template: `
    <article class="max-w-3xl">
      <div class="border-border mb-10 border-b pb-10">
        <h1
          class="font-display text-text relative mb-4 inline-block text-4xl font-bold tracking-tight md:text-5xl"
        >
          Introduction
          <div class="bg-accent absolute -bottom-2 left-0 h-1 w-1/3 rounded-full"></div>
        </h1>
        <p class="text-text-muted mt-6 text-xl">
          Angular Movement is a motion library for Angular 21 and 22 with Angular-native directives,
          state APIs, and Web Animations API-powered runtime playback.
        </p>
      </div>

      <div
        class="prose prose-invert prose-p:text-text-muted prose-headings:text-text prose-headings:font-display prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-code:text-accent-light prose-code:bg-surface-raised prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none max-w-none"
      >
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

      <div class="border-border mt-16 flex justify-end border-t pt-8">
        <a
          routerLink="/docs/get-started"
          class="group hover:text-accent flex flex-col items-end gap-1 transition-colors"
        >
          <span class="text-text-subtle text-sm font-medium">Next</span>
          <span class="font-display flex items-center gap-2 text-lg font-semibold">
            Get Started <span class="transition-transform group-hover:translate-x-1">&rarr;</span>
          </span>
        </a>
      </div>
    </article>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Introduction {
  protected readonly htmlCode = `&lt;<span class="code-keyword">div</span> <span class="code-attr">moveEnter</span>=<span class="code-string">"fade-up"</span>&gt;This fades up on enter&lt;/<span class="code-keyword">div</span>&gt;`;
}
