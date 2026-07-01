import {
  AfterContentInit,
  AfterViewInit,
  DestroyRef,
  Directive,
  ElementRef,
  InjectionToken,
  PLATFORM_ID,
  Provider,
  booleanAttribute,
  contentChild,
  effect,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { KT_AUDIT_ENABLED } from '@ktortu/aaa/cdk';

/** Axe "apparence" de la surface. */
export type KtCardVariant = 'elevated' | 'outlined' | 'filled';

/** Défauts applicables à toutes les `[ktCard]` (surchargeables par carte via les inputs). */
export interface KtCardConfig {
  /** Apparence par défaut de la surface. */
  variant: KtCardVariant;
}

export const KT_CARD_CONFIG = new InjectionToken<Partial<KtCardConfig>>('KT_CARD_CONFIG');

/**
 * Fournit des défauts de carte (apparence de surface) pour un sous-arbre ou l'application entière.
 *
 * @example
 * ```ts
 * providers: [provideKtCard({ variant: 'outlined' })]
 * ```
 */
export function provideKtCard(config: Partial<KtCardConfig>): Provider {
  return { provide: KT_CARD_CONFIG, useValue: config };
}

/**
 * Carte : SURFACE de contenu. Directive (pas de composant) posée sur l'élément SÉMANTIQUE choisi
 * par le consommateur (`<article>`, `<section>`, `<li>`, `<a>`…) — la lib n'impose jamais de
 * wrapper non sémantique ni de rôle (cf. précédent Dialog : la sémantique appartient à l'hôte).
 *
 * Trois axes pilotés en `data-*` (même contrat que ktButton) :
 *   - variant      : data-variant = elevated | outlined | filled (apparence)
 *   - interactive  : data-interactive (affordance hover/focus — PAS un rôle ; la cible cliquable
 *                    est un [ktCardLink], lien/bouton primaire au lien étiré)
 *   - disabled     : data-disabled (surface inerte)
 *
 * La mise en forme (layout des marqueurs, lien étiré, états) vit dans `card.css` ; les couleurs
 * et la géométrie dérivent du socle `--kt-*` via `card-tokens.css`.
 *
 * @example
 * ```html
 * <article ktCard variant="outlined" interactive>
 *   <div ktCardContent>
 *     <h3 id="t1">Titre</h3>
 *     <a ktCardLink routerLink="/detail" aria-labelledby="t1">Voir le détail</a>
 *   </div>
 * </article>
 * ```
 */
@Directive({
  selector: '[ktCard]',
  host: {
    '[attr.data-variant]': 'variant()',
    '[attr.data-interactive]': 'interactive() ? "" : null',
    '[attr.data-disabled]': 'disabled() ? "" : null',
  },
})
export class KtCard implements AfterContentInit {
  private readonly config = inject(KT_CARD_CONFIG, { optional: true });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly platformId = inject(PLATFORM_ID);
  private readonly auditEnabled = inject(KT_AUDIT_ENABLED);

  /** Référence réactive sur le lien primaire de la carte */
  readonly cardLink = contentChild<KtCardLink>(
    forwardRef(() => KtCardLink),
    { descendants: true },
  );

  /** Apparence de la surface : `elevated` | `outlined` | `filled`. @default 'elevated' (ou `KT_CARD_CONFIG.variant`) */
  readonly variant = input<KtCardVariant>(this.config?.variant ?? 'elevated');

  /**
   * Affordance visuelle d'élément cliquable (hover/focus). N'AJOUTE pas de rôle : un lien/bouton
   * primaire ([ktCardLink]) porte l'interaction et le nom accessible. @default false
   */
  readonly interactive = input<boolean, unknown>(false, { transform: booleanAttribute });

  /** Rend la surface inerte (état `data-disabled`). @default false */
  readonly disabled = input<boolean, unknown>(false, { transform: booleanAttribute });

  private isDestroyed = false;
  private readonly contentInitialized = signal(false);

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.isDestroyed = true;
    });

    effect(() => {
      if (this.isDestroyed) return;
      if (!isPlatformBrowser(this.platformId)) return;
      if (!this.contentInitialized()) return;
      if (!this.auditEnabled || !this.interactive()) return;

      // Garde-fou a11y : une carte interactive sans cible cliquable affiche une
      // affordance trompeuse (hover/focus) qui ne mène à rien (WCAG 1.3.1).
      const hasTarget = this.host.matches('a, button') || !!this.cardLink();
      if (!hasTarget) {
        console.warn(
          '[ktCard] interactive sans cible cliquable : ajoutez un [ktCardLink] (lien/bouton ' +
            'primaire) ou posez [ktCard] sur un <a>/<button> — sinon l’affordance est trompeuse.',
        );
      }
    });
  }

  ngAfterContentInit(): void {
    this.contentInitialized.set(true);
  }
}

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
 * Components). Un pseudo-élément `::after` covers toute la carte (cf. `card.css`) → toute la
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
export class KtCardLink implements AfterViewInit {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly auditEnabled = inject(KT_AUDIT_ENABLED);
  /**
   * Carte ancêtre, injectée optionnellement via `inject(Card, { optional: true })` (DI par
   * hiérarchie d'éléments) : `null` si [ktCardLink] est utilisé hors d'une [ktCard]. Sert à relayer
   * l'état `disabled` de la carte (aria-disabled / tabindex) sans planter hors contexte.
   */
  protected readonly card = inject<KtCard>(
    forwardRef(() => KtCard),
    { optional: true },
  );

  handleClick(event: Event): void {
    if (this.card?.disabled()) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  ngAfterViewInit(): void {
    // Garde-fou a11y : un lien étiré sans nom accessible n'est pas annonçable.
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
  }
}
