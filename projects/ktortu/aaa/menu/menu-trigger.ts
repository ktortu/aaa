import { Directive, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MenuTrigger as AriaMenuTrigger } from '@angular/aria/menu';
import { KtIdGenerator } from '@ktortu/aaa/cdk';

/**
 * `[ktMenuTrigger]` — sucre de POSITIONNEMENT pour le menu racine. À poser SUR le même élément
 * qu'`[ngMenuTrigger]` (le bouton qui ouvre le menu). Il ne réimplémente RIEN du comportement :
 * l'ouverture/fermeture, `aria-expanded`, Échap, le clic-dehors et le retour de focus sont gérés
 * par aria (`[ngMenuTrigger]`). Sa seule tâche : poser un `anchor-name` sur le trigger et le
 * `position-anchor` correspondant sur la surface du menu, pour que `menu.css` l'ancre en dropdown
 * (CSS Anchor Positioning), comme le popup du Select — sans CDK Overlay (styles scopés conservés,
 * et pas de coordination fragile avec le focus qu'aria pose à l'ouverture).
 *
 * Requiert `[ngMenuTrigger]` sur le même hôte (injecté en `self`).
 *
 * @example
 * ```html
 * <button ngMenuTrigger ktMenuTrigger [menu]="m">Fichier</button>
 * ```
 */
@Directive({
  selector: '[ktMenuTrigger]',
  host: {
    '[style.anchor-name]': 'anchorName',
  },
})
export class KtMenuTrigger {
  private readonly ariaTrigger = inject(AriaMenuTrigger, { self: true });
  private readonly platformId = inject(PLATFORM_ID);

  private readonly idGen = inject(KtIdGenerator);
  protected readonly anchorName = `--kt-menu-anchor-${this.idGen.generateId('menu')}`;

  constructor() {
    effect(() => {
      const menuEl = this.ariaTrigger.menu()?.element;
      if (!menuEl) return;
      if (isPlatformBrowser(this.platformId)) {
        menuEl.style.setProperty('position-anchor', this.anchorName);
      }
    });
  }
}
