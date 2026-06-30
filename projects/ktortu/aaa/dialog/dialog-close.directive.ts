import { DialogRef } from '@angular/cdk/dialog';
import { Directive, ElementRef, afterNextRender, inject, input, isDevMode } from '@angular/core';

/**
 * Ferme le CDK Dialog au clic, avec un résultat optionnel renvoyé à l'ouvreur via
 * `DialogRef.close(result)`. Se compose avec `[ktButton]` sur le même `<button>`.
 *
 * Réservé au DISMISS simple (Annuler / Fermer). Pour valider un formulaire, injectez
 * `DialogRef` dans votre composant et appelez `close(valeur)` après validation.
 *
 * @example
 * ```html
 * <button ktButton ktDialogClose>Annuler</button>
 * <button ktButton [ktDialogClose]="'confirm'">Confirmer</button>
 * ```
 */
@Directive({
  selector: '[ktDialogClose]',
  host: {
    '[attr.type]': 'buttonType',
    '(click)': 'close()',
  },
})
export class KtDialogClose {
  private readonly dialogRef = inject<DialogRef<unknown>>(DialogRef, { optional: true });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /**
   * Valeur renvoyée à l'ouvreur via `DialogRef.close(result)`. Liée par l'alias `ktDialogClose`
   * (= nom du sélecteur), d'où l'usage `[ktDialogClose]="'confirm'"`. @default undefined
   */
  readonly dialogResult = input<unknown>(undefined, { alias: 'ktDialogClose' });

  // Force type="button" sur un <button> (évite le submit implicite dans un <form>).
  protected readonly buttonType = this.host.tagName === 'BUTTON' ? 'button' : null;

  constructor() {
    // Garde-fou a11y (dev) : un bouton de fermeture doit avoir un nom accessible (WCAG 4.1.2).
    afterNextRender(() => {
      if (!isDevMode()) return;

      const named =
        (this.host.textContent ?? '').trim().length > 0 ||
        this.host.hasAttribute('aria-label') ||
        this.host.hasAttribute('aria-labelledby');
      if (!named) {
        console.warn(
          '[ktDialogClose] Bouton de fermeture sans nom accessible (WCAG 4.1.2) : ' +
            'ajoutez du texte visible, aria-label ou aria-labelledby.',
        );
      }
    });
  }

  protected close(): void {
    this.dialogRef?.close(this.dialogResult());
  }
}
