import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './fixtures';

/** La démo est en français (provideKtDefaultFR) → le bouton de fermeture est intitulé « Fermer ». */
test.describe('Snackbar (desktop)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/snackbar');
    await expect(page.getByRole('button', { name: /Message simple/ })).toBeVisible();
  });

  test('ouvre, annonce via le LiveAnnouncer et NE déplace PAS le focus', async ({ page }) => {
    const trigger = page.getByRole('button', { name: /Message simple/ });
    // Focus explicite + activation clavier : robuste tous navigateurs (≠ focus-au-clic).
    await trigger.focus();
    await trigger.press('Enter');

    const snackbar = page.locator('.cdk-overlay-container .kt-snackbar');
    await expect(snackbar).toBeVisible();
    await expect(snackbar.locator('.kt-snackbar__message')).toHaveText('Brouillon enregistré');

    // Le focus reste sur le déclencheur (RGAA « message de statut » / WCAG 4.1.3).
    await expect(trigger).toBeFocused();

    // Canal d'annonce UNIQUE : le panneau n'est PAS une live region…
    expect(await snackbar.getAttribute('role')).toBeNull();
    expect(await snackbar.getAttribute('aria-live')).toBeNull();
    // …c'est l'élément du LiveAnnouncer qui porte l'annonce.
    await expect(page.locator('.cdk-live-announcer-element')).toContainText('Brouillon enregistré');
  });

  test('bouton de fermeture nommé (FR) et le clic ferme', async ({ page }) => {
    await page.getByRole('button', { name: /Message simple/ }).click();

    const close = page.locator('.kt-snackbar__close');
    await expect(close).toHaveAttribute('aria-label', 'Fermer');

    await close.click();
    await expect(page.locator('.kt-snackbar')).toBeHidden();
  });

  test('Échap ferme la snackbar affichée', async ({ page }) => {
    await page.getByRole('button', { name: /Persistant/ }).click();
    await expect(page.locator('.kt-snackbar')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('.kt-snackbar')).toBeHidden();
  });

  test('variante : pose data-variant et affiche une icône décorative', async ({ page }) => {
    await page.getByRole('button', { name: 'Success', exact: true }).click();

    const snackbar = page.locator('.kt-snackbar');
    await expect(snackbar).toBeVisible();
    await expect(snackbar).toHaveAttribute('data-variant', 'success');
    const icon = snackbar.locator('.kt-snackbar__icon');
    await expect(icon).toBeVisible();
    await expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  test('file FIFO : empiler plusieurs messages n’en affiche qu’un seul', async ({ page }) => {
    await page.getByRole('button', { name: /Empiler/ }).click();
    await expect(page.locator('.cdk-overlay-container .kt-snackbar')).toHaveCount(1);
  });

  test('AXE : aucune violation sérieuse avec une snackbar ouverte', async ({ page }) => {
    await page.getByRole('button', { name: /Persistant/ }).click();
    await expect(page.locator('.kt-snackbar')).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map((v) => v.id)).toEqual([]);
  });
});
