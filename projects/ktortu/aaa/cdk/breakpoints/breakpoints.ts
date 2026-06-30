import { InjectionToken, Provider } from '@angular/core';

/**
 * Valeur d'un palier de breakpoint, CONFIGURABLE PAR APPLICATION :
 * - un **nombre** = largeur (px) à partir de laquelle le palier commence ; la lib en dérive une
 *   media query LARGEUR SEULE (bornes calculées par rapport au palier suivant) ;
 * - une **chaîne** = media query complète du palier, utilisée VERBATIM (échappatoire pour un critère
 *   non-largeur : `orientation`, `pointer`, ratio…).
 */
export type KtBreakpointValue = number | string;

/**
 * Seuils responsive de la lib, surchargeables par appli via `provideKtBreakpoints`. Sémantique
 * « plancher de palier » : chaque valeur indique où le palier COMMENCE → 3 bandes mutuellement
 * exclusives (`mobile` < `tablet` < `desktop`).
 */
export interface KtBreakpoints {
  /** Plancher du mobile (typiquement 0). */
  mobile: KtBreakpointValue;
  /** Largeur où commence la tablette (= plafond mobile). */
  tablet: KtBreakpointValue;
  /** Largeur où commence le desktop (= plafond tablette). */
  desktop: KtBreakpointValue;
}

/** Défauts : bascule bottom-sheet sous 600px (aligné sur l'ancien `MOBILE_QUERY`). */
export const KT_DEFAULT_BREAKPOINTS: KtBreakpoints = { mobile: 0, tablet: 600, desktop: 1024 };

/** Token des seuils responsive. Défaut = `KT_DEFAULT_BREAKPOINTS` ; surchargé par `provideKtBreakpoints`. */
export const KT_BREAKPOINTS = new InjectionToken<KtBreakpoints>('KT_BREAKPOINTS', {
  providedIn: 'root',
  factory: () => KT_DEFAULT_BREAKPOINTS,
});

/**
 * À ajouter aux `providers` de `app.config.ts`. Fusionne avec les défauts → surcharge partielle OK.
 * @param overrides Seuils à surcharger ; les clés absentes gardent leur défaut `KT_DEFAULT_BREAKPOINTS`.
 * @returns Provider liant `KT_BREAKPOINTS` aux seuils fusionnés.
 * @example provideKtBreakpoints({ tablet: 768, desktop: 1200 })
 * @example provideKtBreakpoints({ tablet: '(min-width: 768px) and (orientation: landscape)' })
 */
export function provideKtBreakpoints(overrides: Partial<KtBreakpoints>): Provider {
  return { provide: KT_BREAKPOINTS, useValue: { ...KT_DEFAULT_BREAKPOINTS, ...overrides } };
}

/** Trois chaînes de media queries résolues, prêtes pour `matchMedia` / `BreakpointObserver`. */
export interface KtBreakpointMedia {
  /** Media query de la bande mobile. */
  mobile: string;
  /** Media query de la bande tablette. */
  tablet: string;
  /** Media query de la bande desktop. */
  desktop: string;
}

/** Évite le chevauchement d'1px entre deux bandes adjacentes (max-width juste sous le plancher suivant). */
const EPSILON = 0.02;

function minWidth(v: number): string {
  return `(min-width: ${v}px)`;
}

function maxWidth(nextFloor: number): string {
  return `(max-width: ${nextFloor - EPSILON}px)`;
}

/** `not all` ne matche jamais : repli sûr (= desktop) si une bande numérique se retrouve sans borne. */
function join(...parts: string[]): string {
  return parts.filter(Boolean).join(' and ') || 'not all';
}

/**
 * Convertit les seuils (nombres et/ou chaînes) en 3 media queries. Un palier-chaîne est repris
 * verbatim ; un palier-nombre devient la bande `[plancher courant .. plancher suivant[`. Si le
 * plancher suivant est une chaîne (pas de borne numérique), la bande reste ouverte de ce côté.
 * @param bp Seuils responsive à convertir (nombres et/ou chaînes).
 * @returns Les trois media queries résolues (`mobile`, `tablet`, `desktop`).
 * @example resolveKtBreakpointMedia(KT_DEFAULT_BREAKPOINTS)
 */
export function resolveKtBreakpointMedia(bp: KtBreakpoints): KtBreakpointMedia {
  const { mobile, tablet, desktop } = bp;

  return {
    mobile:
      typeof mobile === 'string'
        ? mobile
        : join(mobile > 0 ? minWidth(mobile) : '', typeof tablet === 'number' ? maxWidth(tablet) : ''),
    tablet:
      typeof tablet === 'string'
        ? tablet
        : join(minWidth(tablet), typeof desktop === 'number' ? maxWidth(desktop) : ''),
    desktop: typeof desktop === 'string' ? desktop : minWidth(desktop),
  };
}
