import { expect, test } from './fixtures';

test.describe('Snackbar mobile', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/snackbar');
    await expect(page.getByRole('button', { name: /Message simple/ })).toBeVisible();
  });

  test('s’ancre en bas de l’écran, centrée et dans la largeur du viewport', async ({ page }) => {
    await page.getByRole('button', { name: /Message simple/ }).tap();

    const snackbar = page.locator('.cdk-overlay-container .kt-snackbar');
    await expect(snackbar).toBeVisible();

    const vp = page.viewportSize()!;
    const box = (await snackbar.boundingBox())!;

    // Collée en bas (offset bas + safe-area, env() = 0 en headless).
    expect(box.y + box.height).toBeGreaterThan(vp.height - 40);
    // Tient dans le viewport et reste centrée horizontalement.
    expect(box.width).toBeLessThanOrEqual(vp.width);
    const centerX = box.x + box.width / 2;
    expect(Math.abs(centerX - vp.width / 2)).toBeLessThan(4);
  });
});
