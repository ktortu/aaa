import { InjectionToken } from '@angular/core';

/** Défauts applicables à tous les `kt-tab-scroller` (surchargeables par instance via les inputs).
    Lib neutre i18n : les textes sont fournis par le consommateur (ici en une fois).
    Fourni en `Partial` : un consommateur n'override que ce qu'il veut.
    Calqué sur `KT_FIELD_CONFIG`/`KT_CHIPS_CONFIG`. */
export interface KtTabsConfig {
  /** `aria-label` du chevron de pagination « onglets précédents ». Défaut : `'Previous tabs'`. */
  previousLabel: string;
  /** `aria-label` du chevron de pagination « onglets suivants ». Défaut : `'Next tabs'`. */
  nextLabel: string;
}

export const KT_TABS_CONFIG = new InjectionToken<Partial<KtTabsConfig>>('KT_TABS_CONFIG');
