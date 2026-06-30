import { expect, test } from './fixtures';

test.describe('Dialog (mobile)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dialog');
    await expect(page.getByRole('button', { name: 'Centré → bottom-sheet' })).toBeVisible();
  });

  test('ouvre en bottom-sheet, fermable par drag-to-dismiss tactile', async ({ page }) => {
    // Le bouton "Lire les CGU" ouvre un dialogue "centered-sheet", résolu en bottom-sheet sur mobile
    const trigger = page.getByRole('button', { name: 'Centré → bottom-sheet' });
    await trigger.click();

    const container = page.locator('.cdk-dialog-container');
    await expect(container).toBeVisible();
    await expect(page.locator('.cdk-overlay-pane')).toHaveClass(/kt-dialog--sheet/);

    const handle = container.locator('[ktDialogSheetHandle]');
    await expect(handle).toBeVisible();

    // Attend la fin réelle de l'animation d'entrée (kt-sheet-in, portée par le conteneur) : sinon
    // boundingBox() échantillonne une position encore en translation → point de drag erroné. Déterministe.
    await container.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished.catch(() => undefined))));

    // Vérifie que la zone interactive fait bien 44px de haut (WCAG 2.5.5 AAA target size)
    const box = (await handle.boundingBox())!;
    expect(box.height).toBe(44);

    // Effectue le drag-to-dismiss tactile vers le bas (au-delà du seuil de 25% de la hauteur)
    const sheetHeight = (await container.boundingBox())!.height;
    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX, startY + sheetHeight * 0.4, { steps: 5 });
    await page.mouse.up();

    await expect(container).toBeHidden();
  });

  test('petit drag tactile ne ferme pas (snap-back)', async ({ page }) => {
    await page.getByRole('button', { name: 'Centré → bottom-sheet' }).click();
    const container = page.locator('.cdk-dialog-container');
    await expect(container).toBeVisible();

    const handle = container.locator('[ktDialogSheetHandle]');
    // Attend la fin réelle de l'animation d'entrée avant de mesurer la poignée (cf. test ci-dessus).
    await container.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished.catch(() => undefined))));
    const box = (await handle.boundingBox())!;
    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX, startY + 20, { steps: 5 }); // drag de 20px (inférieur au seuil)
    await page.mouse.up();

    await expect(container).toBeVisible(); // Reste ouvert
  });

  test('joue l’animation d’entrée (keyframe kt-sheet-in) à l’ouverture de la sheet', async ({ page }) => {
    await page.getByRole('button', { name: 'Centré → bottom-sheet' }).click();
    const container = page.locator('.cdk-dialog-container');
    await expect(container).toBeVisible();

    const animationName = await container.evaluate((el) => window.getComputedStyle(el).animationName);
    expect(animationName).toContain('kt-sheet-in');
  });
});
