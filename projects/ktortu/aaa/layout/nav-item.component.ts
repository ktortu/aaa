import { Component, input, inject } from '@angular/core';
import { KtLayoutService } from './layout.service';

/**
 * Item de navigation : projette une icône dans son slot dédié + un libellé.
 *
 * Le slot d'icône accepte deux formes, additives et non exclusives :
 * - l'attribut de projection `kt-icon` (historique) ;
 * - la directive `[ktIcon]` (primitive d'icône `@ktortu/aaa/icon`), qui peint le glyphe.
 *
 * On peut donc projeter un `<span ktIcon="home">` nu, ou combiner les deux
 * (`<span kt-icon [ktIcon]="…">`) pour rester explicite sur l'aiguillage du slot.
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
      <ng-content select="[kt-icon], [ktIcon]"></ng-content>
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
