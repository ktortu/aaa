import { DestroyRef, Directive, ElementRef, inject } from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';

import { createKtSheetDrag } from '@ktortu/aaa/cdk';

/**
 * En-tête RICHE et OPTIONNEL du dialog : rangée flex pour composer une icône, le titre et/ou un
 * bouton de fermeture. Marqueur structurel sans logique — la mise en forme (flex, padding de
 * région, reset du padding du [ktDialogTitle] qu'il enveloppe) vit dans `dialog.css`.
 *
 * Sépare le LAYOUT (cette région) de l'ÉTIQUETTE ACCESSIBLE ([ktDialogTitle], qui garde
 * aria-labelledby). En usage simple — titre nu sans header — [ktDialogTitle] conserve son propre
 * padding : ce header n'est à utiliser que pour les en-têtes composés (icône, close top-right…).
 *
 * @example
 * ```html
 * <header ktDialogHeader>
 *   <h2 ktDialogTitle>Titre</h2>
 *   <button ktButton ktDialogClose aria-label="Fermer">✕</button>
 * </header>
 * ```
 */
@Directive({ selector: '[ktDialogHeader]' })
export class KtDialogHeader {}

/**
 * Zone de contenu du dialog. Marqueur structurel sans logique : la mise en forme
 * (rythme vertical) vit dans `dialog.css` via le sélecteur `[ktDialogContent]`.
 *
 * @example
 * ```html
 * <div ktDialogContent>…</div>
 * ```
 */
@Directive({ selector: '[ktDialogContent]' })
export class KtDialogContent {}

/**
 * Barre d'actions du dialog (rangée de boutons). Marqueur structurel sans logique :
 * la mise en forme (flex, gap, sticky bas pour le Reflow AAA) vit dans `dialog.css`
 * via le sélecteur `[ktDialogActions]`.
 *
 * @example
 * ```html
 * <footer ktDialogActions>
 *   <button ktButton ktDialogClose>Annuler</button>
 *   <button ktButton [ktDialogClose]="'ok'">Valider</button>
 * </footer>
 * ```
 */
@Directive({ selector: '[ktDialogActions]' })
export class KtDialogActions {}

/**
 * Marque l'élément à focaliser à l'ouverture. À coupler avec la config CDK
 * `autoFocus: '[ktDialogFocusInitial]'` (incluse dans `provideKtDialogDefaults`).
 * Permet d'éviter que le focus initial tombe sur une action destructrice.
 *
 * @example
 * ```html
 * <input ktDialogFocusInitial type="text" />
 * ```
 */
@Directive({ selector: '[ktDialogFocusInitial]' })
export class KtDialogFocusInitial {}

/**
 * Poignée de préhension d'un dialog en mode `sheet` (bottom-sheet) : drag-to-dismiss vers le bas,
 * FACTORISÉ avec le Select via `createKtSheetDrag` (@ktortu/aaa). Geste DOUBLÉ par Échap + bouton
 * Fermer + clic sur le scrim (WCAG 2.5.1) — décoratif (`aria-hidden`).
 *
 * À poser sur la barre de préhension, premier enfant du contenu d'un dialog ouvert avec une
 * présentation `sheet` / `centered-sheet`. Le drag n'est actif que si le dialog est EFFECTIVEMENT
 * en mode sheet (la pane porte `kt-dialog--sheet`) — pas de dépendance au viewport : un `sheet`
 * toujours-bottom-sheet se drague aussi à la souris.
 *
 * @example
 * ```html
 * <div ktDialogContent>
 *   <div ktDialogSheetHandle></div>
 *   …
 * </div>
 * ```
 */
@Directive({
  selector: '[ktDialogSheetHandle]',
  host: {
    '(pointerdown)': 'onStart($event)',
    '(mousedown)': '$event.preventDefault()',
    'aria-hidden': 'true',
  },
})
export class KtDialogSheetHandle {
  private readonly dialogRef = inject<DialogRef<unknown>>(DialogRef, { optional: true });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly destroyRef = inject(DestroyRef);

  // La feuille translatée = le conteneur CDK (position:fixed en mode sheet), trouvé en remontant.
  private readonly drag = createKtSheetDrag({
    pane: () => this.host.closest<HTMLElement>('.cdk-dialog-container'),
    onDismiss: () => this.dialogRef?.close(),
    draggingClass: 'kt-dialog-sheet--dragging',
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.drag.destroy());
  }

  protected onStart(event: PointerEvent): void {
    // Actif seulement quand la PRÉSENTATION choisie par le dev est `sheet` (classe sur la pane).
    const pane = this.host.closest('.cdk-overlay-pane');
    if (!pane?.classList.contains('kt-dialog--sheet')) return;
    this.drag.start(event);
  }
}
