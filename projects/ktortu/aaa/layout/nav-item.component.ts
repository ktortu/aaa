import { Component, input, inject } from '@angular/core';
import { KtLayoutService } from './layout.service';

/**
 * Item de navigation : projette une icône dans son slot dédié + un libellé.
 *
 * Le slot d'icône accepte :
 * - la directive `[ktIcon]` (primitive d'icône `@ktortu/aaa/icon`), forme canonique.
 * - l'attribut de projection `kt-icon` (historique/legacy).
 *
 * Note : la classe `.kt-icon` (posée à l'exécution par la directive) n'est PAS un critère de
 * projection valable (ng-content matche la forme statique du template) — d'où le sélecteur d'attribut.
 */
@Component({
  selector: 'kt-nav-item',
  standalone: true,
  host: {
    class: 'kt-nav-item',
  },
  template: `
    <div class="kt-nav-item-icon">
      <ng-content select="[ktIcon], [kt-icon]"></ng-content>
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
