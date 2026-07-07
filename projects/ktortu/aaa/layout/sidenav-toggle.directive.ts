import { Directive, inject } from '@angular/core';
import { KtLayoutService } from './layout.service';

/**
 * Directive applicable sur n'importe quel élément (souvent un bouton) pour basculer
 * l'état d'ouverture du panneau latéral (Sidenav).
 *
 * Expose l'état du layout pour des utilisations dynamiques dans le template
 * (ex: changer l'icône selon l'état).
 *
 * @example
 * ```html
 * <button ktSidenavToggle #btn="ktSidenavToggle" [icon]="btn.isRail() ? 'right' : 'left'">
 * ```
 */
@Directive({
  selector: '[ktSidenavToggle]',
  exportAs: 'ktSidenavToggle',
  standalone: true,
  host: {
    '(click)': 'onClick()',
  },
})
export class KtSidenavToggleDirective {
  private readonly layout = inject(KtLayoutService);

  /** Indique si le menu est actuellement réduit en mode rail. */
  readonly isRail = this.layout.isRail;

  /** Indique si le menu est actuellement complètement étendu sur bureau. */
  readonly isExpanded = this.layout.isExpanded;

  /** Indique si le menu est totalement masqué. */
  readonly isHidden = this.layout.isHidden;

  /** Indique si le tiroir est actuellement ouvert par-dessus le contenu (mobile). */
  readonly isMobileOpen = this.layout.isMobileOpen;

  /** Indique si l'écran actuel est de taille compacte (mobile). */
  readonly isMobile = this.layout.isMobile;

  onClick() {
    this.layout.toggle();
  }
}
