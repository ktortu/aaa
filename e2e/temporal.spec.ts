import AxeBuilder from '@axe-core/playwright';
import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';

function example(page: Page, label: string): Locator {
  return page.locator('kt-doc-example').filter({ hasText: label });
}

test.describe('Temporal fields (date / time / datetime / year-month / instant)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/temporal');
    await expect(page.locator('kt-date-field').first()).toBeVisible();
  });

  test('chaque type rend le bon input natif avec la valeur liée (ISO normalisé)', async ({ page }) => {
    // Les valeurs des inputs natifs sont normalisées ISO, indépendantes de la locale d'affichage.
    await expect(example(page, 'Date — kt-date-field').getByLabel('Pré-remplie')).toHaveValue('1990-05-15');
    await expect(example(page, 'Heure — kt-time-field').locator('input[type="time"]')).toHaveValue('09:30');
    await expect(example(page, 'Date & heure').locator('input[type="datetime-local"]')).toHaveValue('2026-09-18T14:00');
    await expect(example(page, 'Année / mois').locator('input[type="month"]')).toHaveValue('2028-04');
  });

  test('label associé + aria-describedby (hint)', async ({ page }) => {
    const input = example(page, 'Date — kt-date-field').getByLabel('Pré-remplie');
    await expect(input).toHaveAttribute('aria-describedby', /.+/); // pointe le hint
    await expect(example(page, 'Date — kt-date-field')).toContainText('Liée à un signal PlainDate.');
  });

  test('états : disabled / readonly / required / invalid', async ({ page }) => {
    const ex = example(page, 'États');
    await expect(ex.getByLabel('Désactivé')).toBeDisabled();
    await expect(ex.getByLabel('Lecture seule')).toHaveAttribute('readonly', '');
    await expect(ex.getByLabel('Requis')).toHaveAttribute('aria-required', 'true');

    const invalid = ex.getByLabel('Échéance');
    await expect(invalid).toHaveAttribute('aria-invalid', 'true');
    await expect(ex).toContainText('Date dans le passé.'); // message d'erreur (région live)
  });

  test('clearable : la croix vide la valeur (input natif réellement effacé)', async ({ page }) => {
    const field = example(page, 'Décorations').locator('kt-date-field').filter({ hasText: 'Rendez-vous' });
    const input = field.getByLabel('Rendez-vous');
    await expect(input).toHaveValue('1990-05-15'); // présélection
    await field.getByRole('button', { name: 'Effacer' }).click();
    await expect(input).toHaveValue(''); // régression corrigée : clear() force l'effacement de l'input natif
  });

  test('suggestions : datalist câblé sur le champ', async ({ page }) => {
    const ex = example(page, 'Suggestions (datalist)');
    const input = ex.locator('input[type="month"]');
    await expect(input).toHaveAttribute('list', /.+/); // datalist câblé (assertion web-first, auto-retry)
    const listId = await input.getAttribute('list');
    await expect(ex.locator(`datalist#${listId} option`)).toHaveCount(3); // 3 échéances proposées
  });

  test('pipe temporalDate : affichage formaté non vide', async ({ page }) => {
    // L'exact dépend de la locale ; l'année 2026 est présente quelle que soit la locale.
    await expect(
      example(page, 'Affichage avec le pipe temporalDate').locator('p', { hasText: 'Date complète' }),
    ).toContainText('2026');
  });

  test('AXE : aucune violation serious/critical sur la page temporal', async ({ page }) => {
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map((v) => v.id)).toEqual([]);
  });
});
