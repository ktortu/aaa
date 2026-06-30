import AxeBuilder from '@axe-core/playwright';
import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';

function example(page: Page, label: string): Locator {
  return page.locator('kt-doc-example').filter({ hasText: label });
}

test.describe('Disclosure (famille ktDisclosure)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/disclosure');
    await expect(page.locator('[ktDisclosure]').first()).toBeVisible();
  });

  test('ouvre/ferme au clic et reflète aria-expanded + inert', async ({ page }) => {
    const ex = example(page, 'Voir plus');
    const toggle = ex.locator('[ktDisclosureToggle]').first();
    const panel = ex.locator('kt-disclosure-content').first();

    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(panel).toHaveAttribute('inert', '');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).not.toHaveAttribute('inert', /.*/);

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(panel).toHaveAttribute('inert', '');
  });

  test('aria-controls pointe sur l’id du panneau', async ({ page }) => {
    const ex = example(page, 'Voir plus');
    const toggle = ex.locator('[ktDisclosureToggle]').first();
    const panel = ex.locator('kt-disclosure-content').first();
    const id = (await panel.getAttribute('id')) ?? '';
    expect(id).toMatch(/^kt-disclosure-content-/);
    await expect(toggle).toHaveAttribute('aria-controls', id);
  });

  test('basculable au clavier (Entrée)', async ({ page }) => {
    const toggle = example(page, 'Voir plus').locator('[ktDisclosureToggle]').first();
    await toggle.focus();
    await expect(toggle).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  test('contenu replié = inert : les contrôles internes ne sont pas focusables', async ({ page }) => {
    // L'exemple « Options avancées » est contrôlé et replié par défaut.
    const ex = example(page, 'Options avancées');
    const panel = ex.locator('kt-disclosure-content').first();
    const control = panel.locator('input[type="checkbox"]').first();

    await expect(panel).toHaveAttribute('inert', '');
    // inert bloque réellement le focus (ce que jsdom ne sait pas simuler).
    const focusedWhileInert = await control.evaluate((el) => {
      (el as HTMLElement).focus();
      return document.activeElement === el;
    });
    expect(focusedWhileInert).toBe(false);

    await ex.locator('[ktDisclosureToggle]').first().click();
    await expect(panel).not.toHaveAttribute('inert', /.*/);
    const focusedAfter = await control.evaluate((el) => {
      (el as HTMLElement).focus();
      return document.activeElement === el;
    });
    expect(focusedAfter).toBe(true);
  });

  test('cible tactile du déclencheur ≥ 44px (WCAG 2.5.5)', async ({ page }) => {
    const toggle = example(page, 'Voir plus').locator('[ktDisclosureToggle]').first();
    const box = await toggle.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });

  test('AXE : aucune violation serious/critical sur la page disclosure', async ({ page }) => {
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map((v) => v.id)).toEqual([]);
  });
});
