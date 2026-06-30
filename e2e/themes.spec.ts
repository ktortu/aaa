import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

/** Change le thème via le switcher du shell (un kt-select de la lib — dogfooding). */
async function switchTheme(page: Page, label: string): Promise<void> {
  await page.locator('kt-select').filter({ hasText: 'Thème' }).locator('.kt-select__trigger').click();
  await page.locator('.kt-select__popup').getByText(label, { exact: true }).click();
}

/**
 * Échoue si AXE remonte une violation serious/critical (même barre que smoke.spec).
 * Fige d'abord transitions et animations : sans ça, AXE peut échantillonner les couleurs
 * PENDANT la transition de thème (état intermédiaire sous contraste) → faux positifs flaky.
 * `transition:none` snap immédiatement à la valeur finale ; déterministe, sans sleep.
 */
async function expectAxeClean(page: Page, context: string): Promise<void> {
  await page.addStyleTag({
    content: '*, *::before, *::after { transition: none !important; animation: none !important; }',
  });
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious.map((v) => `${context}: ${v.id}`)).toEqual([]);
}

const THEMES = [
  { id: 'material', label: 'Material 3' },
  { id: 'material-you', label: 'Material You (seed)' },
  { id: 'primer', label: 'GitHub Primer' },
  { id: 'carbon', label: 'IBM Carbon' },
  { id: 'fluent', label: 'Fluent 2' },
  { id: 'ant', label: 'Ant Design' },
  { id: 'bootstrap', label: 'Bootstrap 5' },
  { id: 'catppuccin', label: 'Catppuccin (dark)' },
  { id: 'architecte', label: 'Architecte (dark)' },
  { id: 'vegetal', label: 'Végétal' },
  { id: 'cyberpunk', label: 'Cyberpunk (animé)' },
  { id: 'aurora', label: 'Aurora (ombres)' },
] as const;

test('le switch pose data-theme sur <html> et le retire pour le thème défaut', async ({ page }) => {
  await page.goto('/buttons');
  const html = page.locator('html');
  await expect(html).not.toHaveAttribute('data-theme');

  for (const theme of THEMES) {
    await switchTheme(page, theme.label);
    await expect(html).toHaveAttribute('data-theme', theme.id);
  }

  await switchTheme(page, 'Défaut');
  await expect(html).not.toHaveAttribute('data-theme');
});

test('chaque thème change réellement le rendu (fond du bouton filled primary)', async ({ page }) => {
  await page.goto('/buttons');
  const filled = page.locator('[data-mode="filled"][data-color="primary"]').first();
  const bgOf = () => filled.evaluate((el) => getComputedStyle(el).backgroundColor);

  const seen = new Set<string>([await bgOf()]);
  for (const theme of THEMES) {
    await switchTheme(page, theme.label);
    // L'effect pose data-theme après le clic : attendre l'attribut avant de lire le style.
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme.id);
    seen.add(await bgOf());
  }
  // Tous les thèmes (défaut inclus) => autant de fonds distincts, sinon un thème ne s'applique pas.
  expect(seen.size).toBe(THEMES.length + 1);
});

test('le thème cyberpunk anime réellement les tokens : l’ombre du bouton orbite', async ({ page }) => {
  await page.goto('/buttons');
  await switchTheme(page, 'Cyberpunk (animé)');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'cyberpunk');

  const filled = page.locator('[data-mode="filled"][data-color="primary"]').first();
  const shadowOf = () => filled.evaluate((el) => getComputedStyle(el).boxShadow);

  const before = await shadowOf();
  expect(before).not.toBe('none');
  // On attend que l'ombre change RÉELLEMENT (orbite), au lieu de parier sur une fenêtre de 400 ms.
  await expect.poll(shadowOf, { timeout: 2000 }).not.toBe(before);
});

for (const theme of THEMES) {
  test(`AXE passe sur les 3 démos en thème ${theme.id}`, async ({ page }) => {
    // 4 analyses AXE pleine page en série (buttons → forms → select → multi-select) : légitimement
    // lourd, surtout sous firefox (AXE y est nettement plus lent) sur la page multi-select (longues
    // tables d'API). Le défaut de 30 s est trop serré et provoquait un flake où l'horloge tombait
    // pendant le dernier scan. test.slow() triple le budget (→ 90 s) sans masquer un vrai hang.
    test.slow();

    // Le thème vit en mémoire (pas de persistance) : on navigue ensuite via la nav
    // du shell (routing client) pour le conserver, jamais via page.goto().
    await page.goto('/buttons');
    await switchTheme(page, theme.label);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme.id);
    await expectAxeClean(page, `${theme.id}/buttons`);

    await page.getByRole('link', { name: 'Formulaires' }).click();
    await expect(page).toHaveURL(/\/forms$/);
    await expectAxeClean(page, `${theme.id}/forms`);

    await page.getByRole('link', { name: 'Select', exact: true }).click();
    await expect(page).toHaveURL(/\/select$/);
    await expectAxeClean(page, `${theme.id}/select`);

    await page.getByRole('link', { name: 'Multi-Select' }).click();
    await expect(page).toHaveURL(/\/multi-select$/);
    await expectAxeClean(page, `${theme.id}/multi-select`);
  });
}
