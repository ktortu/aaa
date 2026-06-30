import { ChangeDetectionStrategy, Component } from '@angular/core';

import { KtButton } from '@ktortu/aaa/button';
import { KtDialogImports, defineKtDialog } from '@ktortu/aaa/dialog';

/** Données injectées dans le dialog de confirmation. */
export interface ConfirmData {
  /** Nom de l'élément concerné, repris dans la description. */
  readonly name: string;
}

/** Contrat typé du dialog (données + résultat) déclaré UNE seule fois : données, référence et
    ouvreur en dérivent, donc aucun risque de divergence de type. */
const confirmDialog = defineKtDialog<ConfirmData, 'confirm'>();

/**
 * Dialog de confirmation (présentation centrée) : titre + description courte + barre d'actions.
 * Démontre la donnée injectée typée et le résultat renvoyé à l'ouvreur (`'confirm'` ou `undefined`).
 * Le focus initial est posé sur « Annuler » pour ne pas atterrir sur l'action destructrice.
 *
 * Convention : on ferme SANS valeur pour annuler (`ktDialogClose` → `undefined`) et AVEC un résultat
 * typé via `ref.close(...)` pour confirmer (le `close()` n'accepte que `'confirm'`).
 */
@Component({
  selector: 'kt-demo-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KtButton, KtDialogImports],
  template: `
    <h2 ktDialogTitle>Supprimer le fichier ?</h2>
    <p ktDialogDescription>« {{ data.name }} » sera définitivement supprimé. Cette action est irréversible.</p>
    <footer ktDialogActions>
      <button ktButton mode="text" ktDialogFocusInitial ktDialogClose>Annuler</button>
      <button ktButton color="danger" (click)="confirm()">Supprimer</button>
    </footer>
  `,
})
export class DemoConfirmDialog {
  protected readonly data = confirmDialog.injectData();
  private readonly ref = confirmDialog.injectRef();

  protected confirm(): void {
    this.ref.close('confirm'); // ✅ typé : seul 'confirm' est accepté (ref.close(42) ⇒ erreur TS)
  }
}

/**
 * Ouvreur typé CO-LOCALISÉ : dérive du contrat `confirmDialog`. À appeler en contexte d'injection
 * côté consommateur (`private readonly openConfirm = injectConfirmDialog()`), puis
 * `openConfirm({ name }).closed`.
 */
export const injectConfirmDialog = () => confirmDialog.injectOpener(DemoConfirmDialog);
