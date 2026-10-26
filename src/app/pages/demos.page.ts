import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs';
import { DEMO_GROUPS } from '../shared/components/demo-workbench/demo-navigation';

@Component({
  selector: 'app-demos-layout',
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="demo-shell">
      <aside class="demo-sidebar" aria-label="Demo navigation">
        <a routerLink="/demos" class="demo-sidebar-brand"
          >The motion lab <span>23 experiments. Your ideas.</span></a
        >
        <nav aria-label="Demos">
          @for (group of demoGroups; track group.title) {
            <div class="demo-nav-group">
              <h2>{{ group.title }}</h2>
              @for (item of group.items; track item.path) {
                <a
                  [routerLink]="[item.path]"
                  [class.demo-nav-active]="slug() === item.path"
                  [attr.aria-current]="slug() === item.path ? 'page' : null"
                  [title]="item.description"
                  >{{ item.label }}</a
                >
              }
            </div>
          }
        </nav>
      </aside>
      <div class="demo-mobile-selector">
        <label for="demo-selector">Explore demos</label>
        <select id="demo-selector" [value]="slug()" (change)="navigate($event)">
          @for (group of demoGroups; track group.title) {
            <optgroup [label]="group.title">
              @for (item of group.items; track item.path) {
                <option [value]="item.path" [selected]="slug() === item.path">
                  {{ item.label }}
                </option>
              }
            </optgroup>
          }
        </select>
      </div>
      <div class="demo-route"><router-outlet /></div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DemosLayout {
  readonly #router = inject(Router);
  protected readonly demoGroups = DEMO_GROUPS;
  protected readonly slug = toSignal(
    this.#router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => this.getSlug(event.urlAfterRedirects)),
    ),
    { initialValue: this.getSlug(this.#router.url) },
  );
  protected navigate(event: Event): void {
    void this.#router.navigate(['/demos', (event.target as HTMLSelectElement).value]);
  }
  private getSlug(url: string): string {
    const slug = url.split(/[?#]/)[0].split('/').filter(Boolean).pop();
    return slug === 'demos' ? 'enter' : (slug ?? 'enter');
  }
}
