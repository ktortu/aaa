import { DEFAULT_DIALOG_CONFIG, DialogConfig } from '@angular/cdk/dialog';
import { Provider } from '@angular/core';

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
  return ['kt-dialog'];
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
