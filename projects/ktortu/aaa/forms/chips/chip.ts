import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
  viewChild,
  forwardRef,
} from '@angular/core';
import { ChipTransitionScope } from './chip-transition-scope';
import { KtIdGenerator } from '@ktortu/aaa/cdk';
import { KtChipListbox } from './chip-listbox';

/**
 * Pilule individuelle (tag). Utilisable seule (tag statique), dans `kt-chip-list` ou dans `kt-chip-listbox`.
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
    '[class.kt-chip--selected]': 'selected()',
    '[attr.role]': 'role()',
    '[attr.aria-selected]': 'listbox ? (selected() ? "true" : "false") : null',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    // Nommé UNIQUEMENT pendant la transition de SA liste (cf. ChipTransitionScope) : un nom
    // permanent ferait participer tous les chips de la page à chaque View Transition (glissement
    // individuel au moindre reflow). Chip seul (hors liste) : jamais nommé.
    '[style.view-transition-name]': 'scope?.transitioning() ? viewTransitionName : null',
    '[style.view-transition-class]': '"chip-transition"',
  },
})
export class KtChip {
  protected readonly scope = inject(ChipTransitionScope, { optional: true });
  protected readonly listbox = inject(
    forwardRef(() => KtChipListbox),
    { optional: true },
  ) as KtChipListbox<unknown> | null;
  private readonly idGen = inject(KtIdGenerator);
  /** Nom de View Transition propre au chip (détail interne, posé en host binding). */
  protected readonly viewTransitionName = `chip-${this.idGen.generateId('chip')}`;

  /** Affiche le bouton « retirer » (sinon tag statique sans bouton). @default false */
  readonly removable = input(false, { transform: booleanAttribute });
  /** Chip désactivé (bouton « retirer » inactif). @default false */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Libellé accessible du bouton « retirer » (inclure le nom de l'item : « Remove X »). @default 'Remove' */
  readonly removeLabel = input<string>('Remove');
  /** État sélectionné unitaire (quand utilisé hors boîte de liste). @default false */
  readonly checked = input(false, { transform: booleanAttribute });
  /** Valeur portée par la puce (utilisée au sein d'un groupe de sélection). */
  readonly value = input<unknown>();
  /** Émis au clic sur le bouton « retirer » (le parent décide de retirer le chip). */
  readonly remove = output<void>();

  private readonly initialRole: string | null;

  /** Rôle d'accessibilité calculé (préserve les rôles statiques comme listitem). */
  protected readonly role = computed(() => {
    if (this.listbox) {
      return 'option';
    }
    return this.initialRole;
  });

  /** Signal consolidé de l'état de sélection (dérivé du parent listbox ou de l'input checked). */
  readonly selected = computed(() => {
    if (this.listbox) {
      return this.listbox.isSelected(this.value());
    }
    return this.checked();
  });

  private readonly removeBtn = viewChild<ElementRef<HTMLButtonElement>>('removeBtn');

  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef);
    // Lit le rôle défini statiquement sur l'élément avant que les host bindings ne s'évaluent
    this.initialRole = el.nativeElement.getAttribute('role');

    el.nativeElement.addEventListener('click', (event) => {
      // Empêche le clic de basculer la sélection si on clique sur le bouton de retrait
      const target = event.target as HTMLElement;
      if (target.closest('.kt-chip__remove')) {
        return;
      }
      if (this.listbox && !this.disabled() && !this.listbox.disabled() && !this.listbox.readonly()) {
        this.listbox.toggle(this.value());
      }
    });
  }

  /**
   * Focus programmatique du bouton « retirer ». Helper de coordination interne (focus management
   * d'`kt-chip-list`), non destiné aux consommateurs.
   * @internal
   */
  focusRemove(): void {
    this.removeBtn()?.nativeElement.focus();
  }
}
