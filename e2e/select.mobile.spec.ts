import AxeBuilder from '@axe-core/playwright';
import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { settleSheetOpen, touchDragFrom } from './sheet-gestures';

/** Localise l'exemple `kt-doc-example` par le texte de son libellé. */
function example(page: Page, label: string): Locator {
  return page.locator('kt-doc-example').filter({ hasText: label });
}

/** Attend la fin des animations en cours (entrée de la sheet, fondu du scrim) : sinon AXE peut
    échantillonner des couleurs/opacités mi-transition → faux positifs de contraste. Déterministe. */
async function settleAnimations(page: Page): Promise<void> {
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined))));
}

/**
 * Violations serious/critical, hors `scrollable-region-focusable`.
 * La zone scrollable des options de la sheet déclenche cette règle, mais le listbox `@angular/aria`
 * est pilotable au clavier (flèches + scrollIntoView, cf. base-select.ts) : WCAG 2.1.1 EST satisfait.
 * C'est un faux-positif connu d'axe pour le pattern aria-activedescendant (suivi : investigation lib
 * d'un tabindex sur le conteneur scrollable). Toutes les autres règles restent actives.
 */
async function seriousAxe(page: Page): Promise<string[]> {
  const results = await new AxeBuilder({ page }).disableRules(['scrollable-region-focusable']).analyze();
  return results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id);
}

/** Trigger du select de base « Pays » (string[], 5 options). */
function paysTrigger(page: Page): Locator {
  return example(page, 'Base (options simples)').locator('.kt-select__trigger');
}

test.describe('Select mobile (bottom-sheet)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/select');
    await expect(page.locator('kt-select').first()).toBeVisible();
  });

  test('s’ouvre en bottom-sheet : bas d’écran, plein largeur, en-tête + scroll-lock', async ({ page }) => {
    await paysTrigger(page).tap();

    const popup = page.locator('.kt-select__popup');
    await expect(popup).toBeVisible();
    await expect(page.locator('.kt-select__sheet-header')).toBeVisible(); // en-tête (titre + Fermer)
    await expect(popup.locator('.kt-select__option')).toHaveCount(5);

    const vp = page.viewportSize()!;
    const box = (await popup.boundingBox())!;
    expect(box.width).toBeGreaterThan(vp.width - 2); // plein largeur
    expect(box.y + box.height).toBeGreaterThan(vp.height - 2); // collé en bas
    await expect(page.locator('body')).toHaveCSS('overflow', 'hidden'); // fond verrouillé
  });

  test('tap sur une option : met à jour la valeur, ferme et lève le scroll-lock', async ({ page }) => {
    await paysTrigger(page).tap();
    const popup = page.locator('.kt-select__popup');
    await settleSheetOpen(popup); // toute interaction intra-sheet attend le repos du snap (sinon
    // l'auto-scroll de Playwright combat le scroll-snap et peut re-snapper la sheet fermée)
    await popup.getByText('Belgique', { exact: true }).tap();

    await expect(popup).toBeHidden();
    await expect(paysTrigger(page)).toContainText('Belgique');
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  });

  test('le bouton Fermer referme la sheet', async ({ page }) => {
    await paysTrigger(page).tap();
    await expect(page.locator('.kt-select__popup')).toBeVisible();
    await settleSheetOpen(page.locator('.kt-select__popup'));

    await page.locator('.kt-select__sheet-close').tap();
    await expect(page.locator('.kt-select__popup')).toBeHidden();
  });

  test('AXE : aucune violation serious/critical, sheet ouverte', async ({ page }) => {
    await paysTrigger(page).tap();
    await expect(page.locator('.kt-select__popup')).toBeVisible();
    await settleAnimations(page);

    expect(await seriousAxe(page)).toEqual([]);
  });

  /** Drag tactile depuis l'EN-TÊTE : la poignée est décorative, la sheet s'attrape partout
      (ADR-0005 — le geste est le scroll natif du popup, snap fermé/ouvert). */
  async function dragSheet(page: Page, dy: number, pauseMs: number): Promise<void> {
    const popup = page.locator('.kt-select__popup');
    await settleSheetOpen(popup); // fin du scroll d'entrée : géométrie stable
    await touchDragFrom(page.locator('.kt-select__sheet-header'), dy, { steps: 16, stepMs: 20, pauseMs });
  }

  test('drag vers le bas (au-delà de la moitié) ferme la sheet — depuis l’en-tête, pas la poignée', async ({
    page,
  }) => {
    await paysTrigger(page).tap();
    const popup = page.locator('.kt-select__popup');
    await expect(popup).toBeVisible();
    await settleSheetOpen(popup);

    const card = (await popup.locator('.kt-select__sheet-card').boundingBox())!;
    await dragSheet(page, Math.round(card.height * 0.6), 400);
    await expect(popup).toBeHidden();
  });

  test('petit drag relâché immobile : re-snap, la sheet reste ouverte', async ({ page }) => {
    await paysTrigger(page).tap();
    const popup = page.locator('.kt-select__popup');
    await expect(popup).toBeVisible();

    await dragSheet(page, 24, 300);
    await expect(popup).toBeVisible();
    await settleSheetOpen(popup); // re-snap en position ouverte
  });

  test.describe('filtrable', () => {
    /** L'exemple filtrable « Ville » (cities, 12 options). */
    function villeTrigger(page: Page): Locator {
      return example(page, 'Filtrable (liste longue)').locator('.kt-select__trigger');
    }

    test('sheet : champ de filtre sous l’en-tête, SANS focus auto (clavier virtuel)', async ({ page }) => {
      await villeTrigger(page).tap();
      const input = page.locator('.kt-select__filter-input');
      await expect(input).toBeVisible();
      await expect(input).not.toBeFocused(); // pas d'autofocus sur tactile

      // Le champ est rendu sous l'en-tête de la sheet. Attendre la fin réelle du scroll d'entrée :
      // deux boundingBox mesurés pendant le glissement peuvent être incohérents entre eux.
      await settleSheetOpen(page.locator('.kt-select__popup'));
      const headerBox = (await page.locator('.kt-select__sheet-header').boundingBox())!;
      const inputBox = (await input.boundingBox())!;
      expect(inputBox.y).toBeGreaterThanOrEqual(headerBox.y + headerBox.height - 1);
    });

    test('tap sur le champ puis saisie : filtre la liste sans fermer la sheet', async ({ page }) => {
      await villeTrigger(page).tap();
      await settleSheetOpen(page.locator('.kt-select__popup'));
      const input = page.locator('.kt-select__filter-input');
      await input.tap(); // le focus passe au champ : la sheet doit rester ouverte
      await expect(page.locator('.kt-select__popup')).toBeVisible();

      await page.keyboard.type('ren');
      await expect(page.locator('.kt-select__option')).toHaveCount(2); // Rennes, Grenoble

      await page.locator('.kt-select__option').first().tap();
      await expect(page.locator('.kt-select__popup')).toBeHidden();
      await expect(villeTrigger(page)).toContainText(/Rennes|Grenoble/);
    });

    test('drag vers le bas ferme la sheet, champ de filtre présent', async ({ page }) => {
      await villeTrigger(page).tap();
      await expect(page.locator('.kt-select__filter-input')).toBeVisible();
      const popup = page.locator('.kt-select__popup');
      await settleSheetOpen(popup);

      const card = (await popup.locator('.kt-select__sheet-card').boundingBox())!;
      await dragSheet(page, Math.round(card.height * 0.6), 400);
      await expect(popup).toBeHidden();
    });

    test('AXE : aucune violation serious/critical, sheet filtrable ouverte', async ({ page }) => {
      await villeTrigger(page).tap();
      await expect(page.locator('.kt-select__filter-input')).toBeVisible();
      await settleAnimations(page);

      expect(await seriousAxe(page)).toEqual([]);
    });
  });

  test('scroller à snap : entrée par glissement jusqu’au snap ouvert, scrim bloquant (pointer-events: auto)', async ({
    page,
  }) => {
    await paysTrigger(page).tap();

    const popup = page.locator('.kt-select__popup');
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
