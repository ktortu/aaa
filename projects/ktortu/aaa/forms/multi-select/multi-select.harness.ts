// Harness de test pour `kt-multi-select` (sélection multiple, mode desktop/activedescendant).
//
// PHASE 2 — INTERNE, NON PUBLIÉ (fichier `*.harness.ts` exclu du build, cf. tsconfig.lib.json).
// Réutilise toute la base de `KtSelectHarness` par héritage (mêmes classes DOM : trigger, options,
// filtre) ; n'ajoute que le spécifique multi : sélection qui ne ferme pas le popup, chips
// révocables, bouton « tout effacer ».
//
// Mêmes limites/cohabitation que KtSelectHarness (desktop only ; DOM→harness, white-box→internals).
import { HarnessPredicate } from '@angular/cdk/testing';
import { KtSelectHarness, KtSelectHarnessFilters } from '../select/select.harness';

export type KtMultiSelectHarnessFilters = KtSelectHarnessFilters;

/** Harness ARIA-first pour `kt-multi-select`. Hérite de l'API Select (open, options, filtre, états). */
export class KtMultiSelectHarness extends KtSelectHarness {
  static override hostSelector = 'kt-multi-select';

  static override with(filters: KtMultiSelectHarnessFilters = {}): HarnessPredicate<KtMultiSelectHarness> {
    return new HarnessPredicate(KtMultiSelectHarness, filters).addOption('label', filters.label, (harness, label) =>
      HarnessPredicate.stringMatches(harness.getLabel(), label),
    );
  }

  private readonly chipLabelEls = this.locatorForAll('.kt-chip__label');
  private readonly chipRemoveEls = this.locatorForAll('.kt-chip__remove');
  private readonly validationButtonEl = this.locatorForOptional('.kt-select__sheet-validate');
  // `clear()` / `isClearAvailable()` (bouton « tout effacer ») sont hérités de KtSelectHarness.

  /** Toggle une option (ajoute/retire ; le popup reste ouvert). Alias sémantique de `clickOption`. */
  async toggleOption(filter: { text: string | RegExp }): Promise<void> {
    return this.clickOption(filter);
  }

  /** Libellés des chips de sélection (dans l'ordre de sélection). */
  async getChipTexts(): Promise<string[]> {
    return Promise.all((await this.chipLabelEls()).map(async (c) => (await c.text()).trim()));
  }

  /** Retire la n-ième sélection via la croix de son chip. */
  async removeChip(index: number): Promise<void> {
    const buttons = await this.chipRemoveEls();
    if (!buttons[index]) {
      throw new Error(`KtMultiSelectHarness: aucun chip à l'index ${index}`);
    }
    await buttons[index].click();
  }

  /** Indique si le bouton de validation de la sheet mobile est présent dans le DOM. */
  async hasValidationButton(): Promise<boolean> {
    return (await this.validationButtonEl()) !== null;
  }

  /** Récupère le texte du bouton de validation de la sheet mobile. */
  async getValidationButtonText(): Promise<string> {
    const btn = await this.validationButtonEl();
    return btn ? (await btn.text()).trim() : '';
  }

  /** Clique sur le bouton de validation de la sheet mobile. */
  async clickValidationButton(): Promise<void> {
    const btn = await this.validationButtonEl();
    if (!btn) {
      throw new Error('KtMultiSelectHarness: aucun bouton de validation présent');
    }
    await btn.click();
  }
}
