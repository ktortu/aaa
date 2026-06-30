import AxeBuilder from '@axe-core/playwright';
import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';

/** Localise l'exemple `kt-doc-example` par le texte de son libellé. */
function example(page: Page, label: string): Locator {
  return page.locator('kt-doc-example').filter({ hasText: label });
}

/** Le `kt-multi-select` d'un exemple donné. */
function ms(page: Page, exampleLabel: string): Locator {
  return example(page, exampleLabel).locator('kt-multi-select');
}

/** Un `kt-multi-select` ciblé par son label (utile dans l'exemple « États » qui en contient plusieurs). */
function msByLabel(page: Page, label: string): Locator {
  return page.locator('kt-multi-select').filter({ hasText: label });
}

function triggerOf(card: Locator): Locator {
  return card.locator('.kt-select__trigger');
}

async function seriousViolations(page: Page): Promise<string[]> {
  const results = await new AxeBuilder({ page }).analyze();
  return results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id);
}

test.describe('Multi-Select (desktop)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/multi-select');
    await expect(page.locator('kt-multi-select').first()).toBeVisible();
  });

  test('le popup s’ouvre ancré sous le trigger, listbox multi-sélection', async ({ page }) => {
    const card = ms(page, 'Base (options simples)');
    const trigger = triggerOf(card);
    const tb = (await trigger.boundingBox())!;

    await trigger.click();
    const popup = card.locator('.kt-select__popup');
    await expect(popup).toBeVisible();
    await expect(popup.locator('[role="listbox"]')).toHaveAttribute('aria-multiselectable', 'true');
    await expect(popup.locator('.kt-select__option')).toHaveCount(8); // tags

    const pb = (await popup.boundingBox())!;
    const isBelow = pb.y >= tb.y + tb.height - 2;
    const isAbove = pb.y + pb.height <= tb.y + 2;
    expect(isBelow || isAbove).toBe(true);
    expect(Math.abs(pb.x - tb.x)).toBeLessThan(2); // aligné à gauche
  });

  test('clic : sélections multiples SANS fermeture, chips mis à jour', async ({ page }) => {
    const card = ms(page, 'Base (options simples)'); // présélection : Angular, Signals
    const trigger = triggerOf(card);
    await expect(card.locator('.kt-chip')).toHaveCount(2);

    await trigger.click();
    const popup = card.locator('.kt-select__popup');

    await popup.getByText('TypeScript', { exact: true }).click();
    await expect(popup).toBeVisible(); // le popup RESTE ouvert (multi)
    await popup.getByText('RxJS', { exact: true }).click();
    await expect(popup).toBeVisible();

    await expect(card.locator('.kt-chip')).toHaveCount(4);
  });

  test('clavier : Espace toggle l’option active sans re-cliquer le trigger ni fermer', async ({ page }) => {
    const card = msByLabel(page, 'Requis'); // multi-select vide (aucune présélection)
    const trigger = triggerOf(card);
    await trigger.focus();
    await page.keyboard.press('ArrowDown'); // ouvre
    const popup = card.locator('.kt-select__popup');
    await expect(popup).toBeVisible();

    await page.keyboard.press(' ');
    await expect(popup).toBeVisible(); // pas de re-clic du bouton trigger (le relay preventDefault)
    await expect(card.locator('.kt-chip')).toHaveCount(1);

    await page.keyboard.press(' ');
    await expect(card.locator('.kt-chip')).toHaveCount(0);
    await expect(popup).toBeVisible();
  });

  test('clavier : Ctrl+A sélectionne tout, puis désélectionne tout', async ({ page }) => {
    const card = msByLabel(page, 'Requis');
    await triggerOf(card).focus();
    await page.keyboard.press('ArrowDown');
    await expect(card.locator('.kt-select__popup')).toBeVisible();

    await page.keyboard.press('Control+a');
    await expect(card.locator('.kt-chip')).toHaveCount(8); // tous les tags
    await expect(triggerOf(card)).toContainText('8 éléments sélectionnés');

    await page.keyboard.press('Control+a');
    await expect(card.locator('.kt-chip')).toHaveCount(0);
  });

  test('clavier : Shift+↓ étend la sélection en plage', async ({ page }) => {
    const card = msByLabel(page, 'Requis');
    await triggerOf(card).focus();
    await page.keyboard.press('ArrowDown');
    await expect(card.locator('.kt-select__popup')).toBeVisible();

    await page.keyboard.press('Shift+ArrowDown');
    await expect(card.locator('.kt-chip')).toHaveCount(2); // ancre + suivante
  });

  test('chips : la suppression déplace le focus au chip suivant, puis au trigger, et annonce', async ({ page }) => {
    const card = ms(page, 'Base (options simples)'); // présélection : Angular, Signals
    await expect(card.locator('.kt-chip')).toHaveCount(2);

    await card.getByRole('button', { name: 'Retirer Angular' }).click();
    await expect(card.locator('.kt-chip')).toHaveCount(1);
    await expect(card.locator('.kt-chip-list__status')).toHaveText('Angular retiré');
    await expect(card.getByRole('button', { name: 'Retirer Signals' })).toBeFocused();

    await page.keyboard.press('Enter'); // suppression au clavier du dernier chip
    await expect(card.locator('.kt-chip')).toHaveCount(0);
    await expect(triggerOf(card)).toBeFocused(); // repli sur le trigger
    await expect(card.locator('.kt-chip-list__status')).toHaveText('Signals retiré');
  });

  test('filtre : les sélections masquées sont conservées et fusionnées', async ({ page }) => {
    const card = ms(page, 'Filtre + actions de masse + repli des chips'); // présélection : 4 tags
    await triggerOf(card).click();
    const input = card.locator('.kt-select__filter-input');
    await expect(input).toBeFocused();

    // Filtre sur une option NON sélectionnée → masque les 4 sélectionnées.
    await page.keyboard.type('material');
    await expect(card.locator('.kt-select__option')).toHaveCount(1);

    // Sélectionne « Material » : si les 4 masquées sont conservées, le total passe à 5.
    await card.locator('.kt-select__option').getByText('Material', { exact: true }).click();
    await expect(card.locator('.kt-select__count')).toHaveText('5 sélectionnés');
  });

  test('Tab depuis le filtre : ferme et continue vers l’élément suivant (un seul Tab)', async ({ page }) => {
    const card = ms(page, 'Filtre + actions de masse + repli des chips');
    await triggerOf(card).click();
    await expect(card.locator('.kt-select__filter-input')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(card.locator('.kt-select__popup')).toBeHidden();
    await expect(triggerOf(card)).not.toBeFocused();
    const activeTag = await page.evaluate(() => document.activeElement?.tagName ?? 'BODY');
    expect(activeTag).not.toBe('BODY');
  });

  test('actions de masse : Tout sélectionner/Tout effacer, bornées au filtre actif', async ({ page }) => {
    const card = ms(page, 'Filtre + actions de masse + repli des chips'); // présélection : 4
    await triggerOf(card).click();
    await expect(card.locator('.kt-select__filter-input')).toBeFocused();

    await card.getByRole('button', { name: 'Tout sélectionner' }).click();
    await expect(triggerOf(card)).toContainText('8 éléments sélectionnés');

    await card.locator('.kt-select__filter-input').click(); // le focus était sur le bouton cliqué
    await page.keyboard.type('material'); // borne les actions aux options filtrées
    await expect(card.locator('.kt-select__option')).toHaveCount(1);
    await card.getByRole('button', { name: 'Tout effacer' }).click();
    await expect(triggerOf(card)).toContainText('7 éléments sélectionnés'); // seule « Material » décochée
  });

  test('clearable : la croix vide la sélection et rend le focus au trigger', async ({ page }) => {
    const card = ms(page, 'Effacement rapide (clearable)'); // présélection : CSS
    await expect(card.locator('.kt-chip')).toHaveCount(1);
    const clear = card.getByRole('button', { name: 'Effacer' });
    await expect(clear).toBeVisible();

    await clear.click();
    await expect(card.locator('.kt-chip')).toHaveCount(0);
    await expect(triggerOf(card)).toBeFocused();
    await expect(clear).toBeHidden(); // plus rien à effacer
  });

  test('chips repliés : « +N de plus » déplie avec focus sur le premier chip révélé', async ({ page }) => {
    const card = ms(page, 'Filtre + actions de masse + repli des chips'); // 4 sélectionnés, maxVisibleChips=2
    await expect(card.locator('.kt-chip__label')).toHaveCount(2);
    const more = card.locator('.kt-chip-list__more');
    await expect(more).toHaveText('+2 de plus');
    await expect(more).toHaveAttribute('aria-expanded', 'false');

    await more.click();
    await expect(card.locator('.kt-chip__label')).toHaveCount(4);
    await expect(more).toHaveText('Afficher moins');
    await expect(card.locator('.kt-chip__remove').nth(2)).toBeFocused(); // 3e chip = 1er révélé

    await more.click();
    await expect(card.locator('.kt-chip__label')).toHaveCount(2);
  });

  test('Échap ferme sans perdre la sélection et rend le focus au trigger', async ({ page }) => {
    const card = ms(page, 'Base (options simples)'); // présélection : Angular, Signals
    await triggerOf(card).click();
    const popup = card.locator('.kt-select__popup');
    await popup.getByText('CDK', { exact: true }).click(); // ajoute un 3e

    await page.keyboard.press('Escape');
    await expect(popup).toBeHidden();
    await expect(card.locator('.kt-chip')).toHaveCount(3);
    await expect(triggerOf(card)).toBeFocused();
  });

  test('AXE : aucune violation serious/critical (popup ouvert + chips présents)', async ({ page }) => {
    const card = ms(page, 'Base (options simples)'); // chips présélectionnés
    await triggerOf(card).click();
    await expect(card.locator('.kt-select__popup')).toBeVisible();

    expect(await seriousViolations(page)).toEqual([]);
  });

  test('AXE : panneau actions + filtre, puis état 0 résultat', async ({ page }) => {
    const card = ms(page, 'Filtre + actions de masse + repli des chips');
    await triggerOf(card).click();
    await expect(card.locator('.kt-select__filter-input')).toBeFocused();

    expect(await seriousViolations(page)).toEqual([]);

    await page.keyboard.type('zzz');
    await expect(card.locator('.kt-select__option')).toHaveCount(0);

    expect(await seriousViolations(page)).toEqual([]);
  });
});
