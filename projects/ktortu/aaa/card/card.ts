import {
  DestroyRef,
  Directive,
  ElementRef,
  InjectionToken,
  PLATFORM_ID,
  Provider,
  booleanAttribute,
  contentChild,
  effect,
  inject,
  input,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { KT_AUDIT_ENABLED } from '@ktortu/aaa/cdk';
import { KtCardLink } from './card-structure';

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
export class KtCard {
  private readonly config = inject(KT_CARD_CONFIG, { optional: true });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly platformId = inject(PLATFORM_ID);
  private readonly auditEnabled = inject(KT_AUDIT_ENABLED);

  /** Référence réactive sur le lien primaire de la carte */
  readonly cardLink = contentChild(KtCardLink, { descendants: true });

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

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.isDestroyed = true;
    });

    // Garde-fou a11y : une carte interactive sans cible cliquable affiche une
    // affordance trompeuse (hover/focus) qui ne mène à rien (WCAG 1.3.1).
    effect(() => {
      if (this.isDestroyed) return;
      if (!isPlatformBrowser(this.platformId)) return;
      if (!this.auditEnabled || !this.interactive()) return;

      const hasTarget = this.host.matches('a, button') || !!this.cardLink();
      if (!hasTarget) {
        console.warn(
          '[ktCard] interactive sans cible cliquable : ajoutez un [ktCardLink] (lien/bouton ' +
            'primaire) ou posez [ktCard] sur un <a>/<button> — sinon l’affordance est trompeuse.',
        );
      }
    });
  }
}
