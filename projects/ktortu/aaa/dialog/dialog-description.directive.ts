import { DialogRef } from '@angular/cdk/dialog';
import { Directive, ElementRef, OnDestroy, OnInit, Renderer2, afterNextRender, inject } from '@angular/core';
import { KtIdGenerator } from '@ktortu/aaa/cdk';

/**
 * À poser sur le paragraphe descriptif COURT du dialog : câble `aria-describedby` du conteneur
 * (texte lu par le lecteur d'écran juste après le titre, à l'ouverture).
 *
 * ⚠️ Ne JAMAIS appliquer sur un formulaire ou un long contenu : `aria-describedby` concatène
 * tout le texte du nœud et serait lu d'un bloc à l'ouverture. Réserver à une phrase de contexte.
 *
 * Écriture directe de l'attribut (Renderer2) pour la même raison que `ktDialogTitle` :
 * fiabilité sous change detection zoneless. La config est tenue à jour pour cohérence CDK.
 *
 * @example
 * ```html
 * <p ktDialogDescription>Cette action est définitive.</p>
 * ```
 */
@Directive({
  selector: '[ktDialogDescription]',
  host: { '[id]': 'id' },
})
export class KtDialogDescription implements OnInit, OnDestroy {
  private readonly dialogRef = inject<DialogRef<unknown>>(DialogRef, { optional: true });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly renderer = inject(Renderer2);
  private readonly idGen = inject(KtIdGenerator);

  /**
   * Id de l'hôte câblé en `aria-describedby` : préserve un id fourni par le consommateur, sinon en génère un.
   * @default `host.id` ?? `dialogRef.config.ariaDescribedBy` ?? `kt-dialog-desc-<généré>`
   */
  readonly id =
    this.host.id || this.dialogRef?.config.ariaDescribedBy || `kt-dialog-desc-${this.idGen.generateId('dialog')}`;

  constructor() {
    const preConfigured = this.dialogRef?.config.ariaDescribedBy;
    if (!preConfigured) {
      if (this.dialogRef) {
        this.dialogRef.config.ariaDescribedBy = this.id;
      }
      afterNextRender(() => {
        const container = this.host.closest('.cdk-dialog-container');
        if (container) this.renderer.setAttribute(container, 'aria-describedby', this.id);
      });
    }
  }

  ngOnInit(): void {
    // Asymétrie ASSUMÉE avec `ktDialogTitle` : la description peut porter un `id` d'hôte fourni par
    // le consommateur ; on aligne alors `config.ariaDescribedBy` dessus (le host binding live du
    // conteneur reflète la valeur). Un titre est posé une fois et n'a pas ce besoin.
    if (this.dialogRef && this.dialogRef.config.ariaDescribedBy !== this.id) {
      this.dialogRef.config.ariaDescribedBy = this.id;
    }
  }

  ngOnDestroy(): void {
    if (this.dialogRef?.config.ariaDescribedBy === this.id) {
      this.dialogRef.config.ariaDescribedBy = null;
    }
    const container = this.host.closest('.cdk-dialog-container');
    if (container && container.getAttribute('aria-describedby') === this.id) {
      this.renderer.removeAttribute(container, 'aria-describedby');
    }
  }
}
