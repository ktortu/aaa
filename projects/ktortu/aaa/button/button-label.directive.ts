import { Directive } from '@angular/core';

/**
 * Libellé textuel pour un bouton `[ktButton]`.
 * Permet de masquer visuellement le texte de façon accessible (WCAG 4.1.2 / 2.5.3)
 * lorsque le bouton bascule en mode compact / icône seule (`iconOnly` ou `collapseCompact`).
 *
 * @example
 * ```html
 * <button ktButton icon="download" collapseCompact>
 *   <span ktButtonLabel>Télécharger</span>
 * </button>
 * ```
 */
@Directive({
  selector: '[ktButtonLabel], .kt-button-label',
  host: {
    class: 'kt-button-label',
  },
})
export class KtButtonLabel {}
