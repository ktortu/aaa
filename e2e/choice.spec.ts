import AxeBuilder from '@axe-core/playwright';
import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';

function example(page: Page, label: string): Locator {
  return page.locator('kt-doc-example').filter({ hasText: label });
}

test.describe('Choice (switch / checkbox / radio)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/choice');
    await expect(page.getByRole('switch', { name: 'Mode sombre' })).toBeVisible();
  });

  test('switch : role=switch, aria-checked bascule au clic', async ({ page }) => {
    const sw = page.getByRole('switch', { name: 'Mode sombre' });
    await expect(sw).toHaveAttribute('aria-checked', 'false');
    await sw.click();
    await expect(sw).toHaveAttribute('aria-checked', 'true');
    await sw.click();
    await expect(sw).toHaveAttribute('aria-checked', 'false');
  });

  test('switch désactivé : inerte', async ({ page }) => {
    const sw = example(page, 'États (interrupteur)').getByRole('switch', { name: 'Désactivé', exact: true });
    await expect(sw).toBeDisabled();
    await expect(sw).toHaveAttribute('aria-checked', 'false');
  });

  test('checkbox : le clic sur le LABEL bascule la case', async ({ page }) => {
    const cb = page.getByRole('checkbox', { name: 'Accepter les conditions' });
    await expect(cb).not.toBeChecked();
    await example(page, 'Case à cocher').getByText('Accepter les conditions').click();
    await expect(cb).toBeChecked();
  });

  test('checkbox indéterminée : propriété DOM indeterminate', async ({ page }) => {
    const cb = page.getByRole('checkbox', { name: 'Indéterminée' });
    expect(await cb.evaluate((el: HTMLInputElement) => el.indeterminate)).toBe(true);
  });

  test('checkbox requise : aria-required', async ({ page }) => {
    const cb = example(page, 'États (case)').getByRole('checkbox', { name: 'Requise' });
    await expect(cb).toHaveAttribute('aria-required', 'true');
  });

  test('groupe de cases : sémantique group + valeur tableau (toggle indépendant)', async ({ page }) => {
    const group = example(page, 'Groupe de cases');
    const sport = group.getByRole('checkbox', { name: 'Sport' });
    const musique = group.getByRole('checkbox', { name: 'Musique' });

    await expect(sport).toBeChecked(); // présélection ['sport']
    await expect(musique).not.toBeChecked();

    await musique.click();
    await expect(musique).toBeChecked();
    await expect(sport).toBeChecked(); // indépendant
  });

  test('groupe radio : sélection unique + option désactivée non sélectionnable', async ({ page }) => {
    const group = example(page, 'Groupe radio & option désactivée');
    const s = group.getByRole('radio', { name: 'S' });
    const m = group.getByRole('radio', { name: 'M' });
    const l = group.getByRole('radio', { name: 'L' });

    await expect(m).toBeChecked(); // présélection 'm'
    await expect(l).toBeDisabled();

    await s.check();
    await expect(s).toBeChecked();
    await expect(m).not.toBeChecked(); // exclusif
  });

  test('groupe radio : navigation roving au clavier (flèches)', async ({ page }) => {
    const group = example(page, 'Groupe radio & option désactivée');
    const s = group.getByRole('radio', { name: 'S' });
    await s.check();
    await expect(s).toBeFocused();

    await page.keyboard.press('ArrowRight'); // déplace + sélectionne l'option suivante (radio natif)
    await expect(group.getByRole('radio', { name: 'M' })).toBeChecked();
  });

  test('AXE : aucune violation serious/critical sur la page choice', async ({ page }) => {
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map((v) => v.id)).toEqual([]);
  });
});
