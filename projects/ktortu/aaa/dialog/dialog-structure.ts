import { Directive, isDevMode } from '@angular/core';

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
 * @deprecated ADR-0005 — la poignée est désormais RENDUE AUTOMATIQUEMENT par `KtDialogContainer`
 * en présentation `sheet` (opt-out : panelClass additionnel `kt-dialog--no-handle`), et le
 * drag-to-dismiss s'attrape sur TOUTE la surface de la sheet (scroll-snap natif). Cette
 * directive est INERTE et son hôte est masqué (évite une double poignée) : retirez-la de vos
 * templates. Sera supprimée dans une prochaine version majeure.
 */
@Directive({
  selector: '[ktDialogSheetHandle]',
  host: {
    'aria-hidden': 'true',
    style: 'display: none',
  },
})
export class KtDialogSheetHandle {
  constructor() {
    if (isDevMode()) {
      console.warn(
        '[ktDialogSheetHandle] déprécié (ADR-0005) : la poignée est rendue automatiquement en ' +
          'présentation sheet et le drag s’attrape partout — retirez la directive de votre template.',
      );
    }
  }
}
