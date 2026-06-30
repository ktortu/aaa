import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './fixtures';

test.describe('Tabs Component E2E & Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Réinitialiser le thème pour éviter les conflits de contraste
    await page.evaluate(() => localStorage.clear());
    await page.goto('/tabs');
    await expect(page.locator('h1', { hasText: 'Tabs (Angular ARIA)' })).toBeVisible();
  });

  test('AAA compliance check', async ({ page }) => {
    // Attendre la fin réelle des fondus (opacité intermédiaire → faux négatifs de contraste AXE). Déterministe.
    await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined))));
    const results = await new AxeBuilder({ page }).withTags(['wcag2aaa', 'wcag21aaa', 'wcag22aaa']).analyze();
    expect(results.violations).toEqual([]);
  });

  test('Tab switching and panel visibility', async ({ page }) => {
    // Le premier ngTabList de la page = exemple de base ; ses panneaux sont les premiers du DOM.
    const tab2 = page.locator('[ngTabList]').first().locator('[ngTab]').nth(1);
    const panel2 = page.locator('[ngTabPanel]').nth(1);

    await expect(panel2).toBeHidden();
    await tab2.click();
    await expect(panel2).toBeVisible();
    await expect(panel2).toContainText('Contenu chargé paresseusement');
  });

  test('Pagination par chevrons : désactivés aux extrémités, scrollent', async ({ page }) => {
    // Scroll instantané (pas d'animation) → déterministe sous charge parallèle, sans sleep.
    await page.emulateMedia({ reducedMotion: 'reduce' });

    const scroller = page.locator('.demo-overflow kt-tab-scroller').first();
    const list = scroller.locator('[ngTabList]');
    const startBtn = scroller.getByRole('button', { name: 'Onglets précédents' });
    const endBtn = scroller.getByRole('button', { name: 'Onglets suivants' });
    await expect(list).toBeVisible();

    // Ramener au début via le chevron « précédent » : retry clic+assert (le désactivé est posé
    // de façon asynchrone par le listener de scroll), tolérance sous-pixel.
    await expect(async () => {
      if (await startBtn.isEnabled()) await startBtn.click();
      expect(await list.evaluate((el) => el.scrollLeft)).toBeLessThanOrEqual(1);
    }).toPass();
    await expect(startBtn).toBeDisabled();
    await expect(endBtn).toBeEnabled();

    // Le chevron « suivant » défile vers la droite.
    await endBtn.click();
    await expect.poll(() => list.evaluate((el) => el.scrollLeft)).toBeGreaterThan(1);
  });

  test('Les chevrons restent hors de la tablist (roving tabindex intact)', async ({ page }) => {
    const tablist = page.locator('.demo-overflow kt-tab-scroller [role="tablist"]').first();
    await expect(tablist).toBeVisible();
    await expect(tablist.locator('button')).toHaveCount(0);
  });

  test('Respecte prefers-reduced-motion (scroll-behavior auto)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/tabs');
    const list = page.locator('.demo-overflow kt-tab-scroller [ngTabList]').first();
    await expect(list).toBeVisible();
    const behavior = await list.evaluate((el) => getComputedStyle(el).scrollBehavior);
    expect(behavior).toBe('auto');
  });

  test('Horizontal overflow scroll on mount and selection change', async ({ page }) => {
    const scroller = page.locator('.demo-overflow kt-tab-scroller').first();
    const list = scroller.locator('[ngTabList]');
    await expect(list).toBeVisible();

    // Onglet 12 sélectionné au montage → amené dans la vue (scroll-into-view, animé).
    await expect.poll(() => list.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
    const scrollLeftInitial = await list.evaluate((el) => el.scrollLeft);

    const tab1 = scroller.locator('[ngTab]').first();
    await tab1.click();
    // On attend l'état stable du défilement (retour à gauche), pas une durée arbitraire.
    await expect.poll(() => list.evaluate((el) => el.scrollLeft)).toBe(0);
    expect(await list.evaluate((el) => el.scrollLeft)).toBeLessThan(scrollLeftInitial);
  });

  test('Vertical overflow scroll on mount and selection change', async ({ page }) => {
    const list = page.locator('.demo-vertical kt-tab-scroller [ngTabList]');
    await expect(list).toBeVisible();

    await expect.poll(() => list.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
    const scrollTopInitial = await list.evaluate((el) => el.scrollTop);

    const tab1 = page.locator('.demo-vertical [ngTab]').first();
    await tab1.click();
    // On attend l'état stable (retour en haut), pas une durée arbitraire.
    await expect.poll(() => list.evaluate((el) => el.scrollTop)).toBe(0);
    expect(await list.evaluate((el) => el.scrollTop)).toBeLessThan(scrollTopInitial);
  });
});
