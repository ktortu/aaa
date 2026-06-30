import AxeBuilder from '@axe-core/playwright';
import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';

function example(page: Page, label: string): Locator {
  return page.locator('kt-doc-example').filter({ hasText: label });
}

test.describe('Tooltip (directive ktTooltip)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tooltip');
    await expect(page.getByRole('button', { name: 'Sans délai' })).toBeVisible();
  });

  test('survol : révèle l’infobulle et câble aria-describedby sur la cible', async ({ page }) => {
    const trigger = page.getByRole('button', { name: 'Sans délai' });
    await trigger.hover();

    const tip = page.getByRole('tooltip');
    await expect(tip).toBeVisible();
    await expect(tip).toHaveText('Apparition immédiate');
    await expect(trigger).toHaveAttribute('aria-describedby', /kt-tooltip/);

    // En quittant la cible, l'infobulle disparaît (et aria-describedby est retiré).
    await page.mouse.move(0, 0);
    await expect(tip).toBeHidden();
  });

  test('focus clavier : révèle l’infobulle, Échap la ferme', async ({ page }) => {
    const trigger = page.getByRole('button', { name: 'Sans délai' });
    await trigger.focus();
    await expect(page.getByRole('tooltip')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('tooltip')).toBeHidden();
  });

  test('contenu riche (TemplateRef) : rendu dans l’infobulle', async ({ page }) => {
    await example(page, 'Contenu riche').getByRole('button', { name: 'Règles du mot de passe' }).hover();
    const tip = page.getByRole('tooltip');
    await expect(tip).toBeVisible();
    await expect(tip).toContainText('8 caractères minimum');
  });

  test('désactivé : aucune infobulle au survol', async ({ page }) => {
    await page.getByRole('button', { name: 'Tooltip désactivé' }).hover();
    await expect(page.getByRole('tooltip')).toHaveCount(0);
  });

  test('AXE : aucune violation serious/critical avec une infobulle ouverte', async ({ page }) => {
    await page.getByRole('button', { name: 'Sans délai' }).hover();
    await expect(page.getByRole('tooltip')).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map((v) => v.id)).toEqual([]);
  });
});
