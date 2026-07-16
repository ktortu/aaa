import { expect, test } from './fixtures';
import { settleSheetOpen, touchDragFrom } from './sheet-gestures';

test.describe('Dialog (mobile)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dialog');
    await expect(page.getByRole('button', { name: 'Centré → bottom-sheet' })).toBeVisible();
  });

  /** Ouvre le dialog « centered-sheet » (résolu en bottom-sheet sur mobile) et attend le
      repos au snap « ouvert » (fin du scroll d'entrée — ADR-0005). */
  async function openSheet(page: import('@playwright/test').Page) {
    await page.getByRole('button', { name: 'Centré → bottom-sheet' }).click();
    const container = page.locator('.cdk-dialog-container');
    await expect(container).toBeVisible();
    await settleSheetOpen(container);
    return container;
  }

  test('ouvre en bottom-sheet : scroller à snap, poignée décorative AUTO-RENDUE', async ({ page }) => {
    const container = await openSheet(page);
    await expect(page.locator('.cdk-overlay-pane')).toHaveClass(/kt-dialog--sheet/);

    // Le conteneur est le scroller à snap (ADR-0005).
    const snapType = await container.evaluate((el) => window.getComputedStyle(el).scrollSnapType);
    expect(snapType).toContain('mandatory');

    // Poignée auto-rendue par le conteneur (plus rien à poser dans le template du dialog),
    // purement décorative : aria-hidden, ni cursor grab ni touch-action.
    const handle = container.locator('.kt-dialog-container__sheet-handle');
    await expect(handle).toBeVisible();
    await expect(handle).toHaveAttribute('aria-hidden', 'true');
    expect(await handle.evaluate((el) => window.getComputedStyle(el).cursor)).toBe('auto');
  });

  test('drag tactile depuis l’EN-TÊTE ferme la sheet (elle s’attrape partout)', async ({ page }) => {
    const container = await openSheet(page);
    const card = (await container.locator('.kt-dialog-container__layout').boundingBox())!;

    await touchDragFrom(container.locator('[ktDialogHeader]'), Math.round(card.height * 0.6), {
      steps: 16,
      stepMs: 20,
      pauseMs: 400,
    });
    await expect(container).toBeHidden();
  });

  test('petit drag relâché immobile : re-snap, la sheet reste ouverte', async ({ page }) => {
    const container = await openSheet(page);

    await touchDragFrom(container.locator('[ktDialogHeader]'), 20, { pauseMs: 300 });
    await expect(container).toBeVisible();
    await settleSheetOpen(container); // re-snap en position ouverte
  });

  test('arbitrage natif : contenu scrollé → le drag re-scrolle le contenu, la sheet reste', async ({ page }) => {
    const container = await openSheet(page);
    const content = container.locator('[ktDialogContent]');
    // Précondition : le contenu de la démo déborde volontairement (zone scrollable réelle).
    expect(await content.evaluate((el) => el.scrollHeight - el.clientHeight)).toBeGreaterThan(30);

    // Doigt vers le haut : descendre DANS le contenu (le scroller interne consomme).
    await touchDragFrom(content, -120, { pauseMs: 200 });
    await expect.poll(() => content.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);

    // Doigt vers le bas : le contenu re-scrolle vers le haut, la sheet ne bouge pas.
    const before = await content.evaluate((el) => el.scrollTop);
    await touchDragFrom(content, 80, { pauseMs: 200 });
    await expect.poll(() => content.evaluate((el) => el.scrollTop)).toBeLessThan(before);
    await expect(container).toBeVisible();
    await settleSheetOpen(container); // toujours au snap « ouvert »
  });

  test('Échap ferme (sortie par glissement programmatique)', async ({ page }) => {
    const container = await openSheet(page);
    await page.keyboard.press('Escape');
    await expect(container).toBeHidden();
  });

  test('tap au-dessus de la carte : le clic traverse le scroller et ferme via le backdrop CDK', async ({ page }) => {
    const container = await openSheet(page);
    // Le conteneur plein écran est pointer-events:none hors de la carte : le tap atteint le
    // VRAI backdrop (sémantique CDK intacte : fermeture, backdropClick, disableClose).
    await page.touchscreen.tap(page.viewportSize()!.width / 2, 60);
    await expect(container).toBeHidden();
  });
});
