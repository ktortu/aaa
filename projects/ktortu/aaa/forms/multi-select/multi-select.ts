import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  contentChild,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import { Combobox, ComboboxPopup, ComboboxWidget } from '@angular/aria/combobox';
import { Listbox, Option } from '@angular/aria/listbox';
import { FormValueControl } from '@angular/forms/signals';
import { KtField } from '../field/field';
import { KtFieldControl } from '../field/field-control';
import { KtBaseSelect } from '../base-select/base-select';
import { KtChipList } from '../chips/chip-list';
import { KtMultiSelectOptionDef, KtMultiSelectTriggerDef, KtMultiSelectChipDef } from './multi-select-option-def';
import { DEFAULT_KT_SELECT_CONFIG } from '../select/select-config';

export type { KtKeyish } from '../base-select/base-select';

/** Payload de l'évènement `selectionChange` d'un `kt-multi-select`. */
export interface KtMultiSelectSelectionChange<T, V = T> {
  /** Valeurs émises : clés extraites ou objets entiers, dans l'ordre de sélection. */
  value: V[];
  /** Options correspondantes, dans l'ordre de sélection. */
  options: T[];
}

/**
 * Composant de sélection multiple (Multi-Select) conforme aux exigences d'accessibilité (WCAG 2.2 AAA / RGAA).
 * Repose sur `@angular/aria/combobox` et `@angular/aria/listbox` avec [multi]="true".
 * Présentation adaptative : dropdown (desktop) ou bottom-sheet modale (téléphone tactile).
 * Option 1 : Résumé textuel sur le trigger et chips révocables affichés en dessous.
 *
 * Clavier multi-sélection (APG) : Espace/Entrée toggle, Shift+flèches étend la sélection,
 * Ctrl+A tout (dé)sélectionne, Shift+Espace sélectionne la plage, typeahead — majoritairement
 * natifs via `@angular/aria` ; les combos non relayés par la lib le sont via `onTriggerKeydown`.
 * Tout le commun (popup, filtre, clavier, drag-to-dismiss) vit dans `BaseSelect`.
 *
 * @template T Type d'une option (élément du tableau `options`).
 * @template V Type des valeurs émises (défaut `T` ; clés extraites si `optionValue` est fourni).
 *
 * @example
 * ```html
 * <kt-multi-select
 *   [options]="tags"
 *   optionLabel="name"
 *   optionValue="id"
 *   [(value)]="selectedIds"
 *   (selectionChange)="onSelectionChange($event)" />
 * ```
 */
@Component({
  selector: 'kt-multi-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './multi-select.html',
  styleUrls: ['../styles/select-panel.css', './multi-select.css'],
  imports: [
    KtField,
    KtFieldControl,
    NgTemplateOutlet,
    Combobox,
    ComboboxPopup,
    ComboboxWidget,
    Listbox,
    Option,
    KtChipList,
  ],
})
export class KtMultiSelect<T, V = T> extends KtBaseSelect<T, V> implements FormValueControl<V[]> {
  // --- Modèle réactif ---
  /** Valeurs sélectionnées (clés extraites, ou objets entiers si `optionValue` est omis). @default [] */
  readonly value = model<V[]>([]);
  /** Émis à chaque (dé)sélection. Payload : `{ value, options }` — `value` le tableau des valeurs émises
      (clés ou objets), `options` les objets options correspondants, dans l'ordre de sélection. */
  readonly selectionChange = output<KtMultiSelectSelectionChange<T, V>>();

  // --- Présentation / Configuration (spécifique multi) ---
  // `clearable` / `clearLabel` sont mutualisés dans KtBaseSelect (contrat identique au single).
  /** Barre « Tout sélectionner / Tout effacer » en tête du popup (bascule le popup en panneau dialog). */
  readonly selectionActions = input(false, { transform: booleanAttribute });
  /** Nombre maximal de chips affichés avant repli derrière un bouton « +N more ». Défaut : illimité. */
  readonly maxVisibleChips = input<number>();
  /** Libellé du bouton de validation affiché en bas de la sheet mobile. Défaut : `KT_SELECT_CONFIG.validationButtonLabel` ou vide. */
  readonly validationButtonLabel = input<string>();

  // --- Templates projetés ---
  protected readonly optionDef = contentChild(KtMultiSelectOptionDef);
  protected readonly triggerDef = contentChild(KtMultiSelectTriggerDef);
  protected readonly chipDef = contentChild(KtMultiSelectChipDef);

  private readonly chipList = viewChild(KtChipList);

  // --- Textes résolus spécifiques multi (input > KT_SELECT_CONFIG > DEFAULT_KT_SELECT_CONFIG centralisé) ---
  protected readonly resolvedValidationButtonLabel = computed(
    () =>
      this.validationButtonLabel() ??
      this.config?.validationButtonLabel ??
      DEFAULT_KT_SELECT_CONFIG.validationButtonLabel,
  );
  protected readonly resolvedRemoveItemLabel = computed(
    () => this.config?.removeItemLabel ?? DEFAULT_KT_SELECT_CONFIG.removeItemLabel,
  );
  protected readonly resolvedSelectedItemsLabel = computed(() =>
    (this.config?.selectedItemsLabel ?? DEFAULT_KT_SELECT_CONFIG.selectedItemsLabel)(this.label()),
  );
  private readonly resolvedSelectionSummaryText = computed(
    () => this.config?.selectionSummaryText ?? DEFAULT_KT_SELECT_CONFIG.selectionSummaryText,
  );
  protected readonly resolvedItemRemovedText = computed(
    () => this.config?.itemRemovedText ?? DEFAULT_KT_SELECT_CONFIG.itemRemovedText,
  );
  private readonly resolvedSelectionCountText = computed(
    () => this.config?.selectionCountText ?? DEFAULT_KT_SELECT_CONFIG.selectionCountText,
  );
  protected readonly resolvedSelectAllLabel = computed(
    () => this.config?.selectAllLabel ?? DEFAULT_KT_SELECT_CONFIG.selectAllLabel,
  );
  protected readonly resolvedClearAllLabel = computed(
    () => this.config?.clearAllLabel ?? DEFAULT_KT_SELECT_CONFIG.clearAllLabel,
  );
  protected readonly resolvedMoreChipsLabel = computed(
    () => this.config?.moreChipsLabel ?? DEFAULT_KT_SELECT_CONFIG.moreChipsLabel,
  );
  protected readonly resolvedLessChipsLabel = computed(
    () => this.config?.lessChipsLabel ?? DEFAULT_KT_SELECT_CONFIG.lessChipsLabel,
  );

  /** Accesseurs bridgés vers le ChipList (fonctions fléchées : une référence de méthode
      non liée perdrait `this`). */
  protected readonly chipLabelOf = (item: T): string => this.labelOf(item);
  protected readonly chipKeyOf = (item: T): unknown => this.keyOf(item);

  /** Options correspondant aux entrées de `value`, dans l'ordre de sélection.
      Mode objet : chaque entrée est ramenée à l'option canonique équivalente (compareWith). */
  protected readonly selectedOptions = computed<T[]>(() => {
    const vals = this.value() ?? [];
    if (vals.length === 0) return [];
    const opts = this.options();
    if (this.optionValue() !== undefined) {
      return vals.map((v) => opts.find((o) => this.keyOf(o) === (v as unknown))).filter((o): o is T => o !== undefined);
    }
    const cmp = this.comparator();
    return vals.map((v) => opts.find((o) => cmp(o, v as unknown as T)) ?? (v as unknown as T));
  });

  // Texte synthétique du trigger (Option 1)
  protected readonly triggerText = computed(() => {
    const selected = this.selectedOptions();
    if (selected.length === 0) return '';
    if (selected.length <= 3) {
      return selected.map((o) => this.labelOf(o)).join(', ');
    }
    return this.resolvedSelectionSummaryText()(selected.length);
  });

  /** Valeur brute transmise au ngListbox sous-jacent (tableau de clés). */
  protected override readonly listboxValue = computed<unknown[]>(() =>
    this.selectedOptions().map((o) => this.keyOf(o)),
  );

  // --- Tout effacer depuis le champ (clearable) ---
  /** Affiche le bouton « effacer » (×) sur le champ dès qu'une valeur est présente (`clearable`).
      Basé sur `value()` et non `selectedOptions()` : des clés orphelines (options retirées des données)
      restent effaçables (aligné sur `KtSelect`). */
  protected readonly showClear = computed(
    () => this.clearable() && !this.disabled() && !this.readonly() && (this.value()?.length ?? 0) > 0,
  );

  /** Le popup utilise la structure « panneau dialog » (champ de filtre et/ou barre d'actions). */
  protected readonly dialogMode = computed(() => this.filterable() || this.selectionActions());

  /** Compteur de sélection affiché dans le panneau (info déjà portée par la live region → aria-hidden). */
  protected readonly selectionCountLabel = computed(() =>
    this.resolvedSelectionCountText()(this.selectedOptions().length),
  );

  /** Clé listbox d'une entrée de `value` (mode objet : clé de l'option canonique équivalente). */
  private entryKey(v: V): unknown {
    if (this.optionValue() !== undefined) return v;
    const cmp = this.comparator();
    const option = this.options().find((o) => cmp(o, v as unknown as T));
    return option !== undefined ? this.keyOf(option) : this.keyOf(v as unknown as T);
  }

  /** Entrée de `value` à committer pour une clé listbox (mode objet : l'option entière). */
  private entryForKey(key: unknown): V | undefined {
    const option = this.options().find((o) => this.keyOf(o) === key);
    if (option === undefined) return undefined;
    return this.optionValue() !== undefined ? (key as V) : (option as unknown as V);
  }

  protected override onListboxValueChange(keys: readonly unknown[]): void {
    // Le listbox ne connaît que les options RENDUES : quand le filtre en masque, sa purge
    // interne retire leurs clés (pas un geste utilisateur). On conserve donc les entrées
    // hors vue, on applique les (dé)sélections visibles dans l'ordre courant, et on ignore
    // l'événement si rien n'a réellement changé (sinon touched/selectionChange parasites).
    const current = this.value() ?? [];
    const visibleKeys = new Set(this.displayedOptions().map((o) => this.keyOf(o)));
    const keptKeys = new Set(keys);
    const kept = current.filter((v) => {
      const k = this.entryKey(v);
      return !visibleKeys.has(k) || keptKeys.has(k);
    });
    const currentKeys = new Set(current.map((v) => this.entryKey(v)));
    const added = keys
      .filter((k) => !currentKeys.has(k))
      .map((k) => this.entryForKey(k))
      .filter((v): v is V => v !== undefined);
    if (kept.length === current.length && added.length === 0) return;
    this.commitValue([...kept, ...added]);
  }

  private commitValue(next: V[]): void {
    this.value.set(next);
    this.touched.set(true);
    this.selectionChange.emit({ value: next, options: this.selectedOptions() });
  }

  /** Comble les combos que le relay du combobox ne transmet pas en activedescendant :
      Shift+Espace (sélection de plage) et Ctrl/Cmd+Shift+Home/End (plage jusqu'aux bornes). */
  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (!this.expanded() || this.compact()) return;
    const shiftSpace = event.key === ' ' && event.shiftKey && !event.ctrlKey && !event.metaKey;
    const rangeToEdge =
      (event.key === 'Home' || event.key === 'End') && event.shiftKey && (event.ctrlKey || event.metaKey);
    if (!shiftSpace && !rangeToEdge) return;
    const listbox = this.listboxEl()?.nativeElement;
    if (!listbox) return;
    event.preventDefault();
    listbox.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: event.key,
        shiftKey: event.shiftKey,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        cancelable: true,
      }),
    );
  }

  /** En panneau dialog, le relay du combobox vise le widget (la div), pas le listbox descendant :
      on fait suivre au listbox les événements relayés (target = la div elle-même uniquement —
      les keydown des éléments internes, qui bubblent, ne sont pas re-forwardés). */
  protected onPanelKeydown(event: KeyboardEvent): void {
    if (event.target !== event.currentTarget) return;
    const listbox = this.listboxEl()?.nativeElement;
    if (!listbox) return;
    listbox.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: event.key,
        shiftKey: event.shiftKey,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        cancelable: true,
      }),
    );
  }

  /** « N results » + « , M selected » quand des sélections existent (dont celles hors filtre). */
  protected override composeFilterAnnouncement(): string {
    const base = super.composeFilterAnnouncement();
    if (base === '') return '';
    const selectedCount = this.selectedOptions().length;
    if (selectedCount === 0) return base;
    return `${base}, ${this.resolvedSelectionCountText()(selectedCount)}`;
  }

  /** Retire une option de la valeur (annonce et focus : délégués au ChipList). */
  protected removeOption(option: T): void {
    if (this.disabled() || this.readonly()) return;
    const current = this.value() ?? [];
    const next = this.removeFromValue(option);
    if (next.length === current.length) return;
    this.commitValue(next);
  }

  private removeFromValue(option: T): V[] {
    const current = this.value() ?? [];
    if (this.optionValue() !== undefined) {
      const key = this.keyOf(option);
      return current.filter((v) => (v as unknown) !== key);
    }
    const cmp = this.comparator();
    return current.filter((v) => !cmp(v as unknown as T, option));
  }

  /** Vide toute la sélection depuis le champ (bouton `clearable`). */
  protected clearSelection(): void {
    if (!this.showClear()) return;
    this.commitValue([]);
    this.chipList()?.announce(this.resolvedSelectionCountText()(0));
    this.triggerEl()?.nativeElement.focus();
  }

  /** Sélectionne toutes les options visibles non désactivées (sémantique du Ctrl+A natif :
      avec un filtre actif, seules les options filtrées sont concernées). */
  protected selectAllFiltered(): void {
    if (this.disabled() || this.readonly()) return;
    const current = this.value() ?? [];
    const currentKeys = new Set(current.map((v) => this.entryKey(v)));
    const added = this.filteredOptions()
      .filter((o) => !this.disabledOf(o) && !currentKeys.has(this.keyOf(o)))
      .map((o) => (this.optionValue() !== undefined ? (this.keyOf(o) as V) : (o as unknown as V)));
    if (added.length === 0) return;
    this.commitValue([...current, ...added]);
    this.announceSelectionCount();
  }

  /** Désélectionne toutes les options visibles (les sélections masquées par le filtre restent). */
  protected clearAllFiltered(): void {
    if (this.disabled() || this.readonly()) return;
    const current = this.value() ?? [];
    const visibleKeys = new Set(this.filteredOptions().map((o) => this.keyOf(o)));
    const next = current.filter((v) => !visibleKeys.has(this.entryKey(v)));
    if (next.length === current.length) return;
    this.commitValue(next);
    this.announceSelectionCount();
  }

  /** Annonce immédiate (action ponctuelle, pas de débounce) du total sélectionné. */
  private announceSelectionCount(): void {
    this.announceNow(this.resolvedSelectionCountText()(this.selectedOptions().length));
  }

  /** Valide la sélection depuis la sheet mobile (ferme le popup, marque le champ comme visité et replace le focus sur le trigger). */
  protected validateSheet(): void {
    this.expanded.set(false);
    this.touched.set(true);
    this.triggerEl()?.nativeElement.focus();
  }
}
