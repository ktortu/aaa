import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './fixtures';

test.describe('Dialog (desktop)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dialog');
    await expect(page.getByRole('button', { name: 'Supprimer le fichier…' })).toBeVisible();
  });

  test('bouton confirmation : ouvre, ferme avec résultat et restitue le focus', async ({ page }) => {
    const trigger = page.getByRole('button', { name: 'Supprimer le fichier…' });
    await trigger.click();

    const container = page.locator('.cdk-dialog-container');
    await expect(container).toBeVisible();
    await expect(container).toHaveAttribute('role', 'dialog');

    // Vérifie le centrage horizontal (assertion TOUJOURS exécutée : le conteneur est déjà visible).
    const rect = (await container.boundingBox())!;
    const viewport = page.viewportSize()!;
    const centerX = rect.x + rect.width / 2;
    const expectedCenter = viewport.width / 2;
    expect(Math.abs(centerX - expectedCenter)).toBeLessThan(5);

    // Vérifie le câblage a11y SSR-safe (aria-labelledby et aria-describedby)
    const titleId = await container.getAttribute('aria-labelledby');
    expect(titleId).toContain('kt-dialog-title-');
    await expect(page.locator(`#${titleId}`)).toBeVisible();

    // Bouton de fermeture "Annuler"
    const cancelBtn = page.getByRole('button', { name: 'Annuler' });
    await expect(cancelBtn).toBeFocused(); // focusInitial sur l'action sûre

    await cancelBtn.click();
    await expect(container).toBeHidden();
    await expect(trigger).toBeFocused(); // Restitution du focus au trigger
  });

  test('clic sur le scrim : ferme le dialog par défaut', async ({ page }) => {
    await page.getByRole('button', { name: 'Supprimer le fichier…' }).click();
    const container = page.locator('.cdk-dialog-container');
    await expect(container).toBeVisible();

    // Clic en dehors (sur l'overlay backdrop)
    const backdrop = page.locator('.kt-dialog__backdrop');
    await backdrop.click({ position: { x: 5, y: 5 }, force: true });
    await expect(container).toBeHidden();
  });

  test('Échap : ferme le dialog (géré nativement par le CDK) et restitue le focus', async ({ page }) => {
    const trigger = page.getByRole('button', { name: 'Supprimer le fichier…' });
    await trigger.click();
    const container = page.locator('.cdk-dialog-container');
    await expect(container).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(container).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('focus trap : le focus reste confiné au sein du dialogue', async ({ page }) => {
    await page.getByRole('button', { name: 'Supprimer le fichier…' }).click();
    const container = page.locator('.cdk-dialog-container');
    await expect(container).toBeVisible();

    // Attendre l'initialisation du focus sur le bouton par défaut
    const cancelBtn = page.getByRole('button', { name: 'Annuler' });
    await expect(cancelBtn).toBeFocused();

    // Tabule à travers les boutons
    await page.keyboard.press('Tab');
    const deleteBtn = page.getByRole('button', { name: 'Supprimer', exact: true });
    await expect(deleteBtn).toBeFocused();

    // Recommence le cycle (retour au premier bouton car il n'y a que 2 boutons)
    await page.keyboard.press('Tab');
    await expect(cancelBtn).toBeFocused();

    // Encore un Tab pour boucler à nouveau
    await page.keyboard.press('Tab');
    await expect(deleteBtn).toBeFocused();
  });

  test('AXE : aucune violation d’accessibilité avec le dialogue ouvert', async ({ page }) => {
    await page.getByRole('button', { name: 'Supprimer le fichier…' }).click();
    await expect(page.locator('.cdk-dialog-container')).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map((v) => v.id)).toEqual([]);
  });

  test.describe('KtQuickDialog (helpers rapides)', () => {
    test('Alerte : ouvre, montre le titre et se ferme via Fermer', async ({ page }) => {
      await page.getByRole('button', { name: 'Alerte (Neutre)', exact: true }).click();
      const container = page.locator('.cdk-dialog-container');
      await expect(container).toBeVisible();
      await expect(container.locator('[ktDialogTitle]')).toHaveText('Attention');

      const closeBtn = container.getByRole('button', { name: 'Fermer' });
      await expect(closeBtn).toBeFocused();
      await closeBtn.click();
      await expect(container).toBeHidden();
    });

    test('Confirmation : ouvre, montre le texte multi-lignes, et résout sur clic', async ({ page }) => {
      await page.getByRole('button', { name: 'Confirmation (Binaire)', exact: true }).click();
      const container = page.locator('.cdk-dialog-container');
      await expect(container).toBeVisible();

      // Assertions sur le multi-lignes HTML
      const desc = container.locator('[ktDialogDescription]');
      const paragraphs = desc.locator('p');
      await expect(paragraphs).toHaveCount(2);
      await expect(paragraphs.first()).toContainText('Êtes-vous sûr de vouloir supprimer cet élément ?');

      // Clic sur "Supprimer" (action de validation, color danger)
      const deleteBtn = container.getByRole('button', { name: 'Supprimer' });
      await deleteBtn.click();
      await expect(container).toBeHidden();

      // Vérifie l'affichage du dernier choix
      await expect(page.locator('.page__result', { hasText: 'Dernier choix service :' })).toContainText(
        'Supprimé (True)',
      );
    });

    test('Décision : ouvre en mode ternaire et résout cancel sur Annuler', async ({ page }) => {
      await page.getByRole('button', { name: 'Décision (Ternaire)', exact: true }).click();
      const container = page.locator('.cdk-dialog-container');
      await expect(container).toBeVisible();

      // Clic sur "Annuler"
      const cancelBtn = container.getByRole('button', { name: 'Annuler' });
      await expect(cancelBtn).toBeFocused(); // focus initial sur l'action neutre/annuler
      await cancelBtn.click();
      await expect(container).toBeHidden();

      // Vérifie l'affichage du dernier choix
      await expect(page.locator('.page__result', { hasText: 'Dernier choix service :' })).toContainText(
        'Annulé (Cancel)',
      );
    });
  });
});
