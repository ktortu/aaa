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

  test('tap au-dessus de la carte (spacer) ferme la sheet', async ({ page }) => {
    const container = await openSheet(page);
    // Le scroller capte le tactile (pointer-events auto, requis pour le drag iOS — cf. test
    // dédié plus bas) : le tap n'atteint plus le backdrop CDK par transparence, la fermeture au
    // tap-extérieur est portée par le spacer ((click) → onScrimClick, disableClose respecté).
    await page.touchscreen.tap(page.viewportSize()!.width / 2, 40);
    await expect(container).toBeHidden();
  });

  test('régression iOS : le scroller capte le tactile (pointer-events auto) et verrouille le fond', async ({
    page,
  }) => {
    // Garde-fou du bug « la sheet ne se ferme pas au drag sur iPhone » : un scroller en
    // pointer-events:none n'était PAS défilable au doigt sur iOS → le geste fuyait vers la page
    // (pull-to-refresh) au lieu de fermer la sheet. Le fond doit aussi être verrouillé.
    const container = await openSheet(page);
    expect(await container.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe('auto');
    expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).toBe('hidden');

    await page.keyboard.press('Escape');
    await expect(container).toBeHidden();
    // Verrou relâché à la fermeture (compteur équilibré).
    expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).not.toBe('hidden');
  });

  test('drag tactile ferme une sheet à CONTENU COURT (alert) — cas du sélecteur de thème', async ({ page }) => {
    // Reproduit le bug remonté : les sheets à contenu court (alertes, sélecteur de thème) n'ont
    // aucun scroller interne pour absorber le geste — c'est là que la fuite tactile iOS se voyait.
    await page.getByRole('button', { name: 'Alerte (Neutre)' }).click();
    const container = page.locator('.cdk-dialog-container');
    await expect(container).toBeVisible();
    await expect(page.locator('.cdk-overlay-pane')).toHaveClass(/kt-dialog--sheet/);
    await settleSheetOpen(container);

    const card = (await container.locator('.kt-dialog-container__layout').boundingBox())!;
    await touchDragFrom(container.locator('.kt-dialog-container__sheet-handle'), Math.round(card.height), {
      steps: 16,
      stepMs: 20,
      pauseMs: 400,
    });
    await expect(container).toBeHidden();
  });
});
