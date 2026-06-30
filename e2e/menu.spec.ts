import AxeBuilder from '@axe-core/playwright';
import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';

function example(page: Page, label: string): Locator {
  return page.locator('kt-doc-example').filter({ hasText: label });
}

test.describe('Menu (famille ktMenu sur @angular/aria)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/menu');
    await expect(page.getByRole('button', { name: 'Actions' })).toBeVisible();
  });

  test('ouverture + sélection : role=menu, item sélectionné, fermeture', async ({ page }) => {
    await page.getByRole('button', { name: 'Actions' }).click();
    const menu = page.getByRole('menu', { name: 'Actions sur le fichier' });
    await expect(menu).toBeVisible();

    await page.getByRole('menuitem', { name: 'Renommer' }).click();
    await expect(menu).toBeHidden();
    await expect(example(page, 'Menu de base').locator('.page__result')).toContainText('rename');
  });

  test('item désactivé : aria-disabled, non sélectionnable', async ({ page }) => {
    await page.getByRole('button', { name: 'Actions' }).click();
    const archive = page.getByRole('menuitem', { name: 'Archiver' });
    await expect(archive).toBeVisible();
    await expect(archive).toBeDisabled();
  });

  test('items checkbox : aria-checked bascule, indépendamment', async ({ page }) => {
    const ex = example(page, 'Cases à cocher');
    // Initial : wrap=false, minimap=true. Toggler « Retour à la ligne » ne doit pas toucher Minimap.
    await page.getByRole('button', { name: 'Affichage' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Retour à la ligne' }).click();
    await expect(ex.locator('.page__result')).toContainText('Retour à la ligne : true');
    await expect(ex.locator('.page__result')).toContainText('Minimap : true'); // inchangé → indépendant
  });

  test('groupe radio : sélection mutuellement exclusive', async ({ page }) => {
    const ex = example(page, 'Groupe radio');
    await page.getByRole('button', { name: 'Trier par' }).click();
    await page.getByRole('menuitemradio', { name: 'Date' }).click();
    await expect(ex.locator('.page__result')).toContainText('date');
  });

  test('clavier : Échap ferme et restitue le focus au déclencheur', async ({ page }) => {
    const trigger = page.getByRole('button', { name: 'Actions' });
    await trigger.click();
    await expect(page.getByRole('menu', { name: 'Actions sur le fichier' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu', { name: 'Actions sur le fichier' })).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('sous-menu : un item parent ouvre le sous-menu imbriqué', async ({ page }) => {
    await page.getByRole('button', { name: 'Fichier' }).click();
    await expect(page.getByRole('menuitem', { name: 'Nouveau' })).toBeVisible();

    await page.getByRole('menuitem', { name: 'Partager' }).hover();
    await expect(page.getByRole('menuitem', { name: 'E-mail' })).toBeVisible();
  });

  test('AXE : aucune violation serious/critical avec un menu ouvert', async ({ page }) => {
    await page.getByRole('button', { name: 'Actions' }).click();
    await expect(page.getByRole('menu', { name: 'Actions sur le fichier' })).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map((v) => v.id)).toEqual([]);
  });
});
