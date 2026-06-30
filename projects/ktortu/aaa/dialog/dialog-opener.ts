import { DIALOG_DATA, Dialog, DialogConfig, DialogRef } from '@angular/cdk/dialog';
import { ComponentType } from '@angular/cdk/portal';
import { ViewContainerRef, inject } from '@angular/core';
import { KtViewport, KtIdGenerator } from '@ktortu/aaa/cdk';

import { KT_DIALOG_AAA_DEFAULTS, KtDialogPresentation, resolveKtDialogPanelClass } from './dialog-config';
import { KtDialogContainer } from './dialog-container';

/** Config d'ouverture sans le champ `data` (fourni séparément, typé), enrichie de `presentation`. */
export type KtDialogOpenerConfig<D, R, C> = Omit<DialogConfig<D, DialogRef<R, C>>, 'data'> & {
  /** Présentation du dialog (cf. `KtDialogPresentation`) — choisie par le dev. Résolue à CHAQUE
      ouverture : les variantes responsive lisent le signal d'écran compact. Défaut : `'centered'`.
      Combinée à un éventuel `panelClass` additionnel. */
  presentation?: KtDialogPresentation;
};

/**
 * ⚠️ API BAS-NIVEAU — n'utilisez PAS ceci par défaut. Pour implémenter un dialog, passez par
 * {@link defineKtDialog} puis son `injectOpener(...)` : il fixe données + résultat une seule fois et
 * les partage avec `injectData()`/`injectRef()`. N'appelez `injectKtDialogOpener` directement que
 * dans un cas avancé où le contrat groupé de `defineKtDialog` ne convient pas.
 *
 * Crée un ouvreur de dialog typé en contexte d'injection : le contrat (composant + type de `data` +
 * type de résultat + config par défaut) est figé via les génériques `<Composant, Data, Résultat>`
 * (qu'il faut répéter — d'où la préférence pour `defineKtDialog`). L'ouvreur renvoyé est une closure
 * appelable n'importe où dans la classe, 100 % typée, sans nouvel `inject`.
 *
 * Conserve le `ViewContainerRef` du contexte appelant (le dialog hérite donc de l'arbre logique
 * d'injection), reste testable (TestBed fournit `Dialog`) et sans état global (SSR-safe).
 *
 * @param component Composant à monter dans le dialog.
 * @param baseConfig Config d'ouverture par défaut (sans `data`), enrichie de `presentation` ; fusionnée à chaque ouverture.
 * @returns Une closure d'ouverture typée : `() => DialogRef` (sans data) ou `(data, config?) => DialogRef` (avec data).
 * @see {@link defineKtDialog} — la façon recommandée d'obtenir cet ouvreur.
 */
// Surcharge sans data (D = void) : l'ouvreur ne prend aucun argument (la config par défaut suffit).
export function injectKtDialogOpener<C, R = unknown>(
  component: ComponentType<C>,
  baseConfig?: KtDialogOpenerConfig<void, R, C>,
): () => DialogRef<R, C>;
// Surcharge avec data typée.
export function injectKtDialogOpener<C, D, R = unknown>(
  component: ComponentType<C>,
  baseConfig?: KtDialogOpenerConfig<D, R, C>,
): (data: D, config?: KtDialogOpenerConfig<D, R, C>) => DialogRef<R, C>;

export function injectKtDialogOpener<C, D, R = unknown>(
  component: ComponentType<C>,
  baseConfig?: KtDialogOpenerConfig<D, R, C>,
) {
  const dialog = inject(Dialog);
  const viewport = inject(KtViewport);
  // Optionnel : hors d'un arbre de vue (ex. service root), il n'y a pas de ViewContainerRef.
  const viewContainerRef = inject(ViewContainerRef, { optional: true }) ?? undefined;
  const idGen = inject(KtIdGenerator);

  return (data?: D, config?: KtDialogOpenerConfig<D, R, C>): DialogRef<R, C> => {
    // La présentation (choisie par le dev) est résolue ICI, à l'ouverture : les variantes
    // responsive lisent le signal d'écran compact. Le panelClass final = présentation concrète + extras.
    const { presentation, panelClass, ...rest } = { ...baseConfig, ...config };
    const extra = panelClass ? (Array.isArray(panelClass) ? panelClass : [panelClass]) : [];
    // Dédoublonné : une classe déjà fournie par la présentation (ex. `kt-dialog`) et repassée
    // en `panelClass` par le consommateur ne doit pas apparaître deux fois.
    const merged = [...new Set([...resolveKtDialogPanelClass(presentation, viewport.isCompact()), ...extra])];

    const uid = idGen.generateId('dialog');
    const titleId = `kt-dialog-title-${uid}`;
    const descId = `kt-dialog-desc-${uid}`;

    return dialog.open<R, D, C>(component, {
      // Plancher a11y garanti par l'opener (ariaModal/role/restoreFocus/autoFocus…), même si le
      // consommateur n'a pas câblé provideKtDialogDefaults(). `...rest` (config par appel) prime.
      ...KT_DIALOG_AAA_DEFAULTS,
      viewContainerRef,
      container: KtDialogContainer,
      ariaLabelledBy: titleId,
      ariaDescribedBy: descId,
      ...rest,
      panelClass: merged,
      data,
    } as DialogConfig<D, DialogRef<R, C>>);
  };
}

/**
 * Contrat de dialog typé renvoyé par `defineKtDialog` : les trois accès (données, référence,
 * ouvreur) dérivent des MÊMES génériques `D`/`R`, déclarés une seule fois — impossible donc que
 * le type des données ou du résultat diverge entre le composant et l'ouvreur.
 *
 * @template D Type des données injectées (`void` si aucune).
 * @template R Type du résultat renvoyé à la fermeture.
 */
export interface KtDialogContract<D, R> {
  /** Données injectées (à appeler en contexte d'injection DANS le composant de dialog). */
  injectData(): D;
  /** Référence typée du dialog : `close()` n'accepte QUE le résultat `R` (sûreté de fermeture). */
  injectRef(): DialogRef<R>;
  /** Ouvreur typé CO-LOCALISÉ pour ce composant (cf. `injectKtDialogOpener`). */
  injectOpener<C>(
    component: ComponentType<C>,
    baseConfig?: KtDialogOpenerConfig<D, R, C>,
  ): (data: D, config?: KtDialogOpenerConfig<D, R, C>) => DialogRef<R, C>;
}

/**
 * ✅ STRATÉGIE PAR DÉFAUT pour implémenter un dialog `@ktortu/aaa`. Toute nouvelle dialog DOIT être
 * écrite ainsi. N'utilisez `injectKtDialogData` / `injectKtDialogOpener` directement QUE dans un cas
 * avancé non couvert ici.
 *
 * Définit le contrat typé du dialog (données `D` + résultat `R`) en UN SEUL endroit, co-localisé avec
 * le composant. Renvoie trois accès liés aux mêmes types — `injectData()` (données), `injectRef()`
 * (référence dont `close()` n'accepte que `R`) et `injectOpener()` (ouvreur) — d'où l'impossibilité
 * d'une divergence de type entre composant et ouvreur.
 *
 * Recette à copier pour CHAQUE dialog :
 * 1. `interface XxxData { … }` (ou `void` si aucune donnée) ;
 * 2. `const xxxDialog = defineKtDialog<XxxData, Résultat>();` ;
 * 3. dans le composant : `injectData()` pour lire la donnée, `injectRef()` pour fermer avec résultat ;
 * 4. `export const injectXxxDialog = () => xxxDialog.injectOpener(XxxDialog);` (co-localisé) ;
 * 5. côté consommateur : `private readonly openXxx = injectXxxDialog();` (initialiseur de champ).
 *
 * Convention de fermeture : annuler / fermer SANS résultat via la directive `[ktDialogClose]`
 * (→ `undefined`) ; renvoyer un résultat via `ref.close(résultat)` (typé `R`). Passer un résultat par
 * `[ktDialogClose]="x"` reste possible mais N'EST PAS typé (la directive ignore `R`).
 *
 * @example
 * ```ts
 * // ─── rename-dialog.ts : composant + contrat + ouvreur, co-localisés ───
 * export interface RenameData { currentName: string; }
 *
 * const renameDialog = defineKtDialog<RenameData, string>(); // D et R déclarés UNE seule fois
 *
 * @Component({
 *   imports: [KtButton, KtDialogImports],
 *   template: `
 *     <h2 ktDialogTitle>Renommer</h2>
 *     <footer ktDialogActions>
 *       <button ktButton ktDialogClose>Annuler</button>            // ferme sans résultat (undefined)
 *       <button ktButton (click)="submit()">Renommer</button>      // ferme avec résultat typé
 *     </footer>`,
 * })
 * export class RenameDialog {
 *   protected readonly data = renameDialog.injectData();  // RenameData garanti
 *   private readonly ref = renameDialog.injectRef();      // DialogRef<string>
 *   protected submit() { this.ref.close('nouveau-nom'); } // close(result?: string) — typé
 * }
 *
 * export const injectRenameDialog = () => renameDialog.injectOpener(RenameDialog);
 *
 * // ─── consommateur ───
 * private readonly openRename = injectRenameDialog();     // initialiseur de champ = contexte d'injection
 * rename() {
 *   this.openRename({ currentName: 'X' }).closed.subscribe(name => {
 *     // name: string | undefined
 *   });
 * }
 * ```
 */
export function defineKtDialog<D = void, R = unknown>(): KtDialogContract<D, R> {
  return {
    injectData: () => inject<D>(DIALOG_DATA),
    injectRef: () => inject(DialogRef) as DialogRef<R>,
    injectOpener: <C>(component: ComponentType<C>, baseConfig?: KtDialogOpenerConfig<D, R, C>) =>
      injectKtDialogOpener<C, D, R>(component, baseConfig) as (
        data: D,
        config?: KtDialogOpenerConfig<D, R, C>,
      ) => DialogRef<R, C>,
  };
}
