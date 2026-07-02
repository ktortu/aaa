import { ChangeDetectionStrategy, Component, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DialogRef } from '@angular/cdk/dialog';
import { KtButton, KtButtonColor } from '@ktortu/aaa/button';

import { KtDialogImports, defineKtDialog } from './public-api';

/**
 * Configuration pour l'ouverture d'une boîte de dialogue d'alerte simple.
 */
export interface KtAlertData {
  /** Titre de la boîte de dialogue. */
  title: string;
  /**
   * Message explicatif. Peut être une simple chaîne de caractères
   * ou un tableau de chaînes pour composer plusieurs paragraphes.
   * Supporte le HTML (balises sécurisées) désinfecté à l'affichage.
   */
  message: string | string[];
  /** Libellé du bouton de fermeture. Par défaut: 'Fermer'. */
  closeLabel?: string;
}

const alertDialog = defineKtDialog<KtAlertData, void>();

/**
 * Composant interne d'alerte générique.
 * Affiche un titre, un message (simple ou multiligne HTML) et un bouton de fermeture.
 */
@Component({
  selector: 'kt-alert-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KtButton, KtDialogImports],
  template: `
    <h2 ktDialogTitle>{{ data.title }}</h2>
    <div ktDialogDescription>
      @if (isMessageArray()) {
        @for (line of messageArray(); track line) {
          <p [innerHTML]="line"></p>
        }
      } @else {
        <p [innerHTML]="messageString()"></p>
      }
    </div>
    <footer ktDialogActions>
      <button ktButton ktDialogFocusInitial ktDialogClose>
        {{ data.closeLabel || 'Fermer' }}
      </button>
    </footer>
  `,
})
export class KtAlertDialog {
  protected readonly data = alertDialog.injectData();

  protected isMessageArray(): boolean {
    return Array.isArray(this.data.message);
  }

  protected messageArray(): string[] {
    return Array.isArray(this.data.message) ? this.data.message : [];
  }

  protected messageString(): string {
    return typeof this.data.message === 'string' ? this.data.message : '';
  }
}

/** Ouvreur co-localisé officiel pour l'alerte. Utilise la présentation responsive par défaut. */
export const injectAlertDialog = () => alertDialog.injectOpener(KtAlertDialog, { presentation: 'centered-sheet' });

/** Option de variante visuelle pour le bouton d'action principal. */
export type KtDialogColor = KtButtonColor;

/**
 * Configuration pour l'ouverture d'une boîte de dialogue de confirmation binaire (Oui/Non).
 */
export interface KtConfirmConfig {
  /** Titre de la boîte de dialogue. */
  title: string;
  /**
   * Message explicatif. Peut être une simple chaîne ou un tableau
   * de chaînes de caractères pour composer plusieurs paragraphes.
   * Supporte le HTML désinfecté à l'affichage.
   */
  message: string | string[];
  /** Libellé du bouton de validation. Par défaut: 'Oui'. */
  confirmLabel?: string;
  /** Libellé du bouton de rejet. Par défaut: 'Non'. */
  rejectLabel?: string;
  /**
   * Variante de couleur du bouton principal.
   * Utile pour marquer une action destructive ou critique.
   * Par défaut: 'primary'.
   */
  color?: KtDialogColor;
}

/**
 * Configuration pour une décision ternaire (inclut obligatoirement un bouton d'annulation).
 */
export interface KtDecideConfig extends KtConfirmConfig {
  /** Libellé du bouton d'annulation. Requis. */
  cancelLabel: string;
}

/**
 * Type de retour d'une boîte de dialogue de confirmation ou de décision.
 * - 'confirm' : Choix de validation (Oui / Enregistrer)
 * - 'reject' : Choix de rejet (Non / Ignorer)
 * - 'cancel' : Choix d'annulation (Annuler)
 */
export type KtConfirmResult = 'confirm' | 'reject' | 'cancel';

const confirmDialog = defineKtDialog<KtDecideConfig, KtConfirmResult>();

/**
 * Composant interne de confirmation/décision générique.
 * Supporte le mode binaire (Oui/Non) et le mode ternaire (Oui/Non/Annuler).
 * Gère l'empilement vertical des boutons et les messages HTML multi-lignes.
 */
@Component({
  selector: 'kt-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KtButton, KtDialogImports],
  template: `
    <h2 ktDialogTitle>{{ data.title }}</h2>
    <div ktDialogDescription>
      @if (isMessageArray()) {
        @for (line of messageArray(); track line) {
          <p [innerHTML]="line"></p>
        }
      } @else {
        <p [innerHTML]="messageString()"></p>
      }
    </div>
    <footer ktDialogActions>
      @if (data.cancelLabel) {
        <button ktButton mode="text" ktDialogFocusInitial (click)="cancel()">
          {{ data.cancelLabel }}
        </button>
        <button ktButton mode="text" (click)="reject()">
          {{ data.rejectLabel || 'Non' }}
        </button>
      } @else {
        <button ktButton mode="text" ktDialogFocusInitial (click)="reject()">
          {{ data.rejectLabel || 'Non' }}
        </button>
      }
      <button ktButton [color]="data.color || 'primary'" (click)="confirm()">
        {{ data.confirmLabel || 'Oui' }}
      </button>
    </footer>
  `,
})
export class KtConfirmDialog {
  protected readonly data = confirmDialog.injectData();
  private readonly ref = confirmDialog.injectRef();

  protected isMessageArray(): boolean {
    return Array.isArray(this.data.message);
  }

  protected messageArray(): string[] {
    return Array.isArray(this.data.message) ? this.data.message : [];
  }

  protected messageString(): string {
    return typeof this.data.message === 'string' ? this.data.message : '';
  }

  protected confirm(): void {
    this.ref.close('confirm');
  }

  protected reject(): void {
    this.ref.close('reject');
  }

  protected cancel(): void {
    this.ref.close('cancel');
  }
}

/** Ouvreur co-localisé officiel pour la confirmation/décision. Utilise la présentation responsive par défaut. */
export const injectConfirmDialog = () =>
  confirmDialog.injectOpener(KtConfirmDialog, { presentation: 'centered-sheet' });

/**
 * Service d'aide global pour l'ouverture simplifiée de boîtes de dialogue d'alerte et de confirmation.
 * S'appuie sur les ouvreurs de dialogues officiels co-localisés.
 * Propose une présentation adaptative (centrée sur grand écran, bottom-sheet sur mobile).
 */
@Injectable({
  providedIn: 'root',
})
export class KtQuickDialog {
  private readonly openAlert = injectAlertDialog();
  private readonly openConfirm = injectConfirmDialog();

  /**
   * Ouvre une boîte de dialogue d'alerte simple.
   *
   * @param title Titre de l'alerte.
   * @param message Message d'explication (string simple ou tableau de strings pour du multi-lignes HTML).
   * @param closeLabel Libellé du bouton de fermeture.
   * @returns La référence DialogRef de la modale ouverte.
   */
  alert(title: string, message: string | string[], closeLabel?: string): DialogRef<void, KtAlertDialog> {
    return this.openAlert({ title, message, closeLabel });
  }

  /**
   * Ouvre une boîte de dialogue de confirmation binaire (Oui/Non).
   *
   * @param config Options de configuration (titre, message, libellés de boutons, couleur).
   * @returns Un Observable émettant true si l'utilisateur valide (Oui),
   *          false s'il rejette (Non), et undefined si la boîte est fermée en cliquant en dehors ou via Échap.
   */
  confirm(config: KtConfirmConfig): Observable<boolean | undefined> {
    const dialogRef = this.openConfirm({
      ...config,
      cancelLabel: '', // Pas de bouton d'annulation en mode binaire
    });

    return dialogRef.closed.pipe(
      map((result) => {
        if (result === 'confirm') return true;
        if (result === 'reject') return false;
        return undefined;
      }),
    );
  }

  /**
   * Ouvre une boîte de dialogue de décision ternaire (Oui/Non/Annuler).
   *
   * @param config Options de configuration (titre, message, libellés de boutons dont cancelLabel obligatoire).
   * @returns Un Observable émettant 'confirm', 'reject', 'cancel' ou undefined si fermeture externe.
   */
  decide(config: KtDecideConfig): Observable<KtConfirmResult | undefined> {
    const dialogRef = this.openConfirm(config);
    return dialogRef.closed;
  }
}
