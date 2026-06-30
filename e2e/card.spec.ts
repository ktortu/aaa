import AxeBuilder from '@axe-core/playwright';
import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';

function example(page: Page, label: string): Locator {
  return page.locator('kt-doc-example').filter({ hasText: label });
}

test.describe('Card (directive ktCard)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/card');
    await expect(page.locator('[ktCard]').first()).toBeVisible();
  });

  test('variantes : data-variant reflété sur l’élément sémantique', async ({ page }) => {
    const grid = example(page, 'Variantes');
    await expect(grid.locator('[ktCard]').nth(0)).toHaveAttribute('data-variant', 'elevated');
    await expect(grid.locator('[ktCard]').nth(1)).toHaveAttribute('data-variant', 'outlined');
    await expect(grid.locator('[ktCard]').nth(2)).toHaveAttribute('data-variant', 'filled');
    // la directive est posée sur un <article> sémantique, pas un wrapper imposé
    await expect(grid.locator('article[ktCard]').first()).toBeVisible();
  });

  test('interactive : lien étiré présent, nommé par le titre, navigable', async ({ page }) => {
    const card = example(page, 'Interactive (lien étiré)').locator('[ktCard]').first();
    await expect(card).toHaveAttribute('data-interactive');

    const link = card.locator('[ktCardLink]');
    await expect(link).toHaveAttribute('aria-labelledby', 'card-demo-t1');
    await link.focus();
    await expect(link).toBeFocused(); // le focus clavier passe par le lien primaire
  });

  test('disabled : carte inerte, lien hors tabulation et aria-disabled', async ({ page }) => {
    const card = example(page, 'État inerte (disabled)').locator('[ktCard]').first();
    await expect(card).toHaveAttribute('data-disabled');

    const link = card.locator('[ktCardLink]');
    await expect(link).toHaveAttribute('aria-disabled', 'true');
    await expect(link).toHaveAttribute('tabindex', '-1'); // sorti de l'ordre de tabulation
  });

  test('AXE : aucune violation serious/critical sur la page card', async ({ page }) => {
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map((v) => v.id)).toEqual([]);
  });
});
