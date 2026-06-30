import { Directive, ElementRef, afterNextRender, inject } from '@angular/core';
import { KT_AUDIT_ENABLED } from '@ktortu/aaa/cdk';

import { KtCard } from './card';

/**
 * En-tête de la carte (rangée flex : média/avatar + titre + éventuelle action). Marqueur
 * structurel sans logique — la mise en forme vit dans `card.css` via `[ktCardHeader]`.
 * L'ÉTIQUETTE accessible reste le titre fourni par le consommateur (`<h3 id>` + `aria-labelledby`
 * sur l'hôte), comme [ktDialogTitle] pour le dialog : on sépare layout et sémantique.
 *
 * @example
 * ```html
 * <header ktCardHeader><h3 id="t1">Titre</h3></header>
 * ```
 */
@Directive({ selector: '[ktCardHeader]' })
export class KtCardHeader {}

/**
 * Média pleine largeur (image/vidéo). Marqueur structurel sans logique : `card.css` lui donne le
 * full-bleed (marge négative = padding de la carte) et `[ktCard]` clippe au rayon quand un média
 * est présent. À envelopper autour d'un `<img ngSrc>` (NgOptimizedImage).
 *
 * @example
 * ```html
 * <div ktCardMedia><img ngSrc="cover.jpg" width="400" height="200" alt="" /></div>
 * ```
 */
@Directive({ selector: '[ktCardMedia]' })
export class KtCardMedia {}

/**
 * Corps de la carte. Marqueur structurel sans logique : la mise en forme (rythme vertical) vit
 * dans `card.css` via `[ktCardContent]`.
 *
 * @example
 * ```html
 * <div ktCardContent>Texte de la carte.</div>
 * ```
 */
@Directive({ selector: '[ktCardContent]' })
export class KtCardContent {}

/**
 * Barre d'actions de la carte (rangée de boutons/liens). Marqueur structurel sans logique :
 * la mise en forme (flex, gap, épinglée en pied) vit dans `card.css` via `[ktCardActions]`.
 *
 * @example
 * ```html
 * <footer ktCardActions><button ktButton>Action</button></footer>
 * ```
 */
@Directive({ selector: '[ktCardActions]' })
export class KtCardActions {}

/**
 * Lien (ou bouton) PRIMAIRE d'une carte interactive : pattern « lien étiré » (Inclusive
 * Components). Un pseudo-élément `::after` couvre toute la carte (cf. `card.css`) → toute la
 * surface est cliquable, SANS imbriquer de contrôles interactifs (anti-pattern WCAG 4.1.2). Les
 * actions secondaires de la carte repassent au-dessus du lien (z-index dans `card.css`).
 *
 * UN SEUL [ktCardLink] par carte. Le focus clavier est porté sur ce lien ; l'anneau de focus est
 * relayé sur toute la carte (`[ktCard]:has([ktCardLink]:focus-visible)`).
 *
 * Quand la carte ancêtre est `disabled`, le lien sort de l'ordre de tabulation (`tabindex="-1"`)
 * et est annoncé `aria-disabled` : une carte inerte ne piège pas le focus clavier (WCAG 2.4.3).
 *
 * @example
 * ```html
 * <article ktCard interactive>
 *   <div ktCardContent>
 *     <h3 id="t1">Titre</h3>
 *     <a ktCardLink routerLink="/detail" aria-labelledby="t1">Voir le détail</a>
 *   </div>
 * </article>
 * ```
 */
@Directive({
  selector: 'a[ktCardLink], button[ktCardLink]',
  host: {
    '[attr.aria-disabled]': 'card?.disabled() ? "true" : null',
    '[attr.tabindex]': 'card?.disabled() ? "-1" : null',
    '(click)': 'handleClick($event)',
  },
})
export class KtCardLink {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly auditEnabled = inject(KT_AUDIT_ENABLED);
  /**
   * Carte ancêtre, injectée optionnellement via `inject(Card, { optional: true })` (DI par
   * hiérarchie d'éléments) : `null` si [ktCardLink] est utilisé hors d'une [ktCard]. Sert à relayer
   * l'état `disabled` de la carte (aria-disabled / tabindex) sans planter hors contexte.
   */
  protected readonly card = inject(KtCard, { optional: true });

  handleClick(event: Event): void {
    if (this.card?.disabled()) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  constructor() {
    // Garde-fou a11y : un lien étiré sans nom accessible n'est pas annonçable.
    afterNextRender(() => {
      if (!this.auditEnabled) return;

      const hasName =
        !!this.host.textContent?.trim() ||
        !!this.host.getAttribute('aria-label')?.trim() ||
        this.host.hasAttribute('aria-labelledby');
      if (!hasName) {
        console.warn(
          '[ktCardLink] lien sans nom accessible : ajoutez du texte visible, [attr.aria-label] ' +
            'ou aria-labelledby (WCAG 2.4.4 / 4.1.2).',
        );
      }
    });
  }
}
