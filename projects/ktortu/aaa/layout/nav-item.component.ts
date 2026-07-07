import { Component, input, inject } from '@angular/core';
import { KtLayoutService } from './layout.service';

@Component({
  selector: 'kt-nav-item',
  standalone: true,
  host: {
    class: 'kt-nav-item',
  },
  template: `
    <div class="kt-nav-item-icon">
      <ng-content select="[kt-icon]"></ng-content>
    </div>
    <div class="kt-nav-item-label">
      {{ label() }}
      <ng-content></ng-content>
    </div>
    <!-- TODO: Add Tooltip component injection here conditionally based on layout.isRail() -->
  `,
})
export class KtNavItemComponent {
  label = input.required<string>();
  protected readonly layout = inject(KtLayoutService);
}
