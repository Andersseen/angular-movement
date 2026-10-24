import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MoveInViewDirective } from 'movement';
import { VoltCard, VoltCardContent, VoltNativeButton } from '@voltui/components';
import { InstallCommand } from '../../../../shared/components/install-command/install-command';

@Component({
  selector: 'app-install',
  imports: [
    RouterLink,
    MoveInViewDirective,
    InstallCommand,
    VoltCard,
    VoltCardContent,
    VoltNativeButton,
  ],
  template: `
    <section class="mx-auto mb-16 max-w-7xl px-4 sm:px-6 lg:px-8">
      <volt-card
        moveInView="zoom-in"
        class="relative overflow-hidden"
        style="background: radial-gradient(circle at top right, var(--color-accent-glow), transparent 55%), var(--color-surface)"
      >
        <volt-card-content class="relative flex flex-col items-center px-6 py-20 text-center">
          <h2
            class="font-display text-text mb-6 text-4xl font-extrabold tracking-tight md:text-5xl"
          >
            Ready to move?
          </h2>
          <p class="text-text-muted mb-10 max-w-2xl text-xl font-light">
            Install the package, import one directive, and animate your Angular 21 or 22
            application.
          </p>
          <div class="w-full max-w-md"><app-install-command /></div>
          <div class="mt-8 flex flex-wrap justify-center gap-3">
            <a voltButton size="lg" routerLink="/docs/get-started">Read the guide</a>
            <a voltButton size="lg" variant="outline" routerLink="/demos">Open the demos</a>
          </div>
        </volt-card-content>
      </volt-card>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Install {}
