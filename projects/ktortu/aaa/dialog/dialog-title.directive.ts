import { DialogRef } from '@angular/cdk/dialog';
import { Directive, ElementRef, Renderer2, afterNextRender, inject } from '@angular/core';
import { KtIdGenerator } from '@ktortu/aaa/cdk';

/**
 * À poser sur le titre VISIBLE (idéalement un `<h2>`) du contenu d'un CDK Dialog.
 * Câble `aria-labelledby` du conteneur de dialogue.
 *
 * Pourquoi écrire l'attribut directement (Renderer2) plutôt que seulement `_addAriaLabelledBy` :
 * sous change detection ZONELESS (cas par défaut moderne), le `markForCheck()` interne du
 * conteneur ne rafraîchit pas ses host bindings à l'ouverture, donc l'attribut n'apparaîtrait
 * jamais. On écrit donc l'attribut nous-mêmes (fiable, indépendant de la CD) ET on alimente la
 * file CDK pour rester cohérent si un cycle de CD survient ensuite.
 *
 * @example
 * ```html
 * <h2 ktDialogTitle>Renommer le fichier</h2>
 * ```
 */
@Directive({
  selector: '[ktDialogTitle]',
  host: { '[id]': 'id' },
})
export class KtDialogTitle {
  private readonly dialogRef = inject<DialogRef<unknown>>(DialogRef, { optional: true });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly renderer = inject(Renderer2);
  private readonly idGen = inject(KtIdGenerator);

  /**
   * Id de l'hôte câblé en `aria-labelledby` : préserve un id fourni par le consommateur, sinon en génère un.
   * @default `host.id` ?? `dialogRef.config.ariaLabelledBy` ?? `kt-dialog-title-<généré>`
   */
  readonly id =
    this.host.id || this.dialogRef?.config.ariaLabelledBy || `kt-dialog-title-${this.idGen.generateId('dialog')}`;

  constructor() {
    const preConfigured = this.dialogRef?.config.ariaLabelledBy;
    if (!preConfigured) {
      if (this.dialogRef) {
        this.dialogRef.config.ariaLabelledBy = this.id;
      }
      afterNextRender(() => {
        const container = this.host.closest('.cdk-dialog-container');
        if (container) this.renderer.setAttribute(container, 'aria-labelledby', this.id);
      });
    }
  }
}
