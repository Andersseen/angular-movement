import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-features',
  imports: [RouterLink],
  template: `
    <section class="border-border mx-auto max-w-7xl border-t px-4 py-20 sm:px-6 lg:px-8">
      <div class="mb-12 max-w-2xl">
        <h2 class="font-display text-text mb-4 text-3xl font-bold tracking-tight md:text-4xl">
          Why Angular Movement
        </h2>
        <p class="text-text-muted text-lg leading-relaxed">
          Angular already animates simple enter and leave. Movement exists for the part that is hard
          to coordinate by hand: motion that is driven by application state.
        </p>
      </div>

      <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
        @for (item of pillars; track item.title) {
          <article class="bg-surface border-border rounded-2xl border p-7">
            <h3 class="font-display text-text mb-3 text-xl font-bold">{{ item.title }}</h3>
            <p class="text-text-muted m-0 leading-relaxed">{{ item.body }}</p>
          </article>
        }
      </div>

      <p class="text-text-muted mt-8 text-sm">
        Not sure whether you need it?
        <a routerLink="/docs/choose-a-tool" class="text-accent font-semibold underline"
          >Read when CSS or Angular's native animations are enough.</a
        >
      </p>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Features {
  protected readonly pillars = [
    {
      title: 'Signals in, motion out',
      body: 'Bind an object or a signal and the element animates to the new state. moveValue, moveTransform and moveSpringValue derive motion from signals without a change-detection detour.',
    },
    {
      title: 'Native browser animation',
      body: 'Playback runs on the Web Animations API, so transforms and opacity stay on the compositor where the browser allows it. Final styles are committed, not left in a fill. No animation runtime to ship.',
    },
    {
      title: 'Presence that owns lifetime',
      body: 'movePresence and movePresenceFor keep an element mounted until every leave animation has finished, including keyed lists that are reordered or revived mid-exit.',
    },
  ];
}
