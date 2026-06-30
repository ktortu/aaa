import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { ChipTransitionScope } from './chip-transition-scope';
import { KtIdGenerator } from '@ktortu/aaa/cdk';

/**
 * Pilule individuelle (tag). Utilisable seule (tag statique) ou dans `kt-chip-list`.
 * Le label vient de la projection de contenu ; `removable` ajoute un bouton « retirer »
 * (24px visibles, cible 44px via ::after — technique des boutons icon-only).
 *
 * @example
 * ```html
 * <kt-chip>Angular</kt-chip>
 * <kt-chip removable removeLabel="Retirer Angular" (remove)="onRemove()">Angular</kt-chip>
 * ```
 */
@Component({
  selector: 'kt-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chip.html',
  styleUrl: './chip.css',
  host: {
    class: 'kt-chip',
    // Nommé UNIQUEMENT pendant la transition de SA liste (cf. ChipTransitionScope) : un nom
    // permanent ferait participer tous les chips de la page à chaque View Transition (glissement
    // individuel au moindre reflow). Chip seul (hors liste) : jamais nommé.
    '[style.view-transition-name]': 'scope?.transitioning() ? viewTransitionName : null',
    '[style.view-transition-class]': '"chip-transition"',
  },
})
export class KtChip {
  protected readonly scope = inject(ChipTransitionScope, { optional: true });
  private readonly idGen = inject(KtIdGenerator);
  /** Nom de View Transition propre au chip (détail interne, posé en host binding). */
  protected readonly viewTransitionName = `chip-${this.idGen.generateId('chip')}`;

  /** Affiche le bouton « retirer » (sinon tag statique sans bouton). @default false */
  readonly removable = input(false, { transform: booleanAttribute });
  /** Chip désactivé (bouton « retirer » inactif). @default false */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Libellé accessible du bouton « retirer » (inclure le nom de l'item : « Remove X »). @default 'Remove' */
  readonly removeLabel = input<string>('Remove');
  /** Émis au clic sur le bouton « retirer » (le parent décide de retirer le chip). */
  readonly remove = output<void>();

  private readonly removeBtn = viewChild<ElementRef<HTMLButtonElement>>('removeBtn');

  /**
   * Focus programmatique du bouton « retirer ». Helper de coordination interne (focus management
   * d'`kt-chip-list`), non destiné aux consommateurs.
   * @internal
   */
  focusRemove(): void {
    this.removeBtn()?.nativeElement.focus();
  }
}
