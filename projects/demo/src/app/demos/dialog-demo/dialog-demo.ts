import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';

import { KtButton } from '@ktortu/aaa/button';
import { CodeBlock } from '../../shared/code-block/code-block';
import { DocSection } from '../../shared/doc-section/doc-section';
import { DocExample } from '../../shared/example/example';
import { PropsTable } from '../../shared/props-table/props-table';
import { TokensTable } from '../../shared/tokens-table/tokens-table';
import { injectConfirmDialog } from './demo-confirm-dialog';
import { injectTermsDialog } from './demo-content-dialog';
import { KtQuickDialog } from '@ktortu/aaa/dialog';
import {
  DIALOG_API_PROPS,
  DIALOG_DIRECTIVE_PROPS,
  DIALOG_HTML_SNIPPET,
  DIALOG_TOKENS,
  DIALOG_TS_SNIPPET,
  DIALOG_SERVICE_SNIPPET,
} from './dialog-demo.data';

/** Page de documentation de la famille dialog (`@ktortu/aaa/dialog`) : directives structurelles +
    ouvreur typé. Les dialogs sont montés dans l'overlay CDK via `injectKtDialogOpener`. */
@Component({
  selector: 'kt-dialog-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KtButton, DocSection, DocExample, CodeBlock, PropsTable, TokensTable],
  templateUrl: './dialog-demo.html',
  styleUrl: './dialog-demo.css',
})
export class DialogDemo {
  protected readonly directiveProps = DIALOG_DIRECTIVE_PROPS;
  protected readonly apiProps = DIALOG_API_PROPS;
  protected readonly tokens = DIALOG_TOKENS;
  protected readonly tsSnippet = DIALOG_TS_SNIPPET;
  protected readonly htmlSnippet = DIALOG_HTML_SNIPPET;
  protected readonly serviceSnippet = DIALOG_SERVICE_SNIPPET;

  // Ouvreurs typés issus des factories CO-LOCALISÉES avec chaque composant de dialog : le contrat
  // (composant + data + résultat) est défini une seule fois là-bas. La présentation et disableClose
  // restent des choix du consommateur, passés à l'appel.
  private readonly openConfirm = injectConfirmDialog();
  private readonly openTerms = injectTermsDialog();
  private readonly dialog = inject(KtQuickDialog);



  /** Dernier résultat renvoyé par le dialog de confirmation (preuve du flux de résultat). */
  protected readonly lastResult = signal<string | null>(null);
  protected readonly serviceResult = signal<string | null>(null);

  protected confirm(): void {
    this.openConfirm({ name: 'rapport-2026.pdf' }).closed.subscribe((result) =>
      this.lastResult.set(result === 'confirm' ? 'Supprimé' : 'Annulé'),
    );
  }

  protected showAlert(): void {
    this.dialog.alert('Attention', 'Votre session va bientôt expirer.');
  }

  protected showConfirm(): void {
    this.dialog
      .confirm({
        title: 'Confirmer la suppression',
        message: [
          'Êtes-vous sûr de vouloir supprimer cet élément ?',
          'Cette action est <strong>irréversible</strong> et détruira définitivement toutes les données associées.'
        ],
        color: 'danger',
        confirmLabel: 'Supprimer',
        rejectLabel: 'Conserver',
      })
      .subscribe((res) => {
        if (res === true) this.serviceResult.set('Supprimé (True)');
        else if (res === false) this.serviceResult.set('Conservé (False)');
        else this.serviceResult.set('Fermé sans choix (Undefined)');
      });
  }


  protected showDecide(): void {
    this.dialog
      .decide({
        title: 'Enregistrer les modifications',
        message: 'Voulez-vous enregistrer vos modifications avant de quitter ?',
        confirmLabel: 'Enregistrer',
        rejectLabel: 'Ignorer',
        cancelLabel: 'Annuler',
      })
      .subscribe((res) => {
        if (res === 'confirm') this.serviceResult.set('Enregistré (Confirm)');
        else if (res === 'reject') this.serviceResult.set('Ignoré (Reject)');
        else if (res === 'cancel') this.serviceResult.set('Annulé (Cancel)');
        else this.serviceResult.set('Fermé sans choix (Undefined)');
      });
  }


  protected showCentered(): void {
    this.openTerms(undefined, { presentation: 'centered' });
  }

  protected showFullscreen(): void {
    this.openTerms(undefined, { presentation: 'fullscreen' });
  }

  protected showSheet(): void {
    this.openTerms(undefined, { presentation: 'sheet' });
  }

  protected showCenteredFullscreen(): void {
    this.openTerms(undefined, { presentation: 'centered-fullscreen' });
  }

  protected showCenteredSheet(): void {
    this.openTerms(undefined, { presentation: 'centered-sheet' });
  }

  protected showLocked(): void {
    this.openTerms(undefined, { disableClose: true });
  }
}

