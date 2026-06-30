import { InjectionToken, Provider } from '@angular/core';

/** Politesse de l'annonce au lecteur d'écran (relayée à `LiveAnnouncer`). */
export type KtSnackbarPoliteness = 'polite' | 'assertive';

/** Bord d'ancrage de la snackbar dans le viewport. */
export type KtSnackbarPosition = 'top' | 'bottom';

/**
 * Régime temporel de la snackbar :
 * - `'auto'` : disparition automatique après `duration`, **mise en pause au survol et au focus**
 *   clavier (WCAG 1.4.13 / 2.2.1). Conforme **AA**. C'est le défaut.
 * - `'manual'` : **aucune** minuterie, la snackbar reste jusqu'à fermeture explicite
 *   (bouton de fermeture ou `ref.dismiss()`). Conforme **2.2.3 (AAA)** au sens strict.
 *
 * Conformément aux recommandations d'accessibilité (Roselli/Soueidan), la snackbar ne porte **pas
 * d'action interactive** (ex. « Annuler ») : une action auto-disparaissante n'est pas atteignable et
 * une live region n'expose pas ses boutons. Pour un undo, préférez un mécanisme atteignable côté app
 * (Ctrl+Z, bannière persistante).
 */
export type KtSnackbarTiming = 'auto' | 'manual';

/**
 * Variante sémantique de la snackbar. Pilote uniquement l'**apparence** (couleur d'accent + icône),
 * via l'attribut `data-variant` et les tokens CSS `--snackbar-*` — donc entièrement gérée par le
 * thème, sans logique TypeScript. Découplée de la `politeness` (une « erreur » n'est pas forcément
 * une urgence assertive). La couleur n'est jamais le seul indice : chaque variante porte une **icône**
 * de forme distincte (WCAG 1.4.1).
 * - `'neutral'` : pastille neutre, sans icône (défaut) ;
 * - `'info' | 'success' | 'warning' | 'error'` : accent + icône dédiés.
 */
export type KtSnackbarVariant = 'neutral' | 'info' | 'success' | 'warning' | 'error';

/**
 * Défauts de la snackbar, injectables via `provideKtSnackbar` / `KT_SNACKBAR_CONFIG`.
 * Tous les champs sont surchargeables **par appel** via les options de `KtSnackbar.open()`.
 *
 * Résolution en cascade (convention de la lib) : `option d'open ?? KT_SNACKBAR_CONFIG ?? défaut`.
 */
export interface KtSnackbarConfig {
  /**
   * Durée d'affichage en régime `'auto'`. Soit un **nombre fixe** (ms), soit le sentinel
   * **`'reading-time'`** (DÉFAUT) qui **calcule** la durée d'après la longueur du message :
   * `clamp(longueur × readingTimePerChar, readingTimeMin, readingTimeMax)`. Passer un nombre à
   * `open()` force donc une durée fixe pour cet appel.
   *
   * ⚠️ Gardez le message **court** : une snackbar est un message transitoire (pas un paragraphe).
   * Un message long fait grimper la durée jusqu'au plafond `readingTimeMax`.
   * @default 'reading-time'
   */
  duration: number | 'reading-time';
  /** Plancher (ms) de la durée calculée (`'reading-time'`) — laisse le temps de lire un message court. @default 4000 */
  readingTimeMin: number;
  /** Plafond (ms) de la durée calculée (`'reading-time'`) — borne un message long. @default 10000 */
  readingTimeMax: number;
  /** Coefficient de lecture : millisecondes ajoutées par caractère du message. @default 60 (~200 mots/min) */
  readingTimePerChar: number;
  /** Régime temporel (cf. {@link KtSnackbarTiming}). @default 'auto' (AA + pause) */
  timing: KtSnackbarTiming;
  /** Bord d'ancrage dans le viewport. @default 'bottom' */
  position: KtSnackbarPosition;
  /** Politesse de l'annonce lecteur d'écran. @default 'polite' */
  politeness: KtSnackbarPoliteness;
  /** Variante sémantique (apparence seule, cf. {@link KtSnackbarVariant}). @default 'neutral' */
  variant: KtSnackbarVariant;
  /** Affiche un bouton de fermeture (cible 44px, AAA). @default true */
  closable: boolean;
  /** Nom accessible du bouton de fermeture. @default 'Close' (FR fourni en lot L3) */
  closeLabel: string;
  /**
   * Taille maximale de la file FIFO (snackbar affichée + en attente). Au-delà, les **plus anciennes
   * en attente** sont retirées silencieusement. Une seule snackbar est visible à la fois. @default 3
   */
  max: number;
}

/** Défauts AAA-orientés de la snackbar (anglais neutre). */
export const KT_SNACKBAR_DEFAULTS: KtSnackbarConfig = {
  // Stryker disable next-line StringLiteral: équivalent — computeDuration() traite toute valeur non numérique comme reading-time
  duration: 'reading-time',
  readingTimeMin: 4000,
  readingTimeMax: 10000,
  readingTimePerChar: 60,
  timing: 'auto',
  position: 'bottom',
  politeness: 'polite',
  variant: 'neutral',
  closable: true,
  closeLabel: 'Close',
  max: 3,
};

// Stryker disable next-line StringLiteral: libellé de debug du token d'injection (sans effet runtime)
export const KT_SNACKBAR_CONFIG = new InjectionToken<Partial<KtSnackbarConfig>>('KT_SNACKBAR_CONFIG');

/**
 * Options ponctuelles d'ouverture d'une snackbar : un sous-ensemble (toutes facultatives) de la
 * config, prioritaire sur `KT_SNACKBAR_CONFIG` et sur les défauts.
 */
export type KtSnackbarOptions = Partial<KtSnackbarConfig>;

/**
 * Fournit des défauts de snackbar pour un sous-arbre ou l'application entière.
 *
 * @example
 * ```ts
 * // app.config.ts — bascule TOUTE l'app en AAA strict (aucune disparition automatique)
 * providers: [provideKtSnackbar({ timing: 'manual' })]
 * ```
 * @example
 * ```ts
 * providers: [provideKtSnackbar({ duration: 8000, position: 'top' })]
 * ```
 */
export function provideKtSnackbar(config: Partial<KtSnackbarConfig>): Provider {
  return { provide: KT_SNACKBAR_CONFIG, useValue: config };
}
