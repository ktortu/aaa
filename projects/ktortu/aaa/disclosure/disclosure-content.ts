import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { KT_DISCLOSURE } from './disclosure-token';

/**
 * Panneau repliable d'un [ktDisclosure]. **Composant** (et non directive) car l'animation grid
 * `0fr ↔ 1fr` exige un **unique enfant `overflow:hidden`** autour du contenu projeté — ce wrapper
 * (`.kt-disclosure-content__inner`) est fourni by le template, le consommateur reste libre d'y
 * mettre autant de blocs qu'il veut.
 *
 * Porte l'`id` (cible de `aria-controls`) et passe **`inert`** quand c'est fermé : le contenu
 * masqué sort de l'ordre de tabulation et de l'arbre d'accessibilité (jamais de focus dans
 * l'invisible). Pas de `role=region` (anti-pollution du rotor de régions). Cf. ADR-0004.
 *
 * @example
 * ```html
 * <kt-disclosure-content>
 *   <p>Premier bloc</p>
 *   <p>Second bloc…</p>
 * </kt-disclosure-content>
 * ```
 */
@Component({
  selector: 'kt-disclosure-content',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<div class="kt-disclosure-content__inner"><ng-content /></div>',
  host: {
    '[id]': 'disclosure.contentId',
    '[attr.inert]': '!disclosure.expanded() ? "" : null',
    '[attr.data-expanded]': 'disclosure.expanded()',
  },
})
export class KtDisclosureContent {
  readonly disclosure = inject(KT_DISCLOSURE);
}
