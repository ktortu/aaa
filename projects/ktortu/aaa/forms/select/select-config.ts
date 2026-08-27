import { InjectionToken } from '@angular/core';

/** Défauts applicables à tous les `kt-select` (surchargeables par champ via les inputs).
    Lib neutre i18n : les textes sont fournis par le consommateur (ici en une fois).
    Fourni en `Partial` : un consommateur n'override que ce qu'il veut.
    Calqué sur `KT_FIELD_CONFIG`. */
export interface KtSelectConfigOptions {
  /** Texte affiché quand aucune option n'est sélectionnée. */
  placeholder: string;
  /** Texte affiché quand la liste filtrée/d'options est vide. */
  emptyText: string;
  /** Libellé accessible du bouton de fermeture de la bottom-sheet mobile. */
  closeLabel: string;
  /** Fermer le popup après une sélection. Défaut (single) : `true`. */
  closeOnSelect: boolean;
  /** Placeholder du champ de filtre des select filtrables (`[filterable]`). */
  filterPlaceholder: string;
  /** Libellé accessible (aria-label) du champ de filtre. */
  filterLabel: string;
  /** Annonce du nombre de résultats du filtre (live region). Fonction : laisse le
      consommateur gérer les pluriels i18n. Défaut : `'1 result'` / `'N results'`. */
  filterResultsText: (count: number) => string;

  // --- Clés propres au multi-select (`kt-multi-select`) ---
  /** Libellé accessible du bouton de retrait d'un chip. Défaut : `'Remove X'`. */
  removeItemLabel: (itemLabel: string) => string;
  /** Libellé accessible du conteneur de chips (reçoit le label du champ, pour
      distinguer plusieurs multi-selects d'une page). Défaut : `'Selected items for X'`. */
  selectedItemsLabel: (fieldLabel: string | undefined) => string;
  /** Résumé affiché sur le trigger au-delà du seuil d'énumération. Défaut : `'N items selected'`. */
  selectionSummaryText: (count: number) => string;
  /** Annonce live après le retrait d'un élément (chip ou tout effacer). Défaut : `'X removed'`. */
  itemRemovedText: (itemLabel: string) => string;
  /** Compteur de sélection (live region du filtre, actions de masse). Défaut : `'N selected'`. */
  selectionCountText: (count: number) => string;
  /** Libellé du bouton « tout sélectionner » du popup (`[selectionActions]`). Défaut : `'Select all'`. */
  selectAllLabel: string;
  /** Libellé du bouton « tout effacer » du popup (`[selectionActions]`). Défaut : `'Clear all'`. */
  clearAllLabel: string;
  /** Libellé du bouton dépliant les chips repliés (`[maxVisibleChips]`). Défaut : `'+N more'`. */
  moreChipsLabel: (hiddenCount: number) => string;
  /** Libellé du même bouton une fois déplié. Défaut : `'Show less'`. */
  lessChipsLabel: string;
  /** Texte informatif de troncature des résultats (visuel). Défaut : `'Showing first X results of Y...'`. */
  truncatedResultsText: (max: number, total: number) => string;
  /** Annonce de la troncature des résultats (live region). Défaut : `'X results displayed out of Y...'`. */
  truncatedResultsAnnouncement: (max: number, total: number) => string;
  /** Libellé du bouton de validation en bas de la sheet mobile (opt-in, multi-select). Défaut : `''` (aucun bouton). */
  validationButtonLabel: string;
}

export const KT_SELECT_CONFIG = new InjectionToken<Partial<KtSelectConfigOptions>>('KT_SELECT_CONFIG');

/**
 * Source UNIQUE des défauts (anglais neutre) de la config select / multi-select. Constitue le 3e
 * maillon de la résolution `input() ?? KT_SELECT_CONFIG ?? DEFAULT_KT_SELECT_CONFIG`, jusqu'ici
 * éparpillé entre `base-select.ts`, `multi-select.ts` et des fonctions locales. Centralisé ici pour
 * éviter toute dérive et garantir la complétude des traductions (cf. test de complétude i18n).
 */
export const DEFAULT_KT_SELECT_CONFIG: Required<KtSelectConfigOptions> = {
  placeholder: '',
  emptyText: 'No options',
  closeLabel: 'Close',
  closeOnSelect: true,
  filterPlaceholder: '',
  filterLabel: 'Filter options',
  filterResultsText: (count) => (count === 1 ? '1 result' : `${count} results`),
  removeItemLabel: (itemLabel) => `Remove ${itemLabel}`,
  selectedItemsLabel: (fieldLabel) => (fieldLabel ? `Selected items for ${fieldLabel}` : 'Selected items'),
  selectionSummaryText: (count) => `${count} items selected`,
  itemRemovedText: (itemLabel) => `${itemLabel} removed`,
  selectionCountText: (count) => (count === 1 ? '1 selected' : `${count} selected`),
  selectAllLabel: 'Select all',
  clearAllLabel: 'Clear all',
  moreChipsLabel: (hiddenCount) => `+${hiddenCount} more`,
  lessChipsLabel: 'Show less',
  truncatedResultsText: (max, total) => `Showing first ${max} results of ${total}. Refine your search to see more.`,
  truncatedResultsAnnouncement: (max, total) =>
    `${max} results displayed out of ${total}. Refine your search to see more.`,
  validationButtonLabel: '',
};
