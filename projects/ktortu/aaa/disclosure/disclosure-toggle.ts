import { Directive, ElementRef, afterNextRender, booleanAttribute, inject, input } from '@angular/core';
import { KT_AUDIT_ENABLED } from '@ktortu/aaa/cdk';
import { KtDisclosure } from './disclosure';

/**
 * Déclencheur d'un [ktDisclosure] : posé sur un **vrai `<button>`** (clavier Entrée/Espace
 * gratuit). Câble `(click)` → `toggle()` et reflète l'état via `aria-expanded` / `aria-controls`
 * (cf. ADR-0004). `type="button"` est posé **s'il est absent** (ne pas soumettre un formulaire,
 * sans écraser un `type` explicite du consommateur).
 *
 * Le contenu du bouton appartient au consommateur (texte, icône, libellé piloté par `expanded()`). Un
 * **chevron** décoratif (qui pivote selon l'état) est affiché par défaut ; le désactiver avec
 * `[chevron]="false"`. La directive applique elle-même la classe de style — rien à écrire.
 *
 * @example
 * ```html
 * <button ktDisclosureToggle>Détails</button>                    <!-- avec chevron -->
 * <button ktDisclosureToggle [chevron]="false">Détails</button>  <!-- sans chevron -->
 * ```
 */
@Directive({
  selector: 'button[ktDisclosureToggle]',
  host: {
    '[attr.aria-expanded]': 'disclosure.expanded()',
    '[attr.aria-controls]': 'disclosure.contentId',
    '[class.kt-disclosure-toggle--chevron]': 'chevron()',
    '(click)': 'disclosure.toggle()',
  },
})
export class KtDisclosureToggle {
  readonly disclosure = inject(KtDisclosure);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly auditEnabled = inject(KT_AUDIT_ENABLED);

  /** Affiche le chevron décoratif (qui pivote selon l'état). @default true */
  readonly chevron = input(true, { transform: booleanAttribute });

  constructor() {
    // `type="button"` SI ABSENT (comme @angular/aria) : un attribut statique de host ne surchargerait
    // pas un `type` posé dans le template, donc on le force impérativement à la construction.
    if (!this.host.hasAttribute('type')) {
      this.host.setAttribute('type', 'button');
    }

    afterNextRender(() => {
      if (!this.auditEnabled) return;

      const hasName =
        !!this.host.textContent?.trim() ||
        !!this.host.getAttribute('aria-label')?.trim() ||
        this.host.hasAttribute('aria-labelledby');
      if (!hasName) {
        console.warn(
          '[ktDisclosureToggle] bouton sans nom accessible : ajoutez du texte visible, ' +
            '[attr.aria-label] ou aria-labelledby (WCAG 4.1.2).',
        );
      }
    });
  }
}
