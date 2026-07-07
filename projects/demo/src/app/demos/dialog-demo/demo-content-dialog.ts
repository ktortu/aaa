import { ChangeDetectionStrategy, Component } from '@angular/core';

import { KtButton } from '@ktortu/aaa/button';
import { KtDialogImports, defineKtDialog } from '@ktortu/aaa/dialog';

/** Contrat typé : aucune donnée (`void`), résultat `'accept'`. Déclaré une seule fois. */
const termsDialog = defineKtDialog<void, 'accept'>();

/**
 * Dialog de contenu long, utilisé pour illustrer TOUTES les présentations (centré, plein écran,
 * bottom-sheet, et variantes responsive) — seule la config de l'ouvreur change, jamais ce composant.
 * - en-tête riche `[ktDialogHeader]` : titre + bouton de fermeture ancré en haut à droite ;
 * - poignée `[ktDialogSheetHandle]` : invisible hors mode sheet (la CSS ne la stylé que sous
 *   `.kt-dialog--sheet`), donc présente sans condition ;
 * - `[ktDialogContent]` déborde volontairement pour montrer le défilement et les voiles d'ombre.
 */
@Component({
  selector: 'kt-demo-content-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KtButton, KtDialogImports],
  template: `
    <div ktDialogSheetHandle></div>
    <header ktDialogHeader>
      <h2 ktDialogTitle>Conditions d'utilisation</h2>
      <button ktButton iconOnly icon="close" mode="text" ariaLabel="Fermer" ktDialogClose></button>
    </header>
    <div ktDialogContent>
      <p>
        En poursuivant, vous acceptez les présentes conditions. Faites défiler pour lire l'intégralité du texte avant de
        donner votre accord.
      </p>
      <p>
        Le service est fourni « en l'état ». Vos données sont traitées conformément à la politique de confidentialité,
        et ne sont jamais cédées à des tiers sans votre consentement explicite.
      </p>
      <p>
        Vous restez responsable de la confidentialité de vos identifiants. Toute activité réalisée depuis votre compte
        est réputée effectuée par vous.
      </p>
      <p>
        Les présentes conditions peuvent évoluer. En cas de modification substantielle, vous serez informé et invité à
        accepter de nouveau avant de continuer à utiliser le service.
      </p>
      <p>
        Le titre et la barre d'actions restent visibles pendant le défilement : seul ce contenu défile (Reflow AAA),
        jamais la fenêtre entière.
      </p>
    </div>
    <footer ktDialogActions>
      <button ktButton mode="text" ktDialogClose>Refuser</button>
      <button ktButton ktDialogFocusInitial (click)="accept()">Accepter</button>
    </footer>
  `,
})
export class DemoContentDialog {
  private readonly ref = termsDialog.injectRef();

  protected accept(): void {
    this.ref.close('accept'); // ✅ résultat typé ; « Refuser » ferme sans valeur (undefined)
  }
}

/**
 * Ouvreur typé CO-LOCALISÉ : dérive du contrat `termsDialog` (résultat `'accept'`, pas de `data`).
 * La PRÉSENTATION et `disableClose` restent des choix du consommateur, passés à l'appel :
 * `openTerms(undefined, { presentation: 'sheet' })`.
 */
export const injectTermsDialog = () => termsDialog.injectOpener(DemoContentDialog);
