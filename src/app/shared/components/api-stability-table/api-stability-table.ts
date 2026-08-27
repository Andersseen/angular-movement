import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-api-stability-table',
  template: `
    <div class="not-prose my-6 overflow-hidden rounded-lg border">
      <table class="w-full text-left text-sm">
        <thead class="bg-surface-raised text-text font-display">
          <tr>
            <th class="px-4 py-3 font-semibold">Status</th>
            <th class="px-4 py-3 font-semibold">Directives & helpers</th>
          </tr>
        </thead>
        <tbody class="divide-border text-text-muted divide-y">
          <tr>
            <td class="px-4 py-3 font-medium text-emerald-400">Stable</td>
            <td class="px-4 py-3">
              <code>provideMovement</code>, <code>MOVEMENT_DIRECTIVES</code>, <code>[move]</code>,
              <code>[moveAnimate]</code>, <code>moveEnter</code>, <code>moveLeave</code>,
              <code>*movePresence</code>, <code>moveStagger</code>, <code>moveWhileHover</code>,
              <code>moveWhileTap</code>, <code>moveWhileFocus</code>, <code>moveInView</code>,
              <code>moveScroll</code>, <code>moveParallax</code>, <code>[moveAnimation]</code>,
              <code>*movePresenceFor</code>, <code>moveVariants</code>, <code>moveText</code>,
              <code>moveLoop</code>, <code>MoveAnimator</code>, <code>moveValue</code>,
              <code>moveTransform</code>, <code>moveSpringValue</code>, presets and icon helpers
            </td>
          </tr>
          <tr>
            <td class="px-4 py-3 font-medium text-amber-400">Stable candidate</td>
            <td class="px-4 py-3">
              <em
                >None currently — the 1.0 freeze pass promoted every candidate. New APIs may land
                here first.</em
              >
            </td>
          </tr>
          <tr>
            <td class="px-4 py-3 font-medium text-rose-400">Experimental</td>
            <td class="px-4 py-3">
              <code>moveLayout</code>, <code>moveDrag</code> (the whole directive),
              <code>moveSmoothScroll</code>, <code>moveTarget</code>, <code>moveTrigger</code>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApiStabilityTable {}
