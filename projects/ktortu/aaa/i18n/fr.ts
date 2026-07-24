import { EnvironmentProviders } from '@angular/core';

import { ktErrorParam } from '@ktortu/aaa/forms';
import { KtTranslations, mergeKtTranslations, provideKtTranslations } from './translations';

/**
 * Dictionnaire **français** complet de tous les libellés de la lib. Figé et réutilisable :
 * importable tel quel (ex. pour le composer avec d'autres réglages) ou via {@link provideKtDefaultFR}.
 * Les libellés à pluriels sont des fonctions, pour laisser la grammaire au consommateur.
 */
export const KT_FR_TRANSLATIONS: KtTranslations = {
  field: {
    clearLabel: 'Effacer',
    helpLabel: 'Aide',
    numberParseError: 'La valeur saisie doit être un nombre valide.',
    errorMessages: {
      required: 'Ce champ est requis.',
      email: 'Saisissez une adresse e-mail valide.',
      min: (e) => `Saisissez une valeur supérieure ou égale à ${ktErrorParam<number>(e, 'min')}.`,
      max: (e) => `Saisissez une valeur inférieure ou égale à ${ktErrorParam<number>(e, 'max')}.`,
      minLength: (e) => `Saisissez au moins ${ktErrorParam<number>(e, 'minLength')} caractères.`,
      maxLength: (e) => `Saisissez au plus ${ktErrorParam<number>(e, 'maxLength')} caractères.`,
      minDate: (e) => `Choisissez une date à partir du ${ktErrorParam<Date>(e, 'minDate').toLocaleDateString('fr')}.`,
      maxDate: (e) => `Choisissez une date jusqu'au ${ktErrorParam<Date>(e, 'maxDate').toLocaleDateString('fr')}.`,
      pattern: 'Le format saisi est invalide.',
    },
  },
  select: {
    emptyText: 'Aucune option',
    closeLabel: 'Fermer',
    filterLabel: 'Filtrer les options',
    // En français, 0 ET 1 prennent le singulier (≠ anglais où seul 1 est singulier).
    filterResultsText: (count) => (count <= 1 ? `${count} résultat` : `${count} résultats`),
    removeItemLabel: (itemLabel) => `Retirer ${itemLabel}`,
    selectedItemsLabel: (fieldLabel) =>
      fieldLabel ? `Éléments sélectionnés pour ${fieldLabel}` : 'Éléments sélectionnés',
    selectionSummaryText: (count) => (count <= 1 ? `${count} élément sélectionné` : `${count} éléments sélectionnés`),
    itemRemovedText: (itemLabel) => `${itemLabel} retiré`,
    selectionCountText: (count) => (count <= 1 ? `${count} sélectionné` : `${count} sélectionnés`),
    selectAllLabel: 'Tout sélectionner',
    clearAllLabel: 'Tout effacer',
    moreChipsLabel: (hiddenCount) => `+${hiddenCount} de plus`,
    lessChipsLabel: 'Afficher moins',
    truncatedResultsText: (max, total) =>
      `Affichage des ${max} premiers résultats sur ${total}. Affinez votre recherche pour en voir plus.`,
    truncatedResultsAnnouncement: (max, total) =>
      `${max} résultats affichés sur ${total}. Affinez votre recherche pour en voir plus.`,
  },
  chips: {
    removeItemLabel: (itemLabel) => `Retirer ${itemLabel}`,
    itemRemovedText: (itemLabel) => `${itemLabel} retiré`,
    moreLabel: (hiddenCount) => `+${hiddenCount} de plus`,
    lessLabel: 'Afficher moins',
    listLabel: 'Éléments sélectionnés',
  },
  snackbar: {
    closeLabel: 'Fermer',
  },
  tabs: {
    previousLabel: 'Onglets précédents',
    nextLabel: 'Onglets suivants',
  },
  dialog: {
    sheetCloseLabel: 'Fermer',
  },
};

/**
 * Enregistre les libellés **français** par défaut sur toute la lib, en un seul appel.
 * `overrides` permet d'ajuster ponctuellement sans tout réécrire (fusion par famille,
 * cf. {@link mergeKtTranslations}). À placer dans les `providers` de `app.config.ts`.
 *
 * @param overrides Libellés à ajuster par-dessus le français (fusion par famille). Défaut : `{}`.
 * @returns Les `EnvironmentProviders` enregistrant le français (fusionné aux `overrides`).
 * @example
 * ```ts
 * // app.config.ts
 * providers: [
 *   provideKtDefaultFR(),                                // tout en français
 *   // ou en ajustant un libellé précis :
 *   provideKtDefaultFR({ tabs: { nextLabel: 'Suivant' } }),
 * ]
 * ```
 */
export function provideKtDefaultFR(overrides: KtTranslations = {}): EnvironmentProviders {
  return provideKtTranslations(mergeKtTranslations(KT_FR_TRANSLATIONS, overrides));
}
