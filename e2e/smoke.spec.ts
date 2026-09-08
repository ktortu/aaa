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
  await expect(page.locator('.kt-icon[data-icon]').first()).toBeVisible();

  await page.getByRole('link', { name: 'Select', exact: true }).click();
  await expect(page).toHaveURL(/\/select$/);
  await expect(page.locator('kt-select').first()).toBeVisible();

  await page.getByRole('link', { name: 'Formulaires' }).click();
  await expect(page).toHaveURL(/\/forms$/);
});

test('forms : l’attribut id statique n’est présent que sur l’input, label.control lié et focus au clic', async ({
  page,
}) => {
  await page.goto('/forms');

  // 1. Éléments portant id="login-email" dans le DOM (doit contenir UNIQUEMENT l'input, pas kt-text-field)
  const elementsWithId = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('#login-email')).map((el) => el.tagName.toLowerCase());
  });
  expect(elementsWithId).toEqual(['input']);

  // 2. document.getElementById('login-email') résout vers l'input
  const getByIdTag = await page.evaluate(() => {
    return document.getElementById('login-email')?.tagName.toLowerCase();
  });
  expect(getByIdTag).toBe('input');

  // 3. label.control pointe vers l'input
  const labelControlTag = await page.evaluate(() => {
    const label = document.querySelector('label[for="login-email"]') as HTMLLabelElement;
    return label?.control?.tagName.toLowerCase();
  });
  expect(labelControlTag).toBe('input');

  // 4. input.labels.length === 1
  const inputLabelsLength = await page.evaluate(() => {
    const input = document.getElementById('login-email') as HTMLInputElement;
    return input?.labels?.length;
  });
  expect(inputLabelsLength).toBe(1);

  // 5. Le sélecteur #login-email cible uniquement l'input (pas de violation strict mode)
  const textbox = page.locator('#login-email');
  await expect(textbox).toBeVisible();
  await expect(textbox).toHaveAccessibleName('E-mail');

  // 6. Focus après clic sur le libellé
  await page.locator('label[for="login-email"]').click();
  await expect(textbox).toBeFocused();
});
