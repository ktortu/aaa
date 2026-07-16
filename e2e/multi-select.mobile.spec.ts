import AxeBuilder from '@axe-core/playwright';
import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { settleSheetOpen, touchDragFrom } from './sheet-gestures';

/** Carte « Base (options simples) » : kt-multi-select sur `tags` (8 options, présélection Angular + Signals). */
function baseCard(page: Page): Locator {
  return page.locator('kt-doc-example').filter({ hasText: 'Base (options simples)' }).locator('kt-multi-select');
}

/** Attend la fin des animations (entrée sheet, fondu scrim) avant AXE : évite l'échantillonnage mi-transition. */
async function settleAnimations(page: Page): Promise<void> {
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined))));
}

/**
 * Violations serious/critical hors `scrollable-region-focusable` : la zone scrollable des options de
 * la sheet déclenche cette règle, mais le listbox `@angular/aria` est pilotable au clavier (flèches) —
 * WCAG 2.1.1 satisfait. Faux-positif axe connu pour aria-activedescendant (suivi : investigation lib).
 */
async function seriousAxe(page: Page): Promise<string[]> {
  const results = await new AxeBuilder({ page }).disableRules(['scrollable-region-focusable']).analyze();
  return results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id);
}

test.describe('Multi-Select mobile (bottom-sheet)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/multi-select');
    await expect(page.locator('kt-multi-select').first()).toBeVisible();
  });

  test('s’ouvre en bottom-sheet : bas d’écran, plein largeur, en-tête + scroll-lock', async ({ page }) => {
    await baseCard(page).locator('.kt-select__trigger').tap();

    const popup = baseCard(page).locator('.kt-select__popup');
    await expect(popup).toBeVisible();
    await expect(popup.locator('.kt-select__sheet-header')).toBeVisible();
    await expect(popup.locator('.kt-select__option')).toHaveCount(8);

    const vp = page.viewportSize()!;
    const box = (await popup.boundingBox())!;
    expect(box.width).toBeGreaterThan(vp.width - 2); // plein largeur
    expect(box.y + box.height).toBeGreaterThan(vp.height - 2); // collé en bas
    await expect(page.locator('body')).toHaveCSS('overflow', 'hidden'); // fond verrouillé
  });

  test('tap sur une option : toggle SANS fermer la sheet (différence clé vs single)', async ({ page }) => {
    const card = baseCard(page);
    await card.locator('.kt-select__trigger').tap();
    const popup = card.locator('.kt-select__popup');
    await settleSheetOpen(popup); // toute interaction intra-sheet attend le repos du snap
    const cdk = popup.locator('.kt-select__option').filter({ hasText: 'CDK' }); // non présélectionné

    await cdk.tap();
    await expect(popup).toBeVisible(); // la sheet RESTE ouverte
    await expect(cdk).toHaveAttribute('aria-selected', 'true');
    // Roving (mobile) : l'option activée est réellement focusable.
    await expect(cdk).toHaveAttribute('tabindex', '0');

    await cdk.tap();
    await expect(cdk).toHaveAttribute('aria-selected', 'false');
    await expect(popup).toBeVisible();
  });

  test('le bouton Fermer referme la sheet et lève le scroll-lock', async ({ page }) => {
    const card = baseCard(page);
    await card.locator('.kt-select__trigger').tap();
    await expect(card.locator('.kt-select__popup')).toBeVisible();
    await settleSheetOpen(card.locator('.kt-select__popup'));

    await card.locator('.kt-select__sheet-close').tap();
    await expect(card.locator('.kt-select__popup')).toBeHidden();
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  });

  /** Drag tactile depuis l'EN-TÊTE : la poignée est décorative, la sheet s'attrape partout
      (ADR-0005 — le geste est le scroll natif du popup, cf. select.mobile.spec.ts). */
  async function dragSheet(card: Locator, dy: number, pauseMs: number): Promise<void> {
    await settleSheetOpen(card.locator('.kt-select__popup'));
    await touchDragFrom(card.locator('.kt-select__sheet-header'), dy, { steps: 16, stepMs: 20, pauseMs });
  }

  test('drag vers le bas (au-delà de la moitié) ferme la sheet, sélection intacte', async ({ page }) => {
    const card = baseCard(page);
    await card.locator('.kt-select__trigger').tap();
    const popup = card.locator('.kt-select__popup');
    await expect(popup).toBeVisible();
    await settleSheetOpen(popup);

    const sheetCard = (await popup.locator('.kt-select__sheet-card').boundingBox())!;
    await dragSheet(card, Math.round(sheetCard.height * 0.6), 400);
    await expect(popup).toBeHidden();
    await expect(card.locator('.kt-chip')).toHaveCount(2); // présélection conservée (Angular, Signals)
  });

  test('petit drag relâché immobile : re-snap, la sheet reste ouverte', async ({ page }) => {
    const card = baseCard(page);
    await card.locator('.kt-select__trigger').tap();
    const popup = card.locator('.kt-select__popup');
    await expect(popup).toBeVisible();

    await dragSheet(card, 24, 300);
    await expect(popup).toBeVisible();
    await settleSheetOpen(popup); // re-snap en position ouverte
  });

  test('AXE : aucune violation serious/critical, sheet multi ouverte', async ({ page }) => {
    await baseCard(page).locator('.kt-select__trigger').tap();
    await expect(baseCard(page).locator('.kt-select__popup')).toBeVisible();
    await settleAnimations(page);

    expect(await seriousAxe(page)).toEqual([]);
  });

  test('scroller à snap : entrée par glissement jusqu’au snap ouvert, scrim bloquant (pointer-events: auto)', async ({
    page,
  }) => {
    const card = baseCard(page);
    await card.locator('.kt-select__trigger').tap();

    const popup = card.locator('.kt-select__popup');
    await expect(popup).toBeVisible();

    // L'entrée est un scroll programmatique vers le snap « ouvert » (ADR-0005, plus de keyframe).
    await settleSheetOpen(popup);
    const snapType = await popup.evaluate((el) => window.getComputedStyle(el).scrollSnapType);
    expect(snapType).toContain('mandatory');

    const scrim = popup.locator('.kt-select__sheet-scrim');
    const pointerEvents = await scrim.evaluate((el) => window.getComputedStyle(el).pointerEvents);
    expect(pointerEvents).toBe('auto');
  });
});
