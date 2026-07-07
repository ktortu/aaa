import { Component, inject, computed, effect } from '@angular/core';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { KtLayoutService } from './layout.service';

/**
 * Composant représentant le panneau latéral de navigation.
 * Se comporte comme un tiroir (drawer) superposé sur mobile, et comme un
 * menu latéral persistant (réductible ou masquable) sur ordinateur.
 */
@Component({
  selector: 'kt-sidenav',
  standalone: true,
  imports: [CdkTrapFocus],
  host: {
    class: 'kt-sidenav',
    '[class.is-hidden]': 'isHidden()',
    '[class.is-rail]': 'layout.isRail()',
    '[class.is-mobile-open]': 'layout.isMobileOpen()',
    '[attr.aria-expanded]': 'layout.isExpanded()',
    '[attr.aria-hidden]': 'isHidden()',
    role: 'navigation',
  },
  hostDirectives: [CdkTrapFocus],
  template: `<ng-content></ng-content>`,
})
export class KtSidenavComponent {
  protected readonly layout = inject(KtLayoutService);
  protected readonly isHidden = computed(() => this.layout.isHidden());
  private readonly trapFocus = inject(CdkTrapFocus);

  constructor() {
    effect(() => {
      this.trapFocus.autoCapture = this.layout.isMobileOpen();
      this.trapFocus.enabled = this.layout.isMobileOpen();
    });
  }
}
