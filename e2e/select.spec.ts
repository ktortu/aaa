import AxeBuilder from '@axe-core/playwright';
import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';

/** Localise l'exemple `kt-doc-example` par le texte de son libellé. */
function example(page: Page, label: string): Locator {
  return page.locator('kt-doc-example').filter({ hasText: label });
}

test.describe('Select (single)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/select');
    await expect(page.locator('kt-select').first()).toBeVisible();
  });

  test('le popup s’ouvre ancré sous le trigger et à la même largeur (options courtes)', async ({ page }) => {
    const trigger = example(page, 'Base (options simples)').locator('.kt-select__trigger');
    const tb = (await trigger.boundingBox())!;

    await trigger.click();
    const popup = page.locator('.kt-select__popup');
    await expect(popup).toBeVisible();
    await expect(popup.locator('.kt-select__option')).toHaveCount(5); // countries

    const pb = (await popup.boundingBox())!;
    const isBelow = pb.y >= tb.y + tb.height - 2;
    const isAbove = pb.y + pb.height <= tb.y + 2;
    expect(isBelow || isAbove).toBe(true);
    expect(Math.abs(pb.x - tb.x)).toBeLessThan(2); // aligné à gauche
    expect(Math.abs(pb.width - tb.width)).toBeLessThan(2); // largeur = trigger (pas de dépassement)
  });

  test('clic sur une option : met à jour la valeur affichée et ferme', async ({ page }) => {
    const trigger = example(page, 'Base (options simples)').locator('.kt-select__trigger');
    await trigger.click();
    const popup = page.locator('.kt-select__popup');
    await popup.getByText('Belgique', { exact: true }).click();

    await expect(popup).toBeHidden();
    await expect(trigger).toContainText('Belgique');
  });

  test('clavier : ↓ ouvre, ↓ + Entrée sélectionne et ferme', async ({ page }) => {
    const trigger = example(page, 'Base (options simples)').locator('.kt-select__trigger');
    await trigger.focus();
    await page.keyboard.press('ArrowDown');

    const popup = page.locator('.kt-select__popup');
    await expect(popup).toBeVisible();

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await expect(popup).toBeHidden();
    await expect(trigger).toContainText(/France|Belgique|Suisse|Canada|Luxembourg/);
  });

  test('Échap ferme le popup sans changer la valeur', async ({ page }) => {
    const trigger = example(page, 'Base (options simples)').locator('.kt-select__trigger');
    const valueOf = () => trigger.locator('.kt-select__value').textContent();
    const before = ((await valueOf()) ?? '').trim();

    await trigger.click();
    const popup = page.locator('.kt-select__popup');
    await expect(popup).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(popup).toBeHidden();
    expect(((await valueOf()) ?? '').trim()).toBe(before); // valeur inchangée
  });

  test('AXE : aucune violation serious/critical avec le popup ouvert', async ({ page }) => {
    await example(page, 'Base (options simples)').locator('.kt-select__trigger').click();
    await expect(page.locator('.kt-select__popup')).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map((v) => v.id)).toEqual([]);
  });

  test('clearable : la croix vide la sélection et rend le focus au trigger', async ({ page }) => {
    const card = example(page, 'Effaçable (clearable)'); // présélection : 'France'
    const trigger = card.locator('.kt-select__trigger');
    await expect(trigger).toContainText('France');

    const clear = card.getByRole('button', { name: 'Effacer' }); // provideKtDefaultFR
    await expect(clear).toBeVisible();
    await clear.click();

    await expect(trigger).not.toContainText('France');
    await expect(trigger).toBeFocused();
    await expect(clear).toBeHidden(); // plus rien à effacer
  });
});

test.describe('Select filtrable (desktop)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/select');
    await expect(page.locator('kt-select').first()).toBeVisible();
  });

  /** L'exemple filtrable « Ville » (cities, 12 options). */
  function filterSelect(page: Page): Locator {
    return example(page, 'Filtrable (liste longue)');
  }

  test('ouverture : le champ de filtre prend le focus ; la saisie filtre (insensible à la casse)', async ({ page }) => {
    await filterSelect(page).locator('.kt-select__trigger').click();
    const input = page.locator('.kt-select__filter-input');
    await expect(input).toBeVisible();
    await expect(input).toBeFocused(); // autofocus à l'ouverture (desktop)

    await page.keyboard.type('REN'); // majuscules → insensible à la casse
    const options = page.locator('.kt-select__option');
    await expect(options).toHaveCount(2); // Rennes, Grenoble
    await expect(page.locator('.kt-select__popup [role="status"]')).toHaveText('2 résultats');
  });

  test('clavier depuis le champ : ↓ + Entrée sélectionne, ferme et rend le focus au trigger', async ({ page }) => {
    const trigger = filterSelect(page).locator('.kt-select__trigger');
    await trigger.click();
    await expect(page.locator('.kt-select__filter-input')).toBeFocused();
    await page.keyboard.type('ren');
    await expect(page.locator('.kt-select__option')).toHaveCount(2);

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await expect(page.locator('.kt-select__popup')).toBeHidden();
    await expect(trigger).toContainText(/Rennes|Grenoble/);
    await expect(trigger).toBeFocused(); // focus rendu au trigger
  });

  test('aucun résultat : ligne « Aucun résultat » visible et annoncée (0 résultat)', async ({ page }) => {
    await filterSelect(page).locator('.kt-select__trigger').click();
    await expect(page.locator('.kt-select__filter-input')).toBeFocused();
    await page.keyboard.type('zzz');

    await expect(page.locator('.kt-select__option')).toHaveCount(0);
    await expect(page.locator('.kt-select__empty')).toHaveText('Aucun résultat');
    await expect(page.locator('.kt-select__popup [role="status"]')).toHaveText('0 résultat');
  });

  test('Échap ferme sans changer la valeur ; à la réouverture le filtre est réinitialisé', async ({ page }) => {
    const trigger = filterSelect(page).locator('.kt-select__trigger');
    const valueOf = () => trigger.locator('.kt-select__value').textContent();
    const before = ((await valueOf()) ?? '').trim();

    await trigger.click();
    await expect(page.locator('.kt-select__filter-input')).toBeFocused();
    await page.keyboard.type('ren');
    await expect(page.locator('.kt-select__option')).toHaveCount(2);

    await page.keyboard.press('Escape');
    await expect(page.locator('.kt-select__popup')).toBeHidden();
    expect(((await valueOf()) ?? '').trim()).toBe(before); // valeur inchangée
    await expect(trigger).toBeFocused();

    await trigger.click();
    await expect(page.locator('.kt-select__filter-input')).toHaveValue('');
    await expect(page.locator('.kt-select__option')).toHaveCount(12); // liste complète (cities)
  });

  test('Tab depuis le champ : ferme le popup et continue vers l’élément suivant (APG)', async ({ page }) => {
    const trigger = filterSelect(page).locator('.kt-select__trigger');
    await trigger.click();
    await expect(page.locator('.kt-select__filter-input')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('.kt-select__popup')).toBeHidden();
    await expect(trigger).not.toBeFocused();
    const activeTag = await page.evaluate(() => document.activeElement?.tagName ?? 'BODY');
    expect(activeTag).not.toBe('BODY'); // le focus a bien continué vers un élément de la page
  });

  test('AXE : aucune violation serious/critical (filtre saisi, puis état 0 résultat)', async ({ page }) => {
    await filterSelect(page).locator('.kt-select__trigger').click();
    await expect(page.locator('.kt-select__filter-input')).toBeFocused();
    await page.keyboard.type('ren');
    await expect(page.locator('.kt-select__option')).toHaveCount(2);

    let results = await new AxeBuilder({ page }).analyze();
    let serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map((v) => v.id)).toEqual([]);

    await page.keyboard.type('zzz'); // état « aucun résultat »
    await expect(page.locator('.kt-select__option')).toHaveCount(0);

    results = await new AxeBuilder({ page }).analyze();
    serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map((v) => v.id)).toEqual([]);
  });
});

test.describe('Select — filtrage avancé', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/select');
    await expect(page.locator('kt-select').first()).toBeVisible();
  });

  test('filtre insensible aux accents : « cote » trouve « Côte-d’Or » et « Côtes-d’Armor »', async ({ page }) => {
    await example(page, 'Filtre insensible aux accents').locator('.kt-select__trigger').click();
    await expect(page.locator('.kt-select__filter-input')).toBeFocused();

    await page.keyboard.type('cote'); // sans accent ni majuscule
    await expect(page.locator('.kt-select__option')).toHaveCount(2); // Côte-d'Or, Côtes-d'Armor
    await expect(page.locator('.kt-select__popup [role="status"]')).toHaveText('2 résultats');
  });

  test('grande liste : troncature à 10 options + message « Affichage des 10… sur 150 »', async ({ page }) => {
    await example(page, 'Grande liste tronquée').locator('.kt-select__trigger').click();
    const popup = page.locator('.kt-select__popup');
    await expect(popup).toBeVisible();

    await expect(popup.locator('li.kt-select__option')).toHaveCount(10); // limité par maxVisibleOptions
    await expect(popup.locator('.kt-select__truncated-info')).toContainText(
      'Affichage des 10 premiers résultats sur 150',
    );
  });

  test('libellé très long : déclencheur ellipsé, popup plafonné à max-inline-size', async ({ page }) => {
    const select = example(page, 'Libellé très long');
    const value = select.locator('.kt-select__value');
    const ellipsized = await value.evaluate((el) => el.scrollWidth > el.clientWidth + 1);
    expect(ellipsized).toBe(true);

    await select.locator('.kt-select__trigger').click();
    const popup = page.locator('.kt-select__popup');
    await expect(popup).toBeVisible();
    const pb = (await popup.boundingBox())!;
    expect(pb.width).toBeLessThanOrEqual(449); // 28rem = 448px (+1 tolérance)
  });
});
