import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './fixtures';

const AAA_TAGS = ['wcag2aaa', 'wcag21aaa', 'wcag22aaa'];

test.describe('WCAG AAA Accessibility Audit', () => {
  test('Select Page - AAA compliance check (closed and open states)', async ({ page }) => {
    await page.goto('/select');
    await expect(page.locator('kt-select').first()).toBeVisible();

    // 1. Closed state AAA audit
    let results = await new AxeBuilder({ page }).withTags(AAA_TAGS).analyze();
    expect(results.violations).toEqual([]);

    // 2. Open state AAA audit (select de base « Pays »)
    await page
      .locator('kt-doc-example')
      .filter({ hasText: 'Base (options simples)' })
      .locator('.kt-select__trigger')
      .click();
    await expect(page.locator('.kt-select__popup')).toBeVisible();

    results = await new AxeBuilder({ page }).withTags(AAA_TAGS).analyze();
    expect(results.violations).toEqual([]);

    // 3. Open filtrable select state AAA audit (« Ville »)
    await page.keyboard.press('Escape'); // close popup
    await expect(page.locator('.kt-select__popup')).toBeHidden();

    await page
      .locator('kt-doc-example')
      .filter({ hasText: 'Filtrable (liste longue)' })
      .locator('.kt-select__trigger')
      .click();
    await expect(page.locator('.kt-select__filter-input')).toBeFocused();

    results = await new AxeBuilder({ page }).withTags(AAA_TAGS).analyze();
    expect(results.violations).toEqual([]);
  });

  test('Multi-Select Page - AAA compliance check (closed and open states)', async ({ page }) => {
    await page.goto('/multi-select');
    await expect(page.locator('kt-multi-select').first()).toBeVisible();

    // 1. Closed state AAA audit
    let results = await new AxeBuilder({ page }).withTags(AAA_TAGS).analyze();
    expect(results.violations).toEqual([]);

    // 2. Open state AAA audit (multi-select de base « Compétences »)
    await page
      .locator('kt-doc-example')
      .filter({ hasText: 'Base (options simples)' })
      .locator('.kt-select__trigger')
      .click();
    const popup = page.locator('.kt-select__popup');
    await expect(popup).toBeVisible();

    results = await new AxeBuilder({ page }).withTags(AAA_TAGS).analyze();
    expect(results.violations).toEqual([]);
  });
});
