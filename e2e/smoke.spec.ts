import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './fixtures';

const routes = ['/buttons', '/forms', '/select', '/multi-select', '/chips', '/dialog', '/foundations/icons'];

for (const route of routes) {
  test(`la route ${route} se charge (rendu + 0 erreur console + AXE)`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator('kt-root')).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map((v) => v.id)).toEqual([]);
  });
}

test('la nav route vers chaque démo', async ({ page }) => {
  await page.goto('/buttons');
  await page.getByRole('link', { name: 'Select', exact: true }).click();
  await expect(page).toHaveURL(/\/select$/);
  await expect(page.locator('kt-select').first()).toBeVisible();

  await page.getByRole('link', { name: 'Formulaires' }).click();
  await expect(page).toHaveURL(/\/forms$/);
});
