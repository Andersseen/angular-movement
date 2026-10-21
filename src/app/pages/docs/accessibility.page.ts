import type { RouteMeta } from '@analogjs/router';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CodeBlock } from '../../shared/components/code-block/code-block';
import { PageHeader } from '../../shared/components/page-header/page-header';

export const routeMeta: RouteMeta = { title: 'Accessibility & troubleshooting — Angular Movement' };

@Component({
  selector: 'app-docs-accessibility',
  imports: [CodeBlock, PageHeader, RouterLink],
  template: `
    <article class="max-w-3xl">
      <app-page-header
        title="Accessibility & troubleshooting"
        description="How Movement treats reduced motion, SSR and hydration, and what to check when an animation does not behave."
      />

      <div class="docs-prose max-w-none">
        <h2>Reduced motion</h2>
        <p>
          When the operating system asks for reduced motion, directives skip the animation and apply
          the final styles. You can also turn motion off globally with
          <code>provideMovement(&#123; disabled: true &#125;)</code> or per element with
          <code>moveDisabled</code>. The decision is taken when an animation starts, so toggling the
          OS setting affects the next animation.
        </p>
        <p>
          Reduced motion removes <em>motion</em>, not feedback. Keep state changes visible (colour,
          opacity) and never rely on an animation to communicate information that is not otherwise
          available.
        </p>

        <h2>SSR and hydration</h2>
        <ul>
          <li>The server renders your HTML as written; animation APIs are no-ops on the server.</li>
          <li>
            Movement does not hide content before hydration. If you want an element hidden until it
            animates in, that is an app-level decision that delays content for no-JS users and
            crawlers; prefer CSS for critical above-the-fold motion.
          </li>
          <li>
            Elements that animate in from <code>opacity: 0</code> start once the app has booted.
            Content below the fold is a good fit for <code>moveInView</code>.
          </li>
        </ul>

        <h2>Keyboard and focus</h2>
        <ul>
          <li>
            Animating an element does not change its focusability. Do not animate focusable elements
            out with <code>pointer-events</code> alone.
          </li>
          <li>
            Presence keeps an element in the DOM while it leaves. Focus inside a leaving panel stays
            there until removal; move focus yourself (for example back to the trigger) when you
            close a dialog.
          </li>
          <li>
            <code>moveSmoothScroll</code> is experimental and changes how wheel and touch scrolling
            feel; prefer native scrolling.
          </li>
        </ul>

        <h2>Troubleshooting</h2>
        <div class="not-prose my-6 overflow-x-auto rounded-lg border">
          <table class="w-full min-w-[34rem] text-left text-sm">
            <caption class="sr-only">
              Common symptoms and fixes
            </caption>
            <thead class="bg-surface-raised text-text font-display">
              <tr>
                <th scope="col" class="px-4 py-3 font-semibold">Symptom</th>
                <th scope="col" class="px-4 py-3 font-semibold">Likely cause and fix</th>
              </tr>
            </thead>
            <tbody class="divide-border text-text-muted divide-y">
              @for (row of faq; track row.symptom) {
                <tr>
                  <th scope="row" class="text-text px-4 py-3 align-top font-medium">
                    {{ row.symptom }}
                  </th>
                  <td class="px-4 py-3">{{ row.fix }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <h2>Timing units</h2>
        <p>
          A bare number is always milliseconds. Use a string to state the unit explicitly.
          Fractional numbers below 1 trigger a dev-mode warning because they are usually seconds.
        </p>
        <app-code-block title="timing.html" [code]="timingCode" />

        <p>
          See also <a routerLink="/docs/patterns">Angular patterns</a> for cancellation and
          reduced-motion layers.
        </p>
      </div>
    </article>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Accessibility {
  protected readonly faq = [
    {
      symptom: 'Nothing animates after a signal changes',
      fix: 'You are probably using a one-shot API (moveAnimate, moveEnter, moveInView). Use [moveAnimation], moveVariants or MoveAnimator for state changes. See Choose an API.',
    },
    {
      symptom: 'moveLeave never plays when an @if turns false',
      fix: 'The view is destroyed before the directive can run. Wrap it in *movePresence, or use *movePresenceFor for lists.',
    },
    {
      symptom: 'Variants do not animate with [moveAnimate]="name"',
      fix: 'On a host with moveVariants, set the state with moveVariant (alias moveActiveVariant). moveAnimate is ignored there.',
    },
    {
      symptom: 'Duration looks 1000× too fast',
      fix: 'Numbers are milliseconds. 0.3 means 0.3ms; write "0.3s" or 300.',
    },
    {
      symptom: 'Different easings on x and scale are ignored',
      fix: 'Transform channels compose into one transform and share a single easing; independent properties such as opacity can have their own.',
    },
    {
      symptom: 'Layout, drag or smooth scroll behave unexpectedly',
      fix: 'These are experimental and may change in minor releases. See the stability table in the API guide.',
    },
    {
      symptom: 'No animation in tests or on the server',
      fix: 'Where the Web Animations API is unavailable (server rendering, jsdom) final styles are applied without animating. Assert the final styles instead.',
    },
  ];

  protected readonly timingCode = `<div moveEnter="fade-up" moveDuration="300ms" moveDelay="0.1s">Explicit units</div>
<div moveEnter="fade-up" [moveDuration]="300">Number = milliseconds</div>`;
}
