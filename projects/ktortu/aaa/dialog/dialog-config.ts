import { DEFAULT_DIALOG_CONFIG, DialogConfig } from '@angular/cdk/dialog';
import { InjectionToken, Provider } from '@angular/core';

/**
 * Valeurs par défaut orientées AAA pour `@angular/cdk/dialog`.
 * - `ariaModal: true` : explicite (le CDK le laisse OFF par défaut).
 * - `restoreFocus: true` : rend le focus au déclencheur à la fermeture.
 * - `panelClass` / `backdropClass` : crochets de style consommés par `dialog.css`.
 *
 * Pour focaliser un élément précis à l'ouverture (ex. éviter un bouton destructeur),
 * passez `autoFocus: '[ktDialogFocusInitial]'` dans la config d'ouverture et posez la
 * directive `ktDialogFocusInitial` sur la cible.
 *
 * @example
 * ```ts
 * // valeur de base, généralement consommée via provideKtDialogDefaults()
 * provideKtDialogDefaults({ ...KT_DIALOG_AAA_DEFAULTS });
 * ```
 */
export const KT_DIALOG_AAA_DEFAULTS: DialogConfig = {
  role: 'dialog',
  ariaModal: true,
  autoFocus: '[ktDialogFocusInitial]',
  restoreFocus: true,
  hasBackdrop: true,
  panelClass: 'kt-dialog',
  backdropClass: 'kt-dialog__backdrop',
  /* Plafond de largeur posé en STYLE INLINE sur le pane par l'overlay (canal prévu par le CDK).
     Indispensable : le CDK injecte à l'exécution `.cdk-overlay-pane { max-width: 100% }` HORS
     layer, qui bat toute règle de la lib importée via layer() — seul un style inline gagne.
     La custom property garde la thémisation ; `--fullscreen`/`--sheet` la retunent sur leur
     pane (cf. dialog.css). */
  maxWidth: 'var(--dialog-max-width)',
};

/**
 * Enregistre les valeurs par défaut AAA du dialog au niveau application.
 * À ajouter aux `providers` de `app.config.ts`. `overrides` permet d'ajuster sans
 * tout réécrire (ex. `provideKtDialogDefaults({ maxWidth: '40rem' })`).
 *
 * @example
 * ```ts
 * // app.config.ts
 * export const appConfig: ApplicationConfig = {
 *   providers: [provideKtDialogDefaults({ maxWidth: '40rem' })],
 * };
 * ```
 * @param overrides Surcharges partielles fusionnées par-dessus `KT_DIALOG_AAA_DEFAULTS`.
 * @returns Un `Provider` pour le token `DEFAULT_DIALOG_CONFIG`.
 */
export function provideKtDialogDefaults(overrides?: Partial<DialogConfig>): Provider {
  return {
    provide: DEFAULT_DIALOG_CONFIG,
    useValue: { ...KT_DIALOG_AAA_DEFAULTS, ...overrides },
  };
}

/**
 * Options MAISON du dialog (≠ {@link KT_DIALOG_AAA_DEFAULTS}, qui porte la config du CDK).
 * Conforme à l'ADR-0003 : un token `KT_*_CONFIG` par entry-point, défauts anglais neutres,
 * cascade `option d'ouverture ?? token ?? défaut`.
 *
 * Toutes les clés actuelles ne concernent que la présentation `sheet` (préfixe `sheet*`) : sur les
 * présentations `centered` / `fullscreen`, la place d'un bouton de fermeture est un
 * `[ktDialogHeader]`, où on le POSE soi-même, dans le flux. Un usage hors sheet déclenche un
 * avertissement en mode dev.
 */
export interface KtDialogConfig {
  /**
   * Bouton de fermeture AUTO-RENDU en haut de la carte, en présentation `sheet`.
   *
   * Désactivé par défaut, pour une raison de COMPATIBILITÉ, pas d'ergonomie : `[ktDialogHeader]`
   * ne rend aucune croix (c'est une simple rangée flex), mais un dialog qui en compose un y place
   * généralement la sienne à la main. Activer l'option par défaut ferait donc apparaître une
   * DEUXIÈME croix chez ces consommateurs-là sans qu'ils aient rien changé.
   *
   * Recommandé sur toute sheet qui ne pose pas déjà son propre bouton de fermeture en tête.
   * @default false
   */
  sheetCloseButton: boolean;
  /** Nom accessible du bouton de fermeture auto-rendu (WCAG 4.1.2). @default 'Close' */
  sheetCloseLabel: string;
  /** Poignée décorative auto-rendue en présentation `sheet` (ADR-0005). @default true */
  sheetHandle: boolean;
}

/**
 * Défauts effectifs des options maison du dialog. Objet `Required` figé : c'est la SOURCE des
 * valeurs de repli, lue à la fois par l'ouvreur (résolution) et par le conteneur (fusion
 * idempotente), et énumérée par la garde de complétude i18n.
 */
export const DEFAULT_KT_DIALOG_CONFIG: Required<KtDialogConfig> = {
  sheetCloseButton: false,
  sheetCloseLabel: 'Close',
  sheetHandle: true,
};

/**
 * Token des options maison du dialog. Deux usages, un seul chemin de résolution :
 * - **application** : fourni via {@link provideKtDialog} (valeur partielle) ;
 * - **par ouverture** : `injectKtDialogOpener` REFOURNIT ce même token, déjà RÉSOLU, dans
 *   l'injecteur du conteneur (canal `container.providers` du CDK). Le conteneur fusionne
 *   toujours par-dessus {@link DEFAULT_KT_DIALOG_CONFIG} : l'opération est idempotente sur une
 *   valeur déjà résolue, et reste correcte si le conteneur est monté sans passer par l'ouvreur.
 */
export const KT_DIALOG_CONFIG = new InjectionToken<Partial<KtDialogConfig>>('KT_DIALOG_CONFIG');

/**
 * Enregistre les options maison du dialog pour l'application (ou un sous-arbre).
 * Complémentaire de {@link provideKtDialogDefaults}, qui porte la config du CDK : les deux
 * coexistent et ne se recouvrent pas.
 *
 * @example
 * ```ts
 * // app.config.ts — bouton de fermeture sur toutes les bottom-sheets
 * providers: [provideKtDialog({ sheetCloseButton: true })];
 * ```
 * @param config Options partielles fusionnées par-dessus `DEFAULT_KT_DIALOG_CONFIG`.
 * @returns Un `Provider` pour le token `KT_DIALOG_CONFIG`.
 */
export function provideKtDialog(config: Partial<KtDialogConfig>): Provider {
  return { provide: KT_DIALOG_CONFIG, useValue: config };
}

/**
 * Présentation du dialog, CHOISIE EXPLICITEMENT PAR LE DÉVELOPPEUR à l'ouverture (option
 * `presentation` de `injectKtDialogOpener`). Aucune bascule CSS automatique : le dev décide.
 * - `centered`            : toujours centré (ex. confirmation) — DÉFAUT ;
 * - `fullscreen`          : toujours plein écran (desktop compris) ;
 * - `sheet`               : toujours bottom-sheet (desktop compris) ;
 * - `centered-fullscreen` : centré sur desktop, plein écran sur téléphone compact ;
 * - `centered-sheet`      : centré sur desktop, bottom-sheet sur téléphone compact.
 * Les variantes `centered-*` sont résolues EN JS à l'ouverture (signal `KtViewport.isCompact()`), pas par le CSS —
 * la classe CSS finale est donc toujours une présentation CONCRÈTE (centered/fullscreen/sheet).
 */
export type KtDialogPresentation = 'centered' | 'fullscreen' | 'sheet' | 'centered-fullscreen' | 'centered-sheet';

/** panelClass d'une présentation CONCRÈTE (sans variante responsive). */
function concreteDialogPanelClass(p: 'centered' | 'fullscreen' | 'sheet'): string[] {
  if (p === 'fullscreen') return ['kt-dialog', 'kt-dialog--fullscreen'];
  if (p === 'sheet') return ['kt-dialog', 'kt-dialog--sheet'];
  return ['kt-dialog', 'kt-dialog--centered'];
}

/**
 * Résout une `KtDialogPresentation` (responsive comprise) en panelClass concret. Pour les variantes
 * `centered-*`, l'appelant fournit `compact` (= `KtViewport.isCompact()`, largeur seule) — centré
 * sur desktop, plein écran / sheet sur écran compact. Fonction pure (testable sans DOM).
 * Appelée par `injectKtDialogOpener` à chaque ouverture ; exportée pour un usage direct éventuel.
 *
 * @example
 * ```ts
 * resolveKtDialogPanelClass('sheet');               // ['kt-dialog', 'kt-dialog--sheet']
 * resolveKtDialogPanelClass('centered-sheet', true); // bottom-sheet sur écran compact
 * ```
 * @param presentation Présentation choisie par le dev (responsive comprise). Défaut `'centered'`.
 * @param compact `true` quand l'écran est compact (= `KtViewport.isCompact()`), pour résoudre les variantes `centered-*`. Défaut `false`.
 * @returns La liste des classes CSS de la présentation concrète résolue.
 */
export function resolveKtDialogPanelClass(presentation: KtDialogPresentation = 'centered', compact = false): string[] {
  if (presentation === 'centered' || presentation === 'fullscreen' || presentation === 'sheet') {
    return concreteDialogPanelClass(presentation);
  }
  if (presentation === 'centered-fullscreen') {
    return concreteDialogPanelClass(compact ? 'fullscreen' : 'centered');
  }
  return concreteDialogPanelClass(compact ? 'sheet' : 'centered'); // 'centered-sheet'
}
