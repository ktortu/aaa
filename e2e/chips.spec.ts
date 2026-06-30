import AxeBuilder from '@axe-core/playwright';
import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';

/** Cible un exemple de la page par le libellé de son `kt-doc-example`. */
function example(page: Page, label: string): Locator {
  return page.locator('kt-doc-example').filter({ hasText: label });
}

test.describe('Chips (composants autonomes)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/chips');
    await expect(page.locator('kt-chip').first()).toBeVisible();
  });

  test('tags statiques : pilules sans bouton retirer', async ({ page }) => {
    const statics = example(page, 'Tags statiques (kt-chip)');
    await expect(statics.locator('kt-chip')).toHaveCount(3); // Angular, TypeScript, RxJS
    await expect(statics.locator('.kt-chip__remove')).toHaveCount(0);
  });

  test('chip révocable autonome : retrait via remove() puis réaffichage', async ({ page }) => {
    const solo = example(page, 'Chip révocable autonome');
    await expect(solo.locator('kt-chip')).toHaveCount(1);
    await solo.getByRole('button', { name: 'Retirer le brouillon' }).click();
    await expect(solo.locator('kt-chip')).toHaveCount(0);
    await solo.getByRole('button', { name: 'Réafficher le chip' }).click();
    await expect(solo.locator('kt-chip')).toHaveCount(1);
  });

  test('liste révocable : retrait → focus chip suivant, annonce, puis réinitialisation', async ({ page }) => {
    const list = example(page, 'Liste révocable (pattern contrôlé)');
    await expect(list.locator('kt-chip')).toHaveCount(4); // Angular, TypeScript, RxJS, Signals

    await list.getByRole('button', { name: 'Retirer Angular' }).click();
    await expect(list.locator('kt-chip')).toHaveCount(3);
    await expect(list.locator('.kt-chip-list__status')).toHaveText('Angular retiré'); // CHIPS_CONFIG FR
    await expect(list.getByRole('button', { name: 'Retirer TypeScript' })).toBeFocused();

    // Vide le reste au clavier : le focus est reporté sur le bouton suivant à chaque retrait.
    for (const next of ['Retirer RxJS', 'Retirer Signals']) {
      await page.keyboard.press('Enter');
      await expect(list.getByRole('button', { name: next })).toBeFocused();
    }
    await page.keyboard.press('Enter'); // dernier chip
    await expect(list.locator('kt-chip')).toHaveCount(0);

    // Réinitialise la liste (bouton frère, hors de la liste).
    await list.getByRole('button', { name: 'Réinitialiser' }).click();
    await expect(list.locator('kt-chip')).toHaveCount(4);
  });

  test('repli : « +N de plus » déplie (focus sur le premier révélé) puis « Afficher moins »', async ({ page }) => {
    const fold = example(page, 'Repli au-delà de 3 (maxVisible)');
    await expect(fold.locator('kt-chip')).toHaveCount(3);
    const more = fold.locator('.kt-chip-list__more');
    await expect(more).toHaveText('+5 de plus'); // manyTags = 8, maxVisible = 3
    await expect(more).toHaveAttribute('aria-expanded', 'false');

    await more.click();
    await expect(fold.locator('kt-chip')).toHaveCount(8);
    await expect(more).toHaveText('Afficher moins');
    await expect(fold.locator('.kt-chip__remove').nth(3)).toBeFocused(); // 1er chip révélé

    await more.click();
    await expect(fold.locator('kt-chip')).toHaveCount(3);
  });

  test('template custom : rendu libre (ktChipItem) + remove() du contexte', async ({ page }) => {
    const custom = example(page, 'Rendu custom (ng-template[ktChipItem])');
    await expect(custom.locator('kt-chip')).toHaveCount(5); // Angular, React, Vue, Svelte, Solid
    await custom.getByRole('button', { name: 'Retirer React' }).click();
    await expect(custom.locator('kt-chip')).toHaveCount(4);
    await expect(custom.locator('.kt-chip-list__status')).toHaveText('React retiré');
  });

  test('états : readonly = boutons absents ; disabled = boutons inactifs', async ({ page }) => {
    const states = example(page, 'États — lecture seule & désactivé');
    const readonlyList = states.locator('kt-chip-list').first(); // readonly en premier dans la démo
    await expect(readonlyList.locator('kt-chip')).toHaveCount(2);
    await expect(readonlyList.locator('.kt-chip__remove')).toHaveCount(0);

    const disabledList = states.locator('kt-chip-list').nth(1);
    await expect(disabledList.locator('.kt-chip__remove').first()).toBeDisabled();
  });

  test('AXE : aucune violation serious/critical sur la page chips', async ({ page }) => {
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map((v) => v.id)).toEqual([]);
  });
});
