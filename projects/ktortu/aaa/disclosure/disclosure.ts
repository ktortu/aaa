import { Directive, ElementRef, afterNextRender, contentChildren, inject, model } from '@angular/core';
import { KT_AUDIT_ENABLED, KtIdGenerator } from '@ktortu/aaa/cdk';
import { KtDisclosureToggle } from './disclosure-toggle';
import { KtDisclosureContent } from './disclosure-content';

/**
 * Disclosure : replie/déplie un **bloc d'interface** (volet d'options, module de dashboard,
 * section d'une fiche produit). Directive HÔTE d'une famille à trois marqueurs — elle possède
 * l'état, génère l'`id` du panneau et expose des méthodes impératives ; le câblage ARIA et
 * l'animation vivent sur `[ktDisclosureToggle]` / `<kt-disclosure-content>`.
 *
 * Pour une **section de contenu** de page (façon Wikipédia / FAQ), préférer `<details>` natif
 * (sémantique, find-in-page, SEO, zéro JS) — cf. ADR-0004.
 *
 * L'état est exposé via `exportAs: 'ktDisclosure'` : lisez `expanded()` pour piloter le template
 * (ex. libellé « Voir plus / Voir moins ») sans input de libellé (i18n côté consommateur,
 * cf. ADR-0003).
 *
 * Contrat : **un** `[ktDisclosureToggle]` et **un** `<kt-disclosure-content>` par hôte (id de
 * panneau unique / `aria-controls` non ambigu) ; un avertissement dev le signale sinon.
 *
 * @example
 * ```html
 * <div ktDisclosure #d="ktDisclosure">
 *   <button ktDisclosureToggle>{{ d.expanded() ? 'Voir moins' : 'Voir plus' }}</button>
 *   <kt-disclosure-content><p>Mon contenu</p></kt-disclosure-content>
 * </div>
 * ```
 */
@Directive({
  selector: '[ktDisclosure]',
  exportAs: 'ktDisclosure',
  host: {
    '[attr.data-expanded]': 'expanded()',
  },
})
export class KtDisclosure {
  private readonly idGen = inject(KtIdGenerator);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** Identifiant stable du panneau contrôlé : cible de l'`aria-controls` du déclencheur. */
  readonly contentId = `kt-disclosure-content-${this.idGen.generateId('disclosure')}`;

  /**
   * État ouvert/fermé. **Toujours utilisé en binding** (`[(expanded)]` / `[expanded]`), jamais en
   * attribut nu : un `model()` n'accepte pas de `booleanAttribute`, donc `<div ktDisclosure expanded>`
   * pousserait la chaîne `''` au lieu de `true`. En binding, la valeur est garantie booléenne.
   * @default false
   */
  readonly expanded = model<boolean>(false);

  private readonly auditEnabled = inject(KT_AUDIT_ENABLED);

  readonly toggles = contentChildren(KtDisclosureToggle, { descendants: true });
  readonly contents = contentChildren(KtDisclosureContent, { descendants: true });

  constructor() {
    // Garde-fou dev : un disclosure = UN toggle + UN panneau.
    afterNextRender(() => {
      if (!this.auditEnabled) return;
      const myToggles = this.toggles().filter((t) => t.disclosure === this);
      const myContents = this.contents().filter((c) => c.disclosure === this);
      if (myToggles.length > 1 || myContents.length > 1) {
        console.warn(
          '[ktDisclosure] attend UN seul [ktDisclosureToggle] et UN seul <kt-disclosure-content> par ' +
            'hôte (id de panneau unique / aria-controls non ambigu). Pour plusieurs volets, utilisez ' +
            'plusieurs [ktDisclosure].',
        );
      }
    });
  }

  /** Bascule l'état. */
  toggle(): void {
    this.expanded.set(!this.expanded());
  }

  /** Ouvre le panneau. */
  expand(): void {
    this.expanded.set(true);
  }

  /** Ferme le panneau. */
  collapse(): void {
    this.expanded.set(false);
  }
}
