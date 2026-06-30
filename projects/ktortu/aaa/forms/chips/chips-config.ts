import { InjectionToken } from '@angular/core';

/** Défauts applicables à tous les `kt-chip-list` (surchargeables par liste via les inputs).
    Lib neutre i18n : les textes sont fournis par le consommateur (ici en une fois).
    Fourni en `Partial` : un consommateur n'override que ce qu'il veut.
    Calqué sur `KT_FIELD_CONFIG`/`KT_SELECT_CONFIG`.
    NB : le MultiSelect passe ses propres textes (résolus depuis KT_SELECT_CONFIG) en inputs —
    ils priment donc sur ce token pour les chips rendus sous un multi-select. */
export interface KtChipsConfig {
  /** Libellé accessible du bouton de retrait d'un chip. Défaut : `'Remove X'`. */
  removeItemLabel: (itemLabel: string) => string;
  /** Annonce live après le retrait d'un chip. Défaut : `'X removed'`. */
  itemRemovedText: (itemLabel: string) => string;
  /** Libellé du bouton dépliant les chips repliés (`[maxVisible]`). Défaut : `'+N more'`. */
  moreLabel: (hiddenCount: number) => string;
  /** Libellé du même bouton une fois déplié. Défaut : `'Show less'`. */
  lessLabel: string;
  /** Libellé accessible du conteneur (`role="list"`). Défaut : `'Selected items'`. */
  listLabel: string;
}

export const KT_CHIPS_CONFIG = new InjectionToken<Partial<KtChipsConfig>>('KT_CHIPS_CONFIG');
