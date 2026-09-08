import { Directive, effect, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MenuItem as AriaMenuItem } from '@angular/aria/menu';
import { KtIdGenerator } from '@ktortu/aaa/cdk';

/**
 * `[ktMenu]` — marqueur de THÈME posé sur l'hôte `[ngMenu]` d'`@angular/aria`. Style UNIQUEMENT la
 * SURFACE du menu (fond, bord, ombre, rayon, padding, positionnement en dropdown ancré). N'ajoute
 * AUCUN rôle ni comportement : la sémantique (`role="menu"`), le clavier, le focus roving, le
 * retour de focus au trigger, les sous-menus et le typeahead viennent intégralement d'aria
 * (`[ngMenu]`). Même philosophie que `[ktCard]` : la lib thématise, aria gère l'accessibilité.
 *
 * La directive n'a pas de logique propre : tout vit dans `menu.css` via le sélecteur `[ktMenu]`,
 * piloté par l'attribut `data-visible` qu'aria pose sur l'hôte (ouvert/fermé). Le positionnement
 * (CSS Anchor Positioning) est câblé par `[ktMenuTrigger]` (menu racine) et par `[ktMenuItem]`
 * (sous-menus) qui posent les `anchor-name` / `position-anchor`.
 *
 * @example
 * ```html
 * <button ngMenuTrigger ktMenuTrigger [menu]="m">Options</button>
 * <div ngMenu ktMenu #m="ngMenu" (itemSelected)="onSelect($event)" aria-label="Options">
 *   <button ngMenuItem ktMenuItem value="new">Nouveau</button>
 * </div>
 * ```
 */
@Directive({ selector: '[ktMenu]' })
export class KtMenu {}

/**
 * `[ktMenuItem]` — marqueur de thème posé sur l'hôte `[ngMenuItem]`. Style la RANGÉE (hauteur de
 * cible tactile ≥44px, focus, survol, désactivé, item de sous-menu avec chevron). Comme `[ktMenu]`,
 * sans logique de sélection : l'état stylé est lu sur les attributs ARIA déjà posés par aria
 * (`:focus-visible` pour l'item actif via focus roving, `[aria-disabled]`, `[aria-expanded]`,
 * `[aria-haspopup]`, `[aria-checked]`).
 *
 * SEULE responsabilité technique : si l'item porte un sous-menu (`[submenu]` côté aria), on câble
 * l'ancrage CSS du sous-menu sur cet item (anchor-name sur l'item, position-anchor sur la surface
 * du sous-menu, marqueur `data-kt-submenu` pour l'ouvrir en latéral plutôt qu'en dropdown).
 *
 * EXIGENCE DE STRUCTURE (sous-menus) : le `[ngMenu]` d'un sous-menu DOIT être un DESCENDANT DOM du
 * menu parent (et non un frère). aria décide de maintenir un menu ouvert via `element.contains()`
 * sur la cible du focus/survol ; un sous-menu placé hors du sous-arbre du parent ferait croire à
 * aria que le focus a quitté le menu et provoquerait sa fermeture dès qu'on survole le sous-menu.
 * Le sous-menu reste rendu en place (top-layer non requis : `position: fixed` + ancrage CSS).
 *
 * @example
 * ```html
 * <button ngMenuItem ktMenuItem value="open">Ouvrir</button>
 * ```
 */
@Directive({
  selector: '[ktMenuItem]',
  host: {
    '[style.anchor-name]': 'anchorName()',
  },
})
export class KtMenuItem {
  // Optionnel : `[ktMenuItem]` reste utilisable seul (simple thème) même hors d'un `[ngMenuItem]`.
  private readonly ariaItem = inject(AriaMenuItem, { self: true, optional: true });
  private readonly platformId = inject(PLATFORM_ID);

  // Alloué à la PREMIÈRE détection d'un sous-menu (et non pour chaque item) : un item simple ne
  // consomme pas d'anchor-name.
  protected readonly anchorName = signal<string | undefined>(undefined);
  private readonly idGen = inject(KtIdGenerator);

  constructor() {
    if (!this.ariaItem) return;

    effect(() => {
      const submenu = this.ariaItem!.submenu()?.element;
      if (!submenu) {
        this.anchorName.set(undefined);
        return;
      }
      const name = this.anchorName() ?? `--kt-submenu-anchor-${this.idGen.generateId('menu')}`;
      this.anchorName.set(name);
      if (isPlatformBrowser(this.platformId)) {
        submenu.style.setProperty('position-anchor', name);
        // Marque la surface comme un SOUS-menu : menu.css l'ouvre en latéral (inline-end) et non
        // sous l'item, avec ses propres fallbacks de débordement.
        submenu.setAttribute('data-kt-submenu', '');
      }
    });
  }
}

/**
 * `[ktMenuSeparator]` — filet de séparation entre groupes d'items. Pose `role="separator"`
 * (sémantique standard d'un séparateur de menu) ; la ligne elle-même vit dans `menu.css`.
 *
 * @example
 * ```html
 * <hr ktMenuSeparator />
 * ```
 */
@Directive({
  selector: '[ktMenuSeparator]',
  host: { role: 'separator' },
})
export class KtMenuSeparator {}
