import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CodeBlock } from '../../../../shared/components/code-block/code-block';

@Component({
  selector: 'app-docs-introduction',
  imports: [RouterLink, CodeBlock],
  template: `
    <article class="max-w-3xl">
      <div class="mb-10 pb-10 border-b border-border">
        <h1 class="font-display text-4xl md:text-5xl font-bold tracking-tight text-text mb-4 relative inline-block">
          Introduction
          <div class="absolute -bottom-2 left-0 w-1/3 h-1 bg-accent rounded-full"></div>
        </h1>
        <p class="text-xl text-text-muted mt-6">
          Angular Movement is an attribute-based animation library for Angular 21. Inspired by
          motion.dev and animate.style, but built natively for Angular.
        </p>
      </div>

      <div class="prose prose-invert prose-p:text-text-muted prose-headings:text-text prose-headings:font-display prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-code:text-accent-light prose-code:bg-surface-raised prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none max-w-none">
        <h2>Why Angular Movement?</h2>
        <p>
          Angular's native animation API (<code>@angular/animations</code>) is powerful but
          extremely verbose. Writing triggers, transitions, and keyframes for simple enter/leave
          effects requires a lot of boilerplate and clutters your component decorator.
        </p>
        <p>Angular Movement wraps this complexity behind a single declarative HTML attribute:</p>

        <div class="my-6 h-28">
          <app-code-block title="html" [code]="htmlCode"></app-code-block>
        </div>

        <h2>Key features</h2>
        <ul class="space-y-2 mt-4">
          <li class="flex items-start gap-3">
            <svg class="w-5 h-5 text-accent shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span><strong>Zero TypeScript config</strong> for standard animations.</span>
          </li>
          <li class="flex items-start gap-3">
            <svg class="w-5 h-5 text-accent shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span><strong>Built natively</strong> on Angular's runtime animation API.</span>
          </li>
          <li class="flex items-start gap-3">
            <svg class="w-5 h-5 text-accent shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span><strong>No external dependencies</strong> like GSAP or Framer Motion.</span>
          </li>
          <li class="flex items-start gap-3">
            <svg class="w-5 h-5 text-accent shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span><strong>Zoneless ready</strong>. No <code>zone.js</code> requirements.</span>
          </li>
          <li class="flex items-start gap-3">
            <svg class="w-5 h-5 text-accent shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Automatically respects <strong>prefers-reduced-motion</strong> safely.</span>
          </li>
        </ul>
      </div>

      <div class="mt-16 pt-8 border-t border-border flex justify-end">
        <a routerLink="/docs/get-started" class="group flex flex-col items-end gap-1 hover:text-accent transition-colors">
          <span class="text-sm font-medium text-text-subtle">Next</span>
          <span class="text-lg font-display font-semibold flex items-center gap-2">
            Get Started <span class="group-hover:translate-x-1 transition-transform">&rarr;</span>
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
