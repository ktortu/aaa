import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, contentChild, model, output } from '@angular/core';
import { Combobox, ComboboxPopup, ComboboxWidget } from '@angular/aria/combobox';
import { Listbox, Option } from '@angular/aria/listbox';
import { FormValueControl } from '@angular/forms/signals';
import { KtField } from '../field/field';
import { KtFieldControl } from '../field/field-control';
import { KtBaseSelect } from '../base-select/base-select';
import { KtSelectOptionDef, KtSelectTriggerDef } from './select-option-def';

export type { KtKeyish } from '../base-select/base-select';

/** Payload de l'évènement `selectionChange` d'un `kt-select`. */
export interface KtSelectSelectionChange<T, V = T> {
  /** Valeur émise : clé extraite ou objet entier (`null` si la sélection est effacée). */
  value: V | null;
  /** Option correspondante (`null` si la sélection est effacée). */
  option: T | null;
}

/** Select single (« select-only combobox » WAI-ARIA) bâti sur `@angular/aria`.
    Choix dans une liste fermée, sans saisie. Présentation responsive (un seul Popover, CSS @media) :
    desktop = dropdown ancré (focus sur le trigger / activedescendant) ; téléphone tactile = bottom-sheet
    en bas d'écran (focusMode 'roving', options réellement focusables, scrim ::backdrop, cibles ≥44px).
    Composé avec `Field` ; s'intègre aux Signal Forms via `[formField]`.
    Tout le commun (popup, filtre, clavier, drag-to-dismiss) vit dans `BaseSelect`.

    @template T Type d'une option (élément du tableau `options`).
    @template V Type de la valeur émise (défaut `T` ; clé extraite si `optionValue` est fourni).

    @example
    ```html
    <kt-select
      [options]="users"
      optionLabel="name"
      optionValue="id"
      [(value)]="selectedId"
      (selectionChange)="onSelectionChange($event)" />
    ``` */
@Component({
  selector: 'kt-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './select.html',
  styleUrl: '../styles/select-panel.css',
  imports: [KtField, KtFieldControl, NgTemplateOutlet, Combobox, ComboboxPopup, ComboboxWidget, Listbox, Option],
})
export class KtSelect<T, V = T> extends KtBaseSelect<T, V> implements FormValueControl<V | null> {
  // --- Modèle / sortie ---
  /** Valeur sélectionnée (clé extraite, ou objet entier si `optionValue` est omis ; `null` si rien). @default null */
  readonly value = model<V | null>(null);
  /** Émis à chaque sélection. Payload : `{ value, option }` — `value` est la valeur émise (clé ou objet),
      `option` l'objet option correspondant (`null` si la sélection est effacée). */
  readonly selectionChange = output<KtSelectSelectionChange<T, V>>();

  // --- Templates projetés (typés via ngTemplateContextGuard) ---
  protected readonly optionDef = contentChild(KtSelectOptionDef);
  protected readonly triggerDef = contentChild(KtSelectTriggerDef);

  /** Fermer le popup après une sélection (sémantique single ; le multi reste ouvert). */
  private readonly closeOnSelect = computed(() => this.config?.closeOnSelect ?? true);

  /** Affiche le bouton « effacer » (×) sur le champ dès qu'une valeur est présente (`clearable`).
      Basé sur `value()` et non `selectedOption()` : une clé orpheline (option retirée des données)
      reste effaçable. */
  protected readonly showClear = computed(
    () => this.clearable() && !this.disabled() && !this.readonly() && this.value() !== null,
  );

  /** Option correspondant à la valeur courante (clé extraite, ou objet si `optionValue` est omis). */
  protected readonly selectedOption = computed<T | null>(() => {
    const v = this.value();
    if (v === null || v === undefined) return null;
    const opts = this.options();
    if (this.optionValue() !== undefined) {
      return opts.find((o) => this.keyOf(o) === (v as unknown)) ?? null;
    }
    const cmp = this.comparator();
    return opts.find((o) => cmp(o, v as unknown as T)) ?? (v as unknown as T);
  });

  /** Valeur du listbox : tableau de clés (0 ou 1 élément en single). */
  protected override readonly listboxValue = computed<unknown[]>(() => {
    const opt = this.selectedOption();
    return opt === null ? [] : [this.keyOf(opt)];
  });

  protected override onListboxValueChange(keys: readonly unknown[]): void {
    // Purge interne du Listbox quand le filtre masque l'option sélectionnée (la lib vide sa
    // valeur dès que l'item n'est plus rendu) : pas un geste utilisateur, on l'ignore.
    if (keys.length === 0 && this.isSelectionFilteredOut()) return;
    const key = keys.length > 0 ? keys[0] : null;
    if (key === null || key === undefined) {
      this.commitSelection(null);
      return;
    }
    const option = this.options().find((o) => this.keyOf(o) === key) ?? null;
    this.commitSelection(option);
  }

  /** La sélection courante est-elle masquée par le filtre ou la troncation ? (≠ retirée des données). */
  private isSelectionFilteredOut(): boolean {
    if (!this.filterable()) return false;
    const selected = this.selectedOption();
    if (selected === null) return false;
    const key = this.keyOf(selected);
    return !this.displayedOptions().some((option) => this.keyOf(option) === key);
  }

  private commitSelection(option: T | null): void {
    const out =
      option === null ? null : this.optionValue() !== undefined ? (this.keyOf(option) as V) : (option as unknown as V);
    this.value.set(out);
    this.touched.set(true);
    this.selectionChange.emit({ value: out, option });
    if (this.closeOnSelect()) {
      this.expanded.set(false);
      this.refocusTriggerAfterFilterClose();
    }
  }

  /** Efface la sélection depuis le champ (bouton `clearable`) et rend le focus au trigger. */
  protected clearSelection(): void {
    if (!this.showClear()) return;
    this.commitSelection(null);
    this.triggerEl()?.nativeElement.focus();
  }
}
