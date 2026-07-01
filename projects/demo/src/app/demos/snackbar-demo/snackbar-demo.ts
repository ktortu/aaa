import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { KtButton } from '@ktortu/aaa/button';
import { KtSnackbar, KtSnackbarRef, KtSnackbarVariant } from '@ktortu/aaa/snackbar';

import { CodeBlock } from '../../shared/code-block/code-block';
import { DocSection } from '../../shared/doc-section/doc-section';
import { DocExample } from '../../shared/example/example';
import { PropsTable } from '../../shared/props-table/props-table';
import { TokensTable } from '../../shared/tokens-table/tokens-table';
import { SNACKBAR_API_PROPS, SNACKBAR_CONFIG_PROPS, SNACKBAR_TOKENS, SNACKBAR_TS_SNIPPET } from './snackbar-demo.data';

/** Page de documentation du service snackbar (`@ktortu/aaa/snackbar`) : feedback non bloquant monté
    dans l'overlay CDK, annoncé via le LiveAnnouncer (canal unique), focus jamais déplacé, file FIFO. */
@Component({
  selector: 'kt-snackbar-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, KtButton, DocSection, DocExample, CodeBlock, PropsTable, TokensTable],
  templateUrl: './snackbar-demo.html',
  styleUrl: './snackbar-demo.css',
})
export class SnackbarDemo {
  private readonly snackbar = inject(KtSnackbar);

  protected readonly apiProps = SNACKBAR_API_PROPS;
  protected readonly configProps = SNACKBAR_CONFIG_PROPS;
  protected readonly tokens = SNACKBAR_TOKENS;
  protected readonly tsSnippet = SNACKBAR_TS_SNIPPET;
  protected readonly importsSnippet = `@import '@angular/cdk/overlay-prebuilt.css';
@import '@angular/cdk/a11y-prebuilt.css';
@import '@ktortu/aaa/snackbar.css';`;

  /** Dernière raison de fermeture (preuve du flux `afterDismissed`). */
  protected readonly lastReason = signal<string | null>(null);
  private currentRef: KtSnackbarRef | null = null;

  private track(ref: KtSnackbarRef): void {
    this.currentRef = ref;
    ref.afterDismissed().subscribe((reason) => this.lastReason.set(reason));
  }

  protected openVariant(variant: KtSnackbarVariant): void {
    const messages: Record<KtSnackbarVariant, string> = {
      neutral: 'Brouillon enregistré',
      info: 'Une mise à jour est disponible',
      success: 'Fichier exporté avec succès',
      warning: 'Stockage presque plein',
      error: 'Connexion perdue — nouvelle tentative…',
    };
    this.track(this.snackbar.open(messages[variant], { variant }));
  }

  protected openTop(): void {
    this.track(this.snackbar.open('Ancré en haut de l’écran', { position: 'top' }));
  }

  protected openManual(): void {
    this.track(this.snackbar.open('Mode hors ligne (reste affiché — AAA)', { timing: 'manual' }));
  }

  protected openShort(): void {
    this.track(this.snackbar.open('Disparaît dans 2 s — survolez pour mettre en pause', { duration: 2000 }));
  }

  protected openNonClosable(): void {
    this.track(this.snackbar.open('Sans bouton de fermeture (disparaît seule)', { closable: false }));
  }

  /** Empile 4 messages d'un coup : ils défilent un par un (FIFO), la file étant bornée à 3. */
  protected flood(): void {
    ['Tâche 1 terminée', 'Tâche 2 terminée', 'Tâche 3 terminée', 'Tâche 4 terminée'].forEach((message) =>
      this.track(this.snackbar.open(message, { duration: 1800, variant: 'success' })),
    );
  }

  /** Ouvre 3 fois le MÊME message : la fusion (coalescing) n'en affiche qu'un. */
  protected coalesce(): void {
    for (let i = 0; i < 3; i++) {
      this.track(this.snackbar.open('Sauvegardé', { timing: 'manual' }));
    }
  }

  protected dismissCurrent(): void {
    this.currentRef?.dismiss();
  }
}
