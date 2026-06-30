// Harness de test pour les menus `[ktMenu]`.
//
// INTERNE, NON PUBLIÉ (fichier `*.harness.ts` exclu du build, cf. tsconfig.lib.json).
// Conventions : cf. projects/ktortu/aaa/TESTING-HARNESSES.md.
//
// Réutilise les harnesses officiels d'@angular/aria (open/close/getItems/sous-menus gérés par eux,
// y compris la relation trigger↔menu via aria-controls). N'ajoute que la valeur propre à la lib :
// `isChecked()` sur les items à bascule (menuitemcheckbox/radio), le trou que `@angular/aria` laisse
// et que `KtMenuItemCheckbox`/`KtMenuItemRadio` comblent côté composant.
import { HarnessPredicate } from '@angular/cdk/testing';
import { MenuHarness, MenuItemHarness, MenuItemHarnessFilters } from '@angular/aria/menu/testing';

/** Critères de ciblage d'un `KtMenuItemHarness` (ajoute `checked` aux filtres officiels). */
export interface KtMenuItemHarnessFilters extends MenuItemHarnessFilters {
  /** Filtre par état coché (menuitemcheckbox / menuitemradio). */
  checked?: boolean;
}

/** Harness d'item de menu : tout l'officiel + `isChecked()`. */
export class KtMenuItemHarness extends MenuItemHarness {
  static override with(options: KtMenuItemHarnessFilters = {}): HarnessPredicate<KtMenuItemHarness> {
    return new HarnessPredicate(KtMenuItemHarness, options)
      .addOption('text', options.text, (harness, text) => HarnessPredicate.stringMatches(harness.getText(), text))
      .addOption('disabled', options.disabled, async (harness, disabled) => (await harness.isDisabled()) === disabled)
      .addOption('checked', options.checked, async (harness, checked) => (await harness.isChecked()) === checked);
  }

  /** État coché d'un item à bascule (`aria-checked="true"`). `false` pour un item simple. */
  async isChecked(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-checked')) === 'true';
  }
}

/** Harness de surface de menu `[ktMenu]` : tout l'officiel, mais `getItems()` renvoie des `KtMenuItemHarness`. */
export class KtMenuHarness extends MenuHarness {
  static override hostSelector = '[ktMenu]';

  override async getItems(filters: KtMenuItemHarnessFilters = {}): Promise<KtMenuItemHarness[]> {
    return this.locatorForAll(KtMenuItemHarness.with(filters))();
  }
}
