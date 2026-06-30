import AxeBuilder from '@axe-core/playwright';
import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';

/** Localise l'exemple `kt-doc-example` par le texte de son libellé. */
function example(page: Page, label: string): Locator {
  return page.locator('kt-doc-example').filter({ hasText: label });
}

test.describe('Button (directive ktButton)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/buttons');
    await expect(page.getByRole('button', { name: 'Filled' })).toBeVisible();
  });

  test('modes et couleurs : attributs data-* reflétés sur le DOM', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Filled' })).toHaveAttribute('data-mode', 'filled');
    await expect(page.getByRole('button', { name: 'Outlined' })).toHaveAttribute('data-mode', 'outlined');
    const danger = example(page, 'Couleurs').getByRole('button', { name: 'Danger' }).first();
    await expect(danger).toHaveAttribute('data-color', 'danger');
  });

  test('loading : aria-busy, inerte au clic', async ({ page }) => {
    const btn = page.getByRole('button', { name: 'Chargement' });
    await expect(btn).toHaveAttribute('aria-busy', 'true');
    await expect(btn).toBeDisabled(); // le natif est désactivé pendant le chargement
  });

  test('iconOnly : nom accessible fourni par ariaLabel', async ({ page }) => {
    const like = page.getByRole('button', { name: 'Aimer' });
    await expect(like).toBeVisible();
    await expect(like).toHaveAttribute('data-icon-only'); // attribut présent (booléen)
    // aucun texte visible, le nom vient de aria-label
    await expect(like).toHaveText('');
  });

  test('disabled vs disabledInteractive : focusabilité', async ({ page }) => {
    const plainDisabled = page.getByRole('button', { name: 'Désactivé', exact: true });
    await expect(plainDisabled).toBeDisabled(); // hors de l'ordre de tabulation (natif)

    const interactive = page.getByRole('button', { name: 'Désactivé (focalisable)' });
    await expect(interactive).toHaveAttribute('aria-disabled', 'true');
    await interactive.focus();
    await expect(interactive).toBeFocused(); // focalisable malgré l'état désactivé (AAA : découvrable)
  });

  test('lien stylé : rôle link, focalisable, navigable au clavier', async ({ page }) => {
    const link = page.getByRole('link', { name: 'Lien stylé en bouton' });
    await expect(link).toHaveAttribute('data-mode', 'outlined');
    await link.focus();
    await expect(link).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#buttons$/); // la navigation native fonctionne
  });

  test('AXE : aucune violation serious/critical sur la page boutons', async ({ page }) => {
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map((v) => v.id)).toEqual([]);
  });
});
