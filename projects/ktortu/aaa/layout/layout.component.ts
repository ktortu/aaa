import { Component, inject, effect, input } from '@angular/core';
import { KtLayoutService } from './layout.service';

/**
 * Composant racine de l'application qui gère la structure de base (Sidebar, Toolbar, Contenu).
 * Configure dynamiquement le comportement du layout.
 */
@Component({
  selector: 'kt-layout',
  standalone: true,
  host: {
    class: 'kt-layout-container',
  },
  template: `
    <ng-content select="kt-sidenav"></ng-content>
    <div class="kt-layout-main-wrapper">
      <ng-content select="kt-toolbar"></ng-content>
      <main class="kt-layout-main" [attr.aria-hidden]="layout.isMobileOpen()">
        <ng-content></ng-content>
      </main>
    </div>
    <div
      class="kt-layout-backdrop"
      [class.is-visible]="layout.isMobileOpen()"
      aria-hidden="true"
      (click)="layout.close()"
    ></div>
  `,
})
export class KtLayoutComponent {
  /**
   * Définit le comportement de la navigation latérale lors de sa fermeture sur bureau (écran large).
   * - `'hidden'` (défaut) : le menu est complètement masqué et retiré du flux visuel/a11y.
   * - `'rail'` : le menu est réduit à une fine barre verticale (mini-sidebar), permettant
   *              d'afficher uniquement les icônes. Idéal si les liens possèdent des icônes explicites.
   */
  readonly desktopCloseBehavior = input<'hidden' | 'rail'>('hidden');
  protected readonly layout = inject(KtLayoutService);

  constructor() {
    effect(
      () => {
        this.layout.desktopCloseBehavior.set(this.desktopCloseBehavior());
      },
      { allowSignalWrites: true },
    );

    effect(
      () => {
        // Clean up mobile state when switching back to desktop
        if (!this.layout.isMobile() && this.layout.isMobileOpen()) {
          this.layout.close();
        }
      },
      { allowSignalWrites: true },
    );
  }
}
