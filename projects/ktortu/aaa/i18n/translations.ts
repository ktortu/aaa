import { EnvironmentProviders, Provider, makeEnvironmentProviders } from '@angular/core';

import { KT_FIELD_CONFIG, KT_CHIPS_CONFIG, KT_SELECT_CONFIG } from '@ktortu/aaa/forms';
import type { KtFieldConfig, KtChipsConfig, KtSelectConfigOptions } from '@ktortu/aaa/forms';
import { KT_SNACKBAR_CONFIG } from '@ktortu/aaa/snackbar';
import type { KtSnackbarConfig } from '@ktortu/aaa/snackbar';
import { KT_TABS_CONFIG } from '@ktortu/aaa/tabs';
import type { KtTabsConfig } from '@ktortu/aaa/tabs';
import { KT_DIALOG_CONFIG } from '@ktortu/aaa/dialog';
import type { KtDialogConfig } from '@ktortu/aaa/dialog';

/**
 * Agrégat de TOUS les libellés traduisibles de la lib, groupés par famille de composants.
 * Chaque clé reprend la config du token correspondant (`Partial` : tout est optionnel — on ne
 * fournit que ce qu'on veut traduire). C'est l'« interface de traduction » unique de la lib :
 * un point d'entrée pour brancher une langue d'un coup.
 *
 * @see provideKtTranslations pour enregistrer un jeu de libellés.
 * @see provideKtDefaultFR pour partir des libellés français.
 */
export interface KtTranslations {
  /** Libellés des champs (`clearLabel`, `helpLabel`) → {@link KT_FIELD_CONFIG}. */
  field?: Partial<KtFieldConfig>;
  /** Libellés des selects / multi-selects → {@link KT_SELECT_CONFIG}. */
  select?: Partial<KtSelectConfigOptions>;
  /** Libellés des listes de chips → {@link KT_CHIPS_CONFIG}. */
  chips?: Partial<KtChipsConfig>;
  /** Libellés de la snackbar (`closeLabel`) → {@link KT_SNACKBAR_CONFIG}. */
  snackbar?: Partial<KtSnackbarConfig>;
  /** Libellés de la pagination des onglets → {@link KT_TABS_CONFIG}. */
  tabs?: Partial<KtTabsConfig>;
  /** Libellés du dialog (`sheetCloseLabel`) → {@link KT_DIALOG_CONFIG}. */
  dialog?: Partial<KtDialogConfig>;
}

/**
 * Enregistre, en un seul appel, les libellés fournis sur les tokens de config de la lib.
 * Base = défauts anglais de chaque composant ; seules les familles **présentes** dans `t` sont
 * fournies (les autres gardent leur défaut anglais et restent surchargeables ailleurs).
 *
 * À placer dans les `providers` de `app.config.ts` (ou de tout injecteur).
 *
 * @param t Libellés à fournir, groupés par famille ; seules les familles présentes sont enregistrées.
 * @returns Les `EnvironmentProviders` liant chaque famille présente à son token de config.
 * @example
 * ```ts
 * provideKtTranslations({ tabs: { nextLabel: 'Suivant', previousLabel: 'Précédent' } })
 * ```
 */
export function provideKtTranslations(t: KtTranslations): EnvironmentProviders {
  const providers: Provider[] = [];
  if (t.field) providers.push({ provide: KT_FIELD_CONFIG, useValue: t.field });
  if (t.select) providers.push({ provide: KT_SELECT_CONFIG, useValue: t.select });
  if (t.chips) providers.push({ provide: KT_CHIPS_CONFIG, useValue: t.chips });
  if (t.snackbar) providers.push({ provide: KT_SNACKBAR_CONFIG, useValue: t.snackbar });
  if (t.tabs) providers.push({ provide: KT_TABS_CONFIG, useValue: t.tabs });
  if (t.dialog) providers.push({ provide: KT_DIALOG_CONFIG, useValue: t.dialog });
  return makeEnvironmentProviders(providers);
}

/**
 * Fusion par famille de deux {@link KtTranslations} : `over` écrase `base`, clé par clé.
 * @param base Libellés de référence (ex. un dictionnaire de langue complet).
 * @param over Libellés prioritaires venant écraser `base`.
 * @returns Un nouveau {@link KtTranslations} fusionné, famille par famille.
 * @example mergeKtTranslations(KT_FR_TRANSLATIONS, { tabs: { nextLabel: 'Suivant' } })
 */
export function mergeKtTranslations(base: KtTranslations, over: KtTranslations): KtTranslations {
  return {
    // `errorMessages` est lui-même une map par `kind` : fusion PROFONDE pour qu'un override ponctuel
    // (ex. `provideKtDefaultFR({ field: { errorMessages: { required: '…' } } })`) ne fasse pas tomber
    // les autres messages de la langue de base.
    field: {
      ...base.field,
      ...over.field,
      errorMessages: { ...base.field?.errorMessages, ...over.field?.errorMessages },
    },
    select: { ...base.select, ...over.select },
    chips: { ...base.chips, ...over.chips },
    snackbar: { ...base.snackbar, ...over.snackbar },
    tabs: { ...base.tabs, ...over.tabs },
    dialog: { ...base.dialog, ...over.dialog },
  };
}
